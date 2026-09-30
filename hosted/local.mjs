import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { createHostedHandler, ROOT } from './service.mjs';

export function createLiveServer(options = {}) {
  const handler = createHostedHandler(options);
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/relay') return handler(req, res);
    if (
      req.method !== 'GET' ||
      !/^\/(?:|live.html|assets\/[\w.-]+|demo\/[\w.-]+)$/.test(url.pathname)
    ) {
      res.writeHead(404);
      return res.end();
    }
    const file = join(ROOT, 'dist', url.pathname === '/' ? 'live.html' : url.pathname);
    if (!existsSync(file)) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, {
      'content-type':
        {
          '.html': 'text/html',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.png': 'image/png',
          '.json': 'application/json',
          '.woff2': 'font/woff2',
        }[extname(file)] ?? 'application/octet-stream',
    });
    res.end(readFileSync(file));
  });
}
if (process.argv[1]?.endsWith('/hosted/local.mjs')) {
  const server = createLiveServer();
  server.listen(Number(process.env.RELAY_LIVE_PORT ?? 4340), '127.0.0.1', () =>
    console.log('Relay live interface: http://localhost:4340'),
  );
  const stop = () => server.close();
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
}
