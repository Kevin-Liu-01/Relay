// One diagnostic request per untested approved route. Not benchmark evidence.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { RampRouter, requestEstimate, responsePayload } from '../runner/router.mjs';
import { assertSafeEvidence } from '../runner/export.mjs';
const path = 'evidence/campaign-access-2026-10-03.json';
if (existsSync(path)) throw Error('Access probes already recorded; never retry implicitly.');
const router = new RampRouter(),
  catalog = await router.models();
const ids = ['gpt-6.1-sol', 'claude-sonnet-5-5', 'deepseek-v4.1-flash', 'glm-5p3-flash'];
const result = {
  kind: 'provider-access-diagnostic-not-a-task-trial',
  at: new Date().toISOString(),
  catalog: { at: catalog.at, hash: catalog.hash },
  maxEstimatedUSD: 0.05,
  estimatedUSD: 0,
  requests: [],
  omitted: 'Gemini 3.8 Flash already returned 403 in all-tasks-2026-10-02; not retried.',
};
mkdirSync('evidence', { recursive: true });
const save = () => {
  const text = JSON.stringify(result, null, 2) + '\n';
  assertSafeEvidence(text, [router.apiKey]);
  writeFileSync(path, text);
};
save();
for (const id of ids) {
  const model = catalog.models.find((m) => m.id === id);
  if (!model?.catalogRates) throw Error('Missing exact rates.');
  const args = {
    model: id,
    instructions: 'Return one short acknowledgement.',
    input: 'Reply OK.',
    maxOutputTokens: 128,
  };
  const reserved = requestEstimate(responsePayload(args), model.catalogRates, 128).usd;
  if (result.estimatedUSD + reserved > result.maxEstimatedUSD)
    throw Error('Diagnostic ceiling reached.');
  const entry = {
    model: id,
    rates: model.catalogRates,
    reservedUSD: reserved,
    estimatedUSD: reserved,
    usageKnown: false,
    status: 'in-flight',
  };
  result.requests.push(entry);
  result.estimatedUSD += reserved;
  save();
  try {
    const response = await router.respond({ ...args, timeoutMs: 30000 });
    Object.assign(entry, {
      status: 'response-received',
      receipt: response.receipt,
      returnedModel: response.returnedModel,
      usage: response.usage,
    });
  } catch (error) {
    Object.assign(entry, {
      status: error.code ?? error.name,
      receipt: error.receipt ?? null,
      error: String(error.message).replaceAll(router.apiKey, '[redacted]'),
    });
    if (error.code === 'output_limit') entry.usage = error.receipt?.usage;
  }
  if (entry.usage) {
    const cost =
      (entry.usage.inputTokens * model.catalogRates.input +
        entry.usage.outputTokens * model.catalogRates.output) /
      1e6;
    result.estimatedUSD += cost - reserved;
    entry.estimatedUSD = cost;
    entry.usageKnown = true;
  }
  save();
  console.log(
    JSON.stringify({
      model: id,
      status: entry.status,
      httpStatus: entry.receipt?.httpStatus,
      estimatedUSD: entry.estimatedUSD,
      usageKnown: entry.usageKnown,
    }),
  );
}
