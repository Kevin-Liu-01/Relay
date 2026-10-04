import assert from 'node:assert/strict';

// Observer-side derivation. Never use a multi-episode run's budget for one trial.
export function trialAccounting(record) {
  const episode = record.run.episodes[0];
  const rates = episode.cell.model.rates;
  let requests = 0,
    receipts = 0,
    inputTokens = 0,
    outputTokens = 0;
  let reservedUSD = 0,
    acceptedUSD = 0;
  const pending = new Map();
  for (const { event } of record.events) {
    if (event.kind === 'request') {
      assert.ok(!pending.has(event.step), 'Duplicate request step');
      pending.set(event.step, event.reservedUSD);
      requests++;
    }
    const usage =
      event.kind === 'response'
        ? event.response?.usage
        : event.kind === 'provider_error' && event.usageAccepted
          ? event.receipt?.usage
          : null;
    if (usage) {
      assert.ok(pending.has(event.step), 'Receipt must bind a request');
      for (const key of ['inputTokens', 'outputTokens'])
        assert.ok(Number.isSafeInteger(usage[key]) && usage[key] >= 0, 'Invalid token receipt');
      receipts++;
      inputTokens += usage.inputTokens;
      outputTokens += usage.outputTokens;
      acceptedUSD += (usage.inputTokens * rates.input + usage.outputTokens * rates.output) / 1e6;
      pending.delete(event.step);
    }
  }
  for (const value of pending.values()) reservedUSD += value;
  assert.ok(
    Math.abs(acceptedUSD + reservedUSD - episode.estimatedUSD) < 1e-8,
    'Derived episode accounting must equal the original allowance',
  );
  assert.equal(pending.size === 0, episode.usageKnown, 'Unknown usage remains explicit');
  return {
    requests,
    receipts,
    unknownRequests: pending.size,
    inputTokens,
    outputTokens,
    acceptedUSD,
    reservedUSD,
    recordedUSD: episode.estimatedUSD,
    inputUSDPerMillion: rates.input,
    outputUSDPerMillion: rates.output,
  };
}

export function sumAccounting(rows) {
  const keys = [
    'requests',
    'receipts',
    'unknownRequests',
    'inputTokens',
    'outputTokens',
    'acceptedUSD',
    'reservedUSD',
    'recordedUSD',
  ];
  return Object.fromEntries(keys.map((key) => [key, rows.reduce((n, row) => n + row[key], 0)]));
}
