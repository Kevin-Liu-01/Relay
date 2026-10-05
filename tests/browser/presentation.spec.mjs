import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';
test('presentation: twenty readable technical slides, evidence-backed counts and keyboard navigation', async ({
  page,
}, testInfo) => {
  const requests = [];
  page.on('request', (r) => {
    if (/^https?:/.test(r.url())) requests.push(r.url());
  });
  await page.goto(pathToFileURL(resolve('docs/presentation.html')).href);
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator('body')).toHaveCSS('font-family', /Relay Camber/);
  expect(await page.evaluate(() => document.fonts.check('500 32px "Relay Camber"'))).toBe(true);
  await expect(page.locator('.slide')).toHaveCount(20);
  await expect(page.locator('.masthead .wordmark svg')).toHaveCount(20);
  await expect(page.locator('[aria-label="Models in the campaign"] svg')).toHaveCount(3);
  await expect(page.locator('main')).not.toContainText('{{');
  await expect(page.locator('[data-title="Agent interfaces"] .lucide-accessibility')).toHaveCount(
    1,
  );
  await expect(page.locator('[aria-label="Models in the campaign"] path[fill="#fff"]')).toHaveCount(
    0,
  );
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.slide p, .slide img')).toHaveCount(0);
  await expect(page.locator('.slide table')).toHaveCount(3);
  const lesson = page.locator('[data-title="Main lesson"]');
  await expect(lesson.locator('h2')).toHaveText('Why was the highest score 14/18?');
  await expect(lesson).toContainText(
    'GPT-6.1 Sol and GPT-6 Astra each passed 14 tasks and missed the same four',
  );
  await expect(lesson.locator('.diagram-label')).toHaveText([
    'Design handoff',
    'Release synchronization',
    'Release retrospective',
    'Handoff repair',
  ]);
  for (const explanation of [
    'never said to replace DESIGN',
    'wording alone does not explain the miss',
    'All 17 models hit a limit',
    'clicked Cancel instead of Save changes',
    'Five other models passed',
    'Sol reached 40 actions and Astra hit the $5 estimated-allowance limit',
    'Across all models, 15/18 tasks passed at least once',
  ]) {
    await expect(lesson).toContainText(explanation);
  }
  // Bind the diagnosis to the historical catalog, not just the slide's own copy.
  const { trials } = JSON.parse(readFileSync('evidence/trial-library/catalog.json'));
  const models = [...new Set(trials.map((trial) => trial.model))];
  const passes = (model) =>
    trials.filter((trial) => trial.model === model && trial.outcome === 'passed');
  expect(Math.max(...models.map((model) => passes(model).length))).toBe(14);
  const missedTasks = ['design-handoff', 'handoff-repair', 'release-retrospective', 'release-sync'];
  for (const model of ['gpt-6.1-sol', 'gpt-6-astra']) {
    expect(passes(model)).toHaveLength(14);
    const misses = trials.filter((trial) => trial.model === model && trial.outcome !== 'passed');
    expect(misses.map((trial) => trial.task).sort()).toEqual(missedTasks);
    expect(misses.find((trial) => trial.task === 'design-handoff')).toMatchObject({
      status: 'completed',
      outcome: 'incomplete',
    });
    for (const trial of misses.filter((trial) => trial.task !== 'design-handoff')) {
      expect(trial).toMatchObject(
        model === 'gpt-6.1-sol'
          ? { status: 'step_limit', actionAttempts: 40, outcome: 'incomplete' }
          : { status: 'budget', outcome: 'blocked' },
      );
    }
  }
  expect(trials.filter((trial) => trial.task === 'release-retrospective')).toHaveLength(17);
  for (const trial of trials.filter((trial) => trial.task === 'release-retrospective')) {
    expect(['step_limit', 'output_limit', 'timeout', 'budget']).toContain(trial.status);
  }
  expect(
    trials.filter((trial) => trial.task === 'handoff-repair' && trial.outcome === 'passed'),
  ).toHaveLength(5);
  expect(
    new Set(trials.filter((trial) => trial.outcome === 'passed').map((trial) => trial.task)).size,
  ).toBe(15);
  await expect(page.locator('[data-title="My approach"] h1')).toHaveText(
    'How does an Agent use Slack?',
  );
  await expect(page.locator('.cover .brand-chip')).toHaveText([
    'Slack workflows',
    'Automatic result checks',
  ]);
  await expect(page.locator('.cover .brand-chip svg')).toHaveCount(2);
  await expect(page.locator('.approach-flow .node')).toHaveCount(4);
  await expect(page.locator('.approach-flow .node')).toHaveText([
    'Researchcomputer use',
    'Map Slackworkflows',
    'Build theenvironment',
    'Test andrecord runs',
  ]);
  await expect(page.locator('.approach-flow .node[data-tone="blue"]')).toHaveText(
    'Build theenvironment',
  );
  await expect(page.locator('.approach-flow .node[data-tone="green"]')).toHaveText(
    'Test andrecord runs',
  );
  await expect(page.locator('.approach-flow')).toHaveCSS('background-color', 'rgb(247, 244, 250)');
  await expect(page.locator('[data-title="The scope expands"] h2')).toHaveText(
    'The reusable harness made model comparisons possible',
  );
  await expect(page.locator('[data-title="The scope expands"]')).toContainText(
    'Once runs were repeatable, I wanted to compare how different models completed the same tasks',
  );
  await expect(page.locator('.scope-diagram .scope-label')).toHaveText([
    'Original assignment',
    'Expanded scope',
  ]);
  await expect(page.locator('.scope-diagram .benchmark')).toContainText('Benchmark prototype');
  await expect(page.locator('[data-title="The next benchmark version"] a').first()).toHaveAttribute(
    'href',
    'https://github.com/Kevin-Liu-01/Relay/blob/main/docs/build-review.md',
  );
  await expect(page.locator('.slide [role="img"]')).toHaveCount(16);
  const sequence = await page
    .locator('.slide')
    .evaluateAll((slides) => slides.map((s) => s.dataset.title));
  expect(sequence).toEqual([
    'My approach',
    'The environment',
    'All workflows',
    'The repeatable harness',
    'Agent interfaces',
    'Define success',
    'Verification',
    'Session isolation',
    'Run speed',
    'Resource choices',
    'Scaling the runner',
    'The scope expands',
    'Comparison setup',
    'Model comparison',
    'Main lesson',
    'Matched interface study',
    'Interface results',
    'Interpreting interface results',
    'The next benchmark version',
    'Demonstration and discussion',
  ]);
  await expect(page.locator('main')).not.toContainText('Other mistakes I made');
  // Keep the main narrative readable. Tables and source notes carry supporting detail.
  const narrative = await page
    .locator('.slide:not(.comparison-slide) > ul:not(.sources) > li')
    .allTextContents();
  for (const bullet of narrative) {
    const text = bullet.replace(/\s+/g, ' ').trim();
    expect(text.split(/\s+/).length, text).toBeLessThanOrEqual(25);
    expect(
      [...new Intl.Segmenter('en', { granularity: 'sentence' }).segment(text)],
      text,
    ).toHaveLength(1);
    expect(text, text).not.toMatch(/[;—()]/);
  }
  await expect(page.locator('[data-title="Define success"]')).toContainText(
    'The grader is code that checks the stored messages',
  );
  await expect(page.locator('[data-title="Define success"] h2')).toHaveText(
    'Success means the requested change was saved',
  );
  const verification = page.locator('[data-title="Verification"]');
  await expect(verification.locator('h2')).toHaveText('I tested the success rule on the same edit');
  await expect(verification).toContainText(
    "Alex's original message must change from 14:00 to 15:00",
  );
  await expect(verification.locator('.diagram-label')).toHaveText([
    'App test',
    'Grader test',
    'Recording test',
  ]);
  await expect(verification).toContainText(
    'Keep 14:00, or save 15:00 and add an unrelated message.',
  );
  await expect(verification).toContainText('Recomputed grade = recorded grade');
  await expect(verification).toContainText(
    'Passing these tests does not prove the task instructions are clear.',
  );
  await expect(page.locator('[data-title="My approach"]')).toContainText(
    'I studied how agents observe and act on pages',
  );
  await expect(page.locator('[data-title="My approach"]')).toContainText(
    'saved changes I could verify',
  );
  await expect(page.locator('[data-title="My approach"] .sources a')).toHaveAttribute(
    'href',
    'https://github.com/Kevin-Liu-01/Relay/blob/main/docs/research.md',
  );
  await expect(page.locator('[data-title="My approach"]')).not.toContainText(
    'The assignment asked',
  );
  await expect(page.locator('[data-title="Agent interfaces"]')).not.toContainText('Earlier passes');
  await expect(page.locator('main')).not.toContainText('Results from the earlier interface tests');
  const refinement = page.locator('[data-title="Matched interface study"]');
  await expect(refinement.locator('h2')).toHaveText('What the early interface tests taught me');
  await expect(refinement).toContainText('their pooled scores could not compare interfaces');
  await expect(refinement).toContainText(
    'every model the same six tasks through all four interfaces',
  );
  await expect(refinement).toContainText('API · tool use');
  await expect(refinement).toContainText('96 attempts');
  await expect(refinement.locator('table')).toHaveCount(0);
  await expect(
    refinement.locator('a').filter({ hasText: 'Early development traces' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/Kevin-Liu-01/Relay/blob/main/evidence/campaigns/onsite-2026-10-01/README.md',
  );
  await expect(page.locator('[data-title="Comparison setup"]')).toContainText('All 306 runs');
  await expect(page.locator('[data-title="Session isolation"]')).toContainText(
    'Launch review stays at 14:00',
  );
  // Design slides must explain the consequence for a run, not just name the mechanism.
  const isolation = page.locator('[data-title="Session isolation"]');
  await expect(isolation.locator('h2')).toHaveText('Each run starts with its own copy of the task');
  await expect(isolation).toContainText(
    'Even with one model, each attempt needs fresh data so it cannot inherit completed work',
  );
  await expect(isolation).not.toContainText('the next model');
  await expect(isolation.locator('.diagram-caption')).toContainText(
    'The new run starts with the message at 14:00. The previous result stays in history.',
  );
  await expect(page.locator('[data-title="Define success"]')).toContainText(
    'the screen alone cannot prove success',
  );
  const speed = page.locator('[data-title="Run speed"]');
  await expect(speed.locator('h2')).toHaveText('What makes one run take longer?');
  await expect(speed).toContainText(
    'A fresh workspace makes runs independent, but each extra decision adds another model request',
  );
  await expect(speed).toContainText(
    'the workspace waits during the model request and updates after the action executes',
  );
  const resources = page.locator('[data-title="Resource choices"]');
  await expect(resources.locator('h2')).toHaveText('Each run consumes memory and storage');
  await expect(resources).toContainText(
    'The browser stays open while the model decides, so a slow run also holds memory for longer',
  );
  await expect(resources).toContainText('Review and replay without new model calls');
  await expect(resources).toContainText('Disk use continues after cleanup');
  await expect(resources).toContainText('More simultaneous runs need more browser memory');
  await expect(resources).toContainText('More saved runs need more storage');
  // Explain the engineering choices before introducing collection-specific findings.
  await expect(resources).not.toContainText('306-run');
  await expect(resources).not.toContainText('The next model');
  await expect(resources).not.toContainText('interface study');
  expect(readFileSync('docs/presentation-notes.md', 'utf8').replace(/\s+/g, ' ')).toContain(
    'The 306-run collection paused when free disk space fell below its 10 GB storage safeguard',
  );
  await expect(page.locator('[data-title="Scaling the runner"]')).toContainText(
    'Because each active run holds a browser in memory',
  );
  await expect(page.locator('[data-title="Scaling the runner"] .takeaway')).toContainText(
    'wait for a free worker before their run starts',
  );
  await expect(page.locator('[data-title="Session isolation"]')).toContainText(
    'Separate data is not isolation from host crashes',
  );
  await expect(resources).toContainText(
    'Full browser memory and recording size need separate measurements',
  );
  await expect(page.locator('[data-title="Scaling the runner"]')).toContainText(
    'Proposed, not implemented or load-tested',
  );
  const benchmark = JSON.parse(readFileSync('evidence/benchmark-2026-10-01.json'));
  const timing = page.locator('[data-title="Run speed"]');
  for (const key of ['reset', 'actionHttp', 'screenshot'])
    await expect(timing).toContainText(`${benchmark.latency[key].p50Ms.toFixed(2)} ms`);
  await expect(timing).toContainText('not 100 concurrent agents');
  await expect(
    page
      .locator('[data-title="Model comparison"] a')
      .filter({ hasText: 'Read the failure analysis' }),
  ).toHaveAttribute('href', 'https://relay.kevinliu.studio/presentation#main-lesson');
  const analysis = JSON.parse(
    readFileSync('evidence/campaigns/interface-repeat-2026-10-05-continuation/analysis.json'),
  );
  const paired = analysis.paired.find((p) => p.left === 'a11y' && p.right === 'api');
  const interpretation = page.locator('[data-title="Interpreting interface results"]');
  await expect(interpretation).toContainText(`${paired.bothPassed} shared passes`);
  await expect(interpretation).toContainText('API passed 12');
  await expect(interpretation).toContainText(
    `${paired.bothPassedMedianSecondsLeftMinusRight.toFixed(1)} fewer seconds`,
  );
  for (let i = 0; i < 20; i++) {
    const slide = page.locator('.slide.active');
    await expect(slide).toHaveCount(1);
    await expect(slide.locator('h1, h2')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (!(await slide.evaluate((node) => node.classList.contains('comparison-slide')))) {
      const bottom = await slide
        .locator(':scope > :last-child')
        .evaluate((node) => node.getBoundingClientRect().bottom);
      expect(bottom, 'New slide content stays above the navigation').toBeLessThan(836);
    }
    {
      await page.screenshot({
        path: testInfo.outputPath(`slide-${i + 1}.png`),
        animations: 'disabled',
      });
    }
    if (i < 19) await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  }
  await expect(page.getByRole('button', { name: 'Next slide', exact: true })).toBeDisabled();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#counter')).toContainText('19 / 20');
  await page.keyboard.press('Home');
  await expect(page.locator('#counter')).toContainText('1 / 20');
  await page.keyboard.press('End');
  await expect(page.locator('#counter')).toContainText('20 / 20');
  expect(requests).toEqual([]);
});
test('presentation: print has twenty unclipped pages and mobile has no horizontal overflow', async ({
  page,
}) => {
  await page.goto(pathToFileURL(resolve('docs/presentation.html')).href);
  await page.emulateMedia({ media: 'print' });
  await page.evaluate(() => document.fonts.ready);
  const dimensions = await page.locator('.slide').evaluateAll((slides) =>
    slides.map((s) => ({
      title: s.dataset.title,
      h: s.scrollHeight,
      client: s.clientHeight,
      w: s.scrollWidth,
      width: s.clientWidth,
    })),
  );
  expect(dimensions).toHaveLength(20);
  for (const d of dimensions) {
    expect(d.h, d.title).toBeLessThanOrEqual(d.client + 1);
    expect(d.w, d.title).toBeLessThanOrEqual(d.width + 1);
  }
  await page.emulateMedia({ media: 'screen' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.slide.active')).toHaveCSS('animation-name', 'none');
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 0; i < 20; i++) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (i < 19) await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  }
});

test('published presentation controls work under the production content-security policy', async ({
  page,
  request,
}) => {
  const server = createLiveServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const errors = [];
  const assetRequests = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('request', (r) => assetRequests.push(r.url()));
  try {
    const legacy = await request.get(`${base}/presentation.html?from=legacy`, { maxRedirects: 0 });
    expect(legacy.status()).toBe(308);
    expect(legacy.headers().location).toBe('/presentation?from=legacy');
    const response = await page.goto(`${base}/presentation`);
    expect(response.headers()['content-security-policy']).toContain("script-src 'self'");
    await page.evaluate(() => document.fonts.ready);
    expect(
      await page.evaluate(() =>
        [...document.fonts]
          .filter((f) => f.family === 'Relay Camber' && ['400', '500'].includes(f.weight))
          .every((f) => f.status === 'loaded'),
      ),
    ).toBe(true);
    expect(assetRequests.some((url) => /\/assets\/presentation-.*\.woff2$/.test(url))).toBe(true);
    expect(assetRequests.every((url) => url.startsWith(base))).toBe(true);
    await expect(page.locator('#counter')).toContainText('1 / 20');
    await page.getByRole('button', { name: 'Next slide', exact: true }).click();
    await expect(page.locator('#counter')).toContainText('2 / 20');
    await page.getByRole('button', { name: /Open slide overview/ }).click();
    await page.getByRole('searchbox', { name: 'Find a slide' }).fill('15');
    await page.getByRole('searchbox', { name: 'Find a slide' }).press('Enter');
    await expect(page).toHaveURL(`${base}/presentation#main-lesson`);
    await page.getByRole('button', { name: 'Show speaker notes' }).click();
    await expect(page.locator('#notes-content')).toContainText('same four');
    await page.getByRole('button', { name: 'Close speaker notes' }).click();
    await page.goto(`${base}/presentation.html#model-comparison`);
    await expect(page).toHaveURL(`${base}/presentation#model-comparison`);
    await page.locator('#model-results thead button').filter({ hasText: 'Passed' }).click();
    await expect(page.locator('#sort-status')).toHaveText('Sorted by Passed, descending');
    await page.goto(`${base}/presentation#interface-results`);
    const study = JSON.parse(
      readFileSync('evidence/campaigns/interface-study-2026-10-05/verified-summary.json'),
    );
    await expect(page.locator('.slide.active h2')).toHaveText(
      'Interface comparison: 96 recorded attempts',
    );
    const studyTable = page.locator('#interface-study-table');
    const median = (rows) => {
      const values = rows.map((r) => r.durationMs / 1000).sort((a, b) => a - b);
      return values.length
        ? `${((values[Math.floor((values.length - 1) / 2)] + values[Math.floor(values.length / 2)]) / 2).toFixed(1)} s`
        : 'N/A';
    };
    await expect(studyTable.locator('caption')).toContainText('median elapsed time in seconds');
    await expect(studyTable.locator('tbody tr')).toHaveCount(4);
    for (const [i, model] of study.byModel.entries()) {
      const row = studyTable.locator('tbody tr').nth(i);
      for (const [j, mode] of ['a11y', 'json-ui', 'pixels', 'api'].entries()) {
        const c = model.byInterface[mode];
        await expect(row.locator('td').nth(j)).toContainText(`${c.passed} / ${c.attempted}`);
        await expect(row.locator('td').nth(j).locator('a')).toHaveAttribute(
          'href',
          /study=interfaces/,
        );
        const attempts = study.rows.filter((r) => r.model === model.model && r.interface === mode);
        const cell = row.locator('td').nth(j);
        await expect(cell.locator('[data-time="all"]')).toHaveText(median(attempts));
        await expect(cell.locator('[data-time="passed"]')).toHaveText(
          median(attempts.filter((r) => r.outcome === 'passed')),
        );
      }
    }
    await expect(page.locator('.slide.active')).toContainText('N/A means no passed task');
    for (const [label, column, direction] of [
      ['Accessibility', 1, 'descending'],
      ['Actor API', 4, 'descending'],
      ['Allowance', 5, 'ascending'],
    ]) {
      const button = studyTable.getByRole('button', { name: new RegExp(`^${label}`) });
      await button.click();
      await expect(page.locator('#interface-sort-status')).toContainText(`${label}, ${direction}`);
      const values = await studyTable
        .locator('tbody tr')
        .evaluateAll((rows, col) => rows.map((r) => Number(r.cells[col].dataset.sort)), column);
      expect(values).toEqual(
        [...values].sort((a, b) => (direction === 'ascending' ? a - b : b - a)),
      );
      await button.press('Space');
      await expect(button.locator('..')).toHaveAttribute(
        'aria-sort',
        direction === 'ascending' ? 'descending' : 'ascending',
      );
    }
    const pdf = await request.get(`${base}/presentation.pdf`);
    expect(pdf.headers()['content-type']).toBe('application/pdf');
    expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
    expect(errors).toEqual([]);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('comparison slide sorts raw values, preserves missing values, supports keyboard and exposes every trial', async ({
  page,
}) => {
  const summary = JSON.parse(
    readFileSync(
      `evidence/campaigns/${JSON.parse(readFileSync('docs/current-comparison.json')).campaign}/summary.json`,
    ),
  );
  await page.goto(`${pathToFileURL(resolve('docs/presentation.html')).href}#model-comparison`);
  const table = page.locator('#model-results');
  await expect(table.locator('tbody tr')).toHaveCount(summary.byModel.length);
  await expect(table.locator('.trial-strip.dense')).toHaveCount(
    summary.byModel.filter((m) => m.planned > 40).length,
  );
  await expect(table.locator('.model-identity svg')).toHaveCount(summary.byModel.length);
  await page.locator('#task-filter summary').click();
  await page.getByRole('button', { name: 'release sync', exact: true }).click();
  await expect(table.locator('.trial-cell')).toHaveCount(
    summary.byModel.length * summary.trialsPerTaskModel,
  );
  await expect(table.locator('.trial-count')).toHaveText(
    summary.byTask
      .find((t) => t.task === 'release-sync')
      .byModel.map((m) => `${m.attempted} / ${m.planned}`),
  );
  await table.getByRole('button', { name: /^Passed/ }).click();
  await expect(page.locator('#sort-status')).toContainText('Passed, descending');
  await page.locator('#task-filter summary').click();
  await page.getByRole('button', { name: 'All 18 tasks', exact: true }).click();
  await expect(table.locator('.trial-strip.dense')).toHaveCount(
    summary.byModel.filter((m) => m.planned > 40).length,
  );
  for (const [label, index, direction] of [
    ['Passed', 2, 'descending'],
    ['Usage estimate', 6, 'ascending'],
    ['Unresolved', 7, 'ascending'],
    ['Total allowance', 8, 'ascending'],
    ['Median time', 5, 'ascending'],
  ]) {
    const button = table.locator('thead button').filter({ hasText: label });
    await button.click();
    for (const d of [direction, direction === 'ascending' ? 'descending' : 'ascending']) {
      const values = await table
        .locator('tbody tr')
        .evaluateAll((rows, column) => rows.map((r) => r.cells[column].dataset.sort), index);
      const known = values.filter((v) => v !== '').map(Number);
      expect(known).toEqual([...known].sort((a, b) => (d === 'ascending' ? a - b : b - a)));
      expect(values.slice(known.length).every((v) => v === '')).toBe(true);
      await expect(button.locator('..')).toHaveAttribute('aria-sort', d);
      if (d === direction) await button.press('Space');
    }
    await expect(page).toHaveURL(/#model-comparison$/);
  }
  const model = table.getByRole('button', { name: /^Model/ });
  await model.click();
  const names = await table
    .locator('tbody tr th')
    .evaluateAll((rows) => rows.map((r) => r.dataset.sort));
  expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  await page.getByRole('button', { name: `All ${summary.totals.planned} trials` }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('#trial-results tbody tr')).toHaveCount(summary.totals.planned);
  if (summary.preserved)
    await expect(
      page.locator('#trial-results .trial-origin').filter({ hasText: /^preserved/ }),
    ).toHaveCount(summary.preserved);
  await page.locator('#trial-results thead button').filter({ hasText: 'Seed' }).click();
  await expect(page.locator('#trial-sort-status')).toContainText('Seed, ascending');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page.getByRole('button', { name: `All ${summary.totals.planned} trials` }),
  ).toBeFocused();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await model.click();
  expect(await table.evaluate((t) => t.getAnimations({ subtree: true }).length)).toBe(0);
});
