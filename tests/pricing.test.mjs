import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parsePricing,
  createPricingResolver,
  applyCatalogRates,
  PRICING_URLS,
} from '../hosted/pricing.mjs';
import { createConnections, preferredModel } from '../src/live/connections.js';
import { testPricing } from './fixtures/pricing.mjs';

const rampDoc =
  '`gpt-4o-mini`</DocModelName> | $0.15 | $0.60 |\n`future-model`</DocModelName> | $1.2 | $3.4 |\n## Deprecated models\n`retired-model`</DocModelName> | $2 | $4 |';
const jevDoc =
  '| Jev 1.13 | `jev-1.13.0` |\n| Price (per Btok / per Mtok) | \\$42 / \\$0.042 |\nOutput tokens are free.\n| `jev-latest` | `jev-1.13.0` | Stable |\n| `jev-preview` | `jev-2.0.0` | Unpriced |';

test('pricing parses exact documented IDs, Jev aliases and token units, excluding retired/unknown aliases', () => {
  assert.deepEqual(parsePricing('ramp', rampDoc).rates, {
    'gpt-4o-mini': { input: 0.15, output: 0.6 },
    'future-model': { input: 1.2, output: 3.4 },
  });
  assert.deepEqual(parsePricing('typesafe', jevDoc).rates, {
    'jev-1.13.0': { input: 0.042, output: 0 },
    'jev-latest': { input: 0.042, output: 0 },
  });
  for (const bad of ['', rampDoc.replaceAll('$0.15', '$0'), rampDoc.replaceAll('$0.15', '$1001')])
    assert.throws(() => parsePricing('ramp', bad));
  assert.throws(() => parsePricing('typesafe', jevDoc.replace('Output tokens are free.', '')));
});

test('public pricing loads once for concurrent callers without credentials and refreshes after TTL', async () => {
  let calls = 0,
    now = Date.parse('2026-09-30T23:59:00Z');
  const resolve = createPricingResolver({
    now: () => now,
    fetchImpl: async (url, options) => {
      calls++;
      assert.equal(url, PRICING_URLS.ramp);
      assert.equal(options.headers, undefined);
      assert.equal(options.body, undefined);
      assert.equal(options.redirect, 'error');
      return new Response(rampDoc);
    },
  });
  const catalog = {
    hash: 'provider-hash',
    models: [{ id: 'future-model' }, { id: 'openai:gpt-4o-mini' }, { id: 'unknown' }],
  };
  const [a, b] = await Promise.all([resolve('ramp', catalog), resolve('ramp', catalog)]);
  assert.equal(calls, 1);
  assert.deepEqual(a, b);
  assert.deepEqual(a.models[0].rates, { input: 1.2, output: 3.4 });
  assert.equal(a.models[1].rates, null);
  assert.equal(a.models[2].rates, null);
  assert.equal(a.hash, 'provider-hash');
  assert.match(a.pricing.hash, /^[a-f0-9]{64}$/);
  await resolve('ramp', catalog);
  assert.equal(calls, 1);
  now += 300_001;
  await resolve('ramp', catalog);
  assert.equal(calls, 2);
});

test('pricing outages use a dated bounded fallback and never guess unknown or expired rates', async () => {
  let now = Date.parse('2026-09-30T23:59:00Z');
  const resolve = createPricingResolver({
    now: () => now,
    fetchImpl: async () => {
      throw Error('offline');
    },
  });
  const catalog = { models: [{ id: 'gpt-4o-mini' }, { id: 'unknown' }] };
  const a = await resolve('ramp', catalog);
  assert.equal(a.pricing.status, 'snapshot');
  assert.deepEqual(a.models[0].rates, { input: 0.15, output: 0.6 });
  assert.equal(a.models[1].rates, null);
  now += 8 * 86400000;
  assert.ok((await resolve('ramp', catalog)).models.every((m) => m.rates === null));
});

test('server catalog rates replace browser-supplied prices; unavailable models cannot run', async () => {
  const catalog = await testPricing('ramp', { models: [{ id: 'gpt-4o-mini' }, { id: 'unknown' }] });
  const config = {
    models: [{ id: 'gpt-4o-mini', rates: { input: 1e-9, output: 1e-9 }, vision: true }],
  };
  assert.deepEqual(applyCatalogRates(config, catalog).models[0], {
    id: 'gpt-4o-mini',
    rates: { input: 0.15, output: 0.6 },
    vision: true,
  });
  assert.throws(() => applyCatalogRates({ models: [{ id: 'unknown' }] }, catalog), /Pricing/);
  assert.throws(
    () => applyCatalogRates({ models: [{ id: 'absent' }] }, catalog),
    /account catalog/,
  );
  assert.equal(preferredModel(catalog.models, 'ramp'), 'gpt-4o-mini');
  assert.equal(preferredModel([{ id: 'unknown', rates: null }], 'ramp'), '');
});

test('connections share pending/completed metadata across lanes but isolate providers and keys', async () => {
  let calls = 0;
  const client = createConnections(async (_url, options) => {
    calls++;
    const body = JSON.parse(options.body);
    return new Response(JSON.stringify({ models: [{ id: body.provider + '-model' }] }));
  });
  const first = client.get('ramp', 'fake-key-one');
  assert.equal(client.get('ramp', 'fake-key-one'), first);
  await first;
  assert.equal(client.get('ramp', 'fake-key-one'), first);
  await client.get('ramp', 'fake-key-two');
  await client.get('typesafe', 'fake-key-one');
  assert.equal(calls, 3);
  client.forget('ramp');
  await client.get('typesafe', 'fake-key-one');
  assert.equal(calls, 3);
  await client.get('ramp', 'fake-key-one');
  assert.equal(calls, 4);
  client.close();
});

test('failed or forgotten connections cannot populate the cache and may be retried', async () => {
  let calls = 0,
    finish;
  const client = createConnections(async () => {
    calls++;
    if (calls === 1) return new Response(JSON.stringify({ error: 'Rejected' }), { status: 401 });
    if (calls === 2)
      await new Promise((resolve) => {
        finish = resolve;
      });
    return new Response(JSON.stringify({ models: [] }));
  });
  await assert.rejects(client.get('ramp', 'fake-test-key'), /Rejected/);
  const pending = client.get('ramp', 'fake-test-key');
  client.forget('ramp');
  finish();
  await assert.rejects(pending, { name: 'AbortError' });
  await client.get('ramp', 'fake-test-key');
  assert.equal(calls, 3);
  client.close();
});
