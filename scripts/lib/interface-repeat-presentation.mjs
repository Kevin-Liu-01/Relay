import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { validateCatalog } from '../../docs/review-app/data.mjs';
import { analyzeRepeatedInterfaces, modeNames } from './interface-repeat-analysis.mjs';

export function repeatPresentation({ heading, mark, names, marks, elapsed }) {
  const dir = 'evidence/campaigns/interface-repeat-2026-10-05-continuation';
  const bytes = readFileSync(`${dir}/verified-summary.json`);
  const summary = JSON.parse(bytes),
    receipt = JSON.parse(readFileSync(`${dir}/verification-public-48.json`));
  assert.equal(receipt.status, 'complete-verified');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), receipt.summaryHash);
  const catalog = validateCatalog(
    JSON.parse(readFileSync('evidence/interface-repeat-trial-library/catalog.json')),
  );
  assert.equal(catalog.summaryHash, receipt.summaryHash);
  assert.equal(catalog.attempted, 48);
  const accounting = JSON.parse(readFileSync(`${dir}/accounting.json`));
  assert.deepEqual(accounting.totals, receipt.accounting);
  const a = analyzeRepeatedInterfaces(summary, accounting);
  const url = (trial, view = 'replay') =>
    `https://relay.kevinliu.studio/demo/review.html?study=repeat&amp;trial=${trial.id}&amp;view=${view}`;
  const modes = Object.keys(modeNames);
  const table = `<div class="table-scroll" tabindex="0" role="region" aria-label="Sortable repeated interface results"><table class="study-table sortable" id="interface-repeat-results"><caption>Passed / 6 attempts · three tasks, two repeats · median elapsed seconds</caption><thead><tr>${heading('Model', 'text', 'ascending')}${modes.map((m) => heading(modeNames[m])).join('')}${heading('Allowance', 'number', 'ascending')}</tr></thead><tbody>${a.byModel
    .map(
      (r) =>
        `<tr><th scope="row" data-sort="${names[r.model]}"><span class="study-model">${mark(marks[r.model])}${names[r.model]}</span></th>${modes
          .map((mode) => {
            const c = r.byInterface[mode],
              trial = catalog.trials.find((t) => t.model === r.model && t.interface === mode);
            return `<td data-sort="${c.outcomes.passed ?? 0}"><a href="${url(trial)}" aria-label="Review ${names[r.model]} ${modeNames[mode]} repeats"><strong>${c.outcomes.passed ?? 0} / ${c.attempts}</strong></a><small>${c.outcomes.incomplete ?? 0} incomplete · ${c.outcomes.blocked ?? 0} blocked</small><dl class="study-times" aria-label="Median elapsed time"><div><dt>All</dt><dd data-time="all">${elapsed(c.medianSecondsAll)}</dd></div><div><dt>Passed</dt><dd data-time="passed">${elapsed(c.medianSecondsPassed)}</dd></div></dl></td>`;
          })
          .join(
            '',
          )}<td data-sort="${modes.reduce((n, m) => n + r.byInterface[m].allowanceUSD, 0)}">$${modes.reduce((n, m) => n + r.byInterface[m].allowanceUSD, 0).toFixed(4)}</td></tr>`,
    )
    .join('')}</tbody></table></div>`;
  const report =
    'https://github.com/Kevin-Liu-01/Relay/blob/main/evidence/campaigns/interface-repeat-2026-10-05-continuation/analysis.md';
  const links = `<div class="study-links"><a href="https://relay.kevinliu.studio/demo/review.html?study=repeat">All 48 traces and replays ↗</a><a href="https://relay.kevinliu.studio/demo/interface-repeat-accounting.csv">Costs CSV ↓</a><a href="${report}">All paired comparisons ↗</a></div>`;
  const status = `Verified: 35 passed · 1 incomplete · 12 blocked. $${accounting.totals.acceptedUSD.toFixed(4)} usage + $${accounting.totals.reservedUSD.toFixed(4)} unresolved = $${accounting.totals.recordedUSD.toFixed(4)} of $25. Six requests lack receipts.`;
  const api = a.paired.find((p) => p.left === 'a11y' && p.right === 'api');
  const findings = `<li>Each interface had 12 attempts: API passed 12, accessibility 10, Page JSON 9, and pixels 4.</li><li>On ${api.bothPassed} shared passes, API used a median ${api.bothPassedMedianSecondsLeftMinusRight.toFixed(1)} fewer seconds and ${api.bothPassedMedianActionsLeftMinusRight} fewer actions than accessibility.</li><li>API skips browser interaction, so its higher completion count does not show better computer use.</li>`;
  const details = `<details class="repeat-trial-details"><summary>Results for every task and repeat</summary><div class="table-scroll" tabindex="0" role="region" aria-label="All repeated task outcomes"><table class="study-table sortable" id="repeat-task-results"><thead><tr>${heading('Model', 'text', 'ascending')}${heading('Task', 'text', 'ascending')}${heading('Interface', 'text', 'ascending')}${heading('Passed')}${heading('Repeat 1', 'text', 'ascending')}${heading('Repeat 2', 'text', 'ascending')}</tr></thead><tbody>${a.repeatConsistency
    .map(
      (r) =>
        `<tr><th data-sort="${r.model}">${names[r.model]}</th><td data-sort="${r.task}">${r.task}</td><td data-sort="${r.interface}">${modeNames[r.interface]}</td><td data-sort="${r.passes}">${r.passes} / 2</td>${r.trials
          .map((t) => {
            const trial = catalog.trials.find((v) => v.phase === t.phase);
            return `<td data-sort="${t.outcome}"><a href="${url(trial)}">${t.outcome} · ${t.seconds.toFixed(1)} s</a> · <a href="${url(trial, 'trace')}">trace</a></td>`;
          })
          .join('')}</tr>`,
    )
    .join('')}</tbody></table></div></details>`;
  return { table: table + links, findings, status, details };
}
