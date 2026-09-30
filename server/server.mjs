import http from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync, readdirSync } from 'node:fs';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Store } from './store.mjs';
import { Fault, fail, searchMessages, digest } from './domain.mjs';
import { TASK_IDS, taskSpec } from './tasks.mjs';
import { LLMS_TXT, SITE_GUIDE } from '../runner/protocol.mjs';
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const BACKEND_HASH = digest(
  [
    'server/server.mjs',
    'server/store.mjs',
    'server/domain.mjs',
    'server/seed.mjs',
    'server/tasks.mjs',
    'runner/protocol.mjs',
  ].map((p) => [p, readFileSync(join(ROOT, p), 'utf8')]),
);
function servedBuildHash() {
  if (!existsSync(join(ROOT, 'dist/index.html'))) return null;
  const files = [
    'index.html',
    ...readdirSync(join(ROOT, 'dist/assets'))
      .sort()
      .map((p) => `assets/${p}`),
  ];
  return digest(files.map((p) => [p, readFileSync(join(ROOT, 'dist', p)).toString('base64')]));
}
const json = (res, status, value) => {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(value));
};
async function body(req) {
  let chunks = [],
    size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    fail(size <= 32768, 'Request too large.', 413);
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString() || '{}');
  } catch {
    throw new Fault(400, 'Invalid JSON.');
  }
}
function equal(a, b) {
  const x = Buffer.from(a ?? ''),
    y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
export function createServers({
  dataDir = join(ROOT, '.runtime'),
  controlToken,
  allowDemo = true,
  ttlMs,
  maxSessions,
} = {}) {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const store = new Store(join(dataDir, 'sessions'), { ttlMs, maxSessions });
  if (!controlToken) {
    const path = join(dataDir, 'control-token');
    if (!existsSync(path))
      writeFileSync(path, randomBytes(32).toString('hex'), { mode: 0o600, flag: 'wx' });
    controlToken = readFileSync(path, 'utf8').trim();
  }
  const wrap = (fn) => async (req, res) => {
    try {
      await fn(req, res);
    } catch (e) {
      json(res, e.status ?? 500, { error: e.status ? e.message : 'Internal server error.' });
      if (!e.status) console.error(e);
    }
  };
  const app = http.createServer(
    wrap(async (req, res) => {
      const url = new URL(req.url, 'http://localhost');
      // Host and Origin validation blocks cross-site writes / DNS rebinding in local mode.
      let host;
      try {
        host = new URL(`http://${req.headers.host}`).hostname;
      } catch {
        throw new Fault(403, 'Untrusted Host.');
      }
      fail(['localhost', '127.0.0.1', '[::1]'].includes(host), 'Untrusted Host.', 403);
      if (req.headers.origin)
        fail(
          req.headers.origin === `http://${req.headers.host}`,
          'Cross-origin request rejected.',
          403,
        );
      if (url.pathname === '/health')
        return json(res, 200, {
          ok: true,
          service: 'relay-app',
          backendHash: BACKEND_HASH,
          buildHash: servedBuildHash(),
        });
      if (req.method === 'GET' && ['/llms.txt', '/agent-guide.md'].includes(url.pathname)) {
        res.writeHead(200, {
          'content-type': 'text/plain; charset=utf-8',
          'x-content-type-options': 'nosniff',
        });
        return res.end(url.pathname === '/llms.txt' ? LLMS_TXT : SITE_GUIDE);
      }
      if (url.pathname === '/api/demo' && req.method === 'POST') {
        fail(allowDemo, 'Demo sessions are disabled.', 403);
        const session = store.create({ mode: 'demo' });
        return json(res, 201, { token: session.token });
      }
      if (url.pathname.startsWith('/api/')) {
        const token = req.headers['x-session-token'];
        if (url.pathname === '/api/state' && req.method === 'GET')
          return json(res, 200, store.read(token));
        if (url.pathname === '/api/search' && req.method === 'GET')
          return json(res, 200, {
            messages: searchMessages(store.read(token).state, url.searchParams.get('q') ?? ''),
          });
        if (url.pathname === '/api/action' && req.method === 'POST')
          return json(res, 200, store.action(token, await body(req)));
        if (url.pathname === '/api/events' && req.method === 'POST')
          return json(res, 200, store.uiEvent(token, await body(req)));
        throw new Fault(404, 'Endpoint not found.');
      }
      fail(req.method === 'GET', 'Method not allowed.', 405);
      let path;
      if (url.pathname === '/' || /^\/s\/[a-f0-9]{64}$/.test(url.pathname))
        path = join(ROOT, 'dist/index.html');
      else if (/^\/assets\/[\w.-]+$/.test(url.pathname))
        path = resolve(ROOT, `dist${url.pathname}`);
      else throw new Fault(404, 'Page not found.');
      fail(existsSync(path), 'Build the application with npm run build first.', 503);
      const mime =
        {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.svg': 'image/svg+xml',
          '.jpg': 'image/jpeg',
          '.png': 'image/png',
          '.woff2': 'font/woff2',
        }[extname(path)] ?? 'application/octet-stream';
      res.writeHead(200, {
        'content-type': `${mime}; charset=utf-8`,
        'cache-control': 'no-cache',
        'referrer-policy': 'no-referrer',
        'x-content-type-options': 'nosniff',
        'content-security-policy':
          "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'",
      });
      res.end(readFileSync(path));
    }),
  );
  const control = http.createServer(
    wrap(async (req, res) => {
      fail(!req.headers.origin, 'Browser requests cannot access the control plane.', 403);
      fail(
        equal(req.headers.authorization, `Bearer ${controlToken}`),
        'Control token required.',
        401,
      );
      const url = new URL(req.url, 'http://localhost');
      if (url.pathname === '/tasks' && req.method === 'GET')
        return json(
          res,
          200,
          TASK_IDS.map((id) => taskSpec(id, 42)),
        );
      if (url.pathname === '/sessions' && req.method === 'POST')
        return json(res, 201, store.create(await body(req)));
      const match = url.pathname.match(
        /^\/sessions\/([a-f0-9]{64})(?:\/(reset|evaluate|export))?$/,
      );
      fail(match, 'Control endpoint not found.', 404);
      const [, token, op] = match;
      if (op === 'reset' && req.method === 'POST') return json(res, 200, store.reset(token));
      if (op === 'evaluate' && req.method === 'GET') return json(res, 200, store.evaluate(token));
      if (op === 'export' && req.method === 'GET') return json(res, 200, store.export(token));
      if (!op && req.method === 'DELETE') return json(res, 200, store.close(token));
      throw new Fault(405, 'Method not allowed.');
    }),
  );
  return { app, control, store, controlToken };
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? 4318),
    controlPort = Number(process.env.CONTROL_PORT ?? 4319);
  const servers = createServers({
    dataDir: process.env.DATA_DIR,
    controlToken: process.env.CONTROL_TOKEN,
    allowDemo: process.env.ALLOW_DEMO !== '0',
  });
  servers.app.listen(port, process.env.HOST ?? '127.0.0.1', () =>
    console.log(`Relay workspace: http://localhost:${port}`),
  );
  servers.control.listen(controlPort, process.env.CONTROL_HOST ?? '127.0.0.1', () =>
    console.log(`Control plane port ${controlPort} (trusted operator only)`),
  );
  const stop = () => {
    servers.app.close();
    servers.control.close();
  };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
