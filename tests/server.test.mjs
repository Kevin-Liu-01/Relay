import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createServers } from '../server/server.mjs';
import { digest } from '../server/domain.mjs';
let servers, root, app, control;
const admin = 'test-only-control-token';
before(async () => {
  root = mkdtempSync(join(tmpdir(), 'relay-tests-'));
  servers = createServers({ dataDir: root, controlToken: admin });
  servers.app.listen(0, '127.0.0.1');
  servers.control.listen(0, '127.0.0.1');
  await Promise.all([once(servers.app, 'listening'), once(servers.control, 'listening')]);
  app = `http://127.0.0.1:${servers.app.address().port}`;
  control = `http://127.0.0.1:${servers.control.address().port}`;
});
after(async () => {
  await Promise.all([
    new Promise((r) => servers.app.close(r)),
    new Promise((r) => servers.control.close(r)),
  ]);
  rmSync(root, { recursive: true, force: true });
});
const call = async (base, path, { method = 'GET', data, token, headers = {} } = {}) => {
  const r = await fetch(base + path, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { 'x-session-token': token } : {}),
      ...headers,
    },
    body: data ? JSON.stringify(data) : undefined,
  });
  return { status: r.status, body: await r.json() };
};
const ctl = (path, options = {}) =>
  call(control, path, {
    ...options,
    headers: { authorization: `Bearer ${admin}`, ...options.headers },
  });
const create = async () =>
  (await ctl('/sessions', { method: 'POST', data: { seed: 42, taskId: 'thread-reply' } })).body;
const send = (token, revision = 0, requestId = 'test-request-1', text = 'test') =>
  call(app, '/api/action', {
    method: 'POST',
    token,
    data: { revision, requestId, action: { type: 'message.send', channelId: 'general', text } },
  });
test('control plane is absent from app and requires token', async () => {
  assert.equal((await call(app, '/api/evaluate')).status, 404);
  assert.equal((await call(app, '/demo/task-expectations.json')).status, 404);
  assert.equal((await call(control, '/tasks')).status, 401);
  assert.equal((await ctl('/tasks', { headers: { origin: app } })).status, 403);
});
test('unknown and traversal session tokens fail closed', async () => {
  for (const token of ['../secrets', 'x', 'a'.repeat(64)])
    assert.ok([401, 404].includes((await call(app, '/api/state', { token })).status));
});
test('sessions are physically separate and cannot leak writes', async () => {
  const a = await create(),
    b = await create();
  assert.notEqual(servers.store.path(a.token), servers.store.path(b.token));
  const initial = await call(app, '/api/state', { token: b.token });
  assert.equal((await send(a.token)).status, 200);
  const current = await call(app, '/api/state', { token: b.token });
  assert.deepEqual(current, initial);
});
test('idempotency replay succeeds once and conflicting reuse is rejected', async () => {
  const a = await create();
  assert.equal((await send(a.token)).body.replayed, false);
  assert.equal((await send(a.token)).body.replayed, true);
  assert.equal((await send(a.token, 0, 'test-request-1', 'different')).status, 409);
  const state = (await call(app, '/api/state', { token: a.token })).body;
  assert.equal(state.revision, 1);
  assert.equal(state.state.messages.filter((m) => m.text === 'test').length, 1);
});
test('concurrent stale writes yield one success and one conflict', async () => {
  const a = await create();
  const out = await Promise.all([
    send(a.token, 0, 'concurrent-a'),
    send(a.token, 0, 'concurrent-b'),
  ]);
  assert.deepEqual(out.map((r) => r.status).sort(), [200, 409]);
});
test('reset is deterministic, preserves audit, and fences stale writes', async () => {
  const a = await create();
  const original = servers.store.read(a.token);
  await send(a.token);
  const reset = await ctl(`/sessions/${a.token}/reset`, { method: 'POST' });
  assert.equal(digest(reset.body.state), digest(original.state));
  assert.equal(reset.body.revision, 2);
  assert.equal((await send(a.token, 0, 'after-reset-request')).status, 409);
  const export_ = await ctl(`/sessions/${a.token}/export`);
  assert.equal(export_.body.events.filter((e) => e.kind === 'reset').length, 1);
});
test('reopening the store survives a process-level connection boundary', async () => {
  const a = await create();
  await send(a.token);
  const next = createServers({ dataDir: root, controlToken: admin });
  assert.deepEqual(next.store.read(a.token), servers.store.read(a.token));
});
test('bad input and cross-origin writes leave state unchanged', async () => {
  const a = await create(),
    before = servers.store.read(a.token);
  assert.equal(
    (
      await call(app, '/api/action', {
        token: a.token,
        method: 'POST',
        data: {},
        headers: { origin: 'https://evil.example' },
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await call(app, '/api/action', {
        token: a.token,
        method: 'POST',
        data: {
          revision: 0,
          requestId: 'invalid-input',
          action: { type: 'message.delete', id: 'qa-target' },
        },
      })
    ).status,
    403,
  );
  assert.deepEqual(servers.store.read(a.token), before);
});
test('HTML input stays inert JSON and grader receives no browser claims', async () => {
  const a = await create();
  await send(a.token, 0, 'xss-message-request', '<img src=x onerror=alert(1)>');
  const data = (await ctl(`/sessions/${a.token}/export`)).body;
  assert.equal(data.state.messages.at(-1).text, '<img src=x onerror=alert(1)>');
  assert.equal(data.evaluation.reward, 0);
});
test('close invalidates session without touching sibling', async () => {
  const a = await create(),
    b = await create();
  assert.equal((await ctl(`/sessions/${a.token}`, { method: 'DELETE' })).status, 200);
  assert.equal((await call(app, '/api/state', { token: a.token })).status, 404);
  assert.equal((await call(app, '/api/state', { token: b.token })).status, 200);
});
