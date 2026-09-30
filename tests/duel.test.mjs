import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duelVerdict } from '../src/live/duel-policy.js';
function record(success = true) {
  return {
    run: {
      sourceHash: 'source',
      config: { maxSteps: 8, maxEstimatedUSD: 0.1 },
      episodes: [
        {
          cell: {
            taskId: 'channel-topic',
            seed: 42,
            mode: 'a11y',
            guide: false,
            history: 'recent-4',
          },
          initialHash: 'state',
          appProvenance: { backendHash: 'backend', buildHash: 'build' },
          status: 'completed',
          evaluation: { success },
        },
      ],
    },
  };
}
test('1v1 outcome requires matched completed evidence, not speed or model name', () => {
  assert.equal(duelVerdict([record(), record()]).label, 'Both passed');
  assert.equal(duelVerdict([record(false), record(false)]).label, 'Neither completed the task');
  assert.equal(duelVerdict([record(), record(false)]).winner, 0);
  assert.equal(duelVerdict([record(false), record()]).winner, 1);
  assert.equal(duelVerdict([null, null]).kind, 'waiting');
});
test('1v1 fails closed on source, state, condition and budget mismatches', () => {
  for (const change of [
    (r) => (r.run.sourceHash = 'other'),
    (r) => delete r.run.sourceHash,
    (r) => (r.run.episodes[0].initialHash = 'other'),
    (r) => (r.run.episodes[0].appProvenance.buildHash = 'other'),
    (r) => (r.run.episodes[0].cell.mode = 'api'),
    (r) => (r.run.episodes[0].cell.seed = 43),
    (r) => (r.run.config.maxSteps = 12),
  ]) {
    const other = record(false);
    change(other);
    assert.equal(duelVerdict([record(), other]).kind, 'error');
  }
});
test('1v1 errors and missing grader receipts are inconclusive, not model losses', () => {
  assert.equal(duelVerdict([{ error: 'Connection failed' }, null]).kind, 'error');
  for (const status of ['provider_error', 'budget', 'interrupted', 'cancelled']) {
    const other = record(false);
    other.run.episodes[0].status = status;
    assert.equal(duelVerdict([record(), other]).kind, 'error');
  }
  const other = record(false);
  delete other.run.episodes[0].evaluation;
  assert.equal(duelVerdict([record(), other]).kind, 'error');
});
