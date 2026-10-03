import { readFileSync, writeFileSync } from 'node:fs';
import { assertSafeEvidence } from '../runner/export.mjs';
const id = process.argv[2] ?? JSON.parse(readFileSync('docs/current-comparison.json')).campaign;
if (!/^[a-z0-9-]+$/.test(id)) throw Error('Invalid campaign ID.');
const root = `evidence/campaigns/${id}`;
const summary = JSON.parse(readFileSync(`${root}/summary.json`));
const plan = JSON.parse(readFileSync(`docs/campaigns/${id}.json`));
const money = (n) => '$' + n.toFixed(8);
const s = summary,
  c = s.totals;
const text = `# Full task comparison — ${s.status}

Updated ${s.generatedAt}. This page reports actual collection, not the planned matrix as completed work.

- **${c.attempted}/${c.planned} attempted; ${c.passed} passed, ${c.incomplete} incomplete, ${c.blocked} blocked, ${c.unattempted} unattempted.**
- Target: all 18 tasks × five models × 20 fixture seeds, 360 trials per model. Accessibility control only; public development templates, not an independent semantic holdout.
- [Frozen plan](../../../docs/campaigns/${id}.md), [JSON](../../../docs/campaigns/${id}.json), [all planned rows](trials.csv), [summary](summary.json), [manifest](manifest.json).

## Models

| Requested model | Attempted / planned | Passed | Incomplete | Blocked | Not run | Median seconds | Recorded allowance |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${s.byModel.map((m) => `| ${m.model} | ${m.attempted} / ${m.planned} | ${m.passed} | ${m.incomplete} | ${m.blocked} | ${m.unattempted} | ${m.medianSeconds?.toFixed(2) ?? '—'} | ${m.estimatedUSD == null ? '—' : money(m.estimatedUSD)}${m.usageKnown === false ? ' (usage unknown)' : ''} |`).join('\n')}

## Every task

Each cell shows **passed / attempted**, with **20 planned per model/task**. A zero denominator means not attempted, not a zero-percent score. The CSV distinguishes blocked trials from ordinary task failures.

| Task | ${s.byModel.map((m) => m.model).join(' | ')} |
| --- | ${s.byModel.map(() => '---:').join(' | ')} |
${s.byTask.map((t) => `| ${t.task} | ${t.byModel.map((m) => `${m.passed} / ${m.attempted}`).join(' | ')} |`).join('\n')}

## Accounting and integrity

- ${s.requests} requests; ${s.inputTokens} accepted input tokens and ${s.outputTokens} accepted output tokens.
- ${money(s.estimatedUSD - s.reservedUSD)} accepted-usage estimate + ${money(s.reservedUSD)} unresolved reservations = **${money(s.estimatedUSD)}** recorded for this campaign. Not an invoice; missing usage is not free.
- Prior recorded allowance: ${money(s.priorRecordedUSD)}. Remaining campaign ceiling: ${money(s.remainingUSD)} of the shared $${plan.maxEstimatedUSD} authorization. The frozen prior ledger identifies included access diagnostics; any later diagnostics must also be deducted before a successor campaign. Changing campaign names never resets this allowance.
- ${s.auditChecks} local integrity checks over ${s.phases.length} archived blocks. Hash consistency is not independent attestation. A verified archive can contain a blocked run.
- Source hash: \`${s.sourceHash ?? 'not yet bound'}\`; plan hash: \`${s.planHash ?? 'not yet bound'}\`.
- Original trajectory archives are preserved locally under \`.runtime/${id}/\`, with byte hashes in the manifest. They have **not** been uploaded; the repository contains summaries and receipts, not fabricated download links to unpublished originals.

## Limits

${s.limitations.map((l) => '- ' + l).join('\n')}

Earlier [36-trial pilot](../model-comparison-2026-10-02-final/README.md): 20 passes, 11 incomplete, four output limits and one connection failure. Different action budget and model set; not pooled into this campaign.
`;
assertSafeEvidence(text, [process.env.RAMP_ROUTER_API_KEY]);
writeFileSync(`${root}/README.md`, text);
console.log(JSON.stringify({ id, status: s.status, attempted: c.attempted, planned: c.planned }));
