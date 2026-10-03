// Public, lossless structured episode projections. Never modify original archives.
import assert from 'node:assert/strict';
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  existsSync,
  renameSync,
} from 'node:fs';
import { join, resolve, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gzipSync, gunzipSync } from 'node:zlib';
import { buildAudit } from '../runner/audit.mjs';
import { assertSafeEvidence } from '../runner/export.mjs';
import { aggregate } from '../runner/design.mjs';
import { trialId, validateCatalog, validateRecord } from '../docs/review-app/data.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const partial = process.argv.includes('--partial');
assert.ok(
  process.argv.slice(2).every((a) => a === '--partial'),
  'Only --partial is supported.',
);
const json = (path) => JSON.parse(readFileSync(join(root, path)));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const secrets = [process.env.RAMP_ROUTER_API_KEY, process.env.TYPESAFE_API_KEY];
const campaign = json('docs/current-comparison.json').campaign;
assert.equal(campaign, 'model-breadth-2026-10-03-continuation');
const summaryBytes = readFileSync(join(root, `evidence/campaigns/${campaign}/summary.json`));
const summary = JSON.parse(summaryBytes),
  summaryHash = sha(summaryBytes);
if (!partial) {
  const verification = json(`evidence/campaigns/${campaign}/verification.json`);
  assert.equal(verification.status, 'complete-verified');
  assert.equal(verification.summaryHash, summaryHash);
  assert.equal(verification.attemptsVerified, 306);
}
const destination = join(root, 'evidence/trial-library');
mkdirSync(destination, { recursive: true });
const prior = existsSync(join(destination, 'catalog.json'))
  ? json('evidence/trial-library/catalog.json')
  : null;
const entries = [];
const recorded = summary.rows.filter((r) => r.outcome !== 'unattempted');
const groups = Map.groupBy(recorded, (r) => `${r.originCampaign}/${r.phase}`);
for (const rows of groups.values()) {
  const first = rows[0];
  assert.ok(
    ['all-tasks-2026-10-03', 'model-breadth-2026-10-03', campaign].includes(first.originCampaign),
  );
  const manifest = json(`evidence/campaigns/${first.originCampaign}/manifest.json`);
  const phase = manifest.phases.find((p) => p.id === first.phase && p.runId === first.runId);
  assert.ok(phase?.archive && /^block-\d{3}$/.test(phase.id));
  assert.equal(phase.archive.path, `${phase.id}.tar.gz`);
  const oldEntries = rows.map((row) => prior?.trials.find((e) => e.id === trialId(row)));
  if (
    oldEntries.every(
      (e, i) =>
        e &&
        e.archiveSha256 === phase.archive.sha256 &&
        JSON.stringify(e.result) === JSON.stringify(rows[i]),
    )
  ) {
    for (const entry of oldEntries) {
      const bytes = readFileSync(join(destination, basename(entry.path)));
      assert.equal(sha(bytes), entry.sha256);
      const text = gunzipSync(bytes, { maxOutputLength: 80e6 }).toString('utf8');
      assertSafeEvidence(text, secrets);
      validateRecord(JSON.parse(text), entry);
      entries.push(entry);
    }
    continue;
  }
  const publicPath = join(root, 'evidence/campaigns', first.originCampaign, phase.archive.path);
  const archive = existsSync(publicPath)
    ? publicPath
    : join(root, '.runtime', first.originCampaign, phase.archive.path);
  const bytes = readFileSync(archive);
  assert.equal(bytes.length, phase.archive.bytes);
  assert.equal(sha(bytes), phase.archive.sha256);
  const names = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 10e6 })
    .trim()
    .split('\n');
  assert.ok(
    names.every((name) =>
      /^\.\/(?:run\.json|episode-\d{3}\/(?:[a-z0-9-]+\.(?:json|jsonl|png))?)?$/.test(name),
    ),
    'Unsafe archive path',
  );
  assert.ok(
    execFileSync('tar', ['-tvzf', archive], { encoding: 'utf8', maxBuffer: 10e6 })
      .trim()
      .split('\n')
      .every((line) => ['-', 'd'].includes(line[0])),
    'Archive contains links/devices',
  );
  const temporary = mkdtempSync(join(tmpdir(), 'relay-public-trials-'));
  try {
    const extracted = join(temporary, phase.runId);
    mkdirSync(extracted);
    execFileSync('tar', ['-xzf', archive, '-C', extracted]);
    const audit = buildAudit({ runRoot: temporary, id: phase.runId, secrets });
    assert.equal(audit.integrity.status, 'verified');
    assert.deepEqual(audit.integrity.gaps, []);
    assert.equal(audit.run.sourceHash, summary.sourceHash);
    for (const row of rows) {
      const id = trialId(row),
        episodeAudit = audit.episodes.find((e) => e.episode.cell.episodeId === row.episodeId);
      assert.ok(episodeAudit);
      const episode = episodeAudit.episode;
      const selection = {
        kind: 'complete-structured-episode',
        trialId: id,
        originCampaign: row.originCampaign,
        phase: row.phase,
        originalRunId: row.runId,
        episodeId: row.episodeId,
        originalRunStatus: audit.run.status,
        archiveSha256: phase.archive.sha256,
        originalArchive: `evidence/campaigns/${row.originCampaign}/${phase.archive.path}`,
        originalArchivePublic: existsSync(publicPath),
        note: 'All recorded events, exact requests, externally visible responses, UI states and outcome checks for this episode. Original run configuration and budget remain run-scoped, not a per-episode charge. PNG bytes omitted; their hashes remain. Recorded UI-state playback uses the current renderer, not video. No hidden reasoning, secret headers or provider error bodies.',
      };
      const run = {
        ...audit.run,
        episodes: [episode],
        summary: aggregate([episode]),
        paired: [],
        selection,
      };
      const projectedAudit = {
        ...audit,
        run,
        generatedAt: audit.run.finishedAt,
        episodes: [episodeAudit],
        integrity: {
          ...audit.integrity,
          checks: audit.integrity.checks.filter(
            (c) => !c.episodeId || c.episodeId === row.episodeId,
          ),
        },
        // Hashes refer to the original archive bytes, not this derived JSON.
        artifacts: audit.artifacts
          .filter((a) => a.path === 'run.json' || a.path.startsWith(`${row.episodeId}/`))
          .map(({ href, ...a }) => a),
      };
      const record = {
        schema: 'relay-trial-record-v1',
        run,
        events: episodeAudit.trace.map((event) => ({ episodeId: row.episodeId, event })),
        artifacts: {},
        audit: projectedAudit,
        selection,
        capturedAt: audit.run.finishedAt,
      };
      const text = JSON.stringify(record);
      assertSafeEvidence(text, secrets);
      const compressed = gzipSync(text, { level: 9 });
      const entry = {
        ...row,
        id,
        result: row,
        path: `/demo/trial-${id}.json.gz`,
        sha256: sha(compressed),
        bytes: compressed.length,
        jsonBytes: Buffer.byteLength(text),
        archiveSha256: phase.archive.sha256,
        eventCount: record.events.length,
      };
      validateRecord(record, entry);
      const path = join(destination, basename(entry.path));
      if (existsSync(path))
        assert.equal(
          sha(readFileSync(path)),
          entry.sha256,
          'Refuse to rewrite a published recording',
        );
      else {
        writeFileSync(path + '.tmp', compressed);
        renameSync(path + '.tmp', path);
      }
      entries.push(entry);
    }
  } finally {
    rmSync(temporary, { recursive: true, force: true });
  }
  if (entries.length % 25 === 0)
    console.log(JSON.stringify({ exported: entries.length, total: recorded.length }));
}
const catalog = validateCatalog({
  schema: 'relay-trial-catalog-v1',
  campaign,
  summaryHash,
  sourceHash: summary.sourceHash,
  generatedAt: summary.generatedAt,
  complete: !partial,
  planned: summary.totals.planned,
  attempted: recorded.length,
  totals: summary.totals,
  trials: entries,
});
assert.equal(entries.length, recorded.length);
const content = JSON.stringify(catalog, null, 2) + '\n';
assertSafeEvidence(content, secrets);
writeFileSync(join(destination, 'catalog.json.tmp'), content);
renameSync(join(destination, 'catalog.json.tmp'), join(destination, 'catalog.json'));
console.log(
  JSON.stringify(
    {
      trials: entries.length,
      complete: catalog.complete,
      compressedMB: entries.reduce((n, e) => n + e.bytes, 0) / 1e6,
      summaryHash,
    },
    null,
    2,
  ),
);
