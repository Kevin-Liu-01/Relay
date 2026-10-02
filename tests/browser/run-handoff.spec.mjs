import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';
import { testPricing } from '../fixtures/pricing.mjs';

// UI lifecycle tests use fake receipts only. No provider traffic or paid inference.
async function fixture(page, check) {
  const server = createLiveServer({
    pricingResolver: testPricing,
    routerFactory: () => ({ models: async () => ({ models: [{ id: 'gpt-4o-mini' }] }) }),
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const requests = [];
  const pending = [];
  await page.route('**/api/relay?op=run', async (route) => {
    const config = route.request().postDataJSON().config;
    requests.push(config);
    await new Promise((resolve) => pending.push({ route, resolve, config }));
  });
  const finish = async (index) => {
    const { route, resolve, config } = pending[index];
    const run = {
      id: `handoff-${index}`,
      status: 'completed',
      config,
      budget: { usageKnown: true },
      episodes: [
        {
          status: 'completed',
          steps: 0,
          durationMs: 1000,
          estimatedUSD: 0,
          cell: {
            episodeId: 'episode-001',
            model: config.models[0],
            taskId: config.tasks[0],
            mode: config.interfaces[0],
            seed: 42,
            history: 'recent-4',
          },
          evaluation: { success: false, checks: [{ name: 'topic_correct', passed: false }] },
        },
      ],
    };
    await route.fulfill({
      contentType: 'application/x-ndjson',
      body:
        [
          { type: 'run', data: run },
          { type: 'audit', data: { integrity: { status: 'verified' }, episodes: [] } },
          { type: 'done' },
        ]
          .map((v) => JSON.stringify(v))
          .join('\n') + '\n',
    });
    resolve();
  };
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
    await page.getByLabel('Provider API key').fill('fake-handoff-key');
    await expect(page.getByRole('button', { name: 'Connected', exact: true })).toBeVisible();
    await check({ requests, pending, finish });
  } finally {
    for (const p of pending) p.resolve();
    await page.unrouteAll({ behavior: 'ignoreErrors' });
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}

test('a dismissed replay load cannot reopen over the next running workspace', async ({ page }) => {
  await fixture(page, async ({ pending, finish }) => {
    let release;
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    await page.route('**/demo/replays.json', (route) =>
      route.fulfill({
        json: [{ path: '/demo/delayed.json', title: 'Delayed recording', kind: 'Test only' }],
      }),
    );
    await page.route('**/demo/delayed.json', async (route) => {
      await gate;
      await route.fulfill({
        json: {
          run: {
            id: 'old-replay',
            episodes: [
              { cell: { episodeId: 'episode-001', mode: 'a11y', model: { id: 'Old recording' } } },
            ],
          },
          events: [],
          artifacts: {},
        },
      });
    });
    await page.getByRole('button', { name: 'Replays', exact: true }).click();
    const loading = page.waitForRequest('**/demo/delayed.json');
    await page.getByRole('button', { name: /Delayed recording/ }).click();
    await loading;
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect.poll(() => pending.length).toBe(1);
    const response = page.waitForResponse('**/demo/delayed.json');
    release();
    await (await response).finished();
    // Flush rendering after the delayed fetch; do not assert before it can settle.
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    await expect(page.getByRole('dialog', { name: 'Replay studio' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Live Slack workspace' })).toBeVisible();
    await finish(0);
  });
});

test('an enabled Run accepts the next run immediately after completion, with no hidden cooldown', async ({
  page,
}) => {
  await fixture(page, async ({ pending, finish, requests }) => {
    await page.clock.setFixedTime(new Date('2026-10-02T12:00:00Z'));
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect.poll(() => pending.length).toBe(1);
    await page.clock.setFixedTime(new Date('2026-10-02T12:00:01Z'));
    await finish(0);
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled();
    // Freeze the moment of completion: the next click must not be silently dropped.
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect.poll(() => requests.length).toBe(2);
    await expect(page.getByRole('region', { name: 'Run result' })).toHaveCount(0);
    await expect(page.locator('.viewport > img')).toHaveCount(0);
    await page.clock.setFixedTime(new Date('2026-10-02T12:00:02Z'));
    await finish(1);
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeEnabled();
  });
});

test('outcomes show distinct badges, check counts, filters and episode-specific evidence', async ({
  page,
}) => {
  await fixture(page, async () => {
    await page.evaluate(async () => {
      const db = await new Promise((resolve) => {
        const open = indexedDB.open('relay-history-v1', 1);
        open.onsuccess = () => resolve(open.result);
      });
      const tx = db.transaction(['runs', 'summaries'], 'readwrite');
      for (const [i, status] of [
        'completed',
        'completed',
        'budget',
        'provider_unavailable',
        'interrupted',
        'timeout',
      ].entries()) {
        const id = `outcome-fixture-${i}`;
        const episode = {
          status,
          cell: {
            episodeId: `episode-${i}`,
            model: { id: 'gpt-4o-mini' },
            taskId: 'channel-topic',
            seed: 42,
            mode: 'a11y',
            history: 'recent-4',
          },
          steps: i ? 3 : 4,
          durationMs: 12345,
          estimatedUSD: 0.0034,
          usageKnown: status !== 'interrupted',
          // Blocked runs deliberately have successful diagnostic checks.
          evaluation: {
            success: i !== 1,
            checks: [
              { name: 'topic_correct', passed: i !== 1 },
              { name: 'no_unrequested_state_changes', passed: true },
            ],
          },
        };
        const value = {
          id,
          run: {
            id,
            status: 'completed',
            evidenceKind: 'scripted-reference',
            config: { models: [{ id: 'gpt-4o-mini' }], tasks: ['channel-topic'], provider: 'ramp' },
            budget: { requests: 4, usageKnown: true, estimatedUSD: 0.0034 },
            episodes: [episode],
          },
          capturedAt: `2026-10-02T12:00:0${i}Z`,
          completeAudit: status !== 'interrupted',
          events: [],
          artifacts: {},
        };
        tx.objectStore('runs').put(value);
        tx.objectStore('summaries').put(value);
      }
      await new Promise((resolve) => {
        tx.oncomplete = resolve;
      });
      db.close();
    });
    await page.reload();
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    const modal = page.getByRole('dialog', { name: 'Compare runs' });
    await expect(modal.locator('.outcome-summary')).toHaveCount(6);
    await expect(modal.locator('.outcome-passed')).toHaveCount(1);
    await expect(modal.locator('.outcome-incomplete')).toHaveText('Task incomplete');
    await expect(modal.getByText('1/2 checks passed', { exact: true })).toBeVisible();
    await expect(modal.locator('.outcome-limit')).toHaveCount(2);
    await expect(modal.locator('.outcome-blocked')).toHaveCount(2);
    await expect(modal.locator('.outcome-badge svg')).toHaveCount(6);
    await page.screenshot({
      path: 'evidence/visual/relay-outcomes-desktop.png',
      fullPage: true,
      animations: 'disabled',
    });
    await modal.getByRole('button', { name: 'Blocked 4', exact: true }).click();
    await expect(modal.locator('tbody tr')).toHaveCount(4);
    await expect(modal.locator('.outcome-passed')).toHaveCount(0);
    await modal.getByRole('button', { name: 'All runs 6', exact: true }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(modal.getByText('Time allowance reached', { exact: true })).toBeInViewport();
    await page.screenshot({
      path: 'evidence/visual/relay-outcomes-mobile.png',
      fullPage: true,
      animations: 'disabled',
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await modal
      .getByRole('button', { name: 'Inspect gpt-4o-mini episode-1 outcome-', exact: true })
      .click();
    await expect(modal).toHaveCount(0);
    await expect(page.locator('.viewport')).toHaveAttribute('data-episode-id', 'episode-1');
    await expect(page.getByRole('heading', { name: 'Task incomplete', exact: true })).toBeVisible();
    await page.getByRole('button', { name: /^History/ }).click();
    await expect(page.locator('.history-row .outcome-summary')).toHaveCount(6);
    await expect(page.locator('.history-row .outcome-passed')).toHaveCount(1);
  });
});
