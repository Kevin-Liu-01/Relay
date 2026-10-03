// Generate the public closeout from the preserved campaign records; never infer missing trials.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { assertSafeEvidence } from '../runner/export.mjs';
import { unresolvedUSD } from './lib/task-campaign.mjs';

const id = process.argv[2];
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id ?? '')) throw Error('Specify a campaign slug.');
const root = join('evidence/campaigns', id);
const summary = JSON.parse(readFileSync(join(root, 'summary.json')));
const manifest = JSON.parse(readFileSync(join(root, 'manifest.json')));
const planText = readFileSync(join('docs/campaigns', id + '.json'));
const plan = JSON.parse(planText);
if (createHash('sha256').update(planText).digest('hex') !== manifest.planHash)
  throw Error('Frozen plan hash mismatch.');
const c = summary.totals;
if (
  c.attempted + c.unattempted !== c.planned ||
  c.passed + c.incomplete + c.blocked !== c.attempted
)
  throw Error('Inconsistent outcome counts.');
const phases = manifest.phases.map((p) => ({
  ...p,
  run: JSON.parse(readFileSync(join(root, p.id + '.run.json'))),
}));
const episodes = phases.flatMap((p) => p.run.episodes.filter((e) => e.status !== 'queued'));
const unknown = episodes.filter((e) => e.usageKnown === false);
const reserved = phases.reduce((total, phase) => {
  const unknownEpisodes = phase.run.episodes.filter((e) => e.usageKnown === false);
  if (!unknownEpisodes.length) return total;
  const archive = join(root, phase.archive.path);
  if (
    !/^[a-z0-9-]+\.tar\.gz$/.test(phase.archive.path) ||
    createHash('sha256').update(readFileSync(archive)).digest('hex') !== phase.archive.sha256
  )
    throw Error('Archive binding failed.');
  return (
    total +
    unknownEpisodes.reduce((n, e) => {
      if (!/^episode-\d{3}$/.test(e.cell.episodeId)) throw Error('Invalid episode ID.');
      const trace = execFileSync('tar', ['-xOzf', archive, `./${e.cell.episodeId}/steps.jsonl`], {
        encoding: 'utf8',
        maxBuffer: 80e6,
      })
        .trim()
        .split('\n')
        .map(JSON.parse);
      const amount = unresolvedUSD(trace);
      if (!(amount > 0) || amount > e.estimatedUSD)
        throw Error('Reservation cannot be reconciled.');
      return n + amount;
    }, 0)
  );
}, 0);
const prior = (plan.priorCampaigns ?? []).reduce((n, p) => n + p.recordedUSD, 0);
const checks = phases.reduce((n, p) => n + p.audit.checks.length, 0);
const money = (n) => '$' + n.toFixed(8);
const tick = String.fromCharCode(96);
const escape = (s) => String(s).replaceAll('|', '\\|').replaceAll('\n', ' ');
const byTask = plan.common.tasks
  .map(
    (task) =>
      `| ${task} | ${summary.byModel
        .map((m) => {
          const rows = summary.rows.filter((r) => r.task === task && r.model === m.model);
          return (
            rows.filter((r) => r.outcome === 'passed').length +
            '/' +
            rows.filter((r) => r.outcome !== 'unattempted').length
          );
        })
        .join(' | ')} |`,
  )
  .join('\n');
const report = `# Model comparison — ${summary.status}

Generated from the frozen plan, run records and complete summary. No earlier campaign is pooled into these counts.

## Results

- **${c.attempted}/${c.planned} trials attempted: ${c.passed} passed, ${c.incomplete} incomplete, ${c.blocked} blocked/truncated, ${c.unattempted} unattempted.**
- Five public tasks × four seeds per model; accessibility browser control only. These are development results, not 20 independent held-out problems or a general model ranking.
- Strict terminal-state checks include collateral changes. Blocked/truncated trials never become passes from diagnostic state checks. No inference retries or substitutions.

| Requested route | Planned | Attempted | Passed | Incomplete | Blocked | Not run | Median seconds | Recorded allowance |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${summary.byModel.map((m) => `| ${escape(m.model)} | ${m.planned} | ${m.attempted} | ${m.passed} | ${m.incomplete} | ${m.blocked} | ${m.unattempted} | ${m.medianSeconds?.toFixed(3) ?? '—'} | ${m.estimatedUSD == null ? '—' : money(m.estimatedUSD)}${m.usageKnown === false ? ' incl. unknown reservation' : ''} |`).join('\n')}

## Task breakdown

Passed / attempted; each full model/task cell has four planned seed instances. Unattempted rows remain in [the complete CSV](trials.csv).

| Task | ${summary.byModel.map((m) => escape(m.model)).join(' | ')} |
| --- | ${summary.byModel.map(() => '---:').join(' | ')} |
${byTask}

## Accounting and limits

- ${summary.requests} requests; ${summary.inputTokens.toLocaleString('en-US')} accepted input tokens and ${summary.outputTokens.toLocaleString('en-US')} accepted output tokens. Validated output-limit receipt usage is included. Missing receipt tokens are unknown, not zero.
- ${money(summary.estimatedUSD - reserved)} accepted-usage estimate + ${money(reserved)} retained missing-receipt reservations = **${money(summary.estimatedUSD)} recorded allowance**. Not a provider invoice.
- ${unknown.length} trials have unknown usage; ${episodes.filter((e) => e.status === 'output_limit').length} have validated output-limit receipts. Partial output never executes.
- Prior stopped attempts: ${money(prior)}. Combined recorded allowance: **${money(prior + summary.estimatedUSD)}**, within the $3 authorization.
- ${c.actionAttempts} action attempts, ${c.rejectedActions} rejected actions, ${c.captureWarnings} capture warnings. Median time includes all attempts and observer overhead, including blocked trials; not time-to-success.
- Requested routes are not pinned weights. Returned identifiers: ${summary.byModel.map((m) => `${escape(m.model)} → ${m.returnedModels.map(escape).join(', ') || 'not observed'}`).join('; ')}.

## Integrity and original trajectories

- ${checks} local integrity checks; ${phases.every((p) => p.audit.status === 'verified' && p.audit.gaps.length === 0) ? 'all verified, no recorded gaps' : 'inspect phase audits for failures/gaps'}. Hash consistency is not independent attestation or proof against rewriting an entire bundle.
- Execution source: ${tick}${manifest.sourceHash}${tick}; frozen plan: ${tick}${manifest.planHash}${tick}; launcher: ${tick}${manifest.launcherHash}${tick}.
- [Plan](../../../docs/campaigns/${id}.md), [frozen JSON](../../../docs/campaigns/${id}.json), [manifest](manifest.json), [full summary](summary.json), [every planned trial](trials.csv).

| Phase | Status | Audit checks | Trajectory archive | SHA-256 |
| --- | --- | ---: | --- | --- |
${phases.map((p) => `| ${p.id} | ${p.status} | ${p.audit.checks.length} | [${p.archive.path}](${p.archive.path}) | ${tick}${p.archive.sha256}${tick} |`).join('\n')}

${tick.repeat(3)}sh
npm run inspect:campaign -- seed-42 ${id}
# Repeat for each published phase listed above. No model key needed.
${tick.repeat(3)}

## Earlier attempts

${(plan.priorCampaigns ?? []).map((p) => `- [${p.id}](../${p.id}/README.md): immutable, separately accounted; never resumed or used to replace failed trials.`).join('\n')}
- [Original six-model attempt](../model-comparison-2026-10-02/README.md): separately authorized earlier study, not charged again to this follow-up allowance.
`;
assertSafeEvidence(
  report,
  [process.env.RAMP_ROUTER_API_KEY, process.env.TYPESAFE_API_KEY].filter(Boolean),
);
writeFileSync(join(root, 'README.md'), report);
console.log(
  JSON.stringify({
    id,
    ...c,
    estimatedUSD: summary.estimatedUSD,
    reservedUSD: reserved,
    combinedRecordedUSD: prior + summary.estimatedUSD,
    auditChecks: checks,
  }),
);
