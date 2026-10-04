import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TASK_IDS, taskSeed } from '../server/tasks.mjs';
import { digest } from '../server/domain.mjs';
import {
  createTaskPlan,
  validateTaskPlan,
  taskConfig,
  taskCampaignSummary,
  remainingAllowance,
  MODEL_IDS,
} from '../scripts/lib/breadth-campaign.mjs';
import { schedule } from '../runner/design.mjs';
import { comparisonSlide } from '../scripts/lib/comparison-slide.mjs';
const previous = JSON.parse(readFileSync('evidence/campaigns/all-tasks-2026-10-03/summary.json'));
const catalog = {
  at: 'test',
  hash: 'test',
  models: MODEL_IDS.map((id) => ({ id, catalogRates: { input: 2, output: 10 } })),
};
const initialHashes = Object.fromEntries(TASK_IDS.map((t) => [t, digest(taskSeed(t, 1042))]));
const plan = createTaskPlan(
  catalog,
  [{ id: 'entire-prior-ledger', recordedUSD: 10.43 }],
  previous,
  initialHashes,
);
test('breadth plan contains every model/task once, reuses all attempts and never retries blocked cells', () => {
  validateTaskPlan(plan);
  assert.equal(MODEL_IDS.length, 17);
  assert.equal(plan.carryoverRows.length, 37);
  assert.equal(plan.phases.length, 269);
  const cells = [
    ...plan.carryoverRows,
    ...plan.phases.flatMap((p) =>
      schedule(taskConfig(plan, p)).map((c) => ({
        model: c.model.id,
        task: c.taskId,
        seed: c.seed,
      })),
    ),
  ];
  assert.equal(cells.length, 306);
  for (const model of MODEL_IDS)
    for (const task of TASK_IDS)
      assert.equal(
        cells.filter((c) => c.model === model && c.task === task && c.seed === 1042).length,
        1,
      );
  assert.equal(plan.carryoverRows.filter((r) => r.outcome === 'blocked').length, 4);
  assert.deepEqual(createTaskPlan(catalog, plan.priorCampaigns, previous, initialHashes), plan);
});
test('new-model pilot uses three different tasks per new route, never added repeats', () => {
  const cells = plan.phases
    .slice(0, plan.pilotBlocks)
    .flatMap((p) => schedule(taskConfig(plan, p)));
  assert.equal(cells.length, 36);
  const models = [...new Set(cells.map((c) => c.model.id))];
  assert.equal(models.length, 12);
  for (const model of models)
    assert.deepEqual(
      cells.filter((c) => c.model.id === model).map((c) => c.taskId),
      ['channel-topic', 'thread-reply', 'edit-message'],
    );
});
test('invalid duplicate, carried-cell retry, scope and seed mutations are rejected', () => {
  for (const mutate of [
    (p) => (p.phases[1] = p.phases[0]),
    (p) => (p.maxEstimatedUSD = 301),
    (p) => (p.trialsPerTaskModel = 2),
    (p) => (p.phases[0].seeds = [1043]),
    (p) => (p.carryoverRows[1] = p.carryoverRows[0]),
  ]) {
    const copy = structuredClone(plan);
    mutate(copy);
    assert.throws(() => validateTaskPlan(copy));
  }
  const copy = structuredClone(plan);
  const r = copy.carryoverRows[0];
  copy.phases[0] = { ...copy.phases[0], tasks: [r.task], models: [r.model] };
  assert.throws(() => validateTaskPlan(copy), /Duplicate/);
});
test('single-cell safety allowance cannot multiply or reset the shared budget', () => {
  assert.equal(remainingAllowance(plan, []), 289.57);
  assert.equal(taskConfig(plan, plan.phases[0], 100).maxEstimatedUSD, 5);
  assert.equal(taskConfig(plan, plan.phases[0], 0.1).maxEstimatedUSD, 0.1);
  assert.equal(remainingAllowance(plan, [{ estimatedUSD: 300 }]), 0);
});
test('summary preserves outcomes and provenance; imported costs count once against the shared ceiling', () => {
  const s = taskCampaignSummary(plan, [], 'planned');
  assert.equal(s.totals.planned, 306);
  assert.equal(s.totals.attempted, 37);
  assert.equal(s.totals.passed, 28);
  assert.equal(s.totals.incomplete, 5);
  assert.equal(s.totals.blocked, 4);
  assert.equal(s.estimatedUSD, 0);
  assert.equal(s.recordedTotalUSD, 10.43);
  assert.equal(s.remainingUSD, 289.57);
  assert.equal(s.selectionEstimatedUSD, previous.estimatedUSD);
  assert.equal(s.newlyAttempted, 0);
  assert.equal(s.preserved, 37);
  assert.ok(s.byModel.every((m) => m.planned === 18));
  assert.ok(s.byTask.every((t) => t.byModel.every((m) => m.planned === 1)));
  assert.ok(
    s.byModel
      .filter((m) => !m.attempted)
      .every((m) => m.successRate === null && m.estimatedUSD === null),
  );
  assert.ok(s.rows.every((r) => r.originCampaign && r.cohort));
  assert.deepEqual(
    s.rows.filter((r) => r.cohort === 'preserved'),
    plan.carryoverRows,
  );
});
test('new evidence overlays only its missing cell and the slide retains every origin', () => {
  const shell = taskCampaignSummary(plan, [], 'planned');
  const row = shell.rows.find((r) => r.cohort === 'new');
  const result = taskCampaignSummary(
    plan,
    [
      {
        phase: row.phase,
        runId: 'new-run',
        auditChecks: 10,
        archive: { sha256: 'test' },
        safeToContinue: true,
        estimatedUSD: 1,
        reservedUSD: 0,
        requests: 2,
        inputTokens: 100,
        outputTokens: 20,
        rows: [
          {
            ...row,
            runId: 'new-run',
            outcome: 'passed',
            status: 'completed',
            actionAttempts: 2,
            rejectedActions: 0,
            captureWarnings: 0,
            durationMs: 1000,
            estimatedUSD: 1,
            usageKnown: true,
            returnedModels: [row.model],
          },
        ],
      },
    ],
    'running',
  );
  assert.equal(result.totals.attempted, 38);
  assert.equal(result.totals.passed, 29);
  assert.equal(result.newlyAttempted, 1);
  assert.equal(result.recordedTotalUSD, 11.43);
  assert.equal(result.selectionEstimatedUSD, previous.estimatedUSD + 1);
  assert.equal(result.remainingUSD, 288.57);
  assert.deepEqual(
    result.rows.filter((r) => r.cohort === 'preserved'),
    plan.carryoverRows,
  );
  const html = comparisonSlide(result);
  assert.equal(html.COMPARISON_TITLE, '17 models. Every task.');
  assert.equal(html.COMPARISON_REPEATS, 1);
  assert.equal((html.COMPARISON_TRIALS.match(/<tr(?: |>)/g) ?? []).length, 307);
  assert.equal((html.COMPARISON_TRIALS.match(/class="trial-origin">preserved/g) ?? []).length, 37);
  assert.equal((html.COMPARISON_TABLE.match(/class="trial-cell /g) ?? []).length, 306);
  assert.ok(html.COMPARISON_PROVENANCE.includes('37 prior attempts'));
});
