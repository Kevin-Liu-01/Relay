// Public metadata only. Never import fixtures, solutions or graders into the UI.
export const TASK_CATALOG = [
  ['channel-topic', 'Update a topic', 'Basics', true],
  ['thread-reply', 'Reply in a thread', 'Basics', true],
  ['edit-message', 'Edit a message', 'Basics', true],
  ['incident-triage', 'Triage an incident', 'Basics', true],
  ['delete-draft', 'Delete a draft', 'Basics', true],
  ['handoff-dm', 'Send a handoff', 'Basics', false],
  ['release-sync', 'Coordinate a release', 'Workflows', false],
  ['incident-closeout', 'Close out an incident', 'Workflows', false],
  ['saved-cleanup', 'Refresh saved work', 'Workflows', false],
  ['decision-record', 'Record a design decision', 'Workflows', false],
  ['handoff-repair', 'Repair an outdated handoff', 'Workflows', false],
  ['qa-signoff', 'Complete a QA sign-off', 'Workflows', false],
  ['publish-update', 'Publish a release update', 'Workflows', false],
  ['oncall-briefing', 'Brief the on-call engineer', 'Workflows', false],
  ['thread-repair', 'Correct a threaded estimate', 'Workflows', false],
  ['pin-refresh', 'Refresh the launch board', 'Workflows', false],
  ['design-handoff', 'Hand off an approved design', 'Workflows', false],
  ['release-retrospective', 'Prepare a release retrospective', 'Workflows', false],
].map(([id, label, family, supportsChoice]) => ({ id, label, family, supportsChoice }));
export const TASK_LABELS = Object.fromEntries(TASK_CATALOG.map((t) => [t.id, t.label]));
export const WORKFLOW_IDS = TASK_CATALOG.filter((t) => t.family === 'Workflows').map((t) => t.id);
export const supportsChoice = (id) => TASK_CATALOG.some((t) => t.id === id && t.supportsChoice);
