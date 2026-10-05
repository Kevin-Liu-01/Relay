import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { compactImageInputs, expandImageInputs } from '../scripts/lib/compact-image-inputs.mjs';
import { validateCatalog, validateRecord } from '../docs/review-app/data.mjs';
import { assertSafeEvidence } from '../runner/export.mjs';
import { trialAccounting, sumAccounting } from '../scripts/lib/report-accounting.mjs';
import {
  createPlan,
  validatePlan,
  cellConfig,
  remainingAllowance,
  studySummary,
  MODELS,
  TASKS,
  MODES,
} from '../scripts/lib/interface-study.mjs';
const catalog = {
  models: MODELS.map((id) => ({
    id,
    catalogRates: { input: 2, output: 10 },
    imageInput: true,
    reasoningEfforts: ['low'],
  })),
};
test('public pixel requests deduplicate images without losing any input bytes', () => {
  const inputs = {
    one: { image_url: 'data:image/png;base64,YWJj', text: 'unchanged' },
    two: { image_url: 'data:image/png;base64,YWJj' },
  };
  const encoded = compactImageInputs(inputs);
  assert.equal(Object.keys(encoded.images).length, 1);
  assert.deepEqual(expandImageInputs(encoded.inputs, encoded.images), inputs);
  const key = Object.keys(encoded.images)[0];
  encoded.images[key] += 'bad';
  assert.throws(() => expandImageInputs(encoded.inputs, encoded.images), /hash mismatch/);
});
test('all published study records preserve request hashes, event chains, costs and verified outcomes', () => {
  const sha = (data) => createHash('sha256').update(data).digest('hex');
  const catalog = validateCatalog(
    JSON.parse(readFileSync('evidence/interface-trial-library/catalog.json')),
  );
  const summaryBytes = readFileSync(`evidence/campaigns/${catalog.campaign}/verified-summary.json`);
  assert.equal(catalog.summaryHash, sha(summaryBytes));
  const summary = JSON.parse(summaryBytes);
  assert.equal(catalog.attempted, summary.totals.attempted);
  assert.equal(catalog.planned, 96);
  const costs = [];
  for (const item of catalog.trials) {
    const bytes = readFileSync(`evidence/interface-trial-library/${item.path.split('/').at(-1)}`);
    assert.equal(bytes.length, item.bytes);
    assert.equal(sha(bytes), item.sha256);
    const text = gunzipSync(bytes, { maxOutputLength: 80e6 }).toString('utf8');
    assert.equal(Buffer.byteLength(text), item.jsonBytes);
    assertSafeEvidence(text, [process.env.RAMP_ROUTER_API_KEY]);
    const record = validateRecord(JSON.parse(text), item);
    const episode = record.audit.episodes[0];
    const inputs = record.imageInputs
      ? expandImageInputs(episode.inputs, record.imageInputs)
      : episode.inputs;
    assert.equal(record.run.sourceHash, catalog.sourceHash);
    assert.deepEqual(item.result, {
      ...summary.rows.find((row) => row.phase === item.phase),
      originCampaign: catalog.campaign,
      cohort: 'fresh-matched-interface-study',
    });
    let previous = '0'.repeat(64);
    for (const { event } of record.events) {
      const { hash, ...body } = event;
      assert.equal(event.previousHash, previous);
      assert.equal(sha(JSON.stringify(body)), hash);
      previous = hash;
      if (event.kind === 'input')
        assert.equal(sha(JSON.stringify(inputs[event.requestFile])), event.requestHash);
    }
    assert.equal(previous, record.run.episodes[0].traceRoot);
    costs.push(trialAccounting(record));
  }
  const accounting = sumAccounting(costs);
  assert.ok(Math.abs(accounting.recordedUSD - summary.estimatedUSD) < 1e-8);
  assert.ok(Math.abs(accounting.reservedUSD - summary.reservedUSD) < 1e-8);
});
test('study freezes exactly 96 fresh matched cells and a complete 16-cell pilot', () => {
  const p = validatePlan(createPlan(catalog));
  assert.deepEqual(p, createPlan(catalog));
  assert.equal(p.maxEstimatedUSD, 25);
  for (const task of TASKS)
    for (const model of MODELS)
      assert.deepEqual(
        p.phases
          .filter((x) => x.tasks[0] === task && x.models[0] === model)
          .map((x) => x.interfaces[0])
          .sort(),
        [...MODES].sort(),
      );
  assert.ok(p.phases.slice(0, 16).every((x) => x.tasks[0] === 'channel-topic'));
  assert.ok(
    new Set(p.phases.filter((x) => x.interfaces[0] === 'pixels').map((x) => x.id)).size === 24,
  );
  const duplicate = structuredClone(p);
  duplicate.phases[1] = duplicate.phases[0];
  assert.throws(() => validatePlan(duplicate), /Duplicate/);
});
test('image capability and reasoning must be confirmed from account metadata', () => {
  for (const field of ['imageInput', 'reasoningEfforts', 'catalogRates']) {
    const c = structuredClone(catalog);
    c.models[0][field] = field === 'reasoningEfforts' ? [] : null;
    assert.throws(() => createPlan(c), /confirmed/);
  }
});
test('shared cap includes unknown reservations and never increases per-cell allowance', () => {
  const p = createPlan(catalog),
    reports = [{ estimatedUSD: 24.9, reservedUSD: 1 }];
  assert.ok(Math.abs(remainingAllowance(p, reports) - 0.1) < 1e-9);
  assert.ok(cellConfig(p, p.phases[0], remainingAllowance(p, reports)).maxEstimatedUSD < 0.101);
  assert.equal(cellConfig(p, p.phases[0], 25).maxEstimatedUSD, 1);
  assert.equal(remainingAllowance(p, [{ estimatedUSD: 25 }]), 0);
  assert.throws(() => remainingAllowance(p, [{ estimatedUSD: NaN }]), /ledger/);
});
test('unattempted cells retain the planned denominator', () => {
  const p = createPlan(catalog),
    s = studySummary(p, [], 'planned');
  assert.equal(s.totals.planned, 96);
  assert.equal(s.totals.unattempted, 96);
  for (const mode of MODES) assert.equal(s.byInterface[mode].planned, 24);
});
