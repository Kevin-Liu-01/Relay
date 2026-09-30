// Match outcomes, not a statistical leaderboard. Missing evidence never earns a win.
export function duelVerdict(records) {
  const inconclusive = { label: 'Inconclusive · interrupted or provider error', kind: 'error' };
  if (records.some((r) => r?.error)) return inconclusive;
  if (records.some((r) => !r?.run?.episodes?.[0]))
    return { label: 'Two models. One task.', kind: 'waiting' };
  const episodes = records.map((r) => r.run.episodes[0]);
  if (episodes.some((e) => ['queued', 'running'].includes(e.status)))
    return { label: 'Match in progress', kind: 'running' };
  if (
    episodes.some(
      (e) =>
        !['completed', 'step_limit'].includes(e.status) ||
        typeof e.evaluation?.success !== 'boolean',
    )
  )
    return inconclusive;
  const [a, b] = episodes;
  const fields = ['taskId', 'seed', 'mode', 'guide', 'history'];
  const budgets = [
    'maxSteps',
    'maxRequests',
    'maxEstimatedUSD',
    'episodeSeconds',
    'runSeconds',
    'maxInputUnits',
    'maxOutputTokens',
  ];
  const matched =
    a.initialHash &&
    a.appProvenance?.backendHash &&
    a.appProvenance?.buildHash &&
    records[0].run.sourceHash &&
    a.initialHash === b.initialHash &&
    a.appProvenance.backendHash === b.appProvenance?.backendHash &&
    a.appProvenance.buildHash === b.appProvenance?.buildHash &&
    records[0].run.sourceHash === records[1].run.sourceHash &&
    fields.every((k) => a.cell[k] === b.cell[k]) &&
    budgets.every((k) => records[0].run.config[k] === records[1].run.config[k]);
  if (!matched) return { label: 'Not comparable · conditions or workspace differ', kind: 'error' };
  const passes = episodes.map((e) => e.evaluation.success);
  if (passes.every(Boolean)) return { label: 'Both passed', kind: 'tie' };
  if (passes.every((x) => !x)) return { label: 'Neither completed the task', kind: 'tie' };
  return {
    label: `${passes[0] ? 'A' : 'B'} completed the task`,
    kind: 'winner',
    winner: passes[0] ? 0 : 1,
  };
}
