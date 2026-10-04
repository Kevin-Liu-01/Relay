import http from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import { createHostedHandler, ROOT } from './service.mjs';

export function createLiveServer(options = {}) {
  const handler = createHostedHandler(options);
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/relay') return handler(req, res);
    if (['/presentation.html', '/presentation/'].includes(url.pathname)) {
      res.writeHead(308, { location: `/presentation${url.search}` });
      return res.end();
    }
    if (
      req.method !== 'GET' ||
      !/^\/(?:|live.html|replay.html|play\/?|play.html|results|presentation|presentation\.pdf|presentation-controls\.js|assets\/[\w.-]+|demo\/[\w.-]+)$/.test(
        url.pathname,
      )
    ) {
      res.writeHead(404);
      return res.end();
    }
    const file = join(
      ROOT,
      'dist',
      url.pathname === '/'
        ? 'live.html'
        : /^\/play\/?$/.test(url.pathname)
          ? 'play.html'
          : ['/presentation', '/results'].includes(url.pathname)
            ? `${url.pathname.slice(1)}.html`
            : url.pathname,
    );
    if (!existsSync(file)) {
      res.writeHead(404);
      return res.end();
    }
    res.writeHead(200, {
      ...(url.pathname === '/replay.html' ||
      url.pathname === '/results' ||
      url.pathname.startsWith('/presentation')
        ? Object.fromEntries(
            JSON.parse(readFileSync(join(ROOT, 'vercel.json'), 'utf8')).headers[
              url.pathname === '/replay.html' ? 0 : 1
            ].headers.map((h) => [h.key, h.value]),
          )
        : {}),
      'content-type':
        {
          '.html': 'text/html',
          '.pdf': 'application/pdf',
          '.js': 'application/javascript',
          '.css': 'text/css',
          '.png': 'image/png',
          '.webp': 'image/webp',
          '.svg': 'image/svg+xml',
          '.ico': 'image/x-icon',
          '.json': 'application/json',
          '.csv': 'text/csv; charset=utf-8',
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
