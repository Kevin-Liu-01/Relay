import { readFileSync, existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { buildAudit } from '../runner/audit.mjs';
const [block, campaign = 'all-tasks-2026-10-03'] = process.argv.slice(2);
if (!/^block-\d{3}$/.test(block ?? '') || !/^[a-z0-9-]+$/.test(campaign))
  throw Error('Use block-NNN and a campaign slug.');
const root = join('evidence/campaigns', campaign);
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json')));
const phase = manifest.phases.find((p) => p.id === block);
if (
  !phase?.archive ||
  !/^[a-f0-9-]{36}$/.test(phase.runId) ||
  phase.archive.path !== block + '.tar.gz'
)
  throw Error('No validated archive identity.');
const publicPath = join(root, phase.archive.path);
const path = existsSync(publicPath) ? publicPath : join('.runtime', campaign, phase.archive.path);
if (createHash('sha256').update(readFileSync(path)).digest('hex') !== phase.archive.sha256)
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
const scratch = mkdtempSync(join(tmpdir(), 'relay-task-inspect-'));
try {
  mkdirSync(join(scratch, phase.runId));
  execFileSync('tar', ['-xzf', path, '-C', join(scratch, phase.runId)]);
  const audit = buildAudit({ runRoot: scratch, id: phase.runId });
  if (audit.run.sourceHash !== manifest.sourceHash) throw Error('Source binding mismatch.');
  console.log(
    JSON.stringify(
      {
        campaign,
        block,
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
  rmSync(scratch, { recursive: true, force: true });
}
