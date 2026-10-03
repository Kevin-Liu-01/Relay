// Read-only evidence verification. No inference, repair, retry or historical rewrite.
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { buildAudit } from '../runner/audit.mjs';
import { sourceFingerprint } from '../runner/experiment.mjs';
import { grade } from '../server/tasks.mjs';
import { digest } from '../server/domain.mjs';
import {
  blockReport,
  taskCampaignSummary as originalSummary,
  validateTaskPlan as validateOriginal,
  TASK_CAMPAIGN_ID,
} from './lib/breadth-campaign.mjs';
import * as continuation from './lib/breadth-continuation.mjs';
import {
  verifyCoverage,
  verifyRebuiltSummary,
  verifyAppProvenance,
} from './lib/coverage-verification.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const partial = process.argv.includes('--partial');
const positional = process.argv.slice(2).filter((a) => a !== '--partial');
assert.ok(
  positional.length <= 1 &&
    positional.every((a) => [TASK_CAMPAIGN_ID, continuation.TASK_CAMPAIGN_ID].includes(a)),
  'Use a known campaign ID and optional --partial',
);
const json = (p) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const comparable = ({ generatedAt, sourceHash, planHash, ...rest }) => rest;
const campaign = positional[0] ?? TASK_CAMPAIGN_ID;
const validateTaskPlan =
  campaign === TASK_CAMPAIGN_ID ? validateOriginal : continuation.validateTaskPlan;
const taskCampaignSummary =
  campaign === TASK_CAMPAIGN_ID ? originalSummary : continuation.taskCampaignSummary;
const publicRoot = `evidence/campaigns/${campaign}`;
const planPath = `docs/campaigns/${campaign}.json`;
const planBytes = readFileSync(join(root, planPath));
const plan = validateTaskPlan(JSON.parse(planBytes));
// All following work is bound to this atomic summary snapshot, not an in-flight run.
const summaryBytes = readFileSync(join(root, publicRoot, 'summary.json'));
const summary = JSON.parse(summaryBytes);
const coverage = verifyCoverage(plan, summary, { allowPartial: partial });
const manifest = json(`${publicRoot}/manifest.json`);
assert.equal(summary.planHash, sha(planBytes), 'Frozen plan binding');
assert.equal(summary.sourceHash, plan.sourceHash, 'Frozen source binding');
assert.equal(sourceFingerprint(root), plan.sourceHash, 'Grader and harness source unchanged');
assert.equal(manifest.planHash, summary.planHash);
assert.equal(manifest.sourceHash, summary.sourceHash);
if (!partial) {
  assert.equal(manifest.status, 'completed');
  assert.equal(manifest.phases.length, plan.phases.length);
}
for (const prior of plan.priorCampaigns) {
  const path = prior.path ?? `evidence/campaigns/${prior.id}/summary.json`;
  const bytes = readFileSync(join(root, path));
  assert.equal(sha(bytes), prior.summaryHash, 'Prior ledger hash');
  assert.equal(JSON.parse(bytes).estimatedUSD, prior.recordedUSD, 'Prior allowance retained');
}
const oldSummary = json(`evidence/campaigns/${plan.carryover.id}/summary.json`);
assert.deepEqual(
  plan.carryoverRows,
  oldSummary.rows
    .filter((r) => r.outcome !== 'unattempted')
    .map((r) => ({ ...r, originCampaign: r.originCampaign ?? oldSummary.id, cohort: 'preserved' })),
);
const reports = summary.phases.map((p) => json(`.runtime/${campaign}/${p.id}.report.json`));
const rebuilt = taskCampaignSummary(plan, reports, summary.status);
// The frozen worker records a between-cell failure in its private manifest and
// public summary, while the public manifest remains the last completed-block
// snapshot. Check that exact private diagnostic without repairing either file.
let diagnosticManifest = manifest;
if (summary.workerError !== undefined) {
  diagnosticManifest = json(`.runtime/${campaign}/manifest.json`);
  for (const key of ['id', 'planHash', 'sourceHash', 'launcherHash'])
    assert.equal(diagnosticManifest[key], manifest[key], 'Diagnostic manifest binding');
  assert.deepEqual(diagnosticManifest.phases, manifest.phases, 'No hidden in-flight attempt');
}
verifyRebuiltSummary(summary, rebuilt, diagnosticManifest);

const origins = [
  ...new Set(summary.rows.filter((r) => r.outcome !== 'unattempted').map((r) => r.originCampaign)),
];
const groups = origins.map((id) => {
  assert.ok(['all-tasks-2026-10-03', TASK_CAMPAIGN_ID, continuation.TASK_CAMPAIGN_ID].includes(id));
  const originManifest =
    id === campaign ? manifest : json(`evidence/campaigns/${id}/manifest.json`);
  const originPlanBytes = readFileSync(join(root, `docs/campaigns/${id}.json`));
  assert.equal(sha(originPlanBytes), originManifest.planHash, 'Original plan binding');
  const rows = summary.rows.filter((r) => r.originCampaign === id && r.outcome !== 'unattempted');
  const phases = originManifest.phases.filter((p) =>
    rows.some((r) => r.phase === p.id && r.runId === p.runId),
  );
  return { id, manifest: originManifest, plan: JSON.parse(originPlanBytes), rows, phases };
});
const archives = [];
const verifiedCells = new Set();
let appProvenance;
for (const group of groups) {
  for (const selected of group.phases) {
    const entry = group.manifest.phases.find((p) => p.id === selected.id);
    assert.ok(entry?.archive && /^block-\d{3}$/.test(entry.id));
    assert.ok(/^[a-f0-9-]{36}$/.test(entry.runId));
    assert.equal(entry.archive.path, `${entry.id}.tar.gz`);
    const publicArchive = join(root, 'evidence/campaigns', group.id, entry.archive.path);
    const archive = existsSync(publicArchive)
      ? publicArchive
      : join(root, '.runtime', group.id, entry.archive.path);
    const bytes = readFileSync(archive);
    assert.equal(bytes.length, entry.archive.bytes, 'Original archive size');
    assert.equal(sha(bytes), entry.archive.sha256, 'Original archive hash');
    const names = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 10e6 })
      .trim()
      .split('\n');
    assert.ok(
      names.every((n) =>
        /^\.\/(?:run\.json|episode-\d{3}\/(?:[a-z0-9-]+\.(?:json|jsonl|png))?)?$/.test(n),
      ),
      'Safe archive names',
    );
    // Reject links/devices before extraction, not just during the audit scan.
    const details = execFileSync('tar', ['-tvzf', archive], { encoding: 'utf8', maxBuffer: 10e6 })
      .trim()
      .split('\n');
    assert.ok(
      details.every((line) => ['-', 'd'].includes(line[0])),
      'Regular files/directories only',
    );
    const scratch = mkdtempSync(join(tmpdir(), 'relay-completion-audit-'));
    try {
      mkdirSync(join(scratch, entry.runId));
      execFileSync('tar', ['-xzf', archive, '-C', join(scratch, entry.runId)]);
      const audit = buildAudit({ runRoot: scratch, id: entry.runId });
      assert.equal(audit.integrity.status, 'verified', `${group.id}/${entry.id}: original audit`);
      assert.deepEqual(audit.integrity.gaps, []);
      assert.equal(audit.run.sourceHash, plan.sourceHash);
      assert.deepEqual(audit.run.config, entry.config, 'Recorded configuration');
      const phase = group.plan.phases.find((p) => p.id === entry.id);
      const traces = Object.fromEntries(
        audit.episodes.map((e) => [e.episode.cell.episodeId, e.trace]),
      );
      const report = blockReport(group.plan, phase, audit.run, audit, traces);
      if (group.id === campaign) {
        const saved = reports.find((r) => r.phase === phase.id);
        const { archive: ignoredArchive, safeToContinue, ...stored } = saved;
        assert.deepEqual(
          comparable(stored),
          comparable(report),
          'Block report rebuilds from original archive',
        );
        if (!partial) assert.equal(safeToContinue, true, 'No unsafe phase admitted as complete');
        if (safeToContinue && audit.run.status !== 'completed') {
          assert.equal(
            group.id,
            continuation.TASK_CAMPAIGN_ID,
            'Only the recorded continuation may advance past a cell spend stop',
          );
          assert.equal(
            continuation.acceptedCellSpendLimit(entry.config, audit.run, traces),
            true,
            'Independently recheck the known-use cell-spend boundary',
          );
        }
        assert.deepEqual(saved.archive, entry.archive);
      }
      let attempts = 0,
        gradeChecks = 0;
      for (const episode of audit.episodes) {
        const e = episode.episode;
        if (e.status === 'queued') continue;
        appProvenance = verifyAppProvenance(appProvenance, e.appProvenance);
        assert.deepEqual(
          episode.trace.find((event) => event.kind === 'episode_started')?.appProvenance,
          e.appProvenance,
          'Served-app receipt matches the hashed event',
        );
        const cell = `${e.cell.model.id}/${e.cell.taskId}/${e.cell.seed}`;
        assert.ok(!verifiedCells.has(cell), 'Never audit duplicate attempts as new coverage');
        verifiedCells.add(cell);
        const row = group.rows.find(
          (r) => r.runId === entry.runId && r.episodeId === e.cell.episodeId,
        );
        assert.ok(row, 'Every attempted episode appears in the comparison');
        const { originCampaign, cohort, ...recorded } = row;
        assert.deepEqual(
          recorded,
          report.rows.find((r) => r.episodeId === e.cell.episodeId),
          'Displayed result derives from trace',
        );
        assert.equal(
          digest(episode.initial.state),
          plan.initialHashes[e.cell.taskId],
          'Matched initial workspace',
        );
        const regraded = grade(e.cell.taskId, e.cell.seed, episode.outcome.state);
        for (const [key, value] of Object.entries(regraded)) {
          assert.deepEqual(
            episode.outcome.evaluation[key],
            value,
            `Saved-state grader agreement: ${key}`,
          );
          assert.deepEqual(e.evaluation[key], value, `Episode grader agreement: ${key}`);
        }
        gradeChecks += regraded.checks.length;
        attempts++;
      }
      archives.push({
        campaign: group.id,
        phase: entry.id,
        runId: entry.runId,
        sha256: entry.archive.sha256,
        attempts,
        auditChecks: audit.integrity.checks.length,
        gradeChecks,
        integrity: 'verified',
        gradeAgreement: true,
      });
    } finally {
      rmSync(scratch, { recursive: true, force: true });
    }
    if (archives.length % 25 === 0)
      console.log(
        JSON.stringify({ archivesVerified: archives.length, attemptsVerified: verifiedCells.size }),
      );
  }
}
assert.equal(
  verifiedCells.size,
  summary.totals.attempted,
  'All attempted cells independently reopened',
);
assert.equal(
  archives.reduce((n, a) => n + a.auditChecks, 0),
  summary.auditChecks,
  'Audit total',
);
const result = {
  schema: 'relay-coverage-verification-v1',
  generatedAt: new Date().toISOString(),
  campaign,
  status: coverage.complete ? 'complete-verified' : 'partial-verified',
  summaryHash: sha(summaryBytes),
  planHash: summary.planHash,
  sourceHash: summary.sourceHash,
  appProvenance,
  coverage,
  archivesVerified: archives.length,
  attemptsVerified: verifiedCells.size,
  auditChecks: summary.auditChecks,
  gradeChecks: archives.reduce((n, a) => n + a.gradeChecks, 0),
  gradeAgreement: true,
  recordedTotalUSD: summary.recordedTotalUSD,
  unresolvedSelectedUSD: summary.selectionReservedUSD,
  scope:
    'Read-only archive hashes, request/trace/artifact integrity, exact summary reconstruction, and deterministic regrading of saved final states. Local consistency, not independent attestation or model reliability.',
  archives,
};
if (!partial) {
  assert.equal(
    sha(readFileSync(join(root, publicRoot, 'summary.json'))),
    result.summaryHash,
    'Summary unchanged before publication',
  );
  writeFileSync(
    join(root, publicRoot, 'verification.json'),
    JSON.stringify(result, null, 2) + '\n',
  );
}
const { archives: omitted, ...compact } = result;
console.log(JSON.stringify(compact, null, 2));
