// Separate, user-authorized study. Historical plans, grades and builds stay untouched.
import assert from 'node:assert/strict';
import {
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  rmSync,
  rmdirSync,
  readdirSync,
  statSync,
  statfsSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { once } from 'node:events';
import { randomBytes, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createServers } from '../server/server.mjs';
import { Experiment, atomicJSON, sourceFingerprint } from '../runner/experiment.mjs';
import { RampRouter, catalogModel } from '../runner/router.mjs';
import { buildAudit } from '../runner/audit.mjs';
import { exportRun, assertSafeEvidence } from '../runner/export.mjs';
import {
  retainedRequestTimeout,
  acceptedOutputLimit,
  retainedConnectionFailure,
  acceptedEpisodeDeadline,
} from '../runner/campaign-policy.mjs';
import { summarizeCell } from './lib/interface-repeat-recovery.mjs';
import {
  COLLECTION_ID, PRIOR_ID, CARRIED_CELLS,
  continuationBindings, assertContinuationPrefix,
} from './lib/interface-repeat-continuation.mjs';
import { unresolvedUSD } from './lib/task-campaign-v2.mjs';
import {
  STUDY_ID,
  MODELS,
  createPlan,
  validatePlan,
  cellConfig,
  remainingAllowance,
  studySummary,
} from './lib/interface-repeat-study.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
const runtime = join(root, '.runtime', COLLECTION_ID),
  runRoot = join(runtime, 'runs');
const destination = join(root, 'evidence/campaigns', COLLECTION_ID);
const planPath = join(root, 'docs/campaigns', `${STUDY_ID}.json`);
const manifestPath = join(runtime, 'manifest.json');
const json = (path) => JSON.parse(readFileSync(path));
const files = (path) =>
  statSync(path).isDirectory()
    ? readdirSync(path)
        .sort()
        .flatMap((p) => files(join(path, p)))
    : [path];
const bindings = () => continuationBindings(root);
const [command = 'status'] = process.argv.slice(2);
if (command === 'status') {
  console.log(
    JSON.stringify(
      existsSync(join(destination, 'summary.json'))
        ? json(join(destination, 'summary.json'))
        : { status: 'not-started' },
    ),
  );
} else {
  assert.ok(
    command === 'bulk',
    'Use bulk --authorized-continuation or status.',
  );
  const plan = validatePlan(json(planPath));
  mkdirSync(runtime, { recursive: true, mode: 0o700 });
  mkdirSync(destination, { recursive: true });
  for (const directory of readdirSync(join(root, '.runtime'))) {
    assert.ok(
      !existsSync(join(root, '.runtime', directory, 'worker.lock')),
      'Another campaign lock exists; do not overlap collectors.',
    );
  }
  const lock = join(runtime, 'worker.lock');
  mkdirSync(lock); // Never steal a lock or restart an in-flight cell.
  writeFileSync(join(lock, 'pid'), String(process.pid));
  let manifest,
    experiment,
    cancelled = false;
  const cancel = () => {
    cancelled = true;
    experiment?.cancel();
  };
  process.on('SIGINT', cancel);
  process.on('SIGTERM', cancel);
  try {
    const frozen = bindings();
    assert.ok(existsSync(manifestPath), 'Prepare the authorized ten-cell carry-forward once.');
    manifest = json(manifestPath);
    assertContinuationPrefix(plan, manifest, json(join(root, '.runtime', PRIOR_ID, 'manifest.json')));
    for (const [key, value] of Object.entries(frozen))
      assert.equal(manifest[key], value, `Frozen ${key} changed.`);
    assert.equal(manifest.status, 'prepared', 'No automatic restart after an unexpected stop.');
    assert.equal(manifest.phases.length, CARRIED_CELLS, 'This continuation is single-use.');
    assert.ok(process.argv.includes('--authorized-continuation'), 'Explicit continuation required.');
    const reports = manifest.phases.map((p) => json(join(runtime, `${p.id}.report.json`)));
    const save = (status) => {
      manifest.status = status;
      atomicJSON(manifestPath, manifest);
      const summary = studySummary(plan, reports, status);
      for (const [name, data] of [
        ['manifest.json', manifest],
        ['summary.json', summary],
      ]) {
        assertSafeEvidence(JSON.stringify(data), [process.env.RAMP_ROUTER_API_KEY]);
        atomicJSON(join(destination, name), data);
      }
      return summary;
    };
    save('running');
    const end = plan.phases.length;
    for (let i = manifest.phases.length; i < end && !cancelled; i++) {
      assert.deepEqual(bindings(), frozen, 'Frozen study inputs changed.');
      const fs = statfsSync(root);
      assert.ok(fs.bavail * fs.bsize >= plan.minimumFreeBytes, 'Disk reserve reached.');
      assert.ok(
        Date.now() - Date.parse(manifest.createdAt) < plan.maxWallSeconds * 1000,
        'Wall-time cap reached.',
      );
      assert.ok(
        reports.reduce((n, r) => n + r.requests, 0) < plan.maxTotalRequests,
        'Request cap reached.',
      );
      assert.ok(
        manifest.phases.reduce((n, p) => n + p.archive.bytes, 0) < plan.maxArchiveBytes,
        'Archive cap reached.',
      );
      const remaining = remainingAllowance(plan, reports);
      if (remaining < 0.001) {
        save('budget-stopped');
        break;
      }
      const phase = plan.phases[i],
        config = cellConfig(plan, phase, remaining),
        router = new RampRouter();
      const catalog = await router.models();
      for (const model of config.models)
        assert.deepEqual(
          catalog.models.find((m) => m.id === model.id)?.catalogRates,
          model.rates,
          'Availability/pricing changed.',
        );
      const stateDir = join(runtime, `${phase.id}-state`);
      assert.ok(!existsSync(stateDir), 'State directory already exists.');
      const servers = createServers({
        dataDir: stateDir,
        controlToken: randomBytes(32).toString('hex'),
        allowDemo: false,
      });
      const secrets = [router.apiKey, servers.controlToken];
      const entry = {
        id: phase.id,
        repetition: phase.repetition,
        originCampaign: COLLECTION_ID,
        startedAt: new Date().toISOString(),
        config,
        safeToContinue: false,
      };
      manifest.phases.push(entry);
      save('running');
      try {
        servers.app.listen(0, '127.0.0.1');
        await once(servers.app, 'listening');
        servers.control.listen(0, '127.0.0.1');
        await once(servers.control, 'listening');
        experiment = new Experiment({
          root,
          runRoot,
          config,
          router,
          launcher: 'cli',
          operatorVisuals: true,
          environment: {
            appURL: `http://127.0.0.1:${servers.app.address().port}`,
            controlURL: `http://127.0.0.1:${servers.control.address().port}`,
            controlToken: servers.controlToken,
          },
        });
        entry.runId = experiment.id;
        atomicJSON(manifestPath, manifest);
        const run = await experiment.run(),
          episode = run.episodes[0];
        const audit = buildAudit({ runRoot, id: run.id, secrets });
        const traces = Object.fromEntries(
          audit.episodes.map((e) => [e.episode.cell.episodeId, e.trace]),
        );
        const report = summarizeCell(plan, phase, config, audit);
        const exportDir = join(runtime, `${phase.id}-export`);
        exportRun({ runRoot, id: run.id, destination: exportDir, secrets });
        const archivePath = join(runtime, `${phase.id}.tar.gz`);
        assert.ok(!existsSync(archivePath), 'Never replace an archive.');
        execFileSync('tar', ['-czf', archivePath, '-C', exportDir, '.']);
        const bytes = readFileSync(archivePath);
        const knownBudgetStop =
          episode.status === 'budget' && episode.usageKnown === true && run.budget.requests > 0;
        const terminal =
          ['completed', 'step_limit'].includes(episode.status) ||
          retainedRequestTimeout(config, episode) ||
          acceptedOutputLimit(config, episode) ||
          retainedConnectionFailure(config, episode) ||
          acceptedEpisodeDeadline(config, episode) ||
          knownBudgetStop;
        const priorForTask = manifest.phases
          .slice(0, -1)
          .filter((p) => p.config.tasks[0] === phase.tasks[0]);
        const matched =
          !!episode.initialHash &&
          priorForTask.every(
            (p) =>
              p.initialHash === episode.initialHash &&
              JSON.stringify(p.appProvenance) === JSON.stringify(episode.appProvenance),
          );
        Object.assign(entry, {
          status: run.status,
          budget: run.budget,
          initialHash: episode.initialHash,
          appProvenance: episode.appProvenance,
          archive: {
            path: `${phase.id}.tar.gz`,
            bytes: bytes.length,
            sha256: sha(bytes),
            availability: 'local-preserved',
          },
          audit: {
            status: audit.integrity.status,
            checks: audit.integrity.checks.length,
            gaps: audit.integrity.gaps,
          },
          safeToContinue: !!(
            terminal &&
            !episode.cleanupError &&
            matched &&
            audit.integrity.status === 'verified' &&
            audit.integrity.gaps.length === 0
          ),
          finishedAt: new Date().toISOString(),
          stopReason: run.stopReason ?? null,
        });
        atomicJSON(join(runtime, `${phase.id}.report.json`), report);
        reports.push(report);
        const summary = save(entry.safeToContinue ? 'running' : 'stopped');
        console.log(
          JSON.stringify({
            cell: phase.id,
            model: phase.models[0],
            task: phase.tasks[0],
            mode: phase.interfaces[0],
            repetition: phase.repetition,
            outcome: report.rows[0].outcome,
            status: episode.status,
            safeToContinue: entry.safeToContinue,
            attempted: summary.totals.attempted,
            allowanceUSD: summary.estimatedUSD,
          }),
        );
        // Only this task's screened derivative is removed. Original runs and archive remain.
        rmSync(exportDir, { recursive: true });
        if (!entry.safeToContinue) break;
      } finally {
        experiment = undefined;
        await Promise.all(
          [servers.app, servers.control].map(
            (s) =>
              new Promise((done) => {
                s.closeAllConnections();
                s.close(done);
              }),
          ),
        );
        // Raw session state stays private and preserved beside its exact run.
      }
    }
    if (manifest.phases.slice(CARRIED_CELLS).every((p) => p.safeToContinue))
      save(
        cancelled
          ? 'cancelled'
          : manifest.phases.length === plan.planned
            ? 'completed'
            : 'budget-stopped',
      );
  } catch (error) {
    if (manifest) {
      manifest.status = 'stopped';
      manifest.workerError = String(error.message)
        .replaceAll(process.env.RAMP_ROUTER_API_KEY || '\0', '[redacted]')
        .slice(0, 500);
      atomicJSON(manifestPath, manifest);
      const summaryPath = join(destination, 'summary.json');
      if (existsSync(summaryPath)) {
        const summary = json(summaryPath);
        summary.status = 'stopped';
        summary.workerError = manifest.workerError;
        atomicJSON(summaryPath, summary);
      }
    }
    console.error(manifest?.workerError ?? 'Preflight failed before inference.');
    process.exitCode = 1;
  } finally {
    process.removeListener('SIGINT', cancel);
    process.removeListener('SIGTERM', cancel);
    rmSync(join(lock, 'pid'));
    rmdirSync(lock);
  }
}
