import { mkdtempSync, rmSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { createServers } from '../server/server.mjs';
import { Experiment } from '../runner/experiment.mjs';
import { DEFAULT_CONFIG, validateConfig } from '../runner/design.mjs';
import { RampRouter } from '../runner/router.mjs';
import { TypeSafeRouter } from '../runner/typesafe.mjs';
import { createPricingResolver, applyCatalogRates } from './pricing.mjs';
import { buildAudit } from '../runner/audit.mjs';
import { assertSafeEvidence } from '../runner/export.mjs';
import { TASK_CATALOG, TASK_LABELS } from '../shared/task-catalog.mjs';
import { startSpectator } from './spectator.mjs';
export { TASK_LABELS };

export async function flushStream(res, signal) {
  signal.throwIfAborted();
  if (res.writableNeedDrain)
    await once(res, 'drain', { signal: AbortSignal.any([signal, AbortSignal.timeout(5000)]) });
  signal.throwIfAborted();
}

export const ROOT = fileURLToPath(new URL('../', import.meta.url));
export const LIMITS = {
  maxSteps: 80,
  maxRequests: 80,
  maxEpisodes: 3,
  runSeconds: 190,
  episodeSeconds: 180,
  maxEstimatedUSD: 5,
  maxOutputTokens: 4096,
};
export function hostedConfig(input) {
  const c = validateConfig(input);
  if (!['ramp', 'typesafe'].includes(c.provider))
    throw Error(
      'Live hosted runs require your provider key. The reference demo is a recorded replay.',
    );
  if (
    c.maxSteps > LIMITS.maxSteps ||
    c.maxRequests > LIMITS.maxRequests ||
    c.runSeconds > LIMITS.runSeconds ||
    c.episodeSeconds > LIMITS.episodeSeconds ||
    c.maxEstimatedUSD > LIMITS.maxEstimatedUSD ||
    c.maxOutputTokens > LIMITS.maxOutputTokens ||
    c.maxInputUnits > 128000
  )
    throw Error(
      'Hosted run exceeds a resource limit. Use the local runner for larger experiments.',
    );
  const count =
    c.models.length *
    c.tasks.length *
    c.seeds.length *
    c.repeats *
    c.interfaces.length *
    c.guides.length *
    c.histories.length;
  if (count > LIMITS.maxEpisodes) throw Error('At most three episodes per hosted run.');
  return c;
}
export function routerFor(provider, key) {
  if (provider === 'ramp') return new RampRouter({ apiKey: key });
  if (provider === 'typesafe') return new TypeSafeRouter({ apiKey: key });
  throw Error('Unknown provider.');
}
function json(res, status, value) {
  res.writeHead(status, {
    'content-type': 'application/json',
    'cache-control': 'no-store',
    'x-content-type-options': 'nosniff',
  });
  res.end(JSON.stringify(value));
}
export async function readBody(req) {
  if (!(req.headers['content-type'] ?? '').startsWith('application/json'))
    throw Error('JSON required.');
  if (req.body != null) {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    if (Buffer.byteLength(raw) > 32768) throw Error('Request too large.');
    return JSON.parse(raw);
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 32768) throw Error('Request too large.');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString());
}
export function checkOrigin(req) {
  const origin = req.headers.origin;
  const expected = `${process.env.VERCEL ? 'https' : 'http'}://${req.headers.host}`;
  if (!origin || origin !== expected || req.headers['sec-fetch-site'] === 'cross-site')
    throw Error('Same-origin requests only.');
}

// No global runs, credentials, browser or filesystem path shared with another request.
// The concurrency cap is per warm instance, not a global abuse-control guarantee.
export function createHostedHandler({
  root = ROOT,
  routerFactory = routerFor,
  pricingResolver = createPricingResolver(),
  launchOptions = async () => ({}),
} = {}) {
  let active = 0;
  return async function handler(req, res) {
    const op = new URL(req.url, 'http://localhost').searchParams.get('op');
    if (op === 'config' && req.method === 'GET')
      return json(res, 200, {
        name: 'Relay',
        tasks: TASK_LABELS,
        taskCatalog: TASK_CATALOG,
        limits: LIMITS,
        defaults: {
          ...DEFAULT_CONFIG,
          interfaces: ['a11y'],
          maxSteps: 40,
          maxRequests: 80,
          maxInputUnits: 128000,
          maxOutputTokens: LIMITS.maxOutputTokens,
          runSeconds: LIMITS.runSeconds,
          episodeSeconds: LIMITS.episodeSeconds,
          maxEstimatedUSD: 2,
        },
        providers: [
          { id: 'ramp', name: 'Ramp Router' },
          { id: 'typesafe', name: 'Jev · TypeSafe' },
        ],
      });
    if (!['models', 'run'].includes(op) || req.method !== 'POST')
      return json(res, 404, { error: 'Endpoint not found.' });
    let body, router;
    try {
      checkOrigin(req);
      body = await readBody(req);
      const allowed = op === 'models' ? ['provider', 'key'] : ['provider', 'key', 'config'];
      if (!body || Object.keys(body).some((k) => !allowed.includes(k)))
        throw Error('Unknown request fields.');
      if (
        typeof body.key !== 'string' ||
        body.key.length < 8 ||
        body.key.length > 512 ||
        /\s/.test(body.key)
      )
        throw Error('Enter your provider API key.');
      router = routerFactory(body.provider, body.key);
      if (op === 'models')
        return json(res, 200, await pricingResolver(body.provider, await router.models()));
      if (body.config?.provider !== body.provider) throw Error('Provider/config mismatch.');
      body.config = hostedConfig(body.config);
      if (active >= 2)
        return json(res, 429, { error: 'This worker is busy. Please try again shortly.' });
    } catch (e) {
      // Fixed transport errors never include upstream bodies or auth headers.
      const message = String(e.message)
        .replaceAll(body?.key ?? '\0', '[redacted]')
        .slice(0, 220);
      return json(res, 400, { error: message });
    }
    active++;
    let servers, run, dir, deadline, heartbeat;
    const abort = new AbortController();
    const disconnect = () => {
      abort.abort();
      run?.cancel();
    };
    res.on('close', disconnect);
    const emit = (type, data) => {
      if (res.destroyed || res.writableEnded || abort.signal.aborted) return;
      if (res.writableLength > 2 * 1024 * 1024) {
        disconnect();
        return;
      }
      const line = JSON.stringify({ type, data }) + '\n';
      try {
        assertSafeEvidence(line, [body.key, servers?.controlToken]);
      } catch {
        // Event callbacks (including CDP) must not crash another request's worker.
        disconnect();
        return;
      }
      res.write(line);
    };
    try {
      // Validate credentials before allocating the browser, even on cold starts.
      const catalog = await pricingResolver(
        body.provider,
        await router.models({ signal: abort.signal, timeoutMs: 15000 }),
      );
      // The server re-resolves rates; the browser cannot lower its own budget accounting.
      body.config = hostedConfig(applyCatalogRates(body.config, catalog));
      if (abort.signal.aborted) return;
      router.models = async () => catalog;
      res.writeHead(200, {
        'content-type': 'application/x-ndjson',
        'cache-control': 'no-store, no-transform',
        'x-content-type-options': 'nosniff',
        'x-accel-buffering': 'no',
      });
      res.flushHeaders?.();
      emit('connected', { provider: body.provider });
      heartbeat = setInterval(() => emit('heartbeat', { at: Date.now() }), 10000);
      dir = mkdtempSync(join(tmpdir(), 'relay-hosted-'));
      servers = createServers({
        dataDir: dir,
        controlToken: randomBytes(32).toString('hex'),
        allowDemo: false,
        maxSessions: 3,
        ttlMs: 240000,
      });
      servers.app.listen(0, '127.0.0.1');
      await once(servers.app, 'listening');
      servers.control.listen(0, '127.0.0.1');
      await once(servers.control, 'listening');
      const options = await launchOptions();
      let activeEpisode = 'episode-001';
      const captures = new WeakMap();
      const onPage = async (page) => {
        const episodeId = activeEpisode;
        captures.set(
          page,
          await startSpectator(page, (frame) => emit('frame', { episodeId, ...frame })),
        );
      };
      run = new Experiment({
        config: body.config,
        root,
        runRoot: join(dir, 'runs'),
        router,
        operatorVisuals: true,
        environment: {
          appURL: `http://127.0.0.1:${servers.app.address().port}`,
          controlURL: `http://127.0.0.1:${servers.control.address().port}`,
          controlToken: servers.controlToken,
          launchOptions: options,
          onPage,
          captureScreenshot: (page, options) => captures.get(page)(options),
        },
        onChange: (data) => {
          activeEpisode =
            data.episodes.find((e) => e.status === 'running')?.cell.episodeId ?? activeEpisode;
          emit('run', data);
        },
        onRecord: (episodeId, event) => emit('event', { episodeId, event }),
      });
      deadline = setTimeout(() => run.cancel(), (LIMITS.runSeconds + 15) * 1000);
      if (abort.signal.aborted) run.cancel();
      await run.run();
      const audit = buildAudit({
        runRoot: join(dir, 'runs'),
        id: run.id,
        secrets: [body.key, servers.controlToken],
      });
      // Preserve exact PNG/request artifacts for portable integrity verification. Live JPEGs
      // are only a viewing feed; they are not substituted for hashed policy observations.
      await flushStream(res, abort.signal);
      for (const episode of run.data.episodes) {
        if (episode.status === 'queued') continue;
        const eid = episode.cell.episodeId;
        for (const file of readdirSync(join(run.dir, eid))) {
          if (!file.endsWith('.png')) continue;
          emit('artifact', {
            path: `${eid}/${file}`,
            image: `data:image/png;base64,${readFileSync(join(run.dir, eid, file)).toString('base64')}`,
          });
          await flushStream(res, abort.signal);
        }
      }
      emit('audit', audit);
      await flushStream(res, abort.signal);
      emit('done', { id: run.id });
    } catch (e) {
      const message = run
        ? run.safeError(e)
        : 'Unable to start the run. Check your key, model access and provider availability.';
      if (!res.headersSent) json(res, 400, { error: message });
      else emit('error', { message });
    } finally {
      clearTimeout(deadline);
      clearInterval(heartbeat);
      res.off('close', disconnect);
      for (const server of [servers?.app, servers?.control])
        if (server) {
          server.closeAllConnections();
          await new Promise((r) => server.close(r));
        }
      if (dir) rmSync(dir, { recursive: true, force: true });
      router.apiKey = undefined;
      body.key = undefined;
      active--;
      if (!res.writableEnded) res.end();
    }
  };
}
