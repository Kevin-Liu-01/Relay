import test from 'node:test';
import assert from 'node:assert/strict';
import { outcomePresentation } from '../shared/run-outcome.mjs';

test('outcome explanations distinguish verified checks, execution blocks and limits', () => {
  const evaluation = { success: true, checks: [{ name: 'topic_correct', passed: true }] };
  for (const [status, title, tone] of [
    ['completed', 'Task passed', 'passed'],
    ['budget', 'Run limit reached', 'limit'],
    ['timeout', 'Time limit reached', 'limit'],
    ['output_limit', 'Output limit reached', 'limit'],
    ['provider_unavailable', 'Provider unavailable', 'blocked'],
    ['credentials_invalid', 'Key needs attention', 'blocked'],
    ['credits_exhausted', 'Router credit required', 'blocked'],
    ['model_unavailable', 'Model unavailable', 'blocked'],
    ['interrupted', 'Run blocked', 'blocked'],
    ['cancelled', 'Run stopped', 'stopped'],
    ['running', 'Running', 'pending'],
  ]) {
    const input = { status, evaluation };
    const before = JSON.stringify(input);
    const result = outcomePresentation(input);
    assert.equal(result.title, title);
    assert.equal(result.tone, tone);
    assert.equal(JSON.stringify(input), before, 'Presentation cannot rewrite historical evidence');
    if (tone !== 'passed') assert.doesNotMatch(result.detail, /checks passed|verified/);
  }
  const incomplete = outcomePresentation({
    status: 'step_limit',
    evaluation: { success: false, checks: [{ passed: true }, { passed: false }] },
  });
  assert.equal(incomplete.kind, 'incomplete');
  assert.equal(incomplete.detail, 'Action limit · 1/2 checks passed');
  assert.equal(outcomePresentation({ status: 'completed' }).title, 'Outcome unavailable');
  const legacy = outcomePresentation({
    status: 'provider_error',
    error: 'Router HTTP 403; secret upstream body',
    evaluation,
  });
  assert.equal(legacy.kind, 'blocked');
  assert.equal(legacy.title, 'Provider unavailable');
  assert.doesNotMatch(JSON.stringify(legacy), /secret upstream/);
});
