import { test, expect } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { expectRelayBrand } from './brand-assertions.mjs';

test('OFL typography, open UI glyphs and fictional portraits load without third-party requests', async ({
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
  await expectRelayBrand(page, request, { logo: false });
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
  await expect
    .poll(() =>
      page
        .locator('img[data-avatar]')
        .evaluateAll(
          (images) =>
            images.length >= 6 &&
            images.every((image) => image.complete && image.naturalWidth === 256),
        ),
    )
    .toBe(true);
  const portraits = await page
    .locator('img[data-avatar]')
    .evaluateAll((images) =>
      Object.fromEntries(images.map((image) => [image.dataset.avatar, image.src])),
    );
  expect(Object.keys(portraits).sort()).toEqual(['alex', 'jordan', 'leo', 'maya', 'priya', 'sam']);
  expect(new Set(Object.values(portraits)).size).toBe(6);
  for (const src of Object.values(portraits)) {
    expect(src).toMatch(/^http:\/\/127\.0\.0\.1:4320\/assets\/\w+-[\w-]+\.webp$/);
    const image = await request.get(src);
    expect(image.headers()['content-type']).toContain('image/webp');
    expect((await image.body()).length).toBeLessThan(16000);
  }
  await expect(page.locator('.dm-list img[data-avatar]')).toHaveCount(5);
  expect(await page.locator('.lucide').count()).toBeGreaterThan(20);
  await expect(page.locator('.avatar').first().locator('img')).toBeVisible();
  expect(foreign).toEqual([]);
  await page.screenshot({ path: info.outputPath('fonts-and-portraits.png') });
  mkdirSync('evidence/visual', { recursive: true });
  await page.screenshot({ path: 'evidence/visual/slack-assets.png' });
});

test('a missing portrait falls back to initials without hiding other people or DM presence', async ({
  page,
  request,
}) => {
  const response = await request.post('http://127.0.0.1:4321/sessions', {
    headers: { authorization: 'Bearer browser-test-only' },
    data: { taskId: 'thread-reply', seed: 42 },
  });
  const session = await response.json();
  await page.route('**/assets/maya-*.webp', (route) => route.fulfill({ status: 404, body: '' }));
  await page.goto(`/s/${session.token}`);
  const maya = page.getByRole('button', { name: 'Direct message Maya Chen', exact: true });
  await expect(maya.locator('.avatar')).toHaveText('MC');
  await expect(maya.locator('.avatar > i')).toBeVisible();
  await expect(page.locator('img[data-avatar="maya"]')).toHaveCount(0);
  await expect
    .poll(() =>
      page
        .locator('img[data-avatar]')
        .evaluateAll(
          (images) =>
            new Set(
              images
                .filter((image) => image.complete && image.naturalWidth === 256)
                .map((image) => image.dataset.avatar),
            ).size,
        ),
    )
    .toBe(5);
  await maya.click();
  await expect(
    page.getByRole('heading', { name: 'Maya Chen', level: 1, exact: true }),
  ).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Message Maya Chen', exact: true })).toBeVisible();
});
