import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeRepeatedInterfaces } from '../scripts/lib/interface-repeat-analysis.mjs';
import { validateCatalog } from '../docs/review-app/data.mjs';
const dir = 'evidence/campaigns/interface-repeat-2026-10-05-continuation';
const summary = JSON.parse(readFileSync(`${dir}/verified-summary.json`));
const costs = JSON.parse(readFileSync(`${dir}/accounting.json`));
const catalog = JSON.parse(readFileSync('evidence/interface-repeat-trial-library/catalog.json'));

test('all 48 records and 24 repeated conditions reconcile without pooling or discarding failures', () => {
  const a = analyzeRepeatedInterfaces(summary, costs);
  assert.equal(a.repeatConsistency.length, 24);
  assert.equal(
    a.repeatConsistency.reduce((n, r) => n + r.passes, 0),
    35,
  );
  assert.deepEqual(
    Object.values(a.byInterface).map((r) => r.outcomes.passed),
    [10, 9, 4, 12],
  );
  for (const p of a.paired) {
    assert.equal(p.pairs, 12);
    assert.equal(p.bothPassed + p.leftOnly + p.rightOnly + p.neitherPassed, 12);
    assert.equal(p.bothPassed + p.leftOnly, a.byInterface[p.left].outcomes.passed);
    assert.equal(p.bothPassed + p.rightOnly, a.byInterface[p.right].outcomes.passed);
  }
  assert.equal(a.paired.length, 6);
  for (const m of a.byModel) for (const p of m.paired) assert.equal(p.pairs, 6);
  for (const t of a.byTask) for (const p of t.paired) assert.equal(p.pairs, 4);
  assert.ok(
    Math.abs(
      Object.values(a.byInterface).reduce((n, r) => n + r.allowanceUSD, 0) -
        costs.totals.recordedUSD,
    ) < 1e-8,
  );
  assert.equal(validateCatalog(catalog).attempted, 48);
});

test('pairing uses repetition and within-pair differences, not marginal medians', () => {
  const s = structuredClone(summary),
    c = structuredClone(costs);
  for (const r of s.rows) {
    r.outcome = 'incomplete';
    c.rows.find((v) => v.phase === r.phase).outcome = r.outcome;
  }
  const pairs = [
    ['thread-reply', 1, 2, 1],
    ['thread-reply', 2, 101, 2],
    ['edit-message', 1, 102, 100],
  ];
  for (const [task, rep, left, right] of pairs)
    for (const [mode, time] of [
      ['a11y', left],
      ['api', right],
    ]) {
      const r = s.rows.find(
        (v) =>
          v.model === 'gpt-6.1-sol' &&
          v.task === task &&
          v.interface === mode &&
          v.repetition === rep,
      );
      r.durationMs = time * 1000;
      r.outcome = 'passed';
      c.rows.find((v) => v.phase === r.phase).outcome = r.outcome;
    }
  const a = analyzeRepeatedInterfaces(s, c),
    p = a.paired.find((v) => v.left === 'a11y' && v.right === 'api');
  assert.equal(p.bothPassed, 3);
  assert.equal(p.bothPassedMedianSecondsLeftMinusRight, 2);
  assert.equal(a.byInterface.pixels.medianSecondsPassed, null);
});

test('invalid repeats, duplicate cells, missing data and cost mismatch fail closed', () => {
  for (const edit of [
    (s) => s.rows.pop(),
    (s) => (s.rows[0].repetition = 3),
    (s) => (s.rows[1] = s.rows[0]),
    (s) => (s.rows[0].durationMs = null),
  ]) {
    const s = structuredClone(summary);
    edit(s);
    assert.throws(() => analyzeRepeatedInterfaces(s, costs));
  }
  const c = structuredClone(costs);
  c.rows[0].repetition = 3;
  assert.throws(() => analyzeRepeatedInterfaces(summary, c));
  const duplicate = structuredClone(catalog);
  duplicate.trials[1] = {
    ...duplicate.trials[1],
    model: duplicate.trials[0].model,
    task: duplicate.trials[0].task,
    interface: duplicate.trials[0].interface,
    repetition: duplicate.trials[0].repetition,
  };
  assert.throws(() => validateCatalog(duplicate), /Duplicate/);
  const legacy = structuredClone(catalog);
  legacy.campaign = 'old-study';
  assert.throws(() => validateCatalog(legacy), /Unexpected repetition/);
  const missing = structuredClone(catalog);
  delete missing.trials[0].repetition;
  assert.throws(() => validateCatalog(missing), /Invalid repetition/);
});
