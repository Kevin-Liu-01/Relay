import { campaignSummary, counts } from './campaign-report.mjs';

const median = (values) => {
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  const i = Math.floor(sorted.length / 2);
  return sorted.length ? (sorted.length % 2 ? sorted[i] : (sorted[i - 1] + sorted[i]) / 2) : null;
};

export function modelComparison(plan, phases) {
  const summary = campaignSummary(plan, phases);
  delete summary.workflowByModel;
  summary.byModel = Object.keys(plan.models).map((model) => {
    const rows = summary.rows.filter((r) => r.model === model);
    const attempted = rows.filter((r) => r.outcome !== 'unattempted');
    const c = counts(rows);
    const usageKnown = attempted.length ? attempted.every((r) => r.usageKnown === true) : null;
    return {
      model,
      ...c,
      successRate: c.attempted ? c.passed / c.attempted : null,
      medianSeconds: median(
        attempted.map((r) => (r.durationMs == null ? null : r.durationMs / 1000)),
      ),
      estimatedUSD: attempted.length
        ? attempted.reduce((n, r) => n + (r.estimatedUSD ?? 0), 0)
        : null,
      usageKnown,
      returnedModels: [...new Set(attempted.flatMap((r) => r.returnedModels))],
    };
  });
  summary.limitations = [
    'Five public development templates × four seeds per model; seeds are not independent task families or a held-out split.',
    'Accessibility browser control only; this table does not compare pixel policies or actor API.',
    'Identical harness settings; provider-default sampling/reasoning may differ. Requested routes are not pinned model weights.',
    'Pass rate uses all attempted episodes. Show unattempted and blocked counts; incomplete coverage cannot establish model ordering.',
    'Median wall time includes early blocked episodes and observer overhead; not time-to-success or hosted latency.',
    plan.common.continueAfterRequestTimeout
      ? 'Estimates use catalog base rates, not invoices. Individual request timeouts retain their full reservations and permit the next planned cell; no retry. Other unknown receipts stop the campaign.'
      : 'Estimates use catalog base rates, not invoices. Unknown receipts retain reservations and stop further inference.',
  ];
  if (plan.common.continueAfterOutputLimit)
    summary.limitations.push(
      'Validated output-limit receipts count as blocked/truncated trials with known usage. Partial actions are never executed; only the next planned cell can run.',
    );
  return summary;
}

export function trialsCSV(rows) {
  const columns = [
    'phase',
    'episodeId',
    'model',
    'returnedModels',
    'task',
    'seed',
    'interface',
    'outcome',
    'status',
    'actionAttempts',
    'rejectedActions',
    'durationMs',
    'estimatedUSD',
    'usageKnown',
    'failedChecks',
    'error',
  ];
  const quote = (v) =>
    `"${String(Array.isArray(v) ? v.join('; ') : (v ?? '')).replaceAll('"', '""')}"`;
  return (
    [columns.join(','), ...rows.map((r) => columns.map((k) => quote(r[k])).join(','))].join('\n') +
    '\n'
  );
}
