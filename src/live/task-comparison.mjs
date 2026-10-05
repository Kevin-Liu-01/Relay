// Display comparisons only. The saved grader remains the authority for outcomes.
export const expectationKey = (episode) =>
  `${episode?.cell?.taskId}/${episode?.cell?.seed}/${episode?.initialHash}`;
export function matchesExpectation(contract, episode) {
  return (
    contract?.schema === 'relay-task-expectation-v1' &&
    contract.taskId === episode?.cell?.taskId &&
    contract.seed === episode.cell.seed &&
    contract.baselineHash === episode.initialHash &&
    contract.instruction === episode.instruction &&
    contract.backendHash === episode.appProvenance?.backendHash &&
    (!episode.evaluation || contract.graderVersion === episode.evaluation.graderVersion)
  );
}
const canonical = (v) =>
  Array.isArray(v)
    ? v.map(canonical).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
    : v && typeof v === 'object'
      ? Object.fromEntries(
          Object.keys(v)
            .sort()
            .map((k) => [k, canonical(v[k])]),
        )
      : v;
const same = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));
const stamp = (value, contract) =>
  typeof value === 'string' &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.000Z$/.test(value) &&
  Number.isFinite(Date.parse(value)) &&
  new Date(value).toISOString() === value &&
  Date.parse(value) > Date.parse(contract.clock);
export function compareTaskRows(contract, state) {
  const available = Array.isArray(state?.messages) && Array.isArray(state?.channels);
  const extras = available
    ? state.messages.filter((m) => !contract.baselineMessageIds.includes(m.id))
    : [];
  return contract.rows.map((row) => {
    if (!available) return { ...row, actual: null, status: 'unknown' };
    let actual, match;
    if (row.kind === 'post') {
      actual = extras.filter(
        (m) => m.channelId === row.expected.channelId && m.parentId === row.expected.parentId,
      );
      match = actual.some(
        (m) =>
          Object.entries(row.expected).every(([k, v]) => same(m[k], v)) &&
          (contract.graderVersion !== 'workflow-state-v2' ||
            (/^new-[1-9]\d*$/.test(m.id) &&
              stamp(m.createdAt, contract) &&
              Number.isSafeInteger(Number(m.id.slice(4))) &&
              Date.parse(m.createdAt) ===
                Date.parse(contract.clock) + Number(m.id.slice(4)) * 1000)),
      );
    } else if (row.kind === 'count') {
      actual = extras.length;
      match = actual === row.expected;
    } else {
      const target = state[row.collection].find((v) => v.id === row.targetId);
      actual = row.kind === 'delete' ? (target ?? null) : target ? target[row.field] : undefined;
      match =
        row.kind === 'delete'
          ? !target
          : row.field === 'editedAt' && row.expected === true
            ? contract.graderVersion === 'workflow-state-v2'
              ? stamp(actual, contract)
              : !!actual
            : same(actual, row.expected);
    }
    return { ...row, actual, status: match ? 'match' : 'different' };
  });
}
