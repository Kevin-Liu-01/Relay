import { reviewURL, trialId } from '../../docs/review-app/data.mjs';
import { sumAccounting } from './report-accounting.mjs';
export const escapeHTML = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const attr = (value) => (value == null ? '' : escapeHTML(value));
const cell = (value, display) => `<td data-sort="${attr(value)}">${display}</td>`;
const names = {
  'gpt-6.1-sol': ['GPT-6.1 Sol', 'OpenAI'],
  'gpt-6-astra': ['GPT-6 Astra', 'OpenAI'],
  'gpt-oss-120b': ['GPT-OSS 120B', 'OpenAI'],
  'claude-fable-5-1': ['Claude Fable 5.1', 'Anthropic'],
  'claude-opus-5-5': ['Claude Opus 5.5', 'Anthropic'],
  'claude-haiku-4-5': ['Claude Haiku 4.5', 'Anthropic'],
  'grok-4.7': ['Grok 4.7', 'xAI'],
  'deepseek-v4-pro-0813': ['DeepSeek V4 Pro', 'DeepSeek'],
  'glm-5p3': ['GLM 5.3', 'Zhipu'],
  'kimi-k3': ['Kimi K3', 'Moonshot'],
  'minimax-m3': ['MiniMax M3', 'MiniMax'],
  'nemotron-3-ultra': ['Nemotron 3 Ultra', 'NVIDIA'],
  'claude-sonnet-5-5': ['Claude Sonnet 5.5', 'Anthropic'],
  'gemini-3.8-flash': ['Gemini 3.8 Flash', 'Google'],
  'qwen3p8-max': ['Qwen 3.8 Max', 'Qwen'],
  'gpt-6-luna': ['GPT-6 Luna', 'OpenAI'],
  'gpt-4.1-nano': ['GPT-4.1 nano', 'OpenAI'],
  'gemini-2.5-flash-lite': ['Gemini 2.5 Flash-Lite', 'Google'],
  'deepseek-v4.1-flash': ['DeepSeek V4.1 Flash', 'DeepSeek'],
  'glm-5p3-flash': ['GLM 5.3 Flash', 'Zhipu'],
  'nemotron-lightning-3p5-30b-a3b': ['Nemotron Lightning', 'NVIDIA · 3.5 30B A3B'],
};
const heading = (name, type = 'number', direction = 'ascending') =>
  `<th scope="col" aria-sort="none"><button type="button" data-type="${type}" data-direction="${direction}">${name}<span class="sort-arrow" aria-hidden="true">↕</span></button></th>`;

const money = (value) => (value == null ? '—' : `$${value.toFixed(4)}`);
function costCells(cost, row) {
  if (!cost)
    cost = {
      acceptedUSD: row?.usageKnown ? row.estimatedUSD : null,
      reservedUSD: row?.usageKnown ? 0 : null,
      recordedUSD: row?.estimatedUSD,
    };
  const display = (value) =>
    value == null && row?.estimatedUSD != null ? 'Unknown' : money(value);
  return `${cell(cost?.acceptedUSD, display(cost?.acceptedUSD))}${cell(cost?.reservedUSD, display(cost?.reservedUSD))}${cell(cost?.recordedUSD, money(cost?.recordedUSD))}`;
}
function modelRows(summary, logos, reviewIds, accounting) {
  return summary.byModel
    .map((m) => {
      const [name, family] = names[m.model] ?? [m.model, 'Model route'];
      const trials = summary.rows
        .filter((r) => r.model === m.model)
        .sort((a, b) => a.task.localeCompare(b.task) || a.seed - b.seed);
      const strip =
        m.planned > 40
          ? ['passed', 'incomplete', 'blocked', 'unattempted']
              .filter((outcome) => m[outcome] > 0)
              .map(
                (outcome) =>
                  `<span class="trial-cell ${outcome}" style="flex:${m[outcome]}" title="${m[outcome]} ${outcome}"></span>`,
              )
              .join('')
          : trials
              .map((r) =>
                reviewIds.has(trialId(r))
                  ? `<a class="trial-cell ${r.outcome}" href="https://relay.kevinliu.studio${escapeHTML(reviewURL(r, 'replay'))}" aria-label="Replay ${escapeHTML(`${r.model} · ${r.task} · ${r.outcome}`)}" title="${escapeHTML(`${r.task} · ${r.outcome} · Watch replay`)}"></a>`
                  : `<span class="trial-cell ${r.outcome}"></span>`,
              )
              .join('');
      const costs = trials.map((r) => accounting[trialId(r)]).filter(Boolean);
      const cost = costs.length === trials.length ? sumAccounting(costs) : null;
      return `<tr data-model="${escapeHTML(m.model)}">
      <th scope="row" data-sort="${escapeHTML(name)}"><button class="model-identity model-name" type="button" data-review-model="${escapeHTML(m.model)}" aria-label="View ${escapeHTML(name)} trials">${logos[m.model] ?? ''}<span>${escapeHTML(name)}<small>${escapeHTML(family)}</small></span></button></th>
      ${cell(m.attempted, `<span class="trial-count">${m.attempted} / ${m.planned}</span><span class="trial-strip${m.planned > 40 ? ' dense' : ''}" aria-label="${m.passed} passed, ${m.incomplete} incomplete, ${m.blocked} blocked, ${m.unattempted} unattempted">${strip}</span>`)}
      ${cell(m.successRate, `<strong class="pass-count">${m.attempted ? `${m.passed} / ${m.attempted}` : '—'}</strong><small>${m.successRate == null ? 'Not run' : `${Math.round(m.successRate * 100)}%`}</small>`)}
      ${cell(m.incomplete, m.incomplete)}${cell(m.blocked, m.blocked)}
      ${cell(m.medianSeconds, m.medianSeconds == null ? '—' : `${m.medianSeconds.toFixed(1)}s`)}
      ${costCells(cost, m)}
      <td><button class="model-trials" type="button" data-review-model="${escapeHTML(m.model)}">${trials.length} ${trials.length === 1 ? 'trial' : 'trials'} ↗</button></td>
    </tr>`;
    })
    .join('');
}
export function comparisonSlide(summary, logos = {}, reviewIds = new Set(), accounting = {}) {
  const rows = modelRows(summary, logos, reviewIds, accounting);
  const filters = summary.byTask
    ? [
        {
          task: 'all',
          label: `All ${summary.byTask.length} tasks`,
          byModel: summary.byModel,
          rows: summary.rows,
        },
        ...summary.byTask.map((t) => ({
          ...t,
          label: t.task.replaceAll('-', ' '),
          rows: summary.rows.filter((r) => r.task === t.task),
        })),
      ]
    : [];
  const trials = summary.rows
    .map(
      (r) => `<tr data-model="${escapeHTML(r.model)}" data-task="${escapeHTML(r.task)}">
    <th scope="row" data-sort="${escapeHTML(r.model)}">${escapeHTML(names[r.model]?.[0] ?? r.model)}${reviewIds.has(trialId(r)) && reviewURL(r) ? `<span class="trial-review-links"><a href="https://relay.kevinliu.studio${escapeHTML(reviewURL(r, 'trace'))}">Review trace ↗</a><a href="https://relay.kevinliu.studio${escapeHTML(reviewURL(r, 'replay'))}">Watch replay ↗</a></span>` : ''}</th>
    ${cell(r.task, escapeHTML(r.task))}${cell(r.seed, r.seed)}
    ${cell(r.outcome, `<span class="outcome-label" data-outcome="${r.outcome}">${escapeHTML(r.outcome)}</span>`)}
    ${cell(r.actionAttempts, r.actionAttempts)}
    ${cell(r.durationMs, r.durationMs == null ? '—' : `${(r.durationMs / 1000).toFixed(1)}s`)}
    ${costCells(accounting[trialId(r)], r)}
    ${cell(accounting[trialId(r)]?.requests, accounting[trialId(r)]?.requests ?? '—')}
    ${cell(accounting[trialId(r)]?.inputTokens, accounting[trialId(r)]?.inputTokens?.toLocaleString('en-US') ?? '—')}
    ${cell(accounting[trialId(r)]?.outputTokens, accounting[trialId(r)]?.outputTokens?.toLocaleString('en-US') ?? '—')}
    <td>${escapeHTML(r.error || r.failedChecks.join(', ') || (r.outcome === 'passed' ? 'All state checks passed' : 'Not launched'))}${r.cohort ? `<small class="trial-origin">${escapeHTML(r.cohort)} · ${escapeHTML(r.originCampaign)} · ${escapeHTML(r.phase)}${r.runId ? ` · ${escapeHTML(r.runId)}` : ''}</small>` : ''}</td>
  </tr>`,
    )
    .join('');
  return {
    COMPARISON_CLASS: summary.byModel.length > 8 ? ' breadth-slide' : '',
    COMPARISON_TITLE: `Results for ${summary.byModel.length} models`,
    COMPARISON_REPEATS: summary.trialsPerTaskModel ?? 20,
    COMPARISON_SCOPE: `${summary.byTask?.length ?? 18} public tasks. ${summary.trialsPerTaskModel ?? 20} run${summary.trialsPerTaskModel === 1 ? '' : 's'} per task and model. All use accessibility controls. Median time includes blocked runs.`,
    COMPARISON_PROVENANCE: summary.preserved
      ? `${summary.preserved} earlier runs are included. No retries. One run per task cannot establish a reliable model ranking.`
      : 'All attempts are included. No retries. Incomplete model responses are not executed.',
    COMPARISON_FILTER: filters.length
      ? `<details class="task-filter" id="task-filter"><summary>All ${summary.byTask.length} tasks</summary><div role="group" aria-label="Choose a task">${filters.map((f) => `<button type="button" data-task="${escapeHTML(f.task)}" aria-pressed="${f.task === 'all'}">${escapeHTML(f.label)}</button>`).join('')}</div></details>${filters.map((f) => `<template data-task="${escapeHTML(f.task)}"><table><tbody>${modelRows(f, logos, reviewIds, accounting)}</tbody></table></template>`).join('')}`
      : '',
    COMPARISON_TABLE: `<div class="table-scroll" tabindex="0" role="region" aria-label="Sortable model results"><table class="comparison-table sortable" id="model-results"><caption class="sr-only">${summary.byModel.length}-model development comparison. Activate column headers to sort. Missing values always sort last. Costs are USD estimates, not invoices.</caption><thead><tr>${heading('Model', 'text')}${heading('Trials')}${heading('Passed', 'number', 'descending')}${heading('Incomplete')}${heading('Blocked')}${heading('Median time')}${heading('Usage estimate')}${heading('Unresolved')}${heading('Total allowance')}<th scope="col">Trace / replay</th></tr></thead><tbody>${rows}</tbody></table></div>`,
    COMPARISON_TRIALS: `<div class="table-scroll" tabindex="0" role="region" aria-label="Trial evidence and costs"><table class="trials-table sortable" id="trial-results"><caption class="sr-only">Every planned trial. Token counts cover accepted receipts only; missing usage is not zero.</caption><thead><tr>${heading('Model', 'text')}${heading('Task', 'text')}${heading('Seed')}${heading('Outcome', 'text')}${heading('Actions')}${heading('Time')}${heading('Usage estimate')}${heading('Unresolved')}${heading('Total allowance')}${heading('Calls')}${heading('Input tokens')}${heading('Output tokens')}<th scope="col">Checks / stop reason</th></tr></thead><tbody>${trials}</tbody></table></div>`,
    COMPARISON_COUNTS: `${summary.totals.attempted} / ${summary.totals.planned} attempted · ${summary.totals.passed} passed · ${summary.totals.incomplete} incomplete · ${summary.totals.blocked} blocked`,
    COMPARISON_STATUS: summary.trialsPerTaskModel
      ? `${summary.trialsPerTaskModel} per task/model · ${summary.status === 'completed' ? 'Collection complete' : summary.status === 'stopped' ? 'Collection stopped' : 'Collection incomplete'}`
      : summary.status === 'completed'
        ? '20 trials per model completed'
        : summary.status === 'stopped'
          ? 'Campaign stopped · incomplete coverage'
          : 'Planned: 20 trials per model · collection incomplete',
  };
}
