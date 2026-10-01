import { createHash } from 'node:crypto';
import snapshot from './pricing-snapshot.json' with { type: 'json' };

export const PRICING_URLS = {
  ramp: 'https://docs.router.com/supported-models.md',
  typesafe: 'https://docs.typesafe.ai/models.md',
};
const TTL = 5 * 60_000;
const MAX_AGE = 7 * 24 * 60 * 60_000;
const sha = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const jevSnapshot = {
  at: snapshot.at,
  source: PRICING_URLS.typesafe,
  rates: Object.fromEntries(
    ['jev-latest', 'jev-preview', 'jev-1.13.0'].map((id) => [id, { input: 0.042, output: 0 }]),
  ),
};

// Match exact documented IDs only. In particular, never strip provider/tier suffixes:
// Router explicitly warns that a display label is not necessarily a callable ID.
export function parsePricing(provider, markdown, at = new Date().toISOString()) {
  const rates = {};
  if (provider === 'ramp') {
    for (const [, id, input, output] of markdown
      .split('## Deprecated models')[0]
      .matchAll(/`([^`]+)`<\/DocModelName> \| \$([\d.]+) \| \$([\d.]+)/g))
      rates[id] = { input: Number(input), output: Number(output) };
  } else if (provider === 'typesafe') {
    const version = markdown.match(/\| Jev [^|]+\| `(jev-[^`]+)`/);
    const price = markdown.match(/Price \(per Btok \/ per Mtok\)[^\n]*\\\$[\d.]+ \/ \\\$([\d.]+)/);
    if (version && price && markdown.includes('Output tokens are free.')) {
      rates[version[1]] = { input: Number(price[1]), output: 0 };
      for (const [, alias, target] of markdown.matchAll(/\| `(jev-[^`]+)` \| `(jev-[^`]+)` \|/g))
        if (target === version[1]) rates[alias] = rates[target];
    }
  }
  if (
    !Object.keys(rates).length ||
    Object.values(rates).some(
      (r) =>
        !Number.isFinite(r.input) ||
        r.input <= 0 ||
        r.input > 1000 ||
        !Number.isFinite(r.output) ||
        r.output > 1000 ||
        (provider === 'ramp' ? r.output <= 0 : r.output !== 0),
    )
  )
    throw Error('Published model pricing could not be read.');
  return { source: PRICING_URLS[provider], at, rates };
}

export function createPricingResolver({ fetchImpl = fetch, now = Date.now, refresh = true } = {}) {
  const cache = new Map(),
    pending = new Map(),
    checked = new Map();
  return async (provider, catalog) => {
    if (!PRICING_URLS[provider]) throw Error('Unknown pricing provider.');
    const catalogOnly =
      provider === 'ramp' && catalog.models.every((model) => Object.hasOwn(model, 'catalogRates'));
    if (
      !catalogOnly &&
      refresh &&
      (!checked.has(provider) || now() - checked.get(provider) >= TTL)
    ) {
      if (!pending.has(provider)) {
        const work = (async () => {
          try {
            // Public pricing request: never receives credentials, account IDs or headers.
            const r = await fetchImpl(PRICING_URLS[provider], {
              redirect: 'error',
              signal: AbortSignal.timeout(4000),
            });
            if (!r.ok) throw Error('Pricing unavailable');
            const markdown = await r.text();
            if (markdown.length > 256_000) throw Error('Pricing document too large');
            cache.set(provider, parsePricing(provider, markdown, new Date(now()).toISOString()));
          } catch {
            // A bounded, dated snapshot covers a temporary docs outage, never unknown IDs.
          } finally {
            checked.set(provider, now());
          }
        })();
        pending.set(provider, work);
        work.finally(() => pending.delete(provider));
      }
      await pending.get(provider);
    }
    const source = cache.get(provider) ?? (provider === 'ramp' ? snapshot : jevSnapshot);
    const fresh = now() - Date.parse(source.at) <= MAX_AGE;
    const pricing = {
      source: source.source,
      at: source.at,
      hash: sha(source),
      status: cache.has(provider) ? 'live' : 'snapshot',
      unit: 'USD per million tokens',
      basis: 'published base rates; estimates, not provider billing',
    };
    const catalogPricing = {
      source: 'https://api.router.com/v1/models',
      at: catalog.at,
      hash: catalog.hash,
      status: 'catalog',
      unit: pricing.unit,
      basis: pricing.basis,
    };
    return {
      ...catalog,
      pricing: catalogOnly ? catalogPricing : pricing,
      models: catalog.models.map((model) => {
        // Catalog pricing is bound to the exact callable ID, including provider
        // variants. Missing/invalid v1 metadata cannot be rescued by a label guess.
        if (provider === 'ramp' && Object.hasOwn(model, 'catalogRates'))
          return {
            ...model,
            rates: model.catalogRates,
            pricing: catalogPricing,
          };
        return {
          ...model,
          rates: fresh && Object.hasOwn(source.rates, model.id) ? source.rates[model.id] : null,
          pricing,
        };
      }),
    };
  };
}

export function applyCatalogRates(config, catalog) {
  return {
    ...config,
    models: config.models.map((model) => {
      const found = catalog.models.find((m) => m.id === model.id);
      if (!found) throw Error('Selected model is not in your account catalog.');
      if (!found.rates)
        throw Error(
          found.unavailableReason ??
            'Pricing is temporarily unavailable for this model. Choose another model.',
        );
      return { ...model, rates: found.rates };
    }),
  };
}
