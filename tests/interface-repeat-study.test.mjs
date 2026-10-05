import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlan,
  validatePlan,
  cellConfig,
  remainingAllowance,
  studySummary,
  MODELS,
  TASKS,
  MODES,
} from '../scripts/lib/interface-repeat-study.mjs';

const catalog = {
  models: MODELS.map((id) => ({
    id,
    catalogRates: { input: 2, output: 10 },
    imageInput: true,
    reasoningEfforts: ['low'],
    unavailableReason: null,
  })),
};

test('48-run plan covers every approved model/task/mode exactly twice with fresh single-episode configs', () => {
  const plan = validatePlan(createPlan(catalog));
  assert.deepEqual(plan, createPlan(catalog));
  assert.equal(plan.phases.length, 48);
  const seen = new Set();
  for (const phase of plan.phases) {
    const c = cellConfig(plan, phase);
    assert.equal(c.repeats, 1);
    assert.deepEqual(c.seeds, [2042]);
    assert.equal(c.maxEstimatedUSD, 1);
    const key = [phase.models[0], phase.tasks[0], phase.interfaces[0], phase.repetition].join('/');
    assert.ok(!seen.has(key));
    seen.add(key);
  }
  for (const model of MODELS)
    for (const task of TASKS)
      for (const mode of MODES)
        for (const rep of [1, 2]) assert.ok(seen.has([model, task, mode, rep].join('/')));
  for (let i = 0; i < 48; i += 4) {
    const block = plan.phases.slice(i, i + 4);
    assert.equal(
      new Set(block.map((p) => [p.models[0], p.tasks[0], p.repetition].join('/'))).size,
      1,
    );
    assert.deepEqual(block.map((p) => p.interfaces[0]).sort(), [...MODES].sort());
  }
  assert.equal(new Set(plan.phases.slice(0, 8).map((p) => p.models[0])).size, 2);
  assert.ok(
    plan.phases.slice(0, 8).every((p) => p.tasks[0] === 'thread-reply' && p.repetition === 1),
  );
});

test('plan rejects changed limits, omitted cells, duplicates, extra attempts and source of catalog unavailability', () => {
  const edits = [
    (p) => (p.maxEstimatedUSD = 26),
    (p) => (p.planned = 96),
    (p) => (p.common.maxSteps = 80),
    (p) => (p.common.repeats = 2),
    (p) => (p.common.guides = [true]),
    (p) => (p.common.episodeSeconds = 300),
    (p) => (p.common.maxEstimatedUSD = 2),
    (p) => p.phases.pop(),
    (p) => (p.phases[1] = p.phases[0]),
    (p) => p.phases.reverse(),
    (p) => (p.models[MODELS[0]].reasoning = 'high'),
  ];
  for (const edit of edits) {
    const p = createPlan(structuredClone(catalog));
    edit(p);
    assert.throws(() => validatePlan(p));
  }
  for (const edit of [
    (m) => (m.imageInput = false),
    (m) => (m.unavailableReason = 'no access'),
    (m) => (m.reasoningEfforts = []),
  ]) {
    const c = structuredClone(catalog);
    edit(c.models[0]);
    assert.throws(() => createPlan(c));
  }
});

test('shared allowance retains all recorded cost and constrains the next cell without resets', () => {
  const p = createPlan(catalog);
  const reports = [{ phase: p.phases[0].id, estimatedUSD: 24.9 }];
  const remaining = remainingAllowance(p, reports);
  assert.ok(Math.abs(remaining - 0.1) < 1e-8);
  assert.equal(cellConfig(p, p.phases[1], remaining).maxEstimatedUSD, remaining);
  assert.throws(() => remainingAllowance(p, [...reports, ...reports]));
  assert.throws(() => remainingAllowance(p, [{ ...reports[0], estimatedUSD: 26 }]));
  assert.throws(() => remainingAllowance(p, [{ ...reports[0], estimatedUSD: NaN }]));
  assert.throws(() => cellConfig(p, p.phases[0], 0));
});

test('partial summary preserves all 48 planned cells and repetition labels without inventing results', () => {
  const p = createPlan(catalog);
  const summary = studySummary(p, [], 'not-started');
  assert.equal(summary.totals.planned, 48);
  assert.equal(summary.totals.attempted, 0);
  assert.equal(summary.byModel.length, 2);
  for (const mode of MODES) assert.equal(summary.byInterface[mode].planned, 12);
  assert.ok(
    summary.rows.every((r) => r.outcome === 'unattempted' && [1, 2].includes(r.repetition)),
  );
  assert.equal(summary.remainingUSD, 25);
});
