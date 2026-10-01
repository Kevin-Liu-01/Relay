import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { Writable } from 'node:stream';
import { createHash } from 'node:crypto';
import { TypeSafeRouter, actionCandidates } from '../runner/typesafe.mjs';
import { DEFAULT_CONFIG, validateConfig } from '../runner/design.mjs';
import { hostedConfig, flushStream } from '../hosted/service.mjs';
import { createLiveServer } from '../hosted/local.mjs';
import { testPricing } from './fixtures/pricing.mjs';

const observation = {
  interface: 'json-ui',
  text: 'Workspace',
  elements: [
    { ref: 'e1', role: 'button', name: 'Edit channel topic' },
    { ref: 'e2', role: 'textbox', name: 'Channel topic' },
    { ref: 'e3', role: 'button', name: 'Save', disabled: true },
  ],
};
const input = {
  model: 'jev-latest',
  instruction: 'Set topic to “Release ready”.',
  observation,
  turns: [],
  guide: false,
  history: 'recent-4',
};
const config = (provider = 'ramp') => ({
  ...DEFAULT_CONFIG,
  provider,
  models: [
    {
      id: provider === 'typesafe' ? 'jev-latest' : 'gpt-4o-mini',
      rates: { input: 0.1, output: provider === 'typesafe' ? 0 : 0.5 },
    },
  ],
  interfaces: ['json-ui'],
  maxSteps: 8,
  maxRequests: 16,
  runSeconds: 90,
  episodeSeconds: 45,
  maxEstimatedUSD: 0.25,
});

test('hosted evidence delivery drains between large artifacts and honors cancellation', async () => {
  let flushed = 0;
  const res = new Writable({
    highWaterMark: 1024,
    write(chunk, encoding, done) {
      setImmediate(() => {
        flushed += chunk.length;
        done();
      });
    },
  });
  const abort = new AbortController();
  try {
    for (let i = 0; i < 4; i++) {
      res.write(Buffer.alloc(1024 * 1024));
      await flushStream(res, abort.signal);
      assert.equal(res.writableLength, 0);
      assert.equal(flushed, (i + 1) * 1024 * 1024);
    }
    res.write(Buffer.alloc(2048));
    const pending = flushStream(res, abort.signal);
    abort.abort();
    await assert.rejects(pending, { name: 'AbortError' });
    await assert.rejects(flushStream(res, abort.signal), { name: 'AbortError' });
  } finally {
    res.destroy();
  }
});

test('Jev candidates use disclosed controls and task quotes, not hidden state or task IDs', () => {
  const a = actionCandidates(input.instruction, observation);
  assert.ok(a.some((c) => c.action.type === 'fill' && c.action.text === 'Release ready'));
  assert.ok(!a.some((c) => c.action.ref === 'e3'));
  assert.ok(a.some((c) => c.action.type === 'finish'));
  assert.deepEqual(a, actionCandidates(input.instruction, observation));
  assert.throws(() => actionCandidates(input.instruction, { interface: 'pixels' }), /text UI/);
  assert.throws(
    () =>
      actionCandidates(input.instruction, {
        ...observation,
        elements: Array.from({ length: 256 }, (_, i) => ({
          role: 'button',
          name: `Button ${i}`,
          ref: `e${i}`,
        })),
      }),
    /255/,
  );
});
test('Jev config rejects pixel/API conditions, zero input pricing and text-composition tasks', () => {
  assert.equal(validateConfig(config('typesafe')).provider, 'typesafe');
  for (const change of [
    { interfaces: ['pixels'] },
    { interfaces: ['api'] },
    { tasks: ['handoff-dm'] },
    { models: [{ id: 'jev-latest', rates: { input: 0, output: 0 } }] },
  ])
    assert.throws(() => validateConfig({ ...config('typesafe'), ...change }));
});
test('Jev sends exact Choice body to official host with no hidden retry and records full probabilities', async () => {
  let request,
    calls = 0;
  const router = new TypeSafeRouter({
    apiKey: 'private-test-key',
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url, 'https://api.typesafe.ai/v1/systemone');
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers.authorization, `Bearer ${router.apiKey}`);
      request = JSON.parse(options.body);
      const names = Object.keys(request.questions.action.criteria);
      return new Response(
        JSON.stringify({
          model: 'jev-1.13.0',
          answers: {
            action: {
              type: 'choice',
              choice: names[0],
              confidence: 0.9,
              probabilities: Object.fromEntries(names.map((n, i) => [n, i === 0 ? 1 : 0])),
            },
          },
          usage: { input_tokens: 200, output_tokens: 10 },
        }),
      );
    },
  });
  const prepared = router.prepare(input),
    result = await router.respond({ prepared });
  assert.deepEqual(request, prepared.body);
  assert.equal(calls, 1);
  assert.equal(result.returnedModel, 'jev-1.13.0');
  assert.equal(
    result.requestHash,
    createHash('sha256').update(JSON.stringify(request)).digest('hex'),
  );
  assert.equal(
    result.decision.candidates.length,
    Object.keys(request.questions.action.criteria).length,
  );
  assert.equal(result.usage.outputTokens, 10);
  assert.ok(!JSON.stringify(result).includes('private-test-key'));
});
test('Jev fails closed on invented choices, incomplete probabilities and HTTP errors', async () => {
  for (const invalid of [
    null,
    { type: 'choice', choice: 'invented', confidence: 1, probabilities: { invented: 1 } },
  ]) {
    const router = new TypeSafeRouter({
      apiKey: 'private-test-key',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            model: 'jev',
            answers: { action: invalid },
            usage: { input_tokens: 100, output_tokens: 0 },
          }),
        ),
    });
    await assert.rejects(router.respond({ prepared: router.prepare(input) }), /Invalid TypeSafe/);
  }
  let calls = 0;
  const router = new TypeSafeRouter({
    apiKey: 'private-test-key',
    fetchImpl: async () => {
      calls++;
      return new Response('private-test-key', { status: 429 });
    },
  });
  await assert.rejects(
    router.respond({ prepared: router.prepare(input) }),
    (e) => e.message.includes('429') && !e.message.includes('private-test-key'),
  );
  assert.equal(calls, 1);
});
test('hosted limits reject free public compute, arbitrary endpoints, large matrices and excessive budgets', () => {
  assert.equal(hostedConfig(config()).provider, 'ramp');
  assert.equal(hostedConfig({ ...config(), maxOutputTokens: 4096 }).maxOutputTokens, 4096);
  for (const c of [
    DEFAULT_CONFIG,
    { ...config(), endpoint: 'http://localhost' },
    { ...config(), maxSteps: 81 },
    { ...config(), runSeconds: 191 },
    { ...config(), episodeSeconds: 181 },
    { ...config(), maxEstimatedUSD: 5.01 },
    { ...config(), maxOutputTokens: 4097 },
    { ...config(), interfaces: ['api', 'a11y', 'json-ui'], guides: [true, false] },
  ])
    assert.throws(() => hostedConfig(c));
});
test('public HTTP boundary requires same origin, correct provider and bounded JSON before transport', async () => {
  let calls = 0;
  const server = createLiveServer({
    pricingResolver: testPricing,
    routerFactory: () => ({
      models: async () => {
        calls++;
        return { models: [{ id: 'gpt-4o-mini' }] };
      },
    }),
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const supplied of [undefined, 'https://evil.example']) {
      const r = await fetch(`${origin}/api/relay?op=models`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(supplied ? { origin: supplied } : {}) },
        body: JSON.stringify({ provider: 'ramp', key: 'private-test-key' }),
      });
      assert.equal(r.status, 400);
    }
    assert.equal(calls, 0);
    const body = { provider: 'ramp', key: 'private-test-key' };
    for (const b of [
      { ...body, endpoint: 'https://evil.example' },
      { ...body, key: 'x'.repeat(33000) },
    ]) {
      const r = await fetch(`${origin}/api/relay?op=models`, {
        method: 'POST',
        headers: { origin, 'content-type': 'application/json' },
        body: JSON.stringify(b),
      });
      assert.equal(r.status, 400);
    }
    assert.equal(calls, 0);
    const r = await fetch(`${origin}/api/relay?op=models`, {
      method: 'POST',
      headers: { origin, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    assert.equal(r.status, 200);
    assert.equal(calls, 1);
    assert.ok(!(await r.text()).includes(body.key));
    assert.equal((await fetch(`${origin}/api/relay?op=history`)).status, 404);
    const settingsResponse = await fetch(`${origin}/api/relay?op=config`);
    assert.equal(settingsResponse.status, 200);
    const settings = await settingsResponse.json();
    assert.equal(settings.defaults.maxOutputTokens, 4096);
    assert.equal(settings.defaults.maxEstimatedUSD, 2);
    assert.equal(settings.limits.maxEstimatedUSD, 5);
    assert.equal(settings.defaults.episodeSeconds, 180);
    assert.equal(settings.defaults.maxSteps, 40);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});
