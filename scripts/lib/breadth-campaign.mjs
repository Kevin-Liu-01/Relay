import { TASK_IDS } from '../../server/tasks.mjs';
import { validateConfig, schedule } from '../../runner/design.mjs';
import { counts } from './campaign-report.mjs';
import { modelComparison } from './model-comparison.mjs';
export { remainingAllowance, blockReport } from './task-campaign-v2.mjs';

export const TASK_CAMPAIGN_ID = 'model-breadth-2026-10-03';
export const MODEL_IDS = [
  'gpt-6-astra',
  'gpt-6.1-sol',
  'gpt-6-luna',
  'gpt-oss-120b',
  'claude-fable-5-1',
  'claude-opus-5-5',
  'claude-sonnet-5-5',
  'claude-haiku-4-5',
  'grok-4.7',
  'qwen3p8-max',
  'deepseek-v4-pro-0813',
  'deepseek-v4.1-flash',
  'glm-5p3',
  'glm-5p3-flash',
  'kimi-k3',
  'minimax-m3',
  'nemotron-3-ultra',
];
const key = (r) => `${r.model}/${r.task}/${r.seed}`;
export function createTaskPlan(catalog, priorCampaigns, previous, initialHashes) {
  if (previous.id !== 'all-tasks-2026-10-03' || previous.status !== 'stopped')
    throw Error('Carryover must come from the closed Qwen campaign.');
  const carryoverRows = previous.rows
    .filter((r) => r.outcome !== 'unattempted')
    .map((r) => ({
      ...r,
      originCampaign: previous.id,
      cohort: 'preserved',
    }));
  if (carryoverRows.length !== 37 || carryoverRows.some((r) => r.seed !== 1042))
    throw Error('Unexpected carryover; review every changed source row.');
  const models = Object.fromEntries(
    MODEL_IDS.map((id) => {
      const row = catalog.models.find((m) => m.id === id);
      if (
        !row?.catalogRates ||
        !['input', 'output'].every(
          (k) => Number.isFinite(row.catalogRates[k]) && row.catalogRates[k] > 0,
        )
      )
        throw Error('Missing exact-model catalog rates: ' + id);
      return [id, { id, rates: row.catalogRates }];
    }),
  );
  let state = 20261003;
  const shuffle = (items) => {
    for (let i = items.length - 1; i > 0; i--) {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      const j = Math.floor((state / 2 ** 32) * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  const used = new Set(carryoverRows.map(key));
  const phases = [];
  // Each new route gets three task trials before the bulk gate; none are repeated.
  const tasks = [
    'channel-topic',
    'thread-reply',
    'edit-message',
    ...shuffle(
      TASK_IDS.filter((t) => !['channel-topic', 'thread-reply', 'edit-message'].includes(t)),
    ),
  ];
  for (const task of tasks)
    for (const model of shuffle([...MODEL_IDS])) {
      if (used.has(`${model}/${task}/1042`)) continue;
      phases.push({
        id: `block-${String(phases.length + 1).padStart(3, '0')}`,
        tasks: [task],
        seeds: [1042],
        models: [model],
        orderSeed: 20262000 + phases.length,
      });
    }
  return {
    id: TASK_CAMPAIGN_ID,
    schemaVersion: 1,
    authorization:
      'User requested flagship and popular model-family coverage, every task once, no repeats. The existing shared $300 authorization is not reset.',
    selectionBasis:
      'Breadth across currently catalog-listed model families and flagship/standard/efficient tiers; not a measured popularity ranking. No duplicate hosting aliases or historical generations.',
    planned: 306,
    trialsPerTaskModel: 1,
    seed: 1042,
    newPlanned: 269,
    maxEstimatedUSD: 300,
    pilotBlocks: 36,
    maxWallSeconds: 86400,
    maxTotalRequests: 12000,
    maxArchiveBytes: 10e9,
    minimumFreeBytes: 10e9,
    sourceHash: previous.sourceHash,
    initialHashes,
    priorCampaigns,
    carryoverRows,
    carryover: {
      id: previous.id,
      estimatedUSD: previous.estimatedUSD,
      reservedUSD: previous.reservedUSD,
      auditChecks: previous.auditChecks,
      requests: previous.requests,
      inputTokens: previous.inputTokens,
      outputTokens: previous.outputTokens,
    },
    unavailable: [
      {
        family: 'Google Gemini',
        reason:
          'Requires a Google provider key in Router; prior 403. Not silently replaced or counted as task failures.',
      },
      {
        family: 'Meta Llama / Mistral',
        reason: 'No eligible route in the account catalog at preparation.',
      },
      {
        family: 'Jev',
        reason:
          'Requires a different API and action contract; excluded from this matched accessibility-policy comparison.',
      },
    ],
    catalog: { at: catalog.at, hash: catalog.hash },
    models,
    common: {
      provider: 'ramp',
      tasks: TASK_IDS,
      repeats: 1,
      interfaces: ['a11y'],
      guides: [false],
      histories: ['recent-4'],
      maxSteps: 40,
      maxRequests: 40,
      maxOutputTokens: 4096,
      maxInputUnits: 250000,
      episodeSeconds: 180,
      runSeconds: 240,
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
export function taskConfig(plan, phase, remaining = 300) {
  const { id, models, ...settings } = phase;
  return validateConfig({
    ...plan.common,
    ...settings,
    maxEstimatedUSD: Math.min(plan.common.maxEstimatedUSD, remaining),
    models: models.map((m) => plan.models[m]),
  });
}
export function validateTaskPlan(plan) {
  if (
    plan.id !== TASK_CAMPAIGN_ID ||
    plan.planned !== 306 ||
    plan.newPlanned !== 269 ||
    plan.trialsPerTaskModel !== 1 ||
    plan.seed !== 1042 ||
    plan.maxEstimatedUSD !== 300 ||
    plan.phases.length !== 269 ||
    plan.pilotBlocks !== 36 ||
    JSON.stringify(Object.keys(plan.models)) !== JSON.stringify(MODEL_IDS) ||
    JSON.stringify(plan.common.tasks) !== JSON.stringify(TASK_IDS)
  )
    throw Error('Unapproved size, model set or ceiling.');
  const seen = new Set();
  for (const row of plan.carryoverRows) {
    if (
      !MODEL_IDS.includes(row.model) ||
      !TASK_IDS.includes(row.task) ||
      row.seed !== 1042 ||
      row.outcome === 'unattempted' ||
      row.originCampaign !== plan.carryover.id ||
      seen.has(key(row))
    )
      throw Error('Invalid/duplicate carryover.');
    seen.add(key(row));
  }
  const phases = new Set();
  for (const phase of plan.phases) {
    if (phases.has(phase.id)) throw Error('Duplicate phase.');
    phases.add(phase.id);
    const cells = schedule(taskConfig(plan, phase));
    if (cells.length !== 1) throw Error('One isolated cell per phase.');
    const c = cells[0],
      k = `${c.model.id}/${c.taskId}/${c.seed}`;
    if (seen.has(k) || c.seed !== 1042 || !plan.initialHashes[c.taskId])
      throw Error('Duplicate/unapproved cell.');
    seen.add(k);
  }
  if (seen.size !== 306) throw Error('Incomplete one-shot matrix.');
  return plan;
}
export function taskCampaignSummary(plan, reports, status) {
  const planned = modelComparison(plan, []).rows;
  const actual = new Map(reports.flatMap((r) => r.rows).map((r) => [key(r), r]));
  const newRows = planned.map((r) => ({
    ...(actual.get(key(r)) ?? r),
    originCampaign: plan.id,
    cohort: 'new',
  }));
  const rows = [...plan.carryoverRows, ...newRows];
  const summarize = (subset) => {
    const c = counts(subset),
      attempts = subset.filter((r) => r.outcome !== 'unattempted');
    const times = attempts
      .filter((r) => Number.isFinite(r.durationMs))
      .map((r) => r.durationMs / 1000)
      .sort((a, b) => a - b);
    const i = Math.floor(times.length / 2);
    return {
      ...c,
      successRate: c.attempted ? c.passed / c.attempted : null,
      medianSeconds: times.length
        ? times.length % 2
          ? times[i]
          : (times[i - 1] + times[i]) / 2
        : null,
      estimatedUSD: attempts.length ? attempts.reduce((n, r) => n + r.estimatedUSD, 0) : null,
      usageKnown: attempts.length ? attempts.every((r) => r.usageKnown === true) : null,
      returnedModels: [...new Set(attempts.flatMap((r) => r.returnedModels))],
    };
  };
  const sum = (k) => reports.reduce((n, r) => n + (r[k] ?? 0), 0);
  const priorRecordedUSD = plan.priorCampaigns.reduce((n, p) => n + p.recordedUSD, 0);
  return {
    id: plan.id,
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    status,
    evidenceKind: 'live-model-development-coverage-inventory',
    trialsPerTaskModel: 1,
    totals: counts(rows),
    rows,
    byModel: MODEL_IDS.map((model) => ({
      model,
      ...summarize(rows.filter((r) => r.model === model)),
    })),
    byTask: TASK_IDS.map((task) => ({
      task,
      ...summarize(rows.filter((r) => r.task === task)),
      byModel: MODEL_IDS.map((model) => ({
        model,
        ...summarize(rows.filter((r) => r.task === task && r.model === model)),
      })),
    })),
    estimatedUSD: sum('estimatedUSD'),
    reservedUSD: sum('reservedUSD'),
    priorRecordedUSD,
    recordedTotalUSD: priorRecordedUSD + sum('estimatedUSD'),
    remainingUSD: Math.max(0, 300 - priorRecordedUSD - sum('estimatedUSD')),
    selectionEstimatedUSD: plan.carryover.estimatedUSD + sum('estimatedUSD'),
    selectionReservedUSD: plan.carryover.reservedUSD + sum('reservedUSD'),
    requests: plan.carryover.requests + sum('requests'),
    inputTokens: plan.carryover.inputTokens + sum('inputTokens'),
    outputTokens: plan.carryover.outputTokens + sum('outputTokens'),
    auditChecks: plan.carryover.auditChecks + sum('auditChecks'),
    preserved: plan.carryoverRows.length,
    newlyAttempted: counts(newRows).attempted,
    phases: reports.map((r) => ({
      id: r.phase,
      runId: r.runId,
      archive: r.archive,
      auditChecks: r.auditChecks,
      safeToContinue: r.safeToContinue,
    })),
    limitations: [
      'One attempt per model/task on 18 public development templates at seed 1042. No reliability estimate, significance test, or held-out leaderboard.',
      'All 37 prior matching attempts are preserved, including failed and access-blocked cells; they are never retried. Cohort and original campaign/episode identities remain explicit.',
      'Temporal cohort and provider-routing effects are not controlled. Provider-default reasoning differs under the same 4096-token ceiling. This is a coverage inventory, not a causal ranking.',
      'Models are curated family/tier representatives from the account catalog, not an exhaustive or measured popularity list. Unavailable families are disclosed separately.',
      'Same frozen actor/harness/grader source and initial state, accessibility actions, recent-four history, 40 attempts and 180-second deadline. Other interfaces remain separate historical evidence.',
      'Partial output never executes. Allowed truncations/transport failures end the cell and retain receipts/reservations; authentication, unsafe cleanup, invalid evidence and the shared cap stop the worker.',
      'All prior pilot and diagnostic costs stay charged to the same $300 authorization. Imported rows are displayed once and their costs are not charged twice.',
      'Archives are locally preserved and hash checked, not independently signed or necessarily uploaded. Times include failures and capture overhead; costs are estimates, not invoices.',
    ],
  };
}
