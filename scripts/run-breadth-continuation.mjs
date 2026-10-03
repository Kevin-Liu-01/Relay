// Durable, sequential research worker. No provider retry and no in-flight resume.
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  mkdtempSync,
  rmSync,
  rmdirSync,
  statfsSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import { createHash, randomBytes } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createServers } from '../server/server.mjs';
import { Experiment, atomicJSON, sourceFingerprint } from '../runner/experiment.mjs';
import { RampRouter } from '../runner/router.mjs';
import { buildAudit } from '../runner/audit.mjs';
import { exportRun, assertSafeEvidence } from '../runner/export.mjs';
import {
  retainedRequestTimeout,
  acceptedOutputLimit,
  retainedConnectionFailure,
  acceptedEpisodeDeadline,
} from '../runner/campaign-policy.mjs';
import {
  TASK_CAMPAIGN_ID,
  createContinuation,
  acceptedCellSpendLimit,
  PREDECESSOR,
  validateTaskPlan,
  taskConfig,
  remainingAllowance,
  taskCampaignSummary,
  blockReport,
} from './lib/breadth-continuation.mjs';
import { trialsCSV } from './lib/model-comparison.mjs';
import { taskSeed, TASK_IDS } from '../server/tasks.mjs';
import { digest } from '../server/domain.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const command = process.argv[2];
if (!['prepare', 'pilot', 'bulk', 'status'].includes(command))
  throw Error('Use prepare, pilot, bulk or status.');
const id = TASK_CAMPAIGN_ID;
const planPath = join(root, 'docs/campaigns', `${id}.json`);
const runtime = join(root, '.runtime', id),
  runRoot = join(runtime, 'runs');
const destination = join(root, 'evidence/campaigns', id);
const manifestPath = join(runtime, 'manifest.json');
const sha = (v) => createHash('sha256').update(v).digest('hex');
const json = (path) => JSON.parse(readFileSync(path, 'utf8'));
if (command === 'prepare') {
  if (existsSync(planPath) || existsSync(manifestPath))
    throw Error('Never overwrite a frozen continuation.');
  if (existsSync(join(root, '.runtime', PREDECESSOR, 'worker.lock')))
    throw Error('Original worker is still active.');
  const previousPath = 'evidence/campaigns/' + PREDECESSOR + '/summary.json';
  const previousBytes = readFileSync(join(root, previousPath));
  const previous = JSON.parse(previousBytes);
  const previousPlan = json(join(root, 'docs/campaigns', PREDECESSOR + '.json'));
  const previousManifest = json(join(root, '.runtime', PREDECESSOR, 'manifest.json'));
  if (sourceFingerprint(root) !== previous.sourceHash)
    throw Error('Original actor/grader source changed.');
  const last = previousManifest.phases.at(-1);
  const originalRun = json(join(root, '.runtime', PREDECESSOR, 'runs', last.runId, 'run.json'));
  const traces = Object.fromEntries(
    originalRun.episodes.map((e) => [
      e.cell.episodeId,
      readFileSync(
        join(root, '.runtime', PREDECESSOR, 'runs', last.runId, e.cell.episodeId, 'steps.jsonl'),
        'utf8',
      )
        .trim()
        .split('\n')
        .map(JSON.parse),
    ]),
  );
  if (
    !acceptedCellSpendLimit(last.config, originalRun, traces) ||
    last.audit?.status !== 'verified' ||
    !last.matchedInitialState
  )
    throw Error('Predecessor did not stop at the reviewed, fully accounted cell-spend boundary.');
  // Reopen all 105 original attempts before creating any new plan.
  execFileSync(process.execPath, ['scripts/verify-breadth-completion.mjs', '--partial'], {
    cwd: root,
    stdio: 'pipe',
  });
  const reviewPath = 'docs/campaigns/' + PREDECESSOR + '-pilot-review.md';
  const plan = validateTaskPlan(
    createContinuation(
      previousPlan,
      previous,
      previousManifest,
      sha(previousBytes),
      sha(readFileSync(join(root, reviewPath))),
    ),
  );
  writeFileSync(planPath, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' });
  mkdirSync(destination, { recursive: true });
  atomicJSON(join(destination, 'summary.json'), taskCampaignSummary(plan, [], 'planned'));
  console.log(
    JSON.stringify({
      id,
      planned: 306,
      preserved: 105,
      newPlanned: 201,
      remainingUSD: remainingAllowance(plan, []),
    }),
  );
} else if (command === 'status') {
  const s = json(join(destination, 'summary.json'));
  console.log(
    JSON.stringify(
      {
        status: s.status,
        totals: s.totals,
        estimatedUSD: s.estimatedUSD,
        reservedUSD: s.reservedUSD,
        priorRecordedUSD: s.priorRecordedUSD,
        remainingUSD: s.remainingUSD,
        phases: s.phases.length,
        updated: s.generatedAt,
      },
      null,
      2,
    ),
  );
} else {
  const planText = readFileSync(planPath),
    plan = validateTaskPlan(JSON.parse(planText));
  mkdirSync(runtime, { recursive: true, mode: 0o700 });
  const lock = join(runtime, 'worker.lock');
  mkdirSync(lock); // Atomic ownership: an existing worker/unclean exit is never stolen.
  writeFileSync(join(lock, 'pid'), String(process.pid));
  const bindingFiles = [
    'scripts/run-breadth-continuation.mjs',
    'scripts/lib/breadth-continuation.mjs',
    'scripts/lib/breadth-campaign.mjs',
    'scripts/lib/task-campaign-v2.mjs',
    'scripts/lib/model-comparison.mjs',
    'scripts/lib/campaign-report.mjs',
  ];
  const bindings = () => ({
    planHash: sha(readFileSync(planPath)),
    sourceHash: sourceFingerprint(root),
    launcherHash: sha(
      JSON.stringify(bindingFiles.map((p) => [p, sha(readFileSync(join(root, p)))])),
    ),
  });
  const frozen = bindings();
  let manifest,
    experiment,
    stop = false;
  const cancel = () => {
    stop = true;
    experiment?.cancel();
  };
  process.once('SIGINT', cancel);
  process.once('SIGTERM', cancel);
  try {
    if (frozen.sourceHash !== plan.sourceHash) throw Error('Carryover source changed.');
    manifest = existsSync(manifestPath)
      ? json(manifestPath)
      : { id, createdAt: new Date().toISOString(), ...frozen, phases: [], status: 'ready' };
    if (Object.entries(frozen).some(([k, v]) => manifest[k] !== v))
      throw Error('Frozen source, plan or launcher changed.');
    for (const prior of plan.priorCampaigns) {
      const bytes = readFileSync(
        join(root, prior.path ?? `evidence/campaigns/${prior.id}/summary.json`),
      );
      if (sha(bytes) !== prior.summaryHash || JSON.parse(bytes).estimatedUSD !== prior.recordedUSD)
        throw Error('Prior ledger binding changed.');
    }
    const preserved = json(join(root, 'evidence/campaigns', PREDECESSOR, 'summary.json'));
    const expectedRows = preserved.rows
      .filter((r) => r.outcome !== 'unattempted')
      .map((r) => ({
        ...r,
        originCampaign: r.originCampaign,
        cohort: 'preserved',
      }));
    if (JSON.stringify(expectedRows) !== JSON.stringify(plan.carryoverRows))
      throw Error('Carryover rows differ from the original evidence.');
    if (manifest.phases.some((p) => !p.safeToContinue))
      throw Error('Unfinished/unsafe block. No automatic retry or in-flight resume.');
    if (command === 'pilot' && manifest.phases.length) throw Error('Pilot already attempted.');
    if (command === 'bulk' && manifest.phases.length < plan.pilotBlocks)
      throw Error('Complete and review each new route on the first three tasks first.');
    if (!manifest.pilotReview) {
      const proof = readFileSync(join(root, plan.pilotAdmission.source));
      if (sha(proof) !== plan.pilotAdmission.sha256)
        throw Error('Original admission review changed.');
      manifest.pilotReview = {
        ...plan.pilotAdmission,
        at: new Date().toISOString(),
        method:
          'The original 36-cell pilot is retained; no new inference repeats. All 105 predecessor attempts were archive-audited before preparation.',
      };
    }
    const reports = manifest.phases.map((p) => json(join(runtime, p.id + '.report.json')));
    const savePublic = (status) => {
      manifest.status = status;
      atomicJSON(manifestPath, manifest);
      const summary = taskCampaignSummary(plan, reports, status);
      summary.sourceHash = manifest.sourceHash;
      summary.planHash = manifest.planHash;
      const text = JSON.stringify(summary);
      assertSafeEvidence(text, [process.env.RAMP_ROUTER_API_KEY]);
      mkdirSync(destination, { recursive: true });
      atomicJSON(join(destination, 'summary.json'), summary);
      atomicJSON(join(destination, 'manifest.json'), manifest);
      const header = trialsCSV([]).trimEnd();
      const csv =
        'originCampaign,cohort,runId,' +
        header +
        '\n' +
        summary.rows
          .map((r) => {
            const one = trialsCSV([r]);
            const body = one.slice(one.indexOf('\n') + 1);
            return (
              [r.originCampaign, r.cohort, r.runId ?? ''].map((s) => JSON.stringify(s)).join(',') +
              ',' +
              body
            );
          })
          .join('');
      writeFileSync(join(destination, 'trials.csv'), csv);
      return summary;
    };
    const limit = command === 'pilot' ? plan.pilotBlocks : plan.phases.length;
    for (let i = manifest.phases.length; i < limit && !stop; i++) {
      if (Object.entries(bindings()).some(([k, v]) => manifest[k] !== v))
        throw Error('Source drift; no next block.');
      if ((Date.now() - Date.parse(plan.collectionStartedAt)) / 1000 > plan.maxWallSeconds)
        throw Error('Global wall-time ceiling reached.');
      const free = statfsSync(runtime);
      if (free.bavail * free.bsize < plan.minimumFreeBytes)
        throw Error('Free disk reserve reached.');
      if (reports.reduce((n, r) => n + r.archive.bytes, 0) >= plan.maxArchiveBytes)
        throw Error('Archive storage ceiling reached.');
      if (
        reports.reduce((n, r) => n + r.requests, 0) + plan.common.maxRequests >
        plan.maxTotalRequests
      )
        throw Error('Request ceiling reached.');
      const remaining = remainingAllowance(plan, reports);
      if (remaining <= 0) throw Error('Global estimated-dollar ceiling reached.');
      const phase = plan.phases[i],
        config = taskConfig(plan, phase, remaining);
      const router = new RampRouter(),
        catalog = await router.models();
      for (const m of config.models) {
        const row = catalog.models.find((r) => r.id === m.id);
        if (!row?.catalogRates || JSON.stringify(row.catalogRates) !== JSON.stringify(m.rates))
          throw Error('Exact route/pricing changed: ' + m.id);
      }
      const scratch = mkdtempSync(join(tmpdir(), 'relay-task-campaign-'));
      const servers = createServers({
        dataDir: join(scratch, 'state'),
        controlToken: randomBytes(32).toString('hex'),
        allowDemo: false,
      });
      const secrets = [router.apiKey, servers.controlToken];
      const entry = {
        id: phase.id,
        config,
        catalog,
        startedAt: new Date().toISOString(),
        safeToContinue: false,
      };
      manifest.phases.push(entry);
      savePublic('running');
      try {
        servers.app.listen(0, '127.0.0.1');
        await once(servers.app, 'listening');
        servers.control.listen(0, '127.0.0.1');
        await once(servers.control, 'listening');
        const reported = new Set();
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
          onChange(run) {
            for (const e of run.episodes)
              if (!['queued', 'running'].includes(e.status) && !reported.has(e.cell.episodeId)) {
                reported.add(e.cell.episodeId);
                console.log(
                  JSON.stringify({
                    block: phase.id,
                    task: e.cell.taskId,
                    seed: e.cell.seed,
                    model: e.cell.model.id,
                    status: e.status,
                    success: e.evaluation?.success,
                    steps: e.steps,
                    estimatedUSD: e.estimatedUSD,
                  }),
                );
              }
          },
        });
        entry.runId = experiment.id;
        atomicJSON(manifestPath, manifest);
        const run = await experiment.run();
        const audit = buildAudit({ runRoot, id: run.id, secrets });
        const capturedTraces = Object.fromEntries(
          audit.episodes.map((e) => [e.episode.cell.episodeId, e.trace]),
        );
        const capped = acceptedCellSpendLimit(config, run, capturedTraces);
        const safeEpisode = (e) =>
          !e.cleanupError &&
          (['completed', 'step_limit'].includes(e.status) ||
            retainedRequestTimeout(config, e) ||
            acceptedOutputLimit(config, e) ||
            retainedConnectionFailure(config, e) ||
            acceptedEpisodeDeadline(config, e) ||
            capped);
        const matched =
          run.episodes.length === 1 &&
          run.episodes.every((e) => e.initialHash === plan.initialHashes[e.cell.taskId]);
        const safe =
          (run.status === 'completed' || capped) &&
          run.episodes.every(safeEpisode) &&
          audit.integrity.status === 'verified' &&
          !!matched;
        const exportDir = join(scratch, 'export');
        exportRun({ runRoot, id: run.id, destination: exportDir, secrets });
        const archivePath = join(runtime, phase.id + '.tar.gz');
        if (existsSync(archivePath)) throw Error('Archive already exists.');
        execFileSync('tar', ['-czf', archivePath, '-C', exportDir, '.']);
        const archive = {
          path: phase.id + '.tar.gz',
          bytes: readFileSync(archivePath).length,
          sha256: sha(readFileSync(archivePath)),
          availability: 'local-preserved',
        };
        const traces = Object.fromEntries(
          audit.episodes.map((e) => [e.id ?? e.episode.cell.episodeId, e.trace]),
        );
        const report = {
          ...blockReport(plan, phase, run, audit, traces),
          archive,
          safeToContinue: safe,
        };
        atomicJSON(join(runtime, phase.id + '.report.json'), report);
        atomicJSON(join(runtime, phase.id + '.audit.json'), {
          integrity: audit.integrity,
          artifacts: audit.artifacts,
        });
        Object.assign(entry, {
          archive,
          safeToContinue: safe,
          status: run.status,
          budget: run.budget,
          audit: {
            status: audit.integrity.status,
            checks: audit.integrity.checks.length,
            gaps: audit.integrity.gaps,
          },
          matchedInitialState: !!matched,
          finishedAt: new Date().toISOString(),
          stopReason: run.stopReason ?? null,
          continuationReason: capped ? 'verified-cell-spend-limit; no retry' : null,
        });
        reports.push(report);
        const summary = savePublic(safe ? 'running' : 'stopped');
        console.log(
          JSON.stringify({
            block: phase.id,
            safeToContinue: safe,
            totals: summary.totals,
            estimatedUSD: summary.estimatedUSD,
            reservedUSD: summary.reservedUSD,
            remainingUSD: summary.remainingUSD,
          }),
        );
        if (!safe) {
          process.exitCode = 1;
          break;
        }
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
        rmSync(scratch, { recursive: true, force: true });
      }
    }
    if (manifest.phases.every((p) => p.safeToContinue))
      savePublic(
        stop
          ? 'cancelled'
          : manifest.phases.length === plan.phases.length
            ? 'completed'
            : 'pilot-review',
      );
  } catch (error) {
    if (manifest) {
      manifest.status = 'stopped';
      manifest.workerError = String(error.message).slice(0, 500);
      atomicJSON(manifestPath, manifest);
      if (existsSync(join(destination, 'summary.json'))) {
        const saved = json(join(destination, 'summary.json'));
        saved.status = 'stopped';
        saved.workerError = manifest.workerError;
        atomicJSON(join(destination, 'summary.json'), saved);
      }
    }
    throw error;
  } finally {
    process.removeListener('SIGINT', cancel);
    process.removeListener('SIGTERM', cancel);
    rmSync(join(lock, 'pid'));
    rmdirSync(lock);
  }
}
