import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';
import { FreeTierError } from '../../hosted/free-tier.mjs';

const ownerKey = 'private-owner-free-fixture-key';
const visitorKey = 'private-visitor-byok-fixture-key';
async function fixture(page, run) {
  let admissions = 0;
  const keys = [],
    calls = [],
    requests = [],
    errors = [];
  const server = createLiveServer({
    freeTier: {
      enabled: true,
      key: ownerKey,
      publicConfig: { enabled: true, dailyUSD: 5, runUSD: 0.05, visitorRuns: 3 },
      reserve: async () => {
        if (admissions >= 3)
          throw new FreeTierError('You have used today’s 3 free runs on this network.', 429);
        admissions++;
        return { remaining: 3 - admissions, reservedUSD: 0.05, resets: '00:00 UTC' };
      },
    },
    pricingResolver: async (_provider, catalog) => catalog,
    routerFactory: (_provider, key) => {
      keys.push(key);
      return {
        models: async () => ({
          models: [
            { id: 'gpt-6-luna', rates: { input: 0.1, output: 0.5 } },
            { id: 'gpt-4o-mini', rates: { input: 0.15, output: 0.6 } },
            { id: 'frontier-test-model', rates: { input: 3, output: 15 } },
          ],
        }),
        respond: async ({ model }) => {
          calls.push({ key, model });
          return {
            text: '{"type":"finish"}',
            usage: { inputTokens: 20, outputTokens: 5 },
            latencyMs: 1,
            requestedModel: model,
            returnedModel: model,
          };
        },
      };
    },
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  page.on('request', (r) => {
    if (r.url().includes('/api/relay') && r.method() === 'POST') requests.push(r.postDataJSON());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(origin);
    await run({ origin, keys, calls, requests, admissions: () => admissions });
    expect(errors).toEqual([]);
    expect(JSON.stringify(requests)).not.toContain(ownerKey);
    expect(await page.locator('body').innerText()).not.toContain(ownerKey);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
}

test('free is ready without a key; one click runs once, keeps evidence, and BYOK stays separate', async ({
  page,
}) => {
  test.setTimeout(60000);
  await fixture(page, async ({ calls, requests, admissions }) => {
    await expect(page.getByRole('button', { name: 'Free', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByRole('combobox', { name: 'Model', exact: true })).toHaveText(
      'gpt-6-luna',
    );
    expect(calls).toEqual([]);
    await expect(page.locator('.nav a, .nav button')).toHaveCount(5);
    await expect(page.locator('.welcome, .decision-panel, .timeline')).toHaveCount(0);
    await expect(
      page.getByText('Isolated workspace · hidden outcome grader', { exact: true }),
    ).toHaveCount(0);
    await page.getByRole('combobox', { name: 'Model', exact: true }).click();
    await expect(page.getByRole('option')).toHaveCount(2);
    await expect(page.getByRole('option', { name: 'frontier-test-model' })).toHaveCount(0);
    await page.keyboard.press('Escape');
    await page.getByRole('combobox', { name: 'Interface', exact: true }).click();
    await expect(page.getByRole('option', { name: 'Pixels', exact: true })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await page.keyboard.press('Escape');
    await page.screenshot({ path: 'evidence/visual/relay-free-desktop.png', fullPage: true });
    await page.getByRole('button', { name: 'Run', exact: true }).dblclick({ delay: 80 });
    await expect(page.getByRole('heading', { name: 'Task incomplete', exact: true })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled();
    expect(calls).toEqual([{ key: ownerKey, model: 'gpt-6-luna' }]);
    expect(admissions()).toBe(1);
    expect(requests.filter((r) => r.task)).toEqual([
      { access: 'free', model: 'gpt-6-luna', task: 'channel-topic', interface: 'a11y' },
    ]);
    await expect(page.getByText('2 free runs left today', { exact: false })).toBeVisible();
    await page
      .locator('.nav')
      .getByRole('button', { name: /History/ })
      .click();
    await expect(page.locator('.history-row')).toHaveCount(1);
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Run matched interfaces' })).toBeDisabled();
    await expect(page.locator('.comparison-table')).toContainText('gpt-6-luna');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Your key', exact: true }).click();
    await page.getByLabel('Provider API key').fill(visitorKey);
    await expect(page.getByRole('button', { name: 'Connected', exact: true })).toBeVisible();
    await page.getByRole('combobox', { name: 'Model', exact: true }).click();
    await page.getByRole('option', { name: 'frontier-test-model', exact: true }).click();
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect.poll(() => calls.length).toBe(2);
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled({
      timeout: 20000,
    });
    expect(calls[1]).toEqual({ key: visitorKey, model: 'frontier-test-model' });
    expect(admissions()).toBe(1);
    await page.getByRole('button', { name: 'Free', exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Model', exact: true })).toHaveText(
      'gpt-6-luna',
    );
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: 'evidence/visual/relay-free-mobile.png', fullPage: true });
  });
});

test('free run quota blocks a fourth attempt, including after refresh; BYOK is still available', async ({
  page,
}) => {
  test.setTimeout(60000);
  await fixture(page, async ({ origin, calls, admissions }) => {
    await expect(page.getByRole('combobox', { name: 'Model', exact: true })).toHaveText(
      'gpt-6-luna',
    );
    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: 'Run', exact: true }).click();
      await expect.poll(() => calls.length).toBe(i + 1);
      await expect(page.getByRole('button', { name: 'Run', exact: true })).toHaveAttribute(
        'aria-busy',
        'false',
        { timeout: 20000 },
      );
    }
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeDisabled();
    expect(admissions()).toBe(3);
    const denied = await page.request.post(`${origin}/api/relay?op=run`, {
      headers: { origin },
      data: { access: 'free', model: 'gpt-6-luna', task: 'channel-topic', interface: 'a11y' },
    });
    expect(denied.status()).toBe(429);
    await page.reload();
    await expect(page.getByRole('combobox', { name: 'Model', exact: true })).toHaveText(
      'gpt-6-luna',
    );
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('3 free runs');
    expect(calls).toHaveLength(3);
    await page.getByRole('button', { name: 'Your key', exact: true }).click();
    await expect(page.getByLabel('Provider API key')).toBeVisible();
  });
});
