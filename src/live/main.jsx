import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Play,
  Square,
  KeyRound,
  Settings2,
  History,
  GitCompareArrows,
  ShieldCheck,
  Download,
  X,
  ChevronRight,
  ArrowUpRight,
  Radio,
  Layers,
  Eye,
  MousePointer2,
  Braces,
  Workflow,
  Check,
  AlertTriangle,
  Trash2,
  FileJson,
  RefreshCw,
  Unplug,
  Search,
  Film,
  Swords,
} from 'lucide-react';
import Github from '@thesvg/react/github';
import Slack from '@thesvg/react/slack';
import { ModelMark } from '../lab/model-mark.jsx';
import relayMark from '../assets/relay-mark.svg';
import { history, readRun, saveRun, deleteRun, downloadEvidence } from './storage.js';
import './style.css';
import './experience.css';
import { ActionSpotlight, ResultCard } from './feedback.jsx';
import { ReplayPlayer, ReplayLibrary } from './replay.jsx';
import { Duel } from './duel.jsx';

const MODES = { a11y: 'Accessibility', 'json-ui': 'Page JSON', pixels: 'Pixels', api: 'Actor API' };
const ModeIcon = ({ mode }) => {
  const Icon =
    { a11y: Eye, 'json-ui': Braces, pixels: MousePointer2, api: Workflow }[mode] ?? Layers;
  return <Icon size={14} aria-hidden="true" />;
};
const elapsed = (n) =>
  n == null ? '—' : n < 1000 ? `${Math.round(n)} ms` : `${(n / 1000).toFixed(1)} s`;
const money = (n) => (n == null ? '—' : `$${n.toFixed(5)}`);
const hints = {
  'gpt-4o-mini': [0.15, 0.6],
  'gpt-5-nano': [0.05, 0.4],
  'gpt-6-luna': [0.1, 0.5],
  'deepseek-v4-flash': [0.14, 0.28],
  'nemotron-lightning-3p5-30b-a3b': [0.05, 0.2],
};
async function api(op, body, signal) {
  const r = await fetch(
    `/api/relay?op=${op}`,
    body
      ? {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal,
        }
      : {},
  );
  if (!r.ok) {
    const d = await r.json();
    throw Error(d.error ?? 'Request failed.');
  }
  return r;
}
function Modal({ title, close, children, wide = false }) {
  const ref = useRef();
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? 'wide' : ''}
      onCancel={close}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
      aria-label={title}
    >
      <header>
        <h2>{title}</h2>
        <button className="icon" aria-label="Close dialog" onClick={close}>
          <X size={18} />
        </button>
      </header>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
function App() {
  const [setup, setSetup] = useState(null),
    [provider, setProvider] = useState('ramp'),
    [keys, setKeys] = useState({ ramp: '', typesafe: '' }),
    [catalog, setCatalog] = useState([]),
    [model, setModel] = useState(''),
    [rates, setRates] = useState({ input: 0.15, output: 0.6 }),
    [task, setTask] = useState('channel-topic'),
    [mode, setMode] = useState('a11y'),
    [guide, setGuide] = useState(false),
    [context, setContext] = useState('recent-4'),
    [vision, setVision] = useState(false),
    [cap, setCap] = useState(0.25),
    [steps, setSteps] = useState(12),
    [modal, setModal] = useState(null),
    [error, setError] = useState(''),
    [connecting, setConnecting] = useState(false),
    [busy, setBusy] = useState(false),
    [record, setRecord] = useState(null),
    [frame, setFrame] = useState(null),
    [episodeId, setEpisodeId] = useState('episode-001'),
    [selectedStep, setSelectedStep] = useState(null),
    [saved, setSaved] = useState([]),
    [eventFilter, setEventFilter] = useState(''),
    [auditIndex, setAuditIndex] = useState(0),
    [allOptions, setAllOptions] = useState(false),
    [demo, setDemo] = useState(false);
  const [replayRecord, setReplayRecord] = useState(null);
  function openReplay(value) {
    setReplayRecord(value);
    setModal('replay-player');
  }
  const abort = useRef(null),
    current = useRef(null),
    follow = useRef(true);
  useEffect(() => {
    api('config')
      .then((r) => r.json())
      .then(setSetup)
      .catch((e) => setError(e.message));
    refreshHistory();
    return () => abort.current?.abort();
  }, []);
  async function refreshHistory() {
    try {
      setSaved((await history()).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)));
    } catch {
      setError('Browser storage unavailable. Download evidence before leaving.');
    }
  }
  function chooseModel(id, p = provider) {
    setModel(id);
    const price = p === 'typesafe' ? [0.042, 0] : (hints[id] ?? [0, 0]);
    setRates({ input: price[0], output: price[1] });
    setVision(false);
  }
  function chooseProvider(p) {
    setProvider(p);
    setCatalog([]);
    setModel('');
    if (p === 'typesafe') {
      if (['pixels', 'api'].includes(mode)) setMode('json-ui');
      if (task === 'handoff-dm') setTask('channel-topic');
    }
    setError('');
  }
  async function connect() {
    setConnecting(true);
    setError('');
    try {
      const c = await (await api('models', { provider, key: keys[provider] })).json();
      setCatalog(c.models);
      chooseModel(
        c.models.find((m) => m.id === (provider === 'typesafe' ? 'jev-latest' : 'gpt-4o-mini'))
          ?.id ?? c.models[0]?.id,
        provider,
      );
      setModal(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setConnecting(false);
    }
  }
  async function start(compare = false) {
    if (!setup || !model || !keys[provider]) {
      setModal('connect');
      return;
    }
    if (
      !Number.isFinite(rates.input) ||
      rates.input <= 0 ||
      (provider === 'ramp' && rates.output <= 0)
    ) {
      setError('Confirm positive model pricing before a live run.');
      setModal('settings');
      return;
    }
    setError('');
    setBusy(true);
    setDemo(false);
    setRecord(null);
    setFrame(null);
    setSelectedStep(null);
    follow.current = true;
    abort.current = new AbortController();
    current.current = { run: null, events: [], artifacts: {}, audit: null };
    const config = {
      ...setup.defaults,
      provider,
      models: [{ id: model, rates, vision }],
      tasks: [task],
      interfaces: compare
        ? provider === 'typesafe'
          ? ['a11y', 'json-ui']
          : ['a11y', 'json-ui', 'api']
        : [mode],
      guides: [guide],
      histories: [context],
      maxSteps: steps,
      maxEstimatedUSD: cap,
    };
    try {
      const response = await api(
        'run',
        { provider, key: keys[provider], config },
        abort.current.signal,
      );
      const reader = response.body.getReader(),
        decoder = new TextDecoder();
      let buffer = '';
      let complete = false;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        if (buffer.length > 32 * 1024 * 1024) throw Error('Stream record too large.');
        let newline;
        while ((newline = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newline);
          buffer = buffer.slice(newline + 1);
          if (!line) continue;
          const { type, data } = JSON.parse(line);
          if (type === 'run') {
            current.current.run = data;
            const active =
              data.episodes.find((e) => e.status === 'running') ??
              data.episodes.filter((e) => e.status !== 'queued').at(-1);
            if (follow.current && active) setEpisodeId(active.cell.episodeId);
            setRecord({ ...current.current });
          }
          if (type === 'frame' && follow.current) {
            setFrame(data);
          }
          if (type === 'event') {
            current.current.events.push(data);
            setRecord({ ...current.current });
          }
          if (type === 'artifact') current.current.artifacts[data.path] = data.image;
          if (type === 'audit') {
            current.current.audit = data;
            setRecord({ ...current.current });
          }
          if (type === 'error') throw Error(data.message);
          if (type === 'done') complete = true;
        }
      }
      if (!complete)
        throw Error('Connection ended before the final audit arrived. This run is incomplete.');
    } catch (e) {
      const message =
        e.name === 'AbortError' ? 'Stopped. In-flight provider usage may be unknown.' : e.message;
      setError(message);
      current.current.error = message;
      if (current.current.run) {
        current.current.run = {
          ...current.current.run,
          status: 'interrupted',
          budget: { ...current.current.run.budget, usageKnown: false },
        };
        setRecord({ ...current.current });
      }
    } finally {
      setBusy(false);
      abort.current = null;
      if (current.current.run) {
        setRecord({ ...current.current });
        try {
          await saveRun(current.current);
          await refreshHistory();
        } catch {
          setError('History could not be saved. Download this evidence before leaving.');
        }
      }
    }
  }
  async function openRun(id) {
    try {
      const r = await readRun(id);
      setRecord(r);
      setFrame(null);
      setDemo(false);
      setEpisodeId(
        r.run.episodes.find((e) => e.status !== 'queued')?.cell.episodeId ?? 'episode-001',
      );
      setSelectedStep(null);
      follow.current = false;
      setModal(null);
    } catch {
      setError('Could not load this run.');
    }
  }
  const run = record?.run,
    episode = run?.episodes.find((e) => e.cell.episodeId === episodeId),
    events = (record?.events ?? []).filter((e) => e.episodeId === episodeId).map((e) => e.event),
    actions = events.filter((e) => e.kind === 'step'),
    activeStep = selectedStep == null ? actions.at(-1) : actions[selectedStep];
  const decision = (
    selectedStep == null
      ? events.filter((e) => e.kind === 'response').at(-1)?.response
      : activeStep?.response
  )?.decision;
  const ranked =
    decision?.candidates
      .map((c) => ({ ...c, p: decision.probabilities[c.name] }))
      .sort((a, b) => b.p - a.p) ?? [];
  const stepImage = activeStep?.observation?.imageFile ?? activeStep?.operatorScreenshot;
  const image =
    selectedStep != null
      ? record?.artifacts[`${episodeId}/${stepImage}`]
      : ((busy && frame?.episodeId === episodeId
          ? frame.image
          : (record?.artifacts[`${episodeId}/final.png`] ??
            (frame?.episodeId === episodeId ? frame.image : null))) ??
        (run ? null : '/demo/workspace.png'));
  const lastResponse =
    selectedStep == null
      ? events.filter((e) => e.kind === 'response').at(-1)?.response
      : activeStep?.response;
  const filteredEvents = (record?.events ?? []).filter(
    (x) => !eventFilter || JSON.stringify(x).toLowerCase().includes(eventFilter.toLowerCase()),
  );
  const auditEvent = filteredEvents[Math.min(auditIndex, Math.max(0, filteredEvents.length - 1))];
  const state = busy
    ? episode?.inFlight
      ? 'Deciding'
      : 'Running'
    : run?.status === 'completed'
      ? 'Complete'
      : run
        ? run.status
        : demo
          ? 'Recorded demo'
          : 'Ready';
  return (
    <div className="live-shell">
      <header className="nav">
        <a className="wordmark" href="/">
          <img className="relay-mark" src={relayMark} width="30" height="30" alt="" />
          Relay
          <span className="wordmark-dot" />
        </a>
        <span className="nav-divider" />
        <span className="nav-caption">Agents, in the open.</span>
        <div className="nav-spacer" />
        <button disabled={busy} onClick={() => setModal('duel')}>
          <Swords size={16} />
          1v1
        </button>
        <button disabled={busy} onClick={() => setModal('replays')}>
          <Film size={16} />
          Replays
        </button>
        <button onClick={() => setModal('history')}>
          <History size={16} />
          History{saved.length > 0 && <span className="count">{saved.length}</span>}
        </button>
        <button onClick={() => setModal('compare')}>
          <GitCompareArrows size={16} />
          Compare
        </button>
        <a
          className="icon"
          href="https://github.com/Kevin-Liu-01/Relay"
          target="_blank"
          rel="noreferrer"
          aria-label="GitHub repository"
        >
          <Github width={19} height={19} />
        </a>
        <button className="connect" onClick={() => setModal('connect')}>
          <KeyRound size={14} />
          {model ? 'Connected' : 'Connect a key'}
        </button>
      </header>
      {error && (
        <div className="error" role="alert">
          <AlertTriangle size={15} />
          <span>{error}</span>
          <button className="icon" aria-label="Dismiss error" onClick={() => setError('')}>
            <X size={14} />
          </button>
        </div>
      )}
      <section className="control-bar" aria-label="Run controls">
        <label className="select-field">
          <Slack width={17} height={17} />
          <select
            aria-label="Task"
            disabled={busy}
            value={task}
            onChange={(e) => setTask(e.target.value)}
          >
            {Object.entries(setup?.tasks ?? { 'channel-topic': 'Update a topic' }).map(
              ([id, label]) => (
                <option
                  key={id}
                  value={id}
                  disabled={provider === 'typesafe' && id === 'handoff-dm'}
                >
                  {label}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="select-field">
          <ModelMark id={model} />
          <select
            aria-label="Model"
            disabled={busy}
            value={model}
            onChange={(e) => chooseModel(e.target.value)}
          >
            <option value="">Choose a model</option>
            {catalog.map((m) => (
              <option key={m.id}>{m.id}</option>
            ))}
          </select>
        </label>
        <label className="select-field">
          <ModeIcon mode={mode} />
          <select
            aria-label="Interface"
            disabled={busy}
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            {Object.entries(MODES).map(([id, label]) => (
              <option
                key={id}
                value={id}
                disabled={provider === 'typesafe' && ['pixels', 'api'].includes(id)}
              >
                {label}
              </option>
            ))}
          </select>
        </label>
        <button className="icon" aria-label="Run settings" onClick={() => setModal('settings')}>
          <Settings2 size={17} />
        </button>
        <div className="nav-spacer" />
        {busy ? (
          <button className="primary stop" onClick={() => abort.current?.abort()}>
            <Square size={12} />
            Stop
          </button>
        ) : (
          <button className="primary" onClick={() => start()} disabled={!setup}>
            <Play size={13} />
            Run
          </button>
        )}
      </section>
      <main className="arena">
        <section className="viewport-column" aria-label="Live Slack workspace">
          <div className="workspace-top">
            <span className={`state-dot ${busy ? 'running' : ''}`} />
            <span>{state}</span>
            <span className="workspace-task">
              {episode?.instruction ?? 'A fresh workspace for every episode.'}
            </span>
            <span className="read-only">
              <Eye size={12} />
              Read-only
            </span>
          </div>
          <div className="viewport">
            {image ? (
              <img src={image} alt={busy ? 'Live agent workspace' : 'Recorded workspace'} />
            ) : (
              <div className="frame-unavailable" role="status">
                {busy ? 'Waiting for the workspace…' : 'No frame recorded for this step.'}
              </div>
            )}
            {!run && (
              <div className="welcome">
                <span className="mini-label">SLACK / COMPUTER USE</span>
                <h1>Watch the next move.</h1>
                <p>
                  Connect a model. Give it a task.
                  <br />
                  See every action, and what changed.
                </p>
                <div>
                  <button className="primary" onClick={() => setModal('connect')}>
                    <KeyRound size={14} />
                    Bring your own key
                  </button>
                  <button onClick={() => setModal('replays')}>
                    <Play size={13} />
                    Watch a replay
                  </button>
                </div>
              </div>
            )}
            <div className="viewport-tag">
              <Radio size={12} />
              {busy
                ? 'Live stream'
                : run
                  ? image
                    ? 'Recorded replay'
                    : 'Frame unavailable'
                  : 'Reference screenshot'}
            </div>
          </div>
          <div className="timeline">
            <button disabled={busy || !record?.run} onClick={() => openReplay(record)}>
              <Play size={14} />
              Play replay
            </button>
            <button
              title="Follow latest"
              onClick={() => {
                setSelectedStep(null);
                follow.current = true;
              }}
            >
              <RefreshCw size={13} />
              <span>Latest</span>
            </button>
            <input
              type="range"
              aria-label="Replay step"
              min={0}
              max={Math.max(0, actions.length - 1)}
              disabled={busy || !actions.length}
              value={selectedStep ?? Math.max(0, actions.length - 1)}
              onChange={(e) => {
                follow.current = false;
                setSelectedStep(Number(e.target.value));
              }}
            />
            <span className="numeric">
              {actions.length ? (selectedStep ?? actions.length - 1) + 1 : 0} / {actions.length}
            </span>
            <button disabled={!record} onClick={() => setModal('audit')}>
              <ShieldCheck size={14} />
              Audit
              <ArrowUpRight size={12} />
            </button>
          </div>
        </section>
        <aside className="decision-panel" aria-label="Agent decisions">
          <div className="panel-top">
            <span className="mini-label">{decision ? 'SYSTEM ONE' : 'POLICY'}</span>
            <span className="latency">{elapsed(lastResponse?.latencyMs)}</span>
          </div>
          <div className="model-heading">
            <ModelMark id={episode?.cell.model.id ?? model} size={27} />
            <div>
              <h2>{(episode?.cell.model.id ?? model) || 'Your model'}</h2>
              <span>
                {run?.config.provider === 'typesafe' || (!run && provider === 'typesafe')
                  ? 'Selects an offered action'
                  : 'Generates an action'}
              </span>
            </div>
          </div>
          <div className="panel-divider" />
          <ActionSpotlight
            events={events}
            busy={busy}
            selected={selectedStep == null ? null : activeStep}
            episode={episode}
          />
          {decision ? (
            <>
              <div className="section-label">
                <h3>Action probabilities</h3>
                <span>{ranked.length} options</span>
              </div>
              <div className="options-list">
                {(allOptions ? ranked : ranked.slice(0, 8)).map((c) => (
                  <div
                    className={`option ${c.name === decision.choice ? 'chosen' : ''}`}
                    key={c.name}
                  >
                    <div>
                      <span>{c.label}</span>
                      <b className="numeric">{(c.p * 100).toFixed(1)}%</b>
                    </div>
                    <div className="probability-track">
                      <i
                        style={{
                          width: '100%',
                          transform: `scaleX(${c.p})`,
                          transformOrigin: 'left',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {ranked.length > 8 && (
                <button className="small-link" onClick={() => setAllOptions(!allOptions)}>
                  {allOptions ? 'Fewer options' : `All ${ranked.length} options`}
                </button>
              )}
              <p className="probability-note">
                Probabilities over this offered menu. Not a measured chance of task success.
              </p>
            </>
          ) : (
            <>
              <div className="section-label">
                <h3>Actions</h3>
                <span>{actions.length} recorded</span>
              </div>
              <div className="actions">
                {actions.length ? (
                  actions.map((s, i) => (
                    <button
                      key={i}
                      disabled={busy}
                      className={`action ${s.error ? 'rejected' : ''} ${selectedStep === i ? 'selected' : ''}`}
                      onClick={() => {
                        setSelectedStep(i);
                        follow.current = false;
                      }}
                    >
                      <span className="action-number">{String(i + 1).padStart(2, '0')}</span>
                      <span>
                        <b>{s.action?.type ?? 'Rejected action'}</b>
                        <small>
                          {s.action?.text ?? s.action?.topic ?? s.error ?? s.action?.ref ?? ' '}
                        </small>
                      </span>
                      <span className="action-time">{elapsed(s.response?.latencyMs)}</span>
                    </button>
                  ))
                ) : (
                  <div className="action-placeholder">
                    <Workflow size={24} />
                    <p>Decisions will appear here.</p>
                    <span>
                      {provider === 'typesafe'
                        ? 'Jev returns a ranked choice, not generated text.'
                        : 'Exact actions, timing and outcomes.'}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
          {busy && (
            <div className="thinking" role="status">
              <span className="state-dot running" />
              {episode?.inFlight ? 'Model is deciding…' : 'Interacting with the workspace…'}
            </div>
          )}
          <div className="panel-bottom">
            {episode?.evaluation ? (
              <ResultCard
                episode={episode}
                onReplay={!busy ? () => openReplay(record) : undefined}
              />
            ) : (
              <span className="quiet-note">
                <ShieldCheck size={14} />
                Outcome checked independently
              </span>
            )}
            <button className="full-width" disabled={!record} onClick={() => setModal('audit')}>
              Inspect the evidence
              <ArrowUpRight size={14} />
            </button>
          </div>
        </aside>
      </main>
      {modal === 'duel' && setup && (
        <Modal title="1v1 arena" wide close={() => setModal(null)}>
          <Duel
            setup={setup}
            task={task}
            mode={mode}
            guide={guide}
            context={context}
            cap={cap}
            steps={steps}
            connection={{ provider, key: keys[provider], model, catalog, rates }}
            onReplay={openReplay}
            onSaved={refreshHistory}
          />
        </Modal>
      )}
      {modal === 'replays' && (
        <Modal title="Replays" wide close={() => setModal(null)}>
          <ReplayLibrary
            saved={saved}
            onRecording={openReplay}
            onSaved={async (id) => openReplay(await readRun(id))}
          />
        </Modal>
      )}
      {modal === 'replay-player' && replayRecord && (
        <Modal title="Replay studio" wide close={() => setModal(null)}>
          <ReplayPlayer record={replayRecord} />
        </Modal>
      )}
      <section className="episode-bar" aria-label="Episodes">
        {run?.episodes.map((e, i) => (
          <button
            key={e.cell.episodeId}
            className={e.cell.episodeId === episodeId ? 'selected' : ''}
            disabled={busy && e.status === 'queued'}
            onClick={() => {
              setEpisodeId(e.cell.episodeId);
              setSelectedStep(null);
              follow.current = false;
            }}
          >
            <span className={e.evaluation?.success ? 'pass-text' : ''}>
              {e.evaluation ? (e.evaluation.success ? '✓' : '×') : String(i + 1).padStart(2, '0')}
            </span>
            <ModeIcon mode={e.cell.mode} />
            {MODES[e.cell.mode]}
          </button>
        ))}
        {!run && (
          <span>
            <Layers size={14} />
            One task. Multiple ways to interact.
          </span>
        )}
        <div className="nav-spacer" />
        <span className="quiet-note">
          {run?.config.provider === 'typesafe'
            ? 'Text observation · candidate policy'
            : mode === 'api'
              ? 'API is not a screenshot-policy benchmark'
              : 'Isolated workspace · hidden outcome grader'}
        </span>
      </section>
      <footer>
        <span>
          <span className={`state-dot ${model ? 'connected' : ''}`} />
          {model ? (provider === 'typesafe' ? 'TypeSafe' : 'Ramp Router') : 'No key connected'}
        </span>
        <div className="nav-spacer" />
        <span className="numeric">
          {run?.budget.requests ?? 0}
          <small>calls</small>
        </span>
        <span className="numeric">
          {((run?.budget.inputTokens ?? 0) + (run?.budget.outputTokens ?? 0)).toLocaleString()}
          <small>tokens</small>
        </span>
        <span className="numeric">
          {money(run?.budget.estimatedUSD ?? 0)}
          <small>
            {run?.budget.usageKnown === false ? 'reserved · usage unknown' : 'estimated'}
          </small>
        </span>
        <span className="local-note">History stays in this browser</span>
      </footer>
      {modal === 'connect' && (
        <Modal title="Connect your model" close={() => setModal(null)}>
          <div className="provider-tabs">
            {[
              ['ramp', 'Ramp Router'],
              ['typesafe', 'Jev · TypeSafe'],
            ].map(([id, label]) => (
              <button
                className={provider === id ? 'selected' : ''}
                key={id}
                disabled={busy}
                onClick={() => chooseProvider(id)}
              >
                {id === 'typesafe' ? <Workflow size={16} /> : <Layers size={16} />} {label}
              </button>
            ))}
          </div>
          <label className="field">
            {provider === 'typesafe' ? 'TypeSafe' : 'Ramp Router'} API key
            <input
              type="password"
              aria-label="Provider API key"
              autoComplete="off"
              spellCheck={false}
              value={keys[provider]}
              onChange={(e) => setKeys({ ...keys, [provider]: e.target.value })}
              placeholder="Paste your key"
            />
          </label>
          <p className="hint">
            Used only for this connection and run. Never saved in browser storage or Relay traces.
            Relay’s server sends it only to{' '}
            {provider === 'typesafe' ? 'api.typesafe.ai' : 'api.router.com'}. Set a spending cap
            with your provider.
          </p>
          <div className="modal-actions">
            <a
              href={
                provider === 'typesafe'
                  ? 'https://console.typesafe.ai'
                  : 'https://docs.router.com/getting-started/quickstart'
              }
              target="_blank"
              rel="noreferrer"
            >
              Get a key
              <ArrowUpRight size={12} />
            </a>
            <button
              onClick={() => {
                setKeys({ ...keys, [provider]: '' });
                setModel('');
                setCatalog([]);
              }}
            >
              <Unplug size={14} />
              Forget key
            </button>
            <button
              className="primary"
              disabled={connecting || busy || !keys[provider]}
              onClick={connect}
            >
              {connecting ? 'Connecting…' : 'Connect'}
              <ChevronRight size={14} />
            </button>
          </div>
        </Modal>
      )}
      {modal === 'settings' && (
        <Modal title="Run settings" close={() => setModal(null)}>
          <div className="two-fields">
            <label className="field">
              Input $ / 1M tokens
              <input
                type="number"
                min="0.001"
                step="0.001"
                aria-label="Input price"
                value={rates.input}
                onChange={(e) => setRates({ ...rates, input: Number(e.target.value) })}
              />
            </label>
            <label className="field">
              Output $ / 1M tokens
              <input
                type="number"
                min="0"
                step="0.01"
                aria-label="Output price"
                disabled={provider === 'typesafe'}
                value={rates.output}
                onChange={(e) => setRates({ ...rates, output: Number(e.target.value) })}
              />
            </label>
          </div>
          <p className="hint">
            Dated hints, not a bill. Confirm your current provider rates before running.
          </p>
          <div className="two-fields">
            <label className="field">
              Estimated spend cap
              <input
                type="number"
                aria-label="Spend cap"
                min="0.01"
                max="0.5"
                step="0.01"
                value={cap}
                onChange={(e) => setCap(Number(e.target.value))}
              />
            </label>
            <label className="field">
              Max actions
              <input
                type="number"
                aria-label="Max actions"
                min="1"
                max="16"
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
              />
            </label>
          </div>
          <label className="check">
            <input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} />
            Supply llms.txt + interaction guide
          </label>
          <label className="field">
            Context
            <select value={context} onChange={(e) => setContext(e.target.value)}>
              <option value="recent-4">Last four turns</option>
              <option value="full">Full episode history</option>
            </select>
          </label>
          {provider === 'ramp' && (
            <label className="check">
              <input
                type="checkbox"
                checked={vision}
                onChange={(e) => setVision(e.target.checked)}
              />
              I verified this model supports images
            </label>
          )}
          <p className="hint">
            Jev uses a deterministic menu of visible controls and text quoted in the task. It cannot
            compose arbitrary new text; handoff composition is LLM-only. The candidate generator is
            part of the policy.
          </p>
          <button className="primary full-width" onClick={() => setModal(null)}>
            Done
          </button>
        </Modal>
      )}
      {modal === 'history' && (
        <Modal title="Run history" close={() => setModal(null)} wide>
          <p className="hint">
            Private to this browser. No shared server history. Download evidence to keep it
            elsewhere.
          </p>
          {!saved.length ? (
            <p>No runs yet. Connect a key and press Run.</p>
          ) : (
            saved.map((s) => (
              <div className="history-row" key={s.id}>
                <ModelMark id={s.run.config.models[0].id} />
                <button className="history-main" disabled={busy} onClick={() => openRun(s.id)}>
                  <b>{s.run.config.models[0].id}</b>
                  <span>
                    {s.duel && `1v1 ${s.duel.side === 0 ? 'A' : 'B'} · ${s.duel.id.slice(0, 6)} · `}
                    {setup?.tasks[s.run.config.tasks[0]]} ·{' '}
                    {new Date(s.capturedAt).toLocaleString()}
                  </span>
                </button>
                <span className="status-pill">{s.run.status}</span>
                <button
                  className="icon"
                  aria-label={`Download run ${s.id.slice(0, 8)}`}
                  onClick={async () => downloadEvidence(await readRun(s.id))}
                >
                  <Download size={16} />
                </button>
                <button
                  className="icon"
                  aria-label={`Delete run ${s.id.slice(0, 8)}`}
                  onClick={async () => {
                    if (
                      confirm(
                        'Delete this browser’s saved copy? Download it first if you want to keep it.',
                      )
                    ) {
                      await deleteRun(s.id);
                      await refreshHistory();
                    }
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))
          )}
        </Modal>
      )}
      {modal === 'compare' && (
        <Modal title="Compare runs" close={() => setModal(null)} wide>
          <p className="hint">
            Same task, seed, guide and history make useful comparisons. Interfaces change visibility
            and action granularity. These are development tasks, not a general leaderboard.
          </p>
          <button
            className="primary"
            disabled={busy || !model}
            onClick={() => {
              setModal(null);
              start(true);
            }}
          >
            <GitCompareArrows size={15} />
            Run matched interfaces
          </button>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {[
                    'Model / policy',
                    'Task / seed',
                    'Interface',
                    'Context',
                    'Outcome',
                    'Actions',
                    'Latency',
                    'Est. cost',
                  ].map((x) => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {saved.flatMap((s) =>
                  s.run.episodes
                    .filter((e) => e.status !== 'queued')
                    .map((e) => (
                      <tr key={`${s.id}/${e.cell.episodeId}`}>
                        <td>
                          <span className="model-cell">
                            <ModelMark id={e.cell.model.id} />
                            {e.cell.model.id}
                          </span>
                          <small>
                            {s.run.config.provider === 'typesafe'
                              ? 'Candidate selection'
                              : 'Action generation'}
                          </small>
                        </td>
                        <td>
                          {setup?.tasks[e.cell.taskId]}
                          <small>Seed {e.cell.seed}</small>
                        </td>
                        <td>{MODES[e.cell.mode]}</td>
                        <td>
                          {e.cell.guide ? 'Guide' : 'No guide'}
                          <small>{e.cell.history}</small>
                        </td>
                        <td>
                          {e.evaluation ? (e.evaluation.success ? 'Pass' : 'Incomplete') : e.status}
                          {!s.completeAudit && <small>Partial capture</small>}
                        </td>
                        <td>{e.steps}</td>
                        <td>{elapsed(e.durationMs)}</td>
                        <td>
                          {money(e.estimatedUSD)}
                          {e.usageKnown === false ? ' *' : ''}
                        </td>
                      </tr>
                    )),
                )}
              </tbody>
            </table>
          </div>
          {!saved.length && <p className="hint">Your completed runs will appear here.</p>}
        </Modal>
      )}
      {modal === 'audit' && record && (
        <Modal title="Audit trace" close={() => setModal(null)} wide>
          <div className="audit-toolbar">
            <span className="status-pill">
              <ShieldCheck size={14} />
              {record.audit?.integrity.status ?? 'Partial · final audit not received'}
            </span>
            <div className="nav-spacer" />
            <button onClick={() => downloadEvidence(record)}>
              <Download size={15} />
              Full evidence
            </button>
          </div>
          <label className="search">
            <Search size={15} />
            <input
              placeholder="Search every recorded event"
              aria-label="Search audit events"
              value={eventFilter}
              onChange={(e) => {
                setEventFilter(e.target.value);
                setAuditIndex(0);
              }}
            />
          </label>
          <div className="audit-layout">
            <div className="audit-list">
              {filteredEvents.map((x, i) => (
                <button
                  className={i === auditIndex ? 'selected' : ''}
                  key={i}
                  onClick={() => setAuditIndex(i)}
                >
                  <span>{x.event.kind}</span>
                  <small>
                    {x.episodeId} · {x.event.step ?? '—'}
                  </small>
                </button>
              ))}
            </div>
            <div className="audit-detail">
              <pre>{JSON.stringify(auditEvent?.event ?? {}, null, 2)}</pre>
              {auditEvent?.event.requestFile && (
                <details>
                  <summary>Exact request body</summary>
                  <pre>
                    {JSON.stringify(
                      record.audit?.episodes.find(
                        (e) => e.episode.cell.episodeId === auditEvent.episodeId,
                      )?.inputs[auditEvent.event.requestFile] ??
                        'Available when the final audit arrives.',
                      null,
                      2,
                    )}
                  </pre>
                </details>
              )}
            </div>
          </div>
          <details>
            <summary>State changes, outcome checks and integrity</summary>
            <pre>
              {JSON.stringify(
                record.audit
                  ? {
                      integrity: record.audit.integrity,
                      episodes: record.audit.episodes.map((e) => ({
                        id: e.episode.cell.episodeId,
                        initial: e.initial,
                        outcome: e.outcome,
                      })),
                    }
                  : 'No complete audit was received.',
                null,
                2,
              )}
            </pre>
          </details>
        </Modal>
      )}
      {modal === 'demo' && (
        <Modal title="Reference demonstration" close={() => setModal(null)} wide>
          <p className="hint">
            Recorded, scripted verification—not live inference or a model score. The public build is
            tested on six Slack workflows.
          </p>
          <img
            className="demo-image"
            src="/demo/lab.png"
            alt="Three reference interfaces completed in the local Relay lab"
          />
          <div className="modal-actions">
            <a href="/demo/trajectory.json" download>
              <FileJson size={15} />
              Download reference trajectory
            </a>
            <button className="primary" onClick={() => setModal('connect')}>
              Run your own model
              <ArrowUpRight size={14} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
createRoot(document.getElementById('root')).render(<App />);
