import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { modelComparison } from './lib/model-comparison.mjs';
import { comparisonSlide } from './lib/comparison-slide.mjs';
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
  ...comparisonSlide(
    comparison,
    Object.fromEntries(
      [
        ['gpt-6-luna', Openai],
        ['gpt-6.1-sol', Openai],
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
  ),
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
console.log(
  JSON.stringify({
    slides: 13,
    backendChecks: values.BACKEND_TESTS,
    browserChecks: values.BROWSER_TESTS,
    attemptedModelEpisodes: values.ATTEMPTED,
  }),
);
