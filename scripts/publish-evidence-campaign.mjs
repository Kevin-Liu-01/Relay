// Publish exact, scanned synthetic evidence in compressed bundles. Never overwrite runs.
import { readFileSync, existsSync, mkdirSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { exportRun, assertSafeEvidence } from '../runner/export.mjs';
import { buildAudit } from '../runner/audit.mjs';
import { campaignSummary } from './lib/campaign-report.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const plan = JSON.parse(readFileSync(join(root, 'docs/campaigns/onsite-2026-10-01.json')));
const destination = join(root, 'evidence/campaigns', plan.id);
mkdirSync(destination, { recursive: true });
const runtime = join(root, '.runtime', plan.id);
const manifest = JSON.parse(readFileSync(join(destination, 'manifest.json')));
const scratch = mkdtempSync(join(tmpdir(), 'relay-publish-campaign-'));
const phases = [],
  archives = [];
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const save = (path, value) => {
  const text = JSON.stringify(value, null, 2) + '\n';
  assertSafeEvidence(text, [process.env.RAMP_ROUTER_API_KEY]);
  writeFileSync(path, text);
};
try {
  for (const entry of manifest.phases) {
    if (!entry.finishedAt) throw Error('Cannot publish an unfinished phase.');
    const archive = join(destination, `${entry.id}.tar.gz`);
    if (!existsSync(archive)) {
      exportRun({
        runRoot: join(runtime, 'runs'),
        id: entry.runId,
        destination: join(scratch, entry.runId),
        secrets: [process.env.RAMP_ROUTER_API_KEY],
      });
      execFileSync('tar', ['-czf', archive, '-C', join(scratch, entry.runId), '.']);
    } else {
      // Only this narrow artifact layout may be extracted, even for local archives.
      const names = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 10e6 })
        .trim()
        .split('\n');
      if (
        names.some(
          (n) => !/^\.\/(?:run\.json|episode-\d{3}\/(?:[a-z0-9-]+\.(?:json|jsonl|png))?)?$/.test(n),
        )
      )
        throw Error('Unexpected archive entry.');
      mkdirSync(join(scratch, entry.runId));
      execFileSync('tar', ['-xzf', archive, '-C', join(scratch, entry.runId)]);
    }
    const phaseRoot = join(scratch, entry.runId);
    const run = JSON.parse(readFileSync(join(phaseRoot, 'run.json')));
    const audit = buildAudit({ runRoot: scratch, id: entry.runId });
    if (audit.integrity.status !== entry.audit.status)
      throw Error('Audit status differs after archive round trip.');
    const traces = Object.fromEntries(
      run.episodes.map((e) => {
        const path = join(phaseRoot, e.cell.episodeId, 'steps.jsonl');
        return [
          e.cell.episodeId,
          existsSync(path)
            ? readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
            : [],
        ];
      }),
    );
    phases.push({ id: entry.id, run, audit, traces });
    const bytes = readFileSync(archive);
    archives.push({
      phase: entry.id,
      path: `${entry.id}.tar.gz`,
      sha256: sha(bytes),
      bytes: bytes.length,
    });
    save(join(destination, `${entry.id}.run.json`), run);
    save(join(destination, `${entry.id}.audit.json`), {
      runId: run.id,
      generatedAt: audit.generatedAt,
      integrity: audit.integrity,
      artifacts: audit.artifacts,
      limits: audit.limits,
    });
  }
  const summary = { ...campaignSummary(plan, phases), archives };
  save(join(destination, 'summary.json'), summary);
  const lines = [
    '# Onsite model evidence',
    '',
    `- ${summary.totals.planned} planned; ${summary.totals.attempted} attempted; ${summary.totals.passed} strict passes; ${summary.totals.incomplete} completed/step-limited incorrect; ${summary.totals.blocked} blocked; ${summary.totals.unattempted} unattempted.`,
    `- ${summary.requests} model requests; $${summary.estimatedUSD.toFixed(6)} estimated; usage ${summary.usageKnown ? 'reported for every request' : 'partly unknown; reservations retained'}.`,
    '- Development examples, not a leaderboard. API outcomes are not computer-use scores. Read the [frozen plan](../../../docs/campaigns/onsite-2026-10-01.md).',
    '- [Machine-readable inventory](summary.json) includes every planned episode and all failures. Each phase has a readable run manifest and audit receipt.',
    '',
    '## Exact trajectories',
    '',
    ...archives.map(
      (a) =>
        `- [${a.phase} bundle](${a.path}) — ${(a.bytes / 1048576).toFixed(2)} MiB; SHA-256: \`${a.sha256}\`.`,
    ),
    '- Each bundle contains original request bodies, response receipts, append-only events, screenshots, initial/final state and terminal checks. Compression preserves the original bytes.',
    '- Extract into a fresh directory. Run `node scripts/inspect-campaign.mjs <phase>` from the repository to verify its hash chains and artifact bindings without an API key.',
    '',
    '## Episode inventory',
    '',
    ...summary.rows.map(
      (r) =>
        `- ${r.phase}/${r.episodeId}: ${r.model} · ${r.interface} · ${r.task} · **${r.outcome}** · ${r.actionAttempts} attempts${r.error ? ` · ${r.status}` : ''}.`,
    ),
    '',
    '## Interpretation limits',
    '',
    ...summary.limitations.map((s) => `- ${s}`),
    '',
  ];
  writeFileSync(join(destination, 'README.md'), lines.join('\n'));
  console.log(
    JSON.stringify({ totals: summary.totals, estimatedUSD: summary.estimatedUSD, archives }),
  );
} finally {
  rmSync(scratch, { recursive: true, force: true });
}
