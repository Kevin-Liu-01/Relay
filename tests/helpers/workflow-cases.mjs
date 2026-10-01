import { taskSeed } from '../../server/tasks.mjs';
import { transition } from '../../server/domain.mjs';
import { workflowPlan } from '../../runner/workflow-reference.mjs';

export function solveWorkflow(id, seed, omitted = -1) {
  let state = taskSeed(id, seed),
    serial = 0;
  const actions = workflowPlan(id, state).filter((a) => a.type !== 'search');
  for (const [i, original] of actions.entries()) {
    if (i === omitted) continue;
    const action = { ...original };
    if (action.id === '$announcement') {
      const announcement = state.messages.find((m) => /^new-\d+$/.test(m.id));
      if (!announcement) continue;
      action.id = announcement.id;
    }
    state = transition(state, action, ++serial);
  }
  return { state, actions };
}

export function workflowChallenges(id, seed) {
  const baseline = taskSeed(id, seed),
    { state, actions } = solveWorkflow(id, seed);
  const cases = [{ name: 'untouched baseline', state: baseline }];
  for (let i = 0; i < actions.length; i++)
    cases.push({ name: `omit required action ${i + 1}`, state: solveWorkflow(id, seed, i).state });
  const mutate = (name, fn) => {
    const bad = structuredClone(state);
    fn(bad);
    cases.push({ name, state: bad });
  };
  mutate('unrequested message', (s) =>
    s.messages.push({
      ...baseline.messages[0],
      id: 'new-900',
      text: 'Done',
      createdAt: '2026-09-29T10:15:00.000Z',
    }),
  );
  mutate('collateral deletion', (s) => {
    s.messages = s.messages.filter((m) => m.id !== 'welcome');
  });
  mutate('collateral edit', (s) => {
    s.messages.find((m) => m.id === 'welcome').text = 'Done';
  });
  mutate('collateral reaction', (s) => {
    s.messages.find((m) => m.id === 'welcome').reactions['✅'] = ['alex'];
  });
  mutate('collateral save', (s) => {
    s.messages.find((m) => m.id === 'welcome').savedBy.push('alex');
  });
  mutate('collateral topic', (s) => {
    s.channels.find((c) => c.id === 'random').topic = 'Done';
  });
  mutate('changed actor', (s) => {
    s.currentUserId = 'sam';
  });
  mutate('changed membership', (s) => {
    s.channels[0].members.pop();
  });
  mutate('extra state field', (s) => {
    s.success = true;
  });
  mutate('browser success claim without work', (s) => {
    Object.assign(s, structuredClone(baseline), { success: true, reward: 1 });
  });
  mutate('duplicate existing ID', (s) => {
    s.messages.push(structuredClone(s.messages[0]));
  });
  for (const m of state.messages.filter((m) => /^new-\d+$/.test(m.id))) {
    const change = (name, fn) =>
      mutate(`${m.id}: ${name}`, (s) =>
        fn(
          s.messages.find((x) => x.id === m.id),
          s,
        ),
      );
    change('wrong author', (x) => {
      x.userId = 'sam';
    });
    change('wrong conversation', (x) => {
      x.channelId = x.channelId === 'random' ? 'general' : 'random';
    });
    change('wrong thread', (x) => {
      x.parentId = x.parentId ? null : 'coffee';
    });
    change('wrong text', (x) => {
      x.text += ' ';
    });
    change('extra metadata', (x) => {
      x.injected = true;
    });
    change('invalid ID', (x) => {
      x.id = 'pretend';
    });
    change('invalid timestamp', (x) => {
      x.createdAt = 'not-a-date';
    });
    change('backdated timestamp', (x) => {
      x.createdAt = baseline.clock;
    });
    change('timestamp inconsistent with ID', (x) => {
      x.createdAt = new Date(Date.parse(x.createdAt) + 1000).toISOString();
    });
    change('unrequested edit', (x) => {
      x.editedAt = x.createdAt;
    });
    change('duplicate send', (x, s) => {
      s.messages.push({ ...structuredClone(x), id: 'new-999' });
    });
  }
  for (const m of state.messages.filter((m) => m.editedAt)) {
    mutate(`${m.id}: missing edit stamp`, (s) => {
      s.messages.find((x) => x.id === m.id).editedAt = null;
    });
    mutate(`${m.id}: invalid edit stamp`, (s) => {
      s.messages.find((x) => x.id === m.id).editedAt = 'invalid';
    });
    mutate(`${m.id}: replace instead of edit`, (s) => {
      const target = s.messages.find((x) => x.id === m.id);
      Object.assign(target, structuredClone(baseline.messages.find((x) => x.id === m.id)));
      s.messages.push({
        ...structuredClone(m),
        id: 'new-999',
        editedAt: null,
        createdAt: '2026-09-29T10:15:00.000Z',
      });
    });
  }
  // Put every final-state change on a decoy instead of the requested record.
  for (const m of state.messages.filter((m) =>
    baseline.messages.some((b) => b.id === m.id && JSON.stringify(b) !== JSON.stringify(m)),
  )) {
    mutate(`${m.id}: wrong target`, (s) => {
      const old = baseline.messages.find((b) => b.id === m.id),
        changed = s.messages.find((x) => x.id === m.id);
      const decoy = s.messages.find((x) => x.id === 'welcome');
      for (const key of ['text', 'pinned', 'savedBy', 'reactions', 'editedAt'])
        if (JSON.stringify(old[key]) !== JSON.stringify(changed[key]))
          decoy[key] = structuredClone(changed[key]);
      Object.assign(changed, structuredClone(old));
    });
  }
  return cases;
}
