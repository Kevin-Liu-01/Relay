import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { episodeOutcome } from '../../shared/run-outcome.mjs';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';

const catalog = JSON.parse(readFileSync('evidence/interface-repeat-trial-library/catalog.json'));
const url = (base, trial, view = 'replay') =>
  `${base}/demo/review.html?${new URLSearchParams({ study: 'repeat', trial: trial.id, view })}`;
// The sweep inspects full pixel inputs. Avoid copying every request into
// a second DOM trace/video while the original archives remain preserved.
test.use({ trace: 'off', video: 'off' });
test.describe('repeated interface review', () => {
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
  test('follow-up table shows derived times, costs and both-repeat access without replacing historical results', async ({
    page,
  }, testInfo) => {
    await page.goto(`${base}/presentation#interpreting-interface-results`);
    await expect(page.locator('.slide.active h2')).toHaveText(
      'I repeated the comparison on three workflows',
    );
    await expect(page.locator('.slide')).toHaveCount(20);
    const table = page.locator('#interface-repeat-results');
    await expect(table.locator('tbody tr')).toHaveCount(2);
    const median = (rows) => {
      const v = rows.map((r) => r.durationMs / 1000).sort((a, b) => a - b);
      return v.length
        ? `${((v[Math.floor((v.length - 1) / 2)] + v[Math.floor(v.length / 2)]) / 2).toFixed(1)} s`
        : 'N/A';
    };
    const models = ['gpt-6.1-sol', 'claude-sonnet-5-5'];
    for (const [i, model] of models.entries())
      for (const [j, mode] of ['a11y', 'json-ui', 'pixels', 'api'].entries()) {
        const rows = catalog.trials.filter((r) => r.model === model && r.interface === mode);
        const cell = table.locator('tbody tr').nth(i).locator('td').nth(j);
        await expect(cell.locator('strong')).toHaveText(
          `${rows.filter((r) => r.outcome === 'passed').length} / 6`,
        );
        await expect(cell.locator('[data-time="all"]')).toHaveText(median(rows));
        await expect(cell.locator('[data-time="passed"]')).toHaveText(
          median(rows.filter((r) => r.outcome === 'passed')),
        );
        await expect(cell.locator('a')).toHaveAttribute('href', /study=repeat/);
      }
    await table.getByRole('button', { name: /^Allowance/ }).click();
    await expect(page.locator('#repeat-sort-status')).toContainText('Allowance, ascending');
    await expect(page.locator('.slide.active')).toContainText('$8.9677 of $25');
    await page.screenshot({ path: testInfo.outputPath('repeat-slide.png'), fullPage: true });
    await page.goto(`${base}/results`);
    await expect(page.locator('#model-results tbody tr')).toHaveCount(17);
    await expect(page.locator('#interface-repeat-results')).toBeVisible();
    await page.locator('.repeat-trial-details summary').click();
    await expect(page.locator('#repeat-task-results tbody tr')).toHaveCount(24);
    await expect(page.locator('#repeat-task-results a[href*="view=replay"]')).toHaveCount(48);
    await expect(page.locator('#repeat-task-results a[href*="view=trace"]')).toHaveCount(48);
  });
  test('switching interfaces preserves task and model and never calls a provider', async ({
    page,
  }) => {
    const first = catalog.trials.find(
      (r) => r.interface === 'a11y' && r.task === 'thread-reply' && r.repetition === 2,
    );
    const urls = [];
    page.on('request', (request) => urls.push(request.url()));
    await page.goto(url(base, first));
    await expect(page.getByText('Recording hash checked')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Review the 48-run follow-up' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Review interface', exact: true }).click();
    await page.getByRole('option', { name: 'Pixels', exact: true }).click();
    const pixel = catalog.trials.find(
      (r) =>
        r.model === first.model &&
        r.task === first.task &&
        r.interface === 'pixels' &&
        r.repetition === first.repetition,
    );
    await expect(page.locator('.review-card')).toHaveAttribute('data-trial-id', pixel.id);
    await expect(page.getByText('Recording hash checked')).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Review repeat', exact: true })).toContainText(
      'Repeat 2',
    );
    await page.getByRole('combobox', { name: 'Review repeat', exact: true }).click();
    await page.getByRole('option', { name: 'Repeat 1', exact: true }).click();
    const rep1 = catalog.trials.find(
      (r) =>
        r.model === first.model &&
        r.task === first.task &&
        r.interface === 'pixels' &&
        r.repetition === 1,
    );
    await expect(page.locator('.review-card')).toHaveAttribute('data-trial-id', rep1.id);
    await page.getByRole('button', { name: 'Review trace', exact: true }).click();
    await expect(page).toHaveURL(/study=repeat/);
    await page.reload();
    await expect(page.locator('.review-card')).toHaveAttribute('data-trial-id', rep1.id);
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
          readFileSync(`evidence/interface-repeat-trial-library/${trial.path.split('/').at(-1)}`),
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
    expect(checked).toHaveLength(48);
    await testInfo.attach('interface-repeat-replay-coverage.json', {
      body: JSON.stringify({ summaryHash: catalog.summaryHash, checked }),
      contentType: 'application/json',
    });
  });
});
