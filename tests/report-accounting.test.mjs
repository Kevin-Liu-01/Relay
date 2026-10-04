import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { trialAccounting, sumAccounting } from '../scripts/lib/report-accounting.mjs';

const record = (events, estimatedUSD, usageKnown) => ({
  run: {
    budget: { estimatedUSD: 9999 },
    episodes: [
      {
        cell: { model: { rates: { input: 2, output: 6 } } },
        estimatedUSD,
        usageKnown,
      },
    ],
  },
  events: events.map((event) => ({ event })),
});
const request = { kind: 'request', step: 1, reservedUSD: 0.5 };
const usage = { inputTokens: 1000, outputTokens: 100 };
test('report accounting uses episode receipts, never the multi-episode budget', () => {
  const result = trialAccounting(
    record([request, { kind: 'response', step: 1, response: { usage } }], 0.0026, true),
  );
  assert.equal(result.acceptedUSD, 0.0026);
  assert.equal(result.reservedUSD, 0);
  assert.equal(result.inputTokens, 1000);
  assert.equal(result.requests, 1);
});
test('unknown and rejected usage retains the complete reservation, not zero cost', () => {
  const result = trialAccounting(
    record(
      [request, { kind: 'provider_error', step: 1, usageAccepted: false, receipt: { usage } }],
      0.5,
      false,
    ),
  );
  assert.equal(result.unknownRequests, 1);
  assert.equal(result.reservedUSD, 0.5);
  assert.equal(result.receipts, 0);
});
test('accepted output-limit usage is counted without converting a block into success', () => {
  assert.equal(
    trialAccounting(
      record(
        [request, { kind: 'provider_error', step: 1, usageAccepted: true, receipt: { usage } }],
        0.0026,
        true,
      ),
    ).receipts,
    1,
  );
});
test('accounting fails closed on mismatched totals, duplicate receipts and negative tokens', () => {
  const response = { kind: 'response', step: 1, response: { usage } };
  assert.throws(() => trialAccounting(record([request, response], 0.1, true)));
  assert.throws(() => trialAccounting(record([request, response, response], 0.0026, true)));
  assert.throws(() =>
    trialAccounting(
      record(
        [request, { ...response, response: { usage: { inputTokens: -1, outputTokens: 0 } } }],
        0,
        true,
      ),
    ),
  );
});
test('published accounting binds the immutable 306-cell summary and reconciles every trial', () => {
  const report = JSON.parse(readFileSync('docs/results-accounting.json'));
  const summaryBytes = readFileSync(`evidence/campaigns/${report.campaign}/summary.json`);
  assert.equal(report.summaryHash, createHash('sha256').update(summaryBytes).digest('hex'));
  assert.equal(report.trials.length, 306);
  assert.deepEqual(sumAccounting(report.trials), report.totals);
  assert.ok(Math.abs(report.totals.recordedUSD - 193.09041092) < 1e-8);
  assert.ok(Math.abs(report.totals.reservedUSD - 3.77939636) < 1e-8);
  assert.equal(report.totals.unknownRequests, 35);
  assert.equal(report.totals.requests, 4747);
  for (const trial of report.trials) {
    assert.ok(Math.abs(trial.acceptedUSD + trial.reservedUSD - trial.recordedUSD) < 1e-8);
    assert.equal(trial.receipts + trial.unknownRequests, trial.requests);
  }
});
