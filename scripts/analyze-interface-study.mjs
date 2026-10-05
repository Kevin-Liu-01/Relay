import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { analyzeInterfaces, modeNames } from './lib/interface-analysis.mjs';
const dir = 'evidence/campaigns/interface-study-2026-10-05';
const bytes = readFileSync(`${dir}/verified-summary.json`);
const summary = JSON.parse(bytes),
  receipt = JSON.parse(readFileSync(`${dir}/verification-public-96.json`));
assert.equal(receipt.status, 'complete-verified');
assert.equal(createHash('sha256').update(bytes).digest('hex'), receipt.summaryHash);
const accounting = JSON.parse(readFileSync(`${dir}/accounting.json`));
assert.deepEqual(accounting.totals, receipt.accounting);
const analysis = { summaryHash: receipt.summaryHash, ...analyzeInterfaces(summary, accounting) };
const pixel = analysis.byInterface.pixels;
writeFileSync(`${dir}/analysis.json`, JSON.stringify(analysis, null, 2) + '\n');
const money = (n) => `$${n.toFixed(6)}`;
const number = (n) => (n === null ? 'N/A' : n.toFixed(2));
const pairTable = (rows) =>
  [
    '| Left / right | Both pass | Left only | Right only | Neither pass | Blocked in either |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
    ...rows.map(
      (r) =>
        `| ${modeNames[r.left]} / ${modeNames[r.right]} | ${r.bothPassed} | ${r.leftOnly} | ${r.rightOnly} | ${r.neitherPassed} | ${r.blockedEither} |`,
    ),
  ].join('\n');
const text = [
  '# Completed matched-interface study',
  '',
  '## Scope and verification',
  '',
  '- All 96 planned cells were attempted once. No retry or replacement was made.',
  '- Four models each attempted six public development tasks through four interfaces.',
  `- Outcomes: ${summary.totals.passed} passed, ${summary.totals.incomplete} incomplete and ${summary.totals.blocked} blocked.`,
  `- Archive verification passed ${receipt.checks.toLocaleString('en-US')} integrity checks and ${receipt.gradeChecks} saved-state grade checks.`,
  `- Estimated allowance: ${money(receipt.accounting.acceptedUSD)} usage plus ${money(receipt.accounting.reservedUSD)} unresolved, totaling ${money(receipt.accounting.recordedUSD)} of $25.`,
  `- ${receipt.accounting.requests} requests returned ${receipt.accounting.receipts} accepted receipts. ${receipt.accounting.unknownRequests} requests have unknown usage.`,
  '- Costs use recorded base rates. They are not invoices and exclude hosting costs.',
  '- The final cell stopped at its unchanged $1 run cap. No planned cell remained after it.',
  '',
  '## Outcomes, time, actions and cost',
  '',
  'Each interface has 24 attempts. Time and action medians include every attempt, including early stops.',
  '',
  '| Interface | Pass | Incomplete | Blocked | Median seconds | Median actions | Usage estimate | Unresolved | Total allowance |',
  '| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |',
  ...Object.entries(analysis.byInterface).map(
    ([mode, r]) =>
      `| ${modeNames[mode]} | ${r.outcomes.passed ?? 0} | ${r.outcomes.incomplete ?? 0} | ${r.outcomes.blocked ?? 0} | ${number(r.medianSecondsAll)} | ${number(r.medianActionsAll)} | ${money(r.usageUSD)} | ${money(r.unresolvedUSD)} | ${money(r.allowanceUSD)} |`,
  ),
  '',
  '## Matched task outcomes',
  '',
  'Each row contains the same 24 model/task pairs. Blocked attempts count as not passed and remain separately identified. The first four outcome columns are disjoint and sum to 24. The last column overlaps them.',
  '',
  pairTable(analysis.paired),
  '',
  '## Matched time, actions and cost',
  '',
  'Secondary description: include only tasks that both interfaces passed. Each value is the median of the within-pair left-minus-right difference. These outcome-selected subsets are not a speed ranking or a causal estimate. Positive values mean the left interface used more.',
  '',
  '| Left / right | Both passed | Seconds difference | Actions difference | Allowance difference USD |',
  '| --- | ---: | ---: | ---: | ---: |',
  ...analysis.paired.map(
    (r) =>
      `| ${modeNames[r.left]} / ${modeNames[r.right]} | ${r.bothPassed} | ${number(r.bothPassedMedianSecondsLeftMinusRight)} | ${number(r.bothPassedMedianActionsLeftMinusRight)} | ${r.bothPassedMedianAllowanceLeftMinusRight === null ? 'N/A' : r.bothPassedMedianAllowanceLeftMinusRight.toFixed(6)} |`,
  ),
  '',
  '## Blocked attempts',
  '',
  ...Object.entries(analysis.byInterface).map(
    ([mode, r]) =>
      `- ${modeNames[mode]}: ${
        Object.entries(r.blockedReasons)
          .map(([reason, n]) => `${n} ${reason}`)
          .join(', ') || 'none'
      }.`,
  ),
  `- ${analysis.diagnosticPassesBlocked.join(' and ')} reached passing diagnostic states but remain blocked under the unchanged outcome rule.`,
  '',
  '## Comparisons within each model',
  '',
  ...analysis.byModel.flatMap((r) => [`### ${r.model}`, '', pairTable(r.paired), '']),
  '## Interpretation and limits',
  '',
  '- API had 21 passes, accessibility 18, Page JSON 16 and pixels 3 in this fixed setup.',
  '- API tied or exceeded the pass count of each other interface for all four models.',
  '- API is tool use, not browser control. It changes both visible information and action size.',
  `- ${pixel.outcomes.blocked} pixel attempts were blocked: ${Object.entries(pixel.blockedReasons)
    .map(([k, n]) => `${n} ${k}`)
    .join(', ')}. These are not all perception failures.`,
  ...analysis.limitations.map((s) => `- ${s}`),
  '- The observations can guide a new preregistered study. Do not tune or relabel this completed one.',
  '',
  '## Reproduce and inspect',
  '',
  '- Run `node scripts/analyze-interface-study.mjs` against the verified snapshot and accounting export.',
  '- Original archives were verified before the viewport release was integrated. Current release source is not trial-generating source.',
  `- Verified summary SHA-256: \`${receipt.summaryHash}\`.`,
  '- [Study plan](../../../docs/campaigns/interface-study-2026-10-05.md) · [Verification receipt](verification-public-96.json) · [Costs CSV](accounting.csv) · [Analysis JSON](analysis.json).',
  '- [All traces and replays](https://relay.kevinliu.studio/demo/review.html?study=interfaces).',
  '',
].join('\n');
writeFileSync(`${dir}/analysis.md`, text);
console.log(JSON.stringify(analysis, null, 2));
