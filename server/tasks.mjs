import { makeSeed } from './seed.mjs';
import { digest, fail } from './domain.mjs';
import { WORKFLOW_IDS } from '../shared/task-catalog.mjs';
import { makeWorkflowSeed } from './workflow-seed.mjs';
import { workflowContract, gradeWorkflow } from './workflow-tasks.mjs';
export const LEGACY_TASK_IDS = [
  'thread-reply',
  'edit-message',
  'incident-triage',
  'handoff-dm',
  'delete-draft',
  'channel-topic',
];
export const TASK_IDS = [...LEGACY_TASK_IDS, ...WORKFLOW_IDS];
export const taskSeed = (id, seed) =>
  WORKFLOW_IDS.includes(id) ? makeWorkflowSeed(seed) : makeSeed(seed);
export function taskSpec(id, seed) {
  fail(TASK_IDS.includes(id), 'Unknown task.', 404);
  if (WORKFLOW_IDS.includes(id))
    return {
      id,
      seed,
      instruction: workflowContract(id, seed).instruction,
      maxSteps: 80,
      fixtureVersion: 'northstar-workflows-v2',
      graderVersion: 'workflow-state-v2',
    };
  const s = makeSeed(seed),
    c = s.channels.find((c) => c.id === 'project'),
    target = s.messages.find((m) => m.id === 'qa-target');
  const code = target.text.split(':')[0];
  const instructions = {
    'thread-reply': `In #${c.name}, find Maya Chen’s release-candidate request for ${code}. Reply in that message’s thread with exactly: “QA checklist complete. Ready for review.” Leave everything else unchanged.`,
    'edit-message': `In #${c.name}, correct your (Alex Morgan’s) launch-review message to say “Launch review is at 15:00 UTC. Please bring the final checklist.” Edit the existing message; do not send a replacement or change anyone else’s message.`,
    'incident-triage': `In #incidents, find Sam Rivera’s elevated-latency incident update (not last week’s closed incident). Add a ✅ reaction and pin that message. Make no other changes.`,
    'handoff-dm': `Find Sam Rivera’s current handoff details for ${code} in #${c.name}. Send Sam a direct message in this exact format, substituting the current details: “Rollback owner: FULL NAME. Release window: TIME UTC.” Send only one message and make no other changes.`,
    'delete-draft':
      'In #engineering, delete your own draft announcement with placeholder numbers. Keep the approved announcement and everything else unchanged.',
    'channel-topic': `Set the topic of #${c.name} to exactly “Launch review · 15:00 UTC · Bring the final checklist”. Make no other changes.`,
  };
  return { id, seed, instruction: instructions[id], maxSteps: 60 };
}

export function grade(id, seed, final) {
  if (WORKFLOW_IDS.includes(id)) return gradeWorkflow(id, seed, final);
  const baseline = makeSeed(seed),
    expected = structuredClone(baseline);
  const checks = [];
  const check = (name, passed) => checks.push({ name, passed: !!passed });
  const extras = final.messages.filter((m) => !baseline.messages.some((b) => b.id === m.id));
  if (id === 'thread-reply' || id === 'handoff-dm') {
    check('exactly_one_new_message', extras.length === 1);
    const m = extras[0];
    const desired =
      id === 'thread-reply'
        ? {
            channelId: 'project',
            parentId: 'qa-target',
            text: 'QA checklist complete. Ready for review.',
          }
        : {
            channelId: 'dm-sam',
            parentId: null,
            text: 'Rollback owner: Priya Shah. Release window: 16:30 UTC.',
          };
    check(
      'correct_message_and_destination',
      m && m.userId === 'alex' && Object.entries(desired).every(([k, v]) => m[k] === v),
    );
    // Validate all properties of the added message, not only the target text.
    if (m)
      expected.messages.push({
        ...m,
        ...desired,
        userId: 'alex',
        pinned: false,
        reactions: {},
        savedBy: [],
        editedAt: null,
      });
  } else if (id === 'edit-message') {
    const m = final.messages.find((m) => m.id === 'launch-old');
    check(
      'edited_original',
      m?.text === 'Launch review is at 15:00 UTC. Please bring the final checklist.' &&
        !!m.editedAt,
    );
    Object.assign(
      expected.messages.find((m) => m.id === 'launch-old'),
      {
        text: 'Launch review is at 15:00 UTC. Please bring the final checklist.',
        editedAt: m?.editedAt ?? null,
      },
    );
  } else if (id === 'incident-triage') {
    const m = final.messages.find((m) => m.id === 'incident-target');
    check('acknowledged', m?.reactions['✅']?.includes('alex'));
    check('pinned', m?.pinned);
    Object.assign(
      expected.messages.find((m) => m.id === 'incident-target'),
      { pinned: true, reactions: { '✅': ['alex'] } },
    );
  } else if (id === 'delete-draft') {
    check('draft_deleted', !final.messages.some((m) => m.id === 'delete-target'));
    expected.messages = expected.messages.filter((m) => m.id !== 'delete-target');
  } else if (id === 'channel-topic') {
    const topic = 'Launch review · 15:00 UTC · Bring the final checklist';
    check('topic_correct', final.channels.find((c) => c.id === 'project')?.topic === topic);
    expected.channels.find((c) => c.id === 'project').topic = topic;
  } else fail(false, 'Unknown task.', 404);
  check('no_unrequested_state_changes', digest(expected) === digest(final));
  const success = checks.every((c) => c.passed);
  return {
    taskId: id,
    seed,
    success,
    reward: success ? 1 : 0,
    checks,
    baselineHash: digest(baseline),
    finalHash: digest(final),
    graderVersion: 'state-contract-v1',
  };
}
