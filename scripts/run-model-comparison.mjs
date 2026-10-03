// New campaign only. No retries, substitutions, unsafe continuation or secret persistence.
import { readFileSync, writeFileSync, mkdirSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import { randomBytes, createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createServers } from '../server/server.mjs';
import { Experiment, atomicJSON, sourceFingerprint } from '../runner/experiment.mjs';
import { schedule, validateConfig } from '../runner/design.mjs';
import { RampRouter } from '../runner/router.mjs';
import { buildAudit } from '../runner/audit.mjs';
import { exportRun, assertSafeEvidence } from '../runner/export.mjs';
import { modelComparison, trialsCSV } from './lib/model-comparison.mjs';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
if (existsSync(join(root, '.env.local'))) process.loadEnvFile(join(root, '.env.local'));
const planText = readFileSync(
  join(root, 'docs/campaigns/model-comparison-2026-10-02.json'),
  'utf8',
);
const plan = JSON.parse(planText);
const id = process.argv[2] ?? plan.phases[0].id;
const phaseIndex = plan.phases.findIndex((p) => p.id === id);
if (phaseIndex < 0) throw Error('Specify seed-42, seed-43, seed-44 or seed-45.');
const sha = (v) => createHash('sha256').update(v).digest('hex');
const runtime = join(root, '.runtime', plan.id),
  runRoot = join(runtime, 'runs');
const destination = join(root, 'evidence/campaigns', plan.id);
const manifestPath = join(runtime, 'manifest.json');
if (!existsSync(manifestPath) && existsSync(join(destination, 'manifest.json')))
  throw Error('Published campaign cannot be overwritten.');
mkdirSync(runtime, { recursive: true, mode: 0o700 });
const bindings = {
  planHash: sha(planText),
  sourceHash: sourceFingerprint(root),
  launcherHash: sha(readFileSync(fileURLToPath(import.meta.url))),
};
const manifest = existsSync(manifestPath)
  ? JSON.parse(readFileSync(manifestPath))
  : { id: plan.id, createdAt: new Date().toISOString(), ...bindings, phases: [] };
if (Object.entries(bindings).some(([k, v]) => manifest[k] !== v))
  throw Error('Frozen plan, source or launcher changed.');
if (manifest.phases.length !== phaseIndex || manifest.phases.some((p) => !p.safeToContinue))
  throw Error('Phase missing/already attempted/unsafe. No automatic resume or retry.');
if (plan.phases.reduce((n, p) => n + p.maxEstimatedUSD, 0) > plan.maxEstimatedUSD)
  throw Error('Phase allowances exceed campaign ceiling.');
const { models, id: ignored, ...settings } = plan.phases[phaseIndex];
const config = validateConfig({
  ...plan.common,
  ...settings,
  models: models.map((m) => plan.models[m]),
});
const router = new RampRouter();
const catalog = await router.models();
for (const m of config.models) {
  const found = catalog.models.find((r) => r.id === m.id);
  if (!found?.catalogRates || JSON.stringify(found.catalogRates) !== JSON.stringify(m.rates))
    throw Error(`Frozen exact-ID availability/pricing changed for ${m.id}.`);
}
const entry = {
  id,
  config,
  schedule: schedule(config),
  catalog,
  startedAt: new Date().toISOString(),
  safeToContinue: false,
};
manifest.phases.push(entry);
atomicJSON(manifestPath, manifest);
const scratch = mkdtempSync(join(tmpdir(), 'relay-model-comparison-'));
const servers = createServers({
  dataDir: join(scratch, 'state'),
  controlToken: randomBytes(32).toString('hex'),
  allowDemo: false,
});
const secrets = [router.apiKey, servers.controlToken];
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
              phase: id,
              episode: e.cell.episodeId,
              model: e.cell.model.id,
              task: e.cell.taskId,
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
  Object.assign(entry, {
    status: run.status,
    budget: run.budget,
    audit: audit.integrity,
    finishedAt: new Date().toISOString(),
    stopReason: run.stopReason ?? null,
    safeToContinue:
      run.status === 'completed' &&
      run.budget.usageKnown &&
      audit.integrity.status === 'verified' &&
      run.episodes.every((e) => ['completed', 'step_limit'].includes(e.status) && !e.cleanupError),
  });
  atomicJSON(manifestPath, manifest);
  mkdirSync(destination, { recursive: true });
  const save = (name, value) => {
    const text = JSON.stringify(value, null, 2) + '\n';
    assertSafeEvidence(text, secrets);
    writeFileSync(join(destination, name), text);
  };
  const exportDir = join(scratch, 'export');
  exportRun({ runRoot, id: run.id, destination: exportDir, secrets });
  const archive = `${id}.tar.gz`;
  if (existsSync(join(destination, archive))) throw Error('Never overwrite a trajectory archive.');
  execFileSync('tar', ['-czf', join(destination, archive), '-C', exportDir, '.']);
  entry.archive = {
    path: archive,
    bytes: readFileSync(join(destination, archive)).length,
    sha256: sha(readFileSync(join(destination, archive))),
  };
  save(`${id}.run.json`, run);
  save(`${id}.audit.json`, {
    runId: run.id,
    integrity: audit.integrity,
    artifacts: audit.artifacts,
    limits: audit.limits,
  });
  atomicJSON(manifestPath, manifest);
  save('manifest.json', manifest);
  const phases = manifest.phases.map((p) => {
    const saved = JSON.parse(readFileSync(join(runRoot, p.runId, 'run.json')));
    return {
      id: p.id,
      run: saved,
      audit: { integrity: p.audit },
      traces: Object.fromEntries(
        saved.episodes.map((e) => {
          const path = join(runRoot, p.runId, e.cell.episodeId, 'steps.jsonl');
          return [
            e.cell.episodeId,
            existsSync(path)
              ? readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse)
              : [],
          ];
        }),
      ),
    };
  });
  const summary = {
    ...modelComparison(plan, phases),
    archives: manifest.phases.map((p) => p.archive),
    status: entry.safeToContinue
      ? phaseIndex === plan.phases.length - 1
        ? 'completed'
        : 'partial'
      : 'stopped',
    stopReason: entry.stopReason,
  };
  save('summary.json', summary);
  const csv = trialsCSV(summary.rows);
  assertSafeEvidence(csv, secrets);
  writeFileSync(join(destination, 'trials.csv'), csv);
  console.log(
    JSON.stringify({
      phase: id,
      safeToContinue: entry.safeToContinue,
      totals: summary.totals,
      estimatedUSD: summary.estimatedUSD,
      stopReason: entry.stopReason,
    }),
  );
  if (!entry.safeToContinue) process.exitCode = 1;
} finally {
  process.removeListener('SIGINT', cancel);
  process.removeListener('SIGTERM', cancel);
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
