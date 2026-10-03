import { readFileSync, writeFileSync } from 'node:fs';
import { assertSafeEvidence } from '../runner/export.mjs';
const id = 'model-breadth-2026-10-03';
const root = `evidence/campaigns/${id}`;
const s = JSON.parse(readFileSync(`${root}/summary.json`));
const plan = JSON.parse(readFileSync(`docs/campaigns/${id}.json`));
const c = s.totals;
const money = (n) => '$' + n.toFixed(8);
const text = `# One-pass model coverage — ${s.status}

Snapshot: ${s.generatedAt}. Planned work is not a completed result.

- **${c.attempted}/${c.planned} attempted: ${c.passed} passed, ${c.incomplete} incomplete, ${c.blocked} blocked; ${c.unattempted} unattempted.**
- ${s.preserved} original attempts preserved, including every failure; ${s.newlyAttempted} new attempts. No repeated model/task cells, retries or best-of selection.
- 17 requested routes × all 18 public development tasks × one seed (1042). Same source, initial states and outcome graders. Accessibility control only.
- [Plan](../../../docs/campaigns/${id}.md), [frozen configuration](../../../docs/campaigns/${id}.json), [all cells CSV](trials.csv), [summary](summary.json), [manifest](manifest.json).

## Models

Pass fractions include blocked attempts. Unattempted cells are not failures. Click-to-sort and per-task filters are in [the presentation](https://relay.kevinliu.studio/presentation#9).

| Model route | Attempted / 18 | Passed | Incomplete | Blocked | Not run | Median seconds | Recorded estimate / reservation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${s.byModel.map((m) => `| ${m.model} | ${m.attempted} / ${m.planned} | ${m.passed} | ${m.incomplete} | ${m.blocked} | ${m.unattempted} | ${m.medianSeconds?.toFixed(2) ?? '—'} | ${m.estimatedUSD == null ? '—' : money(m.estimatedUSD)}${m.usageKnown === false ? ' (usage partly unknown)' : ''} |`).join('\n')}

## Task matrix

Exactly one planned attempt per model/task. **P** = passed, **F** = incomplete, **B** = blocked, **—** = unattempted. Errors, failed checks, action counts, original campaign and run identifiers are in the CSV. One observation per cell does not estimate repeatability.

| Task | ${s.byModel.map((m) => m.model).join(' | ')} |
| --- | ${s.byModel.map(() => '---:').join(' | ')} |
${s.byTask.map((t) => `| ${t.task} | ${t.byModel.map((m) => (m.passed ? 'P' : m.incomplete ? 'F' : m.blocked ? 'B' : '—')).join(' | ')} |`).join('\n')}

## Accounting and integrity

- Selected 306-cell inventory: ${money(s.selectionEstimatedUSD)} recorded, including ${money(s.selectionReservedUSD)} unresolved reservations. This includes the preserved 37 attempts; it is not all newly incurred spend.
- Newly collected work: ${money(s.estimatedUSD)}. All prior campaigns and the separate tiny access diagnostic: ${money(s.priorRecordedUSD)}. Shared recorded total: **${money(s.recordedTotalUSD)}**; remaining **${money(s.remainingUSD)}** of the original $${plan.maxEstimatedUSD} ceiling. Do not add preserved-row costs again. Estimates/reservations are not invoices.
- Selected attempts: ${s.requests} requests; ${s.inputTokens} accepted input tokens, ${s.outputTokens} accepted output tokens. ${s.auditChecks} total integrity checks, including the original 2,415; ${s.phases.length} new archived blocks. Hash consistency is not independent attestation or proof of task success.
- Source: \`${s.sourceHash ?? plan.sourceHash}\`; plan hash: \`${s.planHash ?? 'not yet bound'}\`.
- New archives: \`.runtime/${id}/\`. Preserved archives: \`.runtime/all-tasks-2026-10-03/\`. Byte hashes are in their respective manifests. Two exact-byte examples are also public: [Astra topic pass](block-009.tar.gz) and [Luna thread failure](block-019.tar.gz). All other originals remain local. These are curated inspection examples, not the complete sample or a replacement for its inventory.

Verify either public example without a key: \`node scripts/inspect-task-campaign.mjs block-009 ${id}\` (or \`block-019\`). It verifies the published archive hash, source and trace integrity. [Pilot admission review](../../../docs/campaigns/${id}-pilot-review.md) records all 36 inspected archives, including the failed and blocked attempts.

## Availability and interpretation

${plan.unavailable.map((r) => `- ${r.family}: ${r.reason}`).join('\n')}
${s.limitations.map((l) => '- ' + l).join('\n')}

The earlier [1,800-cell campaign](../all-tasks-2026-10-03/README.md) is closed at 37 attempts. Its 1,763 unattempted cells remain in that historical record, not as failures or extra trials in this one-pass inventory.
`;
assertSafeEvidence(text, [process.env.RAMP_ROUTER_API_KEY]);
writeFileSync(`${root}/README.md`, text);
console.log(JSON.stringify({ id, status: s.status, attempted: c.attempted, planned: c.planned }));
