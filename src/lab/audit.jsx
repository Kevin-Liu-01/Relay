import React, { useEffect, useState } from 'react';

const pretty = (data) => JSON.stringify(data, null, 2);
const titles = {
  episode_started: 'Session opened',
  observation: 'Observation',
  input: 'Input prepared',
  request: 'Model request',
  response: 'Model response',
  step: 'Action',
  action_started: 'Action started',
  provider_error: 'Provider error',
  episode_error: 'Episode stopped',
  cleanup_error: 'Cleanup error',
  terminal: 'Outcome',
  mutation: 'State changed',
  interaction: 'Browser interaction',
};
const label = (event) => titles[event.kind] ?? event.kind;

export function AuditView({ runId, initialEpisode }) {
  const [audit, setAudit] = useState(null),
    [error, setError] = useState('');
  const [episodeId, setEpisodeId] = useState(initialEpisode),
    [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all'),
    [query, setQuery] = useState(''),
    [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setError('');
    fetch(`/api/runs/${runId}/audit`, { signal: controller.signal })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw Error(data.error);
        return data;
      })
      .then((data) => {
        setAudit(data);
        setEpisodeId((old) => old ?? data.episodes[0]?.episode.cell.episodeId);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError(e.message);
      });
    return () => controller.abort();
  }, [runId, revision]);
  if (!audit) return <p role={error ? 'alert' : 'status'}>{error || 'Loading audit…'}</p>;
  const current =
    audit.episodes.find((e) => e.episode.cell.episodeId === episodeId) ?? audit.episodes[0];
  const all = [
    ...current.trace.map((event, index) => ({ event, key: `trace-${index}`, stream: 'Agent' })),
    ...(current.outcome?.events ?? []).map((event, index) => ({
      event,
      key: `state-${index}`,
      stream: 'Workspace',
    })),
  ];
  // Preserve each source's ordering; do not fabricate timestamps for legacy records.
  const visible = all.filter(({ event, stream }) => {
    const matches =
      filter === 'all' ||
      (filter === 'errors'
        ? event.error || event.kind.endsWith('_error')
        : filter === 'state'
          ? stream === 'Workspace'
          : filter === 'requests'
            ? ['input', 'request'].includes(event.kind)
            : filter === 'responses'
              ? event.kind === 'response'
              : event.kind === 'step');
    return matches && pretty(event).toLowerCase().includes(query.toLowerCase());
  });
  const row = visible.find((r) => r.key === selected) ?? visible[0],
    event = row?.event;
  const requestFile =
    event?.requestFile ??
    current.trace.find((e) => e.kind === 'input' && e.step === event?.step)?.requestFile;
  const screenshot = event?.observation?.imageFile ?? event?.operatorScreenshot;
  const base = `/api/runs/${runId}`;
  const artifact = (file) => `${base}/${current.episode.cell.episodeId}/${file}`;
  const active = ['running', 'queued'].includes(audit.run.status);
  const problem = audit.integrity.status === 'failed';
  return (
    <div className="audit-view">
      <div className="audit-tools">
        <select
          aria-label="Audit episode"
          value={current.episode.cell.episodeId}
          onChange={(e) => {
            setEpisodeId(e.target.value);
            setSelected(null);
          }}
        >
          {audit.episodes.map(({ episode: e }) => (
            <option key={e.cell.episodeId} value={e.cell.episodeId}>
              {e.cell.episodeId} · {e.cell.model.id} · {e.cell.mode} · {e.status}
            </option>
          ))}
        </select>
        <button className="quiet" onClick={() => setRevision((r) => r + 1)}>
          Refresh audit
        </button>
        <a href={`${base}/audit?download=1`} download>
          JSON ↓
        </a>
        <a href={`${base}/audit.jsonl`} download>
          JSONL ↓
        </a>
        {!active && (
          <a href={`${base}/audit.tar.gz`} download>
            Full bundle ↓
          </a>
        )}
      </div>
      {error && <p role="alert">{error}</p>}
      <details className="audit-integrity" open={problem}>
        <summary className={problem ? 'failed' : ''}>
          Integrity: {audit.integrity.status} · {audit.integrity.checks.filter((c) => c.ok).length}/
          {audit.integrity.checks.length} checks · {audit.integrity.gaps.length} capture gaps
        </summary>
        <p className="hint">{audit.integrity.scope}</p>
        {audit.integrity.gaps.map((gap) => (
          <p className="audit-gap" key={gap}>
            {gap}
          </p>
        ))}
        <pre>{pretty(audit.integrity.checks)}</pre>
      </details>
      <p className="hint audit-caption">
        {all.length} records ·{' '}
        {audit.run.evidenceKind === 'scripted-reference'
          ? 'Reference script, not model evidence'
          : 'Live model evidence'}{' '}
        · snapshot {new Date(audit.generatedAt).toLocaleTimeString()}
        {active ? ' · Refresh for new events' : ''}
      </p>
      <div className="audit-filters">
        <input
          aria-label="Search audit"
          placeholder="Find an action, ID or error…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          aria-label="Audit event type"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {['all', 'requests', 'responses', 'actions', 'errors', 'state'].map((x) => (
            <option key={x} value={x}>
              {x === 'all' ? 'All events' : x[0].toUpperCase() + x.slice(1)}
            </option>
          ))}
        </select>
      </div>
      <div className="audit-grid">
        <nav className="audit-timeline" aria-label="Audit events">
          {visible.map((r) => (
            <button
              key={r.key}
              aria-pressed={row?.key === r.key}
              onClick={() => setSelected(r.key)}
            >
              <span>
                {label(r.event)}
                {r.event.step ? ` · ${r.event.step}` : ''}
              </span>
              <small>
                {r.stream} ·{' '}
                {r.event.at ? new Date(r.event.at).toLocaleTimeString() : 'Time not recorded'}
              </small>
              {(r.event.action?.type || r.event.error) && (
                <small className={r.event.error ? 'failed' : ''}>
                  {r.event.error ?? r.event.action.type}
                </small>
              )}
            </button>
          ))}
          {!visible.length && (
            <p className="hint">
              {current.episode.status === 'queued'
                ? 'Not attempted. No events.'
                : 'No matching events.'}
            </p>
          )}
        </nav>
        <section className="audit-detail" aria-label="Audit event details">
          {event ? (
            <>
              <h3>
                {label(event)} {event.step ? `· step ${event.step}` : ''}
              </h3>
              {screenshot && (
                <a href={artifact(screenshot)} target="_blank" rel="noreferrer">
                  <img
                    className="audit-image"
                    src={artifact(screenshot)}
                    alt="Recorded audit observation"
                  />
                </a>
              )}
              {event.response && (
                <>
                  <h3>Model output</h3>
                  <pre>{event.response.text}</pre>
                  <dl>
                    <dt>Model</dt>
                    <dd>{event.response.returnedModel ?? 'Not recorded'}</dd>
                    <dt>Input / output</dt>
                    <dd>
                      {event.response.usage
                        ? `${event.response.usage.inputTokens} / ${event.response.usage.outputTokens} tokens`
                        : 'Usage unavailable'}
                    </dd>
                    <dt>Latency</dt>
                    <dd>{event.response.latencyMs ?? 'Unknown'} ms</dd>
                  </dl>
                </>
              )}
              {(event.kind === 'request' ||
                event.kind === 'input' ||
                event.kind === 'response' ||
                event.kind === 'step') && (
                <details>
                  <summary>Exact request body</summary>
                  {requestFile && current.inputs[requestFile] ? (
                    <>
                      <p className="hint">
                        Prepared input. A request event confirms an attempted call; reference
                        scripts never send it. Authentication headers are excluded.
                      </p>
                      <pre>{pretty(current.inputs[requestFile])}</pre>
                      <a href={artifact(requestFile)} target="_blank" rel="noreferrer">
                        Open request JSON ↗
                      </a>
                    </>
                  ) : (
                    <p className="hint">
                      Not recorded in this legacy run. The original prompt hash is preserved; no
                      reconstruction is presented as an exact request.
                    </p>
                  )}
                </details>
              )}
              <details open key={row.key}>
                <summary>Complete event record</summary>
                <pre>{pretty(event)}</pre>
              </details>
            </>
          ) : (
            <p className="hint">No event selected.</p>
          )}
        </section>
      </div>
      <details>
        <summary>Task, configuration & provenance</summary>
        <pre>
          {pretty({
            instruction: current.episode.instruction,
            episode: current.episode,
            config: audit.run.config,
            budget: audit.run.budget,
            sourceHash: audit.run.sourceHash,
            configHash: audit.run.configHash,
            guideHash: audit.run.guideHash,
            catalog: audit.run.catalog,
            stopReason: audit.run.stopReason,
          })}
        </pre>
      </details>
      <details>
        <summary>Initial state</summary>
        <pre>{current.initial ? pretty(current.initial) : 'Not recorded in this run.'}</pre>
      </details>
      <details>
        <summary>Final state, mutations & outcome checks</summary>
        <pre>{current.outcome ? pretty(current.outcome) : 'No final-state export recorded.'}</pre>
      </details>
      <details>
        <summary>Artifacts & SHA-256 hashes</summary>
        <div className="audit-files">
          {audit.artifacts.map((a) => (
            <div key={a.path}>
              {a.href ? (
                <a href={a.href} target="_blank" rel="noreferrer">
                  {a.path}
                </a>
              ) : (
                <span>{a.path}</span>
              )}
              <small>
                {a.bytes.toLocaleString()} bytes · {a.sha256}
              </small>
            </div>
          ))}
        </div>
      </details>
      <details>
        <summary>Capture limits</summary>
        {audit.limits.map((line) => (
          <p className="hint" key={line}>
            {line}
          </p>
        ))}
      </details>
    </div>
  );
}
