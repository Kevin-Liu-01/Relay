// Observer-only projection. Never import this module into an actor or provider input.
import { readFileSync } from 'node:fs';
import { taskSpec, taskSeed, grade } from '../server/tasks.mjs';
import { workflowContract } from '../server/workflow-tasks.mjs';
import { WORKFLOW_IDS } from '../shared/task-catalog.mjs';
import { digest } from '../server/domain.mjs';

// Same source receipt as the actor service. A changed backend must not silently
// provide new answers for recordings produced by a different task implementation.
export const expectationBackendHash = digest(
  [
    'server/server.mjs',
    'server/store.mjs',
    'server/domain.mjs',
    'server/seed.mjs',
    'server/tasks.mjs',
    'server/workflow-seed.mjs',
    'server/workflow-tasks.mjs',
    'shared/task-catalog.mjs',
    'shared/workspace.mjs',
    'runner/protocol.mjs',
  ].map((path) => [path, readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')]),
);

export function buildTaskExpectation(episode) {
  const { taskId, seed } = episode?.cell ?? {};
  if (!Number.isSafeInteger(seed) || episode?.appProvenance?.backendHash !== expectationBackendHash)
    return null;
  let spec, baseline;
  try {
    spec = taskSpec(taskId, seed);
    baseline = taskSeed(taskId, seed);
  } catch {
    return null;
  }
  const baselineHash = digest(baseline);
  const graderVersion = grade(taskId, seed, baseline).graderVersion;
  if (
    episode.initialHash !== baselineHash ||
    episode.instruction !== spec.instruction ||
    (episode.evaluation && episode.evaluation.graderVersion !== graderVersion)
  )
    return null;
  const legacy = {
    'channel-topic': [
      {
        kind: 'channel',
        id: 'project',
        patch: { topic: 'Launch review · 15:00 UTC · Bring the final checklist' },
      },
    ],
    'edit-message': [
      {
        kind: 'message',
        id: 'launch-old',
        patch: {
          text: 'Launch review is at 15:00 UTC. Please bring the final checklist.',
          editedAt: true,
        },
      },
    ],
    'incident-triage': [
      {
        kind: 'message',
        id: 'incident-target',
        patch: { reactions: { '✅': ['alex'] }, pinned: true },
      },
    ],
    'delete-draft': [{ kind: 'delete', id: 'delete-target' }],
    'thread-reply': [
      {
        kind: 'post',
        channelId: 'project',
        parentId: 'qa-target',
        text: 'QA checklist complete. Ready for review.',
      },
    ],
    'handoff-dm': [
      {
        kind: 'post',
        channelId: 'dm-sam',
        parentId: null,
        text: 'Rollback owner: Priya Shah. Release window: 16:30 UTC.',
      },
    ],
  };
  const changes = WORKFLOW_IDS.includes(taskId)
    ? workflowContract(taskId, seed).changes
    : legacy[taskId];
  const names = Object.fromEntries(baseline.users.map((u) => [u.id, u.name]));
  const location = (id, parentId) => {
    const channel = baseline.channels.find((c) => c.id === id);
    return `${channel?.kind === 'dm' ? 'DM: ' : '#'}${channel?.name ?? id}${parentId ? ' · thread reply' : ''}`;
  };
  const context = (id) => {
    const m = baseline.messages.find((m) => m.id === id);
    return m ? `${names[m.userId]}: ${m.text}` : '';
  };
  const labels = {
    text: 'Message text',
    topic: 'Channel topic',
    description: 'Channel description',
    pinned: 'Pinned',
    reactions: 'Reactions',
    savedBy: 'Saved by',
    editedAt: 'Edit recorded',
  };
  const rows = changes.flatMap((change, index) => {
    if (change.kind === 'post')
      return [
        {
          id: `post-${index}`,
          kind: 'post',
          label: 'New message',
          location: location(change.channelId, change.parentId),
          context: context(change.parentId),
          expected: {
            channelId: change.channelId,
            parentId: change.parentId,
            text: change.text,
            userId: baseline.currentUserId,
            pinned: false,
            savedBy: [],
            reactions: {},
            editedAt: null,
            ...change.patch,
          },
        },
      ];
    const collection = change.kind === 'channel' ? 'channels' : 'messages';
    const target = baseline[collection].find((m) => m.id === change.id);
    const common = {
      collection,
      targetId: change.id,
      location: location(collection === 'channels' ? change.id : target.channelId, target.parentId),
      context: collection === 'messages' ? context(change.id) : '',
    };
    if (change.kind === 'delete')
      return [
        {
          ...common,
          id: `delete-${index}`,
          kind: 'delete',
          label: 'Delete message',
          expected: null,
        },
      ];
    return Object.entries(change.patch).map(([field, expected]) => ({
      ...common,
      id: `${index}-${field}`,
      kind: 'field',
      field,
      label: labels[field],
      expected,
    }));
  });
  rows.push({
    id: 'message-count',
    kind: 'count',
    label: 'New messages',
    expected: changes.filter((c) => c.kind === 'post').length,
  });
  return {
    schema: 'relay-task-expectation-v1',
    taskId,
    seed,
    baselineHash,
    graderVersion,
    backendHash: expectationBackendHash,
    instruction: spec.instruction,
    clock: baseline.clock,
    baselineMessageIds: baseline.messages.map((m) => m.id),
    names,
    rows,
  };
}
