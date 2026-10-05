import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';

const icons = [
  ['image/x-icon', 'src/assets/relay-favicon.ico'],
  ['image/svg+xml', 'src/assets/relay-mark.svg'],
];

test('document icons work in the raw template and standalone downloads', async () => {
  const template = readFileSync('docs/presentation.template.html', 'utf8');
  for (const path of ['../src/assets/relay-favicon.ico', '../src/assets/relay-mark.svg']) {
    expect(template).toContain(`href="${path}"`);
    expect(
      readFileSync(resolve(dirname('docs/presentation.template.html'), path)).length,
    ).toBeGreaterThan(0);
  }
  for (const path of ['docs/presentation.html', 'docs/results.html']) {
    const html = readFileSync(path, 'utf8');
    for (const [type, source] of icons) {
      expect(html).toContain(
        `href="data:${type};base64,${readFileSync(source).toString('base64')}"`,
      );
    }
    expect(html).not.toContain('—');
  }
  expect(readFileSync('docs/presentation-notes.md', 'utf8')).not.toContain('—');
});

test('public pages use working Relay favicons and clear titles without em dashes', async ({
  page,
  request,
}) => {
  const server = createLiveServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const [path, title] of [
      ['/', 'Relay · Computer use'],
      ['/presentation', 'Relay · Presentation'],
      ['/results', 'Relay · Results and replays'],
      ['/play', 'Try Slack · Relay'],
      ['/replay.html', 'Relay · recorded workspace'],
      ['/demo/review.html', 'Trial review · Relay'],
    ]) {
      await page.goto(`${base}${path}`);
      await expect(page).toHaveTitle(title);
      const hrefs = await page
        .locator('head link[rel="icon"]')
        .evaluateAll((links) => links.map((link) => link.href));
      expect(hrefs).toHaveLength(2);
      for (const [type, source] of icons) {
        const extension = source.split('.').at(-1);
        const href = hrefs.find((value) => value.endsWith(`.${extension}`));
        expect(href).toBeTruthy();
        expect(new URL(href).origin).toBe(base);
        const response = await request.get(href);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toBe(type);
        expect(await response.body()).toEqual(readFileSync(source));
      }
      const decoded = await page.evaluate(async () => {
        const icon = document.querySelector('head link[rel="icon"][type="image/svg+xml"]');
        const image = new Image();
        image.src = icon.href;
        await image.decode();
        return { width: image.naturalWidth, height: image.naturalHeight };
      });
      expect(decoded).toEqual({ width: 64, height: 64 });
    }
  } finally {
    server.closeAllConnections();
    await new Promise((done) => server.close(done));
  }
});
