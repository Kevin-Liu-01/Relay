import { test, expect } from '@playwright/test';
import { once } from 'node:events';
import { createLiveServer } from '../../hosted/local.mjs';
import { TypeSafeRouter } from '../../runner/typesafe.mjs';
import { expectRelayBrand } from './brand-assertions.mjs';
import { testPricing } from '../fixtures/pricing.mjs';

async function expectFullWidthWorkspace(page) {
  const frame = page.locator('.viewport > img');
  await expect(frame).toBeVisible();
  await expect.poll(() => frame.evaluate((el) => el.complete && el.naturalWidth > 0)).toBe(true);
  const geometry = await frame.evaluate((el) => {
    const image = el.getBoundingClientRect(),
      stage = el.parentElement.getBoundingClientRect();
    return {
      left: image.left - stage.left,
      right: stage.right - image.right,
      top: image.top - stage.top,
      bottom: stage.bottom - image.bottom,
      ratio: image.width / image.height,
      naturalRatio: el.naturalWidth / el.naturalHeight,
    };
  });
  for (const side of ['left', 'right', 'top', 'bottom'])
    expect(Math.abs(geometry[side])).toBeLessThan(1);
  expect(geometry.ratio).toBeCloseTo(geometry.naturalRatio, 3);
  expect(geometry.naturalRatio).toBeCloseTo(1.6, 3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

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
test('hosted UI: BYOK, live Jev decisions, audit, replay, remembered connection and key-free history', async ({
  page,
  request,
}) => {
  const server = createLiveServer({ routerFactory: fakeRouter, pricingResolver: testPricing });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  const errors = [];
  const runRequests = [];
  page.on('request', (r) => {
    if (r.url().includes('/api/relay?op=run')) runRequests.push(r.url());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'Try out Computer Use' })).toBeVisible();
    await expect(page.locator('.welcome-accent')).toHaveText('Computer Use');
    await expect(page.locator('.welcome-accent')).toHaveCSS('color', 'rgb(98, 65, 111)');
    await expect(page.locator('.welcome-accent')).toHaveCSS('white-space', 'nowrap');
    await expect(page.getByRole('heading', { name: 'Try out Computer Use' })).toHaveCSS(
      'color',
      'rgb(40, 38, 44)',
    );
    await expect(page.getByText('SLACK / COMPUTER USE', { exact: true })).toHaveCount(0);
    await expect(page.getByRole('heading', { name: 'Waiting for a decision' })).toHaveCSS(
      'font-size',
      '13px',
    );
    expect(
      (await page.getByRole('region', { name: 'Current action', exact: true }).boundingBox())
        .height,
    ).toBeLessThan(65);
    expect(
      (await page.locator('.decision-panel .model-heading').boundingBox()).height,
    ).toBeLessThan(45);
    await expectRelayBrand(page, request);
    await page.evaluate(() => document.fonts.ready);
    const loadedCamberWeights = await page.evaluate(() =>
      [...document.fonts]
        .filter((face) => face.family === 'Relay Camber' && face.status === 'loaded')
        .map((face) => face.weight),
    );
    expect(loadedCamberWeights).toEqual(expect.arrayContaining(['400', '700']));
    await expect(page.getByRole('heading', { name: 'Try out Computer Use' })).toHaveCSS(
      'font-family',
      /^"?Relay Camber"?,/,
    );
    await expect(page.getByRole('button', { name: 'Connect a key', exact: true })).toHaveCSS(
      'font-family',
      /^"?Relay Camber"?,/,
    );
    const headingTracking = await page
      .getByRole('heading', { name: 'Try out Computer Use' })
      .evaluate((el) => getComputedStyle(el).letterSpacing);
    expect(parseFloat(headingTracking)).toBeGreaterThan(0);
    await page.screenshot({ path: 'evidence/visual/relay-live.png', fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await expect(page.getByRole('heading', { name: 'Try out Computer Use' })).toBeInViewport();
    await page.screenshot({ path: 'evidence/visual/relay-welcome-mobile.png', fullPage: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: 'Connect a key', exact: true }).click();
    await page.getByRole('button', { name: 'Jev · TypeSafe', exact: true }).click();
    await page.getByLabel('Provider API key').fill('private-test-key-for-browser');
    await page.getByRole('button', { name: 'Connect', exact: true }).click();
    await expect(page.getByRole('combobox', { name: 'Model', exact: true })).toHaveText(
      'jev-latest',
    );
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('relay-credentials-v1')).keys.typesafe,
      ),
    ).toBe('private-test-key-for-browser');
    await expect(page.getByRole('combobox', { name: 'Interface', exact: true })).toHaveText(
      'Accessibility',
    );
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.getByText('Action probabilities', { exact: true })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole('heading', { name: 'Task passed', exact: true })).toBeVisible({
      timeout: 20000,
    });
    await expect(page.getByRole('region', { name: 'Current action', exact: true })).toHaveCount(0);
    await expect(page.locator('.workspace-top [role="status"]')).toHaveText('Task passed');
    await expect(page.getByRole('button', { name: 'Run', exact: true })).toBeVisible();
    for (const size of [
      { width: 1920, height: 1080 },
      { width: 1440, height: 900 },
      { width: 800, height: 900 },
    ]) {
      await page.setViewportSize(size);
      await expectFullWidthWorkspace(page);
      await page
        .getByRole('button', { name: 'Inspect the evidence', exact: true })
        .scrollIntoViewIfNeeded();
      await expect(
        page.getByRole('button', { name: 'Inspect the evidence', exact: true }),
      ).toBeInViewport();
      expect(
        await page.locator('.options-list').evaluate((el) => el.clientHeight),
      ).toBeGreaterThanOrEqual(85);
      if (size.width === 1920)
        await page.screenshot({
          path: 'evidence/visual/relay-full-width-desktop.png',
          fullPage: true,
        });
    }
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.getByRole('button', { name: 'Expand workspace', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Exit workspace focus' })).toBeFocused();
    await expect(page.locator('.decision-panel')).toBeHidden();
    await expect(page.getByLabel('Replay step')).toBeInViewport();
    const focusedGeometry = await page.locator('.viewport').boundingBox();
    expect(focusedGeometry.width).toBeGreaterThan(1400);
    expect(focusedGeometry.height).toBeLessThan(900);
    await page.screenshot({ path: 'evidence/visual/relay-workspace-focus.png', fullPage: true });
    await page.keyboard.press('Escape');
    await expect(page.locator('.decision-panel')).toBeVisible();
    // New captures are observer-only, and restore actual application state in an inert frame.
    await page.getByRole('button', { name: 'Play the run', exact: false }).click();
    const replay = page.getByRole('dialog', { name: 'Replay studio' });
    const workspace = page.frameLocator('iframe[title="Recorded Slack workspace"]');
    await expect(workspace.locator('#root')).toHaveAttribute('inert', '');
    await expect(workspace.locator('link[rel="icon"][type="image/svg+xml"]')).toHaveAttribute(
      'href',
      await page.locator('link[rel="icon"][type="image/svg+xml"]').getAttribute('href'),
    );
    await expect(workspace.locator('#root')).toHaveCSS('font-family', /^"?Slack-Lato"?,/);
    await page.getByRole('button', { name: 'Next action', exact: true }).click();
    await expect(workspace.locator('textarea[aria-label="Channel topic"]')).toHaveValue(/Building/);
    await expect(replay.locator('.agent-cursor')).toHaveAttribute('data-source', 'browser-event');
    await expect(replay.locator('.agent-cursor')).toHaveCSS('transition-duration', '0s');
    await page.getByRole('button', { name: 'Next action', exact: true }).click();
    await expect(workspace.locator('textarea[aria-label="Channel topic"]')).toHaveValue(
      'Launch review · 15:00 UTC · Bring the final checklist',
    );
    expect(await replay.evaluate((el) => el.scrollHeight <= el.clientHeight + 2)).toBe(true);
    await page.screenshot({ path: 'evidence/visual/relay-replay.png', fullPage: true });
    await page.getByLabel('Playback position').fill('4');
    await expect(replay).toContainText('Task passed');
    await page.keyboard.press('Escape');
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
    await expect(page.getByAltText('Recorded workspace')).toHaveJSProperty('naturalWidth', 1440);
    await expect(page.getByAltText('Recorded workspace')).toHaveJSProperty('naturalHeight', 900);
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
    const parsed = JSON.parse(stored)[0];
    const pointers = parsed.events.filter((e) => e.event.kind === 'pointer');
    expect(pointers.length).toBeGreaterThanOrEqual(4);
    expect(pointers.some((e) => e.event.pointer.type === 'pointerdown')).toBe(true);
    expect(pointers.every((e) => e.event.pointer.source === 'browser-event')).toBe(true);
    expect(JSON.stringify(parsed.audit.episodes[0].inputs)).not.toContain('__relayObservePointer');
    expect(parsed.run.episodes[0].captureWarnings ?? []).toEqual([]);
    expect(parsed.events.filter((e) => e.event.replay).length).toBe(5);
    expect(JSON.stringify(parsed.audit.episodes[0].inputs)).not.toContain('__relayCapture');
    expect(JSON.stringify(parsed.audit.episodes[0].inputs)).not.toContain('"replay"');
    await page.reload();
    await expect(page.getByRole('button', { name: 'Connected', exact: true })).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Model', exact: true })).toHaveText(
      'jev-latest',
    );
    expect(runRequests).toHaveLength(1); // Reload only discovers models, never starts inference.
    await page.getByRole('button', { name: 'Connected', exact: true }).click();
    await expect(page.getByLabel('Provider API key')).toHaveAttribute('type', 'password');
    await expect(page.getByLabel('Provider API key')).toHaveValue('private-test-key-for-browser');
    await page.getByRole('button', { name: 'Forget key', exact: true }).click();
    await expect(page.getByLabel('Provider API key')).toHaveValue('');
    expect(await page.evaluate(() => localStorage.getItem('relay-credentials-v1'))).toBeNull();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Connect a key', exact: true })).toBeVisible();
    await page.getByRole('button', { name: /History/ }).click();
    await expect(page.locator('.history-row')).toHaveCount(1);
    await page.locator('.history-main').click();
    await expect(page.getByRole('heading', { name: 'Task passed', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Compare', exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText('Candidate selection');
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: 'evidence/visual/relay-live-mobile.png', fullPage: true });
    await expectFullWidthWorkspace(page);
    expect(errors).toEqual([]);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});

test('no-key replay: real UI, play/pause/seek, no run requests, legacy fallback and reduced motion', async ({
  page,
}) => {
  const server = createLiveServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  const requests = [];
  page.on('request', (r) => requests.push({ url: r.url(), method: r.method() }));
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(url);
    await page.getByRole('button', { name: 'Watch a replay', exact: true }).click();
    await page.getByRole('button', { name: /Watch a topic update/ }).click();
    const dialog = page.getByRole('dialog', { name: 'Replay studio' });
    await expect(dialog).toContainText('Reference script · not model inference');
    await page.getByRole('button', { name: 'Next action', exact: true }).click();
    const frame = page.frameLocator('iframe[title="Recorded Slack workspace"]');
    await expect(frame.locator('textarea[aria-label="Channel topic"]')).toHaveValue(/Building/);
    await page.getByRole('button', { name: 'Next action', exact: true }).click();
    await expect(frame.locator('textarea[aria-label="Channel topic"]')).toHaveValue(
      /Launch review/,
    );
    await page.getByRole('button', { name: 'Previous action', exact: true }).click();
    await expect(frame.locator('textarea[aria-label="Channel topic"]')).toHaveValue(/Building/);
    await dialog.getByRole('button', { name: 'Play replay', exact: true }).click();
    await expect(page.getByLabel('Playback position')).toHaveValue('2', { timeout: 5000 });
    await page.getByRole('button', { name: 'Pause replay', exact: true }).click();
    await page.getByRole('button', { name: 'Restart replay', exact: true }).click();
    await expect(page.getByLabel('Playback position')).toHaveValue('0');
    await expect(dialog.getByRole('combobox', { name: 'Playback timing' })).toContainText(
      'Smart pace',
    );
    await page.getByRole('button', { name: 'Expand replay' }).click();
    await expect(page.getByRole('button', { name: 'Exit replay focus' })).toBeVisible();
    await page.getByRole('combobox', { name: 'Playback timing' }).click();
    await page.getByRole('option', { name: 'Recorded timing', exact: true }).click();
    await expect(dialog).toContainText('Original capture intervals');
    await page.getByRole('button', { name: 'Exit replay focus' }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.getByRole('button', { name: 'Next action', exact: true }).click();
    await expect(dialog.locator('.agent-cursor')).toHaveCSS('transition-duration', '0s');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(await dialog.evaluate((el) => getComputedStyle(el).animationName)).toBe('none');
    await page.screenshot({ path: 'evidence/visual/relay-replay-mobile.png', fullPage: true });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Replays', exact: true }).click();
    await page.getByRole('button', { name: /GPT-4o mini · an incomplete browser run/ }).click();
    await expect(dialog).toContainText('UI position not recorded');
    await page.getByRole('button', { name: 'Next action', exact: true }).click();
    await expect(dialog).toContainText('Legacy screenshot');
    expect(
      requests.filter(
        (r) => r.method !== 'GET' || r.url.includes('/api/state') || r.url.includes('/api/demo'),
      ),
    ).toEqual([]);
    expect(errors).toEqual([]);
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});

test('1v1: concurrent matched systems, separate history, visible outcome and replay', async ({
  page,
}) => {
  const server = createLiveServer({ routerFactory: fakeRouter, pricingResolver: testPricing });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    await page.goto(url);
    await page.getByRole('button', { name: '1v1', exact: true }).click();
    const arena = page.getByRole('dialog', { name: '1v1 arena' });
    await page.getByRole('combobox', { name: 'Provider A', exact: true }).click();
    await page.getByRole('option', { name: 'Jev · TypeSafe', exact: true }).click();
    await page.getByLabel('API key A', { exact: true }).fill('arena-fake-a');
    await page
      .getByRole('region', { name: 'Model A', exact: true })
      .getByRole('button', { name: 'Connect', exact: true })
      .click();
    await expect(page.getByRole('combobox', { name: 'Model A', exact: true })).toHaveText(
      'jev-latest',
    );
    await page.getByLabel('API key B', { exact: true }).fill('arena-fake-b');
    await page
      .getByRole('region', { name: 'Model B', exact: true })
      .getByRole('button', { name: 'Connect', exact: true })
      .click();
    await expect(page.getByRole('combobox', { name: 'Model B', exact: true })).toHaveText(
      'gpt-4o-mini',
    );
    const openaiMark = page
      .getByRole('region', { name: 'Model B', exact: true })
      .locator('header .model-mark path')
      .first();
    expect(await openaiMark.evaluate((el) => getComputedStyle(el).fill)).not.toBe(
      'rgb(255, 255, 255)',
    );
    await expect(arena.locator('.model-price').last()).toContainText('$0.15 in · $0.6 out');
    await page.getByRole('button', { name: 'Start 1v1', exact: true }).click();
    await expect(arena.locator('.duel-verdict')).toContainText('A completed the task', {
      timeout: 20000,
    });
    await expect(arena.getByRole('button', { name: 'Start 1v1', exact: true })).toBeVisible();
    await expect(arena.getByRole('region', { name: 'Run result' })).toHaveCount(2);
    await page.screenshot({ path: 'evidence/visual/relay-duel.png', fullPage: true });
    const runs = await page.evaluate(async () => {
      const db = await new Promise((r) => {
        const q = indexedDB.open('relay-history-v1');
        q.onsuccess = () => r(q.result);
      });
      const rows = await new Promise((r) => {
        const q = db.transaction('runs').objectStore('runs').getAll();
        q.onsuccess = () => r(q.result);
      });
      db.close();
      return rows;
    });
    expect(runs).toHaveLength(2);
    expect(runs[0].duel.id).toBe(runs[1].duel.id);
    expect(runs[0].run.id).not.toBe(runs[1].run.id);
    expect(runs[0].run.episodes[0].initialHash).toBe(runs[1].run.episodes[0].initialHash);
    expect(runs[0].run.config.maxEstimatedUSD).toBe(runs[1].run.config.maxEstimatedUSD);
    expect(JSON.stringify(runs)).not.toMatch(/arena-fake-[ab]/);
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('relay-credentials-v1')).keys),
    ).toEqual({ ramp: 'arena-fake-b', typesafe: 'arena-fake-a' });
    await arena
      .getByRole('button', { name: /Play the run/ })
      .first()
      .click();
    await expect(page.getByRole('dialog', { name: 'Replay studio' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: '1v1', exact: true }).click();
    for (const side of ['A', 'B']) {
      await page.getByLabel(`API key ${side}`, { exact: true }).fill(`stop-fake-${side}`);
      await page
        .getByRole('region', { name: `Model ${side}`, exact: true })
        .getByRole('button', { name: 'Connect', exact: true })
        .click();
      await expect(page.getByRole('combobox', { name: `Model ${side}`, exact: true })).toHaveText(
        'gpt-4o-mini',
      );
    }
    await page.getByRole('button', { name: 'Start 1v1', exact: true }).click();
    await page.getByRole('button', { name: 'Stop both', exact: true }).click();
    await expect(arena.locator('.duel-verdict')).toContainText('Inconclusive');
    await expect(page.getByRole('button', { name: 'Start 1v1', exact: true })).toBeVisible();
  } finally {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
});
test('two hosted requests have isolated browser sessions and no shared history API', async ({
  request,
}) => {
  const server = createLiveServer({ routerFactory: fakeRouter, pricingResolver: testPricing });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}`;
  try {
    const setup = await (await request.get(`${url}/api/relay?op=config`)).json();
    const config = {
      ...setup.defaults,
      provider: 'ramp',
      // A modified client cannot understate the server's budget accounting.
      models: [{ id: 'gpt-4o-mini', rates: { input: 0.000001, output: 0.000001 } }],
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
      let liveRun;
      for (const item of streams[i]) {
        if (item.type === 'run') liveRun = item.data;
        if (item.type === 'event' && item.data.event.kind === 'action_started')
          expect(
            liveRun.episodes.find((e) => e.cell.episodeId === item.data.episodeId).inFlight,
          ).toBe(false);
      }
      expect(audit.run.config.models[0].rates).toEqual({ input: 0.15, output: 0.6 });
      expect(audit.run.catalog.pricing.source).toBe('https://docs.router.com/supported-models.md');
      expect(audit.run.catalog.pricing.hash).toMatch(/^[a-f0-9]{64}$/);
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
