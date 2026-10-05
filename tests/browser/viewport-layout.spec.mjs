import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';
import { testPricing } from '../fixtures/pricing.mjs';

async function geometry(page) {
  return page.evaluate(() => {
    const box = (selector) => {
      const element = document.querySelector(selector);
      const { top, bottom, width, height } = element.getBoundingClientRect();
      return { top, bottom, width, height };
    };
    return {
      screen: innerHeight,
      overflowX: document.documentElement.scrollWidth > innerWidth,
      pageHeight: document.documentElement.scrollHeight,
      shell: box('.live-shell'),
      arena: box('.arena'),
      stage: box('.viewport'),
    };
  });
}

test('idle workspace fills the dynamic viewport across sizes without cropping its frame', async ({
  page,
}, testInfo) => {
  const server = createLiveServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await expect(page.locator('.viewport > img')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const measurements = [];
    for (const [width, height] of [
      [1816, 1376],
      [1920, 1080],
      [1440, 900],
      [1440, 600],
      [1024, 768],
      [800, 1024],
      [390, 844],
      [390, 664],
      [320, 568],
    ]) {
      await page.setViewportSize({ width, height });
      await page.locator('.arena').evaluate((node) => {
        node.scrollTop = 0;
      });
      const g = await geometry(page);
      measurements.push({ width, height, ...g });
      expect(g.overflowX).toBe(false);
      expect(g.shell.height).toBeCloseTo(height, 0);
      expect(g.arena.bottom).toBeGreaterThanOrEqual(height - 14);
      expect(g.arena.bottom).toBeLessThanOrEqual(height);
      expect(g.pageHeight).toBeLessThanOrEqual(height + 1);
      expect(g.stage.height).toBeGreaterThan(100);
      await expect(page.locator('.viewport > img')).toHaveCSS('object-fit', 'contain');
      await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeInViewport();
      await page
        .getByRole('button', { name: 'Watch a replay', exact: true })
        .scrollIntoViewIfNeeded();
      await expect(
        page.getByRole('button', { name: 'Watch a replay', exact: true }),
      ).toBeInViewport();
      if (width === 1816 || width === 390)
        await page.screenshot({ path: testInfo.outputPath(`idle-${width}-${height}.png`) });
    }
    // A very short landscape screen can scroll rather than losing controls.
    await page.setViewportSize({ width: 844, height: 390 });
    expect((await geometry(page)).overflowX).toBe(false);
    await page
      .getByRole('button', { name: 'Watch a replay', exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      page.getByRole('button', { name: 'Watch a replay', exact: true }),
    ).toBeInViewport();
    await testInfo.attach('viewport-geometry', {
      body: JSON.stringify(measurements),
      contentType: 'application/json',
    });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});

test('running, focus and completed workspaces keep their viewport budget and readable evidence', async ({
  page,
}, testInfo) => {
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const server = createLiveServer({
    pricingResolver: testPricing,
    routerFactory: () => ({
      models: async () => ({ models: [{ id: 'gpt-4o-mini' }] }),
      respond: async () => {
        await gate;
        return {
          text: '{"type":"finish"}',
          usage: { inputTokens: 10, outputTokens: 5 },
          latencyMs: 1,
          requestedModel: 'gpt-4o-mini',
          returnedModel: 'layout-test-only',
        };
      },
    }),
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole('button', { name: 'Your key', exact: true }).click();
    await page.getByLabel('Provider API key').fill('fake-viewport-test-key');
    await expect(
      page.getByRole('button', { name: 'Your key', exact: true }),
    ).toHaveAccessibleDescription('Connected. Open key settings.');
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.getByAltText('Live agent workspace')).toBeVisible();
    await expect(page.getByRole('region', { name: 'Expected and actual result' })).toBeVisible();
    for (const [width, height] of [
      [1440, 900],
      [1440, 600],
      [390, 844],
      [390, 664],
    ]) {
      await page.setViewportSize({ width, height });
      const g = await geometry(page);
      expect(g.overflowX).toBe(false);
      expect(g.pageHeight).toBeLessThanOrEqual(height + 1);
      expect(g.stage.height).toBeGreaterThan(70);
      await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeInViewport();
      await page.screenshot({ path: testInfo.outputPath(`running-${width}-${height}.png`) });
    }
    await page.getByRole('button', { name: 'Expand workspace', exact: true }).click();
    await expect(page.locator('.task-comparison')).toBeHidden();
    const focus = await geometry(page);
    expect(focus.arena.top).toBe(8);
    expect(focus.arena.bottom).toBe(656);
    await expect(page.getByRole('button', { name: 'Stop run', exact: true })).toBeInViewport();
    await page.getByRole('button', { name: 'Exit workspace focus', exact: true }).click();
    release();
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled();
    const panel = page.getByRole('complementary', { name: 'Agent decisions' });
    await panel.scrollIntoViewIfNeeded();
    await page.getByRole('region', { name: 'Run result' }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('region', { name: 'Run result' })).toBeInViewport();
    await page.setViewportSize({ width: 1440, height: 900 });
    expect((await geometry(page)).pageHeight).toBeLessThanOrEqual(901);
    await expect(page.locator('.timeline')).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath('completed-desktop.png') });
  } finally {
    release();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
