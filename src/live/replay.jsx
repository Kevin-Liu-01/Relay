import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  MousePointer2,
  Film,
  Layers,
} from 'lucide-react';
import { ModelMark } from '../lab/model-mark.jsx';
import { describeAction } from './feedback.jsx';

export function replayFrames(record, episodeId) {
  const e = record?.audit?.episodes?.find((x) => x.episode.cell.episodeId === episodeId);
  const events =
    record?.events?.filter((x) => x.episodeId === episodeId).map((x) => x.event) ?? e?.trace ?? [];
  const steps = events.filter((x) => x.kind === 'step');
  const recorded = events
    .filter((x) => x.replay?.version === 1)
    .map((x) => ({
      snapshot: x.replay,
      step: steps.find((s) => s.step === x.step),
      label: x.kind === 'replay_final' ? 'Final workspace' : `Before action ${x.step}`,
      fidelity: 'Recorded UI state',
    }));
  if (recorded.length) return recorded;
  // Legacy capture: do not invent missing intermediate UI state.
  const stateFrame = (value, label) =>
    value?.state
      ? {
          snapshot: {
            version: 1,
            data: { state: value.state, revision: value.revision },
            ui: { channelId: 'project' },
            dom: {},
            viewport: { width: 1440, height: 900 },
          },
          label,
          fidelity: 'State only · UI position not recorded',
        }
      : null;
  return [
    stateFrame(e?.initial, 'Initial workspace'),
    ...steps
      .map((s) => ({
        step: s,
        label: `Action ${s.step}`,
        fidelity: 'Legacy screenshot',
        image:
          record.artifacts?.[`${episodeId}/${s.observation?.imageFile ?? s.operatorScreenshot}`],
      }))
      .filter((f) => f.image),
    stateFrame(e?.outcome, 'Final workspace'),
  ].filter(Boolean);
}
export function WorkspaceReplay({ frame, title = 'Recorded Slack workspace' }) {
  const outer = useRef(null),
    iframe = useRef(null);
  const [width, setWidth] = useState(900),
    [ready, setReady] = useState(false);
  const snapshot = frame?.snapshot;
  const viewport = snapshot?.viewport ?? { width: 1440, height: 900 };
  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(e.contentRect.width));
    ro.observe(outer.current);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    const listener = (e) => {
      if (
        e.origin === location.origin &&
        e.source === iframe.current?.contentWindow &&
        e.data?.type === 'relay-replay-ready'
      )
        setReady(true);
    };
    window.addEventListener('message', listener);
    return () => window.removeEventListener('message', listener);
  }, []);
  useEffect(() => {
    if (ready && snapshot)
      iframe.current?.contentWindow.postMessage(
        { type: 'relay-replay', snapshot },
        location.origin,
      );
  }, [ready, snapshot]);
  const target = snapshot?.dom?.targets?.find((t) => t.ref === frame?.step?.action?.ref);
  const action = frame?.step?.action;
  const point = target
    ? { x: target.x + target.width / 2, y: target.y + target.height / 2 }
    : Number.isFinite(action?.x)
      ? action
      : null;
  return (
    <div
      className="replay-screen"
      ref={outer}
      style={{
        aspectRatio: `${viewport.width}/${viewport.height}`,
        '--replay-ratio': viewport.width / viewport.height,
      }}
    >
      {snapshot ? (
        <iframe
          ref={iframe}
          title={title}
          src="/replay.html"
          tabIndex={-1}
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => {
            setReady(true);
            iframe.current?.contentWindow.postMessage(
              { type: 'relay-replay', snapshot },
              location.origin,
            );
          }}
          style={{
            width: viewport.width,
            height: viewport.height,
            transform: `scale(${width / viewport.width})`,
          }}
        />
      ) : frame?.image ? (
        <img src={frame.image} alt="Recorded workspace screenshot" />
      ) : (
        <p>No captured frame available.</p>
      )}
      {point && (
        <div
          className="replay-pointer"
          style={{
            left: `${(point.x / viewport.width) * 100}%`,
            top: `${(point.y / viewport.height) * 100}%`,
          }}
        >
          <span />
          <MousePointer2 size={24} fill="currentColor" />
        </div>
      )}
      <span className="replay-safety">
        <Layers size={12} /> {frame?.fidelity ?? 'No capture'} · read-only
      </span>
    </div>
  );
}
export function ReplayPlayer({ record }) {
  const [eid, setEid] = useState(record.run.episodes[0].cell.episodeId),
    [index, setIndex] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1);
  const frames = useMemo(() => replayFrames(record, eid), [record, eid]);
  const episode = record.run.episodes.find((e) => e.cell.episodeId === eid);
  useEffect(() => {
    setIndex(0);
    setPlaying(false);
  }, [eid]);
  useEffect(() => {
    if (!playing) return;
    if (index >= frames.length - 1) {
      setPlaying(false);
      return;
    }
    const t = setTimeout(() => setIndex((i) => i + 1), 1500 / speed);
    return () => clearTimeout(t);
  }, [playing, index, speed, frames.length]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  const frame = frames[index];
  const seek = (i) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(frames.length - 1, i)));
  };
  return (
    <div className="replay-player">
      <div className="replay-heading">
        <ModelMark id={episode?.cell.model.id} size={24} />
        <div>
          <b>{episode?.cell.model.id}</b>
          <span>
            {record.run.evidenceKind === 'scripted-reference'
              ? 'Reference script · not model inference'
              : 'Recorded model run'}{' '}
            · no model calls during playback
          </span>
        </div>
        <select aria-label="Replay episode" value={eid} onChange={(e) => setEid(e.target.value)}>
          {record.run.episodes.map((e) => (
            <option key={e.cell.episodeId} value={e.cell.episodeId}>
              {e.cell.episodeId} · {e.cell.mode}
            </option>
          ))}
        </select>
      </div>
      <WorkspaceReplay frame={frame} />
      <div className="replay-action">
        <span>{frame?.label ?? 'No frames'}</span>
        <strong>
          {frame?.step
            ? describeAction(frame.step.action, frame.step.observation)
            : index === frames.length - 1
              ? episode?.evaluation?.success
                ? 'Task passed'
                : 'Task incomplete'
              : 'Starting workspace'}
        </strong>
        {frame?.step?.error && <small>{frame.step.error}</small>}
      </div>
      <div className="replay-controls">
        <button aria-label="Restart replay" onClick={() => seek(0)}>
          <RotateCcw size={17} />
        </button>
        <button aria-label="Previous action" disabled={!index} onClick={() => seek(index - 1)}>
          <SkipBack size={17} />
        </button>
        <button
          className="primary"
          aria-label={playing ? 'Pause replay' : 'Play replay'}
          disabled={frames.length < 2}
          onClick={() => {
            if (index === frames.length - 1) setIndex(0);
            setPlaying(!playing);
          }}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <button
          aria-label="Next action"
          disabled={index >= frames.length - 1}
          onClick={() => seek(index + 1)}
        >
          <SkipForward size={17} />
        </button>
        <input
          type="range"
          aria-label="Playback position"
          min={0}
          max={Math.max(0, frames.length - 1)}
          value={index}
          onChange={(e) => seek(Number(e.target.value))}
        />
        <span>
          {index + 1} / {frames.length}
        </span>
        <select
          aria-label="Playback speed"
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        >
          {[0.5, 1, 2].map((s) => (
            <option key={s} value={s}>
              {s}×
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
export function ReplayLibrary({ saved, onSaved, onRecording }) {
  const [demos, setDemos] = useState([]),
    [error, setError] = useState('');
  useEffect(() => {
    fetch('/demo/replays.json')
      .then((r) => r.json())
      .then(setDemos)
      .catch(() => setError('Example recordings unavailable.'));
  }, []);
  async function load(item) {
    try {
      const r = await fetch(item.path);
      if (!r.ok) throw Error();
      onRecording(await r.json());
    } catch {
      setError('Could not load this recording.');
    }
  }
  return (
    <div className="replay-library">
      <p>Play actions back in the Slack interface. No key, no new inference.</p>
      {error && <p role="alert">{error}</p>}
      <h3>Your recordings</h3>
      {saved.length ? (
        saved.map((s) => (
          <button className="replay-library-row" key={s.id} onClick={() => onSaved(s.id)}>
            <ModelMark id={s.run.episodes[0]?.cell.model.id} size={23} />
            <span>
              <b>{s.run.episodes[0]?.cell.model.id}</b>
              <small>
                {s.run.episodes[0]?.cell.taskId} · {new Date(s.capturedAt).toLocaleString()}
              </small>
            </span>
            <Play size={17} />
          </button>
        ))
      ) : (
        <p className="quiet-note">Your completed runs appear here.</p>
      )}
      <h3>Example recordings</h3>
      {demos.map((d) => (
        <button className="replay-library-row" key={d.path} onClick={() => load(d)}>
          <Film size={23} />
          <span>
            <b>{d.title}</b>
            <small>{d.kind}</small>
          </span>
          <Play size={17} />
        </button>
      ))}
    </div>
  );
}
