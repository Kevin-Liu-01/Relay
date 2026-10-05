import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { once } from 'node:events';
import { gunzipSync } from 'node:zlib';
import { createLiveServer } from '../../hosted/local.mjs';

const catalog = JSON.parse(readFileSync('evidence/trial-library/catalog.json'));
const review = (base, item) =>
  `${base}/demo/review.html?${new URLSearchParams({ trial: item.id, view: 'replay' })}`;
// Focused review tests retain traces and screenshots. Avoid a second, redundant
// video/DOM recording of every published agent frame during the inventory sweep.
test.use({ trace: 'off', video: 'off' });
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

test('every published trial opens and renders its final captured workspace without inference', async ({
  page,
}, testInfo) => {
  test.setTimeout(240000);
  const errors = [],
    apiCalls = [],
    checked = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    if (/\/api\//.test(request.url())) apiCalls.push(request.url());
  });
  await page.goto(review(base, catalog.trials[0]));
  for (let i = 0; i < catalog.trials.length; i++) {
    const item = catalog.trials[i];
    await expect(page.locator('.review-card')).toHaveAttribute('data-trial-id', item.id);
    await expect(page.getByText('Recording hash checked')).toBeVisible();
    const data = JSON.parse(
      gunzipSync(readFileSync(`evidence/trial-library/${item.path.split('/').at(-1)}`)),
    );
    const frames = data.events.filter(({ event }) => event.replay?.version === 1);
    const snapshot = (item.actionAttempts ? frames.at(-1) : frames[0]).event.replay;
    if (item.actionAttempts) {
      await page.getByRole('slider', { name: 'Playback position' }).fill(String(frames.length - 1));
      await expect(page.locator('.replay-action')).toContainText('Final workspace');
    } else await expect(page.getByRole('heading', { name: 'No actions recorded' })).toBeVisible();
    const comparison = page.getByRole('region', { name: 'Expected and actual result' });
    await expect(comparison).toContainText('Expected final');
    if (item.outcome === 'passed')
      await expect(comparison.locator('.comparison-field:not([data-status="match"])')).toHaveCount(
        0,
      );
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
    checked.push({
      id: item.id,
      outcome: item.outcome,
      frames: frames.length,
      rendered: true,
      archiveSha256: item.archiveSha256,
    });
    if (i + 1 < catalog.trials.length)
      await page.getByRole('button', { name: 'Next trial', exact: true }).click();
  }
  expect(checked).toHaveLength(catalog.attempted);
  expect(errors).toEqual([]);
  expect(apiCalls).toEqual([]);
  await testInfo.attach('replay-coverage.json', {
    body: JSON.stringify({
      evidenceKind: 'recorded-trial-replay-render-check',
      summaryHash: catalog.summaryHash,
      note: 'Software playback verification, not additional model inference. Zero-action trials render their first captured workspace.',
      checked,
    }),
    contentType: 'application/json',
  });
});
