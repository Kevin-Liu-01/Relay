import { existsSync, writeFileSync } from 'node:fs';
import { RampRouter, requestEstimate, responsePayload } from '../runner/router.mjs';
import { assertSafeEvidence } from '../runner/export.mjs';
const path = 'evidence/qwen-access-2026-10-03.json';
if (existsSync(path)) throw Error('Probe already recorded; no automatic retry.');
const router = new RampRouter(),
  catalog = await router.models();
const model = catalog.models.find((m) => m.id === 'qwen3p8-max');
if (!model?.catalogRates) throw Error('Qwen exact route/rates unavailable.');
const args = {
  model: model.id,
  instructions: 'Return one short acknowledgement.',
  input: 'Reply OK.',
  maxOutputTokens: 128,
};
const reservedUSD = requestEstimate(responsePayload(args), model.catalogRates, 128).usd;
if (reservedUSD > 0.01) throw Error('Probe ceiling exceeded.');
const result = {
  kind: 'provider-access-diagnostic-not-a-task-trial',
  at: new Date().toISOString(),
  model: model.id,
  rates: model.catalogRates,
  catalog: { at: catalog.at, hash: catalog.hash },
  status: 'in-flight',
  reservedUSD,
  estimatedUSD: reservedUSD,
  usageKnown: false,
};
const save = () => {
  const text = JSON.stringify(result, null, 2) + '\n';
  assertSafeEvidence(text, [router.apiKey]);
  writeFileSync(path, text);
};
save();
try {
  const response = await router.respond({ ...args, timeoutMs: 30000 });
  Object.assign(result, {
    status: 'response-received',
    returnedModel: response.returnedModel,
    usage: response.usage,
    receipt: response.receipt,
  });
} catch (error) {
  Object.assign(result, { status: error.code ?? error.name, receipt: error.receipt ?? null });
  if (error.code === 'output_limit') result.usage = error.receipt?.usage;
}
if (result.usage) {
  result.estimatedUSD =
    (result.usage.inputTokens * model.catalogRates.input +
      result.usage.outputTokens * model.catalogRates.output) /
    1e6;
  result.usageKnown = true;
}
save();
console.log(
  JSON.stringify({
    model: result.model,
    status: result.status,
    estimatedUSD: result.estimatedUSD,
    usageKnown: result.usageKnown,
  }),
);
