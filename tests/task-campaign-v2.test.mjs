import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createTaskPlan,
  validateTaskPlan,
  taskConfig,
  taskCampaignSummary,
  MODEL_IDS,
} from '../scripts/lib/task-campaign-v2.mjs';
import { schedule } from '../runner/design.mjs';
test('approved Qwen successor keeps 1800 fresh cells, all 18 tasks and twenty seeds per model/task', () => {
  const plan = createTaskPlan(
    { models: MODEL_IDS.map((id) => ({ id, catalogRates: { input: 2, output: 6 } })) },
    [{ id: 'earlier', recordedUSD: 1.02 }],
  );
  validateTaskPlan(plan);
  assert.equal(plan.id, 'all-tasks-2026-10-03');
  assert.ok(MODEL_IDS.includes('qwen3p8-max'));
  assert.ok(!MODEL_IDS.includes('gemini-3.8-flash'));
  const cells = plan.phases.flatMap((p) => schedule(taskConfig(plan, p)));
  assert.equal(cells.length, 1800);
  for (const model of MODEL_IDS)
    for (const task of plan.common.tasks)
      assert.equal(cells.filter((c) => c.model.id === model && c.taskId === task).length, 20);
  const summary = taskCampaignSummary(plan, [], 'planned');
  assert.deepEqual(
    summary.byModel.map((m) => m.model),
    MODEL_IDS,
  );
  assert.ok(summary.byTask.every((t) => t.byModel.every((m) => m.planned === 20)));
  assert.equal(summary.remainingUSD, 298.98);
});
