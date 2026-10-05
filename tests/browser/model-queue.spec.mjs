import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';
import { RampRouter } from '../../runner/router.mjs';
import { createPricingResolver } from '../../hosted/pricing.mjs';

async function fixture(page, run, { missingUsage = false } = {}) {
  const requests = [];
  const calls = [];
  const concurrency = { active: 0, max: 0 };
  const models = [
    'claude-sonnet-5-5',
    'gemini-3.8-flash',
    ...Array.from({ length: 8 }, (_, i) => `test-model-${i}`),
  ];
  const server = createLiveServer({
    pricingResolver: createPricingResolver({ refresh: false }),
    routerFactory: () => {
      const router = new RampRouter({
        apiKey: 'fake-model-queue-key',
        fetchImpl: async () =>
          new Response(
            JSON.stringify({
              data: models.map((id) => ({
                id,
                router: {
                  schema_version: 1,
                  request_name: id,
                  status: 'active',
                  surfaces: ['responses'],
                  pricing: { input: '2', output: '10' },
                },
              })),
            }),
          ),
      });
      router.respond = async ({ model }) => {
        calls.push(model);
        return {
          text: '{"type":"finish"}',
          usage: missingUsage ? null : { inputTokens: 10, outputTokens: 5 },
          latencyMs: 1,
          requestedModel: model,
          returnedModel: model,
        };
      };
      return router;
    },
  });
  server.on('request', (req, res) => {
    if (!req.url.includes('op=run')) return;
    concurrency.active++;
    concurrency.max = Math.max(concurrency.max, concurrency.active);
    res.once('finish', () => concurrency.active--);
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  page.on('request', (r) => {
    if (r.url().includes('op=run')) requests.push(r.postDataJSON().config);
  });
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole('button', { name: 'Your key', exact: true }).click();
    await page.getByLabel('Provider API key').fill('fake-model-queue-key');
    await expect(
      page.getByRole('button', { name: 'Your key', exact: true }),
    ).toHaveAccessibleDescription('Connected. Open key settings.');
    await run({ requests, calls, concurrency });
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
}

test('catalog-priced models run sequentially with independent budgets, audits, history and comparisons', async ({
  page,
}) => {
  test.setTimeout(60000);
  await fixture(page, async ({ requests, calls, concurrency }) => {
    let launches = 0;
    await page.route('**/api/relay?op=run', async (route) => {
      if (++launches === 2) {
        // The first run's decoded frame/cursor/results must be gone before
        // the second request can produce any frame (both use episode-001).
        await expect(page.locator('.viewport')).toHaveAttribute('data-run-id', '');
        await expect(page.locator('.viewport > img')).toHaveCount(0);
        await expect(page.locator('.viewport .agent-cursor')).toHaveCount(0);
        await expect(page.getByRole('region', { name: 'Run result' })).toHaveCount(0);
      }
      await route.continue();
    });
    await expect(page.getByRole('combobox', { name: 'Model', exact: true })).toHaveAttribute(
      'title',
      'claude-sonnet-5-5',
    );
    await page.getByRole('button', { name: 'Run settings' }).click();
    await expect(page.getByLabel('Spend cap')).toHaveValue('2');
    await expect(page.getByLabel('Spend cap')).toHaveAttribute('max', '5');
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    await page.getByRole('button', { name: 'Try models', exact: true }).click();
    await page.getByRole('checkbox', { name: 'gemini-3.8-flash', exact: true }).check();
    await expect(page.getByText('Up to $4.00 estimated total')).toBeVisible();
    await page.getByLabel('Search models').fill('gemini');
    await expect(
      page.getByRole('checkbox', { name: 'claude-sonnet-5-5', exact: true }),
    ).toHaveCount(0);
    await page.getByLabel('Search models').fill('');
    await expect(
      page.getByRole('checkbox', { name: 'claude-sonnet-5-5', exact: true }),
    ).toBeChecked();
    await page.screenshot({ path: 'evidence/visual/relay-model-queue.png', fullPage: true });
    await page.getByRole('button', { name: 'Run 2 models', exact: true }).click();
    await expect(page.locator('.control-bar .run-trigger')).toBeDisabled();
    await expect(page.locator('.control-bar .run-trigger')).toHaveAttribute('aria-busy', 'true');
    await expect(page.getByText('Queue finished · 2 / 2', { exact: true })).toBeVisible({
      timeout: 45000,
    });
    expect(calls).toEqual(['claude-sonnet-5-5', 'gemini-3.8-flash']);
    expect(requests).toHaveLength(2);
    expect(concurrency).toEqual({ active: 0, max: 1 });
    expect(launches).toBe(2);
    await expect(page.locator('.viewport > img')).toHaveCount(1);
    for (const c of requests) {
      expect(c.models).toHaveLength(1);
      expect(c.maxEstimatedUSD).toBe(2);
      expect(c.episodeSeconds).toBe(180);
      expect(c.maxSteps).toBe(40);
    }
    const values = await page.evaluate(
      () =>
        new Promise((resolve, reject) => {
          const open = indexedDB.open('relay-history-v1', 1);
          open.onsuccess = () => {
            const r = open.result.transaction('runs').objectStore('runs').getAll();
            r.onsuccess = () => {
              open.result.close();
              resolve(r.result);
            };
            r.onerror = reject;
          };
        }),
    );
    expect(values).toHaveLength(2);
    expect(new Set(values.map((r) => r.batch.id)).size).toBe(1);
    expect(new Set(values.map((r) => r.run.id)).size).toBe(2);
    expect(values.every((r) => r.audit.integrity.status === 'verified')).toBe(true);
    expect(JSON.stringify(values)).not.toContain('fake-model-queue-key');
    await page
      .locator('.nav')
      .getByRole('button', { name: /History/ })
      .click();
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    const table = page.getByRole('dialog', { name: 'Compare runs' });
    await expect(table.getByRole('cell').filter({ hasText: 'claude-sonnet-5-5' })).toBeVisible();
    await expect(table.getByRole('cell').filter({ hasText: 'gemini-3.8-flash' })).toBeVisible();
  });
});

test('unknown usage stops the queue without calling another selected model', async ({ page }) => {
  test.setTimeout(60000);
  await fixture(
    page,
    async ({ requests, calls }) => {
      await page.getByRole('button', { name: 'Try models', exact: true }).click();
      await page.getByRole('checkbox', { name: 'gemini-3.8-flash', exact: true }).check();
      await page.getByRole('button', { name: 'Run 2 models', exact: true }).click();
      await expect(page.getByText('Queue paused · 1 / 2', { exact: true })).toBeVisible({
        timeout: 45000,
      });
      await expect(page.getByRole('alert')).toContainText('Remaining models were not called');
      expect(calls).toEqual(['claude-sonnet-5-5']);
      expect(requests).toHaveLength(1);
      await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled();
    },
    { missingUsage: true },
  );
});

test('queue picker is keyboard/mobile usable and limits selection without losing hidden choices', async ({
  page,
}) => {
  await fixture(page, async ({ requests }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: 'Try models', exact: true }).click();
    for (let i = 0; i < 7; i++)
      await page.getByRole('checkbox', { name: `test-model-${i}`, exact: true }).check();
    await expect(page.getByRole('checkbox', { name: 'test-model-7', exact: true })).toBeDisabled();
    await expect(page.getByText('Up to $16.00 estimated total')).toBeVisible();
    const selected = page.getByRole('checkbox', { name: 'test-model-0', exact: true });
    await selected.focus();
    await page.keyboard.press('Space');
    await expect(selected).not.toBeChecked();
    await expect(page.getByRole('checkbox', { name: 'test-model-7', exact: true })).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: 'evidence/visual/relay-model-queue-mobile.png', fullPage: true });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(requests).toHaveLength(0);
  });
});
