import test from 'node:test';
import assert from 'node:assert/strict';
import { makeRunPlan, queueMustStop } from '../src/live/run-plan.mjs';
import { DEFAULT_CONFIG } from '../runner/design.mjs';
import { LIMITS, hostedConfig } from '../hosted/service.mjs';

const input = {
  setup: {
    limits: LIMITS,
    defaults: { ...DEFAULT_CONFIG, maxRequests: 80, runSeconds: 190, episodeSeconds: 180 },
  },
  provider: 'ramp',
  models: ['one', 'two', 'three'].map((id) => ({ id, rates: { input: 2, output: 10 } })),
  task: 'channel-topic',
  mode: 'a11y',
  guide: false,
  context: 'recent-4',
  cap: 2,
  steps: 40,
};
test('queued models have independent full budgets, matched inputs and admissible one-cell requests', () => {
  const jobs = makeRunPlan(input);
  assert.equal(jobs.length, 3);
  for (const [i, config] of jobs.entries()) {
    assert.equal(config.models[0].id, input.models[i].id);
    assert.equal(config.models.length, 1);
    assert.equal(config.maxEstimatedUSD, 2);
    assert.equal(config.episodeSeconds, 180);
    assert.deepEqual(config.seeds, [42]);
    assert.deepEqual(config.tasks, ['channel-topic']);
    assert.deepEqual(config.interfaces, ['a11y']);
    assert.deepEqual(hostedConfig(config), config);
  }
  assert.equal(
    jobs.reduce((sum, c) => sum + c.maxEstimatedUSD, 0),
    6,
  );
});
test('interface comparisons no longer share one short worker deadline or divide the allowance', () => {
  const jobs = makeRunPlan({ ...input, models: input.models.slice(0, 1), compare: true });
  assert.deepEqual(
    jobs.map((c) => c.interfaces),
    [['a11y'], ['json-ui'], ['api']],
  );
  assert.ok(jobs.every((c) => c.episodeSeconds === 180 && c.maxEstimatedUSD === 2));
});
test('invalid queue selections and allowances cannot start paid requests', () => {
  for (const extra of [
    { models: [] },
    { models: Array(9).fill(input.models[0]) },
    { models: [input.models[0], input.models[0]] },
    { models: [{ id: 'unpriced' }] },
    { cap: 0 },
    { cap: NaN },
    { cap: 5.01 },
    { steps: 0 },
    { steps: 81 },
    { steps: 1.5 },
    { mode: 'pixels' },
  ])
    assert.throws(() => makeRunPlan({ ...input, ...extra }));
});
test('unknown usage, interrupted streams and missing audits halt the remaining queue', () => {
  const record = {
    run: { budget: { usageKnown: true } },
    audit: { integrity: { status: 'verified' } },
  };
  assert.equal(queueMustStop(record), false);
  for (const extra of [
    { error: 'Stopped' },
    { run: null },
    { audit: null },
    { audit: { integrity: { status: 'failed' } } },
    { run: { budget: { usageKnown: false } } },
  ])
    assert.equal(queueMustStop({ ...record, ...extra }), true);
});
