import test from 'node:test';
import assert from 'node:assert/strict';
import { RampRouter } from '../runner/router.mjs';
import { episodeOutcome } from '../shared/run-outcome.mjs';
import { aggregate } from '../runner/design.mjs';

test('Router 403 is actionable provider unavailability with correlated safe receipts and no retry', async () => {
  let calls = 0;
  const router = new RampRouter({
    apiKey: 'private-error-test-key',
    fetchImpl: async () => {
      calls++;
      return new Response(
        JSON.stringify({
          error: { message: 'secret private-error-test-key', code: 'provider_unavailable' },
        }),
        {
          status: 403,
          headers: { 'x-request-id': 'router-request-403', 'x-trace-id': 'router-trace-403' },
        },
      );
    },
  });
  await assert.rejects(
    router.respond({ model: 'test-model', instructions: '', input: [], maxOutputTokens: 128 }),
    (error) => {
      assert.equal(error.code, 'provider_unavailable');
      assert.match(error.message, /Choose another model/);
      assert.match(error.message, /router-request-403/);
      assert.equal(error.receipt.httpStatus, 403);
      assert.equal(error.receipt.requestId, 'router-request-403');
      assert.equal(error.receipt.traceId, 'router-trace-403');
      assert.doesNotMatch(
        error.message + JSON.stringify(error.receipt),
        /private-error-test-key|secret/,
      );
      return true;
    },
  );
  assert.equal(calls, 1);
});

test('Router distinguishes key, credit, model, rate and capability failures without logging upstream bodies', async () => {
  for (const [status, code] of [
    [401, 'credentials_invalid'],
    [402, 'credits_exhausted'],
    [404, 'model_unavailable'],
    [429, 'provider_rate_limited'],
    [501, 'unsupported_capability'],
    [502, 'provider_error'],
  ]) {
    const router = new RampRouter({
      apiKey: 'error-test-key',
      fetchImpl: async () => new Response('secret-body-not-json', { status }),
    });
    await assert.rejects(
      router.respond({ model: 'model', input: [], maxOutputTokens: 128 }),
      (error) => {
        assert.equal(error.code, code);
        assert.equal(error.receipt.httpStatus, status);
        assert.doesNotMatch(
          error.message + JSON.stringify(error.receipt),
          /secret-body|error-test-key/,
        );
        return true;
      },
    );
  }
});

test('blocked and legacy 403 runs are not task failures or passes; completed state checks remain authoritative', () => {
  const legacy = {
    status: 'provider_error',
    steps: 0,
    error: 'Router HTTP 403; request old-request. No automatic retry.',
    evaluation: { success: false },
  };
  assert.equal(episodeOutcome(legacy).title, 'Provider unavailable');
  assert.equal(episodeOutcome(legacy).changeModel, true);
  for (const status of [
    'provider_error',
    'provider_unavailable',
    'timeout',
    'interrupted',
    'cancelled',
  ]) {
    const episode = {
      status,
      evaluation: { success: true },
      cell: { model: { id: 'model' }, mode: 'api', guide: false, history: 'full' },
    };
    assert.equal(episodeOutcome(episode).kind, 'blocked');
    assert.equal(aggregate([episode])[0].passed, 0);
  }
  assert.equal(
    episodeOutcome({ status: 'completed', evaluation: { success: false } }).title,
    'Task incomplete',
  );
  assert.equal(
    episodeOutcome({ status: 'completed', evaluation: { success: true } }).title,
    'Task passed',
  );
  assert.equal(
    episodeOutcome({ status: 'step_limit', evaluation: { success: true } }).kind,
    'passed',
  );
  assert.equal(episodeOutcome({ status: 'queued' }).kind, 'pending');
});
