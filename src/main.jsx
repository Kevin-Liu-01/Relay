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
import { REPLAY_MODE, readVisibleUI, validSnapshot } from './replay-bridge.js';

const emojis = ['✅', '👍', '👀', '🎉', '❤️', '🙌', '✨', '🚀'];
const PLAY_MODE = document.documentElement.dataset.relayPlay === 'true';
const playSession = PLAY_MODE
  ? import('./play/session.mjs').then(async ({ createPlaySession }) => {
      const response = await fetch('/demo/sandbox.json');
      if (!response.ok) throw new Error('Could not load the sandbox. Please refresh.');
      return createPlaySession(await response.json());
    })
  : null;
if (PLAY_MODE)
  document.getElementById('play-reset')?.addEventListener('click', () => location.reload());
let token = location.pathname.match(/^\/s\/([a-f0-9]{64})$/)?.[1];
async function api(path, method = 'GET', body) {
  if (REPLAY_MODE) throw new Error('Recorded workspace: network actions are disabled.');
  if (PLAY_MODE) return (await playSession).request(path, method, body);
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
  if (!REPLAY_MODE && !PLAY_MODE && token) api('events', 'POST', event).catch(() => {});
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

function Composer({ label, onSend, onEditLast, compact = false, drafts, draftKey = label }) {
  const [value, setValue] = useState(() => drafts?.current[draftKey] ?? ''),
    [sending, setSending] = useState(false);
  const ref = useRef(null);
  const sendingRef = useRef(false);
  useEffect(() => {
    if (drafts) drafts.current[draftKey] = value;
  }, [value, draftKey, drafts]);
  useEffect(() => {
    if (!REPLAY_MODE) return;
    const apply = (e) => setValue(e.detail?.find((f) => f.label === label)?.value ?? '');
    window.addEventListener('relay-replay-fields', apply);
    return () => window.removeEventListener('relay-replay-fields', apply);
  }, [label]);
  async function submit(e) {
    e.preventDefault();
    if (!value.trim() || sendingRef.current) return;
    sendingRef.current = true;
    setSending(true);
    try {
      await onSend(value);
      if (drafts?.current[draftKey] === value) drafts.current[draftKey] = '';
      setValue('');
      ref.current?.focus();
    } catch {
    } finally {
      sendingRef.current = false;
      setSending(false);
    }
  }
  function wrap(mark) {
    if (sendingRef.current) return;
    const el = ref.current,
      start = el.selectionStart,
      end = el.selectionEnd;
    setValue(value.slice(0, start) + mark + value.slice(start, end) + mark + value.slice(end));
    el.focus();
  }
  return (
    <form className={`composer ${compact ? 'compact' : ''}`} onSubmit={submit} aria-label={label}>
      <div className="format-toolbar">
        <IconButton label="Bold text" disabled={sending} onClick={() => wrap('**')}>
          <Bold size={16} />
        </IconButton>
        <IconButton label="Italic text" disabled={sending} onClick={() => wrap('_')}>
          <Italic size={16} />
        </IconButton>
        <span className="divider" />
        <IconButton label="Insert code" disabled={sending} onClick={() => wrap('`')}>
          <Code size={17} />
        </IconButton>
        <IconButton
          label="Insert list"
          disabled={sending}
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
        readOnly={sending}
        aria-busy={sending}
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
            disabled={sending}
            onClick={() => {
              setValue(value + ' 🙂');
              ref.current?.focus();
            }}
          >
            <Smile size={18} />
          </IconButton>
          <IconButton
            label="Mention someone"
            disabled={sending}
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
    [topic, setTopic] = useState(null),
    [details, setDetails] = useState(null);
  const mutationRef = useRef(false),
    searchVersion = useRef(0);
  const drafts = useRef({});
  const [pending, setPending] = useState(false);
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
  const [replayRevision, setReplayRevision] = useState(0);
  const replayFields = useRef(null);
  useEffect(() => {
    if (REPLAY_MODE) return;
    window.__relayCapture = () => ({
      version: 1,
      data,
      ui: {
        channelId,
        view,
        threadId,
        menu,
        reaction,
        edit,
        deleting,
        topic,
        details,
        query,
        searched,
        results,
        searching,
        switcher,
        switchQuery,
        help,
        toast,
      },
      dom: readVisibleUI(),
      viewport: { width: innerWidth, height: innerHeight },
    });
    return () => {
      delete window.__relayCapture;
    };
  });
  useEffect(() => {
    if (!REPLAY_MODE) return;
    const apply = (e) => {
      if (
        e.origin !== location.origin ||
        e.source !== parent ||
        e.data?.type !== 'relay-replay' ||
        !validSnapshot(e.data.snapshot)
      )
        return;
      const snapshot = e.data.snapshot,
        u = snapshot.ui ?? {};
      setData(snapshot.data);
      setError('');
      setChannelId(u.channelId ?? snapshot.data.state.channels[0].id);
      setView(u.view ?? 'channel');
      setThreadId(u.threadId ?? null);
      setMenu(u.menu ?? null);
      setReaction(u.reaction ?? null);
      setEdit(u.edit ?? null);
      setDeleting(u.deleting ?? null);
      setTopic(u.topic ?? null);
      setDetails(u.details ?? null);
      setQuery(u.query ?? '');
      setSearched(u.searched ?? '');
      setResults(u.results ?? []);
      setSearching(false);
      setSwitcher(u.switcher ?? false);
      setSwitchQuery(u.switchQuery ?? '');
      setHelp(u.help ?? false);
      setToast(u.toast ?? '');
      replayFields.current = snapshot.dom;
      setReplayRevision((n) => n + 1);
    };
    window.addEventListener('message', apply);
    parent.postMessage({ type: 'relay-replay-ready' }, location.origin);
    return () => window.removeEventListener('message', apply);
  }, []);
  useEffect(() => {
    if (!REPLAY_MODE || !replayRevision) return;
    const id = requestAnimationFrame(() => {
      window.dispatchEvent(
        new CustomEvent('relay-replay-fields', { detail: replayFields.current?.fields ?? [] }),
      );
      for (const saved of replayFields.current?.scroll ?? [])
        for (const el of document.querySelectorAll('.messages-scroll,.thread-scroll'))
          if (el.className === saved.className) el.scrollTop = saved.top;
    });
    return () => cancelAnimationFrame(id);
  }, [replayRevision]);
  useEffect(() => {
    if (REPLAY_MODE) return;
    (async () => {
      try {
        if (!token && !PLAY_MODE) {
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
        if (e.defaultPrevented) return;
        if (menu || reaction) {
          setMenu(null);
          setReaction(null);
          return;
        }
        setSwitcher(false);
        setThreadId(null);
        setMenu(null);
        setReaction(null);
        setEdit(null);
        setDeleting(null);
        setTopic(null);
        setDetails(null);
        setHelp(false);
      }
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [menu, reaction]);
  useEffect(() => {
    if (!menu && !reaction) return;
    const popover = document.querySelector('.message-menu,.emoji-popover');
    const before = document.activeElement;
    popover?.querySelector('button')?.focus();
    const key = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        setMenu(null);
        setReaction(null);
        before?.focus();
      } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        const buttons = [...popover.querySelectorAll('button')],
          index = buttons.indexOf(document.activeElement);
        const next =
          e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? buttons.length - 1
              : (index + (e.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length;
        e.preventDefault();
        buttons[next]?.focus();
      }
    };
    const outside = (e) => {
      if (!e.target.closest('.message-menu,.emoji-popover,.message-actions,.reactions')) {
        setMenu(null);
        setReaction(null);
      }
    };
    popover?.addEventListener('keydown', key);
    document.addEventListener('pointerdown', outside);
    return () => {
      popover?.removeEventListener('keydown', key);
      document.removeEventListener('pointerdown', outside);
    };
  }, [menu, reaction]);
  useEffect(() => {
    if (toast && !REPLAY_MODE) {
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
    if (mutationRef.current) throw new Error('An update is already in progress.');
    mutationRef.current = true;
    setPending(true);
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
    } finally {
      mutationRef.current = false;
      setPending(false);
    }
  }
  async function search(e) {
    e?.preventDefault();
    if (!query.trim()) return;
    const version = ++searchVersion.current;
    setSearching(true);
    setThreadId(null);
    setSearched(query);
    setView('search');
    setResults([]);
    track({ type: 'search', label: query });
    try {
      const result = await api(`search?q=${encodeURIComponent(query)}`);
      if (version === searchVersion.current) setResults(result.messages);
    } catch (e) {
      setToast(e.message);
    } finally {
      if (version === searchVersion.current) setSearching(false);
    }
  }
  function navigate(id, highlight) {
    searchVersion.current++;
    setSearching(false);
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
          : view === 'pins'
            ? s.messages.filter((m) => m.channelId === channelId && m.pinned)
            : view === 'dms'
              ? []
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
              onClick={() => {
                navigate(m.channelId, m.parentId ?? m.id);
                if (m.parentId) openThread(m);
              }}
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
                <button
                  className="primary"
                  type="submit"
                  disabled={pending || !edit.text.trim()}
                  aria-busy={pending}
                >
                  {pending ? 'Saving…' : 'Save changes'}
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
            setView('dms');
            setThreadId(null);
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
                className={
                  ['channel', 'pins'].includes(view) && c.id === channelId ? 'selected' : ''
                }
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
              {['channel', 'pins'].includes(view) ? (
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
              ) : view === 'dms' ? (
                <>
                  <DirectMessages size={21} />
                  Direct messages
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
            {['channel', 'pins'].includes(view) && (
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
            {['channel', 'pins'].includes(view) && (
              <>
                <button
                  className="member-stack"
                  aria-label={`Channel details, ${current.members.length} members`}
                  onClick={() => setDetails(current.description)}
                >
                  {current.members.slice(0, 3).map((id) => (
                    <Avatar key={id} user={user(id)} small />
                  ))}
                </button>
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
        {['channel', 'pins'].includes(view) ? (
          <div className="channel-tabs">
            <button
              className={`tab ${view === 'channel' ? 'active' : ''}`}
              aria-pressed={view === 'channel'}
              onClick={() => setView('channel')}
            >
              <MessageSquare size={15} />
              Messages
            </button>
            <button
              className={view === 'pins' ? 'active' : ''}
              aria-pressed={view === 'pins'}
              onClick={() => {
                setView('pins');
                setThreadId(null);
              }}
            >
              <Pin size={14} />
              Pins
              <span className="count-pill">
                {s.messages.filter((m) => m.channelId === channelId && m.pinned).length}
              </span>
            </button>
            <button onClick={() => setDetails(current.description)} aria-label="Channel details">
              Details
            </button>
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
            {view === 'dms'
              ? 'People at Northstar'
              : view === 'saved'
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
          {view === 'dms' && (
            <div className="people-directory">
              {s.users
                .filter((u) => u.id !== me.id)
                .map((u) => (
                  <button
                    key={u.id}
                    onClick={() => navigate(`dm-${u.id}`)}
                    aria-label={`Message ${u.name}`}
                  >
                    <Avatar user={u} />
                    <span>
                      <strong>{u.name}</strong>
                      <small>
                        {u.role} · {u.status}
                      </small>
                    </span>
                    <MessageSquare size={18} />
                  </button>
                ))}
            </div>
          )}
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
          {!visible.length && view !== 'dms' && !searching && (
            <div className="empty-state">
              <Search size={36} />
              <h2>
                {view === 'search'
                  ? 'No messages found'
                  : view === 'pins'
                    ? 'No pinned messages'
                    : view === 'saved'
                      ? 'A little room for later'
                      : 'Start a conversation'}
              </h2>
              <p>
                {view === 'search'
                  ? 'Try a different phrase, person, or channel.'
                  : view === 'pins'
                    ? 'Pin a message from its More actions menu.'
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
              drafts={drafts}
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
              drafts={drafts}
              key={thread.id}
              draftKey={`thread:${thread.id}`}
              label="Reply in thread"
              compact
              onEditLast={() => {
                const m = s.messages
                  .filter((m) => m.parentId === thread.id && m.userId === me.id)
                  .at(-1);
                if (m) setEdit({ id: m.id, text: m.text });
              }}
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
              aria-label="Find a conversation"
              placeholder="Where would you like to go?"
              value={switchQuery}
              onChange={(e) => setSwitchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  e.stopPropagation();
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
                disabled={pending}
                aria-busy={pending}
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
              aria-label="Channel topic"
              value={topic}
              maxLength={250}
              onChange={(e) => setTopic(e.target.value)}
            />
            <div className="dialog-buttons">
              <button className="outline" type="button" onClick={() => setTopic(null)}>
                Cancel
              </button>
              <button
                className="primary"
                type="submit"
                disabled={pending || !topic.trim()}
                aria-busy={pending}
              >
                {pending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        </Modal>
      )}
      {details !== null && (
        <Modal label="Channel details" close={() => setDetails(null)}>
          <form
            className="dialog-content"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                await act({ type: 'channel.description', channelId, description: details });
                setDetails(null);
                setToast('Channel description updated');
              } catch {}
            }}
          >
            <h2>
              {current.kind === 'channel' ? '#' : ''}
              {current.name}
            </h2>
            {current.kind === 'channel' && (
              <label className="description-field">
                Description
                <textarea
                  aria-label="Channel description"
                  value={details}
                  maxLength={500}
                  onChange={(e) => setDetails(e.target.value)}
                />
              </label>
            )}
            <h3>Members · {current.members.length}</h3>
            <div className="details-members">
              {current.members.map((id) => (
                <div key={id}>
                  <Avatar user={user(id)} small />
                  <span>
                    <strong>{user(id).name}</strong>
                    <small>
                      {user(id).role} · {user(id).status}
                    </small>
                  </span>
                </div>
              ))}
            </div>
            <div className="dialog-buttons">
              <button type="button" className="outline" onClick={() => setDetails(null)}>
                Close
              </button>
              {current.kind === 'channel' && (
                <button
                  type="submit"
                  className="primary"
                  disabled={pending || !details.trim() || details === current.description}
                  aria-busy={pending}
                >
                  {pending ? 'Saving…' : 'Save description'}
                </button>
              )}
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
              has:reaction, is:thread, is:saved, and negative terms.
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
  const closeRef = useRef(close);
  closeRef.current = close;
  useEffect(() => {
    const before = document.activeElement;
    const panel = ref.current;
    (panel?.querySelector('[autofocus],textarea,input,button') ?? panel)?.focus();
    const key = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        closeRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const els = [
          ...ref.current.querySelectorAll('button,input,textarea,[tabindex="0"]'),
        ].filter((el) => !el.disabled);
        const first = els[0],
          last = els.at(-1);
        if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last || document.activeElement === panel)
        ) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    ref.current?.addEventListener('keydown', key);
    return () => {
      panel?.removeEventListener('keydown', key);
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
