import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';

const catalog = JSON.parse(readFileSync('evidence/interface-trial-library/catalog.json'));
const url = (base, trial, view = 'replay') =>
  `${base}/demo/review.html?${new URLSearchParams({ study: 'interfaces', trial: trial.id, view })}`;
// The sweep inspects full pixel inputs. Avoid copying every request into
// a second DOM trace/video while the original archives remain preserved.
test.use({ trace: 'off', video: 'off' });
test.describe('matched interface review', () => {
  let server, base;
  test.beforeAll(async () => {
    server = createLiveServer();
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = `http://127.0.0.1:${server.address().port}`;
  });
  test.afterAll(async () => {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });
  test('switching interfaces preserves task and model and never calls a provider', async ({
    page,
  }) => {
    const first = catalog.trials.find((r) => r.interface === 'a11y' && r.task === 'channel-topic');
    const urls = [];
    page.on('request', (request) => urls.push(request.url()));
    await page.goto(url(base, first));
    await expect(page.getByText('Recording hash checked')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Compare interface traces' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Review interface', exact: true }).click();
    await page.getByRole('option', { name: 'Pixels', exact: true }).click();
    const pixel = catalog.trials.find(
      (r) => r.model === first.model && r.task === first.task && r.interface === 'pixels',
    );
    await expect(page.locator('.review-card')).toHaveAttribute('data-trial-id', pixel.id);
    await expect(page.getByText('Recording hash checked')).toBeVisible();
    await page.getByRole('button', { name: 'Review trace', exact: true }).click();
    await expect(page).toHaveURL(/study=interfaces/);
    await page.reload();
    await expect(page.locator('.review-card')).toHaveAttribute('data-trial-id', pixel.id);
    await page.getByRole('button', { name: 'Checks', exact: true }).click();
    await expect(page.locator('.review-checks li')).not.toHaveCount(0);
    expect(urls.every((u) => u.startsWith(base))).toBe(true);
    expect(urls.some((u) => u.includes('/api/'))).toBe(false);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });
  test('every published study recording opens with its exact outcome', async ({ page }) => {
    test.setTimeout(240000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    for (const trial of catalog.trials) {
      await page.goto(url(base, trial, 'checks'));
      await expect(page.getByText('Recording hash checked')).toBeVisible();
      await expect(page.locator('.review-card')).toHaveAttribute('data-trial-id', trial.id);
      if (trial.outcome === 'passed')
        await expect(page.locator('.review-outcome')).toContainText('Task passed');
      else await expect(page.locator('.review-outcome')).not.toContainText('Task passed');
    }
    expect(errors).toEqual([]);
  });
});
