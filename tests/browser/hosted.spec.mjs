import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';
import { TypeSafeRouter } from '../../runner/typesafe.mjs';

function fakeRouter(provider, key) {
  if (provider === 'typesafe')
    return new TypeSafeRouter({
      apiKey: key,
      fetchImpl: async (url, options) => {
        if (url.endsWith('/models'))
          return new Response(JSON.stringify({ models: [{ name: 'jev-latest' }] }));
        const body = JSON.parse(options.body),
          criteria = body.questions.action.criteria,
          entries = Object.entries(criteria),
          o = body.state.observation;
        const topic = 'Launch review · 15:00 UTC · Bring the final checklist';
        const field = o.elements.find((e) => e.name === 'Channel topic');
        const chosen = field
          ? field.value === topic
            ? entries.find(([, c]) => c.description === 'Click Save')
            : entries.find(([, c]) => c.action.type === 'fill' && c.action.ref === field.ref)
          : String(o.text ?? o.tree).includes(topic)
            ? entries.find(([, c]) => c.action.type === 'finish')
            : entries.find(([, c]) => c.description === 'Click Edit channel topic');
        if (!chosen) throw Error('Test candidate not available.');
        await new Promise((r) => setTimeout(r, 200));
        return new Response(
          JSON.stringify({
            model: 'fake-jev-contract-test',
            answers: {
              action: {
                type: 'choice',
                choice: chosen[0],
                confidence: 0.95,
                probabilities: Object.fromEntries(
                  entries.map(([n]) => [n, n === chosen[0] ? 1 : 0]),
                ),
              },
            },
            usage: { input_tokens: 100, output_tokens: 0 },
          }),
        );
      },
    });
  return {
    apiKey: key,
    models: async () => ({ models: [{ id: 'gpt-4o-mini' }] }),
    respond: async () => ({
      text: '{"type":"finish"}',
      usage: { inputTokens: 10, outputTokens: 5 },
      latencyMs: 1,
      requestedModel: 'gpt-4o-mini',
      returnedModel: 'fake-test-only',
    }),
  };
}
test('hosted UI: BYOK, live Jev decisions, audit, replay, private history and no key persistence', async ({
  page,
}) => {
  const server = createLiveServer({ routerFactory: fakeRouter });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'Watch the next move.' })).toBeVisible();
    await page.screenshot({ path: 'evidence/visual/relay-live.png', fullPage: true });
    await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
    await page.getByRole('button', { name: 'Jev · TypeSafe', exact: true }).click();
    await page.getByLabel('Provider API key').fill('private-test-key-for-browser');
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    await expect(page.getByLabel('Model', { exact: true })).toHaveValue('jev-latest');
    await expect(page.getByLabel('Interface', { exact: true })).toHaveValue('a11y');
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.getByText('Action probabilities', { exact: true })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByText('Task passed', { exact: true })).toBeVisible({ timeout: 20000 });
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Audit', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('verified');
    await page.getByLabel('Search audit events').fill('"kind":"input"');
    await page.locator('.audit-list button').first().click();
    await page.getByText('Exact request body', { exact: true }).click();
    await expect(page.locator('.audit-detail')).toContainText('criteria');
    await expect(page.getByRole('dialog')).not.toContainText('private-test-key-for-browser');
    await page.keyboard.press('Escape');
    await page.getByLabel('Replay step').fill('0');
    await expect(page.getByAltText('Recorded workspace')).toHaveAttribute(
      'src',
      /^data:image\/png/,
    );
    // Same-origin database is inspected only in this committed regression test.
    const stored = await page.evaluate(async () => {
      const db = await new Promise((resolve) => {
        const r = indexedDB.open('relay-history-v1');
        r.onsuccess = () => resolve(r.result);
      });
      const runs = await new Promise((resolve) => {
        const r = db.transaction('runs').objectStore('runs').getAll();
        r.onsuccess = () => resolve(r.result);
      });
      db.close();
      return JSON.stringify(runs);
    });
    expect(stored).not.toContain('private-test-key-for-browser');
    expect(stored).toContain('fake-jev-contract-test');
    expect(stored).toContain('initial.json');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Connect a key', exact: true })).toBeVisible();
    await page.getByRole('button', { name: /History/ }).click();
    await expect(page.locator('.history-row')).toHaveCount(1);
    await page.locator('.history-main').click();
    await expect(page.getByText('Task passed', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('Candidate selection');
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: 'evidence/visual/relay-live-mobile.png', fullPage: true });
    expect(errors).toEqual([]);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});
test('two hosted requests have isolated browser sessions and no shared history API', async ({
  request,
}) => {
  const server = createLiveServer({ routerFactory: fakeRouter });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const setup = await (await request.get(`${url}/api/relay?op=config`)).json();
    const config = {
      ...setup.defaults,
      provider: 'ramp',
      models: [{ id: 'gpt-4o-mini', rates: { input: 0.15, output: 0.6 } }],
      interfaces: ['a11y'],
    };
    const responses = await Promise.all(
      ['alpha-private-key', 'beta-private-key'].map((key) =>
        request.post(`${url}/api/relay?op=run`, {
          headers: { origin: url },
          data: { provider: 'ramp', key, config },
        }),
      ),
    );
    const streams = await Promise.all(
      responses.map(async (r) => {
        expect(r.status()).toBe(200);
        return (await r.text()).trim().split('\n').map(JSON.parse);
      }),
    );
    const audits = streams.map((s) => s.find((e) => e.type === 'audit')?.data);
    expect(audits.every(Boolean)).toBe(true);
    expect(audits[0].run.id).not.toBe(audits[1].run.id);
    for (const [i, audit] of audits.entries()) {
      expect(audit.integrity.status).toBe('verified');
      expect(audit.episodes[0].outcome.evaluation.success).toBe(false);
      expect(JSON.stringify(streams[i])).not.toMatch(
        /alpha-private-key|beta-private-key|\/s\/[a-f0-9]{64}/,
      );
      expect(streams[i].some((e) => e.type === 'frame')).toBe(true);
    }
    expect((await request.get(`${url}/api/relay?op=history`)).status()).toBe(404);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});
