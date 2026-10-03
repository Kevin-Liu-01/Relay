// Validate observer-only UI changes without replacing a frozen actor build.
// No credentials, private runs, Git metadata or original node_modules are copied.
import assert from 'node:assert/strict';
import {
  constants,
  cpSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { sourceFingerprint } from '../runner/experiment.mjs';

const root = resolve(new URL('..', import.meta.url).pathname);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
function files(path) {
  return statSync(path).isDirectory()
    ? readdirSync(path)
        .sort()
        .flatMap((name) => files(join(path, name)))
    : [path];
}
const actorBuildHash = () =>
  hash(
    JSON.stringify(
      files(join(root, 'dist')).map((path) => [path.slice(root.length), hash(readFileSync(path))]),
    ),
  );
const [mode = 'prepare', target] = process.argv.slice(2);
if (mode === 'check') {
  assert.ok(target, 'Pass the prepared workspace path.');
  const receipt = JSON.parse(readFileSync(join(target, 'validation-meta.json')));
  assert.equal(receipt.sourceRoot, root);
  assert.equal(receipt.actorSourceHash, sourceFingerprint(root), 'Original actor source unchanged');
  assert.equal(receipt.actorBuildHash, actorBuildHash(), 'Original dist remains byte-identical');
  console.log(JSON.stringify({ status: 'original-actor-unchanged', workspace: target }));
} else {
  assert.equal(mode, 'prepare');
  assert.equal(target, undefined);
  const workspace = mkdtempSync(join(tmpdir(), 'relay-review-validation-'));
  const roots = [
    'package.json',
    'package-lock.json',
    'index.html',
    'lab.html',
    'live.html',
    'replay.html',
    'play.html',
    'demo',
    'vite.config.mjs',
    'playwright.config.mjs',
    'vercel.json',
    '.vercelignore',
    '.env.example',
    '.gitignore',
    '.dockerignore',
    '.prettierrc.json',
    '.prettierignore',
    'Dockerfile',
    'compose.yaml',
    'LICENSE',
    'THIRD_PARTY_NOTICES.md',
    'README.md',
    'AGENTS.md',
    'server',
    'shared',
    'src',
    'runner',
    'hosted',
    'api',
    'scripts',
    'tests',
    'docs',
    'evidence',
  ];
  for (const path of roots) {
    assert.ok(existsSync(join(root, path)), `Missing ${path}`);
    cpSync(join(root, path), join(workspace, path), {
      recursive: true,
      mode: constants.COPYFILE_FICLONE,
    });
  }
  symlinkSync(join(root, 'node_modules'), join(workspace, 'node_modules'), 'dir');
  const receipt = {
    kind: 'isolated-observer-validation',
    preparedAt: new Date().toISOString(),
    sourceRoot: root,
    workspace,
    actorSourceHash: sourceFingerprint(root),
    actorBuildHash: actorBuildHash(),
    note: 'Generated builds and test artifacts belong to this temporary workspace. Never copy its dist back over the frozen actor build.',
  };
  writeFileSync(join(workspace, 'validation-meta.json'), JSON.stringify(receipt, null, 2) + '\n');
  console.log(JSON.stringify(receipt, null, 2));
}
