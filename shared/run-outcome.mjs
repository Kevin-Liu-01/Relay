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
                    : episode.status === 'timeout'
                      ? 'Time limit reached'
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
