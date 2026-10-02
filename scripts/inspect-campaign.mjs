import { readFileSync, mkdtempSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { buildAudit } from '../runner/audit.mjs';
const root = 'evidence/campaigns/onsite-2026-10-01';
const summary = JSON.parse(readFileSync(join(root, 'summary.json')));
const phase = summary.phases.find((p) => p.id === process.argv[2]);
if (!phase) throw Error('Specify a published phase: pilot, workflows or pixels.');
const archive = summary.archives.find((a) => a.phase === phase.id);
if (!/^[a-z]+\.tar\.gz$/.test(archive.path) || !/^[a-f0-9-]{36}$/.test(phase.runId))
  throw Error('Invalid archive identity.');
const path = join(root, archive.path);
if (createHash('sha256').update(readFileSync(path)).digest('hex') !== archive.sha256)
  throw Error('Archive hash mismatch.');
const names = execFileSync('tar', ['-tzf', path], { encoding: 'utf8', maxBuffer: 10e6 })
  .trim()
  .split('\n');
if (
  names.some(
    (n) => !/^\.\/(?:run\.json|episode-\d{3}\/(?:[a-z0-9-]+\.(?:json|jsonl|png))?)?$/.test(n),
  )
)
  throw Error('Unexpected archive entry.');
const temporary = mkdtempSync(join(tmpdir(), 'relay-inspect-campaign-'));
try {
  mkdirSync(join(temporary, phase.runId));
  execFileSync('tar', ['-xzf', path, '-C', join(temporary, phase.runId)]);
  const audit = buildAudit({ runRoot: temporary, id: phase.runId });
  console.log(
    JSON.stringify(
      {
        phase: phase.id,
        status: audit.integrity.status,
        checks: audit.integrity.checks.length,
        failed: audit.integrity.checks.filter((c) => !c.ok),
        gaps: audit.integrity.gaps,
      },
      null,
      2,
    ),
  );
  if (audit.integrity.status !== 'verified') process.exitCode = 1;
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
