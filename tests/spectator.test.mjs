import test from 'node:test';
import assert from 'node:assert/strict';
import { startSpectator } from '../hosted/spectator.mjs';

const png = Buffer.concat([
  Buffer.from('89504e470d0a1a0a', 'hex'),
  Buffer.from('fresh test image'),
]);

for (const fails of [false, true]) {
  test(`native PNG capture leaves the live stream running on ${fails ? 'failure' : 'success'}`, async () => {
    const calls = [];
    const session = {
      on() {},
      async send(method, params) {
        calls.push(method);
        if (method === 'Page.captureScreenshot') {
          assert.deepEqual(params, {
            format: 'png',
            fromSurface: true,
            captureBeyondViewport: false,
            optimizeForSpeed: true,
          });
          if (fails) throw Error('native capture failed');
          return { data: png.toString('base64') };
        }
      },
    };
    const page = {
      context: () => ({ newCDPSession: async () => session }),
      evaluate: async () => {
        calls.push('fonts ready');
      },
      screenshot: async () => {
        throw Error('must not use the wrapper capture');
      },
    };
    const capture = await startSpectator(page, () => {});
    if (fails)
      await assert.rejects(capture({ type: 'png', timeout: 5000 }), /native capture failed/);
    else assert.deepEqual(await capture({ type: 'png', timeout: 5000 }), png);
    assert.deepEqual(calls, [
      'Page.startScreencast',
      'Page.bringToFront',
      'fonts ready',
      'Page.captureScreenshot',
    ]);
  });
}

test('native PNG capture has a finite deadline and never returns a cached stream frame', async () => {
  const session = {
    on() {},
    send(method) {
      return method === 'Page.captureScreenshot' ? new Promise(() => {}) : Promise.resolve();
    },
  };
  const page = {
    context: () => ({ newCDPSession: async () => session }),
    evaluate: async () => true,
  };
  const capture = await startSpectator(page, () => {});
  await assert.rejects(
    capture({ type: 'png', timeout: 20 }),
    /Screenshot native capture timed out/,
  );
});
