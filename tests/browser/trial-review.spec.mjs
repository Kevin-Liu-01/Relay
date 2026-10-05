import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';
const catalog = JSON.parse(readFileSync('evidence/trial-library/catalog.json'));
const passed = catalog.trials.find((r) => r.outcome === 'passed' && r.task === 'channel-topic');
const zero = catalog.trials.find((r) => r.outcome === 'blocked' && r.actionAttempts === 0);
const diagnostic = catalog.trials.find((r) => r.outcome === 'blocked' && r.diagnosticSuccess);
const csp = JSON.parse(readFileSync('vercel.json')).headers[1].headers.find(
  (h) => h.key.toLowerCase() === 'content-security-policy',
).value;
const review = (base, item = passed, view = 'replay') =>
  `${base}/demo/review.html?${new URLSearchParams({ trial: item.id, view })}`;
test.describe('public trial library', () => {
  let server, base;
  test.beforeAll(async () => {
    if (process.env.RELAY_REVIEW_PREVIEW === '1') {
      base = 'http://127.0.0.1:4352';
      return;
    }
    server = createLiveServer();
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = `http://127.0.0.1:${server.address().port}`;
  });
  test.afterAll(async () => {
    if (!server) return;
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  });

  test('real UI replay, cursor, requests, checks and download need no model calls under CSP', async ({
    page,
  }) => {
    const requests = [],
      errors = [];
    page.on('request', (request) => requests.push(request.url()));
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.route('**/demo/review.html?**', async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        headers: { ...response.headers(), 'content-security-policy': csp },
      });
    });
    await page.goto(review(base));
    await expect(page.getByText('Recording hash checked')).toBeVisible();
    await expect(page.locator('.review-outcome')).toContainText('Task passed');
    const comparison = page.getByRole('region', { name: 'Expected and actual result' });
    await expect(comparison).toContainText('1/2 fields match');
    await expect(comparison.locator('.comparison-field').first()).toContainText(
      'Launch review · 15:00 UTC · Bring the final checklist',
    );
    await expect(comparison.locator('.comparison-field').first()).toHaveAttribute(
      'data-status',
      'different',
    );
    await page.getByRole('button', { name: 'Next action', exact: true }).click();
    const workspace = page.frameLocator('iframe[title="Recorded Slack workspace"]');
    await expect(workspace.getByRole('dialog', { name: 'Edit channel topic' })).toBeVisible();
    await expect(
      page.getByText('recorded cursor, smoothed motion', { exact: false }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Play replay', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Pause replay' })).toBeVisible();
    await page.getByRole('button', { name: 'Pause replay' }).click();
    const position = page.getByRole('slider', { name: 'Playback position' });
    await position.fill(await position.getAttribute('max'));
    await expect(comparison).toContainText('2/2 fields match');
    await expect(comparison).toContainText('Final workspace');
    await expect(comparison).toContainText('Saved check: unchanged');
    await page.screenshot({ path: 'artifacts/expected-result-desktop.png', fullPage: true });
    await position.fill('0');
    await expect(comparison).toContainText('1/2 fields match');
    await page.getByRole('button', { name: 'Expand replay' }).click();
    await expect(page.locator('.replay-player')).toHaveAttribute('data-focus', 'true');
    await page.keyboard.press('Escape');
    await expect(page.locator('.replay-player')).toHaveAttribute('data-focus', 'false');
    await page.getByRole('button', { name: 'Review trace', exact: true }).click();
    await page.getByRole('combobox', { name: 'Event type' }).click();
    await page.getByRole('option', { name: 'input', exact: true }).click();
    await expect(page.locator('.review-event')).toContainText('Exact model request');
    await expect(page.locator('.review-event')).toContainText('Launch review');
    await page.getByRole('combobox', { name: 'Event type' }).click();
    await page.getByRole('option', { name: 'response', exact: true }).click();
    await expect(page.locator('.review-event')).toContainText('Recorded model output');
    await expect(page.locator('.review-event details').first()).toContainText('click');
    await page.getByRole('combobox', { name: 'Event type' }).click();
    await page.getByRole('option', { name: 'step', exact: true }).click();
    await expect(page.locator('.review-event details').first()).toContainText('Parsed action');
    await expect(page.locator('.review-event details').first()).toContainText('click');
    await page.getByRole('button', { name: 'Checks', exact: true }).click();
    await expect(page.locator('.review-checks li')).toHaveCount(2);
    await expect(page.locator('.review-checks li[data-passed="true"]')).toHaveCount(2);
    await page.getByRole('button', { name: 'Changes', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Workspace changes' })).toContainText(
      'Initial → final workspace',
    );
    await page.getByRole('button', { name: 'Provenance', exact: true }).click();
    await expect(page.locator('.review-provenance')).toContainText(passed.archiveSha256);
    const downloading = page.waitForEvent('download');
    await page.getByRole('button', { name: 'JSON', exact: true }).click();
    expect((await downloading).suggestedFilename()).toBe(`relay-${passed.id}.json`);
    expect(requests.every((url) => url.startsWith(base))).toBe(true);
    expect(requests.some((url) => /\/api\//.test(url))).toBe(false);
    expect(requests.filter((url) => url.endsWith('.json.gz'))).toHaveLength(1);
    expect(errors).toEqual([]);
  });

  test('blocked zero-action runs never invent playback and diagnostic passes remain blocked', async ({
    page,
  }) => {
    await page.goto(review(base, zero));
    await expect(page.getByRole('heading', { name: 'No actions recorded' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Play replay', exact: true })).toHaveCount(0);
    await expect(page.locator('.review-outcome')).not.toContainText('Task passed');
    await expect(page.getByRole('region', { name: 'Expected and actual result' })).toContainText(
      'Expected final',
    );
    await page.goto(review(base, diagnostic, 'checks'));
    await expect(page.getByRole('heading', { name: 'Diagnostic workspace checks' })).toBeVisible();
    await expect(page.locator('.review-outcome')).not.toContainText('Task passed');
    await expect(page.locator('.review-checks li')).not.toHaveCount(0);
  });

  test('switching trials removes the old workspace immediately and rejects late loads', async ({
    page,
  }) => {
    const first = catalog.trials[0],
      second = catalog.trials[1],
      third = catalog.trials[2];
    await page.goto(review(base, first));
    await expect(page.locator('iframe')).toHaveCount(1);
    let release, arrived;
    const arrivedPromise = new Promise((resolve) => {
      arrived = resolve;
    });
    const gate = new Promise((resolve) => {
      release = resolve;
    });
    await page.route(`**${second.path}`, async (route) => {
      arrived();
      await gate;
      await route
        .fulfill({
          body: readFileSync(`evidence/trial-library/${second.path.split('/').at(-1)}`),
          contentType: 'application/octet-stream',
        })
        .catch(() => {});
    });
    await page.getByRole('button', { name: 'Next trial', exact: true }).click();
    await arrivedPromise;
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.getByRole('status')).toContainText('Loading and verifying');
    await page.getByRole('button', { name: 'Next trial', exact: true }).click();
    await expect(page.getByText('Recording hash checked')).toBeVisible();
    await expect(page.locator('.review-summary')).toContainText(third.model);
    release();
    await expect(page).toHaveURL(new RegExp(third.id));
    await expect(page.locator('iframe')).toHaveCount(1);
    await page.goBack();
    await expect(page.locator('.review-summary')).toContainText(second.model);
    await expect(page.getByText('Recording hash checked')).toBeVisible();
  });

  test('bad IDs never fetch recordings; tampered files fail closed with a visible error', async ({
    page,
  }) => {
    const paths = [];
    page.on('request', (request) => {
      if (request.url().endsWith('.json.gz')) paths.push(request.url());
    });
    await page.goto(`${base}/demo/review.html?trial=../../private&view=trace`);
    await expect(page.getByRole('alert')).toContainText('not in the published inventory');
    expect(paths).toEqual([]);
    await page.route(`**${passed.path}`, async (route) => {
      const bytes = Buffer.from(
        readFileSync(`evidence/trial-library/${passed.path.split('/').at(-1)}`),
      );
      bytes[20] ^= 1;
      await route.fulfill({ body: bytes, contentType: 'application/octet-stream' });
    });
    await page.goto(review(base));
    await expect(page.getByRole('alert')).toContainText('Recording hash mismatch');
    await expect(page.locator('iframe')).toHaveCount(0);
  });

  test('keyboard selection, reduced motion and mobile layout remain usable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(review(base));
    await expect(page.getByText('Recording hash checked')).toBeVisible();
    const toggle = page.getByRole('button', { name: /Expected vs actual/ });
    await expect(toggle).toContainText('fields match');
    await toggle.focus();
    await page.keyboard.press('Space');
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await page.keyboard.press('Enter');
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle.locator('svg').last()).toHaveCSS('transition-duration', '0s');
    await page.screenshot({ path: 'artifacts/expected-result-mobile.png', fullPage: true });
    await page.getByRole('combobox', { name: 'Review task' }).focus();
    await page.keyboard.press('Space');
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(page.getByText('Recording hash checked')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('button', { name: 'Review trace', exact: true }).click();
    await page.getByRole('textbox', { name: 'Search trace' }).fill('no event contains this phrase');
    await expect(page.getByText('No events match your search.')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  });

  test('unknown versions never substitute answers and task wording caveats remain visible', async ({
    page,
  }) => {
    await page.route('**/demo/task-expectations.json', async (route) => {
      const response = await route.fetch();
      const value = await response.json();
      for (const contract of Object.values(value.contracts)) contract.backendHash = 'wrong-version';
      await route.fulfill({ json: value });
    });
    await page.goto(review(base));
    const comparison = page.getByRole('region', { name: 'Expected and actual result' });
    await expect(comparison).toContainText('Comparison unavailable for this task version');
    await expect(comparison.locator('.comparison-field')).toHaveCount(0);
    await expect(page.locator('.review-outcome')).toContainText('Task passed');
    await page.unroute('**/demo/task-expectations.json');
    await page.goto(
      review(
        base,
        catalog.trials.find((t) => t.task === 'design-handoff'),
      ),
    );
    await expect(comparison).toContainText('documented wording issue');
    await expect(comparison).toContainText('Willow');
  });
});
