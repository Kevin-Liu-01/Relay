import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';
test('presentation: thirteen readable technical slides, evidence-backed counts and keyboard navigation', async ({
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
  await expect(page.locator('.slide')).toHaveCount(13);
  await expect(page.locator('.masthead .wordmark svg')).toHaveCount(13);
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
  await expect(page.locator('.slide table')).toHaveCount(1);
  const summary = JSON.parse(readFileSync('evidence/campaigns/onsite-2026-10-01/summary.json'));
  for (let i = 0; i < 13; i++) {
    const slide = page.locator('.slide.active');
    await expect(slide).toHaveCount(1);
    await expect(slide.locator('h1, h2')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (i === 7)
      await expect(slide).toContainText(
        `${summary.totals.attempted} attempted: ${summary.totals.passed} passed`,
      );
    if ([0, 2, 6, 7, 8, 10].includes(i)) {
      await page.screenshot({
        path: testInfo.outputPath(`slide-${i + 1}.png`),
        animations: 'disabled',
      });
    }
    if (i < 12) await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  }
  await expect(page.getByRole('button', { name: 'Next slide', exact: true })).toBeDisabled();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#counter')).toContainText('12 / 13');
  await page.keyboard.press('Home');
  await expect(page.locator('#counter')).toContainText('1 / 13');
  await page.keyboard.press('End');
  await expect(page.locator('#counter')).toContainText('13 / 13');
  expect(requests).toEqual([]);
});
test('presentation: print has thirteen unclipped pages and mobile has no horizontal overflow', async ({
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
  expect(dimensions).toHaveLength(13);
  for (const d of dimensions) {
    expect(d.h, d.title).toBeLessThanOrEqual(d.client + 1);
    expect(d.w, d.title).toBeLessThanOrEqual(d.width + 1);
  }
  await page.emulateMedia({ media: 'screen' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await expect(page.locator('.slide.active')).toHaveCSS('animation-name', 'none');
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 0; i < 13; i++) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (i < 12) await page.getByRole('button', { name: 'Next slide', exact: true }).click();
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
    await expect(page.locator('#counter')).toContainText('1 / 13');
    await page.getByRole('button', { name: 'Next slide', exact: true }).click();
    await expect(page.locator('#counter')).toContainText('2 / 13');
    await page.goto(`${base}/presentation.html#9`);
    await expect(page).toHaveURL(`${base}/presentation#9`);
    await page.locator('#model-results thead button').filter({ hasText: 'Passed' }).click();
    await expect(page.locator('#sort-status')).toHaveText('Sorted by Passed, descending');
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
  await page.goto(`${pathToFileURL(resolve('docs/presentation.html')).href}#9`);
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
    ['Est. cost', 6, 'ascending'],
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
    await expect(page).toHaveURL(/#9$/);
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
