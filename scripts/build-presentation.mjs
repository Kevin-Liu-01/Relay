import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { trialAccounting, sumAccounting } from './lib/report-accounting.mjs';
import assert from 'node:assert/strict';
import { modelComparison } from './lib/model-comparison.mjs';
import { comparisonSlide } from './lib/comparison-slide.mjs';
import { validateCatalog, validateRecord, trialId } from '../docs/review-app/data.mjs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  AppWindow,
  Layers,
  ScanEye,
  ShieldCheck,
  ListChecks,
  FlaskConical,
  Bot,
  ChartNoAxesCombined,
  Route,
  Gauge,
  Network,
  Play,
  MousePointer2,
  Accessibility,
  Braces,
  Cable,
  Database,
  FileCheck2,
  TimerReset,
  Camera,
  ArrowRight,
  Plus,
} from 'lucide-react';
import Openai from '@thesvg/react/openai';
import Slack from '@thesvg/react/slack';
import Gemini from '@thesvg/react/gemini';
import Deepseek from '@thesvg/react/deepseek';
import Nvidia from '@thesvg/react/nvidia';
import Zhipu from '@thesvg/react/zhipu';
import Anthropic from '@thesvg/react/anthropic';
import Qwen from '@thesvg/react/qwen';
import Grok from '@thesvg/react/grok';
import Kimi from '@thesvg/react/kimi';
import Minimax from '@thesvg/react/minimax';

const glyph = (component) =>
  renderToStaticMarkup(
    createElement(component, {
      className: 'glyph',
      size: 24,
      strokeWidth: 1.7,
      'aria-hidden': true,
    }),
  );
const mark = (component) =>
  renderToStaticMarkup(
    createElement(component, {
      width: 28,
      height: 28,
      variant: 'light',
      'aria-hidden': true,
    }),
  );
const relay = readFileSync('src/assets/relay-mark.svg', 'utf8').replace(
  '<svg ',
  '<svg aria-hidden="true" ',
);
const sectionIcons = [
  AppWindow,
  Layers,
  ScanEye,
  ShieldCheck,
  ListChecks,
  FlaskConical,
  Bot,
  ChartNoAxesCombined,
  ChartNoAxesCombined,
  Route,
  Gauge,
  Network,
  Play,
];
const fonts = [
  ['Camber', 'regular', 400],
  ['Camber', 'medium', 500],
  ['Camber', 'semibold', 600],
  ['Lato', 'regular', 400],
];
const fontStyles = fonts
  .map(([family, cut, weight]) => {
    const file = `${family === 'Lato' ? 'slack-lato' : 'camber'}-${cut}.woff2`;
    const data = readFileSync(`src/assets/fonts/${file}`).toString('base64');
    return `@font-face { font-family: 'Relay ${family}'; font-style: normal; font-weight: ${weight}; font-display: swap; src: url(data:font/woff2;base64,${data}) format('woff2'); }`;
  })
  .join('\n');
const summary = JSON.parse(readFileSync('evidence/campaigns/onsite-2026-10-01/summary.json'));
const comparisonId = JSON.parse(readFileSync('docs/current-comparison.json')).campaign;
if (!/^[a-z0-9-]+$/.test(comparisonId)) throw Error('Invalid current campaign ID.');
const comparisonPath = `evidence/campaigns/${comparisonId}/summary.json`;
const comparison = existsSync(comparisonPath)
  ? JSON.parse(readFileSync(comparisonPath))
  : modelComparison(JSON.parse(readFileSync(`docs/campaigns/${comparisonId}.json`)), []);
const reviewCatalog = existsSync('evidence/trial-library/catalog.json')
  ? validateCatalog(JSON.parse(readFileSync('evidence/trial-library/catalog.json')))
  : null;
const reviewIds = new Set(reviewCatalog?.trials.map((r) => r.id) ?? []);
const accounting = Object.fromEntries(
  (reviewCatalog?.trials ?? []).map((item) => {
    const bytes = readFileSync(`evidence/trial-library/${item.path.split('/').at(-1)}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256);
    return [item.id, trialAccounting(validateRecord(JSON.parse(gunzipSync(bytes)), item))];
  }),
);
const costs = sumAccounting(Object.values(accounting));
assert.ok(Math.abs(costs.recordedUSD - comparison.selectionEstimatedUSD) < 1e-8);
assert.ok(Math.abs(costs.reservedUSD - comparison.selectionReservedUSD) < 1e-8);
const costReport = {
  schema: 'relay-results-accounting-v1',
  campaign: comparisonId,
  summaryHash: reviewCatalog.summaryHash,
  scope:
    'Selected episodes only. Accepted token receipts at recorded base rates; not an invoice. Missing usage retains its reservation. No cache discount assumed.',
  totals: costs,
  sharedAllowanceUSD: comparison.recordedTotalUSD,
  priorOutsideSelectionUSD: comparison.recordedTotalUSD - costs.recordedUSD,
  remainingUSD: comparison.remainingUSD,
  trials: comparison.rows.map((row) => ({
    model: row.model,
    task: row.task,
    outcome: row.outcome,
    trialId: trialId(row),
    durationMs: row.durationMs,
    actionAttempts: row.actionAttempts,
    ...accounting[trialId(row)],
  })),
};
writeFileSync('docs/results-accounting.json', JSON.stringify(costReport, null, 2) + '\n');
const csvKeys = Object.keys(costReport.trials[0]);
writeFileSync(
  'docs/results-accounting.csv',
  [
    csvKeys.join(','),
    ...costReport.trials.map((row) =>
      csvKeys.map((key) => JSON.stringify(row[key] ?? '')).join(','),
    ),
  ].join('\n') + '\n',
);
if (comparisonId.startsWith('model-breadth-2026-10-03') && comparison.status === 'completed') {
  const verification = JSON.parse(
    readFileSync(`evidence/campaigns/${comparisonId}/verification.json`),
  );
  assert.equal(
    verification.status,
    'complete-verified',
    'Final slides require archive verification',
  );
  assert.equal(verification.attemptsVerified, 306, 'Every planned cell must be verified');
  assert.equal(reviewCatalog?.complete, true, 'Every final trial needs a public recording');
  assert.equal(
    reviewCatalog.summaryHash,
    verification.summaryHash,
    'Replay library binds final results',
  );
  assert.ok(
    comparison.rows.every((r) => reviewIds.has(trialId(r))),
    'No missing trial reviews',
  );
  assert.equal(
    verification.summaryHash,
    createHash('sha256').update(readFileSync(comparisonPath)).digest('hex'),
    'Verification must bind this exact result snapshot',
  );
}
const bench = JSON.parse(readFileSync('evidence/benchmark-2026-10-01.json'));
const backend = readFileSync('evidence/backend-tests.xml', 'utf8');
const browser = JSON.parse(readFileSync('evidence/reference/summary.json'));
if (backend.includes('<failure') || browser.tests.some((t) => t.status !== 'passed'))
  throw Error('Presentation requires passing software verification evidence.');
const labels = {
  a11y: 'Accessibility',
  'json-ui': 'Page JSON',
  pixels: 'Pixels',
  api: 'Actor API',
};
const interfaceIcons = {
  a11y: Accessibility,
  'json-ui': Braces,
  pixels: MousePointer2,
  api: Cable,
};
const bars = Object.entries(summary.byInterface)
  .map(
    ([key, c]) =>
      `<div class="result-row"><span class="interface-label">${glyph(interfaceIcons[key])}${labels[key]}</span><div class="bar">${['passed', 'incomplete', 'blocked', 'unattempted'].map((outcome) => (c[outcome] ? `<span class="segment ${outcome}" style="flex:${c[outcome]}" title="${c[outcome]} ${outcome}"></span>` : '')).join('')}</div><span>${c.passed} pass / ${c.attempted} tried · ${c.unattempted} not run</span></div>`,
  )
  .join('\n');
const values = {
  COMPARISON_ID: comparisonId,
  COMPARISON_PLANNED: comparison.totals.planned,
  COMPARISON_ATTEMPTED: comparison.totals.attempted,
  HANDOFF_RESULT: `${comparison.byTask.find((t) => t.task === 'handoff-dm').passed} / ${comparison.byTask.find((t) => t.task === 'handoff-dm').attempted}`,
  THREAD_REPAIR_RESULT: `${comparison.byTask.find((t) => t.task === 'thread-repair').passed} / ${comparison.byTask.find((t) => t.task === 'thread-repair').attempted}`,
  RELEASE_RESULT: `${comparison.byTask.find((t) => t.task === 'release-sync').passed} / ${comparison.byTask.find((t) => t.task === 'release-sync').attempted}`,
  SAVED_RESULT: `${comparison.byTask.find((t) => t.task === 'saved-cleanup').passed} / ${comparison.byTask.find((t) => t.task === 'saved-cleanup').attempted}`,
  DESIGN_RESULT: `${comparison.byTask.find((t) => t.task === 'design-handoff').passed} / ${comparison.byTask.find((t) => t.task === 'design-handoff').attempted}`,
  ...comparisonSlide(
    comparison,
    Object.fromEntries(
      [
        ['gpt-6-luna', Openai],
        ['gpt-6.1-sol', Openai],
        ['gpt-6-astra', Openai],
        ['gpt-oss-120b', Openai],
        ['claude-fable-5-1', Anthropic],
        ['claude-opus-5-5', Anthropic],
        ['claude-haiku-4-5', Anthropic],
        ['grok-4.7', Grok],
        ['kimi-k3', Kimi],
        ['minimax-m3', Minimax],
        ['deepseek-v4-pro-0813', Deepseek],
        ['glm-5p3', Zhipu],
        ['nemotron-3-ultra', Nvidia],
        ['claude-sonnet-5-5', Anthropic],
        ['gemini-3.8-flash', Gemini],
        ['qwen3p8-max', Qwen],
        ['gpt-4.1-nano', Openai],
        ['gemini-2.5-flash-lite', Gemini],
        ['deepseek-v4.1-flash', Deepseek],
        ['glm-5p3-flash', Zhipu],
        ['nemotron-lightning-3p5-30b-a3b', Nvidia],
      ].map(([id, icon]) => [id, mark(icon)]),
    ),
    reviewIds,
    accounting,
  ),
  COST_SUMMARY: `<div class="cost-summary" aria-label="Cost breakdown"><span><strong>$${costs.acceptedUSD.toFixed(4)}</strong>Usage estimate</span><span><strong>$${costs.reservedUSD.toFixed(4)}</strong>Unresolved · ${costs.unknownRequests} calls</span><span><strong>$${costs.recordedUSD.toFixed(4)}</strong>Total allowance · 306 trials</span></div>`,
  COST_DETAIL: `Total allowance adds the usage estimate to money reserved for missing usage. These are estimates, not invoices. Including earlier tests: $${comparison.recordedTotalUSD.toFixed(4)} of the $300 budget.`,
  PRESENTATION_STYLES: `${fontStyles}\n${readFileSync('docs/presentation.css', 'utf8')}`,
  OPENAI_MARK: mark(Openai),
  SLACK_MARK: mark(Slack),
  ...Object.fromEntries(
    Object.entries({
      TASK: ListChecks,
      WORKSPACE: AppWindow,
      POLICY: Bot,
      CHECK: ShieldCheck,
      PIXELS: MousePointer2,
      A11Y: Accessibility,
      JSON: Braces,
      API: Cable,
      DATABASE: Database,
      BROWSER: AppWindow,
      STATE: FileCheck2,
      TEST: FlaskConical,
      QUEUE: Layers,
      EVIDENCE: FileCheck2,
      RESET: TimerReset,
      CAMERA: Camera,
      ARROW: ArrowRight,
      PLUS: Plus,
    }).map(([name, component]) => [`ICON_${name}`, glyph(component)]),
  ),
  BACKEND_TESTS: [...backend.matchAll(/<testcase\b/g)].length,
  BROWSER_TESTS: browser.tests.length,
  ATTEMPTED: summary.totals.attempted,
  PASSED: summary.totals.passed,
  INCOMPLETE: summary.totals.incomplete,
  BLOCKED: summary.totals.blocked,
  UNATTEMPTED: summary.totals.unattempted,
  REQUESTS: summary.requests,
  COST: summary.estimatedUSD.toFixed(6),
  RESULT_BARS: bars,
  CREATE_MS: bench.latency.create.p50Ms.toFixed(2),
  RESET_MS: bench.latency.reset.p50Ms.toFixed(2),
  SCREENSHOT_MS: bench.latency.screenshot.p50Ms.toFixed(2),
};
let html = readFileSync('docs/presentation.template.html', 'utf8').replace(
  /\{\{([A-Z0-9_]+)\}\}/g,
  (_, key) => {
    if (!(key in values)) throw Error(`Unknown presentation field: ${key}`);
    return values[key];
  },
);
if (/\{\{[^}]+\}\}/.test(html)) throw Error('Unresolved presentation template field.');
let sectionIndex = 0;
html = html.replace(/(<section\b[^>]*data-title="([^"]+)"[^>]*>)/g, (_, tag, title) => {
  const icon = sectionIcons[sectionIndex++];
  if (!icon) throw Error('Missing presentation section icon.');
  return `${tag}<header class="masthead"><span class="wordmark">${relay}Relay</span><span class="section-label">${glyph(icon)}${title}<span class="section-number">${String(sectionIndex).padStart(2, '0')} / 13</span></span></header>`;
});
if (sectionIndex !== 13) throw Error('Expected thirteen presentation sections.');
writeFileSync('docs/presentation.html', html);
// One table, accounting source and controller for both surfaces.
const resultSection = html.match(/<section class="slide comparison-slide[\s\S]*?<\/section>/)[0];
const dialog = html.match(/<dialog id="trials-dialog"[\s\S]*?<\/dialog>/)[0];
const controls = html.match(/<script>[\s\S]*?<\/script>/)[0];
writeFileSync(
  'docs/results.html',
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Relay — Results and replays</title><link rel="canonical" href="https://relay.kevinliu.studio/results"><style>${values.PRESENTATION_STYLES}</style></head><body class="results-page"><header class="results-nav"><a href="/">← Relay</a><a href="/play">Try Slack</a><a href="/presentation">Presentation</a></header><main>${resultSection.replace('class="slide ', 'class="results-panel ').replace(/<span class="section-number">[\s\S]*?<\/span>/, '')}</main>${dialog}${controls}</body></html>`,
);
console.log(
  JSON.stringify({
    slides: 13,
    backendChecks: values.BACKEND_TESTS,
    browserChecks: values.BROWSER_TESTS,
    earlierInterfaceEpisodes: values.ATTEMPTED,
    onePassAttempted: comparison.totals.attempted,
  }),
);
