import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { buildTaskExpectation, expectationBackendHash } from '../hosted/task-expectations.mjs';
import {
  compareTaskRows,
  matchesExpectation,
  expectationKey,
} from '../src/live/task-comparison.mjs';
import { TASK_IDS, taskSpec, taskSeed, grade } from '../server/tasks.mjs';
import { WORKFLOW_IDS } from '../shared/task-catalog.mjs';
import { digest, transition } from '../server/domain.mjs';
import { solveWorkflow } from './helpers/workflow-cases.mjs';

const episode = (taskId, seed = 42) => ({
  cell: { taskId, seed, episodeId: 'episode-001' },
  instruction: taskSpec(taskId, seed).instruction,
  initialHash: digest(taskSeed(taskId, seed)),
  appProvenance: { backendHash: expectationBackendHash },
});
const legacy = {
  'channel-topic': [
    {
      type: 'channel.topic',
      channelId: 'project',
      topic: 'Launch review · 15:00 UTC · Bring the final checklist',
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
  'delete-draft': [{ type: 'message.delete', id: 'delete-target' }],
  'thread-reply': [
    {
      type: 'message.send',
      channelId: 'project',
      parentId: 'qa-target',
      text: 'QA checklist complete. Ready for review.',
    },
  ],
  'handoff-dm': [
    {
      type: 'message.send',
      channelId: 'dm-sam',
      text: 'Rollback owner: Priya Shah. Release window: 16:30 UTC.',
    },
  ],
};
for (const id of TASK_IDS)
  test(`observer requirements: ${id} agree with independent solutions`, () => {
    for (const seed of [42, 43, 1042]) {
      const e = episode(id, seed),
        contract = buildTaskExpectation(e);
      const baseline = taskSeed(id, seed),
        before = JSON.stringify(baseline);
      assert.ok(matchesExpectation(contract, e));
      assert.ok(compareTaskRows(contract, baseline).some((r) => r.status === 'different'));
      const final = WORKFLOW_IDS.includes(id)
        ? solveWorkflow(id, seed).state
        : legacy[id].reduce((state, action, i) => transition(state, action, i + 1), baseline);
      assert.equal(grade(id, seed, final).success, true);
      assert.ok(compareTaskRows(contract, final).every((r) => r.status === 'match'));
      assert.equal(JSON.stringify(baseline), before);
      for (const missing of [undefined, null, {}, { channels: [] }])
        assert.ok(compareTaskRows(contract, missing).every((r) => r.status === 'unknown'));
    }
  });

test('requirements bind task, seed, baseline, instruction, backend and grader version', () => {
  const e = episode('channel-topic'),
    contract = buildTaskExpectation(e);
  const variants = [
    { ...e, appProvenance: {} },
    { ...e, appProvenance: { backendHash: 'old' } },
    { ...e, initialHash: 'different' },
    { ...e, instruction: e.instruction + ' ' },
    { ...e, cell: { ...e.cell, seed: 43 } },
    { ...e, cell: { ...e.cell, taskId: 'unknown' } },
    { ...e, cell: { ...e.cell, seed: '42' } },
    { ...e, evaluation: { graderVersion: 'future' } },
    undefined,
  ];
  for (const changed of variants) {
    assert.equal(buildTaskExpectation(changed), null);
    assert.equal(matchesExpectation(contract, changed), false);
  }
  assert.equal(matchesExpectation(null, e), false);
});

test('comparisons reject wrong text, destinations, users, metadata and duplicate sends', () => {
  const id = 'release-sync',
    contract = buildTaskExpectation(episode(id));
  const final = solveWorkflow(id, 42).state;
  const isAdded = (m) => !contract.baselineMessageIds.includes(m.id);
  const mutate = (fn) => {
    const state = structuredClone(final);
    fn(state);
    assert.ok(compareTaskRows(contract, state).some((r) => r.status === 'different'));
  };
  for (const [key, value] of Object.entries({
    text: 'Wrong',
    channelId: 'random',
    parentId: 'wrong-thread',
    userId: 'sam',
    createdAt: 'invalid',
    id: 'invalid',
    editedAt: 'invalid',
    pinned: true,
    reactions: { '✅': ['sam'] },
    savedBy: ['sam'],
  }))
    mutate((s) => {
      s.messages.find(isAdded)[key] = value;
    });
  mutate((s) => {
    s.messages.find(isAdded).text += ' ';
  });
  mutate((s) => {
    s.messages.find((m) => m.id === 'launch-old').editedAt = 'invalid';
  });
  mutate((s) => {
    s.messages.push({ ...s.messages.find(isAdded), id: 'new-999' });
  });
  // This is not a regrader. Unrelated edits remain the saved grader's responsibility.
  const collateral = structuredClone(final);
  collateral.messages.find((m) => m.id === 'welcome').text = 'Unrequested';
  assert.ok(compareTaskRows(contract, collateral).every((r) => r.status === 'match'));
  assert.equal(grade(id, 42, collateral).success, false);
});

test('legacy post metadata remains no stricter than the original grader', () => {
  const e = episode('thread-reply'),
    contract = buildTaskExpectation(e);
  const state = transition(taskSeed('thread-reply', 42), legacy['thread-reply'][0], 1);
  const post = state.messages.find((m) => !contract.baselineMessageIds.includes(m.id));
  post.id = 'historical-custom-id';
  post.createdAt = 'legacy metadata';
  assert.equal(grade('thread-reply', 42, state).success, true);
  assert.ok(compareTaskRows(contract, state).every((r) => r.status === 'match'));
});

test('all 306 original trials have source-matched requirements; passed states agree', () => {
  const catalog = JSON.parse(readFileSync('evidence/trial-library/catalog.json'));
  const tasks = new Set(),
    keys = new Set();
  let checked = 0,
    passes = 0;
  for (const item of catalog.trials) {
    const record = JSON.parse(
      gunzipSync(readFileSync(`evidence/trial-library/${item.path.split('/').at(-1)}`)),
    );
    const before = JSON.stringify(record);
    for (const e of record.run.episodes) {
      const contract = buildTaskExpectation(e);
      assert.ok(contract, item.id);
      assert.ok(matchesExpectation(contract, e));
      const outcome = record.audit.episodes.find(
        (a) => a.episode.cell.episodeId === e.cell.episodeId,
      ).outcome;
      if (item.outcome === 'passed') {
        assert.ok(
          compareTaskRows(contract, outcome.state).every((r) => r.status === 'match'),
          item.id,
        );
        passes++;
      }
      tasks.add(e.cell.taskId);
      keys.add(expectationKey(e));
      checked++;
    }
    assert.equal(JSON.stringify(record), before);
  }
  assert.equal(checked, 306);
  assert.equal(passes, 152);
  assert.equal(tasks.size, 18);
  assert.equal(keys.size, 18);
});
