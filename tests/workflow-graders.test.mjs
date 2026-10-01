import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { WORKFLOW_IDS, TASK_CATALOG, supportsChoice } from '../shared/task-catalog.mjs';
import { TASK_IDS, LEGACY_TASK_IDS, taskSeed, taskSpec, grade } from '../server/tasks.mjs';
import { makeSeed } from '../server/seed.mjs';
import { transition, searchMessages } from '../server/domain.mjs';
import { Store } from '../server/store.mjs';
import { DEFAULT_CONFIG, validateConfig } from '../runner/design.mjs';
import { solveWorkflow, workflowChallenges } from './helpers/workflow-cases.mjs';

export const SEEDS = [0, 1, 42, 43, 97, 999, 1000000000];
for (const id of WORKFLOW_IDS) {
  test(`${id}: independent reference positives and adversarial state challenges`, () => {
    for (const seed of SEEDS) {
      const { state } = solveWorkflow(id, seed);
      assert.equal(grade(id, seed, state).reward, 1, `${id}/${seed}: positive`);
      for (const c of workflowChallenges(id, seed))
        assert.equal(grade(id, seed, c.state).reward, 0, `${id}/${seed}: ${c.name}`);
      const reordered = structuredClone(state);
      reordered.messages.reverse();
      reordered.channels.reverse();
      reordered.users.reverse();
      for (const c of reordered.channels) c.members.reverse();
      assert.equal(grade(id, seed, reordered).reward, 1, 'Collection order is not a task outcome');
      for (const malformed of [null, {}, { messages: [], channels: [] }])
        assert.equal(grade(id, seed, malformed).reward, 0);
    }
  });
}
test('golden release contract uses current cross-channel facts, not superseded data', () => {
  const { state } = solveWorkflow('release-sync', 42);
  assert.equal(
    state.messages.find((m) => m.id === 'launch-old').text,
    'Launch review: rc-311 at 16:30 UTC; 24 checks passed.',
  );
  assert.equal(state.channels.find((c) => c.id === 'project').topic, 'Release rc-311 · 16:30 UTC');
  assert.ok(
    state.messages.some(
      (m) =>
        m.channelId === 'dm-priya' && m.text === 'Please cover rollback for rc-311 at 16:30 UTC.',
    ),
  );
  assert.equal(grade('release-sync', 43, state).reward, 0);
});
test('valid alternative orders and fully undone actions preserve final-state success', () => {
  for (const id of WORKFLOW_IDS) {
    let state = taskSeed(id, 43),
      serial = 0;
    const { actions } = solveWorkflow(id, 43);
    // A reversible action is allowed by the declared final-state policy.
    state = transition(state, { type: 'save.toggle', id: 'welcome' }, ++serial);
    state = transition(state, { type: 'save.toggle', id: 'welcome' }, ++serial);
    const reordered =
      id === 'publish-update'
        ? [actions[2], actions[0], actions[1]] // Delete first; post still precedes pin.
        : [...actions].reverse();
    for (const original of reordered) {
      const action = { ...original };
      if (action.id === '$announcement')
        action.id = state.messages.find((m) => /^new-\d+$/.test(m.id)).id;
      state = transition(state, action, ++serial);
    }
    assert.equal(grade(id, 43, state).reward, 1, id);
  }
});
test('v2 fixture provenance is coherent and unsupported Jev tasks fail before inference', () => {
  for (const seed of SEEDS) {
    const state = taskSeed('release-sync', seed);
    assert.equal(new Set(state.messages.map((m) => m.id)).size, state.messages.length);
    for (const m of state.messages) {
      assert.ok(state.channels.find((c) => c.id === m.channelId).members.includes(m.userId));
      assert.ok(Date.parse(m.createdAt) <= Date.parse(state.clock));
      if (m.parentId) {
        const parent = state.messages.find((p) => p.id === m.parentId);
        assert.equal(parent.channelId, m.channelId);
        assert.ok(Date.parse(parent.createdAt) <= Date.parse(m.createdAt));
      }
    }
  }
  for (const id of WORKFLOW_IDS)
    assert.throws(
      () =>
        validateConfig({
          ...DEFAULT_CONFIG,
          provider: 'typesafe',
          models: [{ id: 'jev', rates: { input: 1, output: 0 } }],
          tasks: [id],
          interfaces: ['a11y'],
        }),
      /cannot compose/,
    );
});
test('catalog is complete, public-only, and all legacy fixture bytes stay unchanged', () => {
  assert.deepEqual([...TASK_IDS].sort(), TASK_CATALOG.map((t) => t.id).sort());
  for (const id of LEGACY_TASK_IDS) assert.deepEqual(taskSeed(id, 42), makeSeed(42));
  for (const id of WORKFLOW_IDS) {
    assert.equal(supportsChoice(id), false);
    assert.deepEqual(Object.keys(taskSpec(id, 42)).sort(), [
      'fixtureVersion',
      'graderVersion',
      'id',
      'instruction',
      'maxSteps',
      'seed',
    ]);
  }
  const source = readFileSync('shared/task-catalog.mjs', 'utf8');
  assert.doesNotMatch(source, /import .*server|rc-311|changes:/);
  for (const file of readdirSync('dist/assets').filter((f) => f.endsWith('.js')))
    assert.doesNotMatch(
      readFileSync(join('dist/assets', file), 'utf8'),
      /workflowContract|gradeWorkflow|qa-matrix-old|workflowFacts/,
    );
});
test('channel descriptions enforce membership, type, length, immutability on error; saved search is personal', () => {
  const state = taskSeed('saved-cleanup', 42);
  assert.deepEqual(
    searchMessages(state, 'is:saved')
      .map((m) => m.id)
      .sort(),
    ['handoff-distractor', 'incident-old'],
  );
  assert.throws(() =>
    transition(state, { type: 'channel.description', channelId: 'dm-sam', description: 'x' }, 1),
  );
  for (const description of ['', '  ', 'x'.repeat(501), null, 42])
    assert.throws(() =>
      transition(state, { type: 'channel.description', channelId: 'design', description }, 1),
    );
  const hidden = structuredClone(state);
  hidden.channels.find((c) => c.id === 'design').members = ['jordan'];
  assert.throws(() =>
    transition(hidden, { type: 'channel.description', channelId: 'design', description: 'x' }, 1),
  );
  assert.ok(searchMessages(hidden, 'navigation').every((m) => m.channelId !== 'design'));
  assert.equal(
    transition(
      state,
      { type: 'channel.description', channelId: 'design', description: 'New description' },
      1,
    ).channels.find((c) => c.id === 'design').description,
    'New description',
  );
});
test('workflow sessions reset to their versioned fixture and survive reopening without touching siblings', () => {
  const dir = mkdtempSync(join(tmpdir(), 'relay-workflow-store-'));
  try {
    const store = new Store(dir),
      a = store.create({ taskId: 'decision-record', seed: 43 }),
      b = store.create({ taskId: 'channel-topic' });
    store.action(a.token, {
      requestId: 'description-1',
      revision: 0,
      action: { type: 'channel.description', channelId: 'design', description: 'Changed' },
    });
    const reopened = new Store(dir);
    assert.equal(
      reopened.read(a.token).state.channels.find((c) => c.id === 'design').description,
      'Changed',
    );
    assert.deepEqual(reopened.reset(a.token).state, taskSeed('decision-record', 43));
    assert.deepEqual(reopened.read(b.token).state, makeSeed(42));
    assert.throws(
      () =>
        reopened.action(a.token, {
          requestId: 'stale-request',
          revision: 0,
          action: { type: 'save.toggle', id: 'qa-matrix' },
        }),
      /changed/,
    );
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
