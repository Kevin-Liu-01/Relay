import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { assertSafeEvidence } from '../runner/export.mjs';
const id = process.argv[2] ?? JSON.parse(readFileSync('docs/current-comparison.json')).campaign;
assert.ok(['model-breadth-2026-10-03', 'model-breadth-2026-10-03-continuation'].includes(id));
const root = `evidence/campaigns/${id}`;
const summaryBytes = readFileSync(`${root}/summary.json`);
const s = JSON.parse(summaryBytes);
const plan = JSON.parse(readFileSync(`docs/campaigns/${id}.json`));
const pilotId = plan.predecessor ?? id;
const examplePrefix = pilotId === id ? '' : `../${pilotId}/`;
const c = s.totals;
const money = (n) => '$' + n.toFixed(8);
const terminalCounts = Object.entries(
  s.rows
    .filter((r) => r.outcome !== 'unattempted')
    .reduce((counts, r) => {
      const key = `${r.status} / ${r.outcome}`;
      counts[key] = (counts[key] ?? 0) + 1;
      return counts;
    }, {}),
).sort(([a], [b]) => a.localeCompare(b));
let completion = '';
if (s.status === 'completed') {
  const verified = JSON.parse(readFileSync(`${root}/verification.json`));
  assert.equal(verified.status, 'complete-verified');
  assert.equal(verified.summaryHash, createHash('sha256').update(summaryBytes).digest('hex'));
  assert.equal(verified.attemptsVerified, 306);
  completion = `\n- [Completion verification](verification.json): all ${verified.attemptsVerified} attempted cells reopened from ${verified.archivesVerified} original archives; ${verified.auditChecks} integrity checks and ${verified.gradeChecks} saved-state outcome checks agree. The verifier reconstructs all report rows and accounting; blocked attempts remain blocked even if diagnostic workspace checks pass.\n`;
}
const text = `# One-pass model coverage — ${s.status}

Snapshot: ${s.generatedAt}. ${s.status === 'completed' ? 'Collection and archive verification are complete; completion does not mean every task passed.' : 'Planned work is not a completed result.'}

- **${c.attempted}/${c.planned} attempted: ${c.passed} passed, ${c.incomplete} incomplete, ${c.blocked} blocked; ${c.unattempted} unattempted.**
- ${s.preserved} original attempts preserved, including every failure; ${s.newlyAttempted} new attempts. No repeated model/task cells, retries or best-of selection.
- 17 requested routes × all 18 public development tasks × one seed (1042). Same source, initial states and outcome graders. Accessibility control only.
- [Plan](../../../docs/campaigns/${id}.md), [frozen configuration](../../../docs/campaigns/${id}.json), [all cells CSV](trials.csv), [summary](summary.json), [manifest](manifest.json).
- [Review traces and watch replays](https://relay.kevinliu.studio/demo/review.html): the public library reports its actual recorded count and includes failures and blocked runs. Each record has exact requests, externally visible responses, actions, recorded UI states, state changes and grader checks. [Format and fidelity](../../../docs/trial-review.md).

## Models

Pass fractions include blocked attempts. Unattempted cells are not failures. Click-to-sort and per-task filters are in [the presentation](https://relay.kevinliu.studio/presentation#9).

| Model route | Attempted / 18 | Passed | Incomplete | Blocked | Not run | Median seconds | Recorded estimate / reservation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
${s.byModel.map((m) => `| ${m.model} | ${m.attempted} / ${m.planned} | ${m.passed} | ${m.incomplete} | ${m.blocked} | ${m.unattempted} | ${m.medianSeconds?.toFixed(2) ?? '—'} | ${m.estimatedUSD == null ? '—' : money(m.estimatedUSD)}${m.usageKnown === false ? ' (usage partly unknown)' : ''} |`).join('\n')}

## Task matrix

Exactly one planned attempt per model/task. **P** = passed, **F** = incomplete, **B** = blocked, **—** = unattempted. Errors, failed checks, action counts, original campaign and run identifiers are in the CSV. One observation per cell does not estimate repeatability.

| Task | Attempted / 17 | Passed | Incomplete | Blocked | Not run |
| --- | ---: | ---: | ---: | ---: | ---: |
${s.byTask.map((t) => `| ${t.task} | ${t.attempted} / ${t.planned} | ${t.passed} | ${t.incomplete} | ${t.blocked} | ${t.unattempted} |`).join('\n')}

Release-sync has a source-location ambiguity; design-handoff quotes DESIGN without explicitly requiring substitution, while its grader expects the approved design name. Their raw outcomes remain in the matrix with [task-quality caveats](../../../docs/campaigns/model-breadth-2026-10-03-observations.md), not as clean evidence of model capability.

| Task | ${s.byModel.map((m) => m.model).join(' | ')} |
| --- | ${s.byModel.map(() => '---:').join(' | ')} |
${s.byTask.map((t) => `| ${t.task} | ${t.byModel.map((m) => (m.passed ? 'P' : m.incomplete ? 'F' : m.blocked ? 'B' : '—')).join(' | ')} |`).join('\n')}

## Terminal outcomes

A completed agent loop may still fail the task. Output limits and timeouts are blocked attempts, even when their final workspace happens to satisfy diagnostic checks. No partial response is executed; no blocked cell is replaced by a repeat.

${s.rows.filter((r) => r.outcome === 'blocked' && r.diagnosticSuccess).length} blocked attempts satisfy their saved-state diagnostic checks. They remain blocked, separately inspectable in the review page's Checks view.

| Recorded terminal status / outcome | Attempts |
| --- | ---: |
${terminalCounts.map(([status, n]) => `| ${status} | ${n} |`).join('\n')}

## Action-contract diagnostics

All routes received the same single-action JSON contract, not a provider-native tool-call adapter. Rejected steps still consume the action allowance. These counts measure this bounded model/provider/harness combination, not pure UI reasoning or a model's best achievable result. The historical field \`invalidJSON\` counts rejected outputs with no parsed action; it can include schema failures as well as malformed JSON.

| Model route | Action attempts | Steps with errors | No parsed action |
| --- | ---: | ---: | ---: |
${s.byModel.map((m) => `| ${m.model} | ${m.actionAttempts} | ${m.rejectedActions} | ${s.rows.filter((r) => r.model === m.model).reduce((n, r) => n + (r.invalidJSON ?? 0), 0)} |`).join('\n')}

Review the original response and step event before assigning a cause. The frozen parser trims whitespace and optional Markdown JSON fences; it does not repair malformed JSON, extract an action from prose, split multiple objects or translate native tool wrappers. No native-format adaptation was introduced after collection started. Protocol changes belong to a separately versioned comparison.

## Accounting and integrity

- Selected 306-cell inventory: ${money(s.selectionEstimatedUSD)} recorded, including ${money(s.selectionReservedUSD)} unresolved reservations. This includes the preserved ${s.preserved} attempts; it is not all newly incurred spend.
- Newly collected work: ${money(s.estimatedUSD)}. All prior campaigns and the separate tiny access diagnostic: ${money(s.priorRecordedUSD)}. Shared recorded total: **${money(s.recordedTotalUSD)}**; remaining **${money(s.remainingUSD)}** of the original $${plan.maxEstimatedUSD} ceiling. Do not add preserved-row costs again. Estimates/reservations are not invoices.
- Selected attempts: ${s.requests} requests; ${s.inputTokens} accepted input tokens, ${s.outputTokens} accepted output tokens. ${s.auditChecks} total integrity checks, including ${plan.carryover.auditChecks} carried checks; ${s.phases.length} new archived blocks. Hash consistency is not independent attestation or proof of task success.
- Source: \`${s.sourceHash ?? plan.sourceHash}\`; plan hash: \`${s.planHash ?? 'not yet bound'}\`.
- Archives live under each row's original campaign: \`.runtime/<originCampaign>/\`. Byte hashes are in the corresponding manifests. Two exact-byte examples are public: [Astra topic pass](${examplePrefix}block-009.tar.gz) and [Luna thread failure](${examplePrefix}block-019.tar.gz). All other original archives remain local. The separate [structured trial library](../../trial-library/catalog.json) publishes episode traces and UI-state playback without PNG bytes; original image hashes remain inspectable. The two full archive examples are curated examples, not the complete sample.
${completion}

Verify either public example without a key: \`node scripts/inspect-task-campaign.mjs block-009 ${pilotId}\` (or \`block-019\`). It verifies the published archive hash, source and trace integrity. [Pilot admission review](../../../docs/campaigns/${pilotId}-pilot-review.md) records all 36 inspected archives, including the failed and blocked attempts.

With all original archives and block reports available locally, run \`node scripts/verify-breadth-completion.mjs ${id}\` for the complete no-inference audit. It refuses partial collection. \`--partial\` checks a running snapshot without writing or claiming completion.

## Availability and interpretation

- [Task wording and trace review](../../../docs/campaigns/model-breadth-2026-10-03-observations.md): release-sync ambiguously groups two source locations; design-handoff leaves placeholder substitution implicit. Both 17-cell slices remain unchanged with task-quality caveats. Raw totals are not a validated model-accuracy ranking. Scripted executability does not establish instruction clarity.
${plan.unavailable.map((r) => `- ${r.family}: ${r.reason}`).join('\n')}
${s.limitations.map((l) => '- ' + l).join('\n')}

The earlier [1,800-cell campaign](../all-tasks-2026-10-03/README.md) is closed at 37 attempts. Its 1,763 unattempted cells remain in that historical record, not as failures or extra trials in this one-pass inventory.
`;
assertSafeEvidence(text, [process.env.RAMP_ROUTER_API_KEY]);
writeFileSync(`${root}/README.md`, text);
console.log(JSON.stringify({ id, status: s.status, attempted: c.attempted, planned: c.planned }));
