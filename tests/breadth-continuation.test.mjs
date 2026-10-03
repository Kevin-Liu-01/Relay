import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  createContinuation,
  validateTaskPlan,
  taskCampaignSummary,
  acceptedCellSpendLimit,
} from '../scripts/lib/breadth-continuation.mjs';
import { verifyCoverage } from '../scripts/lib/coverage-verification.mjs';
const read = (p) => JSON.parse(readFileSync(p));
const previousPlan = read('docs/campaigns/model-breadth-2026-10-03.json');
const previous = read('evidence/campaigns/model-breadth-2026-10-03/summary.json');
const previousManifest = read('evidence/campaigns/model-breadth-2026-10-03/manifest.json');
const plan = createContinuation(
  previousPlan,
  previous,
  previousManifest,
  'test-summary',
  'test-review',
);
test('continuation carries all 105 attempts and schedules exactly the 201 untouched cells', () => {
  validateTaskPlan(plan);
  const s = taskCampaignSummary(plan, [], 'planned');
  verifyCoverage(plan, s, { allowPartial: true });
  assert.equal(s.totals.attempted, 105);
  assert.equal(s.totals.blocked, 16);
  assert.equal(s.totals.unattempted, 201);
  assert.equal(plan.phases[0].id, 'block-069');
  assert.equal(plan.phases.at(-1).id, 'block-269');
  assert.equal(s.estimatedUSD, 0);
  assert.ok(Math.abs(s.recordedTotalUSD - previous.recordedTotalUSD) < 1e-8);
  assert.ok(Math.abs(s.remainingUSD - previous.remainingUSD) < 1e-8);
  assert.equal(s.selectionEstimatedUSD, previous.selectionEstimatedUSD);
  assert.deepEqual(plan.common, previousPlan.common);
  assert.equal(plan.collectionStartedAt, previousManifest.createdAt);
});
test('attempted cells cannot be retried and trial caps cannot increase', () => {
  const copy = structuredClone(plan);
  copy.phases[0] = previousPlan.phases[0];
  assert.throws(() => validateTaskPlan(copy), /Never repeat/);
  const raised = structuredClone(plan);
  raised.common.maxSteps = 41;
  assert.throws(() => validateTaskPlan(raised), /Unchanged/);
});
const stopped = () => ({
  status: 'stopped',
  stopReason: { code: 'campaign_stop' },
  budget: { usageKnown: true, estimatedUSD: 4.16782 },
  episodes: [
    {
      status: 'budget',
      usageKnown: true,
      estimatedUSD: 4.16782,
      error:
        'Next request needs $0.9771 of estimated allowance; $0.8322 remains of the $5.00 run cap. Raise the allowance in Run settings.',
    },
  ],
});
const completeTrace = {
  'episode-001': [
    { kind: 'request', reservedUSD: 1 },
    { kind: 'response', response: { usage: { inputTokens: 1, outputTokens: 1 } } },
  ],
};
test('verified known-use cell cap may advance without granting another request', () => {
  assert.equal(acceptedCellSpendLimit({ maxEstimatedUSD: 5 }, stopped(), completeTrace), true);
  assert.equal(acceptedCellSpendLimit({ maxEstimatedUSD: 5 }, stopped(), {}), false);
  assert.equal(acceptedCellSpendLimit({ maxEstimatedUSD: 4 }, stopped(), completeTrace), false);
  assert.equal(
    acceptedCellSpendLimit({ maxEstimatedUSD: 5 }, stopped(), {
      'episode-001': [{ kind: 'request', reservedUSD: 1 }],
    }),
    false,
  );
});
test('auth, unknown receipts, cleanup, unrelated stops and overspend cannot use the cell-cap exception', () => {
  for (const mutate of [
    (r) => (r.episodes[0].status = 'credentials_invalid'),
    (r) => (r.episodes[0].usageKnown = false),
    (r) => (r.episodes[0].cleanupError = 'failed'),
    (r) => (r.episodes[0].error = 'Run wall-time limit reached.'),
    (r) => (r.stopReason.code = 'harness_error'),
    (r) => (r.budget.usageKnown = false),
    (r) => (r.budget.estimatedUSD = 10),
    (r) => r.episodes.push({ ...r.episodes[0] }),
  ]) {
    const r = stopped();
    mutate(r);
    assert.equal(acceptedCellSpendLimit({ maxEstimatedUSD: 5 }, r, completeTrace), false);
  }
});
