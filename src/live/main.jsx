import React, { useEffect, useRef, useState } from 'react';
import { supportsChoice } from '../../shared/task-catalog.mjs';
import { episodeOutcome } from '../../shared/run-outcome.mjs';
import { createRoot } from 'react-dom/client';
import {
  Play,
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
  LoaderCircle,
} from 'lucide-react';
import Github from '@thesvg/react/github';
import { ModelMark } from '../lab/model-mark.jsx';
import relayMark from '../assets/relay-mark.svg';
import { history, readRun, saveRun, deleteRun, downloadEvidence } from './storage.js';
import {
  readCredentials,
  saveCredential,
  setRememberCredentials,
  forgetCredential,
} from './credentials.js';
import './style.css';
import './experience.css';
import { ActionSpotlight, ResultCard } from './feedback.jsx';
import { ReplayPlayer, ReplayLibrary } from './replay.jsx';
import { Duel } from './duel.jsx';
import { RelaySelect } from './select.jsx';
import { TaskIcon, ModeIcon } from './select-icons.jsx';
import { createConnections, preferredModel, validKey } from './connections.js';
import { RunButton, ModelPrice, useLaunchLock } from './run-button.jsx';
import { makeRunPlan, queueMustStop } from './run-plan.mjs';

const MODES = { a11y: 'Accessibility', 'json-ui': 'Page JSON', pixels: 'Pixels', api: 'Actor API' };
const elapsed = (n) =>
  n == null ? '—' : n < 1000 ? `${Math.round(n)} ms` : `${(n / 1000).toFixed(1)} s`;
const money = (n) => (n == null ? '—' : `$${n.toFixed(5)}`);
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
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const [remembered] = useState(() => readCredentials());
  const [rememberKeys, setRememberKeys] = useState(remembered.remember);
  const rememberPreference = useRef(remembered.remember);
  const [setup, setSetup] = useState(null),
    [provider, setProvider] = useState(remembered.provider),
    [keys, setKeys] = useState(remembered.keys),
    [catalog, setCatalog] = useState([]),
    [model, setModel] = useState(''),
    [rates, setRates] = useState(null),
    [task, setTask] = useState('channel-topic'),
    [mode, setMode] = useState('a11y'),
    [guide, setGuide] = useState(false),
    [context, setContext] = useState('recent-4'),
    [vision, setVision] = useState(false),
    [cap, setCap] = useState(2),
    [steps, setSteps] = useState(40),
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
  const [batchModels, setBatchModels] = useState([]);
  const [modelSearch, setModelSearch] = useState('');
  const [queue, setQueue] = useState(null);
  const [connections] = useState(createConnections);
  const launch = useLaunchLock();
  const connectTimer = useRef(null);
  function openReplay(value) {
    setReplayRecord(value);
    setModal('replay-player');
  }
  const abort = useRef(null),
    connectionVersion = useRef(0),
    current = useRef(null),
    follow = useRef(true);
  useEffect(() => {
    api('config')
      .then((r) => r.json())
      .then(setSetup)
      .catch((e) => setError(e.message));
    refreshHistory();
    if (remembered.keys[remembered.provider])
      connect(remembered.provider, remembered.keys[remembered.provider], true);
    return () => {
      abort.current?.abort();
      connections.close();
      clearTimeout(connectTimer.current);
      connectionVersion.current++;
    };
  }, []);
  async function refreshHistory() {
    try {
      setSaved((await history()).sort((a, b) => b.capturedAt.localeCompare(a.capturedAt)));
    } catch {
      setError('Browser storage unavailable. Download evidence before leaving.');
    }
  }
  function chooseModel(id, models = catalog) {
    setModel(id);
    setRates(models.find((m) => m.id === id)?.rates ?? null);
    setVision(false);
  }
  function chooseProvider(p) {
    clearTimeout(connectTimer.current);
    connectionVersion.current++;
    setConnecting(false);
    setProvider(p);
    setCatalog([]);
    setModel('');
    setRates(null);
    if (p === 'typesafe') {
      if (['pixels', 'api'].includes(mode)) setMode('json-ui');
      if (!supportsChoice(task)) {
        setTask('channel-topic');
      }
    }
    setError('');
    if (validKey(keys[p])) connect(p, keys[p], true);
  }
  function rememberConnectedKey(p, key) {
    setKeys((old) => ({ ...old, [p]: key }));
    try {
      saveCredential(p, key, rememberPreference.current);
      return '';
    } catch {
      return 'Connected for this tab, but browser storage is unavailable. The key could not be saved.';
    }
  }
  function changeRemember(remember) {
    rememberPreference.current = remember;
    setRememberKeys(remember);
    try {
      setRememberCredentials(remember);
      setError('');
      return '';
    } catch {
      const message =
        'Browser storage could not be updated. Clear this site’s data in your browser to remove any saved keys.';
      setError(message);
      return message;
    }
  }
  function forgetKey(p = provider) {
    connections.forget(p);
    clearTimeout(connectTimer.current);
    if (p === provider) {
      connectionVersion.current++;
      setConnecting(false);
      setModel('');
      setCatalog([]);
      setRates(null);
    }
    setKeys((old) => ({ ...old, [p]: '' }));
    try {
      forgetCredential(p);
      setError('');
      return '';
    } catch {
      const message =
        'Key cleared from this tab, but the saved copy could not be removed. Clear this site’s data in your browser.';
      setError(message);
      return message;
    }
  }
  async function connect(p = provider, inputKey = keys[p], restoring = false) {
    clearTimeout(connectTimer.current);
    const key = inputKey.trim();
    const version = ++connectionVersion.current;
    setConnecting(true);
    setError('');
    setModel('');
    setCatalog([]);
    setRates(null);
    try {
      const c = await connections.get(p, key);
      if (version !== connectionVersion.current) return;
      setCatalog(c.models);
      const selected = preferredModel(c.models, p);
      chooseModel(selected, c.models);
      const pricingWarning = selected
        ? ''
        : 'Connected, but published pricing is unavailable for these models. Try again later.';
      // Restoring never writes a key back: another tab may have forgotten it.
      if (!restoring) {
        setError(rememberConnectedKey(p, key) || pricingWarning);
        setModal((open) => (open === 'connect' ? null : open));
      } else setError(pricingWarning);
    } catch (e) {
      if (version === connectionVersion.current && e.name !== 'AbortError')
        setError(
          restoring
            ? 'Saved key could not reconnect. Open Connect a key to update or forget it.'
            : e.message,
        );
    } finally {
      if (version === connectionVersion.current) setConnecting(false);
    }
  }
  async function start(compare = false, selected = [{ id: model, rates, vision }]) {
    if (busy || connecting) return;
    if (!setup || !model || !keys[provider]) {
      setModal('connect');
      return;
    }
    let jobs;
    try {
      jobs = makeRunPlan({
        setup,
        provider,
        models: selected,
        task,
        mode,
        guide,
        context,
        cap,
        steps,
        compare,
      });
    } catch (e) {
      setError(e.message);
      return;
    }
    if (!launch.acquire()) return;
    setError('');
    setBusy(true);
    setModal(null);
    abort.current = new AbortController();
    const controller = abort.current;
    const batch =
      jobs.length > 1
        ? {
            id: crypto.randomUUID(),
            total: jobs.length,
            capUSD: cap * jobs.length,
            execution: 'sequential',
          }
        : null;
    setQueue(batch ? { ...batch, completed: 0, stopped: false } : null);
    try {
      for (let i = 0; i < jobs.length; i++) {
        if (controller.signal.aborted) break;
        const result = await executeRun(
          jobs[i],
          controller.signal,
          batch && { ...batch, index: i },
        );
        if (batch) setQueue((old) => ({ ...old, completed: i + 1 }));
        if (controller.signal.aborted || queueMustStop(result)) {
          if (batch && i < jobs.length - 1) {
            setQueue((old) => ({ ...old, stopped: true }));
            setError(
              'Queue stopped: a request was interrupted or its usage/evidence is incomplete. Remaining models were not called. Inspect this run before starting another.',
            );
          }
          break;
        }
      }
    } finally {
      abort.current = null;
      setBusy(false);
      launch.release();
    }
  }
  async function executeRun(config, signal, batch) {
    setDemo(false);
    setRecord(null);
    setFrame(null);
    setSelectedStep(null);
    follow.current = true;
    current.current = { run: null, events: [], artifacts: {}, audit: null, batch };
    try {
      const response = await api('run', { provider, key: keys[provider], config }, signal);
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
      if (current.current.run) {
        setRecord({ ...current.current });
        try {
          await saveRun(current.current);
          await refreshHistory();
        } catch {
          current.current.error = 'History could not be saved.';
          setError('History could not be saved. Download this evidence before leaving.');
        }
      }
    }
    return current.current;
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
        (run || busy ? null : '/demo/workspace.png'));
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
    : episode && episodeOutcome(episode).kind !== 'pending'
      ? episodeOutcome(episode).title
      : run
        ? run.status
        : demo
          ? 'Recorded demo'
          : 'Ready';
  return (
    <div className={`live-shell ${run || busy ? 'workspace-expanded' : ''}`}>
      <header className="nav">
        <a className="wordmark" href="/">
          <img className="relay-mark" src={relayMark} width="30" height="30" alt="" />
          Relay
          <span className="wordmark-dot" />
        </a>
        <span className="nav-divider" />
        <span className="nav-caption">Agents, in the open.</span>
        <div className="nav-spacer" />
        <a className="try-slack" href="/play" target="_blank" rel="noreferrer">
          <ArrowUpRight size={16} />
          Try Slack
        </a>
        <button disabled={busy || connecting} onClick={() => setModal('duel')}>
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
        <button className="connect" disabled={busy} onClick={() => setModal('connect')}>
          {connecting ? (
            <LoaderCircle className="busy-spinner" size={14} />
          ) : (
            <KeyRound size={14} />
          )}
          {connecting ? 'Connecting…' : catalog.length ? 'Connected' : 'Connect a key'}
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
        <RelaySelect
          label="Task"
          disabled={busy}
          value={task}
          onChange={(id) => {
            setTask(id);
          }}
          options={Object.entries(setup?.tasks ?? { 'channel-topic': 'Update a topic' }).map(
            ([id, label]) => ({
              value: id,
              label,
              icon: <TaskIcon task={id} />,
              disabled: provider === 'typesafe' && !supportsChoice(id),
              disabledReason: 'This workflow needs text composition. Choose a generative model.',
            }),
          )}
        />
        <RelaySelect
          label="Model"
          id="relay-model-selector"
          open={modelMenuOpen}
          onOpenChange={setModelMenuOpen}
          disabled={busy || connecting}
          value={model}
          onChange={(id) => chooseModel(id)}
          placeholder={connecting ? 'Loading models…' : 'Choose a model'}
          placeholderIcon={<ModelMark />}
          emptyText="Connect a key to see models"
          wide
          options={catalog.map((m) => ({
            value: m.id,
            label: m.id,
            icon: <ModelMark id={m.id} />,
            disabled: !m.rates,
            disabledReason:
              m.unavailableReason ?? 'Published pricing unavailable for this exact model ID.',
          }))}
        />
        <RelaySelect
          label="Interface"
          disabled={busy}
          value={mode}
          onChange={setMode}
          options={Object.entries(MODES).map(([id, label]) => ({
            value: id,
            label,
            icon: <ModeIcon mode={id} />,
            disabled: provider === 'typesafe' && ['pixels', 'api'].includes(id),
            disabledReason: 'Jev supports Accessibility and Page JSON.',
          }))}
        />
        <button
          className="icon"
          disabled={busy}
          aria-label="Run settings"
          onClick={() => setModal('settings')}
        >
          <Settings2 size={17} />
        </button>
        <div className="nav-spacer" />
        <RunButton
          label="Run"
          busy={busy}
          starting={!frame && !actions.length}
          disabled={!setup || connecting || (!!catalog.length && !rates)}
          onStart={() => start()}
          onStop={() => abort.current?.abort()}
        />
      </section>
      <div className="run-toolbar">
        <button
          disabled={busy || connecting || !catalog.some((m) => m.rates) || mode === 'pixels'}
          onClick={() => {
            setBatchModels(model ? [model] : []);
            setModelSearch('');
            setModal('models');
          }}
        >
          <Layers size={14} /> Try models
        </button>
        <span>
          ${cap.toFixed(2)} allowance / model · {steps} actions ·{' '}
          {setup?.defaults.episodeSeconds ?? 180}s
        </span>
        {queue && (
          <span role="status" className="queue-progress">
            {queue.stopped ? 'Queue paused' : busy ? 'Model queue' : 'Queue finished'} ·{' '}
            {queue.completed} / {queue.total}
          </span>
        )}
      </div>
      <main className="arena">
        <section className="viewport-column" aria-label="Live Slack workspace">
          <div className="workspace-top">
            <span className={`state-dot ${busy ? 'running' : ''}`} />
            <span role="status">
              {busy && !frame && !actions.length
                ? 'Starting workspace…'
                : connecting
                  ? 'Loading models…'
                  : state}
            </span>
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
                {busy && <LoaderCircle className="busy-spinner" size={22} aria-hidden="true" />}
                {busy ? 'Preparing a fresh workspace…' : 'No frame recorded for this step.'}
              </div>
            )}
            {!run && !busy && (
              <div className="welcome">
                <h1>
                  Try out <span className="welcome-accent">Computer Use</span>
                </h1>
                <p>
                  {model ? 'Your model is ready. Pick a task.' : 'Connect a model. Give it a task.'}
                  <br />
                  See every action, and what changed.
                </p>
                <div>
                  <button
                    className="primary"
                    disabled={connecting}
                    onClick={() => (model ? start() : setModal('connect'))}
                  >
                    {model ? <Play size={14} /> : <KeyRound size={14} />}
                    {model ? 'Run this task' : 'Bring your own key'}
                  </button>
                  <button onClick={() => setModal('replays')}>
                    <Play size={13} />
                    Watch a replay
                  </button>
                  <a className="try-slack" href="/play" target="_blank" rel="noreferrer">
                    <ArrowUpRight size={14} />
                    Try Slack yourself
                  </a>
                </div>
              </div>
            )}
            <div className="viewport-tag">
              <Radio size={12} />
              {busy
                ? image
                  ? 'Live stream'
                  : 'Connecting'
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
          <div className="model-heading">
            <ModelMark id={episode?.cell.model.id ?? model} size={20} />
            <div>
              <h2>{(episode?.cell.model.id ?? model) || 'Your model'}</h2>
            </div>
            <span className="latency">{elapsed(lastResponse?.latencyMs)}</span>
          </div>
          {((!episode?.evaluation && !episode?.error) || busy) && (
            <ActionSpotlight
              events={events}
              busy={busy}
              selected={selectedStep == null ? null : activeStep}
              episode={episode}
            />
          )}
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
          ) : actions.length || (!episode?.evaluation && !episode?.error) || busy ? (
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
                    <p>
                      {episode?.error ? 'No decisions returned.' : 'Decisions will appear here.'}
                    </p>
                    <span>
                      {provider === 'typesafe'
                        ? 'Jev returns a ranked choice, not generated text.'
                        : 'Exact actions, timing and outcomes.'}
                    </span>
                  </div>
                )}
              </div>
            </>
          ) : null}
          {busy && (
            <div className="thinking" role="status">
              <span className="state-dot running" />
              {!frame && !actions.length
                ? 'Preparing a fresh workspace…'
                : episode?.inFlight
                  ? 'Model is deciding…'
                  : 'Interacting with the workspace…'}
            </div>
          )}
          <div className="panel-bottom">
            {episode?.evaluation || episode?.error ? (
              <ResultCard
                episode={episode}
                onReplay={!busy ? () => openReplay(record) : undefined}
                onChooseModel={
                  !busy
                    ? () => {
                        document
                          .getElementById('relay-model-selector')
                          ?.scrollIntoView({ block: 'center' });
                        setModelMenuOpen(true);
                      }
                    : undefined
                }
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
            providerKeys={keys}
            connections={connections}
            rememberKeys={rememberKeys}
            onRememberChange={changeRemember}
            onConnectedKey={(p, key, models) => {
              if (p === provider) {
                setCatalog(models);
                chooseModel(
                  models.some((m) => m.id === model) ? model : preferredModel(models, p),
                  models,
                );
              }
              return rememberConnectedKey(p, key);
            }}
            onForgetKey={forgetKey}
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
            <span className={episodeOutcome(e).kind === 'passed' ? 'pass-text' : ''}>
              {e.evaluation || e.error ? episodeOutcome(e).symbol : String(i + 1).padStart(2, '0')}
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
          <span className={`state-dot ${catalog.length ? 'connected' : ''}`} />
          {catalog.length
            ? provider === 'typesafe'
              ? 'TypeSafe'
              : 'Ramp Router'
            : 'No key connected'}
        </span>
        <div className="nav-spacer" />
        <span className="numeric">
          {run?.budget.requests ?? 0}
          <small>calls</small>
        </span>
        <span className="numeric">
          {run?.budget.usageKnown === false
            ? 'Unknown'
            : ((run?.budget.inputTokens ?? 0) + (run?.budget.outputTokens ?? 0)).toLocaleString()}
          <small>tokens</small>
        </span>
        <span className="numeric">
          {money(run?.budget.estimatedUSD ?? 0)}
          <small>
            {run?.budget.usageKnown === false ? 'budget allowance · not a charge' : 'estimated'}
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
                disabled={busy || connecting}
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
              disabled={busy}
              onChange={(e) => {
                const key = e.target.value;
                connectionVersion.current++;
                connections.forget(provider);
                clearTimeout(connectTimer.current);
                setConnecting(false);
                setKeys({ ...keys, [provider]: key });
                setModel('');
                setCatalog([]);
                setRates(null);
                if (validKey(key))
                  connectTimer.current = setTimeout(() => connect(provider, key), 600);
              }}
              placeholder="Paste your key"
            />
          </label>
          <label className="check">
            <input
              type="checkbox"
              checked={rememberKeys}
              disabled={busy || connecting}
              onChange={(e) => changeRemember(e.target.checked)}
            />
            Remember keys on this device
          </label>
          <p className="hint">
            {rememberKeys
              ? 'Saved after connecting in this browser’s local storage, not encrypted. Scripts on this site can read it. Avoid shared devices. '
              : 'Kept only in this tab. '}
            Never included in history, audit or downloads. Relay’s server sends it only to{' '}
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
            <button disabled={busy} onClick={() => forgetKey()}>
              <Unplug size={14} />
              Forget key
            </button>
            <button
              className="primary"
              disabled={connecting || busy || !keys[provider]}
              onClick={() => connect()}
            >
              {connecting ? (
                <LoaderCircle className="busy-spinner" size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
              {connecting ? 'Connecting…' : 'Connect'}
            </button>
          </div>
        </Modal>
      )}
      {modal === 'settings' && (
        <Modal title="Run settings" close={() => setModal(null)}>
          <ModelPrice rates={rates} />
          <p className="hint">
            Pricing loads automatically from your provider’s published base rates. Costs are
            estimates, not a bill.
          </p>
          <div className="two-fields">
            <label className="field">
              Estimated allowance per model
              <input
                type="number"
                aria-label="Spend cap"
                min="0.01"
                max={setup?.limits.maxEstimatedUSD ?? 5}
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
                max={setup?.limits.maxSteps ?? 80}
                value={steps}
                onChange={(e) => setSteps(Number(e.target.value))}
              />
            </label>
          </div>
          <p className="hint">
            Each model gets its own allowance, including in 1v1. Unused allowance is not spent. Stop
            is always available; an in-flight request may still be billable.
          </p>
          <label className="check">
            <input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} />
            Supply llms.txt + interaction guide
          </label>
          <div className="field">
            Context
            <RelaySelect
              label="Context"
              value={context}
              onChange={setContext}
              options={[
                { value: 'recent-4', label: 'Last four turns', icon: <Layers size={17} /> },
                { value: 'full', label: 'Full episode history', icon: <History size={17} /> },
              ]}
            />
          </div>
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
      {modal === 'models' && (
        <Modal title="Try models" close={() => setModal(null)}>
          <p className="hint">
            Same task, fresh workspaces. Choose up to eight. Runs play here one at a time; results
            land in History and Compare. Keep this tab open.
          </p>
          <label className="search">
            <Search size={15} />
            <input
              aria-label="Search models"
              placeholder="Search models"
              value={modelSearch}
              onChange={(e) => setModelSearch(e.target.value)}
            />
          </label>
          <div className="model-queue-list">
            {catalog
              .filter((m) => m.id.toLowerCase().includes(modelSearch.toLowerCase()))
              .map((m) => (
                <label
                  key={m.id}
                  className={`model-queue-option ${batchModels.includes(m.id) ? 'selected' : ''}`}
                >
                  <input
                    type="checkbox"
                    aria-label={m.id}
                    checked={batchModels.includes(m.id)}
                    disabled={!m.rates || (!batchModels.includes(m.id) && batchModels.length >= 8)}
                    onChange={(e) =>
                      setBatchModels((old) =>
                        e.target.checked ? [...old, m.id] : old.filter((id) => id !== m.id),
                      )
                    }
                  />
                  <ModelMark id={m.id} />
                  <span>
                    {m.id}
                    <small>
                      {m.rates
                        ? `$${m.rates.input} in · $${m.rates.output} out / 1M tokens`
                        : (m.unavailableReason ?? 'Pricing unavailable')}
                    </small>
                  </span>
                </label>
              ))}
          </div>
          <div className="queue-launch">
            <span>
              {batchModels.length} selected
              <small>Up to ${(cap * batchModels.length).toFixed(2)} estimated total</small>
            </span>
            <button
              className="primary"
              disabled={busy || !batchModels.length}
              onClick={() =>
                start(
                  false,
                  batchModels.map((id) => catalog.find((m) => m.id === id)),
                )
              }
            >
              <Play size={15} /> Run {batchModels.length}{' '}
              {batchModels.length === 1 ? 'model' : 'models'}
            </button>
          </div>
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
                    {s.batch && `Queue ${s.batch.index + 1}/${s.batch.total} · `}
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
          <p className="hint">
            Each interface gets ${cap.toFixed(2)} allowance and its own time limit · up to $
            {(cap * (provider === 'typesafe' ? 2 : 3)).toFixed(2)} total.
          </p>
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
                          {episodeOutcome(e).title}
                          {!s.completeAudit && <small>Partial capture</small>}
                        </td>
                        <td>{e.steps}</td>
                        <td>{elapsed(e.durationMs)}</td>
                        <td>{e.usageKnown === false ? 'Unknown' : money(e.estimatedUSD)}</td>
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
