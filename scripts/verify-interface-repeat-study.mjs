// Reopen immutable archives; recompute grades, accounting and public records.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { gzipSync } from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { buildAudit } from '../runner/audit.mjs';
import { assertSafeEvidence } from '../runner/export.mjs';
import { grade } from '../server/tasks.mjs';
import { trialAccounting, sumAccounting } from './lib/report-accounting.mjs';
import { campaignSummary } from './lib/campaign-report.mjs';
import { STUDY_ID, validatePlan, studySummary } from './lib/interface-repeat-study.mjs';
import { unresolvedUSD } from './lib/task-campaign-v2.mjs';
import { validateRecord } from '../docs/review-app/data.mjs';
import { compactImageInputs, expandImageInputs } from './lib/compact-image-inputs.mjs';

const sha = (v) => createHash('sha256').update(v).digest('hex');
const json = (path) => JSON.parse(readFileSync(path));
const runtime = `.runtime/${STUDY_ID}`,
  destination = `evidence/campaigns/${STUDY_ID}`;
const plan = validatePlan(json(`docs/campaigns/${STUDY_ID}.json`));
const manifest = json(`${runtime}/manifest.json`);
const throughArg = process.argv.find((a) => a.startsWith('--through='));
const through = throughArg ? Number(throughArg.split('=')[1]) : null;
if (through !== null) {
  assert.ok(Number.isInteger(through) && through > 0 && through <= manifest.phases.length);
  manifest.phases = manifest.phases.slice(0, through);
  assert.ok(
    manifest.phases.every((p) => p.safeToContinue && p.finishedAt),
    'Only a sealed terminal prefix can be published during collection.',
  );
} else
  assert.ok(!existsSync(`${runtime}/worker.lock`), 'Verify only at a stopped collection boundary.');
assert.equal(manifest.planHash, sha(readFileSync(`docs/campaigns/${STUDY_ID}.json`)));
const publish = process.argv.includes('--publish');
const reports = [],
  entries = [],
  costs = [],
  initial = new Map();
let checks = 0,
  gradeChecks = 0;
if (publish) mkdirSync('evidence/interface-repeat-trial-library', { recursive: true });
for (const phase of manifest.phases) {
  assert.match(phase.id, /^cell-\d{3}$/);
  assert.equal(phase.archive.path, `${phase.id}.tar.gz`);
  const archive = join(runtime, phase.archive.path),
    bytes = readFileSync(archive);
  assert.equal(sha(bytes), phase.archive.sha256);
  assert.equal(bytes.length, phase.archive.bytes);
  const names = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 10e6 })
    .trim()
    .split('\n');
  assert.ok(
    names.every((n) =>
      /^\.\/(?:run\.json|episode-\d{3}\/(?:[a-z0-9-]+\.(?:json|jsonl|png))?)?$/.test(n),
    ),
  );
  const types = execFileSync('tar', ['-tvzf', archive], { encoding: 'utf8', maxBuffer: 10e6 })
    .trim()
    .split('\n');
  assert.ok(types.every((line) => ['-', 'd'].includes(line[0])));
  const scratch = mkdtempSync(join(tmpdir(), 'relay-interface-verification-'));
  try {
    mkdirSync(join(scratch, phase.runId));
    execFileSync('tar', ['-xzf', archive, '-C', join(scratch, phase.runId)]);
    const audit = buildAudit({ runRoot: scratch, id: phase.runId });
    assert.equal(audit.integrity.status, 'verified');
    assert.deepEqual(audit.integrity.gaps, []);
    assert.equal(audit.run.sourceHash, manifest.sourceHash);
    assert.deepEqual(audit.run.config, phase.config);
    const e = audit.episodes[0],
      cell = e.episode.cell;
    assert.equal(audit.episodes.length, 1);
    const expected = plan.phases.find((p) => p.id === phase.id);
    assert.equal(cell.model.id, expected.models[0]);
    assert.equal(cell.taskId, expected.tasks[0]);
    assert.equal(cell.mode, expected.interfaces[0]);
    assert.equal(cell.seed, plan.seed);
    assert.equal(phase.repetition, expected.repetition);
    const stateHash = sha(JSON.stringify(e.initial.state));
    assert.equal(e.episode.initialHash, stateHash);
    if (initial.has(cell.taskId)) assert.equal(initial.get(cell.taskId), stateHash);
    else initial.set(cell.taskId, stateHash);
    const { revision, sessionId, ...savedGrade } = e.episode.evaluation;
    assert.deepEqual(grade(cell.taskId, cell.seed, e.outcome.state), savedGrade);
    assert.equal(revision, e.outcome.revision);
    checks += audit.integrity.checks.length;
    gradeChecks += e.episode.evaluation.checks.length;
    const traces = { [cell.episodeId]: e.trace };
    const report = {
      ...campaignSummary({ ...plan, phases: [expected], common: phase.config }, [
        { id: phase.id, run: audit.run, audit, traces },
      ]),
      phase: phase.id,
      reservedUSD: unresolvedUSD(e.trace),
    };
    const stored = json(`${runtime}/${phase.id}.report.json`);
    const { generatedAt: ignored, ...comparable } = report;
    const { generatedAt: ignoredStored, ...comparableStored } = stored;
    assert.deepEqual(comparable, comparableStored);
    reports.push(stored);
    const row = {
      ...report.rows[0],
      repetition: expected.repetition,
      originCampaign: STUDY_ID,
      cohort: 'fresh-repeated-interface-study',
    };
    const id = `${phase.runId}-${cell.episodeId}`;
    const selection = {
      kind: 'complete-structured-episode',
      trialId: id,
      originCampaign: STUDY_ID,
      phase: phase.id,
      originalRunId: phase.runId,
      episodeId: cell.episodeId,
      originalRunStatus: audit.run.status,
      archiveSha256: phase.archive.sha256,
      originalArchive: `evidence/campaigns/${STUDY_ID}/${phase.archive.path}`,
      originalArchivePublic: false,
      note: 'All recorded events, exact requests, externally visible responses, workspace states and outcome checks. Original PNG files remain in private archives; image hashes and image inputs remain in this structured projection. Playback uses the current renderer, not video.',
    };
    const run = { ...audit.run, selection };
    const record = {
      schema: 'relay-trial-record-v1',
      run,
      events: e.trace.map((event) => ({ episodeId: cell.episodeId, event })),
      artifacts: {},
      audit: {
        ...audit,
        run,
        generatedAt: audit.run.finishedAt,
        artifacts: audit.artifacts.map(({ href, ...a }) => a),
      },
      selection,
      capturedAt: audit.run.finishedAt,
    };
    if (cell.mode === 'pixels') {
      const encoded = compactImageInputs(e.inputs);
      assert.deepEqual(
        expandImageInputs(encoded.inputs, encoded.images),
        e.inputs,
        'Public image encoding is lossless.',
      );
      record.audit = { ...record.audit, episodes: [{ ...e, inputs: encoded.inputs }] };
      record.imageInputs = encoded.images;
      selection.inputEncoding = 'deduplicated-png-data-url-v1';
      selection.note +=
        ' Public pixel requests use lossless image references. Replace each image_url.relayImageRef with imageInputs[that hash] to recover the exact request object. SHA-256 hashes identify the complete original data URL string.';
    }
    costs.push({
      phase: phase.id,
      repetition: expected.repetition,
      task: cell.taskId,
      model: cell.model.id,
      interface: cell.mode,
      outcome: row.outcome,
      ...trialAccounting(record),
    });
    if (publish) {
      const text = JSON.stringify(record);
      assertSafeEvidence(text);
      const compressed = gzipSync(text, { level: 9 });
      const entry = {
        ...row,
        id,
        result: row,
        path: `/demo/trial-${id}.json.gz`,
        sha256: sha(compressed),
        bytes: compressed.length,
        jsonBytes: Buffer.byteLength(text),
        archiveSha256: phase.archive.sha256,
        eventCount: record.events.length,
      };
      validateRecord(record, entry);
      assert.ok(entry.jsonBytes <= 80e6 && entry.bytes <= 8e6, 'Public recording size bound.');
      const target = `evidence/interface-repeat-trial-library/trial-${id}.json.gz`;
      if (existsSync(target))
        assert.equal(sha(readFileSync(target)), entry.sha256, 'Published records are immutable.');
      else writeFileSync(target, compressed, { flag: 'wx' });
      entries.push(entry);
    }
  } finally {
    rmSync(scratch, { recursive: true });
  }
}
const rebuilt = studySummary(
  plan,
  reports,
  through === null ? manifest.status : 'partial-verified',
);
rebuilt.generatedAt = manifest.phases.at(-1).finishedAt;
const saved = through === null ? json(`${destination}/summary.json`) : rebuilt;
assert.deepEqual(saved.rows, rebuilt.rows);
assert.equal(saved.estimatedUSD, rebuilt.estimatedUSD);
const accounting = sumAccounting(costs);
assert.ok(Math.abs(accounting.recordedUSD - saved.estimatedUSD) < 1e-8);
assert.ok(Math.abs(accounting.reservedUSD - saved.reservedUSD) < 1e-8);
// Only a fully rechecked snapshot is eligible for the presentation builder.
writeFileSync(`${destination}/verified-summary.json`, JSON.stringify(saved, null, 2) + '\n');
writeFileSync(
  `${destination}/accounting.json`,
  JSON.stringify({ totals: accounting, rows: costs }, null, 2) + '\n',
);
const columns = [
  'phase',
  'repetition',
  'task',
  'model',
  'interface',
  'outcome',
  'requests',
  'receipts',
  'unknownRequests',
  'inputTokens',
  'outputTokens',
  'acceptedUSD',
  'reservedUSD',
  'recordedUSD',
];
writeFileSync(
  `${destination}/accounting.csv`,
  [columns.join(','), ...costs.map((row) => columns.map((k) => row[k]).join(','))].join('\n') +
    '\n',
);
const receipt = {
  status: saved.totals.attempted === plan.planned ? 'complete-verified' : 'partial-verified',
  attempted: saved.totals.attempted,
  planned: plan.planned,
  summaryHash: sha(readFileSync(`${destination}/verified-summary.json`)),
  sourceHash: manifest.sourceHash,
  checks,
  gradeChecks,
  accounting,
  totals: saved.totals,
};
writeFileSync(
  `${destination}/verification-public-${saved.totals.attempted}.json`,
  JSON.stringify(receipt, null, 2) + '\n',
);
if (publish) {
  const catalog = {
    schema: 'relay-trial-catalog-v1',
    campaign: STUDY_ID,
    summaryHash: receipt.summaryHash,
    sourceHash: manifest.sourceHash,
    generatedAt: saved.generatedAt,
    complete: saved.totals.attempted === plan.planned,
    planned: plan.planned,
    attempted: entries.length,
    totals: saved.totals,
    trials: entries,
  };
  assertSafeEvidence(JSON.stringify(catalog));
  writeFileSync(
    'evidence/interface-repeat-trial-library/catalog.json',
    JSON.stringify(catalog, null, 2) + '\n',
  );
}
console.log(JSON.stringify(receipt, null, 2));
