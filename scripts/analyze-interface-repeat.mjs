import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { analyzeRepeatedInterfaces, modeNames } from './lib/interface-repeat-analysis.mjs';
const dir = 'evidence/campaigns/interface-repeat-2026-10-05-continuation';
const bytes = readFileSync(`${dir}/verified-summary.json`);
const summary = JSON.parse(bytes),
  receipt = JSON.parse(readFileSync(`${dir}/verification-public-48.json`));
assert.equal(receipt.status, 'complete-verified');
assert.equal(createHash('sha256').update(bytes).digest('hex'), receipt.summaryHash);
const accounting = JSON.parse(readFileSync(`${dir}/accounting.json`));
assert.deepEqual(accounting.totals, receipt.accounting);
const a = { summaryHash: receipt.summaryHash, ...analyzeRepeatedInterfaces(summary, accounting) };
writeFileSync(`${dir}/analysis.json`, JSON.stringify(a, null, 2) + '\n');
const num = (v, digits = 2) => (v === null ? 'N/A' : v.toFixed(digits));
const pairs = (rows) =>
  [
    '| Left / right | Both pass | Left only | Right only | Neither | Blocked either | Shared-pass seconds, left minus right | Shared-pass actions difference | Shared-pass allowance difference USD |',
    '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
    ...rows.map(
      (p) =>
        `| ${modeNames[p.left]} / ${modeNames[p.right]} | ${p.bothPassed} | ${p.leftOnly} | ${p.rightOnly} | ${p.neitherPassed} | ${p.blockedEither} | ${num(p.bothPassedMedianSecondsLeftMinusRight)} | ${num(p.bothPassedMedianActionsLeftMinusRight)} | ${num(p.bothPassedMedianAllowanceLeftMinusRight, 6)} |`,
    ),
  ].join('\n');
const text = [
  '# Repeated interface comparison: all 48 attempts',
  '',
  '## What was held constant',
  '',
  '- Sol and Sonnet each attempted thread reply, message editing and incident closeout through four interfaces, twice. These cover parent selection, editing, and a multi-step workflow.',
  '- Each attempt started in a fresh workspace with the same task-specific seed-2042 fixture, task wording and grader. Modes were shuffled within model/task/repetition blocks.',
  '- Low reasoning, recent-four history, no guide, 40 actions, 180 seconds, 90 seconds per request and a $1 per-cell allowance were unchanged. API is tool use, not computer use.',
  '- These are two attempts on each of three fixed development tasks, not six independent task variants. No retries, replacements or pooling with the earlier 96 or 306 attempts.',
  '',
  '## Verification and cost',
  '',
  `- All 48 attempted: ${summary.totals.passed} passed, ${summary.totals.incomplete} incomplete and ${summary.totals.blocked} blocked. Zero capture gaps.`,
  `- ${receipt.checks} integrity checks and ${receipt.gradeChecks} saved-state grade checks passed.`,
  `- ${accounting.totals.requests} requests, ${accounting.totals.receipts} accepted receipts, ${accounting.totals.unknownRequests} requests with unknown usage.`,
  `- $${num(accounting.totals.acceptedUSD, 6)} accepted estimates + $${num(accounting.totals.reservedUSD, 6)} retained reservations = $${num(accounting.totals.recordedUSD, 6)} of the $25 study allowance. These are base-rate estimates, not invoices; hosting costs are excluded.`,
  '- Collection paused for a reporting-only repair and later for a deactivated Router key. Existing outcomes and costs were preserved. The user restored account access; continuation began at the next untouched cell.',
  '',
  '## Outcomes, time, actions and costs',
  '',
  '| Interface | Pass / 12 | Incomplete | Blocked | Median seconds, all | Median seconds, passed | Median actions, all | Accepted USD | Reserved USD | Total USD |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...Object.entries(a.byInterface).map(
    ([mode, r]) =>
      `| ${modeNames[mode]} | ${r.outcomes.passed ?? 0} | ${r.outcomes.incomplete ?? 0} | ${r.outcomes.blocked ?? 0} | ${num(r.medianSecondsAll)} | ${num(r.medianSecondsPassed)} | ${num(r.medianActionsAll)} | ${num(r.usageUSD, 6)} | ${num(r.unresolvedUSD, 6)} | ${num(r.allowanceUSD, 6)} |`,
  ),
  '',
  'Elapsed time includes provider calls and browser work. All-attempt medians include early stops. Passed-only medians use different successful subsets and are not an overall speed ranking.',
  '',
  '## All six paired comparisons',
  '',
  'Pair within model, task and repetition. Each row contains 12 pairs. Both, left only, right only and neither sum to 12. Blocked-either overlaps these categories. Time, action and cost differences use only pairs where both passed; they are medians of within-pair differences, not differences between group medians. Positive means the left interface used more.',
  '',
  pairs(a.paired),
  '',
  '## Both repeats for every condition',
  '',
  '| Model | Task | Interface | Passed / 2 | Repeat 1 | Repeat 2 |',
  '| --- | --- | --- | ---: | --- | --- |',
  ...a.repeatConsistency.map(
    (r) =>
      `| ${r.model} | ${r.task} | ${modeNames[r.interface]} | ${r.passes} | ${r.trials[0].outcome} | ${r.trials[1].outcome} |`,
  ),
  '',
  '## Comparisons within each model',
  '',
  ...a.byModel.flatMap((r) => [`### ${r.model}`, '', pairs(r.paired), '']),
  '## Comparisons within each task',
  '',
  ...a.byTask.flatMap((r) => [`### ${r.task}`, '', pairs(r.paired), '']),
  '## Stops and interpretation',
  '',
  ...Object.entries(a.byInterface).map(
    ([mode, r]) =>
      `- ${modeNames[mode]} blocks: ${
        Object.entries(r.blockedReasons)
          .map(([k, v]) => `${v} ${k}`)
          .join(', ') || 'none'
      }.`,
  ),
  ...a.limitations.map((s) => `- ${s}`),
  '- Pixel results reflect this low-detail image and macOS keyboard setup. The observations do not isolate perception quality from navigation, keyboard behavior or time limits.',
  '- The design prespecified descriptive counts and all six paired comparisons. No significance test, post-hoc power claim, or stopping after a favorable result was used.',
  '',
  '## Reproduce and review',
  '',
  '- Run `node scripts/analyze-interface-repeat.mjs` against the verified summary and accounting export.',
  `- Summary SHA-256: \`${receipt.summaryHash}\`.`,
  '- [Costs CSV](accounting.csv) · [Full analysis JSON](analysis.json) · [Verification](verification-public-48.json).',
  '- [Every trace and replay](https://relay.kevinliu.studio/demo/review.html?study=repeat).',
  '',
].join('\n');
writeFileSync(`${dir}/analysis.md`, text);
console.log(
  JSON.stringify(
    {
      byInterface: a.byInterface,
      paired: a.paired,
      byModel: a.byModel.map(({ model, byInterface }) => ({ model, byInterface })),
    },
    null,
    2,
  ),
);
