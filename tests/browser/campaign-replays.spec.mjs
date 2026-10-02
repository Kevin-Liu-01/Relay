import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';

test('published campaign replays show real pass/failure evidence with no inference or actor writes', async ({
  page,
}) => {
  const server = createLiveServer({
    routerFactory: () => {
      throw Error('Replay must not call a provider.');
    },
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const writes = [],
    errors = [];
  page.on('request', (r) => {
    if (r.method() !== 'GET') writes.push(r.url());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByRole('button', { name: 'Replays', exact: true }).click();
    await page.getByRole('button', { name: /GPT-6 Luna · thread reply passed/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Replay studio' });
    await dialog.getByRole('slider', { name: 'Playback position' }).fill('4');
    await expect(dialog).toContainText('Task passed');
    const frame = page.frameLocator('iframe[title="Recorded Slack workspace"]');
    await expect
      .poll(() =>
        frame
          .locator('img[data-avatar]')
          .evaluateAll(
            (images) =>
              new Set(
                images
                  .filter((image) => image.complete && image.naturalWidth === 256)
                  .map((image) => image.dataset.avatar),
              ).size,
          ),
      )
      .toBe(6);
    await expect(
      frame.getByText('QA checklist complete. Ready for review.', { exact: true }),
    ).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Replays', exact: true }).click();
    await page.getByRole('button', { name: /GPT-6 Luna · decision record incomplete/ }).click();
    await dialog.getByRole('slider', { name: 'Playback position' }).fill('17');
    await expect(dialog).toContainText('Task incomplete');
    await expect(
      frame.getByText('Decision recorded: DESIGN navigation.', { exact: true }),
    ).toBeVisible();
    expect(writes).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});
