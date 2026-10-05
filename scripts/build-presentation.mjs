import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { trialAccounting, sumAccounting } from './lib/report-accounting.mjs';
import assert from 'node:assert/strict';
import { modelComparison } from './lib/model-comparison.mjs';
import { comparisonSlide } from './lib/comparison-slide.mjs';
import { analyzeInterfaces } from './lib/interface-analysis.mjs';
import { repeatPresentation } from './lib/interface-repeat-presentation.mjs';
import { presenterNotes } from './lib/presenter-notes.mjs';
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
  Search,
  MessagesSquare,
  PencilLine,
  ArrowLeft,
  LayoutGrid,
  NotebookPen,
  Maximize,
  Minimize,
  Download,
  Link,
  Keyboard,
  X,
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
const sectionIcons = {
  'My approach': FileCheck2,
  'The environment': AppWindow,
  'All workflows': ListChecks,
  'Define success': ListChecks,
  'The repeatable harness': Network,
  'The scope expands': Layers,
  'Agent interfaces': ScanEye,
  Verification: ShieldCheck,
  'Comparison setup': FlaskConical,
  'Interpreting interface results': ScanEye,
  'Model comparison': ChartNoAxesCombined,
  'Matched interface study': FlaskConical,
  'Interface results': ChartNoAxesCombined,
  'Main lesson': Route,
  'Session isolation': ShieldCheck,
  'Run speed': Gauge,
  'Resource choices': Database,
  'Scaling the runner': Network,
  'The next benchmark version': Network,
  'Demonstration and discussion': Play,
};
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
const studyPath = 'evidence/campaigns/interface-study-2026-10-05/verified-summary.json';
const study = existsSync(studyPath) ? JSON.parse(readFileSync(studyPath)) : null;
const studyCatalogPath = 'evidence/interface-trial-library/catalog.json';
const studyCatalog = existsSync(studyCatalogPath)
  ? validateCatalog(JSON.parse(readFileSync(studyCatalogPath)))
  : null;
if (study) {
  const receipt = JSON.parse(
    readFileSync(
      `evidence/campaigns/interface-study-2026-10-05/verification-public-${study.totals.attempted}.json`,
    ),
  );
  assert.equal(
    receipt.summaryHash,
    createHash('sha256').update(readFileSync(studyPath)).digest('hex'),
  );
  if (studyCatalog) assert.equal(studyCatalog.summaryHash, receipt.summaryHash);
}
const studyModes = ['a11y', 'json-ui', 'pixels', 'api'];
const studyNames = {
  'gpt-6.1-sol': 'GPT-6.1 Sol',
  'claude-sonnet-5-5': 'Claude Sonnet 5.5',
  'qwen3p8-max': 'Qwen 3.8 Max',
  'grok-4.7': 'Grok 4.7',
};
const studyMarks = {
  'gpt-6.1-sol': Openai,
  'claude-sonnet-5-5': Anthropic,
  'qwen3p8-max': Qwen,
  'grok-4.7': Grok,
};
const studyAnalysis =
  study?.status === 'completed'
    ? analyzeInterfaces(
        study,
        JSON.parse(readFileSync('evidence/campaigns/interface-study-2026-10-05/accounting.json')),
      )
    : null;
const studyHeading = (name, type = 'number', direction = 'descending') =>
  `<th scope="col" aria-sort="none"><button type="button" data-type="${type}" data-direction="${direction}">${name}<span class="sort-arrow" aria-hidden="true">↕</span></button></th>`;
const apiPair = studyAnalysis?.paired.find((p) => p.left === 'a11y' && p.right === 'api');
const elapsed = (seconds) => (seconds == null ? 'N/A' : `${seconds.toFixed(1)} s`);
const studyTable = study
  ? `<div class="table-scroll" tabindex="0" role="region" aria-label="Sortable interface results"><table class="study-table sortable" id="interface-results"><caption>Passed / attempted · median elapsed time in seconds · six tasks per cell</caption><thead><tr>${studyHeading('Model', 'text', 'ascending')}${studyModes.map((m) => studyHeading(labels[m])).join('')}${studyHeading('Allowance', 'number', 'ascending')}</tr></thead><tbody>${study.byModel
      .map(
        (row) =>
          `<tr><th scope="row" data-sort="${studyNames[row.model]}"><span class="study-model">${mark(studyMarks[row.model])}${studyNames[row.model]}</span></th>${studyModes
            .map((m) => {
              const c = row.byInterface[m];
              const timing = studyAnalysis?.byModel.find((r) => r.model === row.model)?.byInterface[
                m
              ];
              const trial = studyCatalog?.trials.find(
                (t) => t.model === row.model && t.interface === m,
              );
              const value = `<strong>${c.passed} / ${c.attempted}</strong>`;
              const link = trial
                ? `<a href="https://relay.kevinliu.studio/demo/review.html?study=interfaces&amp;trial=${trial.id}&amp;view=replay" aria-label="Review ${studyNames[row.model]} ${labels[m]} tasks">${value}</a>`
                : value;
              return `<td data-sort="${c.passed}">${link}<small>${c.incomplete} incomplete · ${c.blocked} blocked${c.unattempted ? ` · ${c.unattempted} not run` : ''}</small><dl class="study-times" aria-label="Median elapsed time"><div><dt>All</dt><dd data-time="all">${elapsed(timing?.medianSecondsAll)}</dd></div><div><dt>Passed</dt><dd data-time="passed">${elapsed(timing?.medianSecondsPassed)}</dd></div></dl></td>`;
            })
            .join(
              '',
            )}<td data-sort="${row.estimatedUSD}">$${row.estimatedUSD.toFixed(4)}</td></tr>`,
      )
      .join('')}</tbody></table></div>`
  : '<div class="takeaway">The matched study is prepared. No results are available yet.</div>';
const repeat = repeatPresentation({
  heading: studyHeading,
  mark,
  names: studyNames,
  marks: studyMarks,
  elapsed,
});
const values = {
  INTERFACE_REPEAT_RESULTS: repeat.table,
  INTERFACE_REPEAT_FINDINGS: repeat.findings,
  INTERFACE_REPEAT_STATUS: repeat.status,
  PAIRED_BOTH: apiPair?.bothPassed ?? 'Pending',
  PIXEL_BLOCKED: studyAnalysis?.byInterface.pixels.outcomes.blocked ?? 'Pending',
  PIXEL_CONNECTIONS:
    studyAnalysis?.byInterface.pixels.blockedReasons.provider_connection_error ?? 'Pending',
  PAIRED_DETAIL: apiPair
    ? `24 API/accessibility pairs: ${apiPair.bothPassed} both passed · ${apiPair.rightOnly} API only · ${apiPair.leftOnly} accessibility only · ${apiPair.neitherPassed} neither passed. ${apiPair.blockedEither} pairs include a blocked attempt.`
    : 'Matched results are pending.',
  PAIRED_TIMING: apiPair
    ? `On ${apiPair.bothPassed} shared passes, median accessibility-minus-API differences were +${apiPair.bothPassedMedianActionsLeftMinusRight} actions, +${apiPair.bothPassedMedianSecondsLeftMinusRight.toFixed(3)} seconds, and +$${apiPair.bothPassedMedianAllowanceLeftMinusRight.toFixed(5)}.`
    : 'Matched timing is pending.',
  INTERFACE_STUDY_TITLE:
    study?.status === 'completed'
      ? 'Interface comparison: 96 recorded attempts'
      : `Interface comparison: ${study?.totals.attempted ?? 0} of 96 recorded`,
  INTERFACE_STUDY_RESULTS:
    studyTable +
    (studyCatalog
      ? '<div class="study-links"><a href="https://relay.kevinliu.studio/demo/review.html?study=interfaces">All traces and replays ↗</a><a href="https://relay.kevinliu.studio/demo/interface-study-accounting.csv">Costs CSV ↓</a><a href="https://github.com/Kevin-Liu-01/Relay/blob/main/evidence/campaigns/interface-study-2026-10-05/analysis.md">Paired results and timing ↗</a></div>'
      : ''),
  INTERFACE_STUDY_FINDINGS: studyAnalysis
    ? '<li>All-attempt medians include early stops, while passed-run medians use only successful tasks.</li><li>Passed tasks differ across cells, so these medians do not establish a speed ranking.</li>'
    : '<li>Compare interfaces within the same model and task, not against the earlier 306 runs.</li><li>API actions change structured data directly, so API results measure tool use.</li><li>One attempt per condition cannot establish a reliable winner.</li>',
  INTERFACE_STUDY_STATUS: study
    ? `Verified: ${study.totals.passed} passed · ${study.totals.incomplete} incomplete · ${study.totals.blocked} blocked${study.totals.unattempted ? ` · ${study.totals.unattempted} not run` : ''}. Usage estimate $${(study.estimatedUSD - study.reservedUSD).toFixed(4)} + unresolved $${study.reservedUSD.toFixed(4)} = $${study.estimatedUSD.toFixed(4)} of $25.`
    : 'Authorized: 96 runs, $25 estimated-spend ceiling, no retries. Results are pending.',
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
  PRESENTATION_STYLES: `${fontStyles}\n${readFileSync('docs/presentation.css', 'utf8')}\n${readFileSync('docs/presenter.css', 'utf8')}`,
  PRESENTER_SCRIPT: readFileSync('docs/presenter.js', 'utf8'),
  PRESENTER_NOTES: presenterNotes(
    readFileSync('docs/presentation-notes.md', 'utf8'),
    [
      ...readFileSync('docs/presentation.template.html', 'utf8').matchAll(
        /<section\b[^>]*data-title="([^"]+)"/g,
      ),
    ].map((m) => m[1]),
  ),
  PRESENTER_PREV: glyph(ArrowLeft),
  PRESENTER_NEXT: glyph(ArrowRight),
  PRESENTER_GRID: glyph(LayoutGrid),
  PRESENTER_NOTES_ICON: glyph(NotebookPen),
  PRESENTER_EXPAND: glyph(Maximize),
  PRESENTER_COLLAPSE: glyph(Minimize),
  PRESENTER_DOWNLOAD: glyph(Download),
  PRESENTER_LINK: glyph(Link),
  PRESENTER_KEYS: glyph(Keyboard),
  PRESENTER_CLOSE: glyph(X),
  PRESENTER_SEARCH: glyph(Search),
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
      SEARCH: Search,
      THREAD: MessagesSquare,
      EDIT: PencilLine,
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
  ...Object.fromEntries(
    [
      ['PIXEL', 'pixels'],
      ['A11Y', 'a11y'],
      ['JSON', 'json-ui'],
      ['API', 'api'],
    ].map(([name, key]) => [
      `${name}_PASS_COUNT`,
      `${summary.byInterface[key].passed} / ${summary.byInterface[key].attempted}`,
    ]),
  ),
  CREATE_MS: bench.latency.create.p50Ms.toFixed(2),
  RESET_MS: bench.latency.reset.p50Ms.toFixed(2),
  ACTION_MS: bench.latency.actionHttp.p50Ms.toFixed(2),
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
// The generated download works without adjacent assets. The raw template keeps
// relative icon links so opening it in the repository also has a favicon.
for (const [file, type] of [
  ['relay-favicon.ico', 'image/x-icon'],
  ['relay-mark.svg', 'image/svg+xml'],
]) {
  html = html.replaceAll(
    `../src/assets/${file}`,
    `data:${type};base64,${readFileSync(`src/assets/${file}`).toString('base64')}`,
  );
}
const faviconLinks = html.match(/<link rel="icon"[^>]*>/g).join('');
let sectionIndex = 0;
const sectionCount = [...html.matchAll(/<section\b[^>]*data-title=/g)].length;
html = html.replace(/(<section\b[^>]*data-title="([^"]+)"[^>]*>)/g, (_, tag, title) => {
  const icon = sectionIcons[title];
  sectionIndex++;
  if (!icon) throw Error('Missing presentation section icon.');
  const slideId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${tag.replace('>', ` data-slide-id="${slideId}">`)}<header class="masthead"><span class="wordmark">${relay}Relay</span><span class="section-label">${glyph(icon)}${title}<span class="section-number">${String(sectionIndex).padStart(2, '0')} / ${sectionCount}</span></span></header>`;
});
assert.equal(sectionIndex, Object.keys(sectionIcons).length);
writeFileSync('docs/presentation.html', html);
// One table, accounting source and controller for both surfaces.
const resultSection = html.match(/<section class="slide comparison-slide[\s\S]*?<\/section>/)[0];
const repeatSection = html.match(
  /<section class="slide interface-study-results repeat-study-results[\s\S]*?<\/section>/,
)[0];
const dialog = html.match(/<dialog id="trials-dialog"[\s\S]*?<\/dialog>/)[0];
const controls = html.match(/<script>[\s\S]*?<\/script>/)[0];
writeFileSync(
  'docs/results.html',
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Relay · Results and replays</title>${faviconLinks}<link rel="canonical" href="https://relay.kevinliu.studio/results"><style>${values.PRESENTATION_STYLES}</style></head><body class="results-page"><header class="results-nav"><a href="/">← Relay</a><a href="/play">Try Slack</a><a href="/presentation">Presentation</a><a href="/presentation#interface-results">96-run study</a><a href="#interface-repeat-results">48-run follow-up</a></header><main>${resultSection.replace('class="slide ', 'class="results-panel ').replace(/<span class="section-number">[\s\S]*?<\/span>/, '')}${repeatSection
    .replace('class="slide ', 'class="results-panel ')
    .replace(/<span class="section-number">[\s\S]*?<\/span>/, '')
    .replace(
      '</section>',
      repeat.details + '</section>',
    )}</main>${dialog}${controls}</body></html>`,
);
console.log(
  JSON.stringify({
    slides: sectionCount,
    backendChecks: values.BACKEND_TESTS,
    browserChecks: values.BROWSER_TESTS,
    earlierInterfaceEpisodes: values.ATTEMPTED,
    onePassAttempted: comparison.totals.attempted,
  }),
);
