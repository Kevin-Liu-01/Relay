import { readFileSync, writeFileSync } from 'node:fs';
const summary = JSON.parse(readFileSync('evidence/campaigns/onsite-2026-10-01/summary.json'));
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
const bars = Object.entries(summary.byInterface)
  .map(
    ([key, c]) =>
      `<div class="result-row"><span>${labels[key]}</span><div class="bar">${['passed', 'incomplete', 'blocked', 'unattempted'].map((outcome) => (c[outcome] ? `<span class="segment ${outcome}" style="flex:${c[outcome]}" title="${c[outcome]} ${outcome}"></span>` : '')).join('')}</div><span>${c.passed} pass / ${c.attempted} tried · ${c.unattempted} not run</span></div>`,
  )
  .join('\n');
const values = {
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
const html = readFileSync('docs/presentation.template.html', 'utf8').replace(
  /\{\{([A-Z_]+)\}\}/g,
  (_, key) => {
    if (!(key in values)) throw Error(`Unknown presentation field: ${key}`);
    return values[key];
  },
);
writeFileSync('docs/presentation.html', html);
console.log(
  JSON.stringify({
    slides: 12,
    backendChecks: values.BACKEND_TESTS,
    browserChecks: values.BROWSER_TESTS,
    attemptedModelEpisodes: values.ATTEMPTED,
  }),
);
