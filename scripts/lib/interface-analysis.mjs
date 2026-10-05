// Descriptive matched comparisons. No inference from one attempt per cell.
import assert from 'node:assert/strict';
import { MODELS, TASKS, MODES } from './interface-study.mjs';

export const modeNames = {
  a11y: 'Accessibility',
  'json-ui': 'Page JSON',
  pixels: 'Pixels',
  api: 'API',
};
const sum = (values) => values.reduce((a, b) => a + b, 0);
const median = (values) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b),
    n = sorted.length;
  return (sorted[Math.floor((n - 1) / 2)] + sorted[Math.floor(n / 2)]) / 2;
};
const tally = (rows, field) =>
  Object.fromEntries(
    [...new Set(rows.map((r) => r[field]))]
      .sort()
      .map((v) => [v, rows.filter((r) => r[field] === v).length]),
  );

export function analyzeInterfaces(summary, accounting) {
  assert.equal(summary.status, 'completed', 'Analysis requires the complete verified study.');
  assert.equal(summary.rows.length, 96);
  assert.equal(accounting.rows.length, 96);
  const costs = new Map(accounting.rows.map((r) => [r.phase, r]));
  assert.equal(costs.size, 96, 'Duplicate cost phase.');
  const cells = new Map();
  for (const row of summary.rows) {
    assert.ok(
      MODELS.includes(row.model) && TASKS.includes(row.task) && MODES.includes(row.interface),
    );
    assert.ok(['passed', 'incomplete', 'blocked'].includes(row.outcome));
    const key = `${row.model}/${row.task}/${row.interface}`;
    assert.ok(!cells.has(key), 'Duplicate study cell.');
    const cost = costs.get(row.phase);
    assert.ok(
      cost &&
        cost.model === row.model &&
        cost.task === row.task &&
        cost.interface === row.interface,
    );
    assert.equal(cost.outcome, row.outcome);
    for (const v of [
      row.durationMs,
      row.actionAttempts,
      cost.acceptedUSD,
      cost.reservedUSD,
      cost.recordedUSD,
    ])
      assert.ok(Number.isFinite(v) && v >= 0, 'Missing or invalid measurement.');
    assert.ok(Math.abs(cost.acceptedUSD + cost.reservedUSD - cost.recordedUSD) < 1e-8);
    assert.ok(Math.abs(row.estimatedUSD - cost.recordedUSD) < 1e-8);
    cells.set(key, { ...row, cost });
  }
  const rows = [...cells.values()];
  assert.ok(Math.abs(sum(rows.map((r) => r.cost.recordedUSD)) - summary.estimatedUSD) < 1e-8);
  const describe = (selected) => ({
    attempts: selected.length,
    outcomes: tally(selected, 'outcome'),
    blockedReasons: tally(
      selected.filter((r) => r.outcome === 'blocked'),
      'status',
    ),
    medianSecondsAll: median(selected.map((r) => r.durationMs / 1000)),
    medianSecondsPassed: median(
      selected.filter((r) => r.outcome === 'passed').map((r) => r.durationMs / 1000),
    ),
    medianActionsAll: median(selected.map((r) => r.actionAttempts)),
    usageUSD: sum(selected.map((r) => r.cost.acceptedUSD)),
    unresolvedUSD: sum(selected.map((r) => r.cost.reservedUSD)),
    allowanceUSD: sum(selected.map((r) => r.cost.recordedUSD)),
    unknownRequests: sum(selected.map((r) => r.cost.unknownRequests)),
  });
  const paired = (models) =>
    MODES.flatMap((left, i) =>
      MODES.slice(i + 1).map((right) => {
        const pairs = models.flatMap((model) =>
          TASKS.map((task) => ({
            model,
            task,
            left: cells.get(`${model}/${task}/${left}`),
            right: cells.get(`${model}/${task}/${right}`),
          })),
        );
        assert.ok(
          pairs.every((p) => p.left && p.right),
          'Incomplete matched block.',
        );
        const lp = (p) => p.left.outcome === 'passed',
          rp = (p) => p.right.outcome === 'passed';
        const both = pairs.filter((p) => lp(p) && rp(p));
        return {
          left,
          right,
          pairs: pairs.length,
          bothPassed: both.length,
          leftOnly: pairs.filter((p) => lp(p) && !rp(p)).length,
          rightOnly: pairs.filter((p) => !lp(p) && rp(p)).length,
          neitherPassed: pairs.filter((p) => !lp(p) && !rp(p)).length,
          blockedEither: pairs.filter(
            (p) => p.left.outcome === 'blocked' || p.right.outcome === 'blocked',
          ).length,
          // Secondary, outcome-selected comparison; not a speed estimate for all tasks.
          bothPassedMedianSecondsLeftMinusRight: median(
            both.map((p) => (p.left.durationMs - p.right.durationMs) / 1000),
          ),
          bothPassedMedianActionsLeftMinusRight: median(
            both.map((p) => p.left.actionAttempts - p.right.actionAttempts),
          ),
          bothPassedMedianAllowanceLeftMinusRight: median(
            both.map((p) => p.left.cost.recordedUSD - p.right.cost.recordedUSD),
          ),
        };
      }),
    );
  return {
    schema: 'relay-interface-analysis-v1',
    design:
      '24 matched model/task blocks, four interfaces, one attempt per cell. Descriptive only.',
    byInterface: Object.fromEntries(
      MODES.map((m) => [m, describe(rows.filter((r) => r.interface === m))]),
    ),
    paired: paired(MODELS),
    byModel: MODELS.map((model) => ({
      model,
      byInterface: Object.fromEntries(
        MODES.map((mode) => [
          mode,
          describe(rows.filter((r) => r.model === model && r.interface === mode)),
        ]),
      ),
      paired: paired([model]),
    })),
    diagnosticPassesBlocked: rows
      .filter((r) => r.outcome === 'blocked' && r.diagnosticSuccess)
      .map((r) => r.phase),
    limitations: [
      'Pass discordance retains blocked attempts as not passed, but reports blocks separately. It does not isolate model ability.',
      'All-attempt time medians include early stops. Both-passed differences select on the observed outcome and are secondary descriptions.',
      'Passed-only medians use different successful task subsets across model/interface cells. No passes means no completion-time estimate, not zero seconds.',
      'Shared-host activity affects elapsed time. API exposes semantic actions and structured data; pixels use low-detail images on macOS.',
      'No p-values, confidence intervals, repeated-trial reliability estimates or general model ranking are claimed.',
    ],
  };
}
