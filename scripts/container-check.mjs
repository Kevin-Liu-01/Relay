import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
const docker = (...args) =>
  execFileSync('docker', args, { encoding: 'utf8', timeout: 60000 }).trim();
const name = `relay-verification-${process.pid}`;
let created = false;
const app = 'http://127.0.0.1:4328',
  control = 'http://127.0.0.1:4329';
async function ready() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(app + '/health')).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw Error('Container did not become healthy.');
}
try {
  docker(
    'run',
    '-d',
    '--name',
    name,
    '--cap-drop=ALL',
    '--security-opt=no-new-privileges',
    '-p',
    '127.0.0.1:4328:4318',
    '-p',
    '127.0.0.1:4329:4319',
    'relay-slack:local',
  );
  created = true;
  await ready();
  const key = docker('exec', name, 'cat', '/data/control-token');
  const op = async (path, method = 'GET', body) => {
    const r = await fetch(control + path, {
      method,
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) throw Error(`Control status ${r.status}`);
    return r.json();
  };
  const a = await op('/sessions', 'POST', { taskId: 'edit-message', seed: 42 }),
    b = await op('/sessions', 'POST', { taskId: 'edit-message', seed: 42 });
  const r = await fetch(app + '/api/action', {
    method: 'POST',
    headers: { 'x-session-token': a.token, 'content-type': 'application/json' },
    body: JSON.stringify({
      requestId: randomUUID(),
      revision: 0,
      action: {
        type: 'message.edit',
        id: 'launch-old',
        text: 'Launch review is at 15:00 UTC. Please bring the final checklist.',
      },
    }),
  });
  if (!r.ok) throw Error(`Mutation status ${r.status}`);
  const first = await op(`/sessions/${a.token}/evaluate`),
    other = await op(`/sessions/${b.token}/evaluate`);
  if (!first.success || other.success) throw Error('Isolation check failed');
  docker('restart', name);
  await ready();
  const restart = await op(`/sessions/${a.token}/evaluate`);
  if (!restart.success) throw Error('Restart recovery failed');
  const served = await fetch(app + `/s/${a.token}`);
  if (!served.ok || !(await served.text()).includes('Relay')) throw Error('App HTML absent');
  const meta = JSON.parse(docker('image', 'inspect', 'relay-slack:local'))[0];
  const report = {
    at: new Date().toISOString(),
    imageId: meta.Id,
    os: meta.Os,
    architecture: meta.Architecture,
    imageSizeBytes: meta.Size,
    user: meta.Config.User,
    checks: {
      applicationServed: true,
      mutationAndGrade: true,
      sessionIsolation: true,
      containerRestartPersistence: true,
      nonRoot: meta.Config.User === 'node',
    },
    limitations:
      'One local Docker/Colima runtime. No browser in container, no scale or hostile-code claims.',
  };
  mkdirSync('evidence', { recursive: true });
  writeFileSync('evidence/container.json', JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  if (created) {
    docker('rm', '-f', name);
    console.log('Removed only the temporary verification container and its disposable state.');
  }
}
