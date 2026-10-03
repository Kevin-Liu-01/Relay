import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { schedule } from '../runner/design.mjs';
import { modelComparison, trialsCSV } from '../scripts/lib/model-comparison.mjs';
import { comparisonSlide, escapeHTML } from '../scripts/lib/comparison-slide.mjs';

const plan = JSON.parse(
  readFileSync(new URL('../docs/campaigns/model-comparison-2026-10-02.json', import.meta.url)),
);
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
  assert.equal((html.COMPARISON_TRIALS.match(/<tr>/g) ?? []).length, 121);
  assert.match(html.COMPARISON_TABLE, /data-sort="">—/);
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
