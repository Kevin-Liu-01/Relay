// Builder-informed deterministic references. Not model evaluation or training.
export function referenceAction(cell, observation, step, turns = []) {
  const { taskId, mode } = cell;
  if (mode !== 'api') {
    if (taskId !== 'channel-topic' || mode === 'pixels')
      throw Error('This scripted reference supports API tasks and text-UI channel-topic only.');
    const names = ['Edit channel topic', 'Channel topic', 'Save'];
    if (step >= 3) return { type: 'finish' };
    const e = observation.elements.find((e) => e.name === names[step]);
    if (!e) throw Error(`Reference could not find ${names[step]}.`);
    return step === 1
      ? { type: 'fill', ref: e.ref, text: 'Launch review · 15:00 UTC · Bring the final checklist' }
      : { type: 'click', ref: e.ref };
  }
  const r = observation.result;
  if (step === 0) {
    const channel = r.channels.find((c) =>
      taskId === 'incident-triage'
        ? c.name === 'incidents'
        : taskId === 'delete-draft'
          ? c.name === 'engineering'
          : c.name.startsWith('proj-'),
    );
    if (taskId === 'channel-topic')
      return {
        type: 'channel.topic',
        channelId: channel.id,
        topic: 'Launch review · 15:00 UTC · Bring the final checklist',
      };
    return { type: 'messages', channelId: channel.id };
  }
  if (
    taskId === 'channel-topic' ||
    step >= (taskId === 'incident-triage' ? 4 : taskId === 'handoff-dm' ? 3 : 2)
  )
    return { type: 'finish' };
  if (taskId === 'incident-triage') {
    if (step === 1)
      return {
        type: 'reaction.toggle',
        id: r.messages.find((m) => /elevated.latency/i.test(m.text)).id,
        emoji: '✅',
      };
    if (step === 2) return { type: 'search', query: 'in:incidents elevated' };
    return { type: 'pin.toggle', id: r.messages[0].id };
  }
  if (taskId === 'thread-reply') {
    const m = r.messages.find(
      (m) => /release.candidate/i.test(m.text) && /QA checklist/i.test(m.text) && !m.parentId,
    );
    return {
      type: 'message.send',
      channelId: m.channelId,
      parentId: m.id,
      text: 'QA checklist complete. Ready for review.',
    };
  }
  if (taskId === 'edit-message')
    return {
      type: 'message.edit',
      id: r.messages.find((m) => m.text.startsWith('Launch review is at')).id,
      text: 'Launch review is at 15:00 UTC. Please bring the final checklist.',
    };
  if (taskId === 'delete-draft')
    return { type: 'message.delete', id: r.messages.find((m) => /placeholder/i.test(m.text)).id };
  if (taskId === 'handoff-dm') {
    if (step === 1) return { type: 'channels' };
    const fact = turns
      .at(-1)
      .observation.result.messages.find((m) => m.text.startsWith('Handoff for '));
    const match = fact.text.match(/rollback owner is ([^.]+)\. The release window is ([\d:]+) UTC/);
    if (!match) throw Error('Could not extract current handoff facts.');
    const sam = r.users.find((u) => u.name === 'Sam Rivera');
    const dm = r.channels.find((c) => c.kind === 'dm' && c.members.includes(sam.id));
    return {
      type: 'message.send',
      channelId: dm.id,
      text: `Rollback owner: ${match[1]}. Release window: ${match[2]} UTC.`,
    };
  }
  throw Error('No scripted reference for this task. Select a live model.');
}
