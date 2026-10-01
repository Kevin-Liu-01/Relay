import React from 'react';
import { episodeOutcome } from '../../shared/run-outcome.mjs';
import {
  MousePointer2,
  Type,
  Keyboard,
  ArrowDown,
  Check,
  AlertTriangle,
  LoaderCircle,
  CircleCheck,
  Clock3,
} from 'lucide-react';

export function describeAction(action, observation) {
  if (!action) return 'Waiting for a decision';
  const target = observation?.elements?.find((e) => e.ref === action.ref)?.name;
  const type =
    {
      click: 'Click',
      hover: 'Hover',
      move: 'Move',
      fill: 'Type',
      type: 'Type',
      key: 'Press',
      scroll: 'Scroll',
      wait: 'Wait',
      finish: 'Finish',
      'channel.topic': 'Update topic',
      'message.send': 'Send message',
    }[action.type] ?? action.type;
  return `${type}${target ? ` · ${target}` : action.key ? ` · ${action.key}` : ''}`;
}
export function ActionSpotlight({ events = [], busy = false, selected, episode }) {
  const start = events.filter((e) => e.kind === 'action_started').at(-1);
  const last = selected ?? events.filter((e) => e.kind === 'step').at(-1);
  const pending = busy && start && (!last || start.step > last.step);
  const action = pending ? start.action : last?.action;
  const deciding = busy && episode?.inFlight;
  const outcome = episodeOutcome(episode),
    blocked = !busy && outcome.kind === 'blocked';
  const Icon = blocked
    ? AlertTriangle
    : deciding
      ? LoaderCircle
      : last?.error
        ? AlertTriangle
        : ['fill', 'type'].includes(action?.type)
          ? Type
          : action?.type === 'key'
            ? Keyboard
            : action?.type === 'scroll'
              ? ArrowDown
              : action?.type === 'finish'
                ? Check
                : MousePointer2;
  const observation = pending
    ? events.filter((e) => e.kind === 'observation').at(-1)?.observation
    : last?.observation;
  return (
    <section
      className={`action-spotlight ${deciding ? 'is-deciding' : ''} ${last?.error ? 'is-rejected' : ''}`}
      aria-label="Current action"
      aria-live="polite"
    >
      <div className="action-eyebrow">
        <span>
          {blocked
            ? 'RUN BLOCKED'
            : deciding
              ? 'DECIDING'
              : pending
                ? 'ACTING NOW'
                : last
                  ? `ACTION ${String(last.step).padStart(2, '0')}`
                  : 'NEXT MOVE'}
        </span>
        <span>
          {last?.response?.latencyMs != null
            ? `${(last.response.latencyMs / 1000).toFixed(2)}s`
            : ''}
        </span>
      </div>
      <div className="action-headline" key={`${deciding}-${pending ? start?.step : last?.step}`}>
        <Icon size={25} />
        <h3 className={!deciding && !action ? 'is-waiting' : undefined}>
          {blocked
            ? outcome.title
            : deciding
              ? 'Choosing the next move'
              : describeAction(action, observation)}
        </h3>
      </div>
      {(action?.text || action?.topic || last?.error) && (
        <p>{last?.error ?? action.text ?? action.topic}</p>
      )}
      <div className="action-feedback">
        {blocked
          ? 'Stopped · no automatic retry'
          : last?.error
            ? 'Action rejected · recorded in audit'
            : pending
              ? 'Applying to workspace…'
              : last
                ? 'Action recorded'
                : 'Watch each decision land in Slack.'}
      </div>
    </section>
  );
}
export function ResultCard({ episode, onReplay, onChooseModel }) {
  if (!episode?.evaluation && !episode?.error) return null;
  const outcome = episodeOutcome(episode);
  const pass = outcome.kind === 'passed',
    blocked = outcome.kind === 'blocked';
  const checks = episode.evaluation?.checks ?? {};
  return (
    <section
      className={`result-card ${pass ? 'pass' : 'fail'}`}
      aria-label="Run result"
      aria-live="polite"
    >
      <div>
        <span className="result-icon">
          {pass ? <CircleCheck size={24} /> : <AlertTriangle size={24} />}
        </span>
        <div>
          <span className="mini-label">{blocked ? 'RUN BLOCKED' : 'WORKSPACE CHECKED'}</span>
          <h3>{outcome.title}</h3>
        </div>
      </div>
      {outcome.changeModel && onChooseModel && (
        <button className="primary full-width" onClick={onChooseModel}>
          Choose another model
        </button>
      )}
      <p>
        {episode.error ??
          (pass
            ? 'The requested change is in the right place.'
            : 'The final workspace did not meet the task contract.')}
      </p>
      {blocked && (
        <p className="hint">
          {episode.steps
            ? 'The run stopped early. Workspace checks are diagnostic, not a completed agent result.'
            : 'No agent actions were executed. This is not a task-performance result.'}
        </p>
      )}
      <div className="result-metrics">
        <span>
          <b>{episode.steps}</b> actions
        </span>
        <span>
          <Clock3 size={13} />
          <b>{((episode.durationMs ?? 0) / 1000).toFixed(1)}s</b>
        </span>
        <span>
          <b>
            {episode.usageKnown === false
              ? 'Unknown'
              : `$${(episode.estimatedUSD ?? 0).toFixed(5)}`}
          </b>{' '}
          cost
        </span>
      </div>
      {Object.keys(checks).length > 0 && (
        <details>
          <summary>
            {blocked ? 'Workspace snapshot checks' : 'Outcome checks'}
            {Array.isArray(checks)
              ? ` · ${checks.filter((c) => c.passed).length}/${checks.length} passed`
              : ''}
          </summary>
          {Array.isArray(checks) ? (
            <ul className="outcome-checks">
              {checks.map((c, i) => (
                <li key={i}>
                  {c.passed ? <Check size={13} /> : <AlertTriangle size={13} />}
                  <span>{c.name}</span>
                </li>
              ))}
            </ul>
          ) : (
            <pre>{JSON.stringify(checks, null, 2)}</pre>
          )}
        </details>
      )}
      {blocked && episode.usageKnown === false && (
        <p className="hint">
          Usage and cost are unknown. The local budget allowance is not a provider charge.
        </p>
      )}
      {onReplay && (
        <button className="full-width replay-cta" onClick={onReplay}>
          Play the run <span>↗</span>
        </button>
      )}
    </section>
  );
}
