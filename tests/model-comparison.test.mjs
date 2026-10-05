import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { schedule } from '../runner/design.mjs';
import { modelComparison, trialsCSV } from '../scripts/lib/model-comparison.mjs';
import { comparisonSlide, escapeHTML } from '../scripts/lib/comparison-slide.mjs';
import { createHash } from 'node:crypto';
import { retainedRequestTimeout, acceptedOutputLimit } from '../runner/campaign-policy.mjs';
import { createTaskPlan, MODEL_IDS, taskCampaignSummary } from '../scripts/lib/task-campaign.mjs';

test('per-task slide keeps twenty planned trials for every model without crowding the aggregate view', () => {
  const plan = createTaskPlan(
    { models: MODEL_IDS.map((id) => ({ id, catalogRates: { input: 2, output: 10 } })) },
    [],
  );
  const summary = taskCampaignSummary(plan, [], 'planned');
  const result = comparisonSlide(summary);
  assert.match(result.COMPARISON_STATUS, /20 per task\/model/);
  assert.equal((result.COMPARISON_TABLE.match(/trial-strip dense/g) ?? []).length, 5);
  assert.equal((result.COMPARISON_FILTER.match(/<template /g) ?? []).length, 19);
  assert.match(result.COMPARISON_FILTER, /0 \/ 20/);
  assert.equal((result.COMPARISON_TRIALS.match(/<tr(?: |>)/g) ?? []).length, 1801);
});

const plan = JSON.parse(
  readFileSync(new URL('../docs/campaigns/model-comparison-2026-10-02.json', import.meta.url)),
);
test('final campaign binds both stopped allowances, three models and 20 matched cells each', () => {
  const final = JSON.parse(
    readFileSync(
      new URL('../docs/campaigns/model-comparison-2026-10-02-final.json', import.meta.url),
    ),
  );
  let prior = 0;
  for (const binding of final.priorCampaigns) {
    const summary = JSON.parse(
      readFileSync(new URL(`../evidence/campaigns/${binding.id}/summary.json`, import.meta.url)),
    );
    assert.equal(summary.estimatedUSD, binding.recordedUSD);
    prior += summary.estimatedUSD;
  }
  assert.ok(prior + final.maxEstimatedUSD <= 3);
  assert.equal(
    final.phases.reduce((n, p) => n + p.maxEstimatedUSD, 0),
    2.72,
  );
  assert.equal(final.common.continueAfterOutputLimit, true);
  const result = modelComparison(final, []);
  assert.equal(result.rows.length, 60);
  assert.ok(result.byModel.every((m) => m.planned === 20));
  assert.ok(result.limitations.some((s) => s.includes('known usage')));
  const episode = { status: 'output_limit', usageKnown: true, outputLimitUsageAccepted: true };
  assert.equal(acceptedOutputLimit(final.common, episode), true);
  for (const patch of [
    { usageKnown: false },
    { outputLimitUsageAccepted: false },
    { cleanupError: 'failed' },
    { status: 'provider_receipt_invalid' },
  ])
    assert.equal(acceptedOutputLimit(final.common, { ...episode, ...patch }), false);
  assert.equal(acceptedOutputLimit({}, episode), false);
});
test('revised comparison preserves 20 cells per model and includes prior reserved spend in $3 allowance', () => {
  const revised = JSON.parse(
    readFileSync(
      new URL('../docs/campaigns/model-comparison-2026-10-02-reserved.json', import.meta.url),
    ),
  );
  const prior = JSON.parse(
    readFileSync(
      new URL(
        '../evidence/campaigns/model-comparison-2026-10-02-followup/summary.json',
        import.meta.url,
      ),
    ),
  );
  assert.equal(revised.priorRecordedUSD, prior.estimatedUSD);
  assert.ok(revised.maxEstimatedUSD + revised.priorRecordedUSD <= 3);
  assert.equal(
    revised.phases.reduce((n, p) => n + p.maxEstimatedUSD, 0),
    revised.maxEstimatedUSD,
  );
  assert.equal(revised.common.requestTimeoutSeconds, 90);
  assert.equal(revised.common.continueAfterRequestTimeout, true);
  const summary = modelComparison(revised, []);
  assert.equal(summary.rows.length, 60);
  assert.ok(summary.byModel.every((m) => m.planned === 20));
  assert.ok(summary.limitations.some((line) => line.includes('permit the next planned cell')));
});

test('reserved-timeout exception excludes missing reservations, cleanup failures and other errors', () => {
  const config = { continueAfterRequestTimeout: true };
  const episode = {
    status: 'timeout',
    usageKnown: false,
    estimatedUSD: 0.02,
    requestTimeoutReservationUSD: 0.01,
  };
  assert.equal(retainedRequestTimeout(config, episode), true);
  assert.equal(retainedRequestTimeout({}, episode), false);
  for (const patch of [
    { cleanupError: 'failed' },
    { status: 'provider_error' },
    { status: 'harness_error' },
    { status: 'cancelled' },
    { usageKnown: true },
    { requestTimeoutReservationUSD: 0 },
    { requestTimeoutReservationUSD: NaN },
    { requestTimeoutReservationUSD: Infinity },
    { estimatedUSD: 0.001 },
  ])
    assert.equal(retainedRequestTimeout(config, { ...episode, ...patch }), false);
});
test('follow-up: 60 fresh cells, 20 per model, three-model blocks and a separate $3 ceiling', () => {
  const followup = JSON.parse(
    readFileSync(
      new URL('../docs/campaigns/model-comparison-2026-10-02-followup.json', import.meta.url),
    ),
  );
  const summary = modelComparison(followup, []);
  assert.equal(summary.totals.planned, 60);
  assert.equal(summary.byModel.length, 3);
  assert.equal(followup.maxEstimatedUSD, 3);
  assert.equal(
    followup.phases.reduce((n, p) => n + p.maxEstimatedUSD, 0),
    3,
  );
  for (const model of summary.byModel) {
    assert.equal(model.planned, 20);
    assert.equal(model.attempted, 0);
    assert.equal(
      new Set(summary.rows.filter((r) => r.model === model.model).map((r) => `${r.task}:${r.seed}`))
        .size,
      20,
    );
  }
  for (const { id, models, ...settings } of followup.phases) {
    const config = {
      ...followup.common,
      ...settings,
      models: models.map((m) => followup.models[m]),
    };
    const cells = schedule(config);
    assert.equal(cells.length, 15);
    assert.deepEqual(cells, schedule(config));
    for (let i = 0; i < cells.length; i += 3) {
      assert.equal(new Set(cells.slice(i, i + 3).map((c) => c.block)).size, 1);
      assert.equal(new Set(cells.slice(i, i + 3).map((c) => c.model.id)).size, 3);
    }
  }
  assert.match(comparisonSlide(summary).COMPARISON_TABLE, /3-model development comparison/);
  assert.equal(trialsCSV(summary.rows).trim().split('\n').length, 61);
});

test('closed model campaigns retain their exact preregistered plans and launchers', () => {
  for (const [id, launcher] of [
    ['model-comparison-2026-10-02', 'run-model-comparison.mjs'],
    ['model-comparison-2026-10-02-followup', 'run-reviewed-campaign.mjs'],
    ['model-comparison-2026-10-02-reserved', 'run-timeout-tolerant-campaign.mjs'],
    ['model-comparison-2026-10-02-final', 'run-final-comparison.mjs'],
  ]) {
    const manifest = JSON.parse(
      readFileSync(new URL(`../evidence/campaigns/${id}/manifest.json`, import.meta.url)),
    );
    const hash = (path) =>
      createHash('sha256')
        .update(readFileSync(new URL(path, import.meta.url)))
        .digest('hex');
    assert.equal(hash(`../docs/campaigns/${id}.json`), manifest.planHash);
    assert.equal(hash(`../scripts/${launcher}`), manifest.launcherHash);
    assert.equal(manifest.phases.at(-1).safeToContinue, false);
  }
});
test('model campaign: exactly 20 matched trials per model, with complete planned denominators', () => {
  const summary = modelComparison(plan, []);
  assert.equal(summary.totals.planned, 120);
  assert.equal(summary.totals.attempted, 0);
  assert.equal(summary.totals.unattempted, 120);
  assert.equal(summary.byModel.length, 6);
  for (const m of summary.byModel) {
    assert.equal(m.planned, 20);
    assert.equal(m.successRate, null);
    assert.equal(m.medianSeconds, null);
    assert.equal(m.estimatedUSD, null);
    assert.equal(m.usageKnown, null);
    assert.equal(
      new Set(summary.rows.filter((r) => r.model === m.model).map((r) => `${r.task}:${r.seed}`))
        .size,
      20,
    );
  }
});
test('model campaign: blocks contain all six models, deterministic order, finite $6 budget', () => {
  assert.equal(
    plan.phases.reduce((n, p) => n + p.maxEstimatedUSD, 0),
    6,
  );
  for (const { id, models, ...settings } of plan.phases) {
    const config = { ...plan.common, ...settings, models: models.map((m) => plan.models[m]) };
    const cells = schedule(config);
    assert.deepEqual(cells, schedule(config));
    for (let i = 0; i < 30; i += 6) {
      assert.equal(new Set(cells.slice(i, i + 6).map((c) => c.block)).size, 1);
      assert.equal(new Set(cells.slice(i, i + 6).map((c) => c.model.id)).size, 6);
    }
  }
});
test('comparison rendering: planned cells are not fake failures, HTML is escaped and CSV keeps all rows', () => {
  const summary = modelComparison(plan, []);
  const html = comparisonSlide(summary);
  assert.equal((html.COMPARISON_TABLE.match(/class="trial-cell unattempted"/g) ?? []).length, 120);
  assert.equal((html.COMPARISON_TRIALS.match(/<tr(?: |>)/g) ?? []).length, 121);
  assert.match(html.COMPARISON_TABLE, /data-sort="">N\/A/);
  assert.equal(trialsCSV(summary.rows).trim().split('\n').length, 121);
  assert.equal(escapeHTML('<img src="x">&'), '&lt;img src=&quot;x&quot;&gt;&amp;');
});
test('comparison metrics: provider errors are blocks, unknown cost stays unsortable, no diagnostic pass', () => {
  const { id, models, ...settings } = plan.phases[0];
  const cells = schedule({
    ...plan.common,
    ...settings,
    models: models.map((m) => plan.models[m]),
  });
  const summary = modelComparison(plan, [
    {
      id,
      run: {
        id: 'test',
        status: 'stopped',
        budget: {
          estimatedUSD: 0.01,
          requests: 1,
          usageKnown: false,
          inputTokens: 0,
          outputTokens: 0,
        },
        episodes: [
          {
            cell: cells[0],
            status: 'provider_error',
            steps: 0,
            durationMs: 30000,
            estimatedUSD: 0.01,
            usageKnown: false,
            evaluation: { success: true, checks: [] },
          },
        ],
      },
      audit: { integrity: { status: 'verified' } },
    },
  ]);
  assert.equal(summary.totals.passed, 0);
  assert.equal(summary.totals.blocked, 1);
  assert.equal(summary.totals.unattempted, 119);
  assert.match(comparisonSlide(summary).COMPARISON_TABLE, /data-sort="">Unknown/);
  assert.doesNotMatch(comparisonSlide(summary).COMPARISON_TABLE, /≥/);
});
