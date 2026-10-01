import { mkdirSync, writeFileSync } from 'node:fs';
import { assertSafeEvidence } from '../runner/export.mjs';
const url = new URL(process.argv[2] ?? 'https://relay.kevinliu.studio');
if (
  url.protocol !== 'https:' ||
  !['relay.kevinliu.studio', 'relay-teal-iota.vercel.app'].includes(url.hostname)
)
  throw Error('Smoke credentials may only be sent to the verified Relay production host.');
const key = process.env.RAMP_ROUTER_API_KEY;
if (!key) throw Error('Load RAMP_ROUTER_API_KEY through a private environment file.');
const base = url.origin;
const mode = process.argv[3] ?? 'a11y';
const model = process.argv[4] ?? 'gpt-4o-mini';
if (!['a11y', 'json-ui', 'api'].includes(mode)) throw Error('Choose a supported interface.');
const setup = await (await fetch(`${base}/api/relay?op=config`)).json();
const catalogResponse = await fetch(`${base}/api/relay?op=models`, {
  method: 'POST',
  headers: { origin: base, 'content-type': 'application/json' },
  body: JSON.stringify({ provider: 'ramp', key }),
  signal: AbortSignal.timeout(20000),
});
if (!catalogResponse.ok) throw Error(`Catalog HTTP ${catalogResponse.status}; body withheld.`);
const catalog = await catalogResponse.json();
const selected = catalog.models.find((m) => m.id === model && m.rates);
if (!selected) throw Error('The exact model must be available and priced in your catalog.');
const task = process.argv[5] ?? 'channel-topic';
if (!Object.hasOwn(setup.tasks, task)) throw Error('Unknown task.');
const config = {
  ...setup.defaults,
  provider: 'ramp',
  models: [{ id: model, rates: selected.rates }],
  tasks: [task],
  interfaces: [mode],
  maxSteps: 8,
  maxRequests: 8,
  episodeSeconds: 60,
  runSeconds: 90,
  maxEstimatedUSD: 0.1,
};
const response = await fetch(`${base}/api/relay?op=run`, {
  method: 'POST',
  headers: { origin: base, 'content-type': 'application/json' },
  body: JSON.stringify({ provider: 'ramp', key, config }),
  signal: AbortSignal.timeout(180000),
});
if (!response.ok)
  throw Error(`Hosted HTTP ${response.status}; response withheld to protect credentials.`);
const reader = response.body.getReader(),
  decoder = new TextDecoder();
let pending = '',
  frames = 0,
  done = false,
  audit = null,
  run = null,
  events = [],
  artifacts = {},
  error = null;
for (;;) {
  const c = await reader.read();
  if (c.done) break;
  pending += decoder.decode(c.value, { stream: true });
  let n;
  while ((n = pending.indexOf('\n')) >= 0) {
    const line = pending.slice(0, n);
    pending = pending.slice(n + 1);
    if (!line) continue;
    assertSafeEvidence(line, [key]);
    const item = JSON.parse(line);
    if (item.type === 'frame') frames++;
    if (item.type === 'run') run = item.data;
    if (item.type === 'event') events.push(item.data);
    if (item.type === 'artifact') artifacts[item.data.path] = item.data.image;
    if (item.type === 'audit') audit = item.data;
    if (item.type === 'error') error = item.data.message;
    if (item.type === 'done') done = true;
  }
}
mkdirSync('.runtime/hosted-smokes', { recursive: true, mode: 0o700 });
const summary = {
  at: new Date().toISOString(),
  origin: base,
  id: run?.id,
  completedStream: done,
  frames,
  auditIntegrity: audit?.integrity.status ?? null,
  status: run?.status ?? null,
  requests: run?.budget.requests ?? 0,
  estimatedUSD: run?.budget.estimatedUSD ?? null,
  usageKnown: run?.budget.usageKnown ?? null,
  episodes: run?.episodes.map((e) => ({
    task: e.cell.taskId,
    interface: e.cell.mode,
    model: e.cell.model.id,
    status: e.status,
    success: e.evaluation?.success ?? false,
    steps: e.steps,
    durationMs: e.durationMs,
    error: e.error ?? null,
    captureWarnings: e.captureWarnings ?? [],
    provenance: e.appProvenance,
  })),
  error,
};
writeFileSync(
  `.runtime/hosted-smokes/${run?.id ?? 'failed'}.json`,
  JSON.stringify({ run, events, artifacts, audit, summary }),
  { mode: 0o600 },
);
console.log(JSON.stringify(summary, null, 2));
if (
  !done ||
  audit?.integrity.status !== 'verified' ||
  frames === 0 ||
  summary.episodes?.some((e) => !e.success || e.captureWarnings.length)
)
  process.exitCode = 1;
