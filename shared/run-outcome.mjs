// Presentation only. Never changes a recorded reward, receipt or historical run.
export function episodeOutcome(episode) {
  if (!episode) return { kind: 'pending', title: 'Ready', symbol: '—' };
  if (['queued', 'running'].includes(episode.status))
    return {
      kind: 'pending',
      title: episode.status === 'queued' ? 'Not started' : 'Running',
      symbol: '—',
    };
  const status =
    episode.providerFailure?.httpStatus ?? Number(episode.error?.match(/Router HTTP (\d{3})/)?.[1]);
  const blocked =
    !!episode.error || (episode.status && !['completed', 'step_limit'].includes(episode.status));
  if (blocked)
    return {
      kind: 'blocked',
      symbol: '!',
      title:
        status === 403 || episode.status === 'provider_unavailable'
          ? 'Provider unavailable'
          : status === 401 || episode.status === 'credentials_invalid'
            ? 'Key needs attention'
            : status === 402 || episode.status === 'credits_exhausted'
              ? 'Router credit required'
              : status === 404 || episode.status === 'model_unavailable'
                ? 'Model unavailable'
                : episode.status === 'cancelled'
                  ? 'Run stopped'
                  : episode.status === 'budget'
                    ? 'Run limit reached'
                    : episode.status === 'output_limit'
                      ? 'Output limit reached'
                      : episode.status === 'timeout'
                        ? 'Time limit reached'
                        : episode.status === 'provider_connection_error'
                          ? 'Connection interrupted'
                          : 'Run blocked',
      changeModel:
        [403, 404, 501].includes(status) ||
        ['provider_unavailable', 'model_unavailable', 'unsupported_capability'].includes(
          episode.status,
        ),
    };
  if (!episode.evaluation) return { kind: 'pending', title: 'Outcome unavailable', symbol: '—' };
  return episode.evaluation.success
    ? { kind: 'passed', title: 'Task passed', symbol: '✓' }
    : { kind: 'incomplete', title: 'Task incomplete', symbol: '×' };
}

// Short, non-sensitive explanations for history/comparison. Raw provider errors
// stay in the audit; diagnostic checks on blocked runs must never imply success.
export function outcomePresentation(episode) {
  const outcome = episodeOutcome(episode);
  if (outcome.kind === 'passed' || outcome.kind === 'incomplete') {
    const checks = episode.evaluation?.checks;
    const detail =
      Array.isArray(checks) && checks.length
        ? `${checks.filter((c) => c.passed).length}/${checks.length} checks passed`
        : outcome.kind === 'passed'
          ? 'All required changes verified'
          : 'Required changes not met';
    return {
      ...outcome,
      tone: outcome.kind,
      detail: episode.status === 'step_limit' ? `Action limit · ${detail}` : detail,
    };
  }
  const explanations = {
    'Provider unavailable': ['blocked', 'Provider did not accept the run'],
    'Key needs attention': ['blocked', 'Check your API key'],
    'Router credit required': ['blocked', 'Provider credit exhausted'],
    'Model unavailable': ['blocked', 'Choose another model'],
    'Run limit reached': ['limit', 'Spend or request allowance reached'],
    'Time limit reached': ['limit', 'Time allowance reached'],
    'Output limit reached': ['limit', 'Response truncated · no partial action executed'],
    'Connection interrupted': ['blocked', 'Receipt missing · usage unknown'],
    'Run stopped': ['stopped', 'Stopped by you'],
    'Run blocked': [
      'blocked',
      episode?.status === 'interrupted'
        ? 'Connection or capture interrupted'
        : 'Execution could not complete',
    ],
  };
  const [tone, detail] = explanations[outcome.title] ?? [
    'pending',
    outcome.title === 'Running' ? 'In progress' : 'No scored result yet',
  ];
  return { ...outcome, tone, detail };
}
