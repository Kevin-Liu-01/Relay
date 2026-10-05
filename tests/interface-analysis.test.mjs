import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { analyzeInterfaces } from '../scripts/lib/interface-analysis.mjs';
const dir = 'evidence/campaigns/interface-study-2026-10-05';
const summary = JSON.parse(readFileSync(`${dir}/verified-summary.json`));
const accounting = JSON.parse(readFileSync(`${dir}/accounting.json`));
test('matched analysis retains all outcomes, blocks and accounting', () => {
  const a = analyzeInterfaces(summary, accounting);
  assert.equal(a.paired.length, 6);
  for (const p of a.paired) {
    assert.equal(p.bothPassed + p.leftOnly + p.rightOnly + p.neitherPassed, 24);
    assert.equal(p.bothPassed + p.leftOnly, summary.byInterface[p.left].passed);
    assert.equal(p.bothPassed + p.rightOnly, summary.byInterface[p.right].passed);
  }
  for (const m of a.byModel)
    for (const p of m.paired)
      assert.equal(p.bothPassed + p.leftOnly + p.rightOnly + p.neitherPassed, 6);
  assert.equal(a.byInterface.pixels.outcomes.blocked, 19);
  assert.deepEqual(a.diagnosticPassesBlocked, ['cell-012', 'cell-026']);
  assert.ok(
    Math.abs(
      Object.values(a.byInterface).reduce((n, r) => n + r.allowanceUSD, 0) -
        accounting.totals.recordedUSD,
    ) < 1e-8,
  );
});
test('matched analysis rejects missing, duplicate, invalid and mismatched cells', () => {
  const missing = structuredClone(summary);
  missing.rows.pop();
  assert.throws(() => analyzeInterfaces(missing, accounting));
  const duplicate = structuredClone(summary);
  duplicate.rows[1] = duplicate.rows[0];
  assert.throws(() => analyzeInterfaces(duplicate, accounting), /Duplicate/);
  const invalid = structuredClone(summary);
  invalid.rows[0].durationMs = null;
  assert.throws(() => analyzeInterfaces(invalid, accounting), /invalid measurement/);
  const wrong = structuredClone(accounting);
  wrong.rows[0].outcome = 'blocked';
  assert.throws(() => analyzeInterfaces(summary, wrong));
  const money = structuredClone(accounting);
  money.rows[0].recordedUSD += 1;
  assert.throws(() => analyzeInterfaces(summary, money));
});
test('both-passed differences use the median of within-task differences', () => {
  const s = structuredClone(summary),
    c = structuredClone(accounting);
  for (const r of s.rows) {
    r.outcome = 'incomplete';
    c.rows.find((v) => v.phase === r.phase).outcome = 'incomplete';
  }
  // Three pairs: left [2,101,102], right [1,2,100]. Median difference is 2, not 99.
  for (const [i, task] of ['channel-topic', 'thread-reply', 'edit-message'].entries()) {
    for (const [mode, seconds] of [
      ['a11y', [2, 101, 102][i]],
      ['api', [1, 2, 100][i]],
    ]) {
      const r = s.rows.find(
        (v) => v.model === 'gpt-6.1-sol' && v.task === task && v.interface === mode,
      );
      r.outcome = 'passed';
      r.durationMs = seconds * 1000;
      c.rows.find((v) => v.phase === r.phase).outcome = 'passed';
    }
  }
  const a = analyzeInterfaces(s, c),
    p = a.paired.find((v) => v.left === 'a11y' && v.right === 'api');
  assert.equal(p.bothPassed, 3);
  assert.equal(p.bothPassedMedianSecondsLeftMinusRight, 2);
  assert.equal(
    a.paired.find((v) => v.left === 'pixels').bothPassedMedianSecondsLeftMinusRight,
    null,
  );
});
