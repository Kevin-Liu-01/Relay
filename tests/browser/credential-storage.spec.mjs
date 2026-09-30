import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';

async function serve(
  run,
  models = async (provider) => ({
    models: [{ id: provider === 'typesafe' ? 'jev-latest' : 'gpt-4o-mini' }],
  }),
) {
  const calls = [];
  const server = createLiveServer({
    routerFactory: (provider, key) => ({
      apiKey: key,
      models: async () => {
        calls.push({ provider, key });
        return models(provider, key);
      },
      respond: async () => {
        throw Error('Credential tests must never run inference.');
      },
    }),
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  try {
    await run(`http://127.0.0.1:${server.address().port}`, calls);
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}
const stored = (page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('relay-credentials-v1')));
async function enterKey(page, key) {
  await page.getByLabel('Provider API key', { exact: true }).fill(key);
  await page.getByRole('button', { name: 'Connect', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Connected', exact: true })).toBeVisible();
}

test('saved provider keys restore, prefill 1v1, forget independently and support opt-out', async ({
  page,
}) => {
  const runRequests = [];
  page.on('request', (r) => {
    if (r.url().includes('op=run')) runRequests.push(r.url());
  });
  await serve(async (url, calls) => {
    await page.goto(url);
    await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
    await expect(page.getByLabel('Remember keys on this device')).toBeChecked();
    await enterKey(page, 'fake-remembered-ramp');
    await page.getByRole('button', { name: 'Connected', exact: true }).click();
    await page.getByRole('button', { name: 'Jev · TypeSafe', exact: true }).click();
    await enterKey(page, 'fake-remembered-typesafe');
    expect((await stored(page)).keys).toEqual({
      ramp: 'fake-remembered-ramp',
      typesafe: 'fake-remembered-typesafe',
    });
    await page.reload();
    await expect(page.getByLabel('Model', { exact: true })).toHaveValue('jev-latest');
    expect(calls.at(-1)).toEqual({ provider: 'typesafe', key: 'fake-remembered-typesafe' });
    await page.getByRole('button', { name: '1v1', exact: true }).click();
    await expect(page.getByLabel('API key A', { exact: true })).toHaveValue(
      'fake-remembered-typesafe',
    );
    await page.getByLabel('Provider B', { exact: true }).selectOption('ramp');
    await expect(page.getByLabel('API key B', { exact: true })).toHaveValue('fake-remembered-ramp');
    await expect(page.getByLabel('API key B', { exact: true })).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Forget key A', exact: true }).click();
    await expect(page.getByLabel('API key A', { exact: true })).toHaveValue('');
    expect((await stored(page)).keys).toEqual({ ramp: 'fake-remembered-ramp', typesafe: '' });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
    await page.getByRole('button', { name: 'Ramp Router', exact: true }).click();
    await expect(page.getByLabel('Provider API key')).toHaveValue('fake-remembered-ramp');
    await page.getByLabel('Remember keys on this device').uncheck();
    expect((await stored(page)).keys).toEqual({ ramp: '', typesafe: '' });
    await enterKey(page, 'fake-memory-only-key');
    expect((await stored(page)).remember).toBe(false);
    expect(JSON.stringify(await stored(page))).not.toContain('fake-');
    await page.reload();
    await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
    await expect(page.getByLabel('Provider API key')).toHaveValue('');
    await expect(page.getByLabel('Remember keys on this device')).not.toBeChecked();
    expect(runRequests).toEqual([]);
  });
});

test('failed, corrupt and revoked credentials never silently reconnect or save a replacement', async ({
  page,
}) => {
  await serve(
    async (url, calls) => {
      await page.goto(url);
      await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
      await page.getByLabel('Provider API key').fill('fake-invalid-key');
      await page.getByRole('button', { name: 'Connect', exact: true }).click();
      await expect(page.getByRole('alert')).toContainText('Credential rejected');
      expect(await stored(page)).toBeNull();
      await page.evaluate(() => localStorage.setItem('relay-credentials-v1', '{broken'));
      await page.reload();
      await expect(page.getByRole('button', { name: 'Connect a key', exact: true })).toBeVisible();
      expect(calls).toHaveLength(1);
      await page.evaluate(() =>
        localStorage.setItem(
          'relay-credentials-v1',
          JSON.stringify({
            version: 1,
            provider: 'ramp',
            remember: true,
            keys: { ramp: 'fake-revoked-key', typesafe: '' },
          }),
        ),
      );
      await page.reload();
      await expect(page.getByRole('alert')).toContainText('Saved key could not reconnect');
      expect(calls).toHaveLength(2);
      await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
      await expect(page.getByLabel('Provider API key')).toHaveValue('fake-revoked-key');
      await page.getByRole('button', { name: 'Forget key', exact: true }).click();
      expect(await stored(page)).toBeNull();
      await page.reload();
      await expect(page.getByRole('button', { name: 'Connect a key', exact: true })).toBeVisible();
      expect(calls).toHaveLength(2);
    },
    async () => {
      throw Error('Credential rejected');
    },
  );
});

test('blocked local storage allows an in-memory connection and shows the persistence failure', async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked by browser', 'SecurityError');
      },
    }),
  );
  await serve(async (url) => {
    await page.goto(url);
    await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
    await enterKey(page, 'fake-private-memory-key');
    await expect(page.getByLabel('Model', { exact: true })).toHaveValue('gpt-4o-mini');
    await expect(page.getByRole('alert')).toContainText('key could not be saved');
    await expect(page.getByRole('alert')).not.toContainText('fake-private-memory-key');
    await page.getByRole('button', { name: 'Connected', exact: true }).click();
    await page.getByRole('button', { name: 'Forget key', exact: true }).click();
    await expect(page.getByLabel('Provider API key')).toHaveValue('');
    await expect(page.getByRole('alert')).toContainText('saved copy could not be removed');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Connect a key', exact: true })).toBeVisible();
  });
});

test('forget during connection cancels the late response so it cannot restore or persist the key', async ({
  page,
}) => {
  let release, started;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const began = new Promise((resolve) => {
    started = resolve;
  });
  await serve(
    async (url, calls) => {
      try {
        await page.goto(url);
        await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
        await page.getByLabel('Provider API key').fill('fake-forgotten-key');
        await page.getByRole('button', { name: 'Connect', exact: true }).click();
        await began;
        await page.getByRole('button', { name: 'Forget key', exact: true }).click();
        release();
        await enterKey(page, 'fake-replacement-key');
        expect((await stored(page)).keys.ramp).toBe('fake-replacement-key');
        expect(JSON.stringify(await stored(page))).not.toContain('fake-forgotten-key');
        await page.reload();
        await expect(page.getByRole('button', { name: 'Connected', exact: true })).toBeVisible();
        expect(calls.at(-1).key).toBe('fake-replacement-key');
      } finally {
        release();
      }
    },
    async (_provider, key) => {
      if (key === 'fake-forgotten-key') {
        started();
        await gate;
      }
      return { models: [{ id: 'gpt-4o-mini' }] };
    },
  );
});
