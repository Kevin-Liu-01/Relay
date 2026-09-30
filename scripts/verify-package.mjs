import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';

const archive = resolve('artifacts/relay-slack-env.tar.gz');
const root = mkdtempSync(join(tmpdir(), 'relay-handoff-'));
const hash = (file) => createHash('sha256').update(readFileSync(file)).digest('hex');
execFileSync('tar', ['-xzf', archive, '-C', root]);
const manifest = JSON.parse(readFileSync(join(root, 'evidence/source-manifest.json')));
for (const [file, expected] of Object.entries(manifest.files)) {
  if (hash(join(root, file)) !== expected) throw Error(`Source manifest mismatch: ${file}`);
}
const results = [];
for (const args of [['ci'], ['run', 'build'], ['test']]) {
  const start = performance.now();
  const output = execFileSync('npm', args, {
    cwd: root,
    encoding: 'utf8',
    timeout: 60000,
    maxBuffer: 2_000_000,
  });
  results.push({
    command: `npm ${args.join(' ')}`,
    passed: true,
    durationMs: performance.now() - start,
    output,
  });
}
const report = {
  at: new Date().toISOString(),
  archiveSha256: hash(archive),
  manifestCheckedFiles: Object.keys(manifest.files).length,
  checks: results,
  note: 'Fresh temporary extraction on the same host; independent Linux container check is separate. Temporary extraction retained for inspection.',
};
writeFileSync('artifacts/package-check.json', JSON.stringify(report, null, 2) + '\n');
console.log(
  JSON.stringify(
    { ...report, checks: results.map(({ output, ...r }) => r), extractedAt: root },
    null,
    2,
  ),
);
