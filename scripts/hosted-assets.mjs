import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
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
