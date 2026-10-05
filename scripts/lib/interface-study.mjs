import { validateConfig } from '../../runner/design.mjs';
import { counts } from './campaign-report.mjs';

export const STUDY_ID = 'interface-study-2026-10-05';
export const MODELS = ['gpt-6.1-sol', 'claude-sonnet-5-5', 'qwen3p8-max', 'grok-4.7'];
export const TASKS = [
  'channel-topic',
  'thread-reply',
  'edit-message',
  'incident-closeout',
  'saved-cleanup',
  'decision-record',
];
export const MODES = ['a11y', 'json-ui', 'pixels', 'api'];

export function createPlan(catalog) {
  const models = Object.fromEntries(
    MODELS.map((id) => {
      const m = catalog.models.find((m) => m.id === id);
      if (!m?.catalogRates || !m.imageInput || !m.reasoningEfforts.includes('low'))
        throw Error(`Image input, low reasoning and exact pricing must be confirmed: ${id}`);
      return [id, { id, rates: m.catalogRates, vision: true, reasoning: 'low' }];
    }),
  );
  let state = 20261005;
  const shuffle = (items) => {
    for (let i = items.length - 1; i > 0; i--) {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      const j = Math.floor((state / 2 ** 32) * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  const phases = [];
  for (const task of [TASKS[0], ...shuffle(TASKS.slice(1))])
    for (const model of shuffle([...MODELS]))
      for (const mode of shuffle([...MODES]))
        phases.push({
          id: `cell-${String(phases.length + 1).padStart(3, '0')}`,
          models: [model],
          tasks: [task],
          interfaces: [mode],
        });
  return {
    id: STUDY_ID,
    schemaVersion: 1,
    planned: 96,
    authorization:
      'User approved 4 image-capable models × 6 tasks × 4 modes, 96 fresh runs, $25 estimated-spend cap, no retries. Separate from all previous campaigns.',
    maxEstimatedUSD: 25,
    pilotCells: 16,
    maxWallSeconds: 28800,
    maxTotalRequests: 3840,
    maxArchiveBytes: 12e9,
    minimumFreeBytes: 10e9,
    seed: 2042,
    orderSeed: 20261005,
    models,
    catalog,
    common: {
      provider: 'ramp',
      seeds: [2042],
      repeats: 1,
      guides: [false],
      histories: ['recent-4'],
      orderSeed: 20261005,
      maxSteps: 40,
      maxRequests: 40,
      maxOutputTokens: 4096,
      maxInputUnits: 250000,
      episodeSeconds: 180,
      runSeconds: 240,
      maxEstimatedUSD: 1,
      requestTimeoutSeconds: 90,
      continueAfterRequestTimeout: true,
      continueAfterOutputLimit: true,
      continueAfterConnectionFailure: true,
      continueAfterEpisodeTimeout: true,
    },
    phases,
  };
}

export function cellConfig(plan, phase, remaining = 1) {
  const { id, models, ...settings } = phase;
  return validateConfig({
    ...plan.common,
    ...settings,
    maxEstimatedUSD: Math.min(1, remaining),
    models: models.map((id) => plan.models[id]),
  });
}

export function validatePlan(plan) {
  if (
    plan.id !== STUDY_ID ||
    plan.planned !== 96 ||
    plan.maxEstimatedUSD !== 25 ||
    plan.phases.length !== 96
  )
    throw Error('Unapproved study size or allowance.');
  const seen = new Set();
  for (const p of plan.phases) {
    const c = cellConfig(plan, p);
    if (
      c.tasks.length !== 1 ||
      c.models.length !== 1 ||
      c.interfaces.length !== 1 ||
      c.seeds[0] !== 2042
    )
      throw Error('Each cell must contain one fresh episode.');
    const key = [c.tasks[0], c.models[0].id, c.interfaces[0]].join('/');
    if (
      seen.has(key) ||
      !TASKS.includes(c.tasks[0]) ||
      !MODELS.includes(c.models[0].id) ||
      !MODES.includes(c.interfaces[0])
    )
      throw Error('Duplicate or unapproved cell.');
    seen.add(key);
  }
  if (seen.size !== 96) throw Error('Incomplete design.');
  return plan;
}

export function remainingAllowance(plan, reports) {
  const spent = reports.reduce((n, r) => {
    if (!Number.isFinite(r.estimatedUSD) || r.estimatedUSD < 0)
      throw Error('Invalid allowance ledger.');
    return n + r.estimatedUSD;
  }, 0);
  return Math.max(0, plan.maxEstimatedUSD - spent);
}

export function studySummary(plan, reports, status) {
  const recorded = new Map(reports.map((r) => [r.phase, r]));
  const rows = plan.phases.map(
    (p) =>
      recorded.get(p.id)?.rows[0] ?? {
        phase: p.id,
        model: p.models[0],
        task: p.tasks[0],
        interface: p.interfaces[0],
        seed: plan.seed,
        outcome: 'unattempted',
      },
  );
  const group = (rows) => ({
    ...counts(rows),
    estimatedUSD: rows.reduce((n, r) => n + (r.estimatedUSD ?? 0), 0),
  });
  return {
    id: plan.id,
    status,
    generatedAt: new Date().toISOString(),
    totals: counts(rows),
    rows,
    estimatedUSD: reports.reduce((n, r) => n + r.estimatedUSD, 0),
    reservedUSD: reports.reduce((n, r) => n + r.reservedUSD, 0),
    requests: reports.reduce((n, r) => n + r.requests, 0),
    remainingUSD: remainingAllowance(plan, reports),
    byInterface: Object.fromEntries(
      MODES.map((m) => [m, group(rows.filter((r) => r.interface === m))]),
    ),
    byModel: MODELS.map((model) => ({
      model,
      ...group(rows.filter((r) => r.model === model)),
      byInterface: Object.fromEntries(
        MODES.map((m) => [m, group(rows.filter((r) => r.model === model && r.interface === m))]),
      ),
    })),
    limitations: [
      'One fresh attempt per model/task/interface, six public development tasks, one seed. Exploratory paired comparison, not reliability or significance evidence.',
      'Interface is an observation/action bundle. API exposes structured state and semantic actions; it is tool use, not pixel-only computer use.',
      'Pixels use low-detail 1440×900 screenshots; accessibility exposes a document tree, while Page JSON exposes viewport text and controls.',
      'Low reasoning requested for every route; providers need not implement it equally. Model weights and provider routing are not pinned.',
      'Forty actions and 180 seconds are equal ceilings but do not equalize work per action. No guide; four-turn history.',
      'Unknown usage retains full reservations. Base-rate usage estimates are not invoices. Budget stops leave unattempted cells visible.',
    ],
  };
}
