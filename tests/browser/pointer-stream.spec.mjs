import { test, expect } from '@playwright/test';
import { observePointer } from '../../runner/pointer-observer.mjs';
import { startSpectator } from '../../hosted/spectator.mjs';

test('real pointer observer retains trailing motion and click coordinates without changing actor pixels', async ({
  page,
}) => {
  await page.setContent(
    '<style>body { margin: 0; background: #fff; }</style><p>Pointer telemetry fixture</p>',
  );
  const original = await page.screenshot();
  const points = [];
  await observePointer(page, (point) => points.push(point));
  await page.mouse.move(100, 200);
  await page.mouse.move(1100, 600, { steps: 16 });
  await expect.poll(() => points.at(-1)?.x).toBe(1100);
  await expect.poll(() => points.at(-1)?.y).toBe(600);
  await page.mouse.click(400, 400);
  await expect.poll(() => points.filter((p) => p.type === 'pointerdown').length).toBe(1);
  expect(points.find((p) => p.type === 'pointerdown')).toMatchObject({
    x: 400,
    y: 400,
    source: 'browser-event',
  });
  expect(await page.screenshot()).toEqual(original);
  const before = points.length;
  await page.evaluate(() =>
    document.dispatchEvent(new PointerEvent('pointermove', { clientX: 12, clientY: 12 })),
  );
  expect(points.length).toBe(before); // Untrusted synthetic app events aren't input evidence.
});

test('screencast follows consecutive real screen changes and retains native image dimensions', async ({
  page,
}) => {
  await page.setContent('<style>body { background: #ff0000; }</style>');
  const frames = [];
  const capture = await startSpectator(page, (frame) => frames.push(frame));
  await expect.poll(() => frames.length).toBeGreaterThan(0);
  const first = frames.at(-1);
  await page.evaluate(() => (document.body.style.background = '#0000ff'));
  await expect.poll(() => frames.at(-1)?.image).not.toBe(first.image);
  const last = frames.at(-1);
  expect(last.sequence).toBeGreaterThan(first.sequence);
  expect(last.viewport).toEqual({ width: 1440, height: 900 });
  const native = await capture({ type: 'png', timeout: 5000 });
  expect(native.readUInt32BE(16)).toBe(1440);
  expect(native.readUInt32BE(20)).toBe(900);
});
