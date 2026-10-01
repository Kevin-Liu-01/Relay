import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createHash } from 'node:crypto';
import { RampRouter, requestEstimate } from '../runner/router.mjs';
import {
  DEFAULT_CONFIG,
  schedule,
  validateConfig,
  aggregate,
  pairedComparisons,
} from '../runner/design.mjs';
import { buildInput, parseAction, LLMS_TXT, SITE_GUIDE } from '../runner/protocol.mjs';
import { createServers } from '../server/server.mjs';
import { InterfaceEnvironment } from '../runner/interfaces.mjs';
import { Experiment } from '../runner/experiment.mjs';
import { createLab, ROOT } from '../runner/lab-server.mjs';
import { RelayEnvironment } from '../runner/environment.mjs';
import { TASK_IDS } from '../server/tasks.mjs';
import { exportRun } from '../runner/export.mjs';
import { buildAudit, auditJSONL, auditArchive } from '../runner/audit.mjs';
import { gunzipSync } from 'node:zlib';

test('audit includes complete input, state events and chain-bound artifacts without inference', () =>
  fixture(async ({ dir, environment }) => {
    const runRoot = join(dir, 'runs');
    const run = new Experiment({
      config: { ...DEFAULT_CONFIG, interfaces: ['api'] },
      root: ROOT,
      runRoot,
      environment,
    });
    await run.run();
    const audit = buildAudit({ runRoot, id: run.id });
    assert.equal(audit.integrity.status, 'verified', JSON.stringify(audit.integrity));
    const e = audit.episodes[0];
    assert.equal(e.trace.at(-1).kind, 'terminal');
    assert.ok(e.trace.every((r, i) => r.at && r.sequence === i + 1));
    assert.ok(e.initial.state && e.outcome.state);
    assert.ok(e.outcome.events.some((r) => r.kind === 'mutation'));
    assert.ok(e.inputs['request-001.json'].instructions);
    assert.ok(!JSON.stringify(audit).includes('test-control'));
    const jsonl = auditJSONL(audit).trim().split('\n').map(JSON.parse);
    assert.equal(jsonl.filter((r) => r.kind === 'trace_event').length, e.trace.length);
    const archive = gunzipSync(await auditArchive({ runRoot, id: run.id }));
    assert.ok(archive.includes(Buffer.from('audit.jsonl')));
    assert.ok(archive.includes(Buffer.from('initial.json')));
    assert.ok(archive.includes(Buffer.from('request-001.json')));
  }));

test('audit detects changed inputs, removed artifacts, truncated chains and malformed records', () =>
  fixture(async ({ dir, environment }) => {
    const runRoot = join(dir, 'runs');
    const run = new Experiment({
      config: { ...DEFAULT_CONFIG, interfaces: ['api'] },
      root: ROOT,
      runRoot,
      environment,
    });
    await run.run();
    const tracePath = join(run.dir, 'episode-001/steps.jsonl');
    const original = readFileSync(tracePath, 'utf8');
    for (const change of [
      original.replace('"finish"', '"wait"'),
      original.split('\n').slice(0, -2).join('\n'),
      original + 'null\n{broken\n',
    ]) {
      writeFileSync(tracePath, change);
      assert.equal(buildAudit({ runRoot, id: run.id }).integrity.status, 'failed');
    }
    writeFileSync(tracePath, original);
    const inputPath = join(run.dir, 'episode-001/request-001.json');
    const input = readFileSync(inputPath, 'utf8');
    writeFileSync(
      inputPath,
      input.replace('You are operating Relay', 'You are operating another app'),
    );
    assert.ok(
      buildAudit({ runRoot, id: run.id }).integrity.checks.some(
        (c) => !c.ok && c.name.startsWith('Prompt hash'),
      ),
    );
    writeFileSync(inputPath, input);
    rmSync(join(run.dir, 'episode-001/initial.json'));
    assert.equal(buildAudit({ runRoot, id: run.id }).integrity.status, 'failed');
  }));

test('legacy audit never invents missing request bodies or event timestamps', () =>
  fixture(async ({ dir, environment }) => {
    const runRoot = join(dir, 'runs');
    const run = new Experiment({
      config: { ...DEFAULT_CONFIG, interfaces: ['api'] },
      root: ROOT,
      runRoot,
      environment,
    });
    await run.run();
    const path = join(run.dir, 'episode-001/steps.jsonl');
    const events = readFileSync(path, 'utf8')
      .trim()
      .split('\n')
      .map(JSON.parse)
      .filter((r) => ['response', 'step', 'terminal'].includes(r.kind));
    let previousHash = '0'.repeat(64);
    for (const r of events) {
      for (const key of ['hash', 'at', 'sequence', 'elapsedMs', 'artifacts']) delete r[key];
      r.previousHash = previousHash;
      r.hash = createHash('sha256').update(JSON.stringify(r)).digest('hex');
      previousHash = r.hash;
    }
    writeFileSync(path, events.map(JSON.stringify).join('\n') + '\n');
    run.data.episodes[0].traceRoot = previousHash;
    delete run.data.auditVersion;
    writeFileSync(join(run.dir, 'episode-001/episode.json'), JSON.stringify(run.data.episodes[0]));
    run.persist();
    const audit = buildAudit({ runRoot, id: run.id });
    assert.equal(audit.integrity.status, 'partial');
    assert.deepEqual(audit.episodes[0].inputs, {});
    assert.ok(audit.integrity.gaps.some((s) => s.includes('timestamps')));
  }));

test('audit downloads are read-only, same-origin, credential-scanned and include every event', () =>
  fixture(async ({ dir, environment }) => {
    const runRoot = join(dir, 'runs');
    const run = new Experiment({
      config: { ...DEFAULT_CONFIG, interfaces: ['api'] },
      root: ROOT,
      runRoot,
      environment,
    });
    await run.run();
    const lab = createLab({
      runRoot,
      environment,
      routerFactory: () => {
        throw Error('Audit must not call a provider.');
      },
    });
    lab.server.listen(0, '127.0.0.1');
    await once(lab.server, 'listening');
    const base = `http://127.0.0.1:${lab.server.address().port}/api/runs/${run.id}`;
    try {
      const json = await fetch(base + '/audit');
      assert.equal(json.status, 200);
      assert.equal((await json.json()).integrity.status, 'verified');
      assert.equal(
        (await fetch(base + '/audit', { headers: { origin: 'https://evil.example' } })).status,
        403,
      );
      const lines = await fetch(base + '/audit.jsonl');
      assert.match(lines.headers.get('content-disposition'), /attachment/);
      assert.ok((await lines.text()).includes('trace_event'));
      const archive = await fetch(base + '/audit.tar.gz');
      assert.equal(archive.status, 200);
      assert.ok(
        gunzipSync(Buffer.from(await archive.arrayBuffer())).includes(Buffer.from('audit.json')),
      );
      writeFileSync(
        join(run.dir, 'episode-001/request-001.json'),
        JSON.stringify({ authorization: 'Bearer ' + 'test-control-secret-1234' }),
      );
      assert.equal((await fetch(base + '/audit')).status, 400);
      assert.equal((await fetch(base + '/audit.tar.gz')).status, 400);
      assert.equal((await fetch(base + '/episode-001/request-001.json')).status, 400);
    } finally {
      await new Promise((r) => lab.server.close(r));
    }
  }));

test('portable export refuses overwrites, active runs and leaked capabilities', () =>
  fixture(async ({ dir, environment }) => {
    const runRoot = join(dir, 'runs'),
      run = new Experiment({
        config: { ...DEFAULT_CONFIG, interfaces: ['api'] },
        root: ROOT,
        runRoot,
        environment,
      });
    assert.throws(
      () => exportRun({ runRoot, id: run.id, destination: join(dir, 'early') }),
      /Finish or stop/,
    );
    await run.run();
    const destination = join(dir, 'portable');
    const result = exportRun({ runRoot, id: run.id, destination });
    assert.ok(result.files >= 4);
    assert.throws(() => exportRun({ runRoot, id: run.id, destination }), /overwrite/);
    writeFileSync(join(run.dir, 'leak.json'), JSON.stringify({ url: '/s/' + 'a'.repeat(64) }));
    assert.throws(
      () => exportRun({ runRoot, id: run.id, destination: join(dir, 'unsafe') }),
      /Credential/,
    );
  }));

test('unpriced models, zero-cost coercion and credential-shaped config fields fail closed', () => {
  for (const rates of [
    { input: 0, output: 0 },
    { input: 0.1, output: 0 },
    { input: 0.1, output: 0.5, apiKey: 'never-log' },
  ])
    assert.throws(() => validateConfig(liveConfig({ models: [{ id: 'unknown-model', rates }] })));
  assert.throws(() => validateConfig({ ...liveConfig(), apiKey: 'never-log' }), /credentials/);
});

test('failed/incomplete provider responses and impossible usage cannot produce actions', async () => {
  const good = {
    model: 'test-model',
    status: 'completed',
    output: [{ type: 'message', content: [{ type: 'output_text', text: '{"type":"finish"}' }] }],
    usage: { input_tokens: 5, output_tokens: 3 },
  };
  for (const patch of [
    { status: 'failed' },
    { status: 'incomplete' },
    { usage: { input_tokens: -1, output_tokens: 3 } },
    { usage: { input_tokens: 1.5, output_tokens: 3 } },
    { usage: { input_tokens: 5, output_tokens: 3, input_tokens_details: { cached_tokens: 6 } } },
  ]) {
    const router = new RampRouter({
      apiKey: 'test',
      fetchImpl: async () => new Response(JSON.stringify({ ...good, ...patch })),
    });
    await assert.rejects(
      router.respond({ model: 'test-model', instructions: '', input: [], maxOutputTokens: 128 }),
      (e) => e.code === 'provider_receipt_invalid',
    );
  }
});

test('undisclosed message aliases are rejected, then disclosed aliases work', () =>
  fixture(async ({ environment }) => {
    const env = new InterfaceEnvironment({ ...environment, mode: 'api' });
    try {
      const { observation } = await env.reset({ taskId: 'incident-triage', seed: 42 });
      for (let i = 1; i < 100; i++) assert.throws(() => env.resolve(`m${i}`), /Unknown ID/);
      const channelId = observation.result.channels.find((c) => c.name === 'incidents').id;
      await env.act({ type: 'messages', channelId });
      const messages = (await env.observe()).result.messages;
      const target = messages.find((m) => m.text.includes('elevated latency'));
      await env.act({ type: 'pin.toggle', id: target.id });
      assert.equal(
        (await env.export()).state.messages.find((m) => m.id === 'incident-target').pinned,
        true,
      );
    } finally {
      await env.close();
    }
  }));

test('all API reference workflows pass across two fixture seeds without hidden answer lookup', () =>
  fixture(async ({ dir, environment }) => {
    const run = new Experiment({
      config: { ...DEFAULT_CONFIG, tasks: TASK_IDS, interfaces: ['api'], seeds: [42, 43] },
      root: ROOT,
      runRoot: join(dir, 'runs'),
      environment,
    });
    const out = await run.run();
    assert.equal(out.episodes.length, TASK_IDS.length * 2);
    for (const e of out.episodes) {
      assert.equal(e.status, 'completed', JSON.stringify(e));
      assert.equal(e.evaluation.reward, 1, JSON.stringify(e));
      assert.ok(e.appProvenance.backendHash && e.appProvenance.buildHash);
    }
  }));

test('Router 403 stops the matrix before actions, keeps diagnostic grade and unknown accounting, and clears in-flight state', () =>
  fixture(async ({ dir, environment }) => {
    let requests = 0;
    const router = new RampRouter({
      apiKey: 'fake-403-lab-key',
      fetchImpl: async (url) => {
        if (url.endsWith('/models'))
          return new Response(JSON.stringify({ data: [{ id: 'test-model' }] }));
        requests++;
        return new Response('private-error-body', {
          status: 403,
          headers: { 'x-request-id': 'failure-403-test' },
        });
      },
    });
    const run = new Experiment({
      config: liveConfig({ tasks: ['channel-topic', 'thread-reply'] }),
      root: ROOT,
      runRoot: join(dir, 'runs'),
      environment,
      router,
    });
    const out = await run.run(),
      episode = out.episodes[0];
    assert.equal(requests, 1);
    assert.equal(episode.status, 'provider_unavailable');
    assert.equal(episode.steps, 0);
    assert.equal(episode.inFlight, false);
    assert.equal(episode.evaluation.success, false);
    assert.equal(episode.providerFailure.requestId, 'failure-403-test');
    assert.equal(episode.providerFailure.httpStatus, 403);
    assert.equal(out.episodes[1].status, 'queued');
    assert.equal(out.budget.usageKnown, false);
    assert.ok(out.budget.estimatedUSD > 0);
    assert.doesNotMatch(JSON.stringify(out), /private-error-body|fake-403-lab-key/);
    assert.equal(out.summary[0].errors, 1);
    assert.equal(out.summary[0].passed, 0);
  }));

test('cancelling an in-flight response stops new actions and retains uncertain spend', () =>
  fixture(async ({ dir, environment }) => {
    let entered;
    const ready = new Promise((r) => (entered = r));
    const router = fakeRouter(
      ({ signal }) =>
        new Promise((_, reject) => {
          entered();
          signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        }),
    );
    const run = new Experiment({
      config: liveConfig(),
      root: ROOT,
      runRoot: join(dir, 'runs'),
      environment,
      router,
    });
    const pending = run.run();
    await ready;
    run.cancel();
    const out = await pending;
    assert.equal(out.status, 'cancelled');
    assert.equal(out.episodes[0].steps, 0);
    assert.equal(out.episodes[0].evaluation.reward, 0);
    assert.equal(out.budget.usageKnown, false);
    assert.ok(out.budget.estimatedUSD > 0);
  }));

test('restart marks in-flight usage unknown, recomputes errors and never resubmits', () =>
  fixture(async ({ dir, environment }) => {
    const runRoot = join(dir, 'runs'),
      run = new Experiment({
        config: liveConfig(),
        root: ROOT,
        runRoot,
        environment,
        launcher: 'console',
      });
    const data = run.data;
    data.status = 'running';
    data.episodes[0].status = 'running';
    data.episodes[0].inFlight = true;
    data.budget.estimatedUSD = 0.01;
    data.budget.requests = 1;
    writeFileSync(join(run.dir, 'run.json'), JSON.stringify(data));
    let calls = 0;
    const lab = createLab({
      runRoot,
      environment,
      routerFactory: () => {
        calls++;
        throw Error('must not call');
      },
    });
    const recovered = lab.runs.get(run.id);
    assert.equal(recovered.status, 'interrupted');
    assert.equal(recovered.budget.usageKnown, false);
    assert.equal(recovered.budget.estimatedUSD, 0.01);
    assert.equal(recovered.summary[0].attempted, 1);
    assert.equal(recovered.summary[0].errors, 1);
    assert.equal(calls, 0);
  }));

test('console restart never overwrites an active CLI checkpoint; imports it after completion', () =>
  fixture(async ({ dir, environment }) => {
    const runRoot = join(dir, 'runs');
    const run = new Experiment({
      config: liveConfig(),
      root: ROOT,
      runRoot,
      environment,
      launcher: 'cli',
    });
    run.data.status = 'running';
    run.data.episodes[0].status = 'running';
    run.data.episodes[0].inFlight = true;
    run.persist();
    const path = join(run.dir, 'run.json');
    const before = readFileSync(path, 'utf8');
    const lab = createLab({ runRoot, environment });
    assert.equal(readFileSync(path, 'utf8'), before);
    assert.equal(lab.runs.has(run.id), false);
    lab.server.listen(0, '127.0.0.1');
    await once(lab.server, 'listening');
    try {
      run.data.status = 'cancelled';
      run.data.episodes[0].status = 'cancelled';
      run.persist();
      const rows = await (
        await fetch(`http://127.0.0.1:${lab.server.address().port}/api/runs`)
      ).json();
      assert.equal(rows.find((r) => r.id === run.id).status, 'cancelled');
    } finally {
      await new Promise((r) => lab.server.close(r));
    }
  }));

test('overlapping streamed starts admit exactly one active run', () =>
  fixture(async ({ dir, environment }) => {
    let release;
    const gate = new Promise((r) => (release = r));
    let calls = 0;
    const router = {
      models: async () => {
        calls++;
        await gate;
        return { models: [{ id: 'test-model' }] };
      },
      respond: async () => ({
        text: '{"type":"finish"}',
        usage: { inputTokens: 1, outputTokens: 1 },
        latencyMs: 1,
      }),
    };
    const lab = createLab({
      runRoot: join(dir, 'runs'),
      environment,
      routerFactory: () => router,
      keyPresent: () => true,
    });
    lab.server.listen(0, '127.0.0.1');
    await once(lab.server, 'listening');
    const port = lab.server.address().port;
    try {
      const { csrf } = await (await fetch(`http://127.0.0.1:${port}/api/config`)).json(),
        payload = JSON.stringify(liveConfig());
      const open = () => {
        let resolveResult;
        const result = new Promise((r) => (resolveResult = r));
        const request = http.request(
          {
            host: '127.0.0.1',
            port,
            path: '/api/runs',
            method: 'POST',
            headers: { 'x-lab-token': csrf, 'content-type': 'application/json' },
          },
          (r) => {
            r.resume();
            r.on('end', () => resolveResult(r.statusCode));
          },
        );
        request.write(payload.slice(0, 10));
        return { request, result };
      };
      const a = open(),
        b = open();
      await new Promise((r) => setTimeout(r, 30));
      a.request.end(payload.slice(10));
      b.request.end(payload.slice(10));
      assert.deepEqual((await Promise.all([a.result, b.result])).sort(), [202, 409]);
      assert.equal(calls, 1);
      lab.cancel();
      release();
      while (lab.active) await new Promise((r) => setTimeout(r, 10));
    } finally {
      release();
      lab.cancel();
      await new Promise((r) => lab.server.close(r));
    }
  }));

test('all control operations have bounded network waits, including cleanup', async () => {
  const stalled = http.createServer(() => {});
  stalled.listen(0, '127.0.0.1');
  await once(stalled, 'listening');
  const env = new RelayEnvironment({
    controlURL: `http://127.0.0.1:${stalled.address().port}`,
    controlToken: 'test',
    controlTimeoutMs: 25,
  });
  try {
    for (const [path, method] of [
      ['/sessions', 'POST'],
      ['/sessions/x/evaluate', 'GET'],
      ['/sessions/x/export', 'GET'],
      ['/sessions/x', 'DELETE'],
    ])
      await assert.rejects(env.control(path, method));
  } finally {
    stalled.closeAllConnections();
    await new Promise((r) => stalled.close(r));
  }
});

const liveConfig = (patch = {}) => ({
  ...DEFAULT_CONFIG,
  provider: 'ramp',
  models: [{ id: 'test-model', rates: { input: 0.1, output: 0.5 }, vision: true }],
  interfaces: ['api'],
  ...patch,
});
async function fixture(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'relay-lab-test-'));
  const servers = createServers({ dataDir: join(dir, 'app'), controlToken: 'test-control' });
  servers.app.listen(0, '127.0.0.1');
  servers.control.listen(0, '127.0.0.1');
  await Promise.all([once(servers.app, 'listening'), once(servers.control, 'listening')]);
  const environment = {
    appURL: `http://127.0.0.1:${servers.app.address().port}`,
    controlURL: `http://127.0.0.1:${servers.control.address().port}`,
    controlToken: 'test-control',
  };
  try {
    return await fn({ dir, servers, environment });
  } finally {
    await Promise.all([
      new Promise((r) => servers.app.close(r)),
      new Promise((r) => servers.control.close(r)),
    ]);
    rmSync(dir, { recursive: true, force: true });
  }
}
const fakeRouter = (respond) => ({
  models: async () => ({ at: 'test', hash: 'test-catalog', models: [{ id: 'test-model' }] }),
  respond,
});
for (const failure of ['initial', 'during-run', 'final']) {
  test(`operator screenshot timeout ${failure} preserves task execution and records the evidence gap`, () =>
    fixture(async ({ dir, environment }) => {
      let screenshots = 0;
      const run = new Experiment({
        config: { ...DEFAULT_CONFIG, tasks: ['channel-topic'], interfaces: ['a11y'] },
        root: ROOT,
        runRoot: join(dir, 'runs'),
        operatorVisuals: true,
        environment: {
          ...environment,
          onPage: async (page) => {
            const screenshot = page.screenshot.bind(page);
            page.screenshot = async (...args) => {
              screenshots++;
              if (screenshots >= { initial: 1, 'during-run': 2, final: 5 }[failure]) {
                const error = new Error('page.screenshot: Timeout 2500ms exceeded.');
                error.name = 'TimeoutError';
                throw error;
              }
              return screenshot(...args);
            };
          },
        },
      });
      const result = await run.run();
      const e = result.episodes[0];
      assert.equal(e.status, 'completed', e.error);
      assert.equal(e.evaluation.success, true);
      assert.equal(e.steps, 4);
      assert.ok(e.captureWarnings.length > 0);
      const audit = buildAudit({ runRoot: join(dir, 'runs'), id: run.id });
      assert.equal(audit.integrity.status, 'verified');
      assert.ok(audit.episodes[0].trace.some((r) => r.kind === 'capture_warning'));
      assert.ok(audit.episodes[0].trace.some((r) => r.kind === 'replay_final' && r.replay));
    }));
}
test('pixel policy screenshot failure remains fatal rather than reusing a stale observation', async () => {
  const env = new InterfaceEnvironment({ mode: 'pixels', controlToken: 'test-control' });
  env.base.page = {
    screenshot: async () => {
      throw new Error('capture failed');
    },
  };
  await assert.rejects(env.observe(), /capture failed/);
});
test('screenshot deadlines do not inherit the short action timeout', async () => {
  const env = new InterfaceEnvironment({ mode: 'pixels', controlToken: 'test-control' });
  const deadlines = [];
  env.base.page = {
    screenshot: async (options) => {
      deadlines.push(options.timeout);
      return Buffer.from('screenshot-test');
    },
  };
  await env.observe();
  await env.screenshot();
  assert.deepEqual(deadlines, [10000, 5000]);
});
test('paired factorial schedule is complete, unique, reproducible and shuffled', () => {
  const c = liveConfig({
    tasks: ['thread-reply', 'edit-message'],
    seeds: [1, 2],
    guides: [false, true],
    histories: ['full', 'recent-4'],
    interfaces: ['pixels', 'a11y', 'json-ui', 'api'],
    repeats: 2,
  });
  const a = schedule(c),
    b = schedule(c);
  assert.deepEqual(a, b);
  assert.equal(a.length, 128);
  assert.equal(
    new Set(a.map((x) => JSON.stringify([x.block, x.mode, x.guide, x.history, x.model.id]))).size,
    128,
  );
  assert.notDeepEqual(a, schedule({ ...c, orderSeed: 123 }));
  for (const block of new Set(a.map((x) => x.block)))
    assert.equal(a.filter((x) => x.block === block).length, 16);
});
test('invalid matrices, absent prices and unverified vision are rejected before requests', () => {
  for (const patch of [
    { maxSteps: 0 },
    { guides: [] },
    { interfaces: ['shell'] },
    { models: [{ id: 'x' }] },
    { models: [{ id: 'x', rates: { input: 1, output: 1 } }], interfaces: ['pixels'] },
    { seeds: [1, 1] },
  ])
    assert.throws(() => validateConfig(liveConfig(patch)));
  assert.throws(() => validateConfig({ ...DEFAULT_CONFIG, interfaces: ['pixels'] }), /screenshot/);
});
test('history intervention retains task and guide, not omitted turns', () => {
  const turns = Array.from({ length: 8 }, (_, i) => ({
    observation: { text: `obs-${i}` },
    output: '{"type":"wait"}',
  }));
  const input = buildInput({
    instruction: 'fixed task',
    mode: 'a11y',
    guide: true,
    history: 'recent-4',
    turns,
    observation: { text: 'current' },
  });
  const text = JSON.stringify(input);
  assert.ok(text.includes('fixed task') && text.includes('obs-4') && !text.includes('obs-3'));
  assert.ok(input.instructions.includes(LLMS_TXT) && input.instructions.includes(SITE_GUIDE));
  assert.ok(
    !JSON.stringify(
      buildInput({
        instruction: 'x',
        mode: 'a11y',
        guide: false,
        history: 'full',
        turns: [],
        observation: { text: 'current' },
      }),
    ).includes(LLMS_TXT),
  );
  assert.throws(() => parseAction('[{"type":"wait"}]'));
  assert.throws(() => parseAction('{"action":"wait"}'));
});
test('Router uses Responses endpoint, no fallback, records returned identity and usage', async () => {
  const calls = [];
  const router = new RampRouter({
    apiKey: 'test-secret',
    fetchImpl: async (url, init) => {
      calls.push({ url, init });
      return new Response(
        JSON.stringify({
          model: 'resolved-model',
          status: 'completed',
          output: [
            { type: 'reasoning', summary: [] },
            { type: 'message', content: [{ type: 'output_text', text: '{"type":"finish"}' }] },
          ],
          usage: {
            input_tokens: 12,
            output_tokens: 8,
            output_tokens_details: { reasoning_tokens: 2 },
          },
        }),
        { headers: { 'x-trace-id': 'trace-1' } },
      );
    },
  });
  const r = await router.respond({
    model: 'test-model',
    instructions: 'i',
    input: [],
    maxOutputTokens: 128,
  });
  assert.equal(calls[0].url, 'https://api.router.com/v1/responses');
  const payload = JSON.parse(calls[0].init.body);
  assert.equal(payload.store, false);
  assert.equal(payload.allow_flex_tier, false);
  assert.equal(payload.models, undefined);
  assert.equal(payload.max_output_tokens, 128);
  assert.equal(r.returnedModel, 'resolved-model');
  assert.equal(r.traceId, 'trace-1');
  assert.equal(r.usage.reasoningTokens, 2);
  assert.ok(!JSON.stringify(r).includes('test-secret'));
});
test('Router errors never echo secrets and retry count stays one', async () => {
  let calls = 0;
  const r = new RampRouter({
    apiKey: 'secret-sentinel',
    fetchImpl: async () => {
      calls++;
      return new Response('secret-sentinel', { status: 401 });
    },
  });
  await assert.rejects(
    r.respond({ model: 'x', input: [], instructions: '', maxOutputTokens: 128 }),
    (e) => !e.message.includes('secret-sentinel'),
  );
  assert.equal(calls, 1);
  assert.throws(() => new RampRouter({ apiKey: 'x', baseURL: 'https://evil.example/v1' }), /only/);
  await assert.rejects(new RampRouter({ apiKey: '' }).models(), /RAMP_ROUTER_API_KEY/);
});
test('incomplete Router receipts preserve safe reasons and usage without executing partial output', async () => {
  for (const reason of ['max_output_tokens', 'content_filter', 'secret-sentinel']) {
    let calls = 0;
    const router = new RampRouter({
      apiKey: 'secret-sentinel',
      fetchImpl: async () => {
        calls++;
        return new Response(
          JSON.stringify({
            status: 'incomplete',
            incomplete_details: { reason },
            output: [
              { type: 'message', content: [{ type: 'output_text', text: '{"type":"finish"}' }] },
            ],
            usage: {
              input_tokens: 100,
              output_tokens: 512,
              output_tokens_details: { reasoning_tokens: 512 },
            },
          }),
        );
      },
    });
    await assert.rejects(
      router.respond({ model: 'test-model', instructions: '', input: [], maxOutputTokens: 512 }),
      (error) => {
        assert.equal(error.code, 'provider_receipt_invalid');
        assert.equal(error.receipt.incompleteReason, reason === 'secret-sentinel' ? null : reason);
        assert.equal(error.receipt.usage.outputTokens, 512);
        assert.equal(error.receipt.usage.reasoningTokens, 512);
        assert.equal(error.receipt.text, undefined);
        assert.ok(!JSON.stringify(error.receipt).includes('secret-sentinel'));
        return true;
      },
    );
    assert.equal(calls, 1);
  }
});
test('request accounting includes guide, history and images; not just generated text', () => {
  const plain = requestEstimate({ input: 'a' }, { input: 1, output: 2 }, 128),
    image = requestEstimate(
      { input: [{ image_url: 'data:image/png;base64,example' }] },
      { input: 1, output: 2 },
      128,
    );
  assert.ok(image.inputUpper > 8192);
  assert.ok(image.usd > plain.usd);
  assert.equal(plain.usd, (plain.inputUpper + 256) / 1e6);
});
test('API gateway exposes opaque actor IDs, never evaluator controls, preserves isolation', () =>
  fixture(async ({ environment, servers }) => {
    const a = new InterfaceEnvironment({ ...environment, mode: 'api' }),
      b = new InterfaceEnvironment({ ...environment, mode: 'api' });
    try {
      const start = await a.reset({ taskId: 'channel-topic', seed: 42 });
      const other = await b.reset({ taskId: 'channel-topic', seed: 42 });
      assert.equal(a.initialHash, b.initialHash);
      assert.ok(!JSON.stringify(start.observation).includes('qa-target'));
      const id = start.observation.result.channels.find((c) => c.name.startsWith('proj-')).id;
      await assert.rejects(a.act({ type: 'evaluate' }), /not allowed/);
      await assert.rejects(
        a.act({ type: 'message.edit', id: 'qa-target', text: 'hack' }),
        /Unknown ID/,
      );
      await a.act({
        type: 'channel.topic',
        channelId: id,
        topic: 'Launch review · 15:00 UTC · Bring the final checklist',
      });
      assert.equal((await a.evaluate()).reward, 1);
      assert.equal((await b.evaluate()).reward, 0);
      assert.deepEqual(other.observation, await b.observe());
      const exported = await a.export();
      assert.ok(!JSON.stringify(exported).includes(a.base.session.token));
    } finally {
      await a.close();
      await b.close();
    }
    assert.equal(readdirSync(servers.store.root).filter((x) => x.endsWith('.sqlite')).length, 0);
  }));
test('live-style fake transport executes observed action, grades and persists a hash chain', () =>
  fixture(async ({ dir, environment }) => {
    let calls = 0;
    const router = fakeRouter(async ({ input }) => {
      const o = JSON.parse(input.at(-1).content[0].text);
      const action =
        calls++ === 0
          ? {
              type: 'channel.topic',
              channelId: o.result.channels.find((c) => c.name.startsWith('proj-')).id,
              topic: 'Launch review · 15:00 UTC · Bring the final checklist',
            }
          : { type: 'finish' };
      return {
        text: JSON.stringify(action),
        usage: { inputTokens: 100, outputTokens: 20 },
        latencyMs: 1,
        requestedModel: 'test-model',
        returnedModel: 'resolved-test',
      };
    });
    const run = new Experiment({
      config: liveConfig(),
      root: ROOT,
      runRoot: join(dir, 'runs'),
      environment,
      router,
    });
    const out = await run.run();
    assert.equal(out.status, 'completed');
    assert.equal(out.episodes[0].evaluation.reward, 1);
    assert.equal(out.budget.requests, 2);
    const lines = readFileSync(join(run.dir, 'episode-001/steps.jsonl'), 'utf8')
      .trim()
      .split('\n')
      .map(JSON.parse);
    let previous = '0'.repeat(64);
    for (const { hash, ...value } of lines) {
      assert.equal(value.previousHash, previous);
      assert.equal(hash, createHash('sha256').update(JSON.stringify(value)).digest('hex'));
      previous = hash;
    }
    assert.equal(out.episodes[0].traceRoot, previous);
    assert.ok(!readFileSync(join(run.dir, 'run.json'), 'utf8').includes('test-control'));
  }));
test('dollar reservation stops before sending; missing usage stops and is not free', () =>
  fixture(async ({ dir, environment }) => {
    let calls = 0;
    const router = fakeRouter(async () => {
      calls++;
      return { text: '{"type":"finish"}', usage: null, latencyMs: 1 };
    });
    const limited = new Experiment({
      config: liveConfig({ maxEstimatedUSD: 0.00000001 }),
      root: ROOT,
      runRoot: join(dir, 'budget'),
      environment,
      router,
    });
    const first = await limited.run();
    assert.equal(calls, 0);
    assert.equal(first.episodes[0].status, 'budget');
    const unknown = new Experiment({
      config: liveConfig(),
      root: ROOT,
      runRoot: join(dir, 'unknown'),
      environment,
      router,
    });
    const second = await unknown.run();
    assert.equal(calls, 1);
    assert.equal(second.budget.usageKnown, false);
    assert.ok(second.budget.estimatedUSD > 0);
    assert.equal(second.status, 'stopped');
  }));
test('invalid model outputs consume attempts; no-op cannot satisfy grader', () =>
  fixture(async ({ dir, environment }) => {
    let i = 0;
    const router = fakeRouter(async () => ({
      text: i++ === 0 ? 'not json' : '{"type":"finish"}',
      usage: { inputTokens: 1, outputTokens: 1 },
      latencyMs: 1,
    }));
    const run = new Experiment({
      config: liveConfig(),
      root: ROOT,
      runRoot: join(dir, 'runs'),
      environment,
      router,
    });
    const out = await run.run();
    assert.equal(out.episodes[0].steps, 2);
    assert.equal(out.episodes[0].evaluation.reward, 0);
    assert.equal(out.summary[0].passed, 0);
  }));
test('comparison denominators include errors and exclude unattempted cells; pairs retain fixed factors', () => {
  const cell = schedule(liveConfig({ guides: [false, true] }))[0];
  const episodes = [
    { cell, status: 'completed', evaluation: { reward: 1, success: true }, steps: 2 },
    {
      cell: { ...cell, guide: !cell.guide },
      status: 'completed',
      evaluation: { reward: 0, success: false },
      steps: 5,
    },
    { cell, status: 'provider_error', steps: 0 },
    { cell, status: 'queued' },
  ];
  assert.equal(
    aggregate(episodes).reduce((n, x) => n + x.attempted, 0),
    3,
  );
  const p = pairedComparisons(episodes);
  assert.equal(p.length, 1);
  assert.equal(p[0].pairs, 1);
  assert.equal(p[0].heldFixed.mode, 'api');
});
test('operator server rejects cross-origin, CSRF, credentialless runs and arbitrary artifact paths', () =>
  fixture(async ({ dir, environment }) => {
    const lab = createLab({ runRoot: join(dir, 'runs'), environment, keyPresent: () => false });
    lab.server.listen(0, '127.0.0.1');
    await once(lab.server, 'listening');
    const base = `http://127.0.0.1:${lab.server.address().port}`;
    try {
      assert.equal(
        (await fetch(base + '/api/config', { headers: { origin: environment.appURL } })).status,
        403,
      );
      assert.equal((await fetch(base + '/api/runs', { method: 'POST', body: '{}' })).status, 403);
      const c = await (await fetch(base + '/api/config')).json();
      const r = await fetch(base + '/api/runs', {
        method: 'POST',
        headers: { 'x-lab-token': c.csrf, 'content-type': 'application/json' },
        body: JSON.stringify(liveConfig()),
      });
      assert.equal(r.status, 400);
      assert.equal((await fetch(base + '/.env')).status, 404);
      assert.equal((await fetch(base + '/api/runs/../../.runtime/control-token')).status, 404);
      assert.ok(!JSON.stringify(c).includes('test-control'));
      assert.equal(lab.runs.size, 0);
    } finally {
      await new Promise((r) => lab.server.close(r));
    }
  }));
