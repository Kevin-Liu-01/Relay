import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { DEFAULT_CONFIG } from '../runner/design.mjs';
import { TASK_LABELS } from '../shared/task-catalog.mjs';

// Reviewed exact request IDs, not a price-sorted proxy to arbitrary models.
export const FREE_MODELS = Object.freeze([
  'gpt-6-luna',
  'deepseek-v4-flash',
  'glm-5p3-flash',
  'gpt-4o-mini',
]);
export const FREE_LIMITS = Object.freeze({ dailyUSD: 5, runUSD: 0.05, visitorRuns: 3 });
export class FreeTierError extends Error {
  constructor(message, status = 503) {
    super(message);
    this.status = status;
  }
}

export function freeCatalog(catalog) {
  return {
    ...catalog,
    models: FREE_MODELS.flatMap((id) => {
      const model = catalog.models.find((m) => m.id === id);
      return model &&
        model.rates &&
        Number.isFinite(model.rates.input) &&
        model.rates.input > 0 &&
        model.rates.input <= 0.15 &&
        Number.isFinite(model.rates.output) &&
        model.rates.output > 0 &&
        model.rates.output <= 0.6
        ? [model]
        : [];
    }),
  };
}

export function freeRunConfig(body) {
  if (
    !FREE_MODELS.includes(body.model) ||
    !Object.hasOwn(TASK_LABELS, body.task) ||
    !['a11y', 'json-ui', 'api'].includes(body.interface)
  )
    throw new FreeTierError('Choose a free model, task and text interface.', 400);
  // No caller-controlled prompt, rates, repeats, seed, resource limits or endpoints.
  return {
    ...DEFAULT_CONFIG,
    provider: 'ramp',
    models: [{ id: body.model, rates: { input: 0.15, output: 0.6 } }],
    tasks: [body.task],
    interfaces: [body.interface],
    seeds: [42],
    repeats: 1,
    guides: [false],
    histories: ['recent-4'],
    maxSteps: 20,
    maxRequests: 20,
    maxInputUnits: 128000,
    maxOutputTokens: 2048,
    runSeconds: 190,
    episodeSeconds: 180,
    maxEstimatedUSD: FREE_LIMITS.runUSD,
  };
}

// One atomic operation, shared by all deployments and cold starts. Reserve the
// entire allowance BEFORE inference. Never refund failures or unknown usage.
// Integer cents avoid floating-point admission. Missing/corrupt state fails closed.
export const RESERVE_SCRIPT = `
local total = tonumber(redis.call('GET', KEYS[1]) or '0')
local visitor = tonumber(redis.call('GET', KEYS[2]) or '0')
if not total or not visitor or total < 0 or visitor < 0 then return {-1, 0, 0} end
if visitor >= tonumber(ARGV[3]) then return {0, 1, visitor} end
if total + tonumber(ARGV[1]) > tonumber(ARGV[2]) then return {0, 2, visitor} end
redis.call('INCRBY', KEYS[1], ARGV[1])
redis.call('INCR', KEYS[2])
redis.call('EXPIRE', KEYS[1], ARGV[4])
redis.call('EXPIRE', KEYS[2], ARGV[4])
return {1, total + tonumber(ARGV[1]), visitor + 1}
`;

export function visitorAddress(req, vercel) {
  // Never trust forwarded headers on the local server. Vercel overwrites this
  // header at its edge. Missing/ambiguous addresses cannot share the free key.
  let address = vercel ? req.headers['x-vercel-forwarded-for'] : req.socket?.remoteAddress;
  if (typeof address !== 'string' || !isIP(address))
    throw new FreeTierError('Free access could not verify this connection. Use your own key.');
  if (address.startsWith('::ffff:') && isIP(address.slice(7)) === 4) address = address.slice(7);
  if (isIP(address) === 6) {
    const canonical = new URL(`http://[${address}]/`).hostname.slice(1, -1);
    const [left, right = ''] = canonical.split('::');
    const a = left ? left.split(':') : [],
      b = right ? right.split(':') : [];
    const expanded = canonical.includes('::')
      ? [...a, ...Array(8 - a.length - b.length).fill('0'), ...b]
      : a;
    // Group IPv6 privacy addresses by network, not individual rotating addresses.
    address =
      expanded
        .slice(0, 4)
        .map((p) => parseInt(p, 16).toString(16))
        .join(':') + '::/64';
  }
  return address;
}

export function createFreeTier({
  env = process.env,
  fetchImpl = fetch,
  now = () => new Date(),
} = {}) {
  const key = env.RELAY_FREE_RAMP_KEY;
  const secret = env.RELAY_FREE_VISITOR_SECRET;
  const url = env.KV_REST_API_URL ?? env.UPSTASH_REDIS_REST_URL;
  const token = env.KV_REST_API_TOKEN ?? env.UPSTASH_REDIS_REST_TOKEN;
  const enabled =
    env.RELAY_FREE_ENABLED === '1' &&
    typeof key === 'string' &&
    key.length >= 8 &&
    !/\s/.test(key) &&
    typeof secret === 'string' &&
    secret.length >= 32 &&
    typeof url === 'string' &&
    /^https:\/\/[^/]+\.upstash\.io\/?$/.test(url) &&
    !!token;
  const unavailable = () =>
    new FreeTierError('Free runs are temporarily unavailable. You can use your own key.');
  return {
    enabled: !!enabled,
    key: enabled ? key : undefined,
    publicConfig: { enabled: !!enabled, ...FREE_LIMITS, resets: '00:00 UTC', models: FREE_MODELS },
    async reserve(req) {
      if (!enabled) throw unavailable();
      const date = now();
      const day = date.toISOString().slice(0, 10);
      const visitor = createHmac('sha256', secret)
        .update(`${day}\0${visitorAddress(req, !!env.VERCEL)}`)
        .digest('hex');
      let data;
      try {
        const response = await fetchImpl(url, {
          method: 'POST',
          redirect: 'error',
          headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
          signal: AbortSignal.timeout(5000),
          body: JSON.stringify([
            'EVAL',
            RESERVE_SCRIPT,
            '2',
            `relay:free:${day}:total`,
            `relay:free:${day}:visitor:${visitor}`,
            '5',
            '500',
            '3',
            '172800',
          ]),
        });
        if (!response.ok) throw unavailable();
        data = await response.json();
      } catch {
        throw unavailable();
      }
      const result = data?.result;
      if (
        data?.error ||
        !Array.isArray(result) ||
        result.length !== 3 ||
        !result.every(Number.isInteger)
      )
        throw unavailable();
      if (result[0] === 0 && [1, 2].includes(result[1]))
        throw new FreeTierError(
          result[1] === 1
            ? 'You have used today’s 3 free runs on this network. Use your own key or return after 00:00 UTC.'
            : 'Today’s free allowance has been used. Use your own key or return after 00:00 UTC.',
          429,
        );
      if (result[0] !== 1 || result[1] < 5 || result[1] > 500 || result[2] < 1 || result[2] > 3)
        throw unavailable();
      return {
        remaining: FREE_LIMITS.visitorRuns - result[2],
        reservedUSD: FREE_LIMITS.runUSD,
        resets: '00:00 UTC',
      };
    },
  };
}
