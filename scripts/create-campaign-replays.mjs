// Explicit presentation excerpts. Originals remain byte-identical in the phase archive.
import { readFileSync, writeFileSync, mkdtempSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { buildAudit } from '../runner/audit.mjs';
import { aggregate } from '../runner/design.mjs';
import { assertSafeEvidence } from '../runner/export.mjs';
const root = 'evidence/campaigns/onsite-2026-10-01';
const summary = JSON.parse(readFileSync(join(root, 'summary.json')));
const phase = summary.phases.find((p) => p.id === 'workflows');
const archive = summary.archives.find((a) => a.phase === phase.id);
const archivePath = join(root, archive.path);
if (createHash('sha256').update(readFileSync(archivePath)).digest('hex') !== archive.sha256)
  throw Error('Archive hash mismatch.');
const temporary = mkdtempSync(join(tmpdir(), 'relay-campaign-replays-'));
try {
  const dir = join(temporary, phase.runId);
  mkdirSync(dir);
  execFileSync('tar', ['-xzf', archivePath, '-C', dir]);
  const sourceRun = JSON.parse(readFileSync(join(dir, 'run.json')));
  for (const [episodeId, name] of [
    ['episode-002', 'campaign-thread-pass.json'],
    ['episode-007', 'campaign-decision-fail.json'],
    ['episode-008', 'campaign-decision-api-pass.json'],
  ]) {
    const episode = sourceRun.episodes.find((e) => e.cell.episodeId === episodeId);
    const selection = {
      kind: 'presentation-excerpt',
      originalRunId: sourceRun.id,
      episodeId,
      originalRunStatus: sourceRun.status,
      archive: `${root}/${archive.path}`,
      archiveSha256: archive.sha256,
      note: 'One selected episode; full campaign includes failures and unattempted cells. No events, actions or grades are rewritten.',
    };
    const run = {
      ...sourceRun,
      episodes: [episode],
      summary: aggregate([episode]),
      paired: [],
      selection,
    };
    const events = readFileSync(join(dir, episodeId, 'steps.jsonl'), 'utf8')
      .trim()
      .split('\n')
      .map((line) => ({ episodeId, event: JSON.parse(line) }));
    const audit = buildAudit({ runRoot: temporary, id: run.id, run });
    if (audit.integrity.status !== 'verified') throw Error('Excerpt audit failed.');
    audit.artifacts = audit.artifacts.filter((a) => a.path?.startsWith(`${episodeId}/`));
    const artifacts = {};
    for (const file of readdirSync(join(dir, episodeId)).filter((f) => f.endsWith('.png')))
      artifacts[`${episodeId}/${file}`] =
        `data:image/png;base64,${readFileSync(join(dir, episodeId, file)).toString('base64')}`;
    const text = JSON.stringify({
      run,
      events,
      artifacts,
      audit,
      selection,
      capturedAt: sourceRun.finishedAt,
    });
    assertSafeEvidence(text, [process.env.RAMP_ROUTER_API_KEY]);
    writeFileSync(join('evidence/replay', name), text);
    console.log(
      JSON.stringify({
        name,
        episodeId,
        success: episode.evaluation.success,
        frames: events.filter((e) => e.event.replay).length,
        bytes: Buffer.byteLength(text),
      }),
    );
  }
} finally {
  rmSync(temporary, { recursive: true, force: true });
}
