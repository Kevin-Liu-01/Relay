import test from 'node:test';
import assert from 'node:assert/strict';
import { startSpectator } from '../hosted/spectator.mjs';
import { EventEmitter } from 'node:events';

test('spectator delivers the trailing frame, orders frames and cancels on close', async () => {
  const session = new EventEmitter();
  const calls = [];
  session.send = async (method) => calls.push(method);
  const page = new EventEmitter();
  page.context = () => ({ newCDPSession: async () => session });
  page.viewportSize = () => ({ width: 1440, height: 900 });
  const frames = [];
  await startSpectator(page, (frame) => frames.push(frame));
  const send = (data) => session.emit('Page.screencastFrame', { data, sessionId: 1 });
  send('first');
  send('middle');
  send('last');
  await new Promise((r) => setTimeout(r, 140));
  assert.deepEqual(
    frames.map((f) => f.image.split(',')[1]),
    ['first', 'last'],
  );
  assert.deepEqual(
    frames.map((f) => f.sequence),
    [1, 2],
  );
  assert.deepEqual(frames[1].viewport, { width: 1440, height: 900 });
  assert.equal(calls.filter((m) => m === 'Page.screencastFrameAck').length, 3);
  send('visible-before-close');
  send('pending');
  page.emit('close');
  await new Promise((r) => setTimeout(r, 140));
  assert.ok(!frames.some((f) => f.image.endsWith(',pending')));
});

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
