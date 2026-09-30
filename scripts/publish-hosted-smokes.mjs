import { mkdirSync, readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { assertSafeEvidence } from '../runner/export.mjs';

// Explicit IDs only: never sweep private history into the public repository.
const ids = process.argv.slice(2);
if (!ids.length || ids.some((id) => !/^[a-f0-9-]{36}$/.test(id)))
  throw Error('Provide explicit completed hosted-smoke UUIDs to publish.');
const dest = 'evidence/hosted';
mkdirSync(dest, { recursive: true });
for (const id of ids) {
  const bytes = readFileSync(`.runtime/hosted-smokes/${id}.json`);
  assertSafeEvidence(bytes.toString(), [
    process.env.RAMP_ROUTER_API_KEY,
    process.env.TYPESAFE_API_KEY,
  ]);
  const data = JSON.parse(bytes);
  if (data.run?.id !== id || !data.summary?.completedStream || !data.audit)
    throw Error('Expected a completed smoke capture with its original audit.');
  if (existsSync(`${dest}/${id}.json`)) throw Error('Refusing to overwrite published evidence.');
  writeFileSync(`${dest}/${id}.json`, bytes, { flag: 'wx' });
}
const runs = readdirSync(dest)
  .filter((p) => /^[a-f0-9-]{36}\.json$/.test(p))
  .sort()
  .map((path) => {
    const bytes = readFileSync(`${dest}/${path}`),
      data = JSON.parse(bytes);
    return { ...data.summary, path, sha256: createHash('sha256').update(bytes).digest('hex') };
  });
writeFileSync(
  `${dest}/summary.json`,
  JSON.stringify(
    {
      evidenceKind: 'bounded-hosted-model-smokes',
      limitations:
        'Synthetic development tasks, one episode per condition, sequential deployment checks; not a paired experiment or leaderboard. Preserve failed tasks. Source/build hashes differ between deployment revisions.',
      runs,
    },
    null,
    2,
  ) + '\n',
);
console.log(JSON.stringify({ published: ids, inventory: runs.length }));
