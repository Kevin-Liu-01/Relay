import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';
test('presentation: twelve readable technical slides, evidence-backed counts and keyboard navigation', async ({
  page,
}) => {
  const requests = [];
  page.on('request', (r) => {
    if (/^https?:/.test(r.url())) requests.push(r.url());
  });
  await page.goto(pathToFileURL(resolve('docs/presentation.html')).href);
  await expect(page.locator('.slide')).toHaveCount(12);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.slide p, .slide table, .slide img')).toHaveCount(0);
  const summary = JSON.parse(readFileSync('evidence/campaigns/onsite-2026-10-01/summary.json'));
  for (let i = 0; i < 12; i++) {
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
    if (i < 11) await page.getByRole('button', { name: 'Next slide', exact: true }).click();
  }
  await expect(page.getByRole('button', { name: 'Next slide', exact: true })).toBeDisabled();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#counter')).toContainText('11 / 12');
  await page.keyboard.press('Home');
  await expect(page.locator('#counter')).toContainText('1 / 12');
  await page.keyboard.press('End');
  await expect(page.locator('#counter')).toContainText('12 / 12');
  expect(requests).toEqual([]);
});
test('presentation: print has twelve unclipped pages and mobile has no horizontal overflow', async ({
  page,
}) => {
  await page.goto(pathToFileURL(resolve('docs/presentation.html')).href);
  await page.emulateMedia({ media: 'print' });
  const dimensions = await page.locator('.slide').evaluateAll((slides) =>
    slides.map((s) => ({
      h: s.scrollHeight,
      client: s.clientHeight,
      w: s.scrollWidth,
      width: s.clientWidth,
    })),
  );
  expect(dimensions).toHaveLength(12);
  for (const d of dimensions) {
    expect(d.h).toBeLessThanOrEqual(d.client + 1);
    expect(d.w).toBeLessThanOrEqual(d.width + 1);
  }
  await page.emulateMedia({ media: 'screen' });
  await page.setViewportSize({ width: 390, height: 844 });
  for (let i = 0; i < 12; i++) {
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    if (i < 11) await page.getByRole('button', { name: 'Next slide', exact: true }).click();
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
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    const response = await page.goto(`${base}/presentation.html`);
    expect(response.headers()['content-security-policy']).toContain("script-src 'self'");
    await expect(page.locator('#counter')).toContainText('1 / 12');
    await page.getByRole('button', { name: 'Next slide', exact: true }).click();
    await expect(page.locator('#counter')).toContainText('2 / 12');
    const pdf = await request.get(`${base}/presentation.pdf`);
    expect(pdf.headers()['content-type']).toBe('application/pdf');
    expect((await pdf.body()).subarray(0, 5).toString()).toBe('%PDF-');
    expect(errors).toEqual([]);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
