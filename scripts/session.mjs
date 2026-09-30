import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
const args = process.argv.slice(2),
  command = args[0] ?? 'create';
const control = process.env.CONTROL_URL ?? 'http://127.0.0.1:4319';
const key =
  process.env.CONTROL_TOKEN ??
  readFileSync(
    process.env.DATA_DIR
      ? resolve(process.env.DATA_DIR, 'control-token')
      : new URL('../.runtime/control-token', import.meta.url),
    'utf8',
  ).trim();
const request = async (path, method = 'GET', body) => {
  const r = await fetch(`${control}${path}`, {
    method,
    headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok) throw Error(data.error);
  return data;
};
if (command === 'create') {
  const s = await request('/sessions', 'POST', {
    taskId: args[1] ?? 'thread-reply',
    seed: Number(args[2] ?? 42),
  });
  console.log(
    JSON.stringify(
      { ...s, url: `${process.env.APP_URL ?? 'http://localhost:4318'}/s/${s.token}` },
      null,
      2,
    ),
  );
} else if (command === 'tasks') console.log(JSON.stringify(await request('/tasks'), null, 2));
else if (command === 'evaluate')
  console.log(JSON.stringify(await request(`/sessions/${args[1]}/evaluate`), null, 2));
else if (command === 'reset')
  console.log(JSON.stringify(await request(`/sessions/${args[1]}/reset`, 'POST'), null, 2));
else if (command === 'close')
  console.log(JSON.stringify(await request(`/sessions/${args[1]}`, 'DELETE'), null, 2));
else if (command === 'export') {
  const data = await request(`/sessions/${args[1]}/export`),
    dir = resolve(args[2] ?? `artifacts/${data.session.id}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/trajectory.json`, JSON.stringify(data, null, 2) + '\n', { flag: 'wx' });
  writeFileSync(
    `${dir}/events.jsonl`,
    data.events.map((e) => JSON.stringify(e)).join('\n') + '\n',
    { flag: 'wx' },
  );
  console.log(dir);
} else
  throw Error(
    'Commands: create [task] [seed], tasks, evaluate TOKEN, reset TOKEN, close TOKEN, export TOKEN [directory]',
  );
