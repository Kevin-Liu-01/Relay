import { test, expect } from '@playwright/test';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createLab } from '../../runner/lab-server.mjs';
import { InterfaceEnvironment } from '../../runner/interfaces.mjs';
import { actionProtocol } from '../../runner/protocol.mjs';

const environment = {
  appURL: 'http://127.0.0.1:4320',
  controlURL: 'http://127.0.0.1:4321',
  controlToken: 'browser-test-only',
};
test('connected Router defaults are actionable; a model run is never labeled as a script', async ({
  page,
}) => {
  const dir = mkdtempSync(join(tmpdir(), 'relay-connected-ui-'));
  let calls = 0;
  const lab = createLab({
    runRoot: dir,
    environment,
    keyPresent: () => true,
    routerFactory: () => ({
      models: async () => ({ models: [{ id: 'gpt-4o-mini' }] }),
      respond: async () => {
        calls++;
        return {
          text: '{"type":"finish"}',
          usage: { inputTokens: 100, outputTokens: 10 },
          latencyMs: 1,
          requestedModel: 'gpt-4o-mini',
          returnedModel: 'fake-test-only',
        };
      },
    }),
  });
  lab.server.listen(0, '127.0.0.1');
  await once(lab.server, 'listening');
  try {
    await page.goto(`http://127.0.0.1:${lab.server.address().port}`);
    await expect(page.getByLabel('Model', { exact: true })).toHaveValue('gpt-4o-mini');
    await expect(page.locator('.episode-meta .model-mark')).toHaveCount(1);
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.locator('.stage-heading strong')).toHaveText('Complete', { timeout: 20000 });
    expect(calls).toBe(1);
    await expect(page.locator('.badge')).toHaveText('Model');
    await expect(page.getByText('× Task incomplete')).toBeVisible();
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Run settings' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    const saved = [...lab.runs.values()][0];
    await page.goto(
      `http://127.0.0.1:${lab.server.address().port}/?run=${saved.id}&episode=episode-001`,
    );
    await expect(page.getByLabel('Select run')).toHaveValue(saved.id);
    await expect(page.getByText('× Task incomplete')).toBeVisible();
    expect(calls).toBe(1); // Replaying a link cannot start inference.
    await page.getByRole('button', { name: 'Audit trace ↗', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Full audit trace' })).toBeVisible();
    await expect(page.locator('.audit-integrity summary')).toContainText('Integrity: verified');
    await page.getByLabel('Audit event type').selectOption('responses');
    await expect(page.getByLabel('Audit events').getByRole('button')).toHaveCount(1);
    await expect(page.getByLabel('Audit event details')).toContainText('fake-test-only');
    await page.getByText('Exact request body', { exact: true }).click();
    await expect(page.getByLabel('Audit event details')).toContainText('max_output_tokens');
    await expect(page.getByLabel('Audit event details')).not.toContainText('browser-test-only');
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Full bundle ↓', exact: true }).click();
    const download = await downloadEvent;
    expect(download.suggestedFilename()).toBe(`relay-audit-${saved.id}.tar.gz`);
    expect(await download.failure()).toBeNull();
    await page.getByLabel('Audit event type').selectOption('errors');
    await expect(page.getByText('No matching events.', { exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.goto(
      `http://127.0.0.1:${lab.server.address().port}/?run=${saved.id}&episode=episode-001&view=audit`,
    );
    await expect(page.getByRole('dialog', { name: 'Full audit trace' })).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.keyboard.press('Escape');
    expect(calls).toBe(1); // Inspecting, downloading and deep-linking audit never runs the policy.
  } finally {
    lab.cancel();
    await new Promise((r) => lab.server.close(r));
    rmSync(dir, { recursive: true, force: true });
  }
});
test('lab launches genuine reference episodes, compares results and replays evidence', async ({
  page,
}) => {
  const dir = mkdtempSync(join(tmpdir(), 'relay-lab-browser-')),
    lab = createLab({ runRoot: dir, environment, keyPresent: () => false });
  lab.server.listen(0, '127.0.0.1');
  await once(lab.server, 'listening');
  const url = `http://127.0.0.1:${lab.server.address().port}`;
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(url);
    await expect(page.getByRole('heading', { name: 'Activity' })).toBeVisible();
    await expect(page.getByLabel('Router not connected')).toBeVisible();
    await expect(page.getByAltText('Slack workspace preview')).toBeVisible();
    await page.getByLabel('Interface', { exact: true }).selectOption('compare');
    await page.getByRole('button', { name: 'Run', exact: true }).click();
    await expect(page.locator('.stage-heading strong')).toHaveText('Complete', { timeout: 20000 });
    await page.getByRole('button', { name: 'Results ↗' }).click();
    await expect(page.getByText(/Scripted reference · not an LLM result/)).toBeVisible();
    await expect(page.locator('dialog tbody tr')).toHaveCount(3);
    await expect(page.locator('dialog td').filter({ hasText: /^1 \/ 1$/ })).toHaveCount(3);
    await page.getByRole('button', { name: 'Close dialog' }).click();
    await page.getByRole('button', { name: /Episode \d+: Page JSON/ }).click();
    await expect(page.getByText('✓ Task passed')).toBeVisible();
    await expect(page.locator('.screen-preview')).toBeVisible();
    await expect
      .poll(() =>
        page.locator('.screen-preview').evaluate((img) => img.complete && img.naturalWidth > 0),
      )
      .toBe(true);
    await page.getByLabel('Replay step').fill('0');
    await page.getByRole('button', { name: 'Details', exact: true }).click();
    await expect(page.locator('dialog pre').first()).toContainText('click');
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Agent input' }).click();
    await expect(page.locator('dialog pre')).toContainText('json-ui');
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: 'Settings', exact: true }).click();
    await expect(
      page.getByText('Router not connected. Reference scripts are available.'),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Done', exact: true }).click();
    const selected = [...lab.runs.values()][0];
    const exportData = await (
      await page.request.get(`${url}/api/runs/${selected.id}/export`)
    ).json();
    expect(exportData.episodes).toHaveLength(3);
    expect(exportData.run.budget.requests).toBe(0);
    expect(exportData.run.operatorVisuals).toBe(true);
    const apiEpisode = exportData.episodes.find((e) => e.episode.cell.mode === 'api');
    expect(apiEpisode.episode.finalScreenshot).toBe('final.png');
    expect(
      apiEpisode.trace
        .filter((e) => e.kind === 'step')
        .every((e) => !e.observation.image && !e.observation.imageFile),
    ).toBe(true);
    await page.getByRole('button', { name: /Episode \d+: API/ }).click();
    await expect(page.locator('.screen-preview')).toBeVisible();
    expect(JSON.stringify(exportData)).not.toContain('browser-test-only');
    expect(errors).toEqual([]);
    await page.screenshot({ path: 'evidence/visual/relay-lab.png', fullPage: true });
    const screen = await page.locator('.workspace-screen').boundingBox();
    expect(screen.width).toBeGreaterThan(page.viewportSize().width * 0.65);
    expect(
      await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1),
    ).toBe(true);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  } finally {
    lab.cancel();
    await new Promise((r) => lab.server.close(r));
    rmSync(dir, { recursive: true, force: true });
  }
});

test('API spectator follows the same session without changing state or model input', async () => {
  const env = new InterfaceEnvironment({ ...environment, mode: 'api', operatorVisuals: true });
  try {
    const { observation } = await env.reset({ taskId: 'handoff-dm', seed: 42 });
    const before = await env.export();
    const dm = observation.result.channels.find((c) => c.kind === 'dm');
    await env.act({ type: 'messages', channelId: dm.id });
    const screenshot = await env.screenshot();
    expect(screenshot.length).toBeGreaterThan(1000);
    expect((await env.observe()).image).toBeUndefined();
    expect((await env.observe()).imageFile).toBeUndefined();
    expect((await env.export()).revision).toBe(before.revision);
    expect((await env.evaluate()).reward).toBe(0);
    await expect(env.base.page.getByRole('textbox', { name: `Message ${dm.name}` })).toBeVisible();
  } finally {
    await env.close();
  }
});

for (const mode of ['pixels', 'a11y', 'json-ui'])
  test(`interface gateway ${mode}: observation boundary and forbidden actions`, async () => {
    const env = new InterfaceEnvironment({ ...environment, mode });
    try {
      const start = await env.reset({ taskId: 'channel-topic', seed: 61 });
      expect(JSON.stringify(start.observation)).not.toContain('qa-target');
      expect(JSON.stringify(start.observation)).not.toContain('browser-test-only');
      expect(start.observation).not.toHaveProperty('evaluation');
      if (mode === 'pixels') {
        expect(start.observation.image.length).toBeGreaterThan(1000);
        expect(start.observation.elements).toBeUndefined();
        await expect(env.act({ type: 'fill', ref: 'e1', text: 'x' })).rejects.toThrow();
        await expect(env.act({ type: 'click', x: -1, y: 0 })).rejects.toThrow();
      } else {
        expect(start.observation.image).toBeUndefined();
        expect(start.observation.elements.length).toBeGreaterThan(5);
        await expect(env.act({ type: 'message.delete', id: 'qa-target' })).rejects.toThrow();
        await expect(env.act({ type: 'click', ref: 'nonexistent' })).rejects.toThrow();
        const edit = start.observation.elements.find((e) => e.name === 'Edit channel topic');
        await env.act({ type: 'click', ref: edit.ref });
        const o = await env.observe();
        expect(o.elements.some((e) => e.name === 'Channel topic')).toBe(true);
        expect(actionProtocol(mode)).not.toContain('channel.topic');
      }
      await expect(env.act({ type: 'key', key: 'Control+l' })).rejects.toThrow(/shortcut/);
      await expect(env.act({ type: 'key', key: 'Control+Shift+j' })).rejects.toThrow(/shortcut/);
      await expect(env.act({ type: 'key', key: 'Meta+v' })).rejects.toThrow(/shortcut/);
      expect((await env.evaluate()).reward).toBe(0);
    } finally {
      await env.close();
    }
  });

test('page JSON omits offscreen and scroll-clipped text until it is visible', async () => {
  const env = new InterfaceEnvironment({ ...environment, mode: 'json-ui' });
  try {
    await env.reset({ taskId: 'channel-topic', seed: 42 });
    await env.base.page.evaluate(() => {
      const box = document.createElement('div');
      box.id = 'viewport-test';
      box.style.cssText =
        'position:fixed;top:100px;left:100px;width:200px;height:40px;overflow:auto;z-index:999;background:white';
      const spacer = document.createElement('div');
      spacer.style.height = '300px';
      box.appendChild(spacer);
      const text = document.createElement('p');
      text.textContent = 'OFFSCREEN-SENTINEL-123';
      box.appendChild(text);
      document.body.appendChild(box);
    });
    expect(JSON.stringify(await env.observe())).not.toContain('OFFSCREEN-SENTINEL-123');
    await env.base.page.locator('#viewport-test').evaluate((el) => (el.scrollTop = 1000));
    expect(JSON.stringify(await env.observe())).toContain('OFFSCREEN-SENTINEL-123');
  } finally {
    await env.close();
  }
});
