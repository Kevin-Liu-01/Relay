import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { gunzipSync, gzipSync } from 'node:zlib';
import {
  trialId,
  reviewURL,
  validateCatalog,
  validateRecord,
  loadRecord,
  stateChanges,
} from '../docs/review-app/data.mjs';
import { assertSafeEvidence } from '../runner/export.mjs';
import { comparisonSlide } from '../scripts/lib/comparison-slide.mjs';
const catalog = JSON.parse(readFileSync('evidence/trial-library/catalog.json'));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const read = (item) => readFileSync(`evidence/trial-library/${item.path.split('/').at(-1)}`);
const record = (item) => JSON.parse(gunzipSync(read(item)));
const summary = JSON.parse(readFileSync(`evidence/campaigns/${catalog.campaign}/summary.json`));

test('public library preserves every published outcome and binds original archive hashes', () => {
  validateCatalog(catalog);
  for (const item of catalog.trials) {
    const row = summary.rows.find((r) => trialId(r) === item.id);
    assert.deepEqual(item.result, row);
    const manifest = JSON.parse(
      readFileSync(`evidence/campaigns/${item.originCampaign}/manifest.json`),
    );
    assert.equal(
      item.archiveSha256,
      manifest.phases.find((p) => p.id === item.phase).archive.sha256,
    );
  }
  assert.equal(
    readdirSync('evidence/trial-library').filter((p) => p.endsWith('.json.gz')).length,
    catalog.attempted,
  );
  if (summary.status === 'completed') {
    assert.equal(catalog.complete, true);
    assert.equal(catalog.attempted, summary.totals.planned);
    assert.equal(
      catalog.summaryHash,
      sha(readFileSync(`evidence/campaigns/${catalog.campaign}/summary.json`)),
    );
  }
});
test('a matched catalog distinguishes interfaces without allowing duplicate cells', () => {
  const first = structuredClone(catalog.trials[0]);
  const second = { ...first, interface: 'pixels', runId: '11111111-1111-4111-8111-111111111111' };
  second.id = trialId(second);
  second.path = `/demo/trial-${second.id}.json.gz`;
  const matched = { ...catalog, complete: true, planned: 2, attempted: 2, trials: [first, second] };
  assert.equal(validateCatalog(matched).trials.length, 2);
  second.interface = first.interface;
  assert.throws(() => validateCatalog(matched), /Duplicate/);
});
test('every public recording is readable, secret-screened, byte-bound and preserves the complete event chain', () => {
  for (const item of catalog.trials) {
    const bytes = read(item);
    assert.equal(bytes.length, item.bytes);
    assert.equal(sha(bytes), item.sha256);
    const text = gunzipSync(bytes, { maxOutputLength: 80e6 }).toString('utf8');
    assert.equal(Buffer.byteLength(text), item.jsonBytes);
    assertSafeEvidence(text, [process.env.RAMP_ROUTER_API_KEY, process.env.TYPESAFE_API_KEY]);
    const data = validateRecord(JSON.parse(text), item);
    assert.equal(data.run.sourceHash, catalog.sourceHash);
    assert.deepEqual(data.artifacts, {}, 'No screenshot bytes are silently substituted');
    let previous = '0'.repeat(64);
    for (const { event } of data.events) {
      if (event.replay) {
        const snapshot = event.replay,
          state = snapshot.data?.state;
        assert.equal(snapshot.version, 1);
        assert.ok(state?.users?.some((u) => u.id === state.currentUserId));
        assert.ok(state.channels?.length && Array.isArray(state.messages));
        assert.ok(snapshot.viewport.width > 0 && snapshot.viewport.height > 0);
      }
      const { hash, ...body } = event;
      assert.equal(event.previousHash, previous);
      assert.equal(sha(JSON.stringify(body)), hash);
      previous = hash;
      if (event.kind === 'input') {
        const input = data.audit.episodes[0].inputs[event.requestFile];
        assert.ok(input, 'Exact request bodies are public for every recorded input');
        assert.equal(sha(JSON.stringify(input)), event.requestHash);
      }
    }
    assert.equal(previous, data.run.episodes[0].traceRoot);
  }
});
test('catalog rejects duplicate cells, outside URLs, unattempted records and size bombs', () => {
  const fresh = () => structuredClone(catalog);
  for (const mutate of [
    (c) => c.trials.push(c.trials[0]),
    (c) => {
      c.trials[0].path = 'https://outside.invalid/record';
    },
    (c) => {
      c.trials[0].outcome = 'unattempted';
    },
    (c) => {
      c.trials[0].jsonBytes = 90e6;
    },
    (c) => {
      c.trials[0].bytes = 9e6;
    },
    (c) => {
      c.trials[0].id = '../../private';
    },
  ]) {
    const c = fresh();
    mutate(c);
    assert.throws(() => validateCatalog(c));
  }
});
test('a blocked diagnostic pass cannot be displayed as a completed pass', () => {
  const item = catalog.trials.find((r) => r.outcome === 'blocked' && r.diagnosticSuccess);
  assert.ok(item);
  const data = record(item);
  validateRecord(data, item);
  assert.throws(() => validateRecord(data, { ...item, outcome: 'passed' }), /outcome/);
  assert.throws(() => validateRecord(data, { ...item, estimatedUSD: -1 }), /accounting/);
  assert.throws(() => validateRecord(data, { ...item, interface: 'api' }), /cell/);
  assert.throws(() => validateRecord(data, { ...item, phase: 'block-000' }), /provenance/);
  const tamperedAudit = structuredClone(data);
  tamperedAudit.audit.episodes[0].episode.evaluation.success = false;
  assert.throws(() => validateRecord(tamperedAudit, item), /Audit episode/);
  data.events.pop();
  assert.throws(() => validateRecord(data, item), /Trace mismatch/);
});
test('links cover every exported trial, never unattempted cells; HTML remains escaped', () => {
  const ids = new Set(catalog.trials.map((r) => r.id));
  const slide = comparisonSlide(summary, {}, ids);
  assert.equal(
    (slide.COMPARISON_TRIALS.match(/>Review trace ↗</g) ?? []).length,
    catalog.attempted,
  );
  assert.equal(
    (slide.COMPARISON_TRIALS.match(/>Watch replay ↗</g) ?? []).length,
    catalog.attempted,
  );
  assert.equal(reviewURL({ outcome: 'unattempted' }), null);
  const url = new URL(reviewURL(catalog.trials[0]), 'https://relay.kevinliu.studio');
  assert.equal(url.searchParams.get('trial'), catalog.trials[0].id);
  const poisoned = structuredClone(summary);
  poisoned.rows[0].error = '<script>alert(1)</script>';
  assert.doesNotMatch(comparisonSlide(poisoned, {}, ids).COMPARISON_TRIALS, /<script>/);
});
test('loader verifies bytes before playback, rejects tampering, and never accepts URL paths', async (t) => {
  const item = catalog.trials[0],
    bytes = read(item),
    requests = [];
  t.mock.method(globalThis, 'fetch', async (path) => {
    requests.push(path);
    return new Response(bytes);
  });
  const loaded = await loadRecord(item);
  assert.equal(loaded.selection.trialId, item.id);
  assert.deepEqual(requests, [item.path]);
  await assert.rejects(loadRecord({ ...item, sha256: '0'.repeat(64) }), /hash mismatch/);
  await assert.rejects(loadRecord({ ...item, path: '/api/relay' }), /path/);
  await assert.rejects(loadRecord({ ...item, bytes: 1 }), /size limit/);
  const controller = new AbortController();
  controller.abort();
  await assert.rejects(loadRecord(item, controller.signal), /Cancelled/);
});
test('structured diffs preserve additions, removals, arrays and JSON-pointer escaping', () => {
  assert.deepEqual(stateChanges({ a: 1 }, { a: 1 }), []);
  const diff = stateChanges(
    { 'a/b~': { value: 1 }, removed: null, rows: [1] },
    { 'a/b~': { value: 2 }, added: null, rows: [2] },
  );
  assert.deepEqual(
    diff.map((c) => c.path),
    ['/a~1b~0/value', '/added', '/removed', '/rows'],
  );
  assert.equal(diff[1].beforeExists, false);
  assert.equal(diff[2].afterExists, false);
});
test('compressed evidence is screened after decompression, not just by file suffix', () => {
  const bytes = gzipSync(JSON.stringify({ secret: 'sk-' + 'routgw-' + 'example'.repeat(6) }));
  assert.throws(() => assertSafeEvidence(gunzipSync(bytes).toString('utf8')), /export blocked/);
});
