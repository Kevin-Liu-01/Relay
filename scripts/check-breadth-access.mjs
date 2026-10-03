// A single, explicitly invoked access check; never a task retry or polling loop.
import { existsSync, writeFileSync } from 'node:fs';
import { RampRouter, requestEstimate, responsePayload } from '../runner/router.mjs';
import { assertSafeEvidence } from '../runner/export.mjs';
const path = 'evidence/breadth-access-2026-10-03.json';
if (existsSync(path)) throw Error('Access check already recorded; do not retry automatically.');
const router = new RampRouter();
const catalog = await router.models();
const row = catalog.models.find((m) => m.id === 'gpt-6-luna');
if (!row?.catalogRates) throw Error('No exact route and price for the access check.');
const args = {
  model: row.id,
  instructions: 'Return one short acknowledgement.',
  input: 'Reply OK.',
  maxOutputTokens: 128,
};
const reservation = requestEstimate(responsePayload(args), row.catalogRates, 128).usd;
if (reservation > 0.001) throw Error('Access-check ceiling exceeded.');
const result = {
  kind: 'provider-access-diagnostic-not-a-task-trial',
  at: new Date().toISOString(),
  catalog,
  model: row.id,
  rates: row.catalogRates,
  status: 'in-flight',
  estimatedUSD: reservation,
  reservedUSD: reservation,
  usageKnown: false,
};
const save = () => {
  const data = JSON.stringify(result, null, 2) + '\n';
  assertSafeEvidence(data, [router.apiKey]);
  writeFileSync(path, data);
};
save();
try {
  const response = await router.respond({ ...args, timeoutMs: 30000 });
  Object.assign(result, {
    status: 'response-received',
    usage: response.usage,
    returnedModel: response.returnedModel,
    receipt: response.receipt,
  });
} catch (error) {
  Object.assign(result, { status: error.code ?? error.name, receipt: error.receipt ?? null });
  if (error.code === 'output_limit') result.usage = error.receipt?.usage;
}
if (result.usage) {
  result.estimatedUSD =
    (result.usage.inputTokens * row.catalogRates.input +
      result.usage.outputTokens * row.catalogRates.output) /
    1e6;
  result.reservedUSD = 0;
  result.usageKnown = true;
}
save();
console.log(
  JSON.stringify({
    status: result.status,
    estimatedUSD: result.estimatedUSD,
    usageKnown: result.usageKnown,
  }),
);
if (!['response-received', 'output_limit'].includes(result.status)) process.exitCode = 1;
