import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlan, MODELS, cellConfig } from '../scripts/lib/interface-repeat-study.mjs';
import { assertContinuationPrefix, ORIGINAL_START } from '../scripts/lib/interface-repeat-continuation.mjs';

const plan = createPlan({ models: MODELS.map((id) => ({
  id, catalogRates: { input: 2, output: 10 }, imageInput: true, reasoningEfforts: ['low'],
})) });
const entry = (i) => ({
  id: plan.phases[i].id, repetition: plan.phases[i].repetition,
  config: cellConfig(plan, plan.phases[i]),
  runId: i === 9 ? 'f7bcda1c-482c-47e2-acc4-1bbeebd73c33' : `run-${i}`,
  safeToContinue: i !== 9, finishedAt: '2026-10-05T20:48:00Z', archive: { sha256: `archive-${i}` },
});
const prior = { status: 'stopped', createdAt: ORIGINAL_START, phases: Array.from({ length: 10 }, (_, i) => entry(i)) };
const current = () => ({ createdAt: ORIGINAL_START, phases: structuredClone(prior.phases) });

test('authorized continuation retains the credential failure verbatim and starts at cell 011', () => {
  const manifest = current();
  assertContinuationPrefix(plan, manifest, prior);
  manifest.phases.push(entry(10));
  assertContinuationPrefix(plan, manifest, prior);
  assert.equal(manifest.phases[9].safeToContinue, false);
});

test('continuation cannot rewrite carried failures, change limits, skip cells or reset time', () => {
  for (const mutate of [
    (m) => { m.phases[9].safeToContinue = true; },
    (m) => { m.phases[9].archive.sha256 = 'different'; },
    (m) => { m.phases.pop(); },
    (m) => { m.phases.push(entry(11)); },
    (m) => { m.phases.push({ ...entry(10), runId: m.phases[0].runId }); },
    (m) => { m.phases.push({ ...entry(10), safeToContinue: false }); },
    (m) => { m.phases.push(entry(10)); m.phases[10].config.episodeSeconds = 600; },
    (m) => { m.createdAt = '2026-10-05T21:00:00Z'; },
  ]) {
    const manifest = current();
    mutate(manifest);
    assert.throws(() => assertContinuationPrefix(plan, manifest, prior));
  }
});
