import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';
import { expectNorthstarBrand } from './brand-assertions.mjs';

async function withSandbox(fn) {
  let providerCalls = 0;
  const server = createLiveServer({
    routerFactory: () => {
      providerCalls++;
      throw Error('Sandbox must not call a provider.');
    },
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await fn(`http://127.0.0.1:${server.address().port}`);
    expect(providerCalls).toBe(0);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
}

test('no-key Try Slack opens a usable workspace: send, edit, thread, search, DM, topic and reset', async ({
  page,
}) => {
  await withSandbox(async (url) => {
    await page.goto(url);
    const next = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'Try Slack', exact: true }).click();
    const slack = await next;
    const apiCalls = [],
      errors = [];
    slack.on('request', (r) => {
      if (new URL(r.url()).pathname.startsWith('/api/')) apiCalls.push(r.url());
    });
    slack.on('pageerror', (e) => errors.push(e.message));
    await expect(slack.getByRole('heading', { name: 'proj-meridian', exact: true })).toBeVisible();
    await expectNorthstarBrand(slack);
    await expect
      .poll(() =>
        slack
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
    await expect(slack.getByText('resets on refresh', { exact: false })).toBeVisible();
    const composer = slack.getByRole('textbox', { name: 'Message #proj-meridian', exact: true });
    await composer.fill('Trying Slack by hand');
    await composer.press('Enter');
    let row = slack.getByRole('article', {
      name: 'Message from Alex Morgan: Trying Slack by hand',
      exact: true,
    });
    await expect(row).toBeVisible();
    await composer.press('ArrowUp');
    await slack.getByRole('textbox', { name: 'Edit message', exact: true }).fill('Updated by hand');
    await slack.getByRole('button', { name: 'Save changes', exact: true }).click();
    row = slack.getByRole('article', {
      name: 'Message from Alex Morgan: Updated by hand',
      exact: true,
    });
    await row.hover();
    await row.getByRole('button', { name: 'Save message for later', exact: true }).click();
    await row.getByRole('button', { name: "React to Alex Morgan's message", exact: true }).click();
    await slack.getByRole('button', { name: 'React ✅', exact: true }).click();
    await expect(row.getByRole('button', { name: '✅ reaction, 1, selected' })).toBeVisible();
    await row.hover();
    await row
      .getByRole('button', { name: "More actions for Alex Morgan's message", exact: true })
      .click();
    await slack.getByRole('menuitem', { name: 'Pin to this conversation' }).click();
    await expect(row.getByText('Pinned to this conversation')).toBeVisible();
    await row.hover();
    await row.getByRole('button', { name: /^Reply to/ }).click();
    const reply = slack.getByRole('textbox', { name: 'Reply in thread', exact: true });
    await reply.fill('My sandbox reply');
    await reply.press('Enter');
    await expect(
      slack.getByRole('article', {
        name: 'Message from Alex Morgan: My sandbox reply',
        exact: true,
      }),
    ).toBeVisible();
    const search = slack.getByRole('textbox', { name: 'Search Northstar' });
    await search.fill('from:me "Updated by hand"');
    await search.press('Enter');
    await expect(slack.locator('.search-summary')).toContainText('1 results for');
    await slack.getByRole('button', { name: 'Direct message Sam Rivera', exact: true }).click();
    const dm = slack.getByRole('textbox', { name: 'Message Sam Rivera', exact: true });
    await dm.fill('Just my local sandbox');
    await dm.press('Enter');
    await expect(
      slack.getByRole('article', {
        name: 'Message from Alex Morgan: Just my local sandbox',
        exact: true,
      }),
    ).toBeVisible();
    await slack.getByRole('button', { name: 'Channel proj-meridian', exact: true }).click();
    await slack.getByRole('button', { name: 'Edit channel topic', exact: true }).click();
    await slack
      .getByRole('textbox', { name: 'Channel topic', exact: true })
      .fill('My hands-on workspace');
    await slack.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(slack.getByText('My hands-on workspace', { exact: true })).toBeVisible();
    await slack.getByRole('button', { name: 'Channel details', exact: true }).click();
    await slack.getByRole('textbox', { name: 'Channel description' }).fill('Edited by a person');
    await slack.getByRole('button', { name: 'Save description', exact: true }).click();
    await expect(slack.getByRole('dialog')).toHaveCount(0);
    await slack.getByRole('button', { name: 'Later', exact: true }).click();
    await expect(slack.getByRole('article', { name: /Updated by hand/ })).toBeVisible();
    await slack.screenshot({ path: 'evidence/visual/relay-hands-on.png', fullPage: true });
    await slack.getByRole('button', { name: 'Reset workspace', exact: true }).click();
    await expect(slack.getByRole('heading', { name: 'proj-meridian', exact: true })).toBeVisible();
    await expect(slack.getByRole('article', { name: /Updated by hand/ })).toHaveCount(0);
    await expect(slack.getByText('My hands-on workspace', { exact: true })).toHaveCount(0);
    expect(apiCalls).toEqual([]);
    expect(errors).toEqual([]);
    await slack.close();
  });
});

test('hands-on tabs stay separate; reset and narrow screens never affect another tab', async ({
  page,
  context,
}) => {
  await withSandbox(async (url) => {
    const sibling = await context.newPage();
    await page.goto(`${url}/play`);
    await sibling.goto(`${url}/play.html`);
    const box = page.getByRole('textbox', { name: 'Message #proj-meridian', exact: true });
    await box.fill('Only in the first tab');
    await box.press('Enter');
    await expect(page.getByRole('article', { name: /Only in the first tab/ })).toBeVisible();
    await expect(
      sibling.getByRole('textbox', { name: 'Message #proj-meridian', exact: true }),
    ).toBeVisible();
    await expect(sibling.getByRole('article', { name: /Only in the first tab/ })).toHaveCount(0);
    await sibling.getByRole('button', { name: 'Reset workspace' }).click();
    await expect(page.getByRole('article', { name: /Only in the first tab/ })).toBeVisible();
    await page.setViewportSize({ width: 375, height: 844 });
    await expect(page.getByRole('link', { name: 'Back to Relay' })).toBeInViewport();
    await expect(page.getByRole('button', { name: 'Reset workspace' })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(await page.locator('#root').evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(
      true,
    );
    await page.screenshot({ path: 'evidence/visual/relay-hands-on-mobile.png', fullPage: true });
    await sibling.close();
  });
});
