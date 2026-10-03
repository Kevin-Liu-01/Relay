import React, { useEffect, useMemo, useRef, useState } from 'react';
import { episodeOutcome } from '../../shared/run-outcome.mjs';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Film,
  Layers,
  Gauge,
  FastForward,
  Maximize2,
  Minimize2,
  Clock3,
} from 'lucide-react';
import { ModelMark } from '../lab/model-mark.jsx';
import { describeAction } from './feedback.jsx';
import { RelaySelect } from './select.jsx';
import { ModeIcon } from './select-icons.jsx';
import { episodeEvents, playbackTimeline, playbackAt } from './playback.mjs';
import { AgentCursor } from './workspace-view.jsx';

export function replayFrames(record, episodeId) {
  const e = record?.audit?.episodes?.find((x) => x.episode.cell.episodeId === episodeId);
  const events = episodeEvents(record, episodeId);
  const steps = events.filter((x) => x.kind === 'step');
  const recorded = events
    .filter((x) => x.replay?.version === 1)
    .map((x) => ({
      snapshot: x.replay,
      elapsedMs: x.elapsedMs,
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
export function WorkspaceReplay({
  frame,
  pointer,
  recordedPointer = false,
  smooth = false,
  title = 'Recorded Slack workspace',
}) {
  const outer = useRef(null),
    iframe = useRef(null);
  const [width, setWidth] = useState(900),
    [ready, setReady] = useState(false);
  const snapshot = frame?.snapshot;
  const latestSnapshot = useRef(snapshot);
  latestSnapshot.current = snapshot;
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
      ) {
        setReady(true);
        // iframe load can precede its React message listener. Readiness must
        // resend the newest seek even when onLoad already set ready=true.
        if (latestSnapshot.current)
          iframe.current.contentWindow.postMessage(
            { type: 'relay-replay', snapshot: latestSnapshot.current },
            location.origin,
          );
      }
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
      <AgentCursor
        point={recordedPointer ? pointer : point}
        viewport={viewport}
        smooth={smooth && recordedPointer}
        target={!recordedPointer}
      />
      <span className="replay-safety">
        <Layers size={12} /> {frame?.fidelity ?? 'No capture'} · read-only
        {recordedPointer
          ? ' · recorded cursor, smoothed motion'
          : point
            ? ' · target, not cursor'
            : ''}
      </span>
    </div>
  );
}
export function ReplayPlayer({ record }) {
  const [eid, setEid] = useState(record.run.episodes[0].cell.episodeId),
    [time, setTime] = useState(0),
    [playing, setPlaying] = useState(false),
    [speed, setSpeed] = useState(1),
    [pacing, setPacing] = useState('paced'),
    [focus, setFocus] = useState(false);
  const clock = useRef(0);
  const frames = useMemo(() => replayFrames(record, eid), [record, eid]);
  const timeline = useMemo(
    () => playbackTimeline(frames, episodeEvents(record, eid), pacing),
    [frames, record, eid, pacing],
  );
  const { index, pointer } = playbackAt(timeline, time);
  const episode = record.run.episodes.find((e) => e.cell.episodeId === eid);
  useEffect(() => {
    setTime(0);
    clock.current = 0;
    setPlaying(false);
  }, [eid, pacing]);
  useEffect(() => {
    if (!playing) return;
    let raf,
      last = performance.now();
    const tick = (now) => {
      clock.current = Math.min(timeline.duration, clock.current + (now - last) * speed);
      last = now;
      setTime(clock.current);
      if (clock.current >= timeline.duration) setPlaying(false);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, timeline]);
  useEffect(() => {
    const pause = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', pause);
    const media = matchMedia('(prefers-reduced-motion: reduce)');
    const reduce = () => {
      if (media.matches) setPlaying(false);
    };
    media.addEventListener('change', reduce);
    return () => {
      document.removeEventListener('visibilitychange', pause);
      media.removeEventListener('change', reduce);
    };
  }, []);
  const frame = frames[index];
  const seek = (i) => {
    setPlaying(false);
    const position = timeline.segments[Math.max(0, Math.min(frames.length - 1, i))]?.start ?? 0;
    clock.current = position;
    setTime(position);
  };
  return (
    <div className="replay-player" data-focus={focus}>
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
        <RelaySelect
          label="Replay episode"
          value={eid}
          onChange={setEid}
          options={record.run.episodes.map((e) => ({
            value: e.cell.episodeId,
            label: `${e.cell.episodeId} · ${e.cell.mode}`,
            icon: <ModeIcon mode={e.cell.mode} />,
          }))}
        />
      </div>
      <WorkspaceReplay
        key={`${eid}/${frame?.snapshot ? 'ui' : 'image'}`}
        frame={frame}
        pointer={pointer}
        recordedPointer={timeline.pointers.length > 0}
        smooth={playing}
      />
      <div className="replay-action">
        <span>{frame?.label ?? 'No frames'}</span>
        <strong>
          {frame?.step
            ? describeAction(frame.step.action, frame.step.observation)
            : index === frames.length - 1
              ? episodeOutcome(episode).title
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
            if (!playing && index === frames.length - 1) {
              clock.current = 0;
              setTime(0);
            }
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
        <RelaySelect
          label="Playback speed"
          value={speed}
          onChange={(value) => setSpeed(Number(value))}
          options={[
            { value: 0.5, label: '0.5×', icon: <Gauge size={16} /> },
            { value: 1, label: '1×', icon: <Play size={16} /> },
            { value: 2, label: '2×', icon: <FastForward size={16} /> },
          ]}
        />
        <button
          aria-label={focus ? 'Exit replay focus' : 'Expand replay'}
          aria-pressed={focus}
          onClick={() => setFocus(!focus)}
        >
          {focus ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
        </button>
      </div>
      <div className="replay-timing">
        <RelaySelect
          label="Playback timing"
          value={pacing}
          onChange={setPacing}
          options={[
            { value: 'paced', label: 'Smart pace', icon: <FastForward size={14} /> },
            { value: 'recorded', label: 'Recorded timing', icon: <Clock3 size={14} /> },
          ]}
        />
        <span>
          {pacing === 'paced'
            ? 'Long waits shortened · fast steps slowed for readability'
            : frames.every((f) => Number.isFinite(f.elapsedMs))
              ? 'Original capture intervals · final hold 1.5s'
              : 'Timing not recorded · 1.5s per capture'}
        </span>
        <span className="numeric">
          {(time / 1000).toFixed(1)} / {(timeline.duration / 1000).toFixed(1)}s
        </span>
      </div>
    </div>
  );
}
export function ReplayLibrary({ saved, onSaved, onRecording }) {
  const [demos, setDemos] = useState([]),
    [error, setError] = useState(''),
    [loading, setLoading] = useState(null);
  const loadVersion = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/demo/replays.json', { signal: controller.signal })
      .then((r) => r.json())
      .then(setDemos)
      .catch(() => {
        if (!controller.signal.aborted) setError('Example recordings unavailable.');
      });
    return () => {
      controller.abort();
      loadVersion.current++;
    };
  }, []);
  async function load(item) {
    const version = ++loadVersion.current;
    setLoading(item.path);
    try {
      const r = await fetch(item.path);
      if (!r.ok) throw Error();
      const record = await r.json();
      if (version === loadVersion.current) onRecording(record);
    } catch {
      if (version === loadVersion.current) setError('Could not load this recording.');
    } finally {
      if (version === loadVersion.current) setLoading(null);
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
        <button
          className="replay-library-row"
          key={d.path}
          onClick={() => load(d)}
          disabled={!!loading}
          aria-busy={loading === d.path}
        >
          <Film size={23} />
          <span>
            <b>{d.title}</b>
            <small>{loading === d.path ? 'Loading recording…' : d.kind}</small>
          </span>
          <Play size={17} />
        </button>
      ))}
    </div>
  );
}
