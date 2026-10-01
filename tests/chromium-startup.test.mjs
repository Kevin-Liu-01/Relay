import test from 'node:test';
import assert from 'node:assert/strict';
import { createBrowserLaunchOptions } from '../hosted/chromium.mjs';

test('concurrent cold requests await one completed Chromium extraction before either launches', async () => {
  let calls = 0,
    release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  const options = createBrowserLaunchOptions({
    args: ['--test-only'],
    executablePath: async () => {
      calls++;
      await pending;
      return '/tmp/test-complete-browser';
    },
  });
  let settled = false;
  const jobs = Promise.all([options(), options()]).then((result) => {
    settled = true;
    return result;
  });
  await Promise.resolve();
  assert.equal(settled, false);
  release();
  const [a, b] = await jobs;
  assert.equal(calls, 1, 'duplicate extraction recreates the cold-start ETXTBSY race');
  assert.equal(a.executablePath, b.executablePath);
  assert.notEqual(a, b);
  assert.notEqual(a.args, b.args);
  await options();
  assert.equal(calls, 1);
});

test('failed extraction remains failed for this worker; no retry against a partial executable', async () => {
  let calls = 0;
  const options = createBrowserLaunchOptions({
    args: [],
    executablePath: async () => {
      calls++;
      throw Error('fixture extraction failed');
    },
  });
  await assert.rejects(options(), /fixture extraction failed/);
  await assert.rejects(options(), /fixture extraction failed/);
  assert.equal(calls, 1);
});
