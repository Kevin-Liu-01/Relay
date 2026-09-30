import { test, expect } from '@playwright/test';
import { RelayEnvironment } from '../../runner/environment.mjs';
test('trainer bridge: reset, screenshots, terminal reward, caps and cleanup', async () => {
  const env = new RelayEnvironment({
    appURL: 'http://127.0.0.1:4320',
    controlURL: 'http://127.0.0.1:4321',
    controlToken: 'browser-test-only',
    maxSteps: 3,
  });
  try {
    const first = await env.reset({ taskId: 'edit-message', seed: 42 });
    expect(first.observation.screenshot.length).toBeGreaterThan(1000);
    expect(first.observation.dom).toBeUndefined();
    expect(first).not.toHaveProperty('token');
    await expect(env.step({ type: 'evaluate', code: 'forbidden' })).rejects.toThrow(
      'Unsupported action',
    );
    await expect(env.step({ type: 'click', x: -1, y: 0 })).rejects.toThrow('Coordinates');
    const a = await env.step({ type: 'wait' });
    expect(a.reward).toBe(0);
    expect(a.terminated).toBe(false);
    await env.step({ type: 'wait' });
    const last = await env.step({ type: 'wait' });
    expect(last.truncated).toBe(true);
    expect(last.reward).toBe(0);
    await expect(env.step({ type: 'wait' })).rejects.toThrow('Reset');
    const b = await env.reset({ taskId: 'channel-topic', seed: 43 });
    expect(b.instruction).toContain('proj-orbit');
    // Reference UI policy, not an autonomous model. Oracle remains trainer-side.
    await env.page.getByRole('button', { name: 'Edit channel topic', exact: true }).click();
    await env.page
      .getByRole('textbox', { name: 'Channel topic', exact: true })
      .fill('Launch review · 15:00 UTC · Bring the final checklist');
    await env.page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(env.page.getByText('Channel topic updated')).toBeVisible();
    const end = await env.step({ type: 'finish' });
    expect(end.terminated).toBe(true);
    expect(end.reward).toBe(1);
    expect(end.info).not.toHaveProperty('checks');
    expect((await env.export()).evaluation.success).toBe(true);
  } finally {
    await env.close();
  }
});
