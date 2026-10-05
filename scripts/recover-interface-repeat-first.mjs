// No provider call. Seal the already executed first cell in a new collection.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { buildAudit } from '../runner/audit.mjs';
import { exportRun, assertSafeEvidence } from '../runner/export.mjs';
import { retainedRequestTimeout } from '../runner/campaign-policy.mjs';
import { grade } from '../server/tasks.mjs';
import { trialAccounting } from './lib/report-accounting.mjs';
import { STUDY_ID, validatePlan, studySummary } from './lib/interface-repeat-study.mjs';
import {
  COLLECTION_ID,
  recoveryBindings,
  summarizeCell,
  assertContinuationPrefix,
  json,
  sha,
} from './lib/interface-repeat-recovery.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const oldRuntime = join(root, '.runtime', STUDY_ID);
const runtime = join(root, '.runtime', COLLECTION_ID);
const destination = join(root, 'evidence/campaigns', COLLECTION_ID);
assert.ok(!existsSync(runtime) && !existsSync(destination), 'Recovery is single-use.');
for (const directory of readdirSync(join(root, '.runtime')))
  assert.ok(
    !existsSync(join(root, '.runtime', directory, 'worker.lock')),
    'A collector is active.',
  );
const original = json(join(oldRuntime, 'manifest.json'));
assert.equal(original.status, 'stopped');
assert.equal(original.phases.length, 1);
assert.equal(
  original.workerError,
  'Unknown configuration fields are rejected; never place credentials in run configs.',
);
const plan = validatePlan(json(join(root, 'docs/campaigns', `${STUDY_ID}.json`)));
const frozen = recoveryBindings(root);
const entry = original.phases[0];
assert.equal(entry.id, 'cell-001');
const audit = buildAudit({ runRoot: join(oldRuntime, 'runs'), id: entry.runId });
assert.equal(audit.integrity.status, 'verified');
assert.deepEqual(audit.integrity.gaps, []);
assert.equal(audit.run.sourceHash, frozen.sourceHash);
assert.equal(audit.run.status, 'completed');
const e = audit.episodes[0],
  episode = e.episode;
assert.ok(retainedRequestTimeout(entry.config, episode));
assert.ok(!episode.cleanupError && episode.finishedAt);
assert.equal(episode.initialHash, sha(JSON.stringify(e.initial.state)));
const { revision, sessionId, ...evaluation } = episode.evaluation;
assert.deepEqual(grade(episode.cell.taskId, episode.cell.seed, e.outcome.state), evaluation);
assert.equal(revision, e.outcome.revision);
const report = summarizeCell(plan, plan.phases[0], entry.config, audit);
const accounting = trialAccounting({ run: audit.run, events: e.trace.map((event) => ({ event })) });
assert.ok(Math.abs(report.estimatedUSD - accounting.recordedUSD) < 1e-8);
assert.ok(Math.abs(report.reservedUSD - accounting.reservedUSD) < 1e-8);

mkdirSync(runtime, { mode: 0o700 });
mkdirSync(destination, { recursive: true });
const exported = join(runtime, 'cell-001-export');
exportRun({ runRoot: join(oldRuntime, 'runs'), id: entry.runId, destination: exported });
const archive = join(runtime, 'cell-001.tar.gz');
execFileSync('tar', ['-czf', archive, '-C', exported, '.']);
const bytes = readFileSync(archive);
const recovered = {
  ...entry,
  originCampaign: STUDY_ID,
  status: audit.run.status,
  budget: audit.run.budget,
  initialHash: episode.initialHash,
  appProvenance: episode.appProvenance,
  archive: {
    path: 'cell-001.tar.gz',
    bytes: bytes.length,
    sha256: sha(bytes),
    availability: 'local-preserved',
  },
  audit: { status: audit.integrity.status, checks: audit.integrity.checks.length, gaps: [] },
  safeToContinue: true,
  finishedAt: audit.run.finishedAt,
  stopReason: audit.run.stopReason ?? null,
};
const manifest = {
  id: COLLECTION_ID,
  studyId: STUDY_ID,
  createdAt: original.createdAt,
  recoveredAt: new Date().toISOString(),
  ...frozen,
  status: 'recovered',
  phases: [recovered],
};
assertContinuationPrefix(plan, manifest);
const receipt = {
  kind: 'offline-report-recovery',
  originalManifestHash: frozen.originalManifestHash,
  originalWorkerHash: frozen.originalWorkerHash,
  runId: entry.runId,
  inferenceRequestsAdded: 0,
  originalArtifacts: audit.artifacts.map(({ href, ...a }) => a),
  archive: recovered.archive,
  checks: audit.integrity.checks.length,
  gradeChecks: evaluation.checks.length,
  accounting,
  recoveredAt: manifest.recoveredAt,
};
// Check bytes again after export; neither the raw run nor its stopped manifest changed.
const after = buildAudit({ runRoot: join(oldRuntime, 'runs'), id: entry.runId });
assert.deepEqual(after.artifacts, audit.artifacts);
assert.deepEqual(recoveryBindings(root), frozen);
const summary = studySummary(plan, [report], 'recovered');
for (const [path, data] of [
  [join(runtime, 'manifest.json'), manifest],
  [join(runtime, 'cell-001.report.json'), report],
  [join(runtime, 'recovery.json'), receipt],
  [join(destination, 'manifest.json'), manifest],
  [join(destination, 'summary.json'), summary],
  [join(destination, 'recovery.json'), receipt],
]) {
  assertSafeEvidence(JSON.stringify(data));
  writeFileSync(path, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
}
console.log(
  JSON.stringify({
    recovered: entry.id,
    ...summary.totals,
    accounting,
    remainingUSD: summary.remainingUSD,
  }),
);
