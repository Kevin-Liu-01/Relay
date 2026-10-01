// Builder-informed reference, NEVER model inference. Only consumes actor-visible
// records. Kept independent of task contracts and fixture generators on purpose.
export function workflowPlan(task, state) {
  const { messages, channels } = state;
  const find = (prefix) => {
    const m = messages.find((m) => m.text.startsWith(prefix));
    if (!m) throw Error(`Reference missing visible record: ${prefix}`);
    return m;
  };
  const ch = (name) =>
    channels.find((c) => c.name === name || (name === 'project' && c.name.startsWith('proj-'))).id;
  const handoff = find('Current release handoff:');
  const [, owner, window, build] =
    handoff.text.match(
      /owner is (.+?)\. The release window is (.+?) UTC\. Approved build: (.+?)\./,
    ) ?? [];
  const qa = find('Final QA matrix:'),
    count = qa.text.match(/; (\d+) checks/)[1];
  const resolution = find('Resolution confirmed:'),
    latency = resolution.text.match(/p95 is (\d+) ms/)[1];
  const approval = find('Final approval:'),
    design = approval.text.match(/Final approval: (\w+) navigation/)[1];
  const estimate = find('Reviewed migration estimate:'),
    days = estimate.text.match(/estimate: (\d+) days/)[1];
  const request = messages.find(
    (m) => !m.parentId && m.text.includes('the release candidate is ready'),
  );
  const incident = messages.find((m) => !m.parentId && m.text.includes('elevated latency'));
  const toggle = (type, m, emoji) => ({ type, id: m.id, ...(emoji ? { emoji } : {}) });
  const pin = (m) => toggle('pin.toggle', m),
    save = (m) => toggle('save.toggle', m),
    react = (m, emoji = '✅') => toggle('reaction.toggle', m, emoji);
  const edit = (m, text) => ({ type: 'message.edit', id: m.id, text });
  const send = (name, text, parentId) => ({
    type: 'message.send',
    channelId: ch(name),
    text,
    ...(parentId ? { parentId } : {}),
  });
  const reply = (m, text) => ({
    type: 'message.send',
    channelId: m.channelId,
    parentId: m.id,
    text,
  });
  const topic = (name, topic) => ({ type: 'channel.topic', channelId: ch(name), topic });
  const description = (name, description) => ({
    type: 'channel.description',
    channelId: ch(name),
    description,
  });
  const decision = find('Navigation decision:');
  const announcement = `**Release ${build}**\n${count} checks passed. Rollback: ${owner}. Window: ${window} UTC.`;
  const plans = {
    'release-sync': [
      edit(
        find('Launch review is at'),
        `Launch review: ${build} at ${window} UTC; ${count} checks passed.`,
      ),
      topic('project', `Release ${build} · ${window} UTC`),
      reply(request, `QA verified: ${count} checks passed for ${build}.`),
      send(owner, `Please cover rollback for ${build} at ${window} UTC.`),
    ],
    'incident-closeout': [
      pin(find('INC-103')),
      pin(incident),
      react(incident),
      reply(incident, `Resolved: p95 ${latency} ms; error rate 0.1%.`),
      topic('incidents', `Search healthy · p95 ${latency} ms`),
    ],
    'saved-cleanup': [
      save(find('Yesterday’s draft')),
      save(find('INC-103')),
      save(handoff),
      save(qa),
      send('Sam Rivera', `Saved current handoff and QA for ${build}.`),
    ],
    'decision-record': [
      description('design', `Approved navigation: ${design}. Handoff: Leo Park.`),
      pin(decision),
      save(approval),
      reply(decision, `Decision recorded: ${design} navigation.`),
    ],
    'handoff-repair': [
      edit(
        find('Rollback owner: Jordan'),
        `Rollback owner: ${owner}. Release window: ${window} UTC.`,
      ),
      react(handoff),
      save(handoff),
    ],
    'qa-signoff': [
      reply(request, `QA sign-off: ${build}; ${count} checks; 0 blockers.`),
      react(request, '👀'),
      react(request),
      save(qa),
    ],
    'publish-update': [
      send('general', announcement),
      { type: 'search', query: `in:general from:me "Release ${build}"` },
      { type: 'pin.toggle', id: '$announcement' },
      { type: 'message.delete', id: find('Draft announcement — placeholder').id },
    ],
    'oncall-briefing': [
      send('Sam Rivera', `Search handoff: p95 ${latency} ms; error rate 0.1%.`),
      save(find('Current on-call:')),
      description('incidents', 'Primary on-call: Sam Rivera. Search handoff recorded.'),
    ],
    'thread-repair': [
      edit(find('Migration estimate: 8'), `Migration estimate: ${days} days. Approved.`),
      react(estimate),
      reply(find('Migration estimate: please'), `Estimate corrected to ${days} days.`),
    ],
    'pin-refresh': [
      pin(find('Previous release plan:')),
      pin(request),
      save(handoff),
      topic('project', `Launch board · ${build} · ${window} UTC`),
    ],
    'design-handoff': [
      react(approval),
      send('Leo Park', `Implement ${design} navigation; accessibility approved.`),
      reply(decision, `Handed off ${design} to Leo Park.`),
      save(decision),
    ],
    'release-retrospective': [
      reply(
        find('Release retrospective:'),
        `Build ${build}: ${count} checks passed; search p95 ${latency} ms.`,
      ),
      pin(find('Release retrospective:')),
      save(qa),
      save(resolution),
      send('Priya Shah', `Retrospective ready for ${build}.`),
      save(find('Yesterday’s draft')),
    ],
  };
  if (!plans[task]) throw Error('Unknown reference workflow.');
  return plans[task];
}

export function workflowReferenceAction(cell, observation, step, turns) {
  if (cell.mode !== 'api')
    throw Error('Workflow references use API; browser references live in the test suite.');
  if (!step) return { type: 'search', query: '' };
  const initial = turns[0].observation.result;
  const messages = step === 1 ? observation.result.messages : turns[1].observation.result.messages;
  const action = workflowPlan(cell.taskId, { ...initial, messages })[step - 1];
  if (!action) return { type: 'finish' };
  if (action.id === '$announcement') {
    if (observation.result.messages?.length !== 1)
      throw Error('Expected exactly one new announcement.');
    return { ...action, id: observation.result.messages[0].id };
  }
  return action;
}
