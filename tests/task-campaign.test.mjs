import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTaskPlan,
  validateTaskPlan,
  taskConfig,
  remainingAllowance,
  taskCampaignSummary,
  MODEL_IDS,
  unresolvedUSD,
} from '../scripts/lib/task-campaign.mjs';
import { schedule } from '../runner/design.mjs';
import { retainedConnectionFailure, acceptedEpisodeDeadline } from '../runner/campaign-policy.mjs';
const catalog = {
  at: 'test',
  hash: 'test',
  models: MODEL_IDS.map((id) => ({ id, catalogRates: { input: 2, output: 10 } })),
};
const plan = createTaskPlan(catalog, [{ id: 'prior', recordedUSD: 0.99 }]);
test('full task campaign is exactly 20 trials per task/model with reproducible matched blocks', () => {
  validateTaskPlan(plan);
  assert.deepEqual(createTaskPlan(catalog, plan.priorCampaigns), plan);
  const cells = plan.phases.flatMap((phase) => schedule(taskConfig(plan, phase)));
  assert.equal(cells.length, 1800);
  for (const model of MODEL_IDS)
    for (const task of plan.common.tasks) {
      const group = cells.filter((c) => c.taskId === task && c.model.id === model);
      assert.equal(group.length, 20);
      assert.equal(new Set(group.map((c) => c.seed)).size, 20);
    }
  assert.deepEqual(
    plan.phases.slice(0, 5).map((p) => p.tasks[0]),
    ['channel-topic', 'thread-reply', 'edit-message', 'incident-triage', 'decision-record'],
  );
  const duplicate = structuredClone(plan);
  duplicate.phases[1] = duplicate.phases[0];
  assert.throws(() => validateTaskPlan(duplicate), /Duplicate/);
  const changed = structuredClone(plan);
  changed.maxEstimatedUSD = 301;
  assert.throws(() => validateTaskPlan(changed), /ceiling/);
});
test('global budget never multiplies across blocks or credits unknown reservations', () => {
  assert.equal(remainingAllowance(plan, []), 299.01);
  assert.ok(Math.abs(remainingAllowance(plan, [{ estimatedUSD: 298 }]) - 1.01) < 1e-9);
  assert.equal(taskConfig(plan, plan.phases[0], 1).maxEstimatedUSD, 1);
  assert.equal(taskConfig(plan, plan.phases[0], 100).maxEstimatedUSD, 5);
  assert.equal(remainingAllowance(plan, [{ estimatedUSD: 300 }]), 0);
  assert.throws(() => remainingAllowance(plan, [{ estimatedUSD: NaN }]), /ledger/);
  assert.equal(
    unresolvedUSD([
      { kind: 'request', reservedUSD: 0.2 },
      { kind: 'provider_error', usageAccepted: false },
    ]),
    0.2,
  );
  assert.equal(
    unresolvedUSD([
      { kind: 'request', reservedUSD: 0.2 },
      { kind: 'provider_error', usageAccepted: true, receipt: { usage: { inputTokens: 20 } } },
    ]),
    0,
  );
});
test('planned grid has no manufactured failures or performance, and every task/model shows planned 20', () => {
  const s = taskCampaignSummary(plan, [], 'planned');
  assert.equal(s.totals.planned, 1800);
  assert.equal(s.totals.attempted, 0);
  assert.equal(s.totals.unattempted, 1800);
  assert.equal(s.byTask.length, 18);
  assert.ok(s.byModel.every((m) => m.planned === 360 && m.successRate === null));
  assert.ok(s.byTask.every((t) => t.byModel.every((m) => m.planned === 20 && m.attempted === 0)));
});
test('connection/deadline exceptions exclude wrong statuses, cancellation, cleanup and missing reservations', () => {
  const config = { continueAfterConnectionFailure: true, continueAfterEpisodeTimeout: true };
  const episode = {
    status: 'provider_connection_error',
    usageKnown: false,
    estimatedUSD: 0.2,
    connectionFailureReservationUSD: 0.2,
  };
  assert.equal(retainedConnectionFailure(config, episode), true);
  for (const patch of [
    { status: 'harness_error' },
    { status: 'cancelled' },
    { usageKnown: true },
    { cleanupError: 'failed' },
    { connectionFailureReservationUSD: NaN },
    { connectionFailureReservationUSD: 0 },
    { estimatedUSD: 0 },
  ])
    assert.equal(retainedConnectionFailure(config, { ...episode, ...patch }), false);
  assert.equal(retainedConnectionFailure({}, episode), false);
  assert.equal(acceptedEpisodeDeadline(config, { status: 'timeout', usageKnown: true }), true);
  assert.equal(acceptedEpisodeDeadline(config, { status: 'timeout', usageKnown: false }), false);
  assert.equal(
    acceptedEpisodeDeadline(config, {
      status: 'timeout',
      usageKnown: true,
      cleanupError: 'failed',
    }),
    false,
  );
});
