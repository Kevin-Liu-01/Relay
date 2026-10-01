import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';
import { testPricing } from '../fixtures/pricing.mjs';

async function serve(run, { gateRuns = false } = {}) {
  const calls = [];
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const server = createLiveServer({
    pricingResolver: testPricing,
    routerFactory: (provider, key) => ({
      models: async () => {
        calls.push({ provider, key });
        if (gateRuns && calls.length > 1) await gate;
        return {
          models: (provider === 'typesafe'
            ? ['jev-latest']
            : ['nemotron-lightning-3p5-30b-a3b', 'deepseek-v4-flash', 'unknown-unpriced-model']
          ).map((id) => ({ id })),
        };
      },
      respond: async () => {
        throw Error('These UI checks must not reach inference.');
      },
    }),
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await run(`http://127.0.0.1:${server.address().port}`, calls, release);
  } finally {
    release();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

test('key entry is debounced; automatic prices and a shared connection make both lanes ready', async ({
  page,
}) => {
  await serve(async (url, calls) => {
    await page.goto(url);
    await page.clock.install({ time: new Date('2026-09-30T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-30T12:00:01Z'));
    await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
    const field = page.getByLabel('Provider API key');
    await field.fill('fake-first-draft');
    await field.fill('fake-final-key');
    await page.clock.fastForward(599);
    expect(calls).toHaveLength(0);
    await page.clock.fastForward(1);
    await expect(page.getByRole('button', { name: 'Connected', exact: true })).toBeVisible();
    expect(calls).toEqual([{ provider: 'ramp', key: 'fake-final-key' }]);
    await expect(page.getByRole('button', { name: 'Run this task', exact: true })).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Bring your own key', exact: true })).toHaveCount(
      0,
    );
    const model = page.getByRole('combobox', { name: 'Model', exact: true });
    await expect(model).toHaveText('nemotron-lightning-3p5-30b-a3b');
    await model.click();
    await expect(
      page.getByRole('option', { name: 'unknown-unpriced-model', exact: true }),
    ).toHaveAttribute('aria-disabled', 'true');
    await page.getByRole('option', { name: 'deepseek-v4-flash', exact: true }).click();
    await page.getByRole('button', { name: 'Run settings' }).click();
    await expect(page.locator('.model-price')).toHaveText(
      '$0.14 in · $0.28 out / 1M tokens · auto',
    );
    await expect(page.getByLabel('Input price', { exact: true })).toHaveCount(0);
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.getByRole('button', { name: '1v1', exact: true }).click();
    for (const side of ['A', 'B'])
      await expect(page.getByRole('combobox', { name: `Model ${side}`, exact: true })).toHaveText(
        'deepseek-v4-flash',
      );
    await expect(page.getByRole('button', { name: 'Start 1v1', exact: true })).toBeEnabled();
    expect(calls).toHaveLength(1);
    await page.screenshot({ path: 'evidence/visual/relay-one-click-arena.png', fullPage: true });
  });
});

for (const arena of [false, true])
  test(`${arena ? '1v1' : 'solo'} launch: immediate loading, duplicate click protection, separate cancellation`, async ({
    page,
  }) => {
    await serve(
      async (url, calls, release) => {
        const requests = [];
        page.on('request', (r) => {
          if (r.url().includes('op=run')) requests.push(r.url());
        });
        await page.goto(url);
        await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
        await page.getByLabel('Provider API key').fill('fake-loading-key');
        await expect(page.getByRole('button', { name: 'Connected', exact: true })).toBeVisible();
        if (arena) await page.getByRole('button', { name: '1v1', exact: true }).click();
        const button = page.getByRole('button', { name: arena ? 'Start 1v1' : 'Run', exact: true });
        const box = await button.boundingBox();
        // Two actual pointer clicks at the same point must neither duplicate nor cancel.
        await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
        const pending = page.getByRole('button', { name: 'Starting…', exact: true });
        await expect(pending).toBeDisabled();
        await expect(pending).toHaveAttribute('aria-busy', 'true');
        if (!arena) {
          await expect(page.getByRole('img', { name: 'Live agent workspace' })).toHaveCount(0);
          await expect(
            page.getByRole('status').filter({ hasText: 'Starting workspace…' }),
          ).toBeVisible();
        }
        await expect.poll(() => requests.length).toBe(arena ? 2 : 1);
        await expect.poll(() => calls.length).toBe(arena ? 3 : 2);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await expect(pending.locator('.busy-spinner')).toHaveCSS('animation-name', 'none');
        if (!arena) {
          await page.screenshot({ path: 'evidence/visual/relay-starting.png', fullPage: true });
          await page.setViewportSize({ width: 390, height: 844 });
          expect(
            await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          ).toBe(true);
          await expect(pending).toBeInViewport();
          await expect(page.getByRole('button', { name: 'Stop', exact: true })).toBeInViewport();
          await page.screenshot({
            path: 'evidence/visual/relay-starting-mobile.png',
            fullPage: true,
          });
        }
        await page.getByRole('button', { name: arena ? 'Stop both' : 'Stop', exact: true }).click();
        await expect(
          page.getByRole('button', { name: arena ? 'Start 1v1' : 'Run', exact: true }),
        ).toBeEnabled();
        expect(requests).toHaveLength(arena ? 2 : 1);
        release();
        await expect(page.getByRole('alert').first()).toContainText('Stopped');
      },
      { gateRuns: true },
    );
  });

test('opting out during the auto-connect debounce never persists the pasted key', async ({
  page,
}) => {
  await serve(async (url) => {
    await page.goto(url);
    await page.clock.install({ time: new Date('2026-09-30T12:00:00Z') });
    await page.clock.pauseAt(new Date('2026-09-30T12:00:01Z'));
    await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
    await page.getByLabel('Provider API key').fill('fake-private-autoconnect-key');
    await page.getByLabel('Remember keys on this device').uncheck();
    await page.clock.fastForward(600);
    await expect(page.getByRole('button', { name: 'Connected', exact: true })).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('relay-credentials-v1'))).not.toContain(
      'fake-private',
    );
  });
});
