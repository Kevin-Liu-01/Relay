import { readFileSync, readdirSync, lstatSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { assertSafeEvidence, exportRun } from './export.mjs';

const hash = (value) =>
  createHash('sha256')
    .update(Buffer.isBuffer(value) || typeof value === 'string' ? value : JSON.stringify(value))
    .digest('hex');
const zero = '0'.repeat(64);

// Read-only projection. Never repair, regenerate, or rewrite historical evidence.
export function buildAudit({ runRoot, id, run, secrets = [] }) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw Error('Expected a run UUID.');
  const root = join(runRoot, id),
    files = new Map();
  function scan(path, prefix = '') {
    if (lstatSync(path).isSymbolicLink()) throw Error('Symbolic links are not audit evidence.');
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const name = prefix + entry.name,
        full = join(path, entry.name);
      if (entry.isSymbolicLink()) throw Error('Symbolic links are not audit evidence.');
      if (entry.isDirectory()) {
        scan(full, `${name}/`);
        continue;
      }
      if (!/\.(json|jsonl|png)$/.test(name)) continue;
      const bytes = readFileSync(full);
      if (!name.endsWith('.png')) assertSafeEvidence(bytes.toString('utf8'), secrets);
      files.set(name, bytes);
    }
  }
  scan(root);
  const manifest = run ?? JSON.parse(files.get('run.json').toString('utf8'));
  assertSafeEvidence(JSON.stringify(manifest), secrets);
  const checks = [],
    gaps = [];
  const check = (name, ok, episodeId = null) => checks.push({ name, ok, episodeId });
  check('Configuration hash', hash(manifest.config) === manifest.configHash);
  const episodes = manifest.episodes.map((episode) => {
    const eid = episode.cell.episodeId,
      prefix = `${eid}/`;
    if (!/^episode-\d{3}$/.test(eid)) throw Error('Invalid episode ID.');
    const bytes = files.get(prefix + 'steps.jsonl');
    const trace = [];
    let malformed = false;
    for (const line of bytes?.toString('utf8').split('\n').filter(Boolean) ?? []) {
      try {
        const event = JSON.parse(line);
        if (
          !event ||
          typeof event !== 'object' ||
          Array.isArray(event) ||
          typeof event.kind !== 'string'
        )
          throw Error('Invalid event.');
        trace.push(event);
      } catch {
        malformed = true;
      }
    }
    const started = episode.status !== 'queued';
    const complete = !['queued', 'running', 'interrupted'].includes(episode.status);
    if (started) {
      check('Readable trace records', !!bytes && !malformed, eid);
      let previous = zero;
      let valid = true;
      for (const event of trace) {
        const { hash: claimed, ...body } = event;
        valid &&= event.previousHash === previous && hash(body) === claimed;
        previous = claimed;
      }
      check('Event hash chain', valid && trace.length > 0, eid);
      if (complete) {
        check('Terminal record', trace.at(-1)?.kind === 'terminal', eid);
        check('Episode trace root', !!episode.traceRoot && previous === episode.traceRoot, eid);
      }
      if (!complete) gaps.push(`${eid}: unfinished trace; terminal root is not verified.`);
      if (!trace.every((event) => event.at))
        gaps.push(`${eid}: legacy events have no per-event timestamps.`);
    }
    const inputs = {};
    for (const event of trace) {
      for (const [file, digest] of Object.entries(event.artifacts ?? {})) {
        const artifact = files.get(prefix + file);
        check(`Recorded artifact: ${file}`, !!artifact && hash(artifact) === digest, eid);
      }
      // Legacy pixel inputs already bound their image bytes, even without an artifact map.
      if (event.observation?.imageFile && event.observation?.imageHash) {
        const artifact = files.get(prefix + event.observation.imageFile);
        check(
          `Pixel input: ${event.observation.imageFile}`,
          !!artifact && hash(artifact) === event.observation.imageHash,
          eid,
        );
      }
      if (event.kind === 'input' && event.requestFile) {
        const body = files.get(prefix + event.requestFile);
        if (body) {
          try {
            const input = JSON.parse(body.toString('utf8'));
            inputs[event.requestFile] = input;
            check(
              `Prompt hash: step ${event.step}`,
              (manifest.config.provider === 'typesafe'
                ? hash(input)
                : hash({ instructions: input.instructions, input: input.input })) ===
                event.promptHash,
              eid,
            );
            check(`Request body: step ${event.step}`, hash(input) === event.requestHash, eid);
            const receipt = trace.find(
              (r) => r.kind === 'response' && r.step === event.step,
            )?.response;
            if (receipt?.requestHash)
              check(
                `Transport request: step ${event.step}`,
                receipt.requestHash === event.requestHash,
                eid,
              );
          } catch {
            check(`Readable input: ${event.requestFile}`, false, eid);
          }
        }
      }
    }
    if (started && !trace.some((r) => r.kind === 'input'))
      gaps.push(
        `${eid}: exact request bodies were not recorded; prompt hashes are retained, not reconstructed.`,
      );
    const readJSON = (name) => {
      if (!files.has(prefix + name)) return null;
      try {
        return JSON.parse(files.get(prefix + name).toString('utf8'));
      } catch {
        check(`Readable artifact: ${name}`, false, eid);
        return null;
      }
    };
    const outcome = readJSON('outcome.json'),
      initial = readJSON('initial.json');
    if (started && !initial) gaps.push(`${eid}: initial full-state snapshot not recorded.`);
    if (started && !outcome) gaps.push(`${eid}: final state/evaluation export unavailable.`);
    if (outcome && !trace.some((r) => r.artifacts?.['outcome.json']))
      gaps.push(`${eid}: final-state file was not bound to the original event chain.`);
    const saved = readJSON('episode.json');
    if (complete)
      check('Episode checkpoint matches manifest', !!saved && hash(saved) === hash(episode), eid);
    return { episode, trace, inputs, initial, outcome };
  });
  if (manifest.auditVersion !== 2)
    gaps.push(
      'Legacy capture: no retroactive request bodies, event timestamps, or artifact attestations have been invented.',
    );
  const failed = checks.filter((c) => !c.ok);
  const inProgress = ['queued', 'running'].includes(manifest.status);
  return {
    schema: 'relay-audit-v1',
    generatedAt: new Date().toISOString(),
    run: manifest,
    episodes,
    integrity: {
      status: failed.length
        ? 'failed'
        : inProgress
          ? 'in-progress'
          : gaps.length
            ? 'partial'
            : 'verified',
      checks,
      gaps,
      scope:
        'Local hash consistency only; not independently signed or proof against an operator rewriting the complete bundle.',
    },
    artifacts: [...files].map(([path, bytes]) => ({
      path,
      bytes: bytes.length,
      sha256: hash(bytes),
      href: path.includes('/') ? `/api/runs/${id}/${path}` : null,
    })),
    limits: [
      'Only externally visible model output is recorded. Hidden model reasoning is not available.',
      'Provider error bodies and authentication headers are deliberately excluded.',
      'Estimated cost is not an invoice; unknown usage retains reservations.',
      'Workspace events and model events are separate ordered streams. Legacy timestamps cannot establish exact cross-stream ordering.',
      'Artifact inventory hashes are computed at audit-read time; only recorded artifact bindings attest to original capture.',
    ],
  };
}

export function auditJSONL(audit) {
  const lines = [{ kind: 'run_manifest', run: audit.run }];
  for (const e of audit.episodes) {
    const episodeId = e.episode.cell.episodeId;
    lines.push({ kind: 'episode_manifest', episodeId, episode: e.episode });
    if (e.initial) lines.push({ kind: 'initial_state', episodeId, data: e.initial });
    for (const event of e.trace) lines.push({ kind: 'trace_event', episodeId, event });
    for (const [file, input] of Object.entries(e.inputs))
      lines.push({ kind: 'request_body', episodeId, file, input });
    if (e.outcome) lines.push({ kind: 'outcome', episodeId, data: e.outcome });
  }
  lines.push({
    kind: 'audit_integrity',
    generatedAt: audit.generatedAt,
    integrity: audit.integrity,
    artifacts: audit.artifacts,
    limits: audit.limits,
  });
  return lines.map((line) => JSON.stringify(line)).join('\n') + '\n';
}

export async function auditArchive({ runRoot, id, secrets = [] }) {
  const temp = mkdtempSync(join(tmpdir(), 'relay-audit-'));
  try {
    const destination = join(temp, id);
    exportRun({ runRoot, id, destination, secrets });
    // Validate the copied snapshot so the audit matches exactly what is downloaded.
    const audit = buildAudit({ runRoot: temp, id, secrets });
    writeFileSync(join(destination, 'audit.json'), JSON.stringify(audit, null, 2));
    writeFileSync(join(destination, 'audit.jsonl'), auditJSONL(audit));
    await promisify(execFile)('tar', ['-czf', join(temp, 'audit.tar.gz'), '-C', destination, '.']);
    return readFileSync(join(temp, 'audit.tar.gz'));
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
