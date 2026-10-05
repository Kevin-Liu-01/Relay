// Observer/scheduler repair only. The actor, original worker and plan are frozen.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { sourceFingerprint } from '../../runner/experiment.mjs';
import { campaignSummary } from './campaign-report.mjs';
import { unresolvedUSD } from './task-campaign-v2.mjs';
import { STUDY_ID, cellConfig } from './interface-repeat-study.mjs';

export const COLLECTION_ID = `${STUDY_ID}-recovery`;
export const sha = (value) => createHash('sha256').update(value).digest('hex');
export const json = (path) => JSON.parse(readFileSync(path));
const files = (path) =>
  statSync(path).isDirectory()
    ? readdirSync(path)
        .sort()
        .flatMap((name) => files(join(path, name)))
    : [path];
const hashFiles = (root, names) =>
  sha(JSON.stringify(names.map((p) => [p, sha(readFileSync(join(root, p)))])));

export function recoveryBindings(root) {
  const original = json(join(root, '.runtime', STUDY_ID, 'manifest.json'));
  const oldWorkerHash = hashFiles(root, [
    'scripts/run-interface-repeat-study.mjs',
    'scripts/lib/interface-repeat-study.mjs',
    'scripts/lib/campaign-report.mjs',
    'scripts/lib/task-campaign-v2.mjs',
  ]);
  const result = {
    planHash: sha(readFileSync(join(root, 'docs/campaigns', `${STUDY_ID}.json`))),
    sourceHash: sourceFingerprint(root),
    buildHash: sha(
      JSON.stringify(
        files(join(root, 'dist')).map((p) => [p.slice(root.length), sha(readFileSync(p))]),
      ),
    ),
    originalWorkerHash: oldWorkerHash,
    originalManifestHash: sha(readFileSync(join(root, '.runtime', STUDY_ID, 'manifest.json'))),
    workerHash: hashFiles(root, [
      'scripts/run-interface-repeat-recovery.mjs',
      'scripts/recover-interface-repeat-first.mjs',
      'scripts/lib/interface-repeat-recovery.mjs',
      'scripts/lib/interface-repeat-study.mjs',
      'scripts/lib/campaign-report.mjs',
      'scripts/lib/task-campaign-v2.mjs',
    ]),
  };
  for (const key of ['planHash', 'sourceHash', 'buildHash'])
    assert.equal(result[key], original[key], `Original ${key} changed.`);
  assert.equal(oldWorkerHash, original.workerHash, 'Original collector changed.');
  return result;
}

export function summarizeCell(plan, phase, config, audit) {
  // Repetition labels belong to the study schedule, not the actor config.
  // Validate the exact original phase first; do not silently strip unknown fields.
  assert.deepEqual(
    phase,
    plan.phases.find((p) => p.id === phase.id),
  );
  assert.deepEqual(config, cellConfig(plan, phase, config.maxEstimatedUSD));
  assert.deepEqual(audit.run.config, config);
  assert.equal(audit.episodes.length, 1);
  const { repetition, ...reportPhase } = phase;
  const traces = Object.fromEntries(audit.episodes.map((e) => [e.episode.cell.episodeId, e.trace]));
  return {
    ...campaignSummary({ ...plan, phases: [reportPhase], common: config }, [
      { id: phase.id, run: audit.run, audit, traces },
    ]),
    phase: phase.id,
    reservedUSD: unresolvedUSD(audit.episodes[0].trace),
  };
}

export function assertContinuationPrefix(plan, manifest) {
  assert.ok(manifest.phases.length >= 1 && manifest.phases.length <= plan.planned);
  const runIds = new Set();
  for (const [i, entry] of manifest.phases.entries()) {
    assert.equal(entry.id, plan.phases[i].id, 'Never skip, repeat or reorder a cell.');
    assert.equal(entry.repetition, plan.phases[i].repetition);
    assert.ok(entry.safeToContinue && entry.finishedAt && entry.archive, 'Unsealed cell.');
    assert.ok(!runIds.has(entry.runId), 'Duplicate run.');
    runIds.add(entry.runId);
    assert.deepEqual(entry.config, cellConfig(plan, plan.phases[i], entry.config.maxEstimatedUSD));
  }
  assert.equal(manifest.phases[0].runId, 'f65e4b6f-d462-4d5c-986a-19e14d7ba8f8');
  assert.equal(manifest.createdAt, '2026-10-05T20:18:30.673Z', 'Do not reset the wall clock.');
}
