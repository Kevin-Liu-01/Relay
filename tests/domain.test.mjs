import test from 'node:test';
import assert from 'node:assert/strict';
import { makeSeed } from '../server/seed.mjs';
import { searchMessages, transition, digest } from '../server/domain.mjs';
import { LEGACY_TASK_IDS, grade } from '../server/tasks.mjs';

test('deterministic seeds vary content and remain independent', () => {
  const a = makeSeed(42),
    b = makeSeed(42);
  assert.deepEqual(a, b);
  a.messages[0].text = 'changed';
  assert.notEqual(digest(a), digest(b));
  assert.notEqual(digest(makeSeed(43)), digest(b));
});
test('search handles quotes, AND, people, channel and exclusions', () => {
  const s = makeSeed();
  assert.deepEqual(
    searchMessages(s, 'in:#proj-meridian from:@maya "release candidate"').map((m) => m.id),
    ['qa-target'],
  );
  assert.deepEqual(
    searchMessages(s, '"draft announcement" -placeholder').map((m) => m.id),
    ['delete-distractor'],
  );
  assert.deepEqual(
    searchMessages(s, 'from:me "launch review"').map((m) => m.id),
    ['launch-old'],
  );
  assert.equal(searchMessages(s, '"release candidate" in:engineering').length, 0);
});
test('search distinguishes threads and dates', () => {
  const s = makeSeed();
  assert.ok(searchMessages(s, 'is:thread').every((m) => m.parentId));
  assert.equal(searchMessages(s, 'before:2026-09-28').length, 0);
  assert.equal(searchMessages(s, 'on:2026-09-28').length, s.messages.length);
  assert.equal(searchMessages(s, 'after:garbage').length, 0);
});
test('ownership and cross-channel thread boundaries enforced', () => {
  const s = makeSeed();
  assert.throws(
    () => transition(s, { type: 'message.edit', id: 'qa-target', text: 'hijack' }, 1),
    /own messages/,
  );
  assert.throws(
    () => transition(s, { type: 'message.delete', id: 'qa-target' }, 1),
    /own messages/,
  );
  assert.throws(
    () =>
      transition(
        s,
        { type: 'message.send', channelId: 'general', parentId: 'qa-target', text: 'bad' },
        1,
      ),
    /Invalid thread/,
  );
  assert.throws(
    () =>
      transition(
        s,
        { type: 'message.send', channelId: 'project', parentId: 'qa-reply', text: 'bad' },
        1,
      ),
    /Invalid thread/,
  );
});
test('invalid actions leave input unchanged', () => {
  const s = makeSeed(),
    hash = digest(s);
  for (const a of [
    { type: 'message.send', channelId: 'no', text: 'x' },
    { type: 'reaction.toggle', id: 'welcome', emoji: 'bogus' },
    { type: 'message.edit', id: 'launch-old', text: ' ' },
    { type: 'channel.topic', channelId: 'dm-maya', topic: 'x' },
    { type: 'invented' },
  ])
    assert.throws(() => transition(s, a, 1));
  assert.equal(digest(s), hash);
});
test('reaction and pin toggles are reversible', () => {
  const s = makeSeed();
  let changed = transition(s, { type: 'reaction.toggle', id: 'welcome', emoji: '✅' }, 1);
  assert.deepEqual(changed.messages[0].reactions['✅'], ['alex']);
  changed = transition(changed, { type: 'reaction.toggle', id: 'welcome', emoji: '✅' }, 2);
  assert.equal(digest(changed), digest(s));
});
const solutions = {
  'thread-reply': [
    {
      type: 'message.send',
      channelId: 'project',
      parentId: 'qa-target',
      text: 'QA checklist complete. Ready for review.',
    },
  ],
  'edit-message': [
    {
      type: 'message.edit',
      id: 'launch-old',
      text: 'Launch review is at 15:00 UTC. Please bring the final checklist.',
    },
  ],
  'incident-triage': [
    { type: 'reaction.toggle', id: 'incident-target', emoji: '✅' },
    { type: 'pin.toggle', id: 'incident-target' },
  ],
  'handoff-dm': [
    {
      type: 'message.send',
      channelId: 'dm-sam',
      text: 'Rollback owner: Priya Shah. Release window: 16:30 UTC.',
    },
  ],
  'delete-draft': [{ type: 'message.delete', id: 'delete-target' }],
  'channel-topic': [
    {
      type: 'channel.topic',
      channelId: 'project',
      topic: 'Launch review · 15:00 UTC · Bring the final checklist',
    },
  ],
};
for (const id of LEGACY_TASK_IDS)
  test(`grader ${id}: seed fails; intended state passes; unrelated mutation fails`, () => {
    for (const seed of [0, 42, 43, 999]) {
      let s = makeSeed(seed);
      assert.equal(grade(id, seed, s).reward, 0);
      solutions[id].forEach((a, i) => {
        s = transition(s, a, i + 1);
      });
      assert.equal(grade(id, seed, s).reward, 1);
      s = transition(s, { type: 'message.send', channelId: 'random', text: 'unrequested' }, 10);
      assert.equal(grade(id, seed, s).reward, 0);
    }
  });
test('grader rejects right text in wrong place and duplicate answers', () => {
  let s = makeSeed();
  s = transition(s, { ...solutions['thread-reply'][0], parentId: null }, 1);
  assert.equal(grade('thread-reply', 42, s).reward, 0);
  s = makeSeed();
  s = transition(s, solutions['thread-reply'][0], 1);
  s = transition(s, solutions['thread-reply'][0], 2);
  assert.equal(grade('thread-reply', 42, s).reward, 0);
});
