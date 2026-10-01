import test from 'node:test';
import assert from 'node:assert/strict';
import { startSpectator } from '../hosted/spectator.mjs';

for (const fails of [false, true]) {
  test(`spectator pauses around fresh PNG capture and resumes on ${fails ? 'failure' : 'success'}`, async () => {
    const calls = [];
    let streaming = false;
    const session = {
      on() {},
      async send(method) {
        calls.push(method);
        streaming = method === 'Page.startScreencast';
      },
    };
    const page = {
      context: () => ({ newCDPSession: async () => session }),
      screenshot: async (options) => {
        assert.equal(streaming, false, 'must not compete with a continuous screencast');
        assert.deepEqual(options, { type: 'png', timeout: 5000 });
        calls.push('fresh PNG');
        if (fails) throw Error('screenshot failed');
        return Buffer.from('new PNG, not a cached live frame');
      },
    };
    const capture = await startSpectator(page, () => {});
    if (fails) await assert.rejects(capture({ type: 'png', timeout: 5000 }), /screenshot failed/);
    else
      assert.equal(
        (await capture({ type: 'png', timeout: 5000 })).toString(),
        'new PNG, not a cached live frame',
      );
    assert.equal(streaming, true);
    assert.deepEqual(calls, [
      'Page.startScreencast',
      'Page.stopScreencast',
      'fresh PNG',
      'Page.startScreencast',
    ]);
  });
}
