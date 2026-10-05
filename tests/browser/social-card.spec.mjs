import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { createLiveServer } from '../../hosted/local.mjs';
import { socialPages, socialImagePath } from '../../scripts/lib/social-card.mjs';

test('social previews are public without JavaScript and readable at sharing sizes', async ({
  browser,
  request,
}, testInfo) => {
  const server = createLiveServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 1248, height: 1050 },
  });
  const page = await context.newPage();
  try {
    const bytes = readFileSync('docs/relay-social.png');
    const imagePath = socialImagePath(bytes);
    const image = await request.get(`${base}${imagePath}`);
    expect(image.status()).toBe(200);
    expect(image.headers()['content-type']).toContain('image/png');
    expect(
      createHash('sha256')
        .update(await image.body())
        .digest('hex'),
    ).toBe(createHash('sha256').update(bytes).digest('hex'));
    for (const entry of socialPages) {
      const response = await request.get(
        `${base}${entry.file === 'live.html' ? '/live.html' : entry.path}`,
      );
      expect(response.status(), entry.file).toBe(200);
      // Parse the raw response without loading application scripts or starting a run.
      await page.setContent(await response.text());
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
        'content',
        entry.title,
      );
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
        'content',
        `https://relay.kevinliu.studio${entry.path}`,
      );
      await expect(page.locator('meta[property="og:image"]')).toHaveCount(1);
      await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
        'content',
        `https://relay.kevinliu.studio${imagePath}`,
      );
      await expect(page.locator('meta[property="og:image:width"]')).toHaveAttribute(
        'content',
        '1200',
      );
      await expect(page.locator('meta[property="og:image:height"]')).toHaveAttribute(
        'content',
        '630',
      );
      await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
        'content',
        'summary_large_image',
      );
      await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute(
        'content',
        `https://relay.kevinliu.studio${imagePath}`,
      );
      expect(readFileSync(`dist/${entry.file}`, 'utf8')).toContain('property="og:image"');
    }
    await page.setContent(
      `<body style="margin:24px;background:#dedbe2"><img src="${base}${imagePath}" width="1200" height="630" alt="Relay social card"><div style="display:flex;gap:24px;margin-top:24px"><img src="${base}${imagePath}" width="600" height="315" alt="600 pixel preview"><img src="${base}${imagePath}" width="300" height="157.5" alt="300 pixel preview"></div></body>`,
    );
    await expect(page.locator('img').first()).toBeVisible();
    for (const image of await page.locator('img').all()) {
      await expect(image).toHaveJSProperty('complete', true);
      await expect(image).toHaveJSProperty('naturalWidth', 1200);
    }
    await page.screenshot({ path: testInfo.outputPath('social-card-sharing-sizes.png') });
  } finally {
    await context.close();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
