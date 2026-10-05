// Shared by the static reviewer, exporter and tests. No provider or history access.
import { episodeOutcome } from '../../shared/run-outcome.mjs';
export const catalogPath = '/demo/trial-catalog.json';
export const interfaceCatalogPath = '/demo/interface-trial-catalog.json';
export const taskCaveats = {
  'release-sync':
    'Task wording caveat: the channel reference ambiguously scopes the handoff location. Retain this raw outcome; do not treat it as a clean model-capability comparison.',
  'design-handoff':
    'Task wording caveat: the quoted messages contain DESIGN without an explicit substitution instruction, while the grader expects the approved design name. Several models copied the literal placeholder. Retain the raw outcome; do not attribute it solely to model capability.',
};
export const trialId = (row) => `${row.runId}-${row.episodeId}`;
export function reviewURL(row, view = 'trace') {
  if (row.outcome === 'unattempted' || !row.runId || !row.episodeId) return null;
  return `/demo/review.html?${new URLSearchParams({ trial: trialId(row), view })}`;
}
const validId = /^[a-f0-9-]{36}-episode-\d{3}$/;
const hash = /^[a-f0-9]{64}$/;
const fail = (ok, message) => {
  if (!ok) throw Error(message);
};
export function validateCatalog(catalog) {
  fail(catalog?.schema === 'relay-trial-catalog-v1', 'Unsupported trial catalog.');
  fail(Array.isArray(catalog.trials) && catalog.trials.length <= 1000, 'Invalid trial inventory.');
  fail(hash.test(catalog.summaryHash), 'Missing summary binding.');
  const ids = new Set(),
    cells = new Set();
  for (const item of catalog.trials) {
    fail(validId.test(item.id) && item.id === trialId(item), 'Invalid trial identity.');
    fail(!ids.has(item.id), 'Duplicate trial.');
    ids.add(item.id);
    fail(['a11y', 'json-ui', 'pixels', 'api'].includes(item.interface), 'Invalid interface.');
    const cell = `${item.model}/${item.task}/${item.seed}/${item.interface}`;
    fail(!cells.has(cell), 'Duplicate task/model/seed.');
    cells.add(cell);
    fail(['passed', 'incomplete', 'blocked'].includes(item.outcome), 'Invalid recorded outcome.');
    fail(item.path === `/demo/trial-${item.id}.json.gz`, 'Invalid recording path.');
    fail(hash.test(item.sha256) && hash.test(item.archiveSha256), 'Missing evidence hash.');
    fail(
      Number.isInteger(item.bytes) && item.bytes > 0 && item.bytes <= 8e6,
      'Invalid compressed size.',
    );
    fail(
      Number.isInteger(item.jsonBytes) && item.jsonBytes > 0 && item.jsonBytes <= 80e6,
      'Invalid recording size.',
    );
  }
  fail(catalog.trials.length === catalog.attempted, 'Catalog coverage mismatch.');
  fail(catalog.attempted <= catalog.planned, 'Invalid coverage counts.');
  if (catalog.complete) fail(catalog.attempted === catalog.planned, 'Incomplete release.');
  return catalog;
}
export function validateRecord(record, item) {
  fail(record?.schema === 'relay-trial-record-v1', 'Unsupported recording.');
  fail(
    record.selection?.trialId === item.id &&
      record.selection?.archiveSha256 === item.archiveSha256 &&
      record.selection?.originCampaign === item.originCampaign &&
      record.selection?.phase === item.phase,
    'Recording provenance mismatch.',
  );
  fail(
    record.run?.id === item.runId && record.run?.episodes?.length === 1,
    'Recording run mismatch.',
  );
  const episode = record.run.episodes[0],
    cell = episode.cell;
  fail(
    cell.episodeId === item.episodeId &&
      cell.model.id === item.model &&
      cell.taskId === item.task &&
      cell.seed === item.seed &&
      cell.mode === item.interface,
    'Recording cell mismatch.',
  );
  fail(
    record.audit?.integrity?.status === 'verified' && record.audit.episodes?.length === 1,
    'Unverified recording.',
  );
  fail(
    episodeOutcome(episode).kind === item.outcome && episode.status === item.status,
    'Recording outcome mismatch.',
  );
  fail(episode.steps === item.actionAttempts, 'Recording action count mismatch.');
  fail(
    episode.durationMs === item.durationMs &&
      episode.estimatedUSD === item.estimatedUSD &&
      episode.usageKnown === item.usageKnown,
    'Recording accounting mismatch.',
  );
  fail(
    JSON.stringify(record.audit.episodes[0].episode) === JSON.stringify(episode),
    'Audit episode mismatch.',
  );
  fail(
    Array.isArray(record.events) && record.events.every((e) => e.episodeId === item.episodeId),
    'Mixed episode events.',
  );
  fail(
    JSON.stringify(record.events.map((e) => e.event)) ===
      JSON.stringify(record.audit.episodes[0].trace),
    'Trace mismatch.',
  );
  return record;
}
async function boundedBytes(response, limit) {
  const reader = response.body.getReader(),
    chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > limit) {
        await reader.cancel();
        throw Error('Recording exceeds its size limit.');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
export async function loadRecord(item, signal) {
  // Validate even when called outside the app. Never fetch a path from the URL.
  validateCatalog({
    schema: 'relay-trial-catalog-v1',
    summaryHash: '0'.repeat(64),
    trials: [item],
    attempted: 1,
    planned: 1,
  });
  const response = await fetch(item.path, { signal });
  if (!response.ok) throw Error(`Recording unavailable (${response.status}).`);
  const compressed = await boundedBytes(response, item.bytes);
  fail(compressed.length === item.bytes, 'Recording is truncated.');
  const digest = [...new Uint8Array(await crypto.subtle.digest('SHA-256', compressed))]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  fail(digest === item.sha256, 'Recording hash mismatch. Playback blocked.');
  if (typeof DecompressionStream !== 'function')
    throw Error('This browser cannot open compressed recordings. Use a current browser.');
  const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'));
  const bytes = await boundedBytes(new Response(stream), item.jsonBytes);
  fail(bytes.length === item.jsonBytes, 'Recording size mismatch.');
  if (signal?.aborted) throw new DOMException('Cancelled', 'AbortError');
  return validateRecord(JSON.parse(new TextDecoder().decode(bytes)), item);
}
export function stateChanges(before, after, path = '', changes = []) {
  if (JSON.stringify(before) === JSON.stringify(after)) return changes;
  if (
    before &&
    after &&
    typeof before === 'object' &&
    typeof after === 'object' &&
    !Array.isArray(before) &&
    !Array.isArray(after)
  ) {
    for (const key of [...new Set([...Object.keys(before), ...Object.keys(after)])].sort())
      stateChanges(
        before[key],
        after[key],
        `${path}/${key.replaceAll('~', '~0').replaceAll('/', '~1')}`,
        changes,
      );
  } else
    changes.push({
      path: path || '/',
      beforeExists: before !== undefined,
      afterExists: after !== undefined,
      before: before ?? null,
      after: after ?? null,
    });
  return changes;
}
