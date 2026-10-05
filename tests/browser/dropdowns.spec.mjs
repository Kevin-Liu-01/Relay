import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';

async function preview(run) {
  const server = createLiveServer({
    pricingResolver: async (_provider, catalog) => ({
      ...catalog,
      models: catalog.models.map((m) => ({ ...m, rates: { input: 0.1, output: 0.5 } })),
    }),
    routerFactory: (provider) => ({
      models: async () => ({
        models:
          provider === 'typesafe'
            ? [{ id: 'jev-latest' }]
            : [
                'gpt-4o-mini',
                'claude-sonnet',
                'gemini-flash',
                'deepseek-chat',
                'qwen3',
                ...Array.from({ length: 30 }, (_, i) => `test-model-${String(i).padStart(2, '0')}`),
                'very-long-model-identifier-with-a-pinned-revision-for-overflow-testing',
              ].map((id) => ({ id })),
      }),
      respond: async () => {
        throw Error('Dropdown tests must not call inference.');
      },
    }),
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

async function fitsViewport(page, menu) {
  const box = await menu.boundingBox();
  const size = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(size.width);
  expect(box.y + box.height).toBeLessThanOrEqual(size.height);
}

test('scroll arrows never shift options while selecting from a long menu', async ({ page }) => {
  await preview(async (url) => {
    await page.goto(url);
    await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
    await page.getByLabel('Provider API key').fill('fake-scroll-layout-key');
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    const model = page.getByRole('combobox', { name: 'Model', exact: true });
    await expect(model).toHaveText('gpt-4o-mini');
    await model.click();
    const menu = page.getByRole('listbox', { name: 'Model', exact: true });
    await expect(menu).toHaveCSS('opacity', '1');
    const viewport = menu.locator('[data-radix-select-viewport]');
    const geometry = () =>
      viewport.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return { y: rect.y, height: rect.height };
      });
    const initial = await geometry();
    await viewport.evaluate((el) => {
      el.scrollTop = 150;
    });
    await expect(menu.locator('.relay-select-scroll')).toHaveCount(2);
    expect(await geometry()).toEqual(initial);
    await viewport.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect(menu.locator('.relay-select-scroll')).toHaveCount(1);
    expect(await geometry()).toEqual(initial);
    await page.getByRole('option', { name: /^very-long-model/ }).click();
    await expect(model).toHaveText(/^very-long-model/);
  });
});

test('custom menus: task icons, pointer, keyboard, typeahead, dismissal and dialog focus', async ({
  page,
}) => {
  await preview(async (url) => {
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(url);
    const task = page.getByRole('combobox', { name: 'Task', exact: true });
    await expect(task).toHaveText('Update a topic');
    expect(await task.evaluate((el) => el.tagName)).toBe('BUTTON');
    await task.click();
    const menu = page.getByRole('listbox', { name: 'Task', exact: true });
    await expect(menu.getByRole('option')).toHaveCount(18);
    await expect(menu.locator('.relay-select-option-glyph svg')).toHaveCount(18);
    const icons = await menu
      .locator('.relay-select-option-glyph')
      .evaluateAll((els) => els.map((el) => el.innerHTML));
    expect(new Set(icons).size).toBeGreaterThanOrEqual(12);
    await expect(page.getByRole('option', { name: 'Update a topic', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await expect(menu).toHaveCSS('font-family', /^"?Relay Camber"?,/);
    await expect(menu).toHaveCSS('opacity', '1');
    await fitsViewport(page, menu);
    await page.screenshot({ path: 'evidence/visual/relay-dropdown-task.png' });
    await page.getByRole('option', { name: 'Reply in a thread', exact: true }).click();
    await expect(task).toHaveText('Reply in a thread');
    await expect(task).toBeFocused();
    await task.press('ArrowDown');
    await expect(
      menu.getByRole('option', { name: 'Reply in a thread', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('End');
    await expect(
      menu.getByRole('option', { name: 'Prepare a release retrospective', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(task).toHaveText('Prepare a release retrospective');
    await task.press('Enter');
    await expect(
      menu.getByRole('option', { name: 'Prepare a release retrospective', exact: true }),
    ).toBeFocused();
    await expect(menu).toHaveCSS('transition-duration', '0s');
    await page.keyboard.press('Home');
    await expect(menu.getByRole('option', { name: 'Update a topic', exact: true })).toBeFocused();
    await page.keyboard.press('r');
    await expect(
      menu.getByRole('option', { name: 'Reply in a thread', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(task).toHaveText('Reply in a thread');
    await task.press('Space');
    await page.keyboard.press('Escape');
    await expect(menu).toHaveCount(0);
    await expect(task).toBeFocused();
    await page.keyboard.press('Tab');
    const model = page.getByRole('combobox', { name: 'Model', exact: true });
    await expect(model).toBeFocused();
    await model.click();
    await expect(page.getByRole('option', { name: 'Connect a key to see models' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(page.getByRole('listbox', { name: 'Model', exact: true })).toBeFocused();
    await expect(page.getByRole('listbox', { name: 'Model', exact: true })).toHaveCSS(
      'opacity',
      '1',
    );
    await page.mouse.click(700, 600);
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await page.getByRole('button', { name: 'Run settings', exact: true }).click();
    const context = page.getByRole('combobox', { name: 'Context', exact: true });
    await context.click();
    await expect(page.getByRole('listbox', { name: 'Context' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(context).toBeFocused();
    await context.click();
    await page.getByRole('option', { name: 'Full episode history', exact: true }).click();
    await expect(context).toHaveText('Full episode history');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
});

test('model menus use lab marks, scroll long catalogs and preserve Jev restrictions', async ({
  page,
}) => {
  await preview(async (url) => {
    await page.goto(url);
    await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
    await page.getByLabel('Provider API key').fill('fake-dropdown-key');
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    const model = page.getByRole('combobox', { name: 'Model', exact: true });
    await expect(model).toHaveText('gpt-4o-mini');
    await model.click();
    const menu = page.getByRole('listbox', { name: 'Model', exact: true });
    await expect(menu.locator('.model-mark')).toHaveCount(36);
    const marks = await menu
      .locator('.model-mark')
      .evaluateAll((els) => els.slice(0, 5).map((el) => el.innerHTML));
    expect(new Set(marks).size).toBe(5);
    await expect(menu).toHaveCSS('opacity', '1');
    await page.screenshot({ path: 'evidence/visual/relay-dropdown-models.png' });
    await fitsViewport(page, menu);
    await page.keyboard.press('End');
    const last = page.getByRole('option', { name: /^very-long-model/ });
    await expect(last).toBeInViewport();
    await expect(last).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(model).toHaveText(/^very-long-model/);
    expect(await model.evaluate((el) => el.getBoundingClientRect().width)).toBeLessThanOrEqual(280);
    await model.click();
    await page.keyboard.press('Home');
    await expect(page.getByRole('option', { name: 'gpt-4o-mini', exact: true })).toBeFocused();
    await page.keyboard.press('c');
    await expect(page.getByRole('option', { name: 'claude-sonnet', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(model.locator('.relay-select-value')).toHaveText('claude-sonnet');
    await page.getByRole('button', { name: 'Connected', exact: true }).click();
    await page.getByRole('button', { name: 'Jev · TypeSafe', exact: true }).click();
    await page.getByLabel('Provider API key').fill('fake-jev-dropdown-key');
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    await expect(model).toHaveText('jev-latest');
    const mode = page.getByRole('combobox', { name: 'Interface', exact: true });
    await mode.click();
    for (const name of ['Pixels', 'Actor API'])
      await expect(page.getByRole('option', { name, exact: true })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    await page.keyboard.press('End');
    await expect(page.getByRole('option', { name: 'Page JSON', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(mode).toHaveText('Page JSON');
    await page.getByRole('combobox', { name: 'Task', exact: true }).click();
    await expect(page.getByRole('option', { name: 'Send a handoff', exact: true })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await page.keyboard.press('End');
    await expect(page.getByRole('option', { name: 'Delete a draft', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('combobox', { name: 'Task', exact: true })).toHaveText(
      'Delete a draft',
    );
  });
});

test.describe('compact custom menus', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, reducedMotion: 'reduce' });
  test('touch menus and replay controls stay inside the viewport with reduced motion', async ({
    page,
  }) => {
    await preview(async (url) => {
      await page.goto(url);
      const task = page.getByRole('combobox', { name: 'Task', exact: true });
      await task.tap();
      const menu = page.getByRole('listbox', { name: 'Task', exact: true });
      await fitsViewport(page, menu);
      await expect(menu).toHaveCSS('transition-duration', '0s');
      await page.screenshot({ path: 'evidence/visual/relay-dropdown-mobile.png' });
      await page.getByRole('option', { name: 'Edit a message', exact: true }).tap();
      await expect(task).toHaveText('Edit a message');
      await page.getByRole('button', { name: 'Watch a replay', exact: true }).tap();
      await page.getByRole('button', { name: /Watch a topic update/ }).tap();
      const speed = page.getByRole('combobox', { name: 'Playback speed', exact: true });
      await speed.tap();
      await fitsViewport(page, page.getByRole('listbox', { name: 'Playback speed' }));
      await page.getByRole('option', { name: '2×', exact: true }).tap();
      await expect(speed).toHaveText('2×');
      await page.getByRole('combobox', { name: 'Replay episode', exact: true }).tap();
      const episodes = page.getByRole('listbox', { name: 'Replay episode' });
      await fitsViewport(page, episodes);
      await episodes.getByRole('option').first().tap();
      await expect(page.getByRole('dialog', { name: 'Replay studio' })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });
  });
});
