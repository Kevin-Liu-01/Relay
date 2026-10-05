import { mkdirSync, readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { gunzipSync } from 'node:zlib';
import { assertSafeEvidence } from '../runner/export.mjs';
mkdirSync('artifacts', { recursive: true });
if (existsSync('.env')) process.loadEnvFile('.env');
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
const roots = [
  'README.md',
  'LICENSE',
  'AGENTS.md',
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
  '.gitignore',
  '.dockerignore',
  '.prettierrc.json',
  '.prettierignore',
  'Dockerfile',
  'compose.yaml',
  'THIRD_PARTY_NOTICES.md',
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
    ['evidence/trial-library/', 'evidence/interface-trial-library/'].some((prefix) =>
      p.startsWith(prefix),
    ) &&
    p.endsWith('.json.gz')
  )
    assertSafeEvidence(
      gunzipSync(readFileSync(p), { maxOutputLength: 80e6 }).toString('utf8'),
      secrets,
    );
  if (
    /\.(json|jsonl|md|html|js|mjs|jsx|yml|yaml)$/.test(p) &&
    (/\/s\/[a-f0-9]{64}|"token"\s*:\s*"[a-f0-9]{64}"|Bearer\s+(?!browser-test-only\b)[A-Za-z0-9._~+/-]{16,}|sk-routgw-[A-Za-z0-9]{16,}/.test(
      readFileSync(p, 'utf8'),
    ) ||
      secrets.some((secret) => secret && readFileSync(p, 'utf8').includes(secret)))
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
