import { createServers } from '../server/server.mjs';
import { mkdtempSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { tmpdir, cpus, totalmem, platform, arch, release } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { chromium } from '@playwright/test';
const dir = mkdtempSync(join(tmpdir(), 'relay-bench-')),
  servers = createServers({
    dataDir: dir,
    controlToken: randomUUID(),
    allowDemo: false,
    maxSessions: 128,
  });
await new Promise((r) => servers.app.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${servers.app.address().port}`;
const summarize = (x) => {
  const a = [...x].sort((a, b) => a - b);
  return {
    n: a.length,
    p50Ms: a[Math.floor((a.length - 1) * 0.5)],
    p95Ms: a[Math.ceil((a.length - 1) * 0.95)],
    maxMs: a.at(-1),
  };
};
const samples = {
    create: [],
    reset: [],
    actionHttp: [],
    stateHttp: [],
    pageLoad: [],
    screenshot: [],
  },
  sessions = [];
const measure = async (name, fn) => {
  const t = performance.now(),
    r = await fn();
  samples[name].push(performance.now() - t);
  return r;
};
const rssStart = process.memoryUsage().rss;
let browser;
try {
  // Warm-up is excluded. Disk creation and SQLite sync writes are real.
  const warm = servers.store.create();
  servers.store.close(warm.token);
  for (let i = 0; i < 100; i++)
    sessions.push(await measure('create', () => servers.store.create({ seed: 100 + i })));
  const rss100 = process.memoryUsage().rss;
  for (const s of sessions) await measure('reset', () => servers.store.reset(s.token));
  for (const s of sessions)
    await measure('actionHttp', async () => {
      const r = await fetch(base + '/api/action', {
        method: 'POST',
        headers: { 'x-session-token': s.token, 'content-type': 'application/json' },
        body: JSON.stringify({
          revision: 1,
          requestId: randomUUID(),
          action: {
            type: 'message.send',
            channelId: 'general',
            text: 'Bounded benchmark message.',
          },
        }),
      });
      if (r.status !== 200) throw Error(`HTTP ${r.status}`);
      await r.json();
    });
  let cursor = 0;
  const start = performance.now();
  await Promise.all(
    Array.from({ length: 16 }, async () => {
      while (cursor < 400) {
        const i = cursor++;
        await measure('stateHttp', async () => {
          const r = await fetch(base + '/api/state', {
            headers: { 'x-session-token': sessions[i % 100].token },
          });
          if (r.status !== 200) throw Error(`HTTP ${r.status}`);
          await r.json();
        });
      }
    }),
  );
  const duration = performance.now() - start;
  browser = await chromium.launch({ headless: true });
  for (let i = 0; i < 10; i++) {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    const page = await context.newPage();
    await measure('pageLoad', async () => {
      await page.goto(base + '/s/' + sessions[i].token);
      await page.getByRole('textbox', { name: 'Search Northstar' }).waitFor();
    });
    await measure('screenshot', () => page.screenshot());
    await context.close();
  }
  const files = readdirSync(join(dir, 'sessions')).map(
    (f) => statSync(join(dir, 'sessions', f)).size,
  );
  const out = {
    schemaVersion: 1,
    at: new Date().toISOString(),
    machine: {
      platform: platform(),
      arch: arch(),
      release: release(),
      cpu: cpus()[0].model,
      logicalCpus: cpus().length,
      totalMemoryBytes: totalmem(),
      node: process.version,
      chromium: browser.version(),
    },
    method: {
      persistedSessions: 100,
      readConcurrency: 16,
      readRequests: 400,
      browserContexts: '10 sequential fresh contexts in one headless browser',
      viewport: '1440x900',
      warmup: 'one create/close; excluded',
      note: 'Loopback client and server share a process. API concurrency is not browser-agent concurrency. CPU-backed SQLite work is synchronous. Browser child memory is not included in Node RSS. This is a short local microbenchmark, not sustained capacity.',
    },
    latency: Object.fromEntries(Object.entries(samples).map(([k, v]) => [k, summarize(v)])),
    readThroughput: { durationMs: duration, requestsPerSecond: 400 / (duration / 1000) },
    resource: {
      nodeRssStartBytes: rssStart,
      nodeRssAfter100SessionsBytes: rss100,
      nodeRssEndBytes: process.memoryUsage().rss,
      sessionSqliteBytes: {
        min: Math.min(...files),
        max: Math.max(...files),
        total: files.reduce((a, b) => a + b, 0),
      },
      builtAssetsBytes: readdirSync('dist/assets').reduce(
        (n, f) => n + statSync(join('dist/assets', f)).size,
        0,
      ),
    },
    rawSamplesMs: samples,
  };
  mkdirSync('evidence', { recursive: true });
  writeFileSync('evidence/benchmark.json', JSON.stringify(out, null, 2) + '\n');
  console.log(JSON.stringify({ ...out, rawSamplesMs: undefined }, null, 2));
} finally {
  await browser?.close();
  for (const s of sessions) servers.store.close(s.token);
  await new Promise((r) => servers.app.close(r));
  console.log(`Empty benchmark scratch retained: ${dir}`);
}
