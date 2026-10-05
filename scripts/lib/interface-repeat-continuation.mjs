// A new collector may pass the recorded credential stop only after user authorization.
// The stopped collection and its unsafe terminal flag remain unchanged.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { STUDY_ID, cellConfig } from './interface-repeat-study.mjs';
import { COLLECTION_ID as PRIOR_ID, recoveryBindings, json, sha } from './interface-repeat-recovery.mjs';

export { PRIOR_ID };
export const COLLECTION_ID = `${STUDY_ID}-continuation`;
export const CARRIED_CELLS = 10;
export const ORIGINAL_START = '2026-10-05T20:18:30.673Z';
export const PRIOR_SUMMARY_HASH = '22788d46fce854226e2e001e1fbc17b3ae37e70feffb95a562a4a14e6fef20ad';

export function continuationBindings(root) {
  const prior = json(join(root, '.runtime', PRIOR_ID, 'manifest.json'));
  const oldBindings = recoveryBindings(root);
  for (const [key, value] of Object.entries(oldBindings))
    assert.equal(prior[key], value, `Prior frozen ${key} changed.`);
  const receiptPath = join(root, 'evidence/campaigns', PRIOR_ID, 'verification-public-10.json');
  const receipt = json(receiptPath);
  assert.equal(receipt.summaryHash, PRIOR_SUMMARY_HASH);
  assert.equal(receipt.attempted, CARRIED_CELLS);
  assert.equal(sha(readFileSync(join(root, 'evidence/campaigns', PRIOR_ID, 'verified-summary.json'))), PRIOR_SUMMARY_HASH);
  const { workerHash: priorWorkerHash, ...unchanged } = oldBindings;
  return {
    ...unchanged,
    priorWorkerHash,
    priorManifestHash: sha(readFileSync(join(root, '.runtime', PRIOR_ID, 'manifest.json'))),
    priorVerificationHash: sha(readFileSync(receiptPath)),
    priorSummaryHash: PRIOR_SUMMARY_HASH,
    workerHash: sha(JSON.stringify([
      'scripts/run-interface-repeat-continuation.mjs',
      'scripts/prepare-interface-repeat-continuation.mjs',
      'scripts/lib/interface-repeat-continuation.mjs',
    ].map((p) => [p, sha(readFileSync(join(root, p)))]))),
  };
}

export function assertContinuationPrefix(plan, manifest, prior) {
  assert.equal(prior.status, 'stopped');
  assert.equal(prior.phases.length, CARRIED_CELLS);
  assert.equal(prior.phases[9].safeToContinue, false);
  assert.equal(prior.phases[9].runId, 'f7bcda1c-482c-47e2-acc4-1bbeebd73c33');
  assert.equal(manifest.createdAt, ORIGINAL_START, 'Do not reset the wall clock.');
  assert.equal(manifest.createdAt, prior.createdAt);
  assert.ok(manifest.phases.length >= CARRIED_CELLS && manifest.phases.length <= plan.planned);
  assert.deepEqual(manifest.phases.slice(0, CARRIED_CELLS), prior.phases, 'Carried attempts are immutable.');
  const runIds = new Set();
  for (const [i, entry] of manifest.phases.entries()) {
    assert.equal(entry.id, plan.phases[i].id, 'Never skip, repeat or reorder a cell.');
    assert.equal(entry.repetition, plan.phases[i].repetition);
    assert.ok(entry.finishedAt && entry.archive, 'Unsealed cell.');
    if (i >= CARRIED_CELLS) assert.equal(entry.safeToContinue, true, 'New unsafe cell cannot resume.');
    assert.ok(!runIds.has(entry.runId), 'Duplicate run.');
    runIds.add(entry.runId);
    assert.deepEqual(entry.config, cellConfig(plan, plan.phases[i], entry.config.maxEstimatedUSD));
  }
}
