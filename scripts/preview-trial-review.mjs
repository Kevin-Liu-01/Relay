// Read-only UI development without touching the benchmark worker's dist assets.
import { createServer } from 'vite';
import { readFileSync, statSync } from 'node:fs';
import { validateCatalog } from '../docs/review-app/data.mjs';
let catalogBytes, records, catalogModified;
function refreshCatalog() {
  const modified = statSync('evidence/trial-library/catalog.json').mtimeMs;
  if (modified === catalogModified) return;
  const bytes = readFileSync('evidence/trial-library/catalog.json');
  const catalog = validateCatalog(JSON.parse(bytes));
  catalogBytes = bytes;
  records = new Map(catalog.trials.map((r) => [r.path, r]));
  catalogModified = modified;
}
refreshCatalog();
const server = await createServer({
  server: {
    host: '127.0.0.1',
    port: 4352,
    strictPort: true,
    watch: {
      ignored: [
        '**/.runtime/**',
        '**/test-results/**',
        '**/playwright-report/**',
        '**/artifacts/**',
        '**/evidence/**',
      ],
    },
  },
  plugins: [
    {
      name: 'relay-read-only-trials',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const path = new URL(req.url, 'http://localhost').pathname;
          if (path === '/api/relay') {
            res.statusCode = 403;
            res.end('No model calls in this preview.');
            return;
          }
          if (path === '/demo/trial-catalog.json') {
            refreshCatalog();
            res.setHeader('content-type', 'application/json');
            res.setHeader('cache-control', 'no-store');
            res.end(catalogBytes);
            return;
          }
          if (path.startsWith('/demo/trial-')) refreshCatalog();
          const item = records.get(path);
          if (!item) {
            next();
            return;
          }
          res.setHeader('content-type', 'application/octet-stream');
          res.end(readFileSync(`evidence/trial-library/${item.path.split('/').at(-1)}`));
        });
      },
    },
  ],
});
await server.listen();
console.log(
  `Read-only Relay review preview: http://127.0.0.1:4352/demo/review.html (PID ${process.pid})`,
);
for (const signal of ['SIGTERM', 'SIGINT'])
  process.once(signal, async () => {
    await server.close();
    process.exit(0);
  });
