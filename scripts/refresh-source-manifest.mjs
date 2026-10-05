// Refresh the release receipt without regenerating historical benchmark evidence.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const walk = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
const files = [
  'package.json',
  'package-lock.json',
  'index.html',
  'lab.html',
  'live.html',
  'replay.html',
  'play.html',
  'demo/review.html',
  'vercel.json',
  '.vercelignore',
  '.env.example',
  'vite.config.mjs',
  'playwright.config.mjs',
  'Dockerfile',
  'compose.yaml',
  'README.md',
  'LICENSE',
  'AGENTS.md',
  'THIRD_PARTY_NOTICES.md',
  '.gitignore',
  '.dockerignore',
  '.prettierrc.json',
  '.prettierignore',
  ...['server', 'src', 'runner', 'hosted', 'api', 'shared', 'tests', 'scripts', 'docs'].flatMap(
    walk,
  ),
].sort();
const manifest = {
  algorithm: 'sha256',
  files: Object.fromEntries(
    files.map((path) => [path, createHash('sha256').update(readFileSync(path)).digest('hex')]),
  ),
};
writeFileSync('evidence/source-manifest.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(
  `Updated release source receipt for ${files.length} files. No experiment evidence changed.`,
);
