// Bounded, explicit phases; no automatic resume, retry, model fallback or secret persistence.
import { readFileSync, mkdirSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import { randomBytes, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createServers } from '../server/server.mjs';
import { Experiment, atomicJSON, sourceFingerprint } from '../runner/experiment.mjs';
import { schedule, validateConfig } from '../runner/design.mjs';
import { RampRouter } from '../runner/router.mjs';
import { buildAudit } from '../runner/audit.mjs';
import { exportRun, assertSafeEvidence } from '../runner/export.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const planText = readFileSync(join(root, 'docs/campaigns/onsite-2026-10-01.json'), 'utf8');
const plan = JSON.parse(planText),
  phaseId = process.argv[2];
const phaseIndex = plan.phases.findIndex((p) => p.id === phaseId);
if (phaseIndex < 0) throw Error('Specify pilot, workflows or pixels.');
if (plan.phases.reduce((n, p) => n + p.maxEstimatedUSD, 0) > plan.maxEstimatedUSD)
  throw Error('Phase allowances exceed campaign cap.');
const sha = (value) => createHash('sha256').update(value).digest('hex');
const runtime = join(root, '.runtime', plan.id),
  runRoot = join(runtime, 'runs');
mkdirSync(runtime, { recursive: true, mode: 0o700 });
const manifestPath = join(runtime, 'manifest.json');
if (
  !existsSync(manifestPath) &&
  existsSync(join(root, 'evidence/campaigns', plan.id, 'manifest.json'))
)
  throw Error(
    'This campaign is already published. Use a new reviewed experiment config; never overwrite historical evidence.',
  );
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath))
  : {
      id: plan.id,
      createdAt: new Date().toISOString(),
      planHash: sha(planText),
      sourceHash: sourceFingerprint(root),
      phases: [],
    };
if (manifest.planHash !== sha(planText) || manifest.sourceHash !== sourceFingerprint(root))
  throw Error('Frozen plan/source changed. Do not continue this campaign.');
if (manifest.phases.length !== phaseIndex || manifest.phases.some((p) => !p.safeToContinue))
  throw Error('Prior phase missing, already attempted, interrupted or unsafe. No automatic retry.');
const { id, models, ...settings } = plan.phases[phaseIndex];
const config = validateConfig({
  ...plan.common,
  ...settings,
  models: models.map((id) => plan.models[id]),
});
const router = new RampRouter();
const catalog = await router.models();
for (const model of config.models) {
  const found = catalog.models.find((row) => row.id === model.id);
  if (!found?.catalogRates || JSON.stringify(found.catalogRates) !== JSON.stringify(model.rates))
    throw Error('Exact model availability/pricing differs from the frozen plan.');
}
const entry = {
  id,
  status: 'starting',
  config,
  schedule: schedule(config),
  catalog,
  startedAt: new Date().toISOString(),
  safeToContinue: false,
};
manifest.phases.push(entry);
atomicJSON(manifestPath, manifest);
const temporary = mkdtempSync(join(tmpdir(), 'relay-campaign-'));
const servers = createServers({
  dataDir: temporary,
  controlToken: randomBytes(32).toString('hex'),
  allowDemo: false,
});
let experiment;
const cancel = () => experiment?.cancel();
process.once('SIGINT', cancel);
process.once('SIGTERM', cancel);
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
              phase: id,
              episode: e.cell.episodeId,
              task: e.cell.taskId,
              model: e.cell.model.id,
              mode: e.cell.mode,
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
  const audit = buildAudit({ runRoot, id: run.id, secrets: [router.apiKey, servers.controlToken] });
  entry.status = run.status;
  entry.budget = run.budget;
  entry.audit = audit.integrity;
  entry.finishedAt = new Date().toISOString();
  entry.safeToContinue =
    run.status === 'completed' && run.budget.usageKnown && audit.integrity.status === 'verified';
  atomicJSON(manifestPath, manifest);
  const destination = join(root, 'evidence/campaigns', plan.id, id);
  exportRun({ runRoot, id: run.id, destination, secrets: [router.apiKey, servers.controlToken] });
  const auditText = JSON.stringify(audit, null, 2);
  assertSafeEvidence(auditText, [router.apiKey, servers.controlToken]);
  writeFileSync(join(destination, 'audit.json'), auditText);
  const publicManifest = JSON.stringify(manifest, null, 2);
  assertSafeEvidence(publicManifest, [router.apiKey, servers.controlToken]);
  writeFileSync(join(root, 'evidence/campaigns', plan.id, 'manifest.json'), publicManifest);
  console.log(
    JSON.stringify({
      phase: id,
      runId: run.id,
      status: run.status,
      audit: audit.integrity.status,
      budget: run.budget,
      safeToContinue: entry.safeToContinue,
    }),
  );
  if (!entry.safeToContinue) process.exitCode = 1;
} finally {
  process.removeListener('SIGINT', cancel);
  process.removeListener('SIGTERM', cancel);
  await Promise.all(
    [servers.app, servers.control].map(
      (s) =>
        new Promise((resolve) => {
          s.closeAllConnections();
          s.close(resolve);
        }),
    ),
  );
  rmSync(temporary, { recursive: true, force: true });
}
