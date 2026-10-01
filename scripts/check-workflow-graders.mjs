import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { WORKFLOW_IDS } from '../shared/task-catalog.mjs';
import { grade } from '../server/tasks.mjs';
import { solveWorkflow, workflowChallenges } from '../tests/helpers/workflow-cases.mjs';

const seeds = [0, 1, 42, 43, 97, 999, 1000000000];
const rows = WORKFLOW_IDS.map((task) => {
  const failures = [],
    negatives = [];
  for (const seed of seeds) {
    if (!grade(task, seed, solveWorkflow(task, seed).state).success)
      failures.push({ seed, case: 'positive rejected' });
    for (const c of workflowChallenges(task, seed)) {
      const rejected = !grade(task, seed, c.state).success;
      negatives.push({ seed, case: c.name, rejected });
      if (!rejected) failures.push({ seed, case: c.name });
    }
  }
  return {
    task,
    positives: seeds.length,
    negatives: negatives.length,
    failures,
    challenges: negatives,
  };
});
const report = {
  schemaVersion: 1,
  evidenceKind: 'deterministic-grader-challenges-not-model-performance',
  seeds,
  generatedAt: new Date().toISOString(),
  source: Object.fromEntries(
    [
      'server/tasks.mjs',
      'server/workflow-tasks.mjs',
      'server/workflow-seed.mjs',
      'server/domain.mjs',
      'runner/workflow-reference.mjs',
      'tests/helpers/workflow-cases.mjs',
    ].map((p) => [p, createHash('sha256').update(readFileSync(p)).digest('hex')]),
  ),
  modelCalls: 0,
  modelSpendUSD: 0,
  tasks: rows,
};
mkdirSync('evidence/workflows', { recursive: true });
writeFileSync('evidence/workflows/grader-challenges.json', JSON.stringify(report, null, 2) + '\n');
const failures = rows.flatMap((r) => r.failures);
console.log(
  JSON.stringify(
    {
      tasks: rows.length,
      positiveCases: rows.length * seeds.length,
      negativeCases: rows.reduce((n, r) => n + r.negatives, 0),
      failures,
    },
    null,
    2,
  ),
);
if (failures.length) process.exitCode = 1;
