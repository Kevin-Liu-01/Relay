import { makeSeed } from './seed.mjs';

// Separate version: the six original tasks and their historical evidence stay v1.
export function workflowFacts(seed) {
  return {
    owner: seed % 2 ? 'Maya Chen' : 'Priya Shah',
    window: seed % 2 ? '18:15' : '16:30',
    build: `rc-${310 + (seed % 41)}`,
    checks: 24 + (seed % 7),
    latency: 80 + (seed % 23),
    design: seed % 2 ? 'Cedar' : 'Willow',
    estimate: seed % 2 ? '5' : '3',
  };
}
export function makeWorkflowSeed(seed) {
  const s = makeSeed(seed),
    f = workflowFacts(seed);
  s.fixtureVersion = 'northstar-workflows-v2';
  // Sam authored the source handoff; make membership consistent in v2 only.
  s.channels.find((c) => c.id === 'project').members.push('sam');
  const message = (id) => s.messages.find((m) => m.id === id);
  const add = (id, channelId, userId, text, extra = {}) =>
    s.messages.push({
      id,
      channelId,
      userId,
      text,
      parentId: null,
      createdAt: new Date(
        Date.parse(s.clock) - 60000 * (40 - (s.messages.length - 36)),
      ).toISOString(),
      editedAt: null,
      reactions: {},
      pinned: false,
      savedBy: [],
      ...extra,
    });
  message('handoff-target').text =
    `Current release handoff: rollback owner is ${f.owner}. The release window is ${f.window} UTC. Approved build: ${f.build}. This replaces yesterday’s draft.`;
  message('handoff-target').pinned = true;
  message('handoff-target').createdAt = '2026-09-29T09:35:00.000Z';
  message('handoff-distractor').savedBy = ['alex', 'sam'];
  message('incident-old').pinned = true;
  message('incident-old').savedBy = ['alex'];
  message('qa-target').reactions['👀'].push('alex');
  add(
    'release-plan-old',
    'project',
    'maya',
    'Previous release plan: build rc-299, window 17:00 UTC. Superseded; keep this message for the record.',
    { pinned: true },
  );
  add(
    'qa-matrix',
    'engineering',
    'leo',
    `Final QA matrix: build ${f.build}; ${f.checks} checks passed; 0 blockers. The archived matrix below is not current.`,
  );
  add(
    'qa-matrix-old',
    'engineering',
    'leo',
    'Archived QA matrix: build rc-299; 12 checks passed; 2 blockers. Historical reference only.',
  );
  add(
    'qa-proof',
    'project',
    'leo',
    `Verified release build ${f.build}. The final check count is in #engineering.`,
    { parentId: 'qa-target' },
  );
  add(
    'incident-resolution',
    'incidents',
    'sam',
    `Resolution confirmed: search p95 is ${f.latency} ms; error rate 0.1%. Search service is healthy.`,
    { parentId: 'incident-target' },
  );
  add(
    'incident-provisional',
    'incidents',
    'maya',
    'Earlier provisional reading: p95 240 ms; error rate 1.2%. Superseded by Sam’s resolution.',
    { parentId: 'incident-target' },
  );
  add(
    'design-proposal',
    'design',
    'jordan',
    'Navigation decision: Willow or Cedar? Final approval will be in this thread. Do not use the prototype vote.',
  );
  add(
    'design-approved',
    'design',
    'priya',
    `Final approval: ${f.design} navigation. Accessibility reviewed; handoff to Leo Park.`,
    { parentId: 'design-proposal' },
  );
  add(
    'design-prototype',
    'design',
    'jordan',
    `Prototype only: ${f.design === 'Willow' ? 'Cedar' : 'Willow'} navigation. Not approved.`,
    { parentId: 'design-proposal' },
  );
  add(
    'estimate-root',
    'engineering',
    'maya',
    'Migration estimate: please keep the current estimate in this thread.',
  );
  add('estimate-own', 'engineering', 'alex', 'Migration estimate: 8 days. Pending review.', {
    parentId: 'estimate-root',
  });
  add(
    'estimate-approved',
    'engineering',
    'maya',
    `Reviewed migration estimate: ${f.estimate} days. Approved; replaces the 8-day draft.`,
    { parentId: 'estimate-root' },
  );
  add(
    'oncall-current',
    'engineering',
    'maya',
    'Current on-call: Sam Rivera, Site reliability. Backup: Leo Park. Contact the primary, not the backup.',
  );
  add('oncall-old', 'engineering', 'maya', 'Previous on-call: Leo Park. This rotation has ended.');
  add('handoff-own', 'dm-sam', 'alex', 'Rollback owner: Jordan Lee. Release window: 17:00 UTC.');
  add(
    'retro-request',
    'project',
    'priya',
    'Release retrospective: reply here with the approved build, final QA count, and resolved search latency. Keep source messages intact.',
  );
  s.messages.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return s;
}
