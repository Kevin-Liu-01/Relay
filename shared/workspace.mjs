export class Fault extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
export const fail = (condition, message, status = 400) => {
  if (!condition) throw new Fault(status, message);
};
const text = (value, max = 4000) => {
  fail(
    typeof value === 'string' && value.trim().length > 0 && value.length <= max,
    `Text must contain 1–${max} characters.`,
  );
  return value.trim();
};
export function transition(original, action, serial) {
  const s = structuredClone(original);
  fail(action && typeof action.type === 'string', 'An action type is required.');
  const user = s.currentUserId;
  const channel = (id) => {
    const c = s.channels.find((c) => c.id === id && c.members.includes(user));
    fail(c, 'Conversation not found.', 404);
    return c;
  };
  const message = (id) => {
    const m = s.messages.find((m) => m.id === id);
    fail(m, 'Message not found.', 404);
    channel(m.channelId);
    return m;
  };
  const stamp = new Date(Date.parse(s.clock) + serial * 1000).toISOString();
  switch (action.type) {
    case 'message.send': {
      channel(action.channelId);
      const parent = action.parentId ? message(action.parentId) : null;
      fail(
        !parent || (!parent.parentId && parent.channelId === action.channelId),
        'Invalid thread.',
      );
      const m = {
        id: `new-${serial}`,
        channelId: action.channelId,
        userId: user,
        text: text(action.text),
        parentId: parent?.id ?? null,
        createdAt: stamp,
        editedAt: null,
        reactions: {},
        pinned: false,
        savedBy: [],
      };
      s.messages.push(m);
      break;
    }
    case 'message.edit': {
      const m = message(action.id);
      fail(m.userId === user, 'You can only edit your own messages.', 403);
      m.text = text(action.text);
      m.editedAt = stamp;
      break;
    }
    case 'message.delete': {
      const m = message(action.id);
      fail(m.userId === user, 'You can only delete your own messages.', 403);
      fail(
        !s.messages.some((x) => x.parentId === m.id),
        'Messages with replies cannot be deleted in this focused environment.',
        409,
      );
      s.messages = s.messages.filter((x) => x.id !== m.id);
      break;
    }
    case 'reaction.toggle': {
      const m = message(action.id);
      fail(
        ['✅', '👍', '👀', '🎉', '❤️', '🙌', '✨', '🚀'].includes(action.emoji),
        'Unsupported reaction.',
      );
      const old = m.reactions[action.emoji] ?? [];
      const next = old.includes(user) ? old.filter((id) => id !== user) : [...old, user];
      if (next.length) m.reactions[action.emoji] = next;
      else delete m.reactions[action.emoji];
      break;
    }
    case 'pin.toggle': {
      const m = message(action.id);
      m.pinned = !m.pinned;
      break;
    }
    case 'save.toggle': {
      const m = message(action.id);
      m.savedBy = m.savedBy.includes(user)
        ? m.savedBy.filter((id) => id !== user)
        : [...m.savedBy, user];
      break;
    }
    case 'channel.description':
    case 'channel.topic': {
      const c = channel(action.channelId);
      fail(c.kind === 'channel', 'Direct messages do not have editable topics.');
      if (action.type === 'channel.description') c.description = text(action.description, 500);
      else c.topic = text(action.topic, 250);
      break;
    }
    default:
      throw new Fault(400, 'Unknown action type.');
  }
  return s;
}

// Deliberately small, specified Slack-like query language. AND across tokens;
// quote phrases; negative tokens; case-insensitive channel/person/date filters.
export function searchMessages(s, query) {
  fail(typeof query === 'string' && query.length <= 500, 'Search is limited to 500 characters.');
  const tokens = query.match(/(?:[^\s"]+|"[^"]*")+/g) ?? [];
  return s.messages
    .filter((m) =>
      s.channels.some((c) => c.id === m.channelId && c.members.includes(s.currentUserId)),
    )
    .filter((m) =>
      tokens.every((raw) => {
        const negate = raw.startsWith('-');
        const t = (negate ? raw.slice(1) : raw).replaceAll('"', '').toLowerCase();
        const c = s.channels.find((c) => c.id === m.channelId);
        const u = s.users.find((u) => u.id === m.userId);
        let result;
        if (t.startsWith('in:')) result = c.name.toLowerCase() === t.slice(3).replace(/^#/, '');
        else if (t.startsWith('from:')) {
          const who = t.slice(5).replace(/^@/, '');
          result =
            who === 'me'
              ? m.userId === s.currentUserId
              : [u.id, u.handle, u.name.toLowerCase()].includes(who);
        } else if (t.startsWith('has:'))
          result =
            t === 'has:pin'
              ? m.pinned
              : t === 'has:reaction'
                ? Object.keys(m.reactions).length > 0
                : false;
        else if (t.startsWith('is:'))
          result =
            t === 'is:saved'
              ? m.savedBy.includes(s.currentUserId)
              : t === 'is:thread' && !!m.parentId;
        else if (t.startsWith('before:') || t.startsWith('after:') || t.startsWith('on:')) {
          const [op, date] = t.split(':');
          const valid = /^\d{4}-\d{2}-\d{2}$/.test(date);
          const day = m.createdAt.slice(0, 10);
          result =
            valid && (op === 'before' ? day < date : op === 'after' ? day > date : day === date);
        } else result = m.text.toLowerCase().includes(t);
        return negate ? !result : result;
      }),
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
