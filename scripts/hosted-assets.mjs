import { copyFileSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
// Vercel serves an existing index before fallback rewrites. Keep the private
// workspace entry separate, and make the actual public index the BYOK console.
copyFileSync('dist/index.html', 'dist/workspace.html');
copyFileSync('dist/live.html', 'dist/index.html');
mkdirSync('dist/demo', { recursive: true });
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
