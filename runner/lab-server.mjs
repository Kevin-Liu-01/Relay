import http from 'node:http';
import { readFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Experiment, atomicJSON } from './experiment.mjs';
import { RampRouter } from './router.mjs';
import { DEFAULT_CONFIG, aggregate, pairedComparisons, validateConfig } from './design.mjs';
import { TASK_IDS } from '../server/tasks.mjs';
import { INTERFACES } from './protocol.mjs';
import { buildAudit, auditJSONL, auditArchive } from './audit.mjs';
import { assertSafeEvidence } from './export.mjs';

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
// Reference price snapshot, NOT callable IDs. Exact IDs always come from the key's catalog.
export const PRICE_HINTS = [
  { label: 'gpt-4o-mini', input: 0.15, output: 0.6 },
  { label: 'gpt-6-luna', input: 0.1, output: 0.5 },
  { label: 'gpt-5-nano', input: 0.05, output: 0.4 },
  { label: 'deepseek-v4-flash', input: 0.14, output: 0.28 },
  { label: 'glm-5p3-flash', input: 0.15, output: 0.5 },
  { label: 'nemotron-lightning-3p5-30b-a3b', input: 0.05, output: 0.2 },
  { label: 'minimax-m3', input: 0.3, output: 1.2 },
];
const RUN_ID = /^[a-f0-9-]{36}$/;
const send = (res, status, data) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(data));
};
const sameSecret = (a, b) =>
  typeof a === 'string' &&
  Buffer.byteLength(a) === Buffer.byteLength(b) &&
  timingSafeEqual(Buffer.from(a), Buffer.from(b));
async function body(req) {
  let n = 0,
    parts = [];
  for await (const part of req) {
    n += part.length;
    if (n > 32768) throw Error('Request too large.');
    parts.push(part);
  }
  return JSON.parse(Buffer.concat(parts).toString() || '{}');
}

export function createLab({
  root = ROOT,
  runRoot = join(root, '.runtime/lab-runs'),
  environment,
  routerFactory = () => new RampRouter(),
  keyPresent = () => !!process.env.RAMP_ROUTER_API_KEY,
} = {}) {
  mkdirSync(runRoot, { recursive: true, mode: 0o700 });
  const csrf = randomBytes(32).toString('hex');
  let active = null;
  let archiveBusy = false;
  const secrets = () => [process.env.RAMP_ROUTER_API_KEY, environment?.controlToken];
  const runs = new Map();
  for (const id of readdirSync(runRoot).filter((x) => RUN_ID.test(x))) {
    const path = join(runRoot, id, 'run.json');
    if (!existsSync(path)) continue;
    const data = JSON.parse(readFileSync(path, 'utf8'));
    if (['running', 'queued'].includes(data.status)) {
      // The console owns only its runs. CLI/library workers may still be live;
      // never overwrite their checkpoints or race their atomic persistence.
      if (data.launcher && data.launcher !== 'console') continue;
      data.status = 'interrupted';
      data.stopReason = {
        code: 'process_restart',
        message: 'Runner restarted. No automatic rerun or additional spend.',
      };
      for (const e of data.episodes)
        if (e.status === 'running') {
          e.status = 'interrupted';
          if (e.inFlight) {
            e.usageKnown = false;
            data.budget.usageKnown = false;
          }
        }
      data.summary = aggregate(data.episodes);
      data.paired = pairedComparisons(data.episodes);
      atomicJSON(path, data);
    }
    runs.set(id, data);
  }
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost'),
        host = new URL(`http://${req.headers.host}`).hostname;
      if (
        !['127.0.0.1', 'localhost', '[::1]'].includes(host) ||
        (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) ||
        req.headers['sec-fetch-site'] === 'cross-site'
      )
        return send(res, 403, { error: 'Cross-origin operator access rejected.' });
      if (req.method !== 'GET' && !sameSecret(req.headers['x-lab-token'], csrf))
        return send(res, 403, { error: 'Operator CSRF token required.' });
      if (url.pathname === '/health') return send(res, 200, { ok: true, service: 'relay-lab' });
      if (url.pathname === '/api/config' && req.method === 'GET')
        return send(res, 200, {
          csrf,
          keyPresent: keyPresent(),
          defaults: DEFAULT_CONFIG,
          tasks: TASK_IDS,
          interfaces: INTERFACES,
          priceHints: PRICE_HINTS,
          priceSource: 'https://docs.router.com/supported-models',
          priceAsOf: '2026-09-29',
        });
      if (url.pathname === '/api/models' && req.method === 'GET')
        return send(res, 200, await routerFactory().models());
      if (url.pathname === '/api/runs' && req.method === 'GET') {
        // Import completed CLI runs without touching or claiming control over live CLI workers.
        for (const id of readdirSync(runRoot).filter((x) => RUN_ID.test(x))) {
          if (id === active?.id) continue;
          const file = join(runRoot, id, 'run.json');
          if (!existsSync(file)) continue;
          const saved = JSON.parse(readFileSync(file, 'utf8'));
          if (!['running', 'queued'].includes(saved.status)) runs.set(id, saved);
        }
        return send(
          res,
          200,
          [...runs.values()]
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
            .map(({ id, status, createdAt, evidenceKind, episodes, summary, stopReason }) => ({
              id,
              status,
              createdAt,
              evidenceKind,
              total: episodes.length,
              finished: episodes.filter((e) => !['queued', 'running'].includes(e.status)).length,
              summary,
              stopReason,
            })),
        );
      }
      if (url.pathname === '/api/runs' && req.method === 'POST') {
        if (active)
          return send(res, 409, {
            error: 'One run at a time. Cancel or finish the active run first.',
          });
        const config = await body(req);
        try {
          validateConfig(config);
        } catch (e) {
          return send(res, 400, { error: e.message });
        }
        // Recheck after reading the streamed request body: another start may have won.
        if (active)
          return send(res, 409, {
            error: 'Another experiment started while this request was being read.',
          });
        if (config.provider === 'ramp' && !keyPresent())
          return send(res, 400, {
            error: 'RAMP_ROUTER_API_KEY is not configured. No live calls made.',
          });
        if (!environment?.controlToken)
          return send(res, 503, {
            error: 'Start the Relay app first; the local control key is missing.',
          });
        const experiment = new Experiment({
          launcher: 'console',
          operatorVisuals: true,
          config,
          root,
          runRoot,
          environment,
          router: routerFactory(),
          onChange: (data) => runs.set(data.id, structuredClone(data)),
        });
        active = experiment;
        experiment.run().finally(() => {
          if (active === experiment) active = null;
        });
        return send(res, 202, { id: experiment.id });
      }
      const match = url.pathname.match(
        /^\/api\/runs\/([a-f0-9-]{36})(?:\/(cancel|export|audit|audit.jsonl|audit.tar.gz|episode-\d{3})(?:\/([\w.-]+))?)?$/,
      );
      if (match) {
        const [, id, op, file] = match,
          data = runs.get(id);
        if (!data) return send(res, 404, { error: 'Unknown run.' });
        if (req.method === 'POST' && op === 'cancel') {
          if (active?.id === id) active.cancel();
          return send(res, 200, { ok: true });
        }
        if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });
        if (!op) return send(res, 200, data);
        if (['audit', 'audit.jsonl', 'audit.tar.gz'].includes(op)) {
          if (op === 'audit.tar.gz') {
            if (['running', 'queued'].includes(data.status))
              return send(res, 409, {
                error: 'Finish or stop the run before downloading the archive.',
              });
            if (archiveBusy)
              return send(res, 409, {
                error: 'Another archive is being prepared. Try again shortly.',
              });
            archiveBusy = true;
            try {
              const bytes = await auditArchive({ runRoot, id, secrets: secrets() });
              res.writeHead(200, {
                'content-type': 'application/gzip',
                'cache-control': 'no-store',
                'x-content-type-options': 'nosniff',
                'content-disposition': `attachment; filename="relay-audit-${id}.tar.gz"`,
              });
              return res.end(bytes);
            } finally {
              archiveBusy = false;
            }
          }
          const audit = buildAudit({ runRoot, id, run: data, secrets: secrets() });
          if (op === 'audit.jsonl') {
            res.writeHead(200, {
              'content-type': 'application/x-ndjson',
              'cache-control': 'no-store',
              'x-content-type-options': 'nosniff',
              'content-disposition': `attachment; filename="relay-audit-${id}.jsonl"`,
            });
            return res.end(auditJSONL(audit));
          }
          if (url.searchParams.has('download'))
            res.setHeader('content-disposition', `attachment; filename="relay-audit-${id}.json"`);
          return send(res, 200, audit);
        }
        if (op === 'export') {
          res.setHeader('content-disposition', `attachment; filename="relay-${id}.json"`);
          const evidence = {
            run: data,
            episodes: data.episodes.map((e) => {
              const p = join(runRoot, id, e.cell.episodeId);
              return {
                episode: e,
                trace: existsSync(join(p, 'steps.jsonl'))
                  ? readFileSync(join(p, 'steps.jsonl'), 'utf8')
                      .trim()
                      .split('\n')
                      .filter(Boolean)
                      .map(JSON.parse)
                  : [],
                outcome: existsSync(join(p, 'outcome.json'))
                  ? JSON.parse(readFileSync(join(p, 'outcome.json'), 'utf8'))
                  : null,
              };
            }),
          };
          assertSafeEvidence(JSON.stringify(evidence), secrets());
          return send(res, 200, evidence);
        }
        if (!data.episodes.some((e) => e.cell.episodeId === op))
          return send(res, 404, { error: 'Unknown episode.' });
        if (
          !['steps.jsonl', 'outcome.json', 'initial.json', 'episode.json', 'final.png'].includes(
            file,
          ) &&
          !/^request-\d{3}\.json$/.test(file ?? '') &&
          !/^(observation|visual)-\d{3}\.png$/.test(file ?? '')
        )
          return send(res, 404, { error: 'Unknown artifact.' });
        const path = join(runRoot, id, op, file);
        if (!existsSync(path)) return send(res, 404, { error: 'Artifact not yet available.' });
        if (!file.endsWith('.png')) assertSafeEvidence(readFileSync(path, 'utf8'), secrets());
        if (file.endsWith('.png')) {
          res.writeHead(200, {
            'content-type': 'image/png',
            'cache-control': 'no-store',
            'x-content-type-options': 'nosniff',
          });
          return res.end(readFileSync(path));
        }
        if (file === 'steps.jsonl')
          return send(
            res,
            200,
            readFileSync(path, 'utf8').trim().split('\n').filter(Boolean).map(JSON.parse),
          );
        return send(res, 200, JSON.parse(readFileSync(path, 'utf8')));
      }
      if (req.method !== 'GET') return send(res, 405, { error: 'Method not allowed.' });
      const path =
        url.pathname === '/'
          ? join(root, 'dist/lab.html')
          : url.pathname === '/preview.png'
            ? join(root, 'evidence/visual/slack-assets.png')
            : url.pathname === '/guide'
              ? join(root, 'docs/benchmark-lab.md')
              : /^\/assets\/[\w.-]+$/.test(url.pathname)
                ? join(root, 'dist', url.pathname)
                : null;
      if (!path || !existsSync(path))
        return send(res, 404, { error: 'Not found. Run npm run build if necessary.' });
      res.writeHead(200, {
        'content-type':
          {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.woff2': 'font/woff2',
            '.jpg': 'image/jpeg',
            '.png': 'image/png',
            '.md': 'text/plain; charset=utf-8',
          }[extname(path)] ?? 'application/octet-stream',
        'cache-control': 'no-cache',
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer',
        'content-security-policy':
          "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
      });
      res.end(readFileSync(path));
    } catch (e) {
      send(res, 400, {
        error: e.code
          ? e.message
          : 'Invalid request or unavailable local resource. Check the server terminal.',
      });
      if (!e.code) console.error(e.message);
    }
  });
  return {
    server,
    runs,
    cancel: () => active?.cancel(),
    get active() {
      return active;
    },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'));
  const keyPath = join(ROOT, '.runtime/control-token');
  const lab = createLab({
    environment: {
      appURL: process.env.RELAY_APP_URL ?? 'http://127.0.0.1:4318',
      controlURL: process.env.RELAY_CONTROL_URL ?? 'http://127.0.0.1:4319',
      controlToken:
        process.env.CONTROL_TOKEN ??
        (existsSync(keyPath) ? readFileSync(keyPath, 'utf8').trim() : null),
    },
  });
  const port = Number(process.env.RELAY_LAB_PORT ?? 4330);
  lab.server.listen(port, '127.0.0.1', () =>
    console.log(
      `Relay Lab: http://localhost:${port} — ${process.env.RAMP_ROUTER_API_KEY ? 'Router key configured' : 'reference mode ready; Router key not configured'}`,
    ),
  );
  const stop = () => {
    lab.cancel();
    lab.server.close();
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
