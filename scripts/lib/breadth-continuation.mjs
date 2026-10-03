import assert from 'node:assert/strict';
import { TASK_IDS } from '../../server/tasks.mjs';
import { schedule } from '../../runner/design.mjs';
import { unresolvedUSD } from './task-campaign-v2.mjs';
import { MODEL_IDS, taskConfig, taskCampaignSummary as baseSummary } from './breadth-campaign.mjs';
export { taskConfig, remainingAllowance, blockReport } from './breadth-campaign.mjs';
export const TASK_CAMPAIGN_ID = 'model-breadth-2026-10-03-continuation';
export const PREDECESSOR = 'model-breadth-2026-10-03';

// This accepts a completed *accounting boundary*, never permission for another
// request in the same episode. The original Experiment remains unchanged.
export function acceptedCellSpendLimit(config, run, traces) {
  const e = run.episodes?.[0];
  return (
    run.status === 'stopped' &&
    run.stopReason?.code === 'campaign_stop' &&
    run.episodes.length === 1 &&
    e?.status === 'budget' &&
    e.usageKnown === true &&
    !e.cleanupError &&
    run.budget?.usageKnown === true &&
    /^Next request needs \$[\d.]+ of estimated allowance; \$[\d.]+ remains of the \$[\d.]+ run cap\./.test(
      e.error ?? '',
    ) &&
    Number.isFinite(e.estimatedUSD) &&
    e.estimatedUSD >= 0 &&
    e.estimatedUSD <= config.maxEstimatedUSD &&
    run.budget.estimatedUSD === e.estimatedUSD &&
    Object.values(traces).length === 1 &&
    Object.values(traces).every((trace) =>
      trace.some(
        (event) =>
          (event.kind === 'response' && event.response?.usage) ||
          (event.kind === 'provider_error' && event.usageAccepted && event.receipt?.usage),
      ),
    ) &&
    Object.values(traces).every((trace) => unresolvedUSD(trace) === 0)
  );
}

export function createContinuation(
  previousPlan,
  previous,
  previousManifest,
  summaryHash,
  reviewHash,
) {
  assert.equal(previous.id, PREDECESSOR);
  assert.equal(previous.status, 'stopped');
  assert.equal(previous.totals.attempted, 105);
  assert.equal(previousManifest.phases.length, 68);
  assert.equal(previousManifest.phases.at(-1).id, 'block-068');
  const attempted = new Set(
    previous.rows
      .filter((r) => r.outcome !== 'unattempted')
      .map((r) => `${r.model}/${r.task}/${r.seed}`),
  );
  const carryoverRows = previous.rows
    .filter((r) => r.outcome !== 'unattempted')
    .map((r) => ({ ...r, cohort: 'preserved' }));
  const phases = previousPlan.phases.filter(
    (p) => !attempted.has(`${p.models[0]}/${p.tasks[0]}/${p.seeds[0]}`),
  );
  const priorCampaigns = [
    ...previousPlan.priorCampaigns,
    {
      id: previous.id,
      path: `evidence/campaigns/${previous.id}/summary.json`,
      summaryHash,
      recordedUSD: previous.estimatedUSD,
    },
  ];
  return {
    ...previousPlan,
    id: TASK_CAMPAIGN_ID,
    authorization:
      'Finish the existing 306-cell one-attempt coverage request. Only the 201 untouched cells run; no retries, new model/task cells, higher trial caps or additional shared allowance.',
    predecessor: PREDECESSOR,
    continuationReason:
      'Original worker stopped at 105/306 when Astra release-sync could not reserve its next request under the unchanged $5 cell ceiling. That attempt stays blocked. A separately recorded worker may advance after a verified, receipt-complete cell-spend stop, not send another request in that cell.',
    planned: 306,
    newPlanned: 201,
    pilotBlocks: 0,
    pilotAdmission: {
      source: `docs/campaigns/${PREDECESSOR}-pilot-review.md`,
      sha256: reviewHash,
      originalPilotCells: 36,
      repeated: false,
    },
    collectionStartedAt: previousManifest.createdAt,
    maxTotalRequests:
      previousPlan.maxTotalRequests - (previous.requests - previousPlan.carryover.requests),
    maxArchiveBytes:
      previousPlan.maxArchiveBytes - previous.phases.reduce((n, p) => n + p.archive.bytes, 0),
    priorCampaigns,
    carryoverRows,
    carryover: {
      id: previous.id,
      estimatedUSD: previous.selectionEstimatedUSD,
      reservedUSD: previous.selectionReservedUSD,
      auditChecks: previous.auditChecks,
      requests: previous.requests,
      inputTokens: previous.inputTokens,
      outputTokens: previous.outputTokens,
    },
    phases,
    aggregateOrigins: ['all-tasks-2026-10-03', PREDECESSOR, TASK_CAMPAIGN_ID],
  };
}

export function validateTaskPlan(plan) {
  assert.equal(plan.id, TASK_CAMPAIGN_ID);
  assert.equal(plan.predecessor, PREDECESSOR);
  assert.equal(plan.planned, 306);
  assert.equal(plan.newPlanned, 201);
  assert.equal(plan.phases.length, 201);
  assert.equal(plan.carryoverRows.length, 105);
  assert.equal(plan.trialsPerTaskModel, 1);
  assert.equal(plan.seed, 1042);
  assert.equal(plan.maxEstimatedUSD, 300);
  assert.equal(plan.common.maxEstimatedUSD, 5);
  for (const [key, value] of Object.entries({
    maxSteps: 40,
    maxRequests: 40,
    maxOutputTokens: 4096,
    requestTimeoutSeconds: 90,
    episodeSeconds: 180,
    runSeconds: 240,
  }))
    assert.equal(plan.common[key], value, 'Unchanged individual trial limits');
  assert.deepEqual(plan.common.interfaces, ['a11y']);
  assert.deepEqual(plan.common.histories, ['recent-4']);
  assert.deepEqual(plan.common.guides, [false]);
  assert.deepEqual(Object.keys(plan.models), MODEL_IDS);
  assert.deepEqual(plan.common.tasks, TASK_IDS);
  assert.ok(Number.isFinite(Date.parse(plan.collectionStartedAt)));
  const seen = new Set();
  for (const row of plan.carryoverRows) {
    assert.ok(MODEL_IDS.includes(row.model) && TASK_IDS.includes(row.task));
    assert.equal(row.seed, 1042);
    assert.equal(row.cohort, 'preserved');
    assert.ok(['all-tasks-2026-10-03', PREDECESSOR].includes(row.originCampaign));
    assert.notEqual(row.outcome, 'unattempted');
    const key = `${row.model}/${row.task}/${row.seed}`;
    assert.ok(!seen.has(key), 'Duplicate carried cell');
    seen.add(key);
  }
  const phases = new Set();
  for (const phase of plan.phases) {
    assert.ok(!phases.has(phase.id), 'Duplicate phase');
    phases.add(phase.id);
    const cells = schedule(taskConfig(plan, phase));
    assert.equal(cells.length, 1);
    const c = cells[0],
      key = `${c.model.id}/${c.taskId}/${c.seed}`;
    assert.equal(c.seed, 1042);
    assert.ok(plan.initialHashes[c.taskId]);
    assert.ok(!seen.has(key), 'Never repeat an attempted cell');
    seen.add(key);
  }
  assert.equal(seen.size, 306);
  return plan;
}

export function taskCampaignSummary(plan, reports, status) {
  const s = baseSummary(plan, reports, status);
  s.limitations = s.limitations.filter(
    (line) => !line.startsWith('All 37') && !line.startsWith('Partial output'),
  );
  s.limitations.push(
    'All 105 prior attempts remain unchanged in outcome and origin, including the Astra spend-limited attempt. Only 201 untouched cells are collected by this continuation; no repeats.',
    'The continuation was specified after the original worker stopped on a per-cell spend reservation. Individual caps, grading, source, order and the original $300 total remain unchanged. This disclosed scheduling amendment is not a fresh randomized experiment.',
    'A receipt-complete, verified cell-spend stop remains blocked but may advance to the next untouched cell. No partial output executes. Authentication, invalid receipts, cleanup, integrity and shared-resource ceilings still stop the worker.',
  );
  return s;
}
