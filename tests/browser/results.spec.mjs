import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';

test('results: homepage access, numeric sorting, all model/task traces and cost exports without inference', async ({
  page,
  request,
}, testInfo) => {
  const server = createLiveServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const requests = [],
    errors = [];
  page.on('request', (r) => requests.push(r.url()));
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(base);
    await expect(page.getByRole('link', { name: 'Results', exact: true })).toHaveAttribute(
      'href',
      '/results',
    );
    await page.getByRole('button', { name: 'Replays', exact: true }).click();
    await expect(page.getByRole('link', { name: /All model and task replays/ })).toHaveAttribute(
      'href',
      '/results',
    );
    await page.goto(`${base}/results`);
    await expect(page.locator('.cost-summary')).toContainText('$189.3110');
    await expect(page.locator('.cost-summary')).toContainText('$3.7794');
    await expect(page.locator('.cost-summary')).toContainText('35 calls');
    await page.getByRole('button', { name: 'Lowest allowance ↑', exact: true }).click();
    const numbers = await page
      .locator('#model-results tbody tr')
      .evaluateAll((rows) => rows.map((r) => Number(r.cells[8].dataset.sort)));
    expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
    await page
      .locator('#model-results tbody tr')
      .first()
      .getByRole('button', { name: '18 trials ↗' })
      .click();
    await expect(page.locator('#trial-results tbody tr:visible')).toHaveCount(18);
    await expect(
      page.locator('#trial-results tbody tr:visible a').filter({ hasText: 'Watch replay' }),
    ).toHaveCount(18);
    await page.locator('#trial-search').fill('channel-topic');
    await expect(page.locator('#trial-results tbody tr:visible')).toHaveCount(1);
    await page.locator('#clear-trial-filter').click();
    await expect(page.locator('#trial-results tbody tr:visible')).toHaveCount(306);
    await expect(page.getByRole('link', { name: 'Review trace ↗', exact: true })).toHaveCount(306);
    await page.keyboard.press('Escape');
    await page.locator('#task-filter summary').click();
    await page.getByRole('button', { name: 'channel topic', exact: true }).click();
    await page
      .locator('#model-results tbody tr')
      .first()
      .getByRole('button', { name: '1 trial ↗' })
      .click();
    await expect(page.locator('#trial-results tbody tr:visible')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await page.locator('#task-filter summary').click();
    await page.getByRole('button', { name: 'All 18 tasks', exact: true }).click();
    await expect(page.locator('#sort-status')).not.toContainText('360');
    const report = await (await request.get(`${base}/demo/results-accounting.json`)).json();
    expect(report.trials).toHaveLength(306);
    const csv = await request.get(`${base}/demo/results-accounting.csv`);
    expect(csv.headers()['content-type']).toContain('text/csv');
    expect((await csv.text()).trim().split('\n')).toHaveLength(307);
    await page.screenshot({ path: testInfo.outputPath('results-desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: testInfo.outputPath('results-mobile.png'), fullPage: true });
    expect(errors).toEqual([]);
    expect(requests.filter((url) => /[?&]action=run/.test(url))).toEqual([]);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
});
