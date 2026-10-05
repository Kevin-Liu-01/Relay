import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileJson,
  Film,
  ListChecks,
  Search,
  ShieldCheck,
  GitCompareArrows,
} from 'lucide-react';
import { ReplayPlayer, WorkspaceReplay, replayFrames } from '../../src/live/replay.jsx';
import { OutcomeBadge } from '../../src/live/feedback.jsx';
import { TaskComparison } from '../../src/live/task-comparison.jsx';
import { RelaySelect } from '../../src/live/select.jsx';
import { TaskIcon, ModeIcon } from '../../src/live/select-icons.jsx';
import { ModelMark } from '../../src/lab/model-mark.jsx';
import Zhipu from '@thesvg/react/zhipu';
import Minimax from '@thesvg/react/minimax';
import logo from '../../src/assets/relay-mark.svg';
import '../../src/live/style.css';
import '../../src/live/experience.css';
import './style.css';
import {
  catalogPath,
  interfaceCatalogPath,
  validateCatalog,
  loadRecord,
  stateChanges,
  taskCaveats,
} from './data.mjs';
const interfaceStudy = new URLSearchParams(location.search).get('study') === 'interfaces';
const resultAnchor = interfaceStudy ? 'interface-results' : 'model-comparison';
const modeLabels = { a11y: 'Accessibility', 'json-ui': 'Page JSON', pixels: 'Pixels', api: 'API' };

function ReviewModelMark({ id, size }) {
  const Mark = id.startsWith('glm-') ? Zhipu : id.startsWith('minimax-') ? Minimax : null;
  return Mark ? (
    <Mark width={size} height={size} variant="light" aria-hidden="true" />
  ) : (
    <ModelMark id={id} size={size} />
  );
}

const views = ['replay', 'trace', 'checks', 'changes', 'provenance'];
const title = (value) => value.replaceAll('-', ' ');
const readLocation = () => {
  const query = new URLSearchParams(location.search);
  return {
    trial: query.get('trial') ?? '',
    view: views.includes(query.get('view')) ? query.get('view') : 'replay',
  };
};
function download(record) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(record, null, 2)], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `relay-${record.selection.trialId}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function JSONView({ value }) {
  return (
    <pre className="review-json" tabIndex={0}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}
// The shared player normally lives in a modal. Preserve keyboard containment
// when its focus view is used on this standalone page, without changing capture.
function replayKeys(event) {
  if (event.defaultPrevented) return;
  const player = event.currentTarget.querySelector('.replay-player[data-focus="true"]');
  if (!player) return;
  if (event.key === 'Escape') {
    event.preventDefault();
    player.querySelector('[aria-label="Exit replay focus"]')?.click();
  } else if (event.key === 'Tab') {
    const controls = [
      ...player.querySelectorAll('button:not(:disabled), input:not(:disabled), [role="combobox"]'),
    ].filter((node) => node.getClientRects().length);
    const first = controls[0],
      last = controls.at(-1);
    if (event.shiftKey && event.target === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && event.target === last) {
      event.preventDefault();
      first?.focus();
    }
  }
}
function Trace({ record }) {
  const [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [selected, setSelected] = useState(0);
  const episode = record.audit.episodes[0];
  const records = useMemo(() => episode.trace.map((event, index) => ({ event, index })), [record]);
  const visible = useMemo(
    () =>
      records.filter(
        ({ event }) =>
          (filter === 'all' || event.kind === filter) &&
          (!search || JSON.stringify(event).toLowerCase().includes(search.toLowerCase())),
      ),
    [records, filter, search],
  );
  const active = visible.find((row) => row.index === selected) ?? visible[0];
  const event = active?.event;
  return (
    <section aria-label="Recorded trace">
      <div className="review-trace-tools">
        <label className="review-search">
          <Search size={16} />
          <input
            aria-label="Search trace"
            placeholder="Search recorded events"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <RelaySelect
          label="Event type"
          value={filter}
          onChange={setFilter}
          options={['all', ...new Set(records.map(({ event }) => event.kind))].map((kind) => ({
            value: kind,
            label: kind === 'all' ? 'All event types' : title(kind),
            icon: <FileJson size={16} />,
          }))}
        />
        <span className="review-muted">
          {visible.length} / {records.length} events
        </span>
      </div>
      <div className="review-trace-grid">
        <nav aria-label="Trace events">
          {visible.map(({ event, index }) => (
            <button
              key={index}
              aria-current={active?.index === index ? 'true' : undefined}
              onClick={() => setSelected(index)}
            >
              <span className="numeric">{String(index + 1).padStart(3, '0')}</span>
              <span>
                <b>
                  {title(event.kind)}
                  {event.kind === 'step' && event.action?.type ? ` · ${event.action.type}` : ''}
                </b>
                <small>
                  {event.step == null ? 'No step' : `Step ${event.step}`} ·{' '}
                  {Number.isFinite(event.elapsedMs)
                    ? `${(event.elapsedMs / 1000).toFixed(2)}s`
                    : (event.at ?? 'No timestamp')}
                </small>
              </span>
            </button>
          ))}
        </nav>
        <div className="review-event">
          {event ? (
            <>
              <h2>
                {title(event.kind)}
                {event.step != null ? ` · step ${event.step}` : ''}
              </h2>
              {event.kind === 'input' && (
                <details open>
                  <summary>
                    {record.imageInputs
                      ? 'Model request · lossless image references'
                      : 'Exact model request'}
                  </summary>
                  {episode.inputs[event.requestFile] ? (
                    <JSONView value={episode.inputs[event.requestFile]} />
                  ) : (
                    <p role="alert">Request body was not recorded.</p>
                  )}
                  {record.imageInputs && (
                    <p>
                      Image references map to the original data URLs in the downloaded JSON's
                      imageInputs field. The original archive request hashes are unchanged.
                    </p>
                  )}
                </details>
              )}
              {event.kind === 'response' && (
                <>
                  <details open>
                    <summary>Recorded model output</summary>
                    <pre className="review-json" tabIndex={0}>
                      {event.response?.text ?? 'No text was recorded.'}
                    </pre>
                  </details>
                  <details>
                    <summary>Response metadata and usage receipt</summary>
                    <JSONView
                      value={Object.fromEntries(
                        Object.entries(event.response ?? {}).filter(([key]) => key !== 'text'),
                      )}
                    />
                  </details>
                </>
              )}
              {event.kind === 'step' && (
                <>
                  <details open>
                    <summary>{event.action ? 'Parsed action' : 'No parsed action'}</summary>
                    <JSONView value={event.action} />
                  </details>
                  {event.error && <p className="review-notice">{event.error}</p>}
                </>
              )}
              <details open={!['input', 'response', 'step'].includes(event.kind)}>
                <summary>Original event · hashes preserved</summary>
                <JSONView value={event} />
              </details>
            </>
          ) : (
            <p>No events match your search.</p>
          )}
        </div>
      </div>
    </section>
  );
}
function Evidence({ record, item, view }) {
  const episode = record.run.episodes[0],
    audit = record.audit.episodes[0];
  const changes = useMemo(() => stateChanges(audit.initial?.state, audit.outcome?.state), [record]);
  if (view === 'trace') return <Trace record={record} />;
  if (view === 'replay')
    return (
      <section aria-label="Trial replay" onKeyDown={replayKeys}>
        {!item.actionAttempts ? (
          <>
            <div className="review-empty">
              <Film size={22} />
              <div>
                <h2>No actions recorded</h2>
                <p>
                  This run stopped before an action. The captured workspace is shown below; there is
                  no action sequence to play.
                </p>
              </div>
            </div>
            <WorkspaceReplay frame={replayFrames(record, item.episodeId)[0]} />
            <TaskComparison
              record={record}
              episodeId={item.episodeId}
              state={audit.outcome?.state ?? audit.initial?.state}
              actualLabel={audit.outcome?.state ? 'Final captured state' : 'Initial captured state'}
              isFinal={!!audit.outcome?.state}
            />
          </>
        ) : (
          <ReplayPlayer record={record} />
        )}
        <p className="review-caption">
          Recorded UI states · current Slack renderer · not video. Original event timing and hashes
          remain in Trace. Playback makes no model calls.
        </p>
      </section>
    );
  if (view === 'checks')
    return (
      <section className="review-detail" aria-label="Outcome checks">
        <h2>{item.outcome === 'blocked' ? 'Diagnostic workspace checks' : 'Outcome checks'}</h2>
        <TaskComparison
          record={record}
          episodeId={item.episodeId}
          state={audit.outcome?.state}
          actualLabel="Final captured state"
          isFinal
        />
        {item.outcome === 'blocked' && (
          <p>
            A blocked run is not a completed task, even if its saved workspace satisfies some
            checks.
          </p>
        )}
        <ul className="review-checks">
          {(episode.evaluation?.checks ?? []).map((check, i) => (
            <li key={i} data-passed={check.passed}>
              <span>{check.passed ? <Check size={17} /> : '×'}</span>
              <span>{check.name}</span>
              <b>{check.passed ? 'Passed' : 'Failed'}</b>
            </li>
          ))}
        </ul>
        {episode.error && <p className="review-notice">{episode.error}</p>}
        <details>
          <summary>Original evaluation</summary>
          <JSONView value={audit.outcome?.evaluation} />
        </details>
      </section>
    );
  if (view === 'changes')
    return (
      <section className="review-detail" aria-label="Workspace changes">
        <h2>Initial → final workspace</h2>
        <p>
          {changes.length} changed paths. Arrays are compared as whole values; intermediate states
          remain in Trace and Replay.
        </p>
        {changes.length ? (
          changes.map((change) => (
            <details key={change.path}>
              <summary>{change.path}</summary>
              <div className="review-diff">
                <div>
                  <h3>Before</h3>
                  {change.beforeExists ? (
                    <JSONView value={change.before} />
                  ) : (
                    <p className="review-caption">Field absent</p>
                  )}
                </div>
                <div>
                  <h3>After</h3>
                  {change.afterExists ? (
                    <JSONView value={change.after} />
                  ) : (
                    <p className="review-caption">Field absent</p>
                  )}
                </div>
              </div>
            </details>
          ))
        ) : (
          <p>No workspace changes.</p>
        )}
        <details>
          <summary>Original initial state</summary>
          <JSONView value={audit.initial} />
        </details>
        <details>
          <summary>Original final state</summary>
          <JSONView value={audit.outcome} />
        </details>
      </section>
    );
  return (
    <section className="review-detail" aria-label="Recording provenance">
      <h2>
        <ShieldCheck size={22} /> Evidence provenance
      </h2>
      <p>{record.selection.note}</p>
      <dl className="review-provenance">
        <dt>Origin</dt>
        <dd>
          {item.originCampaign} / {item.phase}
        </dd>
        <dt>Run / episode</dt>
        <dd>
          {item.runId} / {item.episodeId}
        </dd>
        <dt>Original archive SHA-256</dt>
        <dd>{item.archiveSha256}</dd>
        <dt>Public recording SHA-256</dt>
        <dd>{item.sha256}</dd>
        <dt>Original source SHA-256</dt>
        <dd>{record.run.sourceHash}</dd>
      </dl>
      <p>
        {record.audit.integrity.checks.length} original archive checks passed.{' '}
        {record.audit.integrity.scope}
      </p>
      <details>
        <summary>Integrity checks and capture limitations</summary>
        <JSONView value={{ integrity: record.audit.integrity, limits: record.audit.limits }} />
      </details>
      <details>
        <summary>Original artifact inventory · PNG bytes not included</summary>
        <JSONView value={record.audit.artifacts} />
      </details>
      <details>
        <summary>Run configuration and run-scoped budget</summary>
        <JSONView value={record.run} />
      </details>
      <a href={item.path} download>
        Download compressed structured recording
      </a>
    </section>
  );
}
function App() {
  const [catalog, setCatalog] = useState(null),
    [catalogError, setCatalogError] = useState('');
  const [selection, setSelection] = useState(readLocation);
  const [loaded, setLoaded] = useState(null),
    [loadError, setLoadError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch(interfaceStudy ? interfaceCatalogPath : catalogPath, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error('Trial catalog unavailable.');
        return r.json();
      })
      .then((data) => {
        if (!controller.signal.aborted) setCatalog(validateCatalog(data));
      })
      .catch((error) => {
        if (!controller.signal.aborted) setCatalogError(error.message);
      });
    return () => controller.abort();
  }, []);
  useEffect(() => {
    const back = () => setSelection(readLocation());
    addEventListener('popstate', back);
    return () => removeEventListener('popstate', back);
  }, []);
  const item = catalog?.trials.find((t) => t.id === (selection.trial || catalog.trials[0]?.id));
  const record = loaded && item && loaded.id === item.id ? loaded.record : null;
  useEffect(() => {
    setLoaded(null);
    setLoadError('');
    if (!item) return;
    const controller = new AbortController();
    loadRecord(item, controller.signal)
      .then((record) => {
        if (!controller.signal.aborted) setLoaded({ id: item.id, record });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setLoadError(error.message);
      });
    return () => controller.abort();
  }, [item?.id]);
  function navigate(trial, view = selection.view) {
    if (trial === (selection.trial || item?.id) && view === selection.view) return;
    const next = { trial, view, ...(interfaceStudy ? { study: 'interfaces' } : {}) };
    history.pushState(null, '', `${location.pathname}?${new URLSearchParams(next)}`);
    setSelection(next);
  }
  const index = catalog?.trials.findIndex((r) => r.id === item?.id) ?? -1;
  const tabs = [
    ['replay', 'Watch replay', Film],
    ['trace', 'Review trace', FileJson],
    ['checks', 'Checks', ListChecks],
    ['changes', 'Changes', GitCompareArrows],
    ['provenance', 'Provenance', ShieldCheck],
  ];
  return (
    <div className="trial-review">
      <header className="review-header">
        <a className="review-brand" href="/">
          <img src={logo} alt="" />
          Relay
        </a>
        <span>Trial review</span>
        <a className="review-back" href={`/presentation#${resultAnchor}`}>
          <ArrowLeft size={15} /> Results
        </a>
      </header>
      <main>
        <div className="review-title">
          <div>
            <h1>{interfaceStudy ? 'Compare interface traces' : 'Review every trial'}</h1>
            <p>
              {catalog
                ? `${catalog.attempted} / ${catalog.planned} recorded · no key needed · no new inference`
                : 'Opening the trial library…'}
            </p>
          </div>
          <a href="/play">Try Slack yourself ↗</a>
        </div>
        {catalogError && (
          <p role="alert" className="review-notice">
            {catalogError} Reload to try again.
          </p>
        )}
        {catalog && !item && (
          <p role="alert" className="review-notice">
            This trial is not in the published inventory.{' '}
            <a href="/demo/review.html">Browse recorded trials</a>
          </p>
        )}
        {item && (
          <>
            <div className="review-toolbar">
              <RelaySelect
                label="Review model"
                wide
                value={item.model}
                onChange={(model) =>
                  navigate(
                    catalog.trials.find(
                      (r) =>
                        r.model === model && r.task === item.task && r.interface === item.interface,
                    ).id,
                  )
                }
                options={[...new Set(catalog.trials.map((r) => r.model))].sort().map((model) => ({
                  value: model,
                  label: model,
                  icon: <ReviewModelMark id={model} size={19} />,
                  disabled: !catalog.trials.some(
                    (r) =>
                      r.model === model && r.task === item.task && r.interface === item.interface,
                  ),
                  disabledReason: 'Not recorded for this task yet',
                }))}
              />
              <RelaySelect
                label="Review task"
                wide
                value={item.task}
                onChange={(task) =>
                  navigate(
                    catalog.trials.find(
                      (r) =>
                        r.task === task && r.model === item.model && r.interface === item.interface,
                    ).id,
                  )
                }
                options={[...new Set(catalog.trials.map((r) => r.task))].sort().map((task) => ({
                  value: task,
                  label: title(task),
                  icon: <TaskIcon task={task} />,
                  disabled: !catalog.trials.some(
                    (r) =>
                      r.task === task && r.model === item.model && r.interface === item.interface,
                  ),
                  disabledReason: 'Not recorded for this model yet',
                }))}
              />
              {interfaceStudy && (
                <RelaySelect
                  label="Review interface"
                  value={item.interface}
                  onChange={(mode) =>
                    navigate(
                      catalog.trials.find(
                        (r) =>
                          r.task === item.task && r.model === item.model && r.interface === mode,
                      ).id,
                    )
                  }
                  options={Object.entries(modeLabels).map(([mode, label]) => ({
                    value: mode,
                    label,
                    icon: <ModeIcon mode={mode} />,
                    disabled: !catalog.trials.some(
                      (r) => r.task === item.task && r.model === item.model && r.interface === mode,
                    ),
                    disabledReason: 'Not recorded for this model and task yet',
                  }))}
                />
              )}
              <div className="review-trial-nav">
                <button
                  aria-label="Previous trial"
                  disabled={index <= 0}
                  onClick={() => navigate(catalog.trials[index - 1].id)}
                >
                  <ArrowLeft size={17} />
                </button>
                <span>
                  {index + 1} / {catalog.trials.length}
                </span>
                <button
                  aria-label="Next trial"
                  disabled={index >= catalog.trials.length - 1}
                  onClick={() => navigate(catalog.trials[index + 1].id)}
                >
                  <ArrowRight size={17} />
                </button>
              </div>
            </div>
            <article
              className="review-card"
              key={item.id}
              data-trial-id={item.id}
              aria-busy={!record && !loadError}
            >
              <div className="review-summary">
                <div>
                  <ReviewModelMark id={item.model} size={28} />
                  <div>
                    <h2>{title(item.task)}</h2>
                    <span>
                      {item.model} · seed {item.seed} · {item.interface}
                    </span>
                  </div>
                </div>
                <div className="review-metrics">
                  <span>{item.actionAttempts} action attempts</span>
                  <span>{(item.durationMs / 1000).toFixed(1)}s</span>
                  <span>
                    {item.usageKnown
                      ? `$${item.estimatedUSD.toFixed(4)} estimated`
                      : `Cost unknown · $${item.estimatedUSD.toFixed(4)} incl. reservation`}
                  </span>
                </div>
              </div>
              {taskCaveats[item.task] && <p className="review-notice">{taskCaveats[item.task]}</p>}
              <div className="review-tabs" role="group" aria-label="Review view">
                {tabs.map(([view, label, Icon]) => (
                  <button
                    key={view}
                    aria-pressed={selection.view === view}
                    onClick={() => navigate(item.id, view)}
                  >
                    <Icon size={16} />
                    {label}
                  </button>
                ))}
                <button
                  className="review-download"
                  disabled={!record}
                  onClick={() => download(record)}
                >
                  <Download size={16} />
                  JSON
                </button>
              </div>
              {loadError ? (
                <p role="alert" className="review-notice">
                  {loadError} Reload to try again; no model request will be made.
                </p>
              ) : !record ? (
                <div className="review-loading" role="status">
                  <span />
                  Loading and verifying recording…
                </div>
              ) : (
                <>
                  <div className="review-outcome">
                    <OutcomeBadge episode={record.run.episodes[0]} />
                    <span>
                      <ShieldCheck size={14} /> Recording hash checked
                    </span>
                  </div>
                  <details className="review-instruction">
                    <summary>Task instruction</summary>
                    <p>
                      {record.events.find(({ event }) => event.kind === 'episode_started')?.event
                        .instruction ?? 'No instruction was recorded.'}
                    </p>
                  </details>
                  <Evidence
                    key={`${item.id}/${selection.view}`}
                    record={record}
                    item={item}
                    view={selection.view}
                  />
                </>
              )}
            </article>
          </>
        )}
        <footer>
          One attempt per {interfaceStudy ? 'model/task/interface' : 'model/task'} · failures
          retained · playback is read-only.{' '}
          <a href={`/presentation#${resultAnchor}`}>Comparison and limitations</a>
        </footer>
      </main>
    </div>
  );
}
createRoot(document.getElementById('root')).render(<App />);
