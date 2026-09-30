import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Search,
  Hash,
  ChevronDown,
  ChevronRight,
  Plus,
  Send,
  X,
  MessageSquare,
  DirectMessages,
  MoreHorizontal,
  Pencil,
  Compose,
  Trash2,
  Pin,
  Bookmark,
  SmilePlus,
  Smile,
  Home,
  Bell,
  Clock,
  ArrowLeft,
  ArrowRight,
  Check,
  Bold,
  Italic,
  Code,
  List,
  AtSign,
  HelpCircle,
  Command,
  SlidersHorizontal,
  ArrowUpRight,
} from './icons.jsx';
import { portraits } from './portraits.js';
import './style.css';

const emojis = ['✅', '👍', '👀', '🎉', '❤️', '🙌', '✨', '🚀'];
let token = location.pathname.match(/^\/s\/([a-f0-9]{64})$/)?.[1];
async function api(path, method = 'GET', body) {
  const r = await fetch(`/api/${path}`, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { 'x-session-token': token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw new Error(data.error);
  return data;
}
function track(event) {
  if (token) api('events', 'POST', event).catch(() => {});
}
function IconButton({ label, children, onClick, ...props }) {
  return (
    <button
      type="button"
      className="icon-btn"
      aria-label={label}
      title={label}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
function Avatar({ user, small = false }) {
  const [failed, setFailed] = useState(false);
  return (
    <span
      className={`avatar ${small ? 'small' : ''}`}
      style={{ background: user.color }}
      aria-hidden="true"
    >
      {portraits[user.id] && !failed ? (
        <img
          data-avatar={user.id}
          src={portraits[user.id]}
          alt=""
          draggable="false"
          onError={() => setFailed(true)}
        />
      ) : (
        <span>{user.initials}</span>
      )}
      <i className={user.status} />
    </span>
  );
}
function RichText({ text }) {
  return (
    <>
      {text.split(/(\*\*[^*]+\*\*|_[^_]+_|`[^`]+`|@[\w-]+)/g).map((part, i) =>
        part.startsWith('**') ? (
          <strong key={i}>{part.slice(2, -2)}</strong>
        ) : part.startsWith('_') ? (
          <em key={i}>{part.slice(1, -1)}</em>
        ) : part.startsWith('`') ? (
          <code key={i}>{part.slice(1, -1)}</code>
        ) : part.startsWith('@') ? (
          <span className="mention" key={i}>
            {part}
          </span>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        ),
      )}
    </>
  );
}

function Composer({ label, onSend, onEditLast, compact = false }) {
  const [value, setValue] = useState(''),
    [sending, setSending] = useState(false);
  const ref = useRef(null);
  async function submit(e) {
    e.preventDefault();
    if (!value.trim() || sending) return;
    setSending(true);
    try {
      await onSend(value);
      setValue('');
      ref.current?.focus();
    } catch {
    } finally {
      setSending(false);
    }
  }
  function wrap(mark) {
    const el = ref.current,
      start = el.selectionStart,
      end = el.selectionEnd;
    setValue(value.slice(0, start) + mark + value.slice(start, end) + mark + value.slice(end));
    el.focus();
  }
  return (
    <form className={`composer ${compact ? 'compact' : ''}`} onSubmit={submit} aria-label={label}>
      <div className="format-toolbar">
        <IconButton label="Bold text" onClick={() => wrap('**')}>
          <Bold size={16} />
        </IconButton>
        <IconButton label="Italic text" onClick={() => wrap('_')}>
          <Italic size={16} />
        </IconButton>
        <span className="divider" />
        <IconButton label="Insert code" onClick={() => wrap('`')}>
          <Code size={17} />
        </IconButton>
        <IconButton
          label="Insert list"
          onClick={() => {
            setValue(value + '\n• ');
            ref.current?.focus();
          }}
        >
          <List size={17} />
        </IconButton>
      </div>
      <textarea
        ref={ref}
        aria-label={label}
        placeholder={label}
        value={value}
        maxLength={4000}
        rows={compact ? 2 : 2}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            submit(e);
          }
          if (e.key === 'ArrowUp' && !value && onEditLast) {
            e.preventDefault();
            onEditLast();
          }
        }}
      />
      <div className="composer-bottom">
        <div>
          <IconButton
            label="Add smile emoji"
            onClick={() => {
              setValue(value + ' 🙂');
              ref.current?.focus();
            }}
          >
            <Smile size={18} />
          </IconButton>
          <IconButton
            label="Mention someone"
            onClick={() => {
              setValue(value + '@');
              ref.current?.focus();
            }}
          >
            <AtSign size={18} />
          </IconButton>
        </div>
        <span className="composer-hint">{compact ? '' : 'Shift + Enter for a new line'}</span>
        <button
          className="send-button"
          type="submit"
          disabled={!value.trim() || sending}
          aria-label={compact ? 'Send reply' : 'Send message'}
        >
          <Send size={17} />
        </button>
      </div>
    </form>
  );
}

function App() {
  const [data, setData] = useState(null),
    [error, setError] = useState(''),
    [channelId, setChannelId] = useState('project'),
    [view, setView] = useState('channel');
  const [threadId, setThreadId] = useState(null),
    [menu, setMenu] = useState(null),
    [reaction, setReaction] = useState(null),
    [edit, setEdit] = useState(null),
    [deleting, setDeleting] = useState(null),
    [topic, setTopic] = useState(null);
  const [query, setQuery] = useState(''),
    [searched, setSearched] = useState(''),
    [results, setResults] = useState([]),
    [searching, setSearching] = useState(false),
    [switcher, setSwitcher] = useState(false),
    [switchQuery, setSwitchQuery] = useState(''),
    [help, setHelp] = useState(false),
    [toast, setToast] = useState('');
  const searchRef = useRef(null),
    listRef = useRef(null),
    threadRef = useRef(null),
    jumpRef = useRef(null);
  const refresh = async () => {
    const d = await api('state');
    setData(d);
    return d;
  };
  useEffect(() => {
    (async () => {
      try {
        if (!token) {
          const r = await api('demo', 'POST', {});
          token = r.token;
          history.replaceState({}, '', `/s/${token}`);
        }
        await refresh();
      } catch (e) {
        setError(e.message);
      }
    })();
  }, []);
  useEffect(() => {
    const click = (e) => {
      const el = e.target.closest('button,a,input,textarea,[role="button"]');
      if (el)
        track({
          type: 'click',
          label: el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 100),
          x: e.clientX,
          y: e.clientY,
        });
    };
    const key = (e) => {
      if (['Enter', 'Escape', 'Tab', 'ArrowUp'].includes(e.key) || e.ctrlKey || e.metaKey)
        track({
          type: 'keydown',
          key: `${e.ctrlKey ? 'Ctrl+' : ''}${e.metaKey ? 'Meta+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`,
          label: e.target.getAttribute?.('aria-label') ?? '',
        });
    };
    document.addEventListener('click', click);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('click', click);
      document.removeEventListener('keydown', key);
    };
  }, []);
  useEffect(() => {
    const key = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSwitcher((v) => !v);
      }
      if ((e.metaKey || e.ctrlKey) && ['g', 'f'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSwitcher(false);
        setThreadId(null);
        setMenu(null);
        setReaction(null);
        setEdit(null);
        setDeleting(null);
        setTopic(null);
        setHelp(false);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 2400);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    if (listRef.current) {
      if (jumpRef.current) {
        document.getElementById(`msg-${jumpRef.current}`)?.scrollIntoView({ block: 'center' });
        jumpRef.current = null;
      } else listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [channelId, view, data?.state.messages.length]);
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [threadId, data?.state.messages.length]);
  async function act(action) {
    try {
      await api('action', 'POST', {
        requestId: crypto.randomUUID(),
        revision: data.revision,
        action,
      });
      const d = await refresh();
      if (view === 'search')
        setResults((await api(`search?q=${encodeURIComponent(searched)}`)).messages);
      return d;
    } catch (e) {
      setToast(e.message);
      await refresh();
      throw e;
    }
  }
  async function search(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setThreadId(null);
    setSearched(query);
    setView('search');
    track({ type: 'search', label: query });
    try {
      setResults((await api(`search?q=${encodeURIComponent(query)}`)).messages);
    } catch (e) {
      setToast(e.message);
    } finally {
      setSearching(false);
    }
  }
  function navigate(id, highlight) {
    setChannelId(id);
    setView('channel');
    setSwitcher(false);
    setSwitchQuery('');
    setThreadId(null);
    setMenu(null);
    setReaction(null);
    jumpRef.current = highlight ?? null;
    track({ type: 'navigate', label: id });
  }
  function safe(action) {
    act(action).catch(() => {});
  }
  if (!data)
    return (
      <div className="loading">
        <div className="workspace-mark">N</div>
        <h1>{error ? 'Unable to open workspace' : 'Opening Northstar…'}</h1>
        <p>{error || 'A little space for good work.'}</p>
        {error && (
          <button onClick={() => (location.href = '/')}>Open a new practice workspace</button>
        )}
      </div>
    );
  const { state: s } = data,
    current = s.channels.find((c) => c.id === channelId),
    me = s.users.find((u) => u.id === s.currentUserId),
    user = (id) => s.users.find((u) => u.id === id),
    chan = (id) => s.channels.find((c) => c.id === id);
  const thread = s.messages.find((m) => m.id === threadId);
  const visible =
    view === 'search'
      ? results
      : view === 'saved'
        ? s.messages.filter((m) => m.savedBy.includes(s.currentUserId))
        : view === 'threads'
          ? s.messages.filter((m) => !m.parentId && s.messages.some((x) => x.parentId === m.id))
          : s.messages.filter((m) => m.channelId === channelId && !m.parentId);
  const openThread = (m) => {
    setThreadId(m.parentId ?? m.id);
    setMenu(null);
    setReaction(null);
  };
  function renderMessage(m, { inThread = false, context = false } = {}) {
    const u = user(m.userId),
      replies = s.messages.filter((x) => x.parentId === m.id),
      own = m.userId === s.currentUserId;
    return (
      <article
        key={m.id}
        className={`message ${m.pinned ? 'pinned' : ''}`}
        id={`${inThread ? 'thread' : 'msg'}-${m.id}`}
        aria-label={`Message from ${u.name}: ${m.text.slice(0, 90)}`}
      >
        {m.pinned && (
          <div className="pin-banner">
            <Pin size={12} /> Pinned to this conversation
          </div>
        )}
        <Avatar user={u} />
        <div className="message-content">
          {context && (
            <button
              className="context-link"
              onClick={() => navigate(m.channelId, m.parentId ?? m.id)}
            >
              {chan(m.channelId).kind === 'channel' ? '# ' : ''}
              {chan(m.channelId).name}
              {m.parentId ? ' · Thread' : ''}
              <ArrowUpRight size={12} />
            </button>
          )}
          <div className="message-meta">
            <button
              className="author"
              onClick={() => {
                if (u.id !== me.id) navigate(`dm-${u.id}`);
              }}
            >
              {u.name}
            </button>
            <time dateTime={m.createdAt}>
              {new Date(m.createdAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                timeZone: 'UTC',
              })}
            </time>
            {m.userId === me.id && <span className="you-tag">you</span>}
          </div>
          {edit?.id === m.id ? (
            <form
              className="edit-form"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await act({ type: 'message.edit', id: m.id, text: edit.text });
                  setEdit(null);
                  setToast('Message updated');
                } catch {}
              }}
            >
              <textarea
                autoFocus
                aria-label="Edit message"
                value={edit.text}
                onChange={(e) => setEdit({ ...edit, text: e.target.value })}
                maxLength={4000}
              />
              <div>
                <button type="button" className="outline" onClick={() => setEdit(null)}>
                  Cancel
                </button>
                <button className="primary" type="submit">
                  Save changes
                </button>
              </div>
            </form>
          ) : (
            <p className="message-text">
              <RichText text={m.text} />
              {m.editedAt && <span className="edited"> (edited)</span>}
            </p>
          )}
          {Object.keys(m.reactions).length > 0 && (
            <div className="reactions">
              {Object.entries(m.reactions).map(([emoji, ids]) => (
                <button
                  key={emoji}
                  aria-label={`${emoji} reaction, ${ids.length}${ids.includes(me.id) ? ', selected' : ''}`}
                  aria-pressed={ids.includes(me.id)}
                  className={ids.includes(me.id) ? 'reacted' : ''}
                  onClick={() => safe({ type: 'reaction.toggle', id: m.id, emoji })}
                >
                  {emoji}
                  <span>{ids.length}</span>
                </button>
              ))}
              <button
                className="add-reaction"
                aria-label={`Add reaction to ${u.name}'s message`}
                onClick={() => setReaction(reaction === m.id ? null : m.id)}
              >
                <SmilePlus size={14} />
              </button>
            </div>
          )}
          {!inThread && replies.length > 0 && (
            <button
              className="thread-link"
              onClick={() => openThread(m)}
              aria-label={`Open ${replies.length} replies to ${u.name}'s message`}
            >
              <span className="reply-avatars">
                {[...new Set(replies.map((r) => r.userId))].slice(0, 3).map((id) => (
                  <Avatar key={id} user={user(id)} small />
                ))}
              </span>
              <strong>
                {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
              </strong>
              <span>
                Last reply{' '}
                {new Date(replies.at(-1).createdAt).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  timeZone: 'UTC',
                })}
              </span>
              <ChevronRight size={13} />
            </button>
          )}
        </div>
        <div className="message-actions">
          <IconButton
            label={`React to ${u.name}'s message`}
            onClick={() => {
              setReaction(reaction === m.id ? null : m.id);
              setMenu(null);
            }}
          >
            <SmilePlus size={17} />
          </IconButton>
          {!inThread && (
            <IconButton label={`Reply to ${u.name}'s message`} onClick={() => openThread(m)}>
              <MessageSquare size={17} />
            </IconButton>
          )}
          <IconButton
            label={`${m.savedBy.includes(me.id) ? 'Unsave' : 'Save'} message for later`}
            onClick={() => safe({ type: 'save.toggle', id: m.id })}
          >
            <Bookmark size={17} fill={m.savedBy.includes(me.id) ? 'currentColor' : 'none'} />
          </IconButton>
          <IconButton
            label={`More actions for ${u.name}'s message`}
            onClick={() => {
              setMenu(menu === m.id ? null : m.id);
              setReaction(null);
            }}
          >
            <MoreHorizontal size={18} />
          </IconButton>
        </div>
        {reaction === m.id && (
          <div className="emoji-popover" role="dialog" aria-label="Choose a reaction">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                aria-label={`React ${emoji}`}
                onClick={() => {
                  safe({ type: 'reaction.toggle', id: m.id, emoji });
                  setReaction(null);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        {menu === m.id && (
          <div className="message-menu" role="menu">
            <button
              role="menuitem"
              onClick={() => {
                safe({ type: 'pin.toggle', id: m.id });
                setMenu(null);
              }}
            >
              <Pin size={15} />
              {m.pinned ? 'Unpin message' : 'Pin to this conversation'}
            </button>
            <button
              role="menuitem"
              onClick={() => {
                openThread(m);
              }}
            >
              <MessageSquare size={15} />
              Reply in thread
            </button>
            {own && (
              <>
                <hr />
                <button
                  role="menuitem"
                  onClick={() => {
                    setEdit({ id: m.id, text: m.text });
                    setMenu(null);
                  }}
                >
                  <Pencil size={15} />
                  Edit message
                </button>
                <button
                  className="danger"
                  role="menuitem"
                  onClick={() => {
                    setDeleting(m);
                    setMenu(null);
                  }}
                >
                  <Trash2 size={15} />
                  Delete message
                </button>
              </>
            )}
          </div>
        )}
      </article>
    );
  }
  return (
    <div className="shell">
      <header className="topbar">
        <div className="top-history">
          <IconButton label="Back to project" onClick={() => navigate('project')}>
            <ArrowLeft size={18} />
          </IconButton>
          <IconButton label="Go to general" onClick={() => navigate('general')}>
            <ArrowRight size={18} />
          </IconButton>
          <IconButton label="Open quick switcher" onClick={() => setSwitcher(true)}>
            <Clock size={18} />
          </IconButton>
        </div>
        <form className="global-search" role="search" onSubmit={search}>
          <Search size={16} />
          <input
            ref={searchRef}
            aria-label="Search Northstar"
            placeholder="Search Northstar"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd>⌘ G</kbd>
        </form>
        <div className="top-end">
          <span className="sandbox-dot" />
          Local workspace
          <IconButton label="Keyboard shortcuts and help" onClick={() => setHelp(true)}>
            <HelpCircle size={19} />
          </IconButton>
        </div>
      </header>
      <nav className="rail" aria-label="Workspace navigation">
        <button
          className="workspace-mark"
          aria-label="Northstar home"
          onClick={() => navigate('project')}
        >
          N<span>✦</span>
        </button>
        <button
          className={view === 'channel' ? 'rail-item active' : 'rail-item'}
          onClick={() => navigate('project')}
        >
          <Home size={24} filled={view === 'channel'} />
          <span>Home</span>
        </button>
        <button
          className="rail-item"
          onClick={() => {
            navigate('dm-maya');
          }}
        >
          <DirectMessages size={24} />
          <span>DMs</span>
        </button>
        <button
          className={`rail-item ${view === 'threads' ? 'active' : ''}`}
          onClick={() => {
            setView('threads');
            setThreadId(null);
          }}
        >
          <Bell size={23} />
          <span>Threads</span>
        </button>
        <button
          className={`rail-item ${view === 'saved' ? 'active' : ''}`}
          onClick={() => {
            setView('saved');
            setThreadId(null);
          }}
        >
          <Bookmark size={24} filled={view === 'saved'} />
          <span>Later</span>
        </button>
        <div className="rail-bottom">
          <IconButton label="Switch conversation" onClick={() => setSwitcher(true)}>
            <Plus size={23} />
          </IconButton>
          <Avatar user={me} />
        </div>
      </nav>
      <aside className="sidebar">
        <button className="workspace-title" onClick={() => setSwitcher(true)}>
          Northstar <ChevronDown size={17} />
          <span>
            <Compose size={20} />
          </span>
        </button>
        <div className="workspace-subtitle">
          <span />A little space for good work
        </div>
        <div className="side-shortcuts">
          <button
            onClick={() => {
              setView('threads');
              setThreadId(null);
            }}
          >
            <MessageSquare size={17} />
            Threads
          </button>
          <button
            onClick={() => {
              setView('saved');
              setThreadId(null);
            }}
          >
            <Bookmark size={17} />
            Saved for later
          </button>
        </div>
        <div className="side-section">
          <span>
            <ChevronDown size={15} />
            Channels
          </span>
          <IconButton label="Find a channel" onClick={() => setSwitcher(true)}>
            <Plus size={15} />
          </IconButton>
        </div>
        <div className="channel-list">
          {s.channels
            .filter((c) => c.kind === 'channel')
            .map((c) => (
              <button
                key={c.id}
                className={view === 'channel' && c.id === channelId ? 'selected' : ''}
                onClick={() => navigate(c.id)}
                aria-label={`Channel ${c.name}`}
              >
                <Hash size={17} />
                <span>{c.name}</span>
                {c.id === 'project' && <span className="channel-dot" />}
              </button>
            ))}
        </div>
        <div className="side-section dm-heading">
          <span>
            <ChevronDown size={15} />
            Direct messages
          </span>
          <IconButton label="Find a person" onClick={() => setSwitcher(true)}>
            <Plus size={15} />
          </IconButton>
        </div>
        <div className="channel-list dm-list">
          {s.users
            .filter((u) => u.id !== me.id)
            .map((u) => (
              <button
                key={u.id}
                aria-label={`Direct message ${u.name}`}
                className={view === 'channel' && channelId === `dm-${u.id}` ? 'selected' : ''}
                onClick={() => navigate(`dm-${u.id}`)}
              >
                <span className={`presence ${u.status}`} />
                <span>{u.name}</span>
              </button>
            ))}
        </div>
        <button className="quick-switch-hint" onClick={() => setSwitcher(true)}>
          <Command size={14} />
          <span>Jump to a conversation</span>
          <kbd>K</kbd>
        </button>
        <div className="sidebar-foot">
          <span className="tiny-star">✦</span>
          <div>
            <strong>Thoughtful work, together.</strong>
            <span>Your team's shared space.</span>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="channel-header">
          <div>
            <h1>
              {view === 'channel' ? (
                <>
                  {current.kind === 'channel' ? (
                    <Hash size={22} />
                  ) : (
                    <span className="presence online" />
                  )}
                  {current.name}
                </>
              ) : view === 'search' ? (
                <>
                  <Search size={21} />
                  Search results
                </>
              ) : view === 'saved' ? (
                <>
                  <Bookmark size={21} />
                  Later
                </>
              ) : (
                <>
                  <MessageSquare size={21} />
                  Threads
                </>
              )}
            </h1>
            {view === 'channel' && (
              <button
                className="topic-preview"
                onClick={() => {
                  if (current.kind === 'channel') setTopic(current.topic);
                }}
              >
                {current.topic}
              </button>
            )}
          </div>
          <div className="channel-header-right">
            {view === 'channel' && (
              <>
                <div className="member-stack" aria-label={`${current.members.length} members`}>
                  {current.members.slice(0, 3).map((id) => (
                    <Avatar key={id} user={user(id)} small />
                  ))}
                </div>
                <span>{current.members.length}</span>
                {current.kind === 'channel' && (
                  <IconButton label="Edit channel topic" onClick={() => setTopic(current.topic)}>
                    <Pencil size={17} />
                  </IconButton>
                )}
              </>
            )}
          </div>
        </header>
        {view === 'channel' ? (
          <div className="channel-tabs">
            <span className="tab active">
              <MessageSquare size={15} />
              Messages
            </span>
            <button
              onClick={() => {
                setQuery(`in:${current.name} has:pin`);
                setSearched(`in:${current.name} has:pin`);
                setView('search');
                api(`search?q=${encodeURIComponent(`in:${current.name} has:pin`)}`).then((r) =>
                  setResults(r.messages),
                );
              }}
            >
              <Pin size={14} />
              Pins
              <span className="count-pill">
                {s.messages.filter((m) => m.channelId === channelId && m.pinned).length}
              </span>
            </button>
            <span className="tab-note">Everything in its right place.</span>
          </div>
        ) : view === 'search' ? (
          <div className="search-summary">
            <span>
              {searching ? 'Searching…' : `${results.length} results`} for{' '}
              <strong>“{searched}”</strong>
            </span>
            <span>
              <SlidersHorizontal size={14} />
              Most recent
            </span>
          </div>
        ) : (
          <div className="search-summary">
            {view === 'saved'
              ? 'Keep the things you want to come back to.'
              : 'Conversations worth following.'}
          </div>
        )}
        <div
          className="messages-scroll"
          ref={listRef}
          aria-label={
            view === 'channel'
              ? `${current.name} messages`
              : view === 'search'
                ? 'Search results'
                : 'Messages'
          }
        >
          {view === 'channel' && (
            <div className="channel-intro">
              <div className="intro-icon">
                {current.kind === 'channel' ? <Hash size={28} /> : <MessageSquare size={27} />}
              </div>
              <h2>{current.kind === 'channel' ? `This is #${current.name}` : current.name}</h2>
              <p>
                {current.description ||
                  `This is the beginning of your conversation with ${current.name}.`}
              </p>
            </div>
          )}
          {visible.map((m, i) => (
            <React.Fragment key={m.id}>
              {view === 'channel' &&
                (!i || visible[i - 1].createdAt.slice(0, 10) !== m.createdAt.slice(0, 10)) && (
                  <div className="date-divider">
                    <span>
                      {new Date(m.createdAt).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        timeZone: 'UTC',
                      })}
                    </span>
                  </div>
                )}
              {renderMessage(m, { context: view !== 'channel' })}
            </React.Fragment>
          ))}
          {!visible.length && (
            <div className="empty-state">
              <Search size={36} />
              <h2>
                {view === 'search'
                  ? 'No messages found'
                  : view === 'saved'
                    ? 'A little room for later'
                    : 'Start a conversation'}
              </h2>
              <p>
                {view === 'search'
                  ? 'Try a different phrase, person, or channel.'
                  : view === 'saved'
                    ? 'Save a message to keep it close at hand.'
                    : 'Good work starts with a message.'}
              </p>
              {view === 'search' && (
                <p className="search-tip">
                  Try <code>in:engineering from:maya</code> or an exact phrase in quotes.
                </p>
              )}
            </div>
          )}
        </div>
        {view === 'channel' && (
          <div className="composer-container">
            <Composer
              key={channelId}
              label={`Message ${current.kind === 'channel' ? '#' : ''}${current.name}`}
              onSend={(text) => act({ type: 'message.send', channelId, text })}
              onEditLast={() => {
                const m = s.messages
                  .filter((m) => m.channelId === channelId && !m.parentId && m.userId === me.id)
                  .at(-1);
                if (m) setEdit({ id: m.id, text: m.text });
              }}
            />
            <div className="composer-foot">
              <span>
                <span className="presence online" />
                You're all caught up
              </span>
              <span>
                <strong>Enter</strong> to send
              </span>
            </div>
          </div>
        )}
      </main>
      {thread && (
        <aside className="thread-panel" aria-label="Thread">
          <header>
            <h2>
              Thread <span>#{chan(thread.channelId).name}</span>
            </h2>
            <IconButton label="Close thread" onClick={() => setThreadId(null)}>
              <X size={20} />
            </IconButton>
          </header>
          <div className="thread-scroll" ref={threadRef}>
            {renderMessage(thread, { inThread: true })}
            <div className="reply-divider">
              {s.messages.filter((m) => m.parentId === thread.id).length} replies
            </div>
            {s.messages
              .filter((m) => m.parentId === thread.id)
              .map((m) => renderMessage(m, { inThread: true }))}
          </div>
          <div className="thread-composer">
            <Composer
              key={thread.id}
              label="Reply in thread"
              compact
              onSend={(text) =>
                act({
                  type: 'message.send',
                  channelId: thread.channelId,
                  parentId: thread.id,
                  text,
                })
              }
            />
          </div>
        </aside>
      )}
      {switcher && (
        <Modal label="Jump to a conversation" close={() => setSwitcher(false)}>
          <div className="switch-search">
            <Search size={21} />
            <input
              autoFocus
              aria-label="Find a conversation"
              placeholder="Where would you like to go?"
              value={switchQuery}
              onChange={(e) => setSwitchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const c = s.channels.find((c) =>
                    c.name.toLowerCase().includes(switchQuery.toLowerCase()),
                  );
                  if (c) navigate(c.id);
                }
              }}
            />
            <kbd>esc</kbd>
          </div>
          <div className="switch-options">
            {s.channels
              .filter((c) => c.name.toLowerCase().includes(switchQuery.toLowerCase()))
              .map((c) => (
                <button key={c.id} onClick={() => navigate(c.id)}>
                  {c.kind === 'channel' ? <Hash size={19} /> : <MessageSquare size={19} />}
                  <span>{c.name}</span>
                  <ArrowUpRight size={15} />
                </button>
              ))}
          </div>
          <div className="modal-note">Type to filter · Enter to open the first match</div>
        </Modal>
      )}
      {deleting && (
        <Modal label="Delete message" close={() => setDeleting(null)}>
          <div className="dialog-content">
            <h2>Delete this message?</h2>
            <p>This will remove the message from this conversation.</p>
            <blockquote>{deleting.text}</blockquote>
            <div className="dialog-buttons">
              <button className="outline" onClick={() => setDeleting(null)}>
                Cancel
              </button>
              <button
                className="danger-button"
                onClick={async () => {
                  try {
                    await act({ type: 'message.delete', id: deleting.id });
                    setDeleting(null);
                    setToast('Message deleted');
                  } catch {}
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
      {topic !== null && (
        <Modal label="Edit channel topic" close={() => setTopic(null)}>
          <form
            className="dialog-content"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await act({ type: 'channel.topic', channelId, topic });
                setTopic(null);
                setToast('Channel topic updated');
              } catch {}
            }}
          >
            <h2>Edit topic</h2>
            <p>Let people know what #{current.name} is about.</p>
            <textarea
              autoFocus
              aria-label="Channel topic"
              value={topic}
              maxLength={250}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div className="dialog-buttons">
              <button className="outline" type="button" onClick={() => setTopic(null)}>
                Cancel
              </button>
              <button className="primary" type="submit">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
      {help && (
        <Modal label="Keyboard shortcuts" close={() => setHelp(false)}>
          <div className="dialog-content">
            <h2>A familiar place to work</h2>
            <p>Relay is a focused, local Slack-like workspace.</p>
            <dl className="shortcuts">
              <dt>Jump to a conversation</dt>
              <dd>⌘ / Ctrl + K</dd>
              <dt>Search messages</dt>
              <dd>⌘ / Ctrl + G</dd>
              <dt>Send a message</dt>
              <dd>Enter</dd>
              <dt>Add a new line</dt>
              <dd>Shift + Enter</dd>
              <dt>Edit your last message</dt>
              <dd>↑ in an empty composer</dd>
              <dt>Close a panel or dialog</dt>
              <dd>Escape</dd>
            </dl>
            <p>
              Search supports quoted phrases, in:, from:, before:, after:, on:, has:pin,
              has:reaction, is:thread, and negative terms.
            </p>
            <button className="primary" onClick={() => setHelp(false)}>
              Got it
            </button>
          </div>
        </Modal>
      )}
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}
function Modal({ label, close, children }) {
  const ref = useRef(null);
  useEffect(() => {
    const before = document.activeElement;
    ref.current?.focus();
    const key = (e) => {
      if (e.key === 'Tab') {
        const els = [
          ...ref.current.querySelectorAll('button,input,textarea,[tabindex="0"]'),
        ].filter((el) => !el.disabled);
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    ref.current?.addEventListener('keydown', key);
    return () => {
      ref.current?.removeEventListener('keydown', key);
      before?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <section
        ref={ref}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
      >
        {children}
      </section>
    </div>
  );
}
createRoot(document.getElementById('root')).render(<App />);
