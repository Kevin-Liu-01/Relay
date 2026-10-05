// Optional live infrastructure check. No Router calls and no production quota
// keys. Uses a unique short-lived namespace in the configured Redis database.
import assert from 'node:assert/strict';
import { randomUUID, createHash } from 'node:crypto';
import { RESERVE_SCRIPT } from '../hosted/free-tier.mjs';

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
assert.ok(
  /^https:\/\/[^/]+\.upstash\.io\/?$/.test(url ?? '') && token,
  'Configure Redis REST credentials privately.',
);
const prefix = `relay:quota-check:${randomUUID()}`;
async function reserve(visitor) {
  let result;
  try {
    const response = await fetch(url, {
      method: 'POST',
      redirect: 'error',
      signal: AbortSignal.timeout(10000),
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify([
        'EVAL',
        RESERVE_SCRIPT,
        '2',
        `${prefix}:total`,
        `${prefix}:visitor:${visitor}`,
        '5',
        '500',
        '3',
        '180',
      ]),
    });
    if (!response.ok) throw Error();
    result = await response.json();
    if (result.error || !Array.isArray(result.result)) throw Error();
  } catch {
    throw Error(
      'Quota store check failed. No retry; temporary check keys expire after three minutes.',
    );
  }
  return result.result;
}
const sameVisitor = await Promise.all(Array.from({ length: 8 }, () => reserve('one-visitor')));
assert.equal(
  sameVisitor.filter((r) => r[0] === 1).length,
  3,
  'One visitor gets exactly three admissions',
);
assert.equal(sameVisitor.filter((r) => r[0] === 0 && r[1] === 1).length, 5);
// Distinct concurrent requests, not a client-side lock or process-local counter.
const allVisitors = await Promise.all(
  Array.from({ length: 120 }, (_, i) => reserve(`visitor-${i}`)),
);
assert.equal(
  allVisitors.filter((r) => r[0] === 1).length,
  97,
  'The shared $5 allowance admits exactly 100 total runs',
);
assert.equal(allVisitors.filter((r) => r[0] === 0 && r[1] === 2).length, 23);
assert.deepEqual(
  await reserve('fresh-client'),
  [0, 2, 0],
  'A new request sees the same exhausted allowance',
);
console.log(
  JSON.stringify(
    {
      status: 'passed',
      scriptSha256: createHash('sha256').update(RESERVE_SCRIPT).digest('hex'),
      attempts: 129,
      admitted: 100,
      rejected: 29,
      allowanceUSD: 5,
      scope: 'isolated test namespace; no production counters or model inference',
      expiresSeconds: 180,
    },
    null,
    2,
  ),
);
