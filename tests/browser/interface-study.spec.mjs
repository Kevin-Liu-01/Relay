import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { episodeOutcome } from '../../shared/run-outcome.mjs';
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
  test('every published study recording renders its final workspace and exact outcome', async ({
    page,
  }, testInfo) => {
    test.setTimeout(240000);
    const errors = [],
      apiCalls = [],
      checked = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('request', (r) => {
      if (r.url().includes('/api/')) apiCalls.push(r.url());
    });
    await page.goto(url(base, catalog.trials[0]));
    for (const trial of catalog.trials) {
      await expect(page.locator('.review-card')).toHaveAttribute('data-trial-id', trial.id);
      await expect(page.getByText('Recording hash checked')).toBeVisible();
      const record = JSON.parse(
        gunzipSync(
          readFileSync(`evidence/interface-trial-library/${trial.path.split('/').at(-1)}`),
        ),
      );
      await expect(page.locator('.review-outcome')).toContainText(
        episodeOutcome(record.run.episodes[0]).title,
      );
      const frames = record.events.filter(({ event }) => event.replay?.version === 1);
      const snapshot = (trial.actionAttempts ? frames.at(-1) : frames[0]).event.replay;
      if (trial.actionAttempts) {
        await page
          .getByRole('slider', { name: 'Playback position' })
          .fill(String(frames.length - 1));
        await expect(page.locator('.replay-action')).toContainText('Final workspace');
      } else await expect(page.getByRole('heading', { name: 'No actions recorded' })).toBeVisible();
      const comparison = page.getByRole('region', { name: 'Expected and actual result' });
      await expect(comparison).toContainText('Expected final');
      if (trial.outcome === 'passed')
        await expect(
          comparison.locator('.comparison-field:not([data-status="match"])'),
        ).toHaveCount(0);
      const workspace = page.frameLocator('iframe[title="Recorded Slack workspace"]');
      await expect(workspace.locator('#root')).toHaveAttribute('inert', '');
      const view = snapshot.ui.view ?? 'channel';
      const channel =
        snapshot.data.state.channels.find((c) => c.id === snapshot.ui.channelId) ??
        snapshot.data.state.channels[0];
      const heading = ['channel', 'pins'].includes(view)
        ? channel.name
        : ({ search: 'Search results', dms: 'Direct messages', saved: 'Later' }[view] ?? 'Threads');
      await expect(workspace.locator('.channel-header h1')).toHaveText(heading);
      if (['channel', 'pins'].includes(view))
        await expect(workspace.locator('.topic-preview')).toHaveText(channel.topic);
      checked.push({ id: trial.id, outcome: trial.outcome, frames: frames.length, rendered: true });
      if (trial !== catalog.trials.at(-1))
        await page.getByRole('button', { name: 'Next trial', exact: true }).click();
    }
    expect(errors).toEqual([]);
    expect(apiCalls).toEqual([]);
    expect(checked).toHaveLength(96);
    await testInfo.attach('interface-replay-coverage.json', {
      body: JSON.stringify({ summaryHash: catalog.summaryHash, checked }),
      contentType: 'application/json',
    });
  });
});
