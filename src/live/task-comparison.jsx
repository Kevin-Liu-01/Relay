import React, { useEffect, useMemo, useState } from 'react';
import { Check, CircleHelp, GitCompareArrows, Minus, ChevronDown } from 'lucide-react';
import { compareTaskRows, expectationKey, matchesExpectation } from './task-comparison.mjs';
import './task-comparison.css';

let published;
function loadExpectations() {
  if (!published)
    published = fetch('/demo/task-expectations.json')
      .then(async (r) => {
        if (!r.ok) throw Error('Comparison unavailable');
        const value = await r.json();
        if (value.schema !== 'relay-task-expectations-v1')
          throw Error('Unknown comparison version');
        return value.contracts;
      })
      .catch((e) => {
        published = null;
        throw e;
      });
  return published;
}

function format(value, field, names) {
  if (value === undefined) return 'Not present';
  if (field === 'editedAt') return value ? 'Edited' : 'Not edited';
  if (field === 'pinned') return value ? 'Pinned' : 'Not pinned';
  if (field === 'savedBy')
    return value?.length ? value.map((id) => names[id] ?? id).join(', ') : 'Nobody';
  if (field === 'reactions')
    return (
      Object.entries(value ?? {})
        .filter(([, v]) => v.length)
        .map(([emoji, ids]) => `${emoji} ${ids.map((id) => names[id] ?? id).join(', ')}`)
        .join('\n') || 'No reactions'
    );
  return String(value ?? '');
}
function Value({ row, value, contract, actual = false }) {
  if (actual && row.status === 'unknown')
    return <span className="comparison-muted">Not recorded</span>;
  if (row.kind === 'delete') return <span>{value ? 'Still present' : 'Deleted'}</span>;
  if (row.kind !== 'post') return <span>{format(value, row.field, contract.names)}</span>;
  const messages = actual ? value : [value];
  return messages.length ? (
    messages.map((m, index) => (
      <div className="comparison-message" key={index}>
        <span>{m.text}</span>
        <small>
          {contract.names[m.userId] ?? m.userId} · {m.pinned ? 'Pinned' : 'Not pinned'} ·{' '}
          {m.editedAt ? 'Edited' : 'Not edited'}
        </small>
        <small>
          {format(m.reactions, 'reactions', contract.names)} · Saved by{' '}
          {format(m.savedBy, 'savedBy', contract.names)}
        </small>
      </div>
    ))
  ) : (
    <span className="comparison-muted">No new message in this destination</span>
  );
}

export function TaskComparison({
  record,
  episodeId,
  state,
  actualLabel = 'Actual state',
  isFinal = false,
}) {
  const episode = record?.run?.episodes?.find((e) => e.cell.episodeId === episodeId);
  const inline = record?.expectations?.[episodeId];
  const [lookup, setLookup] = useState({ key: '', contract: null, loading: true });
  const [expanded, setExpanded] = useState(true);
  const key = `${record?.run?.id}/${expectationKey(episode)}`;
  useEffect(() => {
    let current = true;
    if (matchesExpectation(inline, episode)) return;
    setLookup({ key, contract: null, loading: true });
    loadExpectations()
      .then((contracts) => {
        if (current)
          setLookup({ key, contract: contracts[expectationKey(episode)], loading: false });
      })
      .catch(() => {
        if (current) setLookup({ key, contract: null, loading: false });
      });
    return () => {
      current = false;
    };
  }, [key, inline, episode?.instruction, episode?.appProvenance?.backendHash]);
  const candidate = inline ?? (lookup.key === key ? lookup.contract : null);
  const contract = matchesExpectation(candidate, episode) ? candidate : null;
  const rows = useMemo(() => (contract ? compareTaskRows(contract, state) : []), [contract, state]);
  const unchanged = episode?.evaluation?.checks?.find(
    (c) => c.name === 'no_unrequested_state_changes',
  );
  const isBlocked = episode?.status !== 'completed';
  return (
    <section className="task-comparison" aria-label="Expected and actual result">
      <button
        className="comparison-toggle"
        aria-expanded={expanded}
        onClick={() => setExpanded(!expanded)}
      >
        <GitCompareArrows size={17} />
        <strong>Expected vs actual</strong>
        <span>
          {contract
            ? `${rows.filter((r) => r.status === 'match').length}/${rows.length} fields match`
            : 'Task requirements'}
        </span>
        <ChevronDown size={16} />
      </button>
      {expanded && (
        <div className="comparison-content">
          {!contract ? (
            <p role="status">
              {lookup.loading
                ? 'Loading task requirements…'
                : 'Comparison unavailable for this task version. The recorded task instruction and checks are unchanged.'}
            </p>
          ) : (
            <>
              <p className="comparison-caption">
                Required final values compared with {actualLabel.toLowerCase()}. Viewer only; not
                sent to the agent.
              </p>
              {['release-sync', 'design-handoff'].includes(contract.taskId) && (
                <p className="comparison-caveat">
                  This task has a documented wording issue. These are the original grader
                  requirements, not corrected instructions.
                </p>
              )}
              <div className="comparison-fields">
                {rows.map((row) => (
                  <article className="comparison-field" data-status={row.status} key={row.id}>
                    <header>
                      <strong>{row.label}</strong>
                      <span>{row.location}</span>
                      <span className="comparison-status">
                        {row.status === 'match' ? (
                          <Check size={14} />
                        ) : row.status === 'unknown' ? (
                          <CircleHelp size={14} />
                        ) : (
                          <Minus size={14} />
                        )}
                        {row.status === 'match'
                          ? 'Matches'
                          : row.status === 'unknown'
                            ? 'Unknown'
                            : 'Different'}
                      </span>
                    </header>
                    {row.context && (
                      <details className="comparison-target">
                        <summary>Target message</summary>
                        <p>{row.context}</p>
                      </details>
                    )}
                    <div className="comparison-values">
                      <div>
                        <small>Expected final</small>
                        <Value row={row} value={row.expected} contract={contract} />
                      </div>
                      <div>
                        <small>{actualLabel}</small>
                        <Value row={row} value={row.actual} contract={contract} actual />
                      </div>
                    </div>
                  </article>
                ))}
              </div>
              <p className="comparison-preserved">
                All other workspace data must stay unchanged.{' '}
                {isFinal && unchanged
                  ? `Saved ${isBlocked ? 'diagnostic ' : ''}check: ${unchanged.passed ? 'unchanged' : 'unexpected differences'}.`
                  : 'See the final recorded check at the end of the run.'}
              </p>
              <p className="comparison-caption">
                Field matches are a visual aid, not a new grade. The saved outcome remains
                authoritative.
              </p>
            </>
          )}
        </div>
      )}
    </section>
  );
}
