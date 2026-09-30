import { TASK_IDS } from '../server/tasks.mjs';
import { INTERFACES, HISTORIES } from './protocol.mjs';
import { validateRates } from './router.mjs';

export function validateConfig(c) {
  const check = (ok, msg) => {
    if (!ok) throw Error(msg);
  };
  check(c && typeof c === 'object', 'Expected an experiment config.');
  const allowedKeys = [
    'provider',
    'models',
    'tasks',
    'seeds',
    'repeats',
    'interfaces',
    'guides',
    'histories',
    'orderSeed',
    'maxSteps',
    'maxRequests',
    'maxOutputTokens',
    'maxInputUnits',
    'episodeSeconds',
    'runSeconds',
    'maxEstimatedUSD',
  ];
  check(
    Object.keys(c).every((k) => allowedKeys.includes(k)),
    'Unknown configuration fields are rejected; never place credentials in run configs.',
  );
  check(['reference', 'ramp', 'typesafe'].includes(c.provider), 'Unknown provider.');
  for (const [key, allowed] of [
    ['tasks', TASK_IDS],
    ['interfaces', INTERFACES],
    ['histories', HISTORIES],
  ]) {
    check(
      Array.isArray(c[key]) &&
        c[key].length > 0 &&
        c[key].length <= allowed.length &&
        new Set(c[key]).size === c[key].length &&
        c[key].every((x) => allowed.includes(x)),
      `Invalid ${key}.`,
    );
  }
  check(
    Array.isArray(c.guides) &&
      c.guides.length > 0 &&
      c.guides.length <= 2 &&
      new Set(c.guides).size === c.guides.length &&
      c.guides.every((x) => typeof x === 'boolean'),
    'Invalid guides.',
  );
  check(
    Array.isArray(c.seeds) &&
      c.seeds.length > 0 &&
      c.seeds.length <= 10 &&
      new Set(c.seeds).size === c.seeds.length &&
      c.seeds.every((s) => Number.isSafeInteger(s) && s >= 0 && s <= 1e9),
    'Invalid seeds.',
  );
  check(
    Array.isArray(c.models) &&
      c.models.length > 0 &&
      c.models.length <= 8 &&
      new Set(c.models.map((m) => m.id)).size === c.models.length,
    'Select 1–8 unique models.',
  );
  for (const m of c.models) {
    check(
      Object.keys(m).every((k) => ['id', 'rates', 'vision', 'reasoning'].includes(k)),
      'Unknown model settings.',
    );
    if (m.rates)
      check(
        Object.keys(m.rates).every((k) => ['input', 'output'].includes(k)),
        'Unknown pricing settings.',
      );
    check(typeof m.id === 'string' && m.id.length > 0 && m.id.length < 200, 'Invalid model ID.');
    if (c.provider === 'reference')
      check(m.id === 'scripted-reference', 'Reference mode requires scripted-reference.');
    else {
      if (c.provider === 'typesafe') {
        check(
          m.rates &&
            Number.isFinite(m.rates.input) &&
            m.rates.input > 0 &&
            m.rates.input <= 1000 &&
            m.rates.output === 0,
          'Jev requires a positive input rate and zero output rate.',
        );
        check(!m.reasoning, 'Jev does not generate reasoning.');
      } else validateRates(m.rates);
      if (c.interfaces.includes('pixels'))
        check(
          m.vision === true,
          `${m.id}: explicitly confirm image-input support before pixels runs.`,
        );
      if (m.reasoning != null)
        check(
          ['none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'].includes(m.reasoning),
          'Invalid reasoning setting.',
        );
    }
  }
  if (c.provider === 'typesafe') {
    check(
      c.interfaces.every((m) => ['a11y', 'json-ui'].includes(m)),
      'Jev uses text UI observations, not pixels or API actions.',
    );
    check(
      !c.tasks.includes('handoff-dm'),
      'The bounded Jev candidate policy cannot compose novel handoff text. Use an LLM for this task.',
    );
  }
  if (c.provider === 'reference') {
    check(
      !c.interfaces.includes('pixels'),
      'Scripted references do not claim screenshot-only policy evidence. Select a live vision model for pixels.',
    );
    check(
      c.interfaces.every((m) => m === 'api') || c.tasks.every((t) => t === 'channel-topic'),
      'Text-UI reference demonstration supports channel-topic; other references are API-only.',
    );
  }
  for (const [k, lo, hi] of [
    ['repeats', 1, 5],
    ['orderSeed', 0, 1e9],
    ['maxSteps', 1, 100],
    ['maxRequests', 1, 500],
    ['maxOutputTokens', 128, 4096],
    ['maxInputUnits', 1000, 250000],
    ['episodeSeconds', 5, 300],
    ['runSeconds', 10, 3600],
  ])
    check(Number.isInteger(c[k]) && c[k] >= lo && c[k] <= hi, `${k} must be ${lo}..${hi}.`);
  check(
    Number.isFinite(c.maxEstimatedUSD) && c.maxEstimatedUSD > 0 && c.maxEstimatedUSD <= 5,
    'Local estimated-dollar cap must be >0 and ≤$5.',
  );
  check(
    c.tasks.length *
      c.seeds.length *
      c.repeats *
      c.models.length *
      c.interfaces.length *
      c.guides.length *
      c.histories.length <=
      240,
    'At most 240 episodes per local run.',
  );
  return structuredClone(c);
}

export function schedule(config) {
  const c = validateConfig(config);
  let state = c.orderSeed >>> 0;
  const random = () => {
    state += 0x6d2b79f5;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const blocks = [];
  for (const taskId of c.tasks)
    for (const seed of c.seeds)
      for (let repeat = 0; repeat < c.repeats; repeat++) {
        const cells = [];
        for (const model of c.models)
          for (const mode of c.interfaces)
            for (const guide of c.guides)
              for (const history of c.histories)
                cells.push({
                  taskId,
                  seed,
                  repeat,
                  model,
                  mode,
                  guide,
                  history,
                  block: `${taskId}:${seed}:${repeat}`,
                });
        blocks.push(shuffle(cells));
      }
  return shuffle(blocks)
    .flat()
    .map((cell, i) => ({ ...cell, episodeId: `episode-${String(i + 1).padStart(3, '0')}` }));
}

export const DEFAULT_CONFIG = {
  provider: 'reference',
  models: [{ id: 'scripted-reference' }],
  tasks: ['channel-topic'],
  seeds: [42],
  repeats: 1,
  interfaces: ['a11y', 'json-ui', 'api'],
  guides: [false],
  histories: ['recent-4'],
  orderSeed: 20260929,
  maxSteps: 30,
  maxRequests: 100,
  maxOutputTokens: 512,
  maxInputUnits: 64000,
  episodeSeconds: 90,
  runSeconds: 600,
  maxEstimatedUSD: 1,
};

export function aggregate(episodes) {
  const groups = new Map();
  for (const e of episodes.filter((e) => e.status !== 'queued' && e.status !== 'running')) {
    const key = [e.cell.model.id, e.cell.mode, e.cell.guide, e.cell.history].join('|');
    if (!groups.has(key))
      groups.set(key, {
        model: e.cell.model.id,
        interface: e.cell.mode,
        guide: e.cell.guide,
        history: e.cell.history,
        attempted: 0,
        passed: 0,
        errors: 0,
        steps: 0,
        latencyMs: 0,
        estimatedUSD: 0,
        usageKnown: true,
      });
    const g = groups.get(key);
    g.attempted++;
    g.passed += e.evaluation?.success === true ? 1 : 0;
    g.errors += !['completed', 'step_limit'].includes(e.status) ? 1 : 0;
    g.steps += e.steps ?? 0;
    g.latencyMs += e.durationMs ?? 0;
    g.estimatedUSD += e.estimatedUSD ?? 0;
    g.usageKnown &&= e.usageKnown !== false;
  }
  return [...groups.values()].map((g) => ({
    ...g,
    successRate: g.passed / g.attempted,
    meanSteps: g.steps / g.attempted,
    meanLatencyMs: g.latencyMs / g.attempted,
  }));
}

export function pairedComparisons(episodes) {
  const finished = episodes.filter((e) => e.status === 'completed' || e.status === 'step_limit');
  const output = [];
  for (const factor of ['mode', 'guide', 'history']) {
    const groups = new Map();
    for (const e of finished) {
      const c = e.cell;
      const key = JSON.stringify([
        c.model.id,
        c.block,
        ...['mode', 'guide', 'history'].filter((f) => f !== factor).map((f) => c[f]),
      ]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(e);
    }
    const sums = new Map();
    for (const group of groups.values()) {
      group.sort((a, b) => String(a.cell[factor]).localeCompare(String(b.cell[factor])));
      for (let i = 0; i < group.length; i++)
        for (let j = i + 1; j < group.length; j++) {
          const a = group[i],
            b = group[j],
            key = JSON.stringify([
              a.cell.model.id,
              a.cell[factor],
              b.cell[factor],
              ...['mode', 'guide', 'history'].filter((f) => f !== factor).map((f) => a.cell[f]),
            ]);
          if (!sums.has(key))
            sums.set(key, {
              factor,
              model: a.cell.model.id,
              a: a.cell[factor],
              b: b.cell[factor],
              heldFixed: Object.fromEntries(
                ['mode', 'guide', 'history'].filter((f) => f !== factor).map((f) => [f, a.cell[f]]),
              ),
              pairs: 0,
              successDelta: 0,
              stepDelta: 0,
            });
          const s = sums.get(key);
          s.pairs++;
          s.successDelta += (b.evaluation?.reward ?? 0) - (a.evaluation?.reward ?? 0);
          s.stepDelta += (b.steps ?? 0) - (a.steps ?? 0);
        }
    }
    output.push(
      ...[...sums.values()].map((s) => ({
        ...s,
        successDelta: s.successDelta / s.pairs,
        stepDelta: s.stepDelta / s.pairs,
      })),
    );
  }
  return output;
}
