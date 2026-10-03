import { TASK_IDS } from '../../server/tasks.mjs';
import { schedule, validateConfig } from '../../runner/design.mjs';
import { counts, campaignSummary } from './campaign-report.mjs';
import { modelComparison } from './model-comparison.mjs';

export const TASK_CAMPAIGN_ID = 'all-tasks-2026-10-03';
export const MODEL_IDS = [
  'gpt-6.1-sol',
  'claude-sonnet-5-5',
  'qwen3p8-max',
  'deepseek-v4.1-flash',
  'glm-5p3-flash',
];
export function createTaskPlan(catalog, priorCampaigns) {
  const modelRows = MODEL_IDS.map((id) => {
    const row = catalog.models.find((m) => m.id === id);
    if (!row?.catalogRates) throw Error('Missing exact-model catalog rates: ' + id);
    return [id, { id, rates: row.catalogRates }];
  });
  let state = 20261003;
  const shuffle = (items) => {
    for (let i = items.length - 1; i > 0; i--) {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      const j = Math.floor((state / 2 ** 32) * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  const pilot = [
    'channel-topic',
    'thread-reply',
    'edit-message',
    'incident-triage',
    'decision-record',
  ];
  const phases = [];
  for (let seed = 1042; seed < 1062; seed++) {
    const tasks =
      seed === 1042
        ? [...pilot, ...shuffle(TASK_IDS.filter((t) => !pilot.includes(t)))]
        : shuffle([...TASK_IDS]);
    for (const task of tasks)
      phases.push({
        id: `block-${String(phases.length + 1).padStart(3, '0')}`,
        tasks: [task],
        seeds: [seed],
        models: MODEL_IDS,
        orderSeed: 20261100 + phases.length,
      });
  }
  return {
    id: TASK_CAMPAIGN_ID,
    schemaVersion: 1,
    authorization:
      'User approved all 18 tasks, five listed models, 20 fresh trials per task/model and $300 total estimated allowance.',
    trialsPerTaskModel: 20,
    planned: 1800,
    maxEstimatedUSD: 300,
    pilotBlocks: 5,
    maxWallSeconds: 172800,
    maxTotalRequests: 72000,
    maxArchiveBytes: 20e9,
    minimumFreeBytes: 10e9,
    priorCampaigns,
    catalog: { at: catalog.at, hash: catalog.hash },
    models: Object.fromEntries(modelRows),
    common: {
      provider: 'ramp',
      tasks: TASK_IDS,
      repeats: 1,
      interfaces: ['a11y'],
      guides: [false],
      histories: ['recent-4'],
      maxSteps: 40,
      maxRequests: 200,
      maxOutputTokens: 4096,
      maxInputUnits: 250000,
      episodeSeconds: 180,
      runSeconds: 1200,
      maxEstimatedUSD: 5,
      requestTimeoutSeconds: 90,
      continueAfterRequestTimeout: true,
      continueAfterOutputLimit: true,
      continueAfterConnectionFailure: true,
      continueAfterEpisodeTimeout: true,
    },
    phases,
  };
}
export function taskConfig(plan, phase, remaining = 5) {
  const { id, models, ...settings } = phase;
  return validateConfig({
    ...plan.common,
    ...settings,
    maxEstimatedUSD: Math.min(5, remaining),
    models: models.map((m) => plan.models[m]),
  });
}
export function validateTaskPlan(plan) {
  if (
    plan.id !== TASK_CAMPAIGN_ID ||
    plan.maxEstimatedUSD !== 300 ||
    plan.phases.length !== 360 ||
    plan.planned !== 1800
  )
    throw Error('Unapproved campaign size or ceiling.');
  if (
    JSON.stringify(Object.keys(plan.models)) !== JSON.stringify(MODEL_IDS) ||
    JSON.stringify(plan.common.tasks) !== JSON.stringify(TASK_IDS)
  )
    throw Error('Model/task set changed.');
  const seen = new Set();
  for (const phase of plan.phases) {
    const cells = schedule(taskConfig(plan, phase));
    if (cells.length !== 5 || new Set(cells.map((c) => c.block)).size !== 1)
      throw Error('Invalid matched block.');
    for (const c of cells) {
      const key = [c.taskId, c.seed, c.model.id].join('/');
      if (seen.has(key) || c.seed < 1042 || c.seed > 1061)
        throw Error('Duplicate/unapproved cell.');
      seen.add(key);
    }
  }
  if (seen.size !== 1800) throw Error('Incomplete design.');
  return plan;
}
export function remainingAllowance(plan, reports) {
  const prior = plan.priorCampaigns.reduce((n, p) => n + p.recordedUSD, 0);
  const spent = reports.reduce((n, r) => n + r.estimatedUSD, 0);
  if (![prior, spent].every((n) => Number.isFinite(n) && n >= 0)) throw Error('Invalid ledger.');
  return Math.max(0, plan.maxEstimatedUSD - prior - spent);
}
export function taskCampaignSummary(plan, reports, status) {
  const shell = modelComparison(plan, []);
  const actual = new Map(
    reports.flatMap((r) => r.rows).map((r) => [`${r.phase}/${r.episodeId}`, r]),
  );
  const rows = shell.rows.map((r) => actual.get(`${r.phase}/${r.episodeId}`) ?? r);
  const median = (a) => {
    a.sort((a, b) => a - b);
    const i = Math.floor(a.length / 2);
    return a.length ? (a.length % 2 ? a[i] : (a[i - 1] + a[i]) / 2) : null;
  };
  const summarize = (subset) => {
    const attempted = subset.filter((r) => r.outcome !== 'unattempted');
    const c = counts(subset);
    return {
      ...c,
      successRate: c.attempted ? c.passed / c.attempted : null,
      medianSeconds: median(attempted.map((r) => r.durationMs / 1000)),
      estimatedUSD: attempted.length ? attempted.reduce((n, r) => n + r.estimatedUSD, 0) : null,
      usageKnown: attempted.length ? attempted.every((r) => r.usageKnown === true) : null,
      returnedModels: [...new Set(attempted.flatMap((r) => r.returnedModels))],
    };
  };
  const sum = (key) => reports.reduce((n, r) => n + (r[key] ?? 0), 0);
  return {
    id: plan.id,
    schemaVersion: 1,
    status,
    generatedAt: new Date().toISOString(),
    evidenceKind: 'live-model-development-campaign',
    trialsPerTaskModel: 20,
    totals: counts(rows),
    rows,
    byModel: MODEL_IDS.map((model) => ({
      model,
      ...summarize(rows.filter((r) => r.model === model)),
    })),
    byTask: plan.common.tasks.map((task) => ({
      task,
      ...summarize(rows.filter((r) => r.task === task)),
      byModel: MODEL_IDS.map((model) => ({
        model,
        ...summarize(rows.filter((r) => r.task === task && r.model === model)),
      })),
    })),
    estimatedUSD: sum('estimatedUSD'),
    reservedUSD: sum('reservedUSD'),
    requests: sum('requests'),
    inputTokens: sum('inputTokens'),
    outputTokens: sum('outputTokens'),
    usageKnown: reports.every((r) => r.usageKnown),
    priorRecordedUSD: plan.priorCampaigns.reduce((n, p) => n + p.recordedUSD, 0),
    remainingUSD: remainingAllowance(plan, reports),
    auditChecks: sum('auditChecks'),
    phases: reports.map(({ phase, runId, auditChecks, archive, safeToContinue }) => ({
      id: phase,
      runId,
      auditChecks,
      archive,
      safeToContinue,
    })),
    limitations: [
      '18 public development task templates, 20 fixture seeds per model/task; not 360 independent semantic tasks or a held-out benchmark.',
      'Accessibility browser control only; no pixel-policy or actor-API equivalence claim.',
      'One provider with model-default sampling/reasoning; exact request routes, not pinned weights. All returned identifiers are retained.',
      'Strict passed/attempted includes blocked trials. Missing trials stay unattempted. No global model ranking or significance claim.',
      'Known output-limit usage is included; unknown connection/timeout receipts retain full reservations. No inference retries.',
      'Budget, authentication, invalid receipt, harness, cleanup and integrity failures stop collection. Per-episode deadlines remain truncated results.',
      'Median time includes failures and observer overhead. Dollar figures are catalog-rate estimates/reservations, not invoices.',
      'Pilot stage is the first five prespecified task/seed blocks; results stay in this campaign if software/source/settings remain frozen.',
    ],
  };
}
export function blockReport(plan, phase, run, audit, traces) {
  const part = campaignSummary({ ...plan, phases: [phase] }, [
    { id: phase.id, run, audit, traces },
  ]);
  const reservedUSD = Object.values(traces).reduce((n, trace) => n + unresolvedUSD(trace), 0);
  return {
    ...part,
    phase: phase.id,
    runId: run.id,
    reservedUSD,
    auditChecks: audit.integrity.checks.length,
  };
}
export function unresolvedUSD(trace) {
  let pending = 0;
  for (const event of trace) {
    if (event.kind === 'request') {
      if (pending || !Number.isFinite(event.reservedUSD) || event.reservedUSD <= 0)
        throw Error('Ambiguous reservation ledger.');
      pending = event.reservedUSD;
    }
    if (
      (event.kind === 'response' && event.response?.usage) ||
      (event.kind === 'provider_error' && event.usageAccepted && event.receipt?.usage)
    )
      pending = 0;
  }
  return pending;
}
