import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';

test('OFL typography, open UI glyphs and fictional initials load without third-party requests', async ({
  page,
  request,
}, info) => {
  const r = await request.post('http://127.0.0.1:4321/sessions', {
    headers: { authorization: 'Bearer browser-test-only' },
    data: { taskId: 'thread-reply', seed: 42 },
  });
  const session = await r.json();
  const foreign = [];
  page.on('request', (request) => {
    if (!request.url().startsWith('http://127.0.0.1:4320/')) foreign.push(request.url());
  });
  await page.goto(`/s/${session.token}`);
  await expect(page.getByRole('heading', { level: 1, name: 'proj-meridian' })).toBeVisible();
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return [...document.fonts].map((f) => ({
      family: f.family,
      status: f.status,
      weight: f.weight,
    }));
  });
  for (const weight of ['400', '700', '900'])
    expect(fonts).toContainEqual({ family: 'Slack-Lato', status: 'loaded', weight });
  expect(fonts.some((f) => f.family === 'Slack v2')).toBe(false);
  await expect(page.locator('img[data-avatar]')).toHaveCount(0);
  expect(await page.locator('.lucide').count()).toBeGreaterThan(20);
  await expect(page.locator('.avatar').first()).not.toBeEmpty();
  expect(foreign).toEqual([]);
  await page.screenshot({ path: info.outputPath('fonts-and-portraits.png') });
  mkdirSync('evidence/visual', { recursive: true });
  await page.screenshot({ path: 'evidence/visual/slack-assets.png' });
});
