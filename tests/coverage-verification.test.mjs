import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { taskCampaignSummary } from '../scripts/lib/breadth-campaign.mjs';
import {
  verifyCoverage,
  verifyRebuiltSummary,
  verifyAppProvenance,
} from '../scripts/lib/coverage-verification.mjs';
const plan = JSON.parse(readFileSync('docs/campaigns/model-breadth-2026-10-03.json'));
const partial = () => structuredClone(taskCampaignSummary(plan, [], 'running'));
test('served app receipts require valid hashes and match across episodes', () => {
  const receipt = {
    ok: true,
    service: 'relay-app',
    backendHash: 'a'.repeat(64),
    buildHash: 'b'.repeat(64),
  };
  assert.deepEqual(verifyAppProvenance(undefined, receipt), receipt);
  verifyAppProvenance(receipt, structuredClone(receipt));
  assert.throws(() => verifyAppProvenance(receipt, { ...receipt, buildHash: 'c'.repeat(64) }));
  assert.throws(() => verifyAppProvenance(undefined, { ...receipt, backendHash: '' }));
  assert.throws(() => verifyAppProvenance(undefined, { ...receipt, ok: false }));
});
test('306 planned cells and 37 preserved attempts are not completion', () => {
  const s = partial();
  assert.equal(verifyCoverage(plan, s, { allowPartial: true }).complete, false);
  assert.throws(() => verifyCoverage(plan, s), /not completed/);
  s.status = 'completed';
  assert.throws(() => verifyCoverage(plan, s, { allowPartial: true }), /Every cell/);
});
test('duplicate or missing model-task cells cannot pass coverage checks', () => {
  const s = partial();
  s.rows[40] = s.rows[39];
  assert.throws(() => verifyCoverage(plan, s, { allowPartial: true }), /Duplicate cell/);
  s.rows.pop();
  assert.throws(() => verifyCoverage(plan, s, { allowPartial: true }), /denominator/);
});
test('outcome totals and model rows cannot be inflated independently of evidence', () => {
  const s = partial();
  s.totals.attempted = 306;
  assert.throws(() => verifyCoverage(plan, s, { allowPartial: true }), /Counts derive/);
  const model = partial();
  model.byModel[0].passed++;
  assert.throws(() => verifyCoverage(plan, model, { allowPartial: true }), /model\/passed/);
});
test('carryover failures cannot be removed or silently relabeled', () => {
  const s = partial();
  s.rows.find((r) => r.cohort === 'preserved' && r.outcome === 'blocked').error = null;
  assert.throws(() => verifyCoverage(plan, s, { allowPartial: true }), /Preserve every/);
});
test('changing a seed or new-cell provenance is rejected', () => {
  const seed = partial();
  seed.rows[0].seed++;
  assert.throws(() => verifyCoverage(plan, seed, { allowPartial: true }), /Fixed seed/);
  const origin = partial();
  origin.rows.find((r) => r.cohort === 'new').originCampaign = 'replacement';
  assert.throws(() => verifyCoverage(plan, origin, { allowPartial: true }));
});
test('stopped preflight diagnostics must match the manifest without changing derived results', () => {
  const rebuilt = { ...partial(), status: 'stopped' };
  const manifest = { status: 'stopped', workerError: 'Free disk reserve reached.' };
  const summary = { ...rebuilt, workerError: manifest.workerError };
  verifyRebuiltSummary(summary, rebuilt, manifest);
  assert.throws(
    () => verifyRebuiltSummary({ ...summary, workerError: 'Different error' }, rebuilt, manifest),
    /diagnostic binding/,
  );
  assert.throws(
    () => verifyRebuiltSummary({ ...summary, status: 'completed' }, rebuilt, manifest),
    /stopped snapshot/,
  );
  assert.throws(
    () => verifyRebuiltSummary({ ...summary, estimatedUSD: 999 }, rebuilt, manifest),
    /accounting rebuild/,
  );
});
