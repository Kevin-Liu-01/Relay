import test from 'node:test';
import assert from 'node:assert/strict';
import { acceptFrame, playbackAt, playbackTimeline, episodeEvents } from '../src/live/playback.mjs';

test('replay uses recorded intervals and explicitly paced intervals, not fixed frame time', () => {
  const frames = [{ elapsedMs: 100 }, { elapsedMs: 10100 }, { elapsedMs: 10300 }];
  const events = [
    { kind: 'pointer', elapsedMs: 10150, pointer: { source: 'browser-event', x: 5, y: 10 } },
  ];
  const paced = playbackTimeline(frames, events);
  assert.deepEqual(
    paced.segments.map((s) => s.duration),
    [2000, 800, 1500],
  );
  assert.equal(playbackAt(paced, 2199).pointer, null);
  assert.equal(playbackAt(paced, 2200).pointer.x, 5);
  assert.equal(playbackAt(paced, 2800).index, 2);
  assert.equal(playbackAt(paced, 2800).pointer.type, 'pointermove');
  assert.equal(playbackAt(paced, 0).pointer, null); // Backward seek clears future cursor.
  assert.deepEqual(
    playbackTimeline(frames, events, 'recorded').segments.map((s) => s.duration),
    [10000, 200, 1500],
  );
});
test('stream discards late frames within an episode, accepts fresh episode sequence', () => {
  const current = { episodeId: 'a', sequence: 5, at: 500 };
  assert.equal(acceptFrame(current, { episodeId: 'a', sequence: 4, at: 600 }), current);
  assert.equal(acceptFrame(current, { episodeId: 'a', sequence: 5, at: 600 }), current);
  assert.equal(acceptFrame(current, { episodeId: 'b', sequence: 1 }).episodeId, 'b');
});
test('legacy captures have no invented cursor events; audit-only recordings work', () => {
  assert.deepEqual(playbackTimeline([{}, {}], []).pointers, []);
  const trace = [{ kind: 'observation' }];
  assert.deepEqual(
    episodeEvents(
      { events: [], audit: { episodes: [{ episode: { cell: { episodeId: 'a' } }, trace }] } },
      'a',
    ),
    trace,
  );
});
