import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlaySession } from '../src/play/session.mjs';
import { makeWorkflowSeed } from '../server/workflow-seed.mjs';
import { transition } from '../server/domain.mjs';

test('hands-on sandbox uses the same workspace transitions without a server or grader', () => {
  let expected = makeWorkflowSeed(42);
  const play = createPlaySession(expected);
  const actions = [
    { type: 'message.send', channelId: 'project', text: 'My own message' },
    { type: 'message.edit', id: 'new-1', text: 'Updated message' },
    { type: 'reaction.toggle', id: 'new-1', emoji: '✅' },
    { type: 'pin.toggle', id: 'new-1' },
    { type: 'save.toggle', id: 'new-1' },
    { type: 'channel.topic', channelId: 'project', topic: 'Sandbox topic' },
    { type: 'channel.description', channelId: 'project', description: 'Sandbox description' },
    { type: 'message.send', channelId: 'project', parentId: 'new-1', text: 'A thread reply' },
    { type: 'message.delete', id: 'new-8' },
    { type: 'message.delete', id: 'new-1' },
  ];
  for (const [i, action] of actions.entries()) {
    expected = transition(expected, action, i + 1);
    play.request('action', 'POST', { requestId: `test-${i}`, revision: i, action });
    assert.deepEqual(play.request('state'), { state: expected, revision: i + 1 });
  }
  assert.throws(() => play.request('evaluate', 'POST'), /not available/);
  assert.throws(() => play.request('demo', 'POST'), /not available/);
});

test('sandbox sessions are independent, cloned, revision guarded and idempotent', () => {
  const initial = makeWorkflowSeed(42),
    a = createPlaySession(initial),
    b = createPlaySession(initial);
  const body = {
    requestId: 'one',
    revision: 0,
    action: { type: 'message.send', channelId: 'project', text: 'Only here' },
  };
  a.request('action', 'POST', body);
  a.request('action', 'POST', body);
  assert.equal(a.request('state').revision, 1);
  assert.deepEqual(b.request('state').state, initial);
  a.request('state').state.messages.length = 0;
  assert.ok(a.request('state').state.messages.length);
  assert.throws(
    () => a.request('action', 'POST', { ...body, requestId: 'two' }),
    /Workspace changed/,
  );
  assert.throws(
    () => a.request('action', 'POST', { ...body, action: { ...body.action, text: 'Different' } }),
    /already used/,
  );
  const foreign = initial.messages.find((m) => m.userId !== initial.currentUserId);
  assert.throws(
    () =>
      a.request('action', 'POST', {
        requestId: 'three',
        revision: 1,
        action: { type: 'message.edit', id: foreign.id, text: 'Wrong owner' },
      }),
    /own messages/,
  );
  assert.equal(a.request('state').revision, 1);
});

test('sandbox search follows mutations and does not share returned objects', () => {
  const play = createPlaySession(makeWorkflowSeed(42));
  play.request('action', 'POST', {
    requestId: 'one',
    revision: 0,
    action: { type: 'message.send', channelId: 'dm-sam', text: 'Personal sandbox note' },
  });
  const result = play.request('search?q=from:me%20%22Personal%20sandbox%22');
  assert.equal(result.messages.length, 1);
  result.messages[0].text = 'Changed outside';
  assert.equal(play.request('search?q=%22Personal%20sandbox%22').messages.length, 1);
});
