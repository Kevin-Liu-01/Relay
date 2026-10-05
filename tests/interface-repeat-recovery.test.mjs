import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlan,
  MODELS,
  cellConfig,
  studySummary,
  remainingAllowance,
} from '../scripts/lib/interface-repeat-study.mjs';
import {
  summarizeCell,
  assertContinuationPrefix,
} from '../scripts/lib/interface-repeat-recovery.mjs';
import { campaignSummary } from '../scripts/lib/campaign-report.mjs';
import { schedule } from '../runner/design.mjs';
import { retainedRequestTimeout } from '../runner/campaign-policy.mjs';

const plan = createPlan({
  models: MODELS.map((id) => ({
    id,
    catalogRates: { input: 2, output: 10 },
    imageInput: true,
    reasoningEfforts: ['low'],
  })),
});
function fixture(phase, timeout = false) {
  const config = cellConfig(plan, phase);
  const episode = {
    cell: schedule(config)[0],
    status: timeout ? 'timeout' : 'completed',
    steps: timeout ? 33 : 4,
    durationMs: timeout ? 180201 : 14000,
    estimatedUSD: timeout ? 0.230716 : 0.02,
    usageKnown: !timeout,
    ...(timeout ? { requestTimeoutReservationUSD: 0.127276 } : {}),
    evaluation: { success: !timeout, checks: [{ name: 'reply', passed: !timeout }] },
  };
  const trace = timeout
    ? [
        { kind: 'request', step: 34, reservedUSD: 0.127276 },
        { kind: 'provider_error', step: 34, usageAccepted: false },
      ]
    : [];
  return {
    run: {
      id: 'f65e4b6f-d462-4d5c-986a-19e14d7ba8f8',
      status: 'completed',
      config,
      episodes: [episode],
      budget: {
        estimatedUSD: episode.estimatedUSD,
        usageKnown: !timeout,
        requests: timeout ? 34 : 4,
        inputTokens: 41575,
        outputTokens: 2029,
      },
    },
    episodes: [{ episode, trace }],
    integrity: { status: 'verified', gaps: [] },
  };
}

test('reproduces the reporting seam failure, then reports the same timeout without altering it', () => {
  const phase = plan.phases[0],
    audit = fixture(phase, true),
    before = structuredClone(audit);
  assert.throws(
    () => campaignSummary({ ...plan, phases: [phase], common: audit.run.config }, []),
    /Unknown configuration fields/,
  );
  const report = summarizeCell(plan, phase, audit.run.config, audit);
  assert.equal(report.totals.attempted, 1);
  assert.equal(report.totals.blocked, 1);
  assert.equal(report.rows[0].actionAttempts, 33);
  assert.equal(report.rows[0].durationMs, 180201);
  assert.equal(report.estimatedUSD, 0.230716);
  assert.equal(report.reservedUSD, 0.127276);
  assert.ok(retainedRequestTimeout(audit.run.config, audit.episodes[0].episode));
  assert.deepEqual(audit, before);
  const summary = studySummary(plan, [report], 'recovered');
  assert.equal(summary.rows[0].repetition, 1);
  assert.equal(summary.totals.unattempted, 47);
  assert.ok(Math.abs(remainingAllowance(plan, [report]) - 24.769284) < 1e-8);
});

test('every planned phase can pass through execution config and reporting with both repetition labels', () => {
  for (const phase of plan.phases) {
    const audit = fixture(phase);
    const report = summarizeCell(plan, phase, audit.run.config, audit);
    assert.equal(report.totals.passed, 1);
    assert.equal(report.rows[0].model, phase.models[0]);
    assert.equal(report.rows[0].task, phase.tasks[0]);
    assert.equal(report.rows[0].interface, phase.interfaces[0]);
  }
});

test('metadata repair cannot hide new config fields, changed limits or substituted phases', () => {
  const phase = plan.phases[0],
    audit = fixture(phase);
  assert.throws(() => summarizeCell(plan, { ...phase, typo: true }, audit.run.config, audit));
  assert.throws(() =>
    summarizeCell(plan, phase, { ...audit.run.config, episodeSeconds: 600 }, audit),
  );
  assert.throws(() => summarizeCell(plan, phase, { ...audit.run.config, repetition: 1 }, audit));
});

test('continuation requires a sealed exact prefix, unique runs and the original wall-clock start', () => {
  const prefix = {
    createdAt: '2026-10-05T20:18:30.673Z',
    phases: plan.phases.slice(0, 2).map((phase, i) => ({
      id: phase.id,
      repetition: phase.repetition,
      config: cellConfig(plan, phase),
      runId: i ? 'second-run' : 'f65e4b6f-d462-4d5c-986a-19e14d7ba8f8',
      safeToContinue: true,
      finishedAt: '2026-10-05T21:00:00Z',
      archive: {},
    })),
  };
  assertContinuationPrefix(plan, prefix);
  for (const edit of [
    (m) => m.phases.reverse(),
    (m) => (m.phases[1].id = 'cell-003'),
    (m) => (m.phases[1].runId = m.phases[0].runId),
    (m) => (m.phases[1].safeToContinue = false),
    (m) => (m.phases[1].config.episodeSeconds = 600),
    (m) => (m.createdAt = '2026-10-05T21:00:00Z'),
  ]) {
    const m = structuredClone(prefix);
    edit(m);
    assert.throws(() => assertContinuationPrefix(plan, m));
  }
});
