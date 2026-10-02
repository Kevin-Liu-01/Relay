import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  statSync,
} from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
const report = JSON.parse(readFileSync('artifacts/browser-results.json', 'utf8'));
const dest = 'evidence/reference';
mkdirSync(dest, { recursive: true });
let records = [];
function visit(s) {
  for (const spec of s.specs ?? [])
    for (const test of spec.tests ?? []) {
      const result = test.results.at(-1);
      const key = spec.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const target = join(dest, key);
      mkdirSync(target, { recursive: true });
      const attached = {};
      for (const a of result.attachments ?? []) {
        if (a.name === 'trajectory.json') {
          const body = a.body ? Buffer.from(a.body, 'base64') : readFileSync(a.path);
          writeFileSync(join(target, 'trajectory.json'), body);
          attached.trajectory = `${key}/trajectory.json`;
        }
        if (a.name === 'screenshot' && a.path) {
          copyFileSync(a.path, join(target, 'final.png'));
          attached.screenshot = `${key}/final.png`;
        }
      }
      records.push({
        title: spec.title,
        status: result.status,
        durationMs: result.duration,
        attachments: attached,
      });
    }
  for (const child of s.suites ?? []) visit(child);
}
for (const s of report.suites) visit(s);
writeFileSync(
  join(dest, 'summary.json'),
  JSON.stringify(
    { evidenceKind: 'scripted-browser-reference', stats: report.stats, tests: records },
    null,
    2,
  ) + '\n',
);
// Browser-native trace ZIPs and videos contain capability URLs. Keep them private,
// but preserve portable token-free state/event exports and viewport screenshots.
const agentNames = ['thread-reply', 'edit-message', 'incident-triage'];
const agentSummary = agentNames.map((name) => {
  const d = JSON.parse(readFileSync(`evidence/agent/${name}/trajectory.json`));
  return {
    task: name,
    seed: d.task.seed,
    success: d.evaluation.success,
    revision: d.revision,
    events: d.events.length,
    path: `agent/${name}/trajectory.json`,
  };
});
writeFileSync(
  'evidence/agent/summary.json',
  JSON.stringify(
    {
      evidenceKind: 'interactive-codex-builder-smoke',
      limitations:
        'Three builder-informed interactive episodes, not an independent or statistically powered agent evaluation. No policy training performed.',
      episodes: agentSummary,
    },
    null,
    2,
  ) + '\n',
);
function walk(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const hash = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');
const sourceFiles = [
  'package.json',
  'package-lock.json',
  'index.html',
  'lab.html',
  'live.html',
  'replay.html',
  'play.html',
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
writeFileSync(
  'evidence/source-manifest.json',
  JSON.stringify(
    { algorithm: 'sha256', files: Object.fromEntries(sourceFiles.map((p) => [p, hash(p)])) },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify(
    {
      scripted: records.length,
      failed: records.filter((x) => x.status !== 'passed').length,
      agent: agentSummary,
    },
    null,
    2,
  ),
);
