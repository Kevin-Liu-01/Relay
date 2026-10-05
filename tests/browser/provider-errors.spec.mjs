import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';
import { RampRouter } from '../../runner/router.mjs';
import { testPricing } from '../fixtures/pricing.mjs';

async function expectCompactResult(page, result, title) {
  const heading = result.getByRole('heading', { name: title, exact: true });
  for (const width of [1440, 900, 375, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(heading).toHaveCSS('font-weight', '600');
    await expect(heading).toHaveCSS('white-space', 'nowrap');
    await expect(result.locator('.mini-label')).toHaveCSS('font-weight', '500');
    const geometry = await heading.evaluate((el) => {
      const text = document.createRange();
      text.selectNodeContents(el);
      const rects = [...text.getClientRects()];
      const card = el.closest('.result-card').getBoundingClientRect();
      return {
        lines: new Set(rects.map((r) => r.top)).size,
        right: Math.max(...rects.map((r) => r.right)),
        cardRight: card.right,
      };
    });
    expect(geometry.lines).toBe(1);
    expect(geometry.right).toBeLessThanOrEqual(geometry.cardRight - 12);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}

test('Router 403 is blocked, not task failure or verified success; unknown usage and manual recovery', async ({
  page,
}) => {
  let requests = 0;
  const server = createLiveServer({
    pricingResolver: testPricing,
    routerFactory: (_, apiKey) =>
      new RampRouter({
        apiKey,
        fetchImpl: async (url, options) => {
          if (url.endsWith('/models'))
            return new Response(
              JSON.stringify({ data: [{ id: 'gpt-4o-mini' }, { id: 'deepseek-v4-flash' }] }),
            );
          requests++;
          if (JSON.parse(options.body).model === 'deepseek-v4-flash')
            return new Response(
              JSON.stringify({
                status: 'completed',
                model: 'fake-recovery-only',
                output: [
                  {
                    type: 'message',
                    content: [{ type: 'output_text', text: '{"type":"finish"}' }],
                  },
                ],
                usage: { input_tokens: 10, output_tokens: 5 },
              }),
            );
          return new Response('never-persist-provider-error-body', {
            status: 403,
            headers: { 'x-request-id': 'router-403-browser-repro' },
          });
        },
      }),
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole('button', { name: 'Your key', exact: true }).click();
    await page.getByLabel('Provider API key').fill('fake-error-regression-key');
    await expect(
      page.getByRole('button', { name: 'Your key', exact: true }),
    ).toHaveAccessibleDescription('Connected. Open key settings.');
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    const result = page.getByRole('region', { name: 'Run result' });
    await expect(result).toBeVisible();
    await expect(
      result.getByRole('heading', { name: 'Provider unavailable', exact: true }),
    ).toBeVisible();
    await expect(page.getByText('WORKSPACE VERIFIED', { exact: true })).toHaveCount(0);
    await expect(result).toContainText('No agent actions were executed');
    await expect(result).not.toContainText('Task incomplete');
    await expect(page.getByRole('region', { name: 'Current action', exact: true })).toHaveCount(0);
    await expect(page.locator('.workspace-top [role="status"]')).toHaveText('Provider unavailable');
    await expectCompactResult(page, result, 'Provider unavailable');
    await expect(result.getByRole('button', { name: 'Choose another model' })).toBeInViewport();
    await expect(page.locator('footer')).toContainText('Unknown');
    await expect(page.locator('footer')).not.toContainText('0tokens');
    await expect(page.locator('footer')).toContainText('not a charge');
    expect(requests).toBe(1);
    await page.screenshot({ path: 'evidence/visual/relay-provider-blocked.png', fullPage: true });
    await page.getByRole('button', { name: 'Choose another model', exact: true }).click();
    await expect(
      page.getByRole('option', { name: 'deepseek-v4-flash', exact: true }),
    ).toBeVisible();
    await page.getByRole('option', { name: 'deepseek-v4-flash', exact: true }).click();
    expect(requests).toBe(1);
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(
      result.getByRole('heading', { name: 'Task incomplete', exact: true }),
    ).toBeVisible();
    await expect(result).toContainText('WORKSPACE CHECKED');
    await expect(result).not.toContainText('RUN BLOCKED');
    await expectCompactResult(page, result, 'Task incomplete');
    await result.screenshot({ path: 'evidence/visual/relay-result-compact.png' });
    expect(requests).toBe(2);
    await page.getByRole('button', { name: /^History/ }).click();
    await expect(page.getByRole('dialog')).not.toContainText('never-persist-provider-error-body');
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});
