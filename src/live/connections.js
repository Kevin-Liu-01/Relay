// Key-scoped, tab-memory-only metadata cache. Never persisted with run history.
export function createConnections(fetchImpl = fetch) {
  const entries = new Map();
  return {
    get(provider, key) {
      key = key.trim();
      const identity = `${provider}\0${key}`;
      const existing = entries.get(identity);
      if (existing?.key === key && (existing.pending || Date.now() - existing.at < 300_000))
        return existing.promise;
      existing?.controller.abort();
      const controller = new AbortController();
      const entry = { provider, key, controller, pending: true, at: Date.now() };
      entry.promise = (async () => {
        const response = await fetchImpl('/api/relay?op=models', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ provider, key }),
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw Error(data.error ?? 'Could not connect. Try again.');
        if (controller.signal.aborted) throw new DOMException('Cancelled', 'AbortError');
        entry.pending = false;
        entry.at = Date.now();
        return data;
      })().catch((error) => {
        if (entries.get(identity) === entry) entries.delete(identity);
        throw error;
      });
      entries.set(identity, entry);
      return entry.promise;
    },
    forget(provider) {
      for (const [identity, entry] of entries) {
        if (entry.provider === provider) {
          entry.controller.abort();
          entries.delete(identity);
        }
      }
    },
    close() {
      for (const entry of entries.values()) entry.controller.abort();
      entries.clear();
    },
  };
}
export const validKey = (key) =>
  typeof key === 'string' &&
  key.trim().length >= 8 &&
  key.trim().length <= 512 &&
  !/\s/.test(key.trim());
export function preferredModel(models, provider) {
  const ready = models.filter((model) => model.rates);
  return (
    (
      ready.find(
        (model) => model.id === (provider === 'typesafe' ? 'jev-latest' : 'gpt-4o-mini'),
      ) ?? ready[0]
    )?.id ?? ''
  );
}
