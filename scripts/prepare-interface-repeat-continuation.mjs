// Offline, single-use carry-forward. No model request and no historical mutation.
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync, copyFileSync, constants } from 'node:fs';
import { join, resolve } from 'node:path';
import { assertSafeEvidence } from '../runner/export.mjs';
import { STUDY_ID, validatePlan, studySummary } from './lib/interface-repeat-study.mjs';
import { json, sha } from './lib/interface-repeat-recovery.mjs';
import { COLLECTION_ID, PRIOR_ID, CARRIED_CELLS, continuationBindings, assertContinuationPrefix } from './lib/interface-repeat-continuation.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
assert.ok(process.argv.includes('--user-authorized'), 'Requires explicit continuation authority.');
const runtime = join(root, '.runtime', COLLECTION_ID);
const destination = join(root, 'evidence/campaigns', COLLECTION_ID);
const oldRuntime = join(root, '.runtime', PRIOR_ID);
assert.ok(!existsSync(runtime) && !existsSync(destination), 'Preparation is single-use.');
for (const name of readdirSync(join(root, '.runtime')))
  assert.ok(!existsSync(join(root, '.runtime', name, 'worker.lock')), 'A collector is active.');
const prior = json(join(oldRuntime, 'manifest.json'));
const plan = validatePlan(json(join(root, 'docs/campaigns', `${STUDY_ID}.json`)));
const frozen = continuationBindings(root);
const reports = prior.phases.map((p) => json(join(oldRuntime, `${p.id}.report.json`)));
const manifest = {
  id: COLLECTION_ID,
  studyId: STUDY_ID,
  createdAt: prior.createdAt,
  continuedAt: new Date().toISOString(),
  ...frozen,
  status: 'prepared',
  pilotReview: prior.pilotReview,
  authorization: {
    reason: 'User raised Router account limits and explicitly requested continuation.',
    carriedCells: CARRIED_CELLS,
    inferenceRequestsAdded: 0,
    nextCell: 'cell-011',
    priorCollection: PRIOR_ID,
    unchangedStudyLimits: true,
  },
  phases: structuredClone(prior.phases),
};
assertContinuationPrefix(plan, manifest, prior);
const summary = studySummary(plan, reports, 'prepared');
assert.equal(summary.totals.attempted, 10);
assert.equal(summary.estimatedUSD, 1.870134);
mkdirSync(runtime, { mode: 0o700 });
mkdirSync(destination, { recursive: true });
for (const phase of prior.phases) {
  assert.equal(phase.archive.path, `${phase.id}.tar.gz`);
  const bytes = readFileSync(join(oldRuntime, phase.archive.path));
  assert.equal(sha(bytes), phase.archive.sha256);
  assert.equal(bytes.length, phase.archive.bytes);
  for (const name of [phase.archive.path, `${phase.id}.report.json`]) {
    copyFileSync(join(oldRuntime, name), join(runtime, name), constants.COPYFILE_EXCL);
    assert.deepEqual(readFileSync(join(runtime, name)), readFileSync(join(oldRuntime, name)));
  }
}
assert.deepEqual(continuationBindings(root), frozen);
for (const [path, value] of [
  [join(runtime, 'manifest.json'), manifest],
  [join(destination, 'manifest.json'), manifest],
  [join(destination, 'summary.json'), summary],
]) {
  assertSafeEvidence(JSON.stringify(value));
  writeFileSync(path, JSON.stringify(value, null, 2) + '\n', { flag: 'wx' });
}
console.log(JSON.stringify({ status: 'prepared', carried: 10, remaining: 38, recordedUSD: summary.estimatedUSD, remainingUSD: summary.remainingUSD }));
