import { schedule } from '../../runner/design.mjs';
import { episodeOutcome } from '../../shared/run-outcome.mjs';

const sum = (rows, key) => rows.reduce((n, r) => n + (r[key] ?? 0), 0);
export function counts(rows) {
  return {
    planned: rows.length,
    attempted: rows.filter((r) => r.outcome !== 'unattempted').length,
    passed: rows.filter((r) => r.outcome === 'passed').length,
    incomplete: rows.filter((r) => r.outcome === 'incomplete').length,
    blocked: rows.filter((r) => r.outcome === 'blocked').length,
    unattempted: rows.filter((r) => r.outcome === 'unattempted').length,
    actionAttempts: sum(rows, 'actionAttempts'),
    rejectedActions: sum(rows, 'rejectedActions'),
    captureWarnings: sum(rows, 'captureWarnings'),
    durationMs: sum(rows, 'durationMs'),
  };
}
export function campaignSummary(plan, phases) {
  const rows = [];
  for (const phase of plan.phases) {
    const { id, models, ...settings } = phase;
    const config = { ...plan.common, ...settings, models: models.map((id) => plan.models[id]) };
    const saved = phases.find((p) => p.id === id);
    for (const cell of schedule(config)) {
      const e = saved?.run.episodes.find((e) => e.cell.episodeId === cell.episodeId);
      const trace = saved?.traces?.[cell.episodeId] ?? [];
      rows.push({
        phase: id,
        episodeId: cell.episodeId,
        runId: saved?.run.id ?? null,
        task: cell.taskId,
        seed: cell.seed,
        model: cell.model.id,
        interface: cell.mode,
        status: e?.status ?? 'queued',
        outcome:
          !e || e.status === 'queued'
            ? 'unattempted'
            : episodeOutcome(e).kind === 'pending'
              ? 'blocked'
              : episodeOutcome(e).kind,
        diagnosticSuccess: e?.evaluation?.success ?? null,
        actionAttempts: e?.steps ?? 0,
        rejectedActions: trace.filter((t) => t.kind === 'step' && t.error).length,
        invalidJSON: trace.filter((t) => t.kind === 'step' && t.error && !t.action).length,
        durationMs: e?.durationMs ?? null,
        estimatedUSD: e?.estimatedUSD ?? null,
        usageKnown: e?.usageKnown ?? null,
        captureWarnings: e?.captureWarnings?.length ?? 0,
        error: e?.error ?? null,
        failedChecks: e?.evaluation?.checks.filter((c) => !c.passed).map((c) => c.name) ?? [],
        returnedModels: [
          ...new Set(
            trace
              .filter((t) => t.kind === 'response' || t.kind === 'provider_error')
              .map((t) => t.response?.returnedModel ?? t.receipt?.returnedModel)
              .filter(Boolean),
          ),
        ],
        pointerEvents: trace.filter((t) => t.kind === 'pointer').length,
        replaySnapshots: trace.filter((t) => t.replay).length,
      });
    }
  }
  return {
    id: plan.id,
    schemaVersion: 1,
    evidenceKind: 'live-model-development-campaign',
    generatedAt: new Date().toISOString(),
    totals: counts(rows),
    estimatedUSD: phases.reduce((n, p) => n + p.run.budget.estimatedUSD, 0),
    usageKnown: phases.every((p) => p.run.budget.usageKnown),
    requests: phases.reduce((n, p) => n + p.run.budget.requests, 0),
    inputTokens: phases.reduce((n, p) => n + p.run.budget.inputTokens, 0),
    outputTokens: phases.reduce((n, p) => n + p.run.budget.outputTokens, 0),
    phases: phases.map((p) => ({
      id: p.id,
      runId: p.run.id,
      status: p.run.status,
      sourceHash: p.run.sourceHash,
      configHash: p.run.configHash,
      audit: p.audit.integrity.status,
    })),
    byInterface: Object.fromEntries(
      ['a11y', 'json-ui', 'pixels', 'api'].map((mode) => [
        mode,
        counts(rows.filter((r) => r.interface === mode)),
      ]),
    ),
    workflowByModel: Object.fromEntries(
      Object.keys(plan.models).map((model) => [
        model,
        counts(rows.filter((r) => r.phase === 'workflows' && r.model === model)),
      ]),
    ),
    rows,
    limitations: [
      'One seed and repetition on public development templates; no leaderboard or generalization claim.',
      'Two requested model routes from one lab, through one provider; not cross-provider replication.',
      'Pixels have a different task/model matrix; pooled interface totals are not causal contrasts.',
      'API changes both observation and action granularity; it is not computer-use performance.',
      'Estimated costs use reported usage at catalog base rates, not invoices; reservations stay unknown.',
      'Local visual capture adds observer overhead and does not establish hosted capture reliability.',
    ],
  };
}
