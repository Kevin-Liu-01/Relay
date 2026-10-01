import { mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createServers } from '../server/server.mjs';
// Each suite owns one disposable store. Repeated runs cannot fill yesterday's pool.
const root = resolve('.runtime');
mkdirSync(root, { recursive: true });
const dataDir = mkdtempSync(join(root, 'browser-suite-'));
const servers = createServers({ dataDir, controlToken: 'browser-test-only', allowDemo: false });
servers.app.listen(4320, '127.0.0.1');
servers.control.listen(4321, '127.0.0.1');
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  for (const server of [servers.app, servers.control]) {
    server.closeAllConnections();
    await new Promise((r) => server.close(r));
  }
  rmSync(dataDir, { recursive: true, force: true });
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
