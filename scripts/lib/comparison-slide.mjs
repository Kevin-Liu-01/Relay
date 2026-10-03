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

function modelRows(summary, logos) {
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
              .map(
                (r) =>
                  `<span class="trial-cell ${r.outcome}" title="${escapeHTML(`${r.task} · seed ${r.seed} · ${r.outcome}`)}"></span>`,
              )
              .join('');
      return `<tr data-model="${escapeHTML(m.model)}">
      <th scope="row" data-sort="${escapeHTML(name)}"><span class="model-identity">${logos[m.model] ?? ''}<span>${escapeHTML(name)}<small>${escapeHTML(family)}</small></span></span></th>
      ${cell(m.attempted, `<span class="trial-count">${m.attempted} / ${m.planned}</span><span class="trial-strip${m.planned > 40 ? ' dense' : ''}" role="img" aria-label="${m.passed} passed, ${m.incomplete} incomplete, ${m.blocked} blocked, ${m.unattempted} unattempted">${strip}</span>`)}
      ${cell(m.successRate, `<strong class="pass-count">${m.attempted ? `${m.passed} / ${m.attempted}` : '—'}</strong><small>${m.successRate == null ? 'Not run' : `${Math.round(m.successRate * 100)}%`}</small>`)}
      ${cell(m.incomplete, m.incomplete)}${cell(m.blocked, m.blocked)}
      ${cell(m.medianSeconds, m.medianSeconds == null ? '—' : `${m.medianSeconds.toFixed(1)}s`)}
      ${cell(m.usageKnown ? m.estimatedUSD : null, m.estimatedUSD == null ? '—' : m.usageKnown ? `$${m.estimatedUSD.toFixed(3)}` : `Unknown<small>$${m.estimatedUSD.toFixed(3)} incl. reservation</small>`)}
    </tr>`;
    })
    .join('');
}
export function comparisonSlide(summary, logos = {}) {
  const rows = modelRows(summary, logos);
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
      (r) => `<tr>
    <th scope="row" data-sort="${escapeHTML(r.model)}">${escapeHTML(names[r.model]?.[0] ?? r.model)}</th>
    ${cell(r.task, escapeHTML(r.task))}${cell(r.seed, r.seed)}
    ${cell(r.outcome, `<span class="outcome-label" data-outcome="${r.outcome}">${escapeHTML(r.outcome)}</span>`)}
    ${cell(r.actionAttempts, r.actionAttempts)}
    ${cell(r.durationMs, r.durationMs == null ? '—' : `${(r.durationMs / 1000).toFixed(1)}s`)}
    ${cell(r.usageKnown ? r.estimatedUSD : null, r.estimatedUSD == null ? '—' : r.usageKnown ? `$${r.estimatedUSD.toFixed(4)}` : `Unknown ($${r.estimatedUSD.toFixed(4)} incl. reservation)`)}
    <td>${escapeHTML(r.error || r.failedChecks.join(', ') || (r.outcome === 'passed' ? 'All state checks passed' : 'Not launched'))}${r.cohort ? `<small class="trial-origin">${escapeHTML(r.cohort)} · ${escapeHTML(r.originCampaign)} · ${escapeHTML(r.phase)}${r.runId ? ` · ${escapeHTML(r.runId)}` : ''}</small>` : ''}</td>
  </tr>`,
    )
    .join('');
  return {
    COMPARISON_CLASS: summary.byModel.length > 8 ? ' breadth-slide' : '',
    COMPARISON_TITLE: `${summary.byModel.length} models. Every task.`,
    COMPARISON_REPEATS: summary.trialsPerTaskModel ?? 20,
    COMPARISON_SCOPE: `${summary.byTask?.length ?? 18} public tasks · ${summary.trialsPerTaskModel ?? 20} attempt${summary.trialsPerTaskModel === 1 ? '' : 's'} per task/model · accessibility control · $300 shared ceiling.${summary.generatedAt ? ` Snapshot ${escapeHTML(summary.generatedAt.slice(0, 16).replace('T', ' '))} UTC.` : ''}`,
    COMPARISON_PROVENANCE: summary.preserved
      ? `${summary.preserved} prior attempts preserved, including failures. New cells only; no retries. Family/tier coverage, not a popularity ranking.`
      : 'Passes / attempted. Truncated output is not executed; no retries. Median includes blocks.',
    COMPARISON_FILTER: filters.length
      ? `<details class="task-filter" id="task-filter"><summary>All ${summary.byTask.length} tasks</summary><div role="group" aria-label="Choose a task">${filters.map((f) => `<button type="button" data-task="${escapeHTML(f.task)}" aria-pressed="${f.task === 'all'}">${escapeHTML(f.label)}</button>`).join('')}</div></details>${filters.map((f) => `<template data-task="${escapeHTML(f.task)}"><table><tbody>${modelRows(f, logos)}</tbody></table></template>`).join('')}`
      : '',
    COMPARISON_TABLE: `<div class="table-scroll" tabindex="0" role="region" aria-label="Sortable model results"><table class="comparison-table sortable" id="model-results"><caption class="sr-only">${summary.byModel.length}-model development comparison. Activate column headers to sort. Missing values always sort last.</caption><thead><tr>${heading('Model', 'text')}${heading('Trials')}${heading('Passed', 'number', 'descending')}${heading('Incomplete')}${heading('Blocked')}${heading('Median time')}${heading('Est. cost')}</tr></thead><tbody>${rows}</tbody></table></div>`,
    COMPARISON_TRIALS: `<div class="table-scroll"><table class="trials-table sortable" id="trial-results"><caption class="sr-only">Every planned trial, including unattempted cells.</caption><thead><tr>${heading('Model', 'text')}${heading('Task', 'text')}${heading('Seed')}${heading('Outcome', 'text')}${heading('Actions')}${heading('Time')}${heading('Est. cost')}<th scope="col">Checks / stop reason</th></tr></thead><tbody>${trials}</tbody></table></div>`,
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
