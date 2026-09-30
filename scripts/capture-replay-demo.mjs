// Refresh only this explicitly scripted, no-inference replay. Never rewrite model evidence.
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { createServers } from '../server/server.mjs';
import { Experiment } from '../runner/experiment.mjs';
import { DEFAULT_CONFIG } from '../runner/design.mjs';
import { buildAudit } from '../runner/audit.mjs';
import { assertSafeEvidence } from '../runner/export.mjs';
import { ROOT } from '../hosted/service.mjs';
const temporary = mkdtempSync(join(tmpdir(), 'relay-reference-replay-'));
const servers = createServers({
  dataDir: temporary,
  controlToken: randomBytes(32).toString('hex'),
  allowDemo: false,
});
const events = [],
  artifacts = {};
try {
  servers.app.listen(0, '127.0.0.1');
  await once(servers.app, 'listening');
  servers.control.listen(0, '127.0.0.1');
  await once(servers.control, 'listening');
  const experiment = new Experiment({
    root: ROOT,
    runRoot: join(temporary, 'runs'),
    operatorVisuals: true,
    config: { ...DEFAULT_CONFIG, interfaces: ['a11y'], maxSteps: 5, runSeconds: 60 },
    environment: {
      appURL: `http://127.0.0.1:${servers.app.address().port}`,
      controlURL: `http://127.0.0.1:${servers.control.address().port}`,
      controlToken: servers.controlToken,
    },
    onRecord: (episodeId, event) => events.push({ episodeId, event }),
  });
  const run = await experiment.run();
  const audit = buildAudit({
    runRoot: join(temporary, 'runs'),
    id: run.id,
    secrets: [servers.controlToken],
  });
  if (
    !run.episodes.every((e) => e.evaluation?.success) ||
    audit.integrity.status !== 'verified' ||
    !events.some((e) => e.event.replay?.version === 1)
  )
    throw Error('Reference replay failed validation.');
  for (const e of run.episodes)
    for (const name of readdirSync(join(experiment.dir, e.cell.episodeId)))
      if (name.endsWith('.png'))
        artifacts[`${e.cell.episodeId}/${name}`] =
          `data:image/png;base64,${readFileSync(join(experiment.dir, e.cell.episodeId, name)).toString('base64')}`;
  const record = { run, events, artifacts, audit, capturedAt: new Date().toISOString() };
  const json = JSON.stringify(record);
  assertSafeEvidence(json, [servers.controlToken]);
  mkdirSync(join(ROOT, 'evidence/replay'), { recursive: true });
  writeFileSync(join(ROOT, 'evidence/replay/reference-topic.json'), json);
  console.log(
    JSON.stringify({
      kind: run.evidenceKind,
      success: true,
      frames: events.filter((e) => e.event.replay).length,
      audit: audit.integrity.status,
    }),
  );
} finally {
  await Promise.all(
    [servers.app, servers.control].map(
      (s) =>
        new Promise((resolve) => {
          s.closeAllConnections();
          s.close(resolve);
        }),
    ),
  );
  rmSync(temporary, { recursive: true, force: true });
}
