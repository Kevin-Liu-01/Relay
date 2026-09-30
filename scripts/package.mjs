import { mkdirSync, readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
mkdirSync('artifacts', { recursive: true });
if (existsSync('.env')) process.loadEnvFile('.env');
const roots = [
  'README.md',
  'AGENTS.md',
  'package.json',
  'package-lock.json',
  'index.html',
  'lab.html',
  'live.html',
  'replay.html',
  'vercel.json',
  '.vercelignore',
  '.env.example',
  'vite.config.mjs',
  'playwright.config.mjs',
  '.gitignore',
  '.dockerignore',
  '.prettierrc.json',
  '.prettierignore',
  'Dockerfile',
  'compose.yaml',
  'THIRD_PARTY_NOTICES.md',
  'server',
  'src',
  'runner',
  'hosted',
  'api',
  'scripts',
  'tests',
  'docs',
  'evidence',
];
const files = roots.flatMap(function walk(p) {
  return statSync(p).isDirectory()
    ? readdirSync(p)
        .sort()
        .flatMap((f) => walk(`${p}/${f}`))
    : [p];
});
// A submission should not carry capability URLs, operator secrets or raw browser traces.
// browser-test-only is the public, disposable test-server credential, not a live secret.
for (const p of files) {
  if (
    /\.(json|jsonl|md|html|js|mjs|jsx|yml|yaml)$/.test(p) &&
    (/\/s\/[a-f0-9]{64}|"token"\s*:\s*"[a-f0-9]{64}"|Bearer\s+(?!browser-test-only\b)[A-Za-z0-9._~+/-]{16,}|sk-routgw-[A-Za-z0-9]{16,}/.test(
      readFileSync(p, 'utf8'),
    ) ||
      [process.env.RAMP_ROUTER_API_KEY, process.env.TYPESAFE_API_KEY].some(
        (secret) => secret && readFileSync(p, 'utf8').includes(secret),
      ))
  )
    throw Error(`Credential-shaped content in ${p}`);
}
const path = 'artifacts/relay-slack-env.tar.gz';
execFileSync('tar', ['-czf', path, ...files]);
const sha256 = createHash('sha256').update(readFileSync(path)).digest('hex');
writeFileSync(path + '.sha256', `${sha256}  relay-slack-env.tar.gz\n`);
console.log(
  JSON.stringify({ path, sha256, files: files.length, bytes: statSync(path).size }, null, 2),
);
