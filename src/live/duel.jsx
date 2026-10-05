import React, { useEffect, useRef, useState } from 'react';
import { supportsChoice } from '../../shared/task-catalog.mjs';
import {
  Swords,
  Trophy,
  KeyRound,
  Film,
  Download,
  Layers,
  Workflow,
  LoaderCircle,
} from 'lucide-react';
import { ModelMark } from '../lab/model-mark.jsx';
import { ActionSpotlight, ResultCard } from './feedback.jsx';
import { saveRun, downloadEvidence } from './storage.js';
import { duelVerdict } from './duel-policy.js';
import { RelaySelect } from './select.jsx';
import { preferredModel, validKey } from './connections.js';
import { RunButton, ModelPrice, useLaunchLock } from './run-button.jsx';
import { makeRunPlan } from './run-plan.mjs';
import { AgentCursor, StreamImage, StreamBadge } from './workspace-view.jsx';
import { acceptFrame } from './playback.mjs';

async function streamRun({ provider, key, config, signal, onUpdate, onFrame }) {
  const record = { run: null, events: [], artifacts: {}, audit: null };
  try {
    const response = await fetch('/api/relay?op=run', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider, key, config }),
      signal,
    });
    if (!response.ok) {
      const d = await response.json();
      throw Error(d.error ?? 'Run rejected');
    }
    const reader = response.body.getReader(),
      decoder = new TextDecoder();
    let buffer = '',
      complete = false;
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      buffer += decoder.decode(chunk.value, { stream: true });
      if (buffer.length > 32 * 1024 * 1024) throw Error('Stream record too large.');
      let n;
      while ((n = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, n);
        buffer = buffer.slice(n + 1);
        if (!line) continue;
        const { type, data } = JSON.parse(line);
        if (type === 'run') record.run = data;
        if (type === 'event') record.events.push(data);
        if (type === 'frame') onFrame(data);
        if (type === 'artifact') record.artifacts[data.path] = data.image;
        if (type === 'audit') record.audit = data;
        if (type === 'expected_result')
          record.expectations = { ...record.expectations, [data.episodeId]: data.contract };
        if (type === 'error') throw Error(data.message);
        if (type === 'done') complete = true;
        if (['run', 'event', 'audit', 'expected_result'].includes(type)) onUpdate({ ...record });
      }
    }
    if (!complete) throw Error('Connection ended before final audit.');
  } catch (e) {
    record.error = e.name === 'AbortError' ? 'Stopped · in-flight usage may be unknown' : e.message;
    if (record.run)
      record.run = {
        ...record.run,
        status: 'interrupted',
        budget: { ...record.run.budget, usageKnown: false },
        episodes: record.run.episodes.map((e) =>
          ['running', 'queued'].includes(e.status) ? { ...e, status: 'interrupted' } : e,
        ),
      };
  }
  onUpdate({ ...record });
  return record;
}

export function Duel({
  setup,
  task,
  mode,
  guide,
  context,
  cap,
  steps,
  connection,
  providerKeys,
  connections,
  rememberKeys,
  onRememberChange,
  onConnectedKey,
  onForgetKey,
  onReplay,
  onSaved,
}) {
  const initial = {
    provider: connection.provider,
    key: connection.key,
    model: connection.model,
    catalog: connection.catalog,
    rates: connection.rates,
  };
  const [lanes, setLanes] = useState([initial, { ...initial }]);
  const [workspaceVersion, setWorkspaceVersion] = useState(0);
  const [busy, setBusy] = useState(false),
    [records, setRecords] = useState([null, null]),
    [frames, setFrames] = useState([null, null]),
    [errors, setErrors] = useState(['', '']),
    [connecting, setConnecting] = useState([false, false]);
  const launch = useLaunchLock();
  const controllers = useRef([]);
  const versions = useRef([0, 0]),
    timers = useRef([]);
  useEffect(() => {
    lanes.forEach((lane, i) => {
      if (!lane.model && validKey(lane.key)) connect(i, lane, true);
    });
    return () => {
      controllers.current.forEach((c) => c.abort());
      versions.current = versions.current.map((v) => v + 1);
      timers.current.forEach(clearTimeout);
    };
  }, []);
  const change = (i, patch) =>
    setLanes((old) => old.map((x, j) => (i === j ? { ...x, ...patch } : x)));
  const setAt = (fn, i, v) => fn((old) => old.map((x, j) => (i === j ? v : x)));
  const pick = (i, id) => {
    const rates = lanes[i].catalog.find((m) => m.id === id)?.rates ?? null;
    change(i, { model: id, rates });
  };
  async function connect(i, lane = lanes[i], restoring = false) {
    clearTimeout(timers.current[i]);
    const version = ++versions.current[i];
    setAt(setConnecting, i, true);
    setAt(setErrors, i, '');
    try {
      const l = { ...lane, key: lane.key.trim() };
      const data = await connections.get(l.provider, l.key);
      if (version !== versions.current[i]) return;
      // Share a connection with an empty/same-key sibling, but never overwrite a different account.
      setLanes((old) =>
        old.map((other, j) => {
          if (
            j !== i &&
            (other.provider !== l.provider || (other.key && other.key.trim() !== l.key))
          )
            return other;
          const model = data.models.some((m) => m.id === other.model && m.rates)
            ? other.model
            : preferredModel(data.models, l.provider);
          return {
            ...other,
            key: l.key,
            catalog: data.models,
            model,
            rates: data.models.find((m) => m.id === model)?.rates ?? null,
          };
        }),
      );
      if (!restoring) setAt(setErrors, i, onConnectedKey(l.provider, l.key, data.models));
    } catch (e) {
      if (version === versions.current[i] && e.name !== 'AbortError')
        setAt(setErrors, i, e.message);
    } finally {
      if (version === versions.current[i]) setAt(setConnecting, i, false);
    }
  }
  function forget(i) {
    const provider = lanes[i].provider;
    lanes.forEach((l, j) => {
      if (l.provider === provider) {
        versions.current[j]++;
        clearTimeout(timers.current[j]);
        setAt(setConnecting, j, false);
      }
    });
    setLanes((old) =>
      old.map((lane) =>
        lane.provider === provider
          ? { ...lane, key: '', model: '', catalog: [], rates: { input: 0, output: 0 } }
          : lane,
      ),
    );
    setAt(setErrors, i, onForgetKey(provider));
  }
  async function start() {
    if (busy || connecting.some(Boolean)) return;
    if (
      lanes.some(
        (l) =>
          !l.key ||
          !l.model ||
          !Number.isFinite(l.rates?.input) ||
          !Number.isFinite(l.rates?.output) ||
          l.rates.input <= 0 ||
          (l.provider === 'ramp' && l.rates.output <= 0),
      )
    ) {
      setErrors(['Choose two available models. Saved keys connect automatically.', '']);
      return;
    }
    if (
      lanes.some((l) => l.provider === 'typesafe') &&
      (['pixels', 'api'].includes(mode) || !supportsChoice(task))
    ) {
      setErrors(['Jev matches support text interfaces and tasks without free composition.', '']);
      return;
    }
    if (mode === 'pixels') {
      setErrors([
        'Choose a text interface for 1v1. Pixel capability must be verified in a solo run.',
        '',
      ]);
      return;
    }
    let configs;
    try {
      configs = lanes.map(
        (l) =>
          makeRunPlan({
            setup,
            provider: l.provider,
            models: [{ id: l.model, rates: l.rates }],
            task,
            mode,
            guide,
            context,
            cap,
            steps,
          })[0],
      );
    } catch (e) {
      setErrors([e.message, '']);
      return;
    }
    if (!launch.acquire()) return;
    setBusy(true);
    setWorkspaceVersion((version) => version + 1);
    setRecords([null, null]);
    setFrames([null, null]);
    setErrors(['', '']);
    controllers.current = [new AbortController(), new AbortController()];
    const id = crypto.randomUUID();
    try {
      await Promise.all(
        lanes.map(async (l, i) => {
          const config = configs[i];
          const record = await streamRun({
            ...l,
            config,
            signal: controllers.current[i].signal,
            onUpdate: (r) => setAt(setRecords, i, r),
            onFrame: (f) =>
              setFrames((old) => old.map((value, j) => (j === i ? acceptFrame(value, f) : value))),
          });
          record.duel = {
            id,
            side: i,
            task,
            seed: config.seeds[0],
            mode,
            guide,
            history: context,
            capUSD: cap * 2,
            execution: 'concurrent',
          };
          setAt(setRecords, i, { ...record });
          if (record.error) setAt(setErrors, i, record.error);
          if (record.run) {
            try {
              await saveRun(record);
            } catch {
              setAt(setErrors, i, 'History unavailable; download this run below to keep it.');
            }
          }
        }),
      );
      await onSaved();
    } finally {
      await launch.release();
      setBusy(false);
    }
  }
  const verdict = duelVerdict(records);
  return (
    <div className="duel-surface">
      <label className="check">
        <input
          type="checkbox"
          checked={rememberKeys}
          disabled={busy || connecting.some(Boolean)}
          onChange={(e) => setAt(setErrors, 0, onRememberChange(e.target.checked))}
        />
        Remember keys on this device
      </label>
      <p className="hint">
        {rememberKeys
          ? 'Saves the latest connected key per provider in unencrypted local storage. Scripts on this site can read it; avoid shared devices. '
          : 'Keys stay only in this tab. '}
        Keys never enter match history or downloads.
      </p>
      <div className="duel-top">
        <div>
          <span className="mini-label">MATCHED TASK · FRESH WORKSPACES</span>
          <h3>{setup.tasks[task]}</h3>
          <p>
            {mode} · seed {setup.defaults.seeds[0]} · ${cap.toFixed(2)} per model · $
            {(cap * 2).toFixed(2)} total allowance
          </p>
        </div>
        <RunButton
          label="Start 1v1"
          stopLabel="Stop both"
          icon={Swords}
          busy={busy}
          starting={!frames.some(Boolean)}
          disabled={connecting.some(Boolean) || lanes.some((l) => !l.model || !l.rates)}
          onStart={start}
          onStop={() => controllers.current.forEach((c) => c.abort())}
        />
      </div>
      <div className={`duel-verdict ${verdict.kind}`} role="status">
        <Trophy size={19} />
        {verdict.label}
        <span>Single-task result · not a leaderboard</span>
      </div>
      <div className="duel-grid">
        {lanes.map((lane, i) => {
          const record = records[i],
            episode = record?.run?.episodes[0],
            events = record?.events.map((e) => e.event) ?? [];
          const pointerEvent = events.filter((e) => e.kind === 'pointer').at(-1);
          return (
            <section
              className={`duel-lane ${verdict.winner === i ? 'winner' : ''}`}
              key={i}
              aria-label={`Model ${i ? 'B' : 'A'}`}
            >
              <header>
                <span className="lane-id">{i ? 'B' : 'A'}</span>
                <ModelMark id={lane.model} size={25} />
                <strong>{lane.model || 'Choose a model'}</strong>
              </header>
              <details open={!record} className="duel-config">
                <summary>Model connection</summary>
                <RelaySelect
                  label={`Provider ${i ? 'B' : 'A'}`}
                  disabled={busy}
                  value={lane.provider}
                  onChange={(provider) => {
                    versions.current[i]++;
                    clearTimeout(timers.current[i]);
                    setAt(setConnecting, i, false);
                    const next = {
                      provider,
                      key: providerKeys[provider] ?? '',
                      model: '',
                      catalog: [],
                      rates: null,
                    };
                    change(i, next);
                    if (validKey(next.key)) connect(i, next, true);
                  }}
                  options={[
                    { value: 'ramp', label: 'Ramp Router', icon: <Layers size={17} /> },
                    { value: 'typesafe', label: 'Jev · TypeSafe', icon: <Workflow size={17} /> },
                  ]}
                />
                <div className="duel-key">
                  <input
                    type="password"
                    autoComplete="off"
                    aria-label={`API key ${i ? 'B' : 'A'}`}
                    value={lane.key}
                    disabled={busy}
                    placeholder="Provider API key"
                    onChange={(e) => {
                      versions.current[i]++;
                      clearTimeout(timers.current[i]);
                      setAt(setConnecting, i, false);
                      const next = {
                        ...lane,
                        key: e.target.value,
                        catalog: [],
                        model: '',
                        rates: null,
                      };
                      change(i, next);
                      if (validKey(next.key))
                        timers.current[i] = setTimeout(() => connect(i, next), 600);
                    }}
                  />
                  <button
                    disabled={busy || connecting[i] || !lane.key || !!lane.model}
                    onClick={() => connect(i)}
                  >
                    {connecting[i] ? (
                      <LoaderCircle className="busy-spinner" size={14} />
                    ) : (
                      <KeyRound size={14} />
                    )}
                    {connecting[i] ? 'Connecting…' : lane.model ? 'Connected' : 'Connect'}
                  </button>
                  <button
                    disabled={busy}
                    aria-label={`Forget key ${i ? 'B' : 'A'}`}
                    onClick={() => forget(i)}
                  >
                    Forget
                  </button>
                </div>
                <RelaySelect
                  label={`Model ${i ? 'B' : 'A'}`}
                  value={lane.model}
                  disabled={busy || connecting[i]}
                  onChange={(id) => pick(i, id)}
                  placeholder={connecting[i] ? 'Loading models…' : 'Choose a model'}
                  placeholderIcon={<ModelMark />}
                  emptyText="Connect a key to see models"
                  wide
                  options={lane.catalog.map((m) => ({
                    value: m.id,
                    label: m.id,
                    icon: <ModelMark id={m.id} />,
                    disabled: !m.rates,
                    disabledReason:
                      m.unavailableReason ??
                      'Published pricing unavailable for this exact model ID.',
                  }))}
                />
                <ModelPrice rates={lane.rates} />
              </details>
              {errors[i] && (
                <p role="alert" className="duel-error">
                  {errors[i]}
                </p>
              )}
              <div className="duel-screen" key={`${workspaceVersion}/${i}`}>
                {frames[i] ? (
                  <>
                    <StreamImage
                      key={record?.run?.id ?? i}
                      image={frames[i].image}
                      alt={`Live workspace ${i ? 'B' : 'A'}`}
                    />
                    <AgentCursor
                      point={
                        pointerEvent
                          ? { ...pointerEvent.pointer, sequence: pointerEvent.sequence }
                          : null
                      }
                      viewport={frames[i].viewport}
                      smooth={busy}
                    />
                    <StreamBadge
                      live={busy && episode?.status === 'running'}
                      frame={frames[i]}
                      label="Recorded workspace"
                    />
                  </>
                ) : (
                  <span>
                    {busy ? (
                      <LoaderCircle className="busy-spinner" size={22} aria-hidden="true" />
                    ) : (
                      <Film size={22} />
                    )}
                    {busy ? 'Preparing a fresh workspace…' : 'A fresh Slack workspace'}
                  </span>
                )}
              </div>
              <ActionSpotlight
                events={events}
                busy={busy && episode?.status === 'running'}
                episode={episode}
              />
              <ResultCard
                episode={episode}
                onReplay={!busy && record?.run ? () => onReplay(record) : undefined}
              />
              {!busy && record?.run && (
                <button className="full-width" onClick={() => downloadEvidence(record)}>
                  <Download size={14} />
                  Download evidence
                </button>
              )}
            </section>
          );
        })}
      </div>
      <p className="duel-note">
        Both start together with the same task, seed, interface and budgets. Provider/model and
        action policy may differ. Shared worker load affects latency; cost uses your recorded rates.
        Closing stops active requests. Keys are never included in match evidence.
      </p>
    </div>
  );
}
