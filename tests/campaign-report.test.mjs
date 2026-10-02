import test from 'node:test';
import assert from 'node:assert/strict';
import { campaignSummary } from '../scripts/lib/campaign-report.mjs';
import { DEFAULT_CONFIG, schedule } from '../runner/design.mjs';
const plan = {
  id: 'test',
  models: { 'scripted-reference': DEFAULT_CONFIG.models[0] },
  common: {
    ...DEFAULT_CONFIG,
    interfaces: ['api'],
    tasks: ['channel-topic'],
    seeds: [42, 43, 44, 45],
  },
  phases: [
    { id: 'workflows', models: ['scripted-reference'] },
    { id: 'future', models: ['scripted-reference'] },
  ],
};
test('campaign accounting retains failures and unattempted cells; blocked grades never count as passes', () => {
  const cells = schedule({ ...plan.common, models: DEFAULT_CONFIG.models });
  const episodes = cells.map((cell, i) => ({
    cell,
    status: ['completed', 'step_limit', 'provider_error', 'queued'][i],
    evaluation: { success: i !== 1, checks: [] },
    steps: i === 3 ? 0 : 2,
  }));
  const run = {
    id: 'run',
    status: 'stopped',
    budget: {
      estimatedUSD: 0.25,
      usageKnown: false,
      requests: 5,
      inputTokens: 10,
      outputTokens: 4,
    },
    episodes,
  };
  const result = campaignSummary(plan, [
    { id: 'workflows', run, audit: { integrity: { status: 'verified' } } },
  ]);
  assert.equal(result.totals.planned, 8);
  assert.equal(result.totals.attempted, 3);
  assert.equal(result.totals.passed, 1);
  assert.equal(result.totals.incomplete, 1);
  assert.equal(result.totals.blocked, 1);
  assert.equal(result.totals.unattempted, 5);
  assert.equal(result.usageKnown, false);
  assert.equal(result.estimatedUSD, 0.25);
});
test('campaign report counts attempted actions and parser failures without treating them as mutations', () => {
  const cells = schedule({ ...plan.common, models: DEFAULT_CONFIG.models });
  const run = {
    id: 'run',
    status: 'completed',
    budget: { estimatedUSD: 0, usageKnown: true, requests: 1, inputTokens: 1, outputTokens: 1 },
    episodes: [
      {
        cell: cells[0],
        status: 'step_limit',
        steps: 2,
        captureWarnings: [{}],
        evaluation: { success: false, checks: [{ name: 'exact_state', passed: false }] },
      },
    ],
  };
  const result = campaignSummary(plan, [
    {
      id: 'workflows',
      run,
      audit: { integrity: { status: 'verified' } },
      traces: {
        [cells[0].episodeId]: [
          { kind: 'step', error: 'JSON', action: null },
          { kind: 'step', error: 'bad target', action: { type: 'click' } },
        ],
      },
    },
  ]);
  assert.equal(result.rows[0].invalidJSON, 1);
  assert.equal(result.rows[0].rejectedActions, 2);
  assert.deepEqual(result.rows[0].failedChecks, ['exact_state']);
  assert.equal(result.totals.captureWarnings, 1);
});
