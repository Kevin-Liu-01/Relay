export const SELF = 'alex';
export const FIXTURE_VERSION = 'northstar-v1';
export function makeSeed(seed = 42) {
  const projects = ['atlas', 'aurora', 'meridian', 'orbit'];
  const project = projects[((seed % 4) + 4) % 4];
  const code = `${project.toUpperCase()}-${241 + (seed % 97)}`;
  const users = [
    {
      id: 'alex',
      name: 'Alex Morgan',
      handle: 'alex',
      role: 'Product engineer',
      color: '#d4e5fa',
      initials: 'AM',
      status: 'online',
    },
    {
      id: 'maya',
      name: 'Maya Chen',
      handle: 'maya',
      role: 'Engineering lead',
      color: '#f3d3bd',
      initials: 'MC',
      status: 'online',
    },
    {
      id: 'jordan',
      name: 'Jordan Lee',
      handle: 'jordan',
      role: 'Product designer',
      color: '#dcd4f2',
      initials: 'JL',
      status: 'online',
    },
    {
      id: 'sam',
      name: 'Sam Rivera',
      handle: 'sam',
      role: 'Site reliability',
      color: '#cce7d5',
      initials: 'SR',
      status: 'away',
    },
    {
      id: 'priya',
      name: 'Priya Shah',
      handle: 'priya',
      role: 'Product manager',
      color: '#f2d7e3',
      initials: 'PS',
      status: 'online',
    },
    {
      id: 'leo',
      name: 'Leo Park',
      handle: 'leo',
      role: 'Frontend engineer',
      color: '#f1e1ac',
      initials: 'LP',
      status: 'away',
    },
  ];
  const channels = [
    {
      id: 'general',
      name: 'general',
      topic: 'The company living room. Updates, ideas, and a little everyday magic.',
      description: 'A place for everyone at Northstar.',
      kind: 'channel',
      members: users.map((u) => u.id),
    },
    {
      id: 'project',
      name: `proj-${project}`,
      topic: 'Building a calmer way to work. Launch planning and product decisions.',
      description: 'Our next big thing, built together.',
      kind: 'channel',
      members: ['alex', 'maya', 'jordan', 'priya', 'leo'],
    },
    {
      id: 'engineering',
      name: 'engineering',
      topic: 'Ship thoughtfully. Share what you learn.',
      description: 'Engineering discussion and weekly updates.',
      kind: 'channel',
      members: users.map((u) => u.id),
    },
    {
      id: 'design',
      name: 'design',
      topic: 'Details make the difference.',
      description: 'Work in progress, inspiration, and critique.',
      kind: 'channel',
      members: ['alex', 'jordan', 'priya', 'leo'],
    },
    {
      id: 'incidents',
      name: 'incidents',
      topic: 'Operational updates · Current status: all systems healthy',
      description: 'Incident coordination and follow-ups.',
      kind: 'channel',
      members: ['alex', 'maya', 'sam'],
    },
    {
      id: 'random',
      name: 'random',
      topic: 'A little off topic is a good thing.',
      description: 'Coffee, good reads, and weekend plans.',
      kind: 'channel',
      members: users.map((u) => u.id),
    },
    ...users
      .filter((u) => u.id !== SELF)
      .map((u) => ({
        id: `dm-${u.id}`,
        name: u.name,
        topic: u.role,
        description: '',
        kind: 'dm',
        members: [SELF, u.id],
      })),
  ];
  let offset = 0;
  const messages = [];
  const add = (id, channelId, userId, text, extra = {}) => {
    messages.push({
      id,
      channelId,
      userId,
      text,
      parentId: null,
      createdAt: new Date(Date.UTC(2026, 8, 28, 9, 0) + offset++ * 180000).toISOString(),
      editedAt: null,
      reactions: {},
      pinned: false,
      savedBy: [],
      ...extra,
    });
  };
  add(
    'welcome',
    'general',
    'priya',
    'Good morning, team! ☀️ A new week, a fresh notebook, and a few things worth sharing.',
  );
  add(
    'weekly',
    'general',
    'maya',
    'This week: make the small things feel great. The product review is Friday — drop your demos in the project channel.',
    { reactions: { '🙌': ['alex', 'jordan', 'leo'] } },
  );
  add(
    'coffee',
    'general',
    'jordan',
    'Starting a little ritual: what’s one thing you shipped last week that you’re proud of?',
  );
  add(
    'coffee-reply',
    'general',
    'leo',
    'Keyboard navigation for the new command menu. Small detail, big difference.',
    { parentId: 'coffee' },
  );
  add(
    'new-team',
    'general',
    'sam',
    'The new observability dashboard is live. Fewer tabs, clearer signals. Happy to give anyone a tour.',
    { reactions: { '🎉': ['maya', 'priya'] } },
  );
  add(
    'project-intro',
    'project',
    'priya',
    `Welcome to #proj-${project}. This is where the next chapter comes together. Design, engineering, and launch — all in one place.`,
  );
  add(
    'design-ready',
    'project',
    'jordan',
    'The refreshed navigation is ready for a look. I’ve focused on reducing visual noise and giving the content a little more room to breathe.',
    { reactions: { '✨': ['maya', 'alex'] } },
  );
  add(
    'design-reply',
    'project',
    'alex',
    'Love the direction. The quieter sidebar makes a real difference.',
    { parentId: 'design-ready' },
  );
  add('design-reply-2', 'project', 'maya', 'Agreed. Let’s bring this into the next build.', {
    parentId: 'design-ready',
  });
  add(
    'launch-old',
    'project',
    'alex',
    'Launch review is at 14:00 UTC. Please bring the final checklist.',
  );
  add(
    'launch-distractor',
    'project',
    'priya',
    'The customer preview remains at 14:00 UTC. That is separate from the launch review.',
  );
  add(
    'qa-target',
    'project',
    'maya',
    `${code}: the release candidate is ready. Alex, please confirm the QA checklist in this thread once it’s complete.`,
    { reactions: { '👀': ['leo'] } },
  );
  add('qa-reply', 'project', 'leo', 'The keyboard and focus checks are passing on my side.', {
    parentId: 'qa-target',
  });
  add(
    'handoff-target',
    'project',
    'sam',
    `Handoff for ${code}: the rollback owner is Priya Shah. The release window is 16:30 UTC. Please use these details for today’s handoff.`,
  );
  add(
    'handoff-distractor',
    'project',
    'sam',
    'Yesterday’s draft listed Maya as rollback owner and 17:00 UTC as the window. Those details are superseded.',
  );
  add(
    'project-wrap',
    'project',
    'priya',
    'Thanks for keeping decisions in threads, everyone. Future us will be grateful. 🌱',
  );
  add(
    'eng-note',
    'engineering',
    'maya',
    'A reminder for reviews: describe the tradeoff, not just the implementation. A good decision log saves a lot of future archaeology.',
  );
  add(
    'eng-tip',
    'engineering',
    'leo',
    'Tiny performance win: we removed an unnecessary render from the sidebar. The browser is doing a lot less work now.',
    { reactions: { '🚀': ['alex', 'sam'] } },
  );
  add(
    'eng-duplicate',
    'engineering',
    'maya',
    `${code}: this engineering note is background context only. The QA request lives in the project channel.`,
  );
  add(
    'delete-target',
    'engineering',
    'alex',
    'Draft announcement — placeholder numbers, do not share.',
  );
  add(
    'delete-distractor',
    'engineering',
    'leo',
    'Draft announcement — approved numbers, ready to share.',
  );
  add(
    'design-note',
    'design',
    'jordan',
    'A few references for the next iteration: generous spacing, quiet borders, and a clear sense of place.',
  );
  add(
    'design-feedback',
    'design',
    'priya',
    'Let’s keep the familiar interactions. The polish should make things easier to find, not harder.',
  );
  add(
    'incident-old',
    'incidents',
    'sam',
    'INC-103 from last week is closed. No further action is required.',
  );
  add(
    'incident-target',
    'incidents',
    'sam',
    `INC-${200 + (seed % 79)}: elevated latency in the search service. Mitigation is deployed. Please acknowledge this update and pin it for the handoff.`,
  );
  add(
    'incident-update',
    'incidents',
    'maya',
    'Thanks, Sam. We’ll keep an eye on the next metrics window.',
  );
  add(
    'random-book',
    'random',
    'jordan',
    'Weekend recommendation: take the long route home. Found a lovely little bookshop that way. 📚',
    { reactions: { '❤️': ['priya', 'alex'] } },
  );
  add('random-coffee', 'random', 'leo', 'Serious question: is a third coffee a personality trait?');
  add('random-answer', 'random', 'sam', 'Only if you document it.', { parentId: 'random-coffee' });
  add(
    'dm-maya-intro',
    'dm-maya',
    'maya',
    'Hey Alex — thanks for taking the QA pass today. Let me know if anything feels off.',
  );
  add(
    'dm-jordan-intro',
    'dm-jordan',
    'jordan',
    'The latest designs are in the project channel. Would love your thoughts when you have a moment.',
  );
  add(
    'dm-sam-intro',
    'dm-sam',
    'sam',
    'Could you send me the current rollback owner and release window when you find them?',
  );
  add('dm-priya-intro', 'dm-priya', 'priya', 'Thanks for helping keep the launch on track!');
  add(
    'dm-leo-intro',
    'dm-leo',
    'leo',
    'Happy to pair on the keyboard interactions this afternoon.',
  );
  return {
    fixtureVersion: FIXTURE_VERSION,
    seed,
    workspace: 'Northstar',
    currentUserId: SELF,
    users,
    channels,
    messages,
    clock: '2026-09-29T10:00:00.000Z',
  };
}
