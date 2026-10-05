import assert from 'node:assert/strict';
import { validateConfig } from '../../runner/design.mjs';
import { counts } from './campaign-report.mjs';

export const STUDY_ID = 'interface-repeat-2026-10-05';
export const MODELS = ['gpt-6.1-sol', 'claude-sonnet-5-5'];
export const TASKS = ['thread-reply', 'edit-message', 'incident-closeout'];
export const MODES = ['a11y', 'json-ui', 'pixels', 'api'];

export function createPlan(catalog) {
  const models = Object.fromEntries(
    MODELS.map((id) => {
      const m = catalog.models.find((m) => m.id === id);
      assert.ok(
        m?.catalogRates &&
          m.imageInput &&
          m.reasoningEfforts.includes('low') &&
          !m.unavailableReason,
        `Image input, availability, low reasoning and exact pricing must be confirmed: ${id}`,
      );
      return [id, { id, rates: m.catalogRates, vision: true, reasoning: 'low' }];
    }),
  );
  let state = 26100548;
  const shuffle = (items) => {
    for (let i = items.length - 1; i > 0; i--) {
      state = (Math.imul(1664525, state) + 1013904223) >>> 0;
      const j = Math.floor((state / 2 ** 32) * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  };
  // One block contains all modes for one model/task/repetition. The admission
  // prefix covers both routes and all four modes. Later block order is shuffled.
  const admission = shuffle(MODELS.map((model) => ({ model, task: TASKS[0], repetition: 1 })));
  const rest = [];
  for (const repetition of [1, 2])
    for (const model of MODELS)
      for (const task of TASKS)
        if (repetition !== 1 || task !== TASKS[0]) rest.push({ model, task, repetition });
  const phases = [];
  for (const block of [...admission, ...shuffle(rest)])
    for (const mode of shuffle([...MODES]))
      phases.push({
        id: `cell-${String(phases.length + 1).padStart(3, '0')}`,
        repetition: block.repetition,
        models: [block.model],
        tasks: [block.task],
        interfaces: [mode],
      });
  return {
    id: STUDY_ID,
    schemaVersion: 1,
    planned: 48,
    authorization:
      'User approved 48 new runs: Sol and Sonnet, three tasks, four interfaces, two fresh attempts per condition. Separate additional $25 estimated-spend ceiling. No request retries or replacement cells.',
    maxEstimatedUSD: 25,
    pilotCells: 8,
    maxWallSeconds: 28800,
    maxTotalRequests: 1920,
    maxArchiveBytes: 12e9,
    minimumFreeBytes: 10e9,
    seed: 2042,
    orderSeed: 26100548,
    repetitions: 2,
    models,
    catalog,
    common: {
      provider: 'ramp',
      seeds: [2042],
      repeats: 1,
      guides: [false],
      histories: ['recent-4'],
      orderSeed: 26100548,
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
  assert.ok(Number.isFinite(remaining) && remaining > 0, 'Positive finite allowance required.');
  const { id, repetition, models, ...settings } = phase;
  return validateConfig({
    ...plan.common,
    ...settings,
    maxEstimatedUSD: Math.min(plan.common.maxEstimatedUSD, remaining),
    models: models.map((id) => plan.models[id]),
  });
}

export function validatePlan(plan) {
  // Reject changed limits, added overrides, duplicates, reordered cells and
  // model/task substitutions, including seemingly innocuous extra fields.
  assert.deepEqual(plan, createPlan(plan.catalog), 'Unapproved study plan or schedule.');
  for (const phase of plan.phases) cellConfig(plan, phase);
  return plan;
}

export function remainingAllowance(plan, reports) {
  const ids = new Set();
  let spent = 0;
  for (const report of reports) {
    assert.ok(
      !ids.has(report.phase) && plan.phases.some((p) => p.id === report.phase),
      'Duplicate or unknown report.',
    );
    assert.ok(
      Number.isFinite(report.estimatedUSD) && report.estimatedUSD >= 0,
      'Invalid allowance ledger.',
    );
    ids.add(report.phase);
    spent += report.estimatedUSD;
  }
  assert.ok(spent <= plan.maxEstimatedUSD + 1e-8, 'Study allowance exceeded.');
  return Math.max(0, plan.maxEstimatedUSD - spent);
}

export function studySummary(plan, reports, status) {
  const remainingUSD = remainingAllowance(plan, reports);
  const recorded = new Map(reports.map((r) => [r.phase, r]));
  const rows = plan.phases.map((p) => ({
    ...(recorded.get(p.id)?.rows[0] ?? {
      phase: p.id,
      model: p.models[0],
      task: p.tasks[0],
      interface: p.interfaces[0],
      seed: plan.seed,
      outcome: 'unattempted',
    }),
    repetition: p.repetition,
  }));
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
    remainingUSD,
    byInterface: Object.fromEntries(
      MODES.map((mode) => [mode, group(rows.filter((r) => r.interface === mode))]),
    ),
    byModel: MODELS.map((model) => ({
      model,
      ...group(rows.filter((r) => r.model === model)),
      byInterface: Object.fromEntries(
        MODES.map((mode) => [
          mode,
          group(rows.filter((r) => r.model === model && r.interface === mode)),
        ]),
      ),
    })),
    limitations: [
      'Two fresh attempts per model/task/interface on three selected public development tasks. Repetitions are not new tasks or held-out evidence.',
      'Follow-up selection used prior engineering knowledge; historical outcomes are not pooled into this comparison. No universal or authoritative ranking.',
      'Interfaces change both observation and actions. API is semantic tool use, not screenshot-based computer use.',
      'Pixels use low-detail 1440×900 images on macOS. Keyboard behavior is platform-dependent. This protocol is unchanged from the earlier study.',
      'Low reasoning requested for both routes; provider semantics and unpinned model routing can differ.',
      'Forty actions and 180 seconds are equal ceilings, not equal work. Elapsed time includes local shared-host activity; blocked attempts can end early.',
      'Usage estimates and retained unknown reservations are separate and are not invoices. No retry, replacement, or stopping after a favorable result.',
    ],
  };
}
