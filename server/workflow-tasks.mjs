import { makeWorkflowSeed, workflowFacts } from './workflow-seed.mjs';
import { digest, fail } from './domain.mjs';
import { WORKFLOW_IDS } from '../shared/task-catalog.mjs';

// Independent declarative final-state contracts, NOT calls to the mutation engine.
// Instructions expose formats, not the fixture-derived answers in `changes`.
export function workflowContract(id, seed) {
  fail(WORKFLOW_IDS.includes(id), 'Unknown workflow.', 404);
  const f = workflowFacts(seed),
    base = makeWorkflowSeed(seed);
  const project = base.channels.find((c) => c.id === 'project').name;
  const msg = (id, patch) => ({ kind: 'message', id, patch });
  const channel = (id, patch) => ({ kind: 'channel', id, patch });
  const post = (channelId, parentId, text, patch = {}) => ({
    kind: 'post',
    channelId,
    parentId,
    text,
    patch,
  });
  const contracts = {
    'release-sync': {
      instruction: `Coordinate the release in #${project}. Find the current release handoff and final QA matrix in #engineering. Edit your existing launch-review message to “Launch review: BUILD at TIME UTC; COUNT checks passed.” Set the project topic to “Release BUILD · TIME UTC”. Reply to Maya’s release-candidate request with “QA verified: COUNT checks passed for BUILD.” DM the rollback owner “Please cover rollback for BUILD at TIME UTC.” Substitute current facts in all four formats.`,
      changes: [
        msg('launch-old', {
          text: `Launch review: ${f.build} at ${f.window} UTC; ${f.checks} checks passed.`,
          editedAt: true,
        }),
        channel('project', { topic: `Release ${f.build} · ${f.window} UTC` }),
        post('project', 'qa-target', `QA verified: ${f.checks} checks passed for ${f.build}.`),
        post(
          f.owner === 'Maya Chen' ? 'dm-maya' : 'dm-priya',
          null,
          `Please cover rollback for ${f.build} at ${f.window} UTC.`,
        ),
      ],
    },
    'incident-closeout': {
      instruction:
        'Close out the elevated-latency incident in #incidents. Read Sam’s confirmed resolution in its thread, not the provisional reading. Unpin last week’s closed incident, pin the elevated-latency root, and add ✅ to that root. Reply in that thread “Resolved: p95 LATENCY ms; error rate RATE%.” Set the channel topic to “Search healthy · p95 LATENCY ms”. Substitute the confirmed values.',
      changes: [
        msg('incident-old', { pinned: false }),
        msg('incident-target', { pinned: true, reactions: { '✅': ['alex'] } }),
        post('incidents', 'incident-target', `Resolved: p95 ${f.latency} ms; error rate 0.1%.`),
        channel('incidents', { topic: `Search healthy · p95 ${f.latency} ms` }),
      ],
    },
    'saved-cleanup': {
      instruction: `Clean up your Later list: unsave yesterday’s superseded handoff and last week’s closed incident, but do not delete either message or change anyone else’s saved items. Save the current release handoff in #${project} and the final QA matrix in #engineering. DM Sam Rivera “Saved current handoff and QA for BUILD.” using the approved build.`,
      changes: [
        msg('handoff-distractor', { savedBy: ['sam'] }),
        msg('incident-old', { savedBy: [] }),
        msg('handoff-target', { savedBy: ['alex'] }),
        msg('qa-matrix', { savedBy: ['alex'] }),
        post('dm-sam', null, `Saved current handoff and QA for ${f.build}.`),
      ],
    },
    'decision-record': {
      instruction:
        'Read the Navigation decision thread in #design. Use Priya’s final approval, not the prototype vote. Set the channel description to “Approved navigation: DESIGN. Handoff: Leo Park.” Pin the decision root, save Priya’s approval reply, and reply in that same thread “Decision recorded: DESIGN navigation.” Substitute the approved design.',
      changes: [
        channel('design', { description: `Approved navigation: ${f.design}. Handoff: Leo Park.` }),
        msg('design-proposal', { pinned: true }),
        msg('design-approved', { savedBy: ['alex'] }),
        post('design', 'design-proposal', `Decision recorded: ${f.design} navigation.`),
      ],
    },
    'handoff-repair': {
      instruction: `Read the current release handoff in #${project}. In your DM with Sam Rivera, edit your existing rollback-owner message to “Rollback owner: FULL NAME. Release window: TIME UTC.” using current facts; do not send a replacement. Add ✅ to the source handoff and save it for later.`,
      changes: [
        msg('handoff-own', {
          text: `Rollback owner: ${f.owner}. Release window: ${f.window} UTC.`,
          editedAt: true,
        }),
        msg('handoff-target', { reactions: { '✅': ['alex'] }, savedBy: ['alex'] }),
      ],
    },
    'qa-signoff': {
      instruction: `In #${project}, complete Maya’s release-candidate request using the build in its thread and the final QA matrix in #engineering. Reply to that request “QA sign-off: BUILD; COUNT checks; 0 blockers.” Remove only your 👀 reaction from the request, add ✅, and save the final QA matrix. Leave Leo’s 👀 reaction intact.`,
      changes: [
        post('project', 'qa-target', `QA sign-off: ${f.build}; ${f.checks} checks; 0 blockers.`),
        msg('qa-target', { reactions: { '👀': ['leo'], '✅': ['alex'] } }),
        msg('qa-matrix', { savedBy: ['alex'] }),
      ],
    },
    'publish-update': {
      instruction: `Publish the approved release update in #general using the current handoff in #${project} and final QA matrix in #engineering. Send exactly “**Release BUILD**\nCOUNT checks passed. Rollback: FULL NAME. Window: TIME UTC.” (two lines, with bold markup on the first). Pin your new announcement. Delete only your placeholder-numbers draft in #engineering; keep the approved announcement.`,
      changes: [
        post(
          'general',
          null,
          `**Release ${f.build}**\n${f.checks} checks passed. Rollback: ${f.owner}. Window: ${f.window} UTC.`,
          { pinned: true },
        ),
        { kind: 'delete', id: 'delete-target' },
      ],
    },
    'oncall-briefing': {
      instruction:
        'Find the current on-call rotation in #engineering and the confirmed resolution in the elevated-latency incident’s thread. DM the primary on-call engineer (not the backup) “Search handoff: p95 LATENCY ms; error rate RATE%.” Save the current rotation message and set #incidents description to “Primary on-call: FULL NAME. Search handoff recorded.” Substitute current facts.',
      changes: [
        post('dm-sam', null, `Search handoff: p95 ${f.latency} ms; error rate 0.1%.`),
        msg('oncall-current', { savedBy: ['alex'] }),
        channel('incidents', {
          description: 'Primary on-call: Sam Rivera. Search handoff recorded.',
        }),
      ],
    },
    'thread-repair': {
      instruction:
        'In #engineering, read Maya’s reviewed migration estimate in the Migration estimate thread. Edit your existing reply to “Migration estimate: DAYS days. Approved.” Add ✅ to Maya’s reviewed estimate and reply once more in the same thread “Estimate corrected to DAYS days.” Use the reviewed value, not the 8-day draft.',
      changes: [
        msg('estimate-own', {
          text: `Migration estimate: ${f.estimate} days. Approved.`,
          editedAt: true,
        }),
        msg('estimate-approved', { reactions: { '✅': ['alex'] } }),
        post('engineering', 'estimate-root', `Estimate corrected to ${f.estimate} days.`),
      ],
    },
    'pin-refresh': {
      instruction: `Refresh the launch board in #${project}. Unpin the previous release plan, keep the current handoff pinned, and pin Maya’s release-candidate request. Save the current handoff. Set the topic to “Launch board · BUILD · TIME UTC” using the current handoff. Do not delete the old plan.`,
      changes: [
        msg('release-plan-old', { pinned: false }),
        msg('qa-target', { pinned: true }),
        msg('handoff-target', { savedBy: ['alex'] }),
        channel('project', { topic: `Launch board · ${f.build} · ${f.window} UTC` }),
      ],
    },
    'design-handoff': {
      instruction:
        'Read Priya’s final approval in the Navigation decision thread in #design. React ✅ to that approval reply, not the prototype vote. DM its named handoff recipient “Implement DESIGN navigation; accessibility approved.” Reply in the decision thread “Handed off DESIGN to Leo Park.” Save the decision root.',
      changes: [
        msg('design-approved', { reactions: { '✅': ['alex'] } }),
        post('dm-leo', null, `Implement ${f.design} navigation; accessibility approved.`),
        post('design', 'design-proposal', `Handed off ${f.design} to Leo Park.`),
        msg('design-proposal', { savedBy: ['alex'] }),
      ],
    },
    'release-retrospective': {
      instruction: `Prepare the Release retrospective in #${project}. Combine the current release handoff, final QA matrix in #engineering, and Sam’s confirmed incident-thread resolution. Reply under Priya’s retrospective request “Build BUILD: COUNT checks passed; search p95 LATENCY ms.” Pin that retrospective root. Save the QA matrix and confirmed resolution reply. DM Priya Shah “Retrospective ready for BUILD.” Remove your saved copy of the superseded handoff, keeping Sam’s saved copy.`,
      changes: [
        post(
          'project',
          'retro-request',
          `Build ${f.build}: ${f.checks} checks passed; search p95 ${f.latency} ms.`,
        ),
        msg('retro-request', { pinned: true }),
        msg('qa-matrix', { savedBy: ['alex'] }),
        msg('incident-resolution', { savedBy: ['alex'] }),
        post('dm-priya', null, `Retrospective ready for ${f.build}.`),
        msg('handoff-distractor', { savedBy: ['sam'] }),
      ],
    },
  };
  return {
    ...contracts[id],
    instruction: `${contracts[id].instruction} Make only these changes; preserve all other workspace state.`,
  };
}

export function gradeWorkflow(id, seed, final) {
  const baseline = makeWorkflowSeed(seed),
    expected = structuredClone(baseline);
  const checks = [],
    check = (name, passed) => checks.push({ name, passed: !!passed });
  const stamp = (v) =>
    typeof v === 'string' &&
    /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.000Z$/.test(v) &&
    Number.isFinite(Date.parse(v)) &&
    new Date(v).toISOString() === v &&
    Date.parse(v) > Date.parse(baseline.clock);
  if (!final || !Array.isArray(final.messages) || !Array.isArray(final.channels)) {
    check('valid_workspace', false);
  } else {
    const extras = final.messages.filter((m) => !baseline.messages.some((b) => b.id === m?.id));
    const posts = [];
    for (const [i, change] of workflowContract(id, seed).changes.entries()) {
      if (change.kind === 'post') {
        posts.push(change);
        continue;
      }
      if (change.kind === 'delete') {
        expected.messages = expected.messages.filter((m) => m.id !== change.id);
        check(`change_${i + 1}_deleted`, !final.messages.some((m) => m?.id === change.id));
        continue;
      }
      const collection = change.kind === 'message' ? 'messages' : 'channels';
      const observed = final[collection].find((m) => m?.id === change.id);
      const patch = structuredClone(change.patch);
      if (patch.editedAt === true) {
        check(`change_${i + 1}_edit_timestamp`, stamp(observed?.editedAt));
        patch.editedAt = observed?.editedAt ?? null;
      }
      Object.assign(
        expected[collection].find((m) => m.id === change.id),
        patch,
      );
      check(
        `change_${i + 1}_${change.id}`,
        observed &&
          Object.entries(patch).every(
            ([k, v]) => JSON.stringify(canonical(observed[k])) === JSON.stringify(canonical(v)),
          ),
      );
    }
    check('exact_new_message_count', extras.length === posts.length);
    const remaining = [...posts];
    for (const m of extras) {
      const index = remaining.findIndex(
        (p) => m?.channelId === p.channelId && m?.parentId === p.parentId && m?.text === p.text,
      );
      const p = remaining[index];
      check('new_message_destination_and_content', !!p);
      check(
        'new_message_metadata',
        /^new-[1-9]\d*$/.test(m?.id) &&
          stamp(m?.createdAt) &&
          Number.isSafeInteger(Number(m.id.slice(4))) &&
          Date.parse(m.createdAt) === Date.parse(baseline.clock) + Number(m.id.slice(4)) * 1000,
      );
      if (p) {
        remaining.splice(index, 1);
        expected.messages.push({
          id: m.id,
          channelId: p.channelId,
          userId: baseline.currentUserId,
          text: p.text,
          parentId: p.parentId,
          createdAt: m.createdAt,
          editedAt: null,
          reactions: {},
          pinned: false,
          savedBy: [],
          ...p.patch,
        });
      }
    }
    check('all_requested_messages', remaining.length === 0);
    check(
      'unique_message_ids',
      new Set(final.messages.map((m) => m?.id)).size === final.messages.length,
    );
    // Canonicalize object keys and set-valued collections, not text, IDs or metadata.
    check(
      'no_unrequested_state_changes',
      JSON.stringify(canonical(expected)) === JSON.stringify(canonical(final)),
    );
  }
  const success = checks.every((c) => c.passed);
  return {
    taskId: id,
    seed,
    success,
    reward: success ? 1 : 0,
    checks,
    baselineHash: digest(baseline),
    finalHash: digest(final ?? null),
    graderVersion: 'workflow-state-v2',
  };
}
function canonical(value) {
  if (Array.isArray(value))
    return value.map(canonical).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  return value;
}
