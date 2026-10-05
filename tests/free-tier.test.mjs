import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import {
  createFreeTier,
  FREE_MODELS,
  FREE_LIMITS,
  RESERVE_SCRIPT,
  freeCatalog,
  freeRunConfig,
  visitorAddress,
} from '../hosted/free-tier.mjs';
import { hostedConfig } from '../hosted/service.mjs';
import { createLiveServer } from '../hosted/local.mjs';

const env = {
  RELAY_FREE_ENABLED: '1',
  RELAY_FREE_RAMP_KEY: 'private-owner-test-key',
  RELAY_FREE_VISITOR_SECRET: 'private-test-salt'.repeat(3),
  KV_REST_API_URL: 'https://relay-test.upstash.io',
  KV_REST_API_TOKEN: 'private-redis-test-token',
};
const req = (ip = '192.0.2.10') => ({ headers: {}, socket: { remoteAddress: ip } });
const now = () => new Date('2026-10-05T10:00:00Z');
const selection = { access: 'free', model: 'gpt-6-luna', task: 'channel-topic', interface: 'a11y' };
const catalog = {
  models: [
    { id: 'gpt-6-luna', rates: { input: 0.1, output: 0.5 } },
    { id: 'gpt-4o-mini', rates: { input: 0.15, output: 0.6 } },
    { id: 'expensive', rates: { input: 8, output: 40 } },
    { id: 'unreviewed-cheap', rates: { input: 0.01, output: 0.02 } },
  ],
};

test('free plan has one fixed cell and strict cheap-model prices', () => {
  const config = hostedConfig(freeRunConfig(selection));
  assert.equal(config.maxEstimatedUSD, 0.05);
  assert.equal(config.maxSteps, 20);
  assert.equal(config.maxRequests, 20);
  assert.equal(config.maxOutputTokens, 2048);
  assert.deepEqual(config.seeds, [42]);
  assert.deepEqual(config.histories, ['recent-4']);
  assert.equal(config.repeats, 1);
  assert.deepEqual(
    freeCatalog(catalog).models.map((m) => m.id),
    ['gpt-6-luna', 'gpt-4o-mini'],
  );
  for (const rates of [
    null,
    { input: 0, output: 0 },
    { input: NaN, output: 0.1 },
    { input: 0.15001, output: 0.1 },
    { input: 0.1, output: 0.60001 },
  ])
    assert.equal(freeCatalog({ models: [{ id: FREE_MODELS[0], rates }] }).models.length, 0);
  for (const change of [
    { model: 'expensive' },
    { task: '__proto__' },
    { task: 'invented' },
    { interface: 'pixels' },
  ])
    assert.throws(() => freeRunConfig({ ...selection, ...change }));
});

test('free access needs every server-only secret, opt-in, and a secure Redis endpoint', async () => {
  assert.equal(createFreeTier({ env }).enabled, true);
  for (const key of Object.keys(env)) {
    const copy = { ...env };
    delete copy[key];
    const tier = createFreeTier({ env: copy });
    assert.equal(tier.enabled, false, key);
    await assert.rejects(tier.reserve(req()), /temporarily unavailable/);
    assert.equal(tier.key, undefined);
  }
  assert.equal(
    createFreeTier({ env: { ...env, KV_REST_API_URL: 'http://localhost' } }).enabled,
    false,
  );
  const publicConfig = JSON.stringify(createFreeTier({ env }).publicConfig);
  assert.ok(!publicConfig.includes('private-'));
  assert.deepEqual(FREE_LIMITS, { dailyUSD: 5, runUSD: 0.05, visitorRuns: 3 });
});

test('visitor identity uses only the trusted edge address and groups IPv6 privacy addresses', () => {
  assert.equal(
    visitorAddress({ ...req(), headers: { 'x-forwarded-for': '192.0.2.99' } }, false),
    '192.0.2.10',
  );
  assert.equal(
    visitorAddress({ headers: { 'x-vercel-forwarded-for': '192.0.2.11' } }, true),
    '192.0.2.11',
  );
  assert.throws(() => visitorAddress({ headers: { 'x-forwarded-for': '192.0.2.11' } }, true));
  assert.throws(() =>
    visitorAddress({ headers: { 'x-vercel-forwarded-for': '192.0.2.11, 192.0.2.12' } }, true),
  );
  assert.equal(
    visitorAddress(req('2001:db8:abcd:0001::11'), false),
    visitorAddress(req('2001:0db8:abcd:1:8888::20'), false),
  );
  assert.equal(visitorAddress(req('::ffff:192.0.2.11'), false), '192.0.2.11');
});

test('one durable atomic reservation carries integer caps; no raw IP or provider key enters Redis', async () => {
  const commands = [];
  const tier = createFreeTier({
    env,
    now,
    fetchImpl: async (url, options) => {
      commands.push(JSON.parse(options.body));
      assert.equal(url, env.KV_REST_API_URL);
      assert.equal(options.redirect, 'error');
      assert.equal(options.headers.authorization, `Bearer ${env.KV_REST_API_TOKEN}`);
      assert.ok(options.signal);
      assert.ok(!options.body.includes('192.0.2.10'));
      assert.ok(!options.body.includes(env.RELAY_FREE_RAMP_KEY));
      return Response.json({ result: [1, 5, 1] });
    },
  });
  assert.deepEqual(await tier.reserve(req()), {
    remaining: 2,
    reservedUSD: 0.05,
    resets: '00:00 UTC',
  });
  assert.deepEqual(commands[0].slice(0, 4), [
    'EVAL',
    RESERVE_SCRIPT,
    '2',
    'relay:free:2026-10-05:total',
  ]);
  assert.match(commands[0][4], /^relay:free:2026-10-05:visitor:[a-f0-9]{64}$/);
  assert.deepEqual(commands[0].slice(5), ['5', '500', '3', '172800']);
  const restarted = createFreeTier({
    env,
    now,
    fetchImpl: async (_url, options) => {
      assert.deepEqual(JSON.parse(options.body), commands[0]);
      return Response.json({ result: [0, 1, 3] });
    },
  });
  await assert.rejects(
    restarted.reserve(req()),
    (e) => e.status === 429 && /3 free/.test(e.message),
  );
});

test('unavailable, corrupt and uncertain counters fail closed without retrying or refunding', async () => {
  for (const response of [
    { result: [0, 2, 1] },
    { result: [-1, 0, 0] },
    { error: 'private redis details' },
    { result: [1, 505, 1] },
    { result: [1, 5, 4] },
    { result: ['1', 5, 1] },
    { result: null },
    null,
  ]) {
    let calls = 0;
    const tier = createFreeTier({
      env,
      now,
      fetchImpl: async () => {
        calls++;
        if (response === null) throw Error('private transport details');
        return Response.json(response);
      },
    });
    await assert.rejects(
      tier.reserve(req()),
      (e) => [429, 503].includes(e.status) && !/private/.test(e.message),
    );
    assert.equal(calls, 1);
  }
});

test('public free boundary rejects overrides before quota or transport; BYOK never falls back', async () => {
  let calls = 0,
    reservations = 0;
  const seenKeys = [];
  const server = createLiveServer({
    freeTier: {
      enabled: true,
      key: env.RELAY_FREE_RAMP_KEY,
      publicConfig: { enabled: true, ...FREE_LIMITS },
      reserve: async () => {
        reservations++;
        throw Object.assign(new Error('stop'), { status: 503 });
      },
    },
    pricingResolver: async (_provider, catalog) => catalog,
    routerFactory: (_provider, key) => {
      seenKeys.push(key);
      return {
        models: async () => {
          calls++;
          return catalog;
        },
      };
    },
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const post = (op, body, header = origin) =>
    fetch(`${origin}/api/relay?op=${op}`, {
      method: 'POST',
      headers: { origin: header, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  try {
    for (const extra of [
      { key: 'attacker-key' },
      { provider: 'typesafe' },
      { config: {} },
      { maxEstimatedUSD: 500 },
      { prompt: 'hello' },
      { seed: 99 },
      { endpoint: 'https://other.example' },
    ])
      assert.equal((await post('run', { ...selection, ...extra })).status, 400);
    for (const change of [{ interface: 'pixels' }, { model: 'expensive' }, { task: 'invented' }])
      assert.equal((await post('run', { ...selection, ...change })).status, 400);
    assert.equal((await post('models', { access: 'free' }, 'https://other.example')).status, 400);
    assert.equal(calls, 0);
    assert.equal(reservations, 0);
    const response = await post('models', { access: 'free' });
    assert.equal(response.status, 200);
    assert.deepEqual((await response.json()).models, catalog.models.slice(0, 2));
    assert.deepEqual(seenKeys, [env.RELAY_FREE_RAMP_KEY]);
    assert.equal((await post('models', { access: 'byok', provider: 'ramp' })).status, 400);
    assert.equal(seenKeys.length, 1);
    const own = await post('models', {
      access: 'byok',
      provider: 'ramp',
      key: 'private-visitor-key',
    });
    assert.equal((await own.json()).models.length, 4);
    assert.equal(seenKeys.at(-1), 'private-visitor-key');
    const rejected = await post('run', selection);
    assert.equal(reservations, 1);
    assert.ok(!(await rejected.text()).includes(env.RELAY_FREE_RAMP_KEY));
    assert.equal(calls, 2, 'no upstream call after a rejected reservation');
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});

test(
  'pending quota admissions hold worker slots, and a disconnected client cannot start model work',
  { timeout: 5000 },
  async () => {
    let models = 0;
    const pending = [];
    const admitted = Promise.withResolvers();
    const closed = [];
    const server = createLiveServer({
      freeTier: {
        enabled: true,
        key: env.RELAY_FREE_RAMP_KEY,
        publicConfig: { enabled: true },
        reserve: () =>
          new Promise((resolve) => {
            pending.push(resolve);
            if (pending.length === 2) admitted.resolve();
          }),
      },
      pricingResolver: async (_provider, catalog) => catalog,
      routerFactory: () => ({
        models: async () => {
          models++;
          return catalog;
        },
      }),
    });
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    server.on('request', (_req, res) => {
      if (closed.length < 2) closed.push(new Promise((resolve) => res.once('close', resolve)));
    });
    const origin = `http://127.0.0.1:${server.address().port}`;
    const controllers = [new AbortController(), new AbortController()];
    const post = (signal) =>
      fetch(`${origin}/api/relay?op=run`, {
        method: 'POST',
        signal,
        headers: { origin, 'content-type': 'application/json' },
        body: JSON.stringify(selection),
      });
    const clients = controllers.map((c) => post(c.signal).catch(() => null));
    try {
      await admitted.promise;
      const busy = await post();
      assert.equal(busy.status, 429);
      assert.equal(pending.length, 2, 'busy request never reserves quota');
      controllers.forEach((c) => c.abort());
      await Promise.all(clients);
      await Promise.all(closed);
      pending.forEach((release) => release({ remaining: 2 }));
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(models, 0);
    } finally {
      controllers.forEach((c) => c.abort());
      pending.forEach((release) => release({ remaining: 2 }));
      server.closeAllConnections();
      await new Promise((r) => server.close(r));
    }
  },
);
