import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import { AuditView } from './audit.jsx';
import { ModelMark } from './model-mark.jsx';
import relayMark from '../assets/relay-mark.svg';
import { Play, Square, Settings2, ArrowUpRight, X } from 'lucide-react';

const MODES = { pixels: 'Pixels', a11y: 'Accessibility', 'json-ui': 'Page JSON', api: 'API' };
const TASKS = {
  'channel-topic': 'Update a topic',
  'thread-reply': 'Reply in a thread',
  'edit-message': 'Edit a message',
  'incident-triage': 'Triage an incident',
  'handoff-dm': 'Send a handoff',
  'delete-draft': 'Delete a draft',
};
const money = (n) => `$${(n ?? 0).toFixed(4)}`;
const time = (n) => (n < 1000 ? `${Math.round(n ?? 0)}ms` : `${((n ?? 0) / 1000).toFixed(1)}s`);
const toggle = (a, x) => (a.includes(x) ? a.filter((v) => v !== x) : [...a, x]);
const name = (id) => (id === 'scripted-reference' ? 'Reference script' : id);
async function api(path, options = {}) {
  const r = await fetch(path, options),
    d = await r.json();
  if (!r.ok) throw Error(d.error ?? `HTTP ${r.status}`);
  return d;
}
function actionLabel(step) {
  const a = step?.action;
  if (!a) return step?.error ? 'Action rejected' : 'Waiting';
  const target = step.observation?.elements?.find((e) => e.ref === a.ref)?.name;
  return (
    {
      finish: 'Finished',
      click: target ? `Click ${target}` : `Click ${a.x}, ${a.y}`,
      hover: `Hover ${target ?? a.ref}`,
      fill: `Fill ${target ?? a.ref}`,
      type: 'Type a message',
      key: `Press ${a.key}`,
      scroll: 'Scroll',
      wait: 'Wait',
      channels: 'Read conversations',
      messages: 'Read messages',
      search: `Search ${a.query}`,
      'channel.topic': 'Update channel topic',
      'message.send': 'Send message',
      'message.edit': 'Edit message',
      'message.delete': 'Delete message',
      'reaction.toggle': 'React to message',
      'pin.toggle': 'Pin message',
      'save.toggle': 'Save message',
    }[a.type] ?? a.type
  );
}
function Modal({ title, onClose, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className={wide ? 'modal wide' : 'modal'}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
    >
      <header>
        <h2>{title}</h2>
        <button className="icon-button" aria-label="Close dialog" onClick={onClose}>
          <X size={16} aria-hidden="true" />
        </button>
      </header>
      <div className="modal-body">{children}</div>
    </dialog>
  );
}
function App() {
  const initial = useRef(new URLSearchParams(location.search)).current;
  const [setup, setSetup] = useState(null),
    [config, setConfig] = useState(null),
    [catalog, setCatalog] = useState([]),
    [runs, setRuns] = useState([]),
    [selected, setSelected] = useState(() =>
      /^[a-f0-9-]{36}$/.test(initial.get('run') ?? '') ? initial.get('run') : null,
    ),
    [run, setRun] = useState(null),
    [episodeId, setEpisodeId] = useState(() =>
      /^episode-\d{3}$/.test(initial.get('episode') ?? '') ? initial.get('episode') : null,
    ),
    [trace, setTrace] = useState([]),
    [stepIndex, setStepIndex] = useState(-1),
    [follow, setFollow] = useState(!/^episode-\d{3}$/.test(initial.get('episode') ?? '')),
    [error, setError] = useState(''),
    [pending, setPending] = useState(false),
    [modal, setModal] = useState(initial.get('view') === 'audit' ? 'audit' : null),
    [filter, setFilter] = useState('');
  const activityEnd = useRef(null);
  const makeModel = (id, d = setup) => {
    const hint = d.priceHints.find((h) => id === h.label || id.endsWith(`/${h.label}`));
    return { id, rates: { input: hint?.input ?? 0, output: hint?.output ?? 0 }, vision: false };
  };
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await api('/api/config');
        if (!alive) return;
        setSetup(d);
        setConfig({
          ...d.defaults,
          interfaces: ['a11y'],
          maxSteps: 16,
          maxRequests: 60,
          maxEstimatedUSD: 0.5,
          maxInputUnits: 128000,
        });
        if (d.keyPresent) {
          setPending(true);
          const c = await api('/api/models');
          if (!alive) return;
          setCatalog(c.models);
          if (c.models.some((m) => m.id === 'gpt-4o-mini'))
            setConfig((old) => ({
              ...old,
              provider: 'ramp',
              models: [makeModel('gpt-4o-mini', d)],
            }));
        }
      } catch (e) {
        if (alive) setError(e.message);
      } finally {
        if (alive) setPending(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const d = await api('/api/runs');
        if (alive) {
          setRuns(d);
          if (!selected && d.length) setSelected(d[0].id);
        }
      } catch (e) {
        if (alive) setError(e.message);
      }
    };
    refresh();
    const timer = setInterval(refresh, 1800);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [selected]);
  useEffect(() => {
    if (!selected) return;
    let alive = true;
    const refresh = async () => {
      try {
        const d = await api(`/api/runs/${selected}`);
        if (alive) {
          setRun(d);
          setEpisodeId((old) =>
            follow
              ? (
                  d.episodes.find((e) => e.status === 'running') ??
                  d.episodes.filter((e) => e.status !== 'queued').at(-1) ??
                  d.episodes[0]
                )?.cell.episodeId
              : d.episodes.some((e) => e.cell.episodeId === old)
                ? old
                : d.episodes[0]?.cell.episodeId,
          );
        }
      } catch (e) {
        if (alive) setError(e.message);
      }
    };
    refresh();
    const timer = setInterval(refresh, 650);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [selected, follow]);
  const episode = run?.episodes.find((e) => e.cell.episodeId === episodeId);
  useEffect(() => {
    setTrace([]);
    setStepIndex(-1);
  }, [selected, episodeId]);
  useEffect(() => {
    if (!selected || !episodeId || !episode?.steps) return;
    let alive = true;
    api(`/api/runs/${selected}/${episodeId}/steps.jsonl`)
      .then((d) => {
        if (alive) setTrace(d.filter((e) => e.kind === 'step'));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [selected, episodeId, episode?.steps, episode?.status]);
  useEffect(() => {
    if (follow) activityEnd.current?.scrollIntoView({ block: 'nearest' });
  }, [trace.length, follow]);
  if (!config) return <div className="loading">{error || 'Connecting…'}</div>;
  const update = (k, v) => setConfig((c) => ({ ...c, [k]: v }));
  const planned =
    config.models.length *
    config.tasks.length *
    config.seeds.length *
    config.repeats *
    config.interfaces.length *
    config.guides.length *
    config.histories.length;
  const busy = runs.some((r) => r.status === 'running') || run?.status === 'running';
  const currentStep = stepIndex < 0 ? trace.at(-1) : trace[stepIndex];
  const obs = stepIndex < 0 ? episode?.currentObservation : currentStep?.observation;
  const img =
    stepIndex < 0
      ? (episode?.finalScreenshot ??
        episode?.currentObservation?.imageFile ??
        episode?.operatorScreenshot)
      : (currentStep?.observation?.imageFile ?? currentStep?.operatorScreenshot);
  const artifact = (file) => `/api/runs/${selected}/${episodeId}/${file}`;
  const finished =
    run?.episodes.filter((e) => !['queued', 'running'].includes(e.status)).length ?? 0;
  const start = async () => {
    setError('');
    setPending(true);
    try {
      const d = await api('/api/runs', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-lab-token': setup.csrf },
        body: JSON.stringify(config),
      });
      setRun(null);
      setSelected(d.id);
      setEpisodeId(null);
      setStepIndex(-1);
      setFollow(true);
      setModal(null);
      setRuns((r) => [
        {
          id: d.id,
          status: 'running',
          evidenceKind:
            config.provider === 'reference' ? 'scripted-reference' : 'live-model-evaluation',
          total: planned,
          finished: 0,
        },
        ...r,
      ]);
    } catch (e) {
      setError(e.message);
    } finally {
      setPending(false);
    }
  };
  const cancel = async () => {
    const active = runs.find((r) => r.status === 'running');
    try {
      await api(`/api/runs/${active?.id ?? selected}/cancel`, {
        method: 'POST',
        headers: { 'x-lab-token': setup.csrf },
      });
    } catch (e) {
      setError(e.message);
    }
  };
  const selectModel = (id) =>
    id === 'scripted-reference'
      ? setConfig((c) => ({
          ...c,
          provider: 'reference',
          models: [{ id }],
          tasks: ['channel-topic'],
          interfaces: c.interfaces.filter((x) => x !== 'pixels').length
            ? c.interfaces.filter((x) => x !== 'pixels')
            : ['a11y'],
        }))
      : setConfig((c) => ({ ...c, provider: 'ramp', models: [makeModel(id)] }));
  const editModel = (id, patch) =>
    update(
      'models',
      config.models.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    );
  const topModels = catalog.filter(
    (m) =>
      setup.priceHints.some((h) => h.label === m.id) || config.models.some((x) => x.id === m.id),
  );
  const status =
    episode?.inFlight && episode.status === 'running'
      ? 'Thinking'
      : episode?.status === 'running'
        ? 'Acting'
        : run?.status === 'completed'
          ? 'Complete'
          : (run?.status ?? 'Ready');
  return (
    <div className="lab-shell">
      <header className="topbar">
        <a href="/" className="brand" aria-label="Relay Lab home">
          <img className="relay-mark" src={relayMark} width="28" height="28" alt="" />
          <b>Relay</b>
          <span>lab</span>
        </a>
        <div className="top-controls">
          <select
            aria-label="Task"
            value={config.tasks.length === 1 ? config.tasks[0] : 'all'}
            onChange={(e) =>
              update('tasks', e.target.value === 'all' ? setup.tasks : [e.target.value])
            }
          >
            {setup.tasks.map((t) => (
              <option key={t} value={t}>
                {TASKS[t]}
              </option>
            ))}
            <option value="all">All tasks</option>
          </select>
          <select
            aria-label="Model"
            value={config.models.length > 1 ? 'multiple' : (config.models[0]?.id ?? '')}
            onChange={(e) => {
              if (e.target.value === 'more') setModal('settings');
              else selectModel(e.target.value);
            }}
          >
            <option value="scripted-reference">Reference script</option>
            {topModels.map((m) => (
              <option key={m.id}>{m.id}</option>
            ))}
            {config.models.length > 1 && (
              <option value="multiple">{config.models.length} models</option>
            )}
            <option value="more">More models…</option>
          </select>
          <select
            aria-label="Interface"
            value={config.interfaces.length === 1 ? config.interfaces[0] : 'compare'}
            onChange={(e) =>
              update(
                'interfaces',
                e.target.value === 'compare' ? ['a11y', 'json-ui', 'api'] : [e.target.value],
              )
            }
          >
            {Object.entries(MODES).map(([id, label]) => (
              <option
                key={id}
                value={id}
                disabled={id === 'pixels' && config.provider === 'reference'}
              >
                {label}
              </option>
            ))}
            <option value="compare">Compare interfaces</option>
          </select>
        </div>
        <span
          className={`connection ${setup.keyPresent ? 'connected' : ''}`}
          title={setup.keyPresent ? 'Ramp Router connected' : 'Router not connected'}
          aria-label={setup.keyPresent ? 'Ramp Router connected' : 'Router not connected'}
        />
        <button className="quiet settings-button" onClick={() => setModal('settings')}>
          <Settings2 size={14} aria-hidden="true" /> Settings
        </button>
        {busy ? (
          <button className="run-button stop" onClick={cancel}>
            <Square size={12} aria-hidden="true" /> Stop
          </button>
        ) : (
          <button
            className="run-button"
            disabled={pending || !planned || (config.provider === 'ramp' && !setup.keyPresent)}
            onClick={start}
          >
            <Play size={12} aria-hidden="true" /> {pending ? 'Starting…' : 'Run'}
          </button>
        )}
      </header>
      {error && (
        <div className="error-banner" role="alert">
          {error}
          <button aria-label="Dismiss error" onClick={() => setError('')}>
            ×
          </button>
        </div>
      )}
      <main className="workspace-shell">
        <section className="stage" aria-label="Agent workspace">
          <div className="stage-heading">
            <span className={`status-dot ${run?.status === 'running' ? 'live' : ''}`} />
            <strong>{status}</strong>
            <p title={episode?.instruction}>
              {episode?.instruction ?? 'Choose a task. Press Run.'}
            </p>
          </div>
          <div className="workspace-screen">
            {img ? (
              <img className="screen-preview" src={artifact(img)} alt="Agent workspace" />
            ) : !episode ? (
              <>
                <img
                  className="screen-preview preview"
                  src="/preview.png"
                  alt="Slack workspace preview"
                />
                <span className="preview-label">Preview</span>
              </>
            ) : (
              <div className="screen-empty">
                {episode.status === 'running' || episode.status === 'queued'
                  ? 'Opening workspace…'
                  : 'No screen recorded for this episode'}
              </div>
            )}
            <span className="screen-label">
              {stepIndex >= 0
                ? `Step ${stepIndex + 1}`
                : run?.status === 'running'
                  ? 'Live · read-only'
                  : episode
                    ? 'Replay · read-only'
                    : 'Workspace preview'}
            </span>
          </div>
          <div className="playback-bar">
            <span>{episode ? MODES[episode.cell.mode] : MODES[config.interfaces[0]]}</span>
            <button
              className="quiet"
              onClick={() => {
                setStepIndex(-1);
                setFollow(true);
              }}
            >
              {run?.status === 'running' ? 'Follow live' : 'Latest'}
            </button>
            <input
              aria-label="Replay step"
              type="range"
              min="0"
              max={Math.max(0, trace.length - 1)}
              value={stepIndex < 0 ? Math.max(0, trace.length - 1) : stepIndex}
              disabled={!trace.length}
              onChange={(e) => {
                setFollow(false);
                setStepIndex(Number(e.target.value));
              }}
            />
            <span className="tabular">
              {trace.length ? (stepIndex < 0 ? trace.length : stepIndex + 1) : 0} / {trace.length}
            </span>
            <button
              className="quiet"
              disabled={!episode?.currentObservation}
              onClick={() => setModal('input')}
            >
              Agent input
            </button>
          </div>
        </section>
        <aside className="activity-panel" aria-label="Agent activity">
          <div className="activity-heading">
            <h1>Activity</h1>
            <span className="badge">
              {run?.evidenceKind === 'live-model-evaluation' ? 'Model' : 'Script'}
            </span>
          </div>
          <div className="episode-meta">
            <strong className="model-name">
              <ModelMark id={episode?.cell.model.id ?? config.models[0]?.id} />
              {name(episode?.cell.model.id ?? config.models[0]?.id ?? '')}
            </strong>
            <span>
              {episode?.cell.guide ? 'llms.txt · ' : ''}
              {episode?.cell.history ?? config.histories.join(' / ')}
            </span>
          </div>
          <div className="activity-list">
            {!trace.length && (
              <div className="activity-empty">
                {episode?.status === 'running' ? 'Reading the workspace…' : 'Actions appear here.'}
              </div>
            )}
            {trace.map((s, i) => (
              <button
                key={i}
                className={`action-row ${stepIndex === i ? 'selected' : ''} ${s.error ? 'failed' : ''}`}
                onClick={() => {
                  setFollow(false);
                  setStepIndex(i);
                }}
                title={s.error ?? actionLabel(s)}
              >
                <span className="step-number">
                  {s.error ? '!' : String(i + 1).padStart(2, '0')}
                </span>
                <span>
                  <b>{actionLabel(s)}</b>
                  {s.action?.text && <small>{s.action.text}</small>}
                  <em>
                    {time(s.response?.latencyMs)}
                    {s.error ? ' · Rejected' : ''}
                  </em>
                </span>
              </button>
            ))}
            {episode?.inFlight && episode.status === 'running' && (
              <div className="thinking" role="status">
                <span className="status-dot live" />
                Thinking…
              </div>
            )}
            <div ref={activityEnd} />
          </div>
          {episode?.evaluation && (
            <div className={`outcome ${episode.evaluation.success ? 'passed' : 'failed'}`}>
              <strong>{episode.evaluation.success ? '✓ Task passed' : '× Task incomplete'}</strong>
              <span>
                {episode.error ??
                  (episode.evaluation.success ? 'State verified' : 'See checks in details')}
              </span>
            </div>
          )}
          {run?.stopReason && (
            <div className="stop-reason" role="status">
              {run.stopReason.message}
            </div>
          )}
          <button
            className="details-button"
            disabled={!episode}
            onClick={() => setModal('details')}
          >
            Details <ArrowUpRight size={14} aria-hidden="true" />
          </button>
        </aside>
      </main>
      <div className="episode-strip" aria-label="Episodes">
        {run?.episodes.map((e, i) => (
          <button
            key={e.cell.episodeId}
            className={episodeId === e.cell.episodeId ? 'active' : ''}
            aria-label={`Episode ${i + 1}: ${MODES[e.cell.mode]}, ${e.cell.model.id}, ${e.status}`}
            onClick={() => {
              setFollow(false);
              setEpisodeId(e.cell.episodeId);
              setStepIndex(-1);
            }}
          >
            <span className={e.evaluation?.success ? 'passed' : ''}>
              {e.evaluation
                ? e.evaluation.success
                  ? '✓'
                  : '×'
                : e.status === 'running'
                  ? '●'
                  : '○'}
            </span>
            {MODES[e.cell.mode]}
            {run.config.models.length > 1 && <small>{e.cell.model.id}</small>}
          </button>
        ))}
        {!run && (
          <span className="strip-placeholder">
            {planned} episode{planned === 1 ? '' : 's'} ·{' '}
            {config.provider === 'reference'
              ? 'Scripted reference'
              : `Up to ${money(config.maxEstimatedUSD)} estimated`}
          </span>
        )}
      </div>
      <footer className="statusbar">
        <div className="run-history">
          <select
            aria-label="Select run"
            value={selected ?? ''}
            onChange={(e) => {
              setRun(null);
              setSelected(e.target.value);
              setEpisodeId(null);
              setStepIndex(-1);
              setFollow(true);
            }}
          >
            <option value="" disabled>
              Run history
            </option>
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id.slice(0, 8)} · {r.evidenceKind === 'scripted-reference' ? 'Script' : 'Model'}{' '}
                · {r.status}
              </option>
            ))}
          </select>
        </div>
        <span className="stat">
          {finished}/{run?.episodes.length ?? planned} <small>episodes</small>
        </span>
        <span className="stat">
          {run?.budget.requests ?? 0} <small>calls</small>
        </span>
        <span className="stat">
          {((run?.budget.inputTokens ?? 0) + (run?.budget.outputTokens ?? 0)).toLocaleString()}{' '}
          <small>tokens</small>
        </span>
        <span
          className="stat"
          title="Estimate, not an invoice. Unknown usage retains a reservation."
        >
          {money(run?.budget.estimatedUSD)}{' '}
          <small>
            est.
            {run?.budget.usageKnown === false
              ? run.status === 'running'
                ? ' · pending usage'
                : ' · usage unknown'
              : ''}
          </small>
        </span>
        <button className="quiet" onClick={() => setModal('results')} disabled={!run}>
          Results ↗
        </button>
        <button className="quiet" onClick={() => setModal('audit')} disabled={!run}>
          Audit trace ↗
        </button>
      </footer>
      {modal === 'audit' && run && (
        <Modal title="Full audit trace" wide onClose={() => setModal(null)}>
          <AuditView key={selected} runId={selected} initialEpisode={episodeId} />
        </Modal>
      )}
      {modal === 'input' && (
        <Modal title="Agent input" wide onClose={() => setModal(null)}>
          <p className="hint">
            {episode?.cell.mode === 'api'
              ? 'The workspace screen is operator-only. This is what the model receives.'
              : 'Selected observation. Task, action instructions and optional guide are added by the harness.'}
          </p>
          <pre>{JSON.stringify(obs, null, 2)}</pre>
        </Modal>
      )}
      {modal === 'details' && (
        <Modal title="Step details" onClose={() => setModal(null)}>
          <h3>{currentStep ? actionLabel(currentStep) : 'No action yet'}</h3>
          <pre>{JSON.stringify(currentStep?.action ?? {}, null, 2)}</pre>
          {currentStep?.error && <p role="alert">{currentStep.error}</p>}
          <dl>
            <dt>Requested</dt>
            <dd>{currentStep?.response?.requestedModel ?? '—'}</dd>
            <dt>Returned</dt>
            <dd>{currentStep?.response?.returnedModel ?? 'Not recorded'}</dd>
            <dt>Latency</dt>
            <dd>{time(currentStep?.response?.latencyMs)}</dd>
          </dl>
          <h3>Outcome checks</h3>
          <pre>{JSON.stringify(episode?.evaluation ?? {}, null, 2)}</pre>
          <a href={`/api/runs/${selected}/export`} download>
            Export evidence ↓
          </a>
          <button className="quiet" onClick={() => setModal('audit')}>
            Full audit trace ↗
          </button>
        </Modal>
      )}
      {modal === 'results' && (
        <Modal title="Results" wide onClose={() => setModal(null)}>
          <p className="hint">
            {run.evidenceKind === 'scripted-reference'
              ? 'Scripted reference · not an LLM result.'
              : 'Live model run · development tasks, not a general ranking.'}{' '}
            API changes both visibility and action granularity.
          </p>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {[
                    'Model / interface',
                    'Guide / history',
                    'Passed',
                    'Actions',
                    'Time',
                    'Est. cost',
                  ].map((x) => (
                    <th key={x}>{x}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {run.summary.map((r, i) => (
                  <tr key={i}>
                    <td>
                      {MODES[r.interface]}
                      <small className="model-name">
                        <ModelMark id={r.model} size={13} />
                        {name(r.model)}
                      </small>
                    </td>
                    <td>
                      {r.guide ? 'llms.txt' : 'No guide'}
                      <small>{r.history}</small>
                    </td>
                    <td>
                      {r.passed} / {r.attempted}
                    </td>
                    <td>{r.meanSteps.toFixed(1)}</td>
                    <td>{time(r.meanLatencyMs)}</td>
                    <td>
                      {money(r.estimatedUSD)}
                      {!r.usageKnown && ' *'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details>
            <summary>Matched contrasts</summary>
            <pre>{JSON.stringify(run.paired, null, 2)}</pre>
          </details>
          <p className="hint">
            Source {run.sourceHash.slice(0, 12)} · Config {run.configHash.slice(0, 12)}
          </p>
          <a href={`/api/runs/${selected}/export`} download>
            Export evidence ↓
          </a>{' '}
          <button className="quiet" onClick={() => setModal('audit')}>
            Full audit trace ↗
          </button>
          ·{' '}
          <a href="/guide" target="_blank" rel="noreferrer">
            Method & limits ↗
          </a>
        </Modal>
      )}
      {modal === 'settings' && (
        <Modal title="Run settings" onClose={() => setModal(null)}>
          <section>
            <h3>Models</h3>
            <p className="hint">
              {setup.keyPresent
                ? 'Router connected. Rates are estimates.'
                : 'Router not connected. Reference scripts are available.'}
            </p>
            <input
              aria-label="Filter models"
              placeholder="Find a model…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
            <div className="catalog">
              {catalog
                .filter((m) => m.id.toLowerCase().includes(filter.toLowerCase()))
                .map((m) => (
                  <label className="check" key={m.id}>
                    <input
                      type="checkbox"
                      checked={config.models.some((x) => x.id === m.id)}
                      onChange={() =>
                        setConfig((c) => ({
                          ...c,
                          provider: 'ramp',
                          models: c.models.some((x) => x.id === m.id)
                            ? c.models.filter((x) => x.id !== m.id)
                            : [
                                ...c.models.filter((x) => x.id !== 'scripted-reference'),
                                makeModel(m.id),
                              ],
                        }))
                      }
                    />
                    <ModelMark id={m.id} /> {m.id}
                  </label>
                ))}
            </div>
            {config.provider === 'ramp' &&
              config.models.map((m) => (
                <div className="model-rates" key={m.id}>
                  <b className="model-name">
                    <ModelMark id={m.id} />
                    {m.id}
                  </b>
                  <div className="two-fields">
                    {['input', 'output'].map((kind) => (
                      <label className="field" key={kind}>
                        {kind} $ / 1M
                        <input
                          type="number"
                          min="0.001"
                          step="0.01"
                          value={m.rates[kind]}
                          onChange={(e) =>
                            editModel(m.id, {
                              rates: { ...m.rates, [kind]: Number(e.target.value) },
                            })
                          }
                        />
                      </label>
                    ))}
                  </div>
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={m.vision}
                      onChange={(e) => editModel(m.id, { vision: e.target.checked })}
                    />
                    Image input verified
                  </label>
                  <label className="field">
                    Reasoning
                    <select
                      value={m.reasoning ?? ''}
                      onChange={(e) => editModel(m.id, { reasoning: e.target.value || undefined })}
                    >
                      <option value="">Model default</option>
                      {['none', 'minimal', 'low', 'medium', 'high'].map((r) => (
                        <option key={r}>{r}</option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
          </section>
          <section>
            <h3>Interfaces</h3>
            <div className="check-grid">
              {Object.entries(MODES).map(([id, label]) => (
                <label className="check" key={id}>
                  <input
                    type="checkbox"
                    checked={config.interfaces.includes(id)}
                    disabled={config.provider === 'reference' && id === 'pixels'}
                    onChange={() => update('interfaces', toggle(config.interfaces, id))}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>
          <section>
            <h3>Context</h3>
            <div className="check-grid">
              {[
                [false, 'No guide'],
                [true, 'llms.txt'],
              ].map(([v, label]) => (
                <label className="check" key={label}>
                  <input
                    type="checkbox"
                    checked={config.guides.includes(v)}
                    onChange={() => update('guides', toggle(config.guides, v))}
                  />
                  {label}
                </label>
              ))}
              {[
                ['recent-4', 'Last 4 turns'],
                ['full', 'Full history'],
              ].map(([v, label]) => (
                <label className="check" key={v}>
                  <input
                    type="checkbox"
                    checked={config.histories.includes(v)}
                    onChange={() => update('histories', toggle(config.histories, v))}
                  />
                  {label}
                </label>
              ))}
            </div>
          </section>
          <section className="two-fields">
            <label className="field">
              Seed
              <input
                type="number"
                value={config.seeds[0]}
                onChange={(e) => update('seeds', [Number(e.target.value)])}
              />
            </label>
            <label className="field">
              Repeats
              <input
                type="number"
                min="1"
                max="5"
                value={config.repeats}
                onChange={(e) => update('repeats', Number(e.target.value))}
              />
            </label>
          </section>
          <details>
            <summary>Limits</summary>
            {[
              ['maxSteps', 'Actions / episode'],
              ['maxRequests', 'Calls / run'],
              ['episodeSeconds', 'Seconds / episode'],
              ['runSeconds', 'Seconds / run'],
              ['maxOutputTokens', 'Output tokens / call'],
              ['maxInputUnits', 'Input units / call'],
              ['maxEstimatedUSD', 'Estimated USD cap'],
            ].map(([k, label]) => (
              <label className="field" key={k}>
                {label}
                <input
                  type="number"
                  step={k === 'maxEstimatedUSD' ? '0.1' : '1'}
                  value={config[k]}
                  onChange={(e) => update(k, Number(e.target.value))}
                />
              </label>
            ))}
            <p className="hint">
              Also set a provider-side spend cap. Local estimates are not billing guarantees.
            </p>
          </details>
          <div className="settings-footer">
            <span>
              {planned} episodes ·{' '}
              {config.provider === 'reference'
                ? 'No spend'
                : `${money(config.maxEstimatedUSD)} cap`}
            </span>
            <button className="run-button" onClick={() => setModal(null)}>
              Done
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
createRoot(document.getElementById('root')).render(<App />);
