import assert from 'node:assert/strict';
import { counts } from './campaign-report.mjs';

// Build receipts are recorded per episode, independently of source-file hashes.
// Checking them does not rebuild or mutate the actor's served assets.
export function verifyAppProvenance(expected, observed) {
  assert.equal(observed?.ok, true, 'Recorded app health');
  assert.equal(observed.service, 'relay-app', 'Recorded app service');
  for (const field of ['backendHash', 'buildHash'])
    assert.match(observed[field] ?? '', /^[a-f0-9]{64}$/, `Recorded ${field}`);
  if (expected) assert.deepEqual(observed, expected, 'Matched served app across every episode');
  return observed;
}

// Worker-level preflight failures do not belong to an episode/block report.
// Bind that extra diagnostic to the manifest before comparing all derived data.
export function verifyRebuiltSummary(summary, rebuilt, manifest) {
  if (summary.workerError !== undefined) {
    assert.equal(summary.status, 'stopped', 'Worker error requires a stopped snapshot');
    assert.equal(manifest.status, 'stopped', 'Worker error requires a stopped manifest');
    assert.equal(typeof summary.workerError, 'string');
    assert.ok(summary.workerError.length > 0);
    assert.equal(summary.workerError, manifest.workerError, 'Worker diagnostic binding');
  }
  assert.equal(rebuilt.workerError, undefined);
  const comparable = ({ generatedAt, sourceHash, planHash, workerError, ...rest }) => rest;
  assert.deepEqual(
    comparable(summary),
    comparable(rebuilt),
    'Summary, table and accounting rebuild exactly',
  );
}

// Structural checks only. The CLI separately reopens every original archive.
export function verifyCoverage(plan, summary, { allowPartial = false } = {}) {
  assert.equal(summary.id, plan.id, 'Campaign identity');
  assert.equal(summary.trialsPerTaskModel, 1, 'One attempt per cell');
  const models = Object.keys(plan.models),
    tasks = plan.common.tasks;
  assert.equal(summary.rows.length, models.length * tasks.length, 'Full planned denominator');
  const seen = new Set();
  for (const row of summary.rows) {
    assert.ok(models.includes(row.model) && tasks.includes(row.task), 'Approved model and task');
    assert.equal(row.seed, plan.seed, 'Fixed seed');
    const key = `${row.model}/${row.task}/${row.seed}`;
    assert.ok(!seen.has(key), `Duplicate cell: ${key}`);
    seen.add(key);
    assert.ok(['passed', 'incomplete', 'blocked', 'unattempted'].includes(row.outcome));
    if (row.outcome !== 'unattempted') {
      assert.ok(/^[a-f0-9-]{36}$/.test(row.runId), 'Attempt has an original run UUID');
      assert.ok(!['queued', 'running', 'interrupted'].includes(row.status), 'Terminal attempt');
      assert.ok(Number.isFinite(row.estimatedUSD) && row.estimatedUSD >= 0, 'Recorded allowance');
    }
  }
  assert.deepEqual(summary.totals, counts(summary.rows), 'Counts derive from actual rows');
  const preserved = summary.rows.filter((r) => r.cohort === 'preserved');
  assert.deepEqual(preserved, plan.carryoverRows, 'Preserve every original result exactly');
  assert.equal(summary.preserved, preserved.length);
  const fresh = summary.rows.filter((r) => r.cohort === 'new');
  assert.equal(fresh.length, plan.newPlanned, 'Every missing cell is represented');
  for (const row of fresh) {
    assert.equal(row.originCampaign, plan.id);
    const phase = plan.phases.find((p) => p.id === row.phase);
    assert.ok(phase, 'Known new phase');
    assert.deepEqual(phase.models, [row.model]);
    assert.deepEqual(phase.tasks, [row.task]);
    assert.deepEqual(phase.seeds, [row.seed]);
  }
  const newAttempts = fresh.filter((r) => r.outcome !== 'unattempted');
  assert.equal(
    new Set(newAttempts.map((r) => r.runId)).size,
    newAttempts.length,
    'Isolated new runs',
  );
  assert.equal(summary.newlyAttempted, newAttempts.length);
  assert.equal(summary.phases.length, newAttempts.length, 'One archive per new attempt');
  assert.equal(new Set(summary.phases.map((p) => p.id)).size, summary.phases.length);
  for (const phase of summary.phases) {
    const row = newAttempts.find((r) => r.phase === phase.id);
    assert.ok(row && row.runId === phase.runId, 'Archive belongs to its attempted cell');
  }
  assert.equal(summary.byModel.length, models.length);
  assert.equal(summary.byTask.length, tasks.length);
  for (const [groups, field, values] of [
    [summary.byModel, 'model', models],
    [summary.byTask, 'task', tasks],
  ]) {
    assert.deepEqual(
      groups.map((g) => g[field]),
      values,
    );
    for (const group of groups) {
      const expected = counts(summary.rows.filter((r) => r[field] === group[field]));
      for (const [key, value] of Object.entries(expected))
        assert.equal(group[key], value, `${field}/${key}`);
      assert.equal(
        group.successRate,
        expected.attempted ? expected.passed / expected.attempted : null,
      );
    }
  }
  if (!allowPartial || summary.status === 'completed') {
    assert.equal(summary.status, 'completed', 'Collection has not completed');
    assert.equal(summary.totals.attempted, plan.planned, 'Every cell must be attempted');
    assert.equal(summary.totals.unattempted, 0, 'No unattempted cells at completion');
    assert.equal(newAttempts.length, plan.newPlanned, 'Every missing cell collected');
  }
  return {
    ...summary.totals,
    complete: summary.status === 'completed' && summary.totals.unattempted === 0,
  };
}
