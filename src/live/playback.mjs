// Presentation timing never alters the recorded event timestamps or model latency.
export function episodeEvents(record, episodeId) {
  const events = record?.events?.filter((e) => e.episodeId === episodeId).map((e) => e.event);
  return events?.length
    ? events
    : (record?.audit?.episodes?.find((e) => e.episode.cell.episodeId === episodeId)?.trace ?? []);
}

export function playbackTimeline(frames, events, pacing = 'paced') {
  let end = 0;
  const segments = frames.map((frame, i) => {
    const recordedStart = Number.isFinite(frame.elapsedMs) ? frame.elapsedMs : i * 1500;
    const next = frames[i + 1]?.elapsedMs;
    const recordedDuration = Number.isFinite(next) ? Math.max(1, next - recordedStart) : 1500;
    const duration =
      pacing === 'recorded' ? recordedDuration : Math.max(800, Math.min(2000, recordedDuration));
    const start = end;
    end += duration;
    return { start, end, recordedStart, recordedDuration, duration };
  });
  const pointers = events
    .filter(
      (e) =>
        e.kind === 'pointer' &&
        e.pointer?.source === 'browser-event' &&
        Number.isFinite(e.elapsedMs) &&
        Number.isFinite(e.pointer.x) &&
        Number.isFinite(e.pointer.y),
    )
    .map((e) => {
      const s = segments.findLast((s) => s.recordedStart <= e.elapsedMs);
      if (!s) return null;
      return {
        ...e.pointer,
        sequence: e.sequence,
        time:
          s.start +
          Math.min(1, Math.max(0, (e.elapsedMs - s.recordedStart) / s.recordedDuration)) *
            s.duration,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.time - b.time);
  return { segments, pointers, duration: end };
}

export function playbackAt(timeline, time) {
  const index = Math.max(
    0,
    timeline.segments.findLastIndex((s) => s.start <= time),
  );
  const pointer = timeline.pointers.findLast((p) => p.time <= time) ?? null;
  return {
    index,
    pointer: pointer && time - pointer.time > 280 ? { ...pointer, type: 'pointermove' } : pointer,
  };
}

export function acceptFrame(previous, next) {
  if (!previous || previous.episodeId !== next.episodeId) return next;
  if (Number.isFinite(previous.sequence) && Number.isFinite(next.sequence))
    return next.sequence > previous.sequence ? next : previous;
  return next.at >= previous.at ? next : previous;
}
