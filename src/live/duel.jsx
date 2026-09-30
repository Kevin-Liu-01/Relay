import React, { useEffect, useRef, useState } from 'react';
import { Swords, Square, Trophy, KeyRound, Film, Download } from 'lucide-react';
import { ModelMark } from '../lab/model-mark.jsx';
import { ActionSpotlight, ResultCard } from './feedback.jsx';
import { saveRun, downloadEvidence } from './storage.js';
import { duelVerdict } from './duel-policy.js';

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
        if (type === 'frame') onFrame(data.image);
        if (type === 'artifact') record.artifacts[data.path] = data.image;
        if (type === 'audit') record.audit = data;
        if (type === 'error') throw Error(data.message);
        if (type === 'done') complete = true;
        if (['run', 'event', 'audit'].includes(type)) onUpdate({ ...record });
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
  const [lanes, setLanes] = useState([
    initial,
    { ...initial, model: '', rates: { input: 0, output: 0 } },
  ]);
  const [busy, setBusy] = useState(false),
    [records, setRecords] = useState([null, null]),
    [frames, setFrames] = useState([null, null]),
    [errors, setErrors] = useState(['', '']),
    [connecting, setConnecting] = useState(null);
  const controllers = useRef([]);
  const connectionAbort = useRef(null);
  useEffect(
    () => () => {
      controllers.current.forEach((c) => c.abort());
      connectionAbort.current?.abort();
    },
    [],
  );
  const change = (i, patch) =>
    setLanes((old) => old.map((x, j) => (i === j ? { ...x, ...patch } : x)));
  const setAt = (fn, i, v) => fn((old) => old.map((x, j) => (i === j ? v : x)));
  const pick = (i, id) => {
    const rates =
      lanes[i].provider === 'typesafe'
        ? { input: 0.042, output: 0 }
        : id === 'gpt-4o-mini'
          ? { input: 0.15, output: 0.6 }
          : id === 'gpt-5-nano'
            ? { input: 0.05, output: 0.4 }
            : { input: 0, output: 0 };
    change(i, { model: id, rates });
  };
  async function connect(i) {
    const controller = new AbortController();
    connectionAbort.current?.abort();
    connectionAbort.current = controller;
    setConnecting(i);
    setAt(setErrors, i, '');
    try {
      const l = { ...lanes[i], key: lanes[i].key.trim() },
        r = await fetch('/api/relay?op=models', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ provider: l.provider, key: l.key }),
          signal: controller.signal,
        });
      const data = await r.json();
      if (controller.signal.aborted) return;
      if (!r.ok) throw Error(data.error);
      const id = data.models[0]?.id ?? '';
      change(i, {
        key: l.key,
        catalog: data.models,
        model: id,
        rates: l.provider === 'typesafe' ? { input: 0.042, output: 0 } : { input: 0, output: 0 },
      });
      setAt(setErrors, i, onConnectedKey(l.provider, l.key));
    } catch (e) {
      if (!controller.signal.aborted) setAt(setErrors, i, e.message);
    } finally {
      if (connectionAbort.current === controller) setConnecting(null);
    }
  }
  function forget(i) {
    connectionAbort.current?.abort();
    setConnecting(null);
    const provider = lanes[i].provider;
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
    if (
      lanes.some(
        (l) =>
          !l.key ||
          !l.model ||
          !Number.isFinite(l.rates.input) ||
          !Number.isFinite(l.rates.output) ||
          l.rates.input <= 0 ||
          (l.provider === 'ramp' && l.rates.output <= 0),
      )
    ) {
      setErrors(['Connect both models and confirm pricing.', '']);
      return;
    }
    if (
      lanes.some((l) => l.provider === 'typesafe') &&
      (['pixels', 'api'].includes(mode) || task === 'handoff-dm')
    ) {
      setErrors(['Jev matches support Accessibility / Page JSON and non-handoff tasks.', '']);
      return;
    }
    if (mode === 'pixels') {
      setErrors([
        'Choose a text interface for 1v1. Pixel capability must be verified in a solo run.',
        '',
      ]);
      return;
    }
    setBusy(true);
    setRecords([null, null]);
    setFrames([null, null]);
    setErrors(['', '']);
    controllers.current = [new AbortController(), new AbortController()];
    const id = crypto.randomUUID();
    await Promise.all(
      lanes.map(async (l, i) => {
        const config = {
          ...setup.defaults,
          provider: l.provider,
          models: [{ id: l.model, rates: l.rates }],
          tasks: [task],
          interfaces: [mode],
          guides: [guide],
          histories: [context],
          maxSteps: steps,
          maxEstimatedUSD: cap / 2,
        };
        const record = await streamRun({
          ...l,
          config,
          signal: controllers.current[i].signal,
          onUpdate: (r) => setAt(setRecords, i, r),
          onFrame: (f) => setAt(setFrames, i, f),
        });
        record.duel = {
          id,
          side: i,
          task,
          seed: config.seeds[0],
          mode,
          guide,
          history: context,
          capUSD: cap,
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
    setBusy(false);
    onSaved();
  }
  const verdict = duelVerdict(records);
  return (
    <div className="duel-surface">
      <label className="check">
        <input
          type="checkbox"
          checked={rememberKeys}
          disabled={busy || connecting !== null}
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
            {mode} · seed {setup.defaults.seeds[0]} · ${(cap / 2).toFixed(3)} cap per model
          </p>
        </div>
        <button
          className="primary"
          disabled={connecting !== null}
          onClick={() => (busy ? controllers.current.forEach((c) => c.abort()) : start())}
        >
          {busy ? <Square size={14} /> : <Swords size={16} />} {busy ? 'Stop both' : 'Start 1v1'}
        </button>
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
                <select
                  aria-label={`Provider ${i ? 'B' : 'A'}`}
                  disabled={busy || connecting !== null}
                  value={lane.provider}
                  onChange={(e) =>
                    change(i, {
                      provider: e.target.value,
                      key: providerKeys[e.target.value] ?? '',
                      model: '',
                      catalog: [],
                      rates: { input: 0, output: 0 },
                    })
                  }
                >
                  <option value="ramp">Ramp Router</option>
                  <option value="typesafe">Jev · TypeSafe</option>
                </select>
                <div className="duel-key">
                  <input
                    type="password"
                    autoComplete="off"
                    aria-label={`API key ${i ? 'B' : 'A'}`}
                    value={lane.key}
                    disabled={busy || connecting !== null}
                    placeholder="Provider API key"
                    onChange={(e) => change(i, { key: e.target.value, catalog: [], model: '' })}
                  />
                  <button
                    disabled={busy || connecting !== null || !lane.key}
                    onClick={() => connect(i)}
                  >
                    <KeyRound size={14} />
                    Connect
                  </button>
                  <button
                    disabled={busy}
                    aria-label={`Forget key ${i ? 'B' : 'A'}`}
                    onClick={() => forget(i)}
                  >
                    Forget
                  </button>
                </div>
                <select
                  aria-label={`Model ${i ? 'B' : 'A'}`}
                  value={lane.model}
                  disabled={busy}
                  onChange={(e) => pick(i, e.target.value)}
                >
                  <option value="">Choose model</option>
                  {lane.catalog.map((m) => (
                    <option key={m.id}>{m.id}</option>
                  ))}
                </select>
                <div className="duel-rates">
                  <label>
                    Input $/M
                    <input
                      aria-label={`Input rate ${i ? 'B' : 'A'}`}
                      type="number"
                      min="0"
                      step="0.001"
                      value={lane.rates.input}
                      disabled={busy}
                      onChange={(e) =>
                        change(i, { rates: { ...lane.rates, input: Number(e.target.value) } })
                      }
                    />
                  </label>
                  <label>
                    Output $/M
                    <input
                      aria-label={`Output rate ${i ? 'B' : 'A'}`}
                      type="number"
                      min="0"
                      step="0.001"
                      value={lane.rates.output}
                      disabled={busy || lane.provider === 'typesafe'}
                      onChange={(e) =>
                        change(i, { rates: { ...lane.rates, output: Number(e.target.value) } })
                      }
                    />
                  </label>
                </div>
              </details>
              {errors[i] && (
                <p role="alert" className="duel-error">
                  {errors[i]}
                </p>
              )}
              <div className="duel-screen">
                {frames[i] ? (
                  <img src={frames[i]} alt={`Live workspace ${i ? 'B' : 'A'}`} />
                ) : (
                  <span>
                    <Film size={22} />A fresh Slack workspace
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
