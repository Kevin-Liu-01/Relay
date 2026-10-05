import {
  copyFileSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  readdirSync,
} from 'node:fs';
import { makeWorkflowSeed } from '../server/workflow-seed.mjs';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { validateCatalog, validateRecord } from '../docs/review-app/data.mjs';
import { assertSafeEvidence } from '../runner/export.mjs';
const secrets = [
  'RAMP_ROUTER_API_KEY',
  'TYPESAFE_API_KEY',
  'RELAY_FREE_RAMP_KEY',
  'RELAY_FREE_VISITOR_SECRET',
  'KV_REST_API_TOKEN',
  'UPSTASH_REDIS_REST_TOKEN',
]
  .map((name) => process.env[name])
  .filter(Boolean);
// Vercel serves an existing index before fallback rewrites. Keep the private
// workspace entry separate, and make the actual public index the operator console.
// Vite clears dist on each fresh build. A repeated staging pass must not copy
// the already-promoted operator index over the actor entry.
if (!existsSync('dist/workspace.html')) copyFileSync('dist/index.html', 'dist/workspace.html');
copyFileSync('dist/live.html', 'dist/index.html');
mkdirSync('dist/demo', { recursive: true });
// Static, lazy-loaded trial records. Never expose private runtime directories.
if (existsSync('evidence/trial-library/catalog.json')) {
  const catalog = validateCatalog(JSON.parse(readFileSync('evidence/trial-library/catalog.json')));
  for (const item of catalog.trials) {
    const source = `evidence/trial-library/${item.path.split('/').at(-1)}`;
    const bytes = readFileSync(source);
    if (
      bytes.length !== item.bytes ||
      createHash('sha256').update(bytes).digest('hex') !== item.sha256
    )
      throw Error('Public recording hash mismatch.');
    const text = gunzipSync(bytes, { maxOutputLength: 80e6 }).toString('utf8');
    if (Buffer.byteLength(text) !== item.jsonBytes) throw Error('Public recording size mismatch.');
    assertSafeEvidence(text, secrets);
    validateRecord(JSON.parse(text), item);
    copyFileSync(source, `dist${item.path}`);
  }
  copyFileSync('evidence/trial-library/catalog.json', 'dist/demo/trial-catalog.json');
}
// Actor-visible fictional fixture only. No task instructions, grader or answers.
writeFileSync('dist/demo/sandbox.json', JSON.stringify(makeWorkflowSeed(42)));
const source = 'evidence/reference/channel-topic-through-dialog-seed-42';
copyFileSync(`${source}/final.png`, 'dist/demo/workspace.png');
copyFileSync('evidence/visual/relay-lab.png', 'dist/demo/lab.png');
const trajectory = JSON.parse(readFileSync(`${source}/trajectory.json`, 'utf8'));
writeFileSync(
  'dist/demo/trajectory.json',
  JSON.stringify({ evidenceKind: 'scripted-browser-reference', ...trajectory }),
);
const recordings = [
  {
    source: 'evidence/replay/campaign-thread-pass.json',
    name: 'campaign-thread-pass.json',
    title: 'GPT-6 Luna · thread reply passed',
    kind: 'Real model · accessibility · campaign excerpt',
  },
  {
    source: 'evidence/replay/campaign-decision-fail.json',
    name: 'campaign-decision-fail.json',
    title: 'GPT-6 Luna · decision record incomplete',
    kind: 'Real model · accessibility · campaign excerpt',
  },
  {
    source: 'evidence/replay/campaign-decision-api-pass.json',
    name: 'campaign-decision-api-pass.json',
    title: 'GPT-6 Luna · decision record via API',
    kind: 'Real model · API, not computer use · campaign excerpt',
  },
  {
    source: 'evidence/replay/reference-topic.json',
    name: 'reference-topic.json',
    title: 'Watch a topic update',
    kind: 'Reference script · recorded UI · no model inference',
  },
  {
    source: 'evidence/hosted/1a8cb337-1efb-4ca5-be03-7423746a1a8e.json',
    name: 'gpt-api-pass.json',
    title: 'GPT-4o mini · a successful API run',
    kind: 'Real model · legacy screenshots + initial/final state',
  },
  {
    source: 'evidence/hosted/f1c921f3-9d47-44e2-ba46-8b844434e2d7.json',
    name: 'gpt-a11y-fail.json',
    title: 'GPT-4o mini · an incomplete browser run',
    kind: 'Real model · legacy screenshots + initial/final state',
  },
].filter((r) => existsSync(r.source));
for (const r of recordings) copyFileSync(r.source, `dist/demo/${r.name}`);
writeFileSync(
  'dist/demo/replays.json',
  JSON.stringify(
    recordings.map((r) => ({ title: r.title, kind: r.kind, path: `/demo/${r.name}` })),
  ),
);
// Keep the downloadable HTML standalone; serve controls externally under the site's CSP.
// The offline document embeds fonts. Publish those exact bytes as same-origin
// assets without relaxing the production font-src policy.
const presentation = readFileSync('docs/presentation.html', 'utf8').replace(
  /data:font\/woff2;base64,([A-Za-z0-9+/=]+)/g,
  (_, data) => {
    const font = Buffer.from(data, 'base64');
    const name = `presentation-${createHash('sha256').update(font).digest('hex').slice(0, 16)}.woff2`;
    writeFileSync(`dist/assets/${name}`, font);
    return `./assets/${name}`;
  },
);
const controls = presentation.match(/<script>([\s\S]*?)<\/script>/);
if (!controls) throw Error('Presentation controls missing.');
writeFileSync('dist/presentation-controls.js', controls[1]);
writeFileSync(
  'dist/presentation.html',
  presentation.replace(controls[0], '<script src="./presentation-controls.js"></script>'),
);
if (existsSync('docs/presentation.pdf'))
  copyFileSync('docs/presentation.pdf', 'dist/presentation.pdf');
const results = readFileSync('docs/results.html', 'utf8').replace(
  /data:font\/woff2;base64,([A-Za-z0-9+/=]+)/g,
  (_, data) =>
    `./assets/presentation-${createHash('sha256').update(Buffer.from(data, 'base64')).digest('hex').slice(0, 16)}.woff2`,
);
writeFileSync(
  'dist/results.html',
  results.replace(
    /<script>[\s\S]*?<\/script>/,
    '<script src="./presentation-controls.js"></script>',
  ),
);
for (const extension of ['csv', 'json'])
  copyFileSync(`docs/results-accounting.${extension}`, `dist/demo/results-accounting.${extension}`);

// Fail a production build if any server-only credential lands in public output.
function checkPublic(directory) {
  for (const item of readdirSync(directory, { withFileTypes: true })) {
    const path = `${directory}/${item.name}`;
    if (item.isDirectory()) checkPublic(path);
    else if (secrets.some((secret) => readFileSync(path).includes(Buffer.from(secret))))
      throw Error(`Server credential found in public output: ${path}`);
  }
}
checkPublic('dist');
