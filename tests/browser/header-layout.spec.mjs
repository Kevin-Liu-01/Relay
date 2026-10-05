import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';

test('compact run header preserves controls, keyboard menus and responsive space', async ({
  page,
}) => {
  const server = createLiveServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await expect(page.getByRole('heading', { name: 'Try out Computer Use' })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const measurements = [];
    for (const width of [1920, 1440, 1280, 800, 390]) {
      await page.setViewportSize({ width, height: 900 });
      const geometry = await page.evaluate(() => {
        const rect = (selector) => {
          const { top, bottom, height } = document.querySelector(selector).getBoundingClientRect();
          return { top, bottom, height };
        };
        return {
          width: innerWidth,
          overflow: document.documentElement.scrollWidth > innerWidth,
          nav: rect('.nav'),
          intro: rect('.run-intro'),
          controls: rect('.control-bar'),
          toolbar: rect('.run-toolbar'),
          arena: rect('.arena'),
        };
      });
      measurements.push(geometry);
      expect(geometry.overflow).toBe(false);
      expect(geometry.arena.top).toBeLessThanOrEqual(width <= 700 ? 420 : 225);
      expect(geometry.intro.top - geometry.nav.bottom).toBeLessThanOrEqual(4);
      expect(geometry.controls.top - geometry.intro.bottom).toBeLessThanOrEqual(8);
      expect(geometry.toolbar.top).toBeGreaterThanOrEqual(geometry.controls.bottom);
      expect(geometry.arena.top - geometry.toolbar.bottom).toBeLessThanOrEqual(8);
      for (const name of ['Task', 'Model', 'Interface']) {
        const control = page.getByRole('combobox', { name, exact: true });
        await expect(control).toBeInViewport();
        expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(38);
      }
      for (const name of ['Your key', 'Run']) {
        const control = page.getByRole('button', { name, exact: true });
        await expect(control).toBeInViewport();
        expect((await control.boundingBox()).height).toBeGreaterThanOrEqual(34);
      }
      if ([1440, 390].includes(width))
        await page.screenshot({
          path: `evidence/visual/relay-compact-header-${width}.png`,
          fullPage: true,
        });
    }
    const task = page.getByRole('combobox', { name: 'Task', exact: true });
    await task.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(task).toBeFocused();
    await test.info().attach('header-geometry', {
      body: JSON.stringify(measurements, null, 2),
      contentType: 'application/json',
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
