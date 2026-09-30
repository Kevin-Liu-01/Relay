import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
// Read-only public metadata. gh authenticates locally; no credentials are exported.
const repos = [
  'Sirneij/slack-clone-ui',
  'lukejacksonn/react-slack-clone',
  'remarkablemark/clask',
  'chunkangwong/slack-clone',
  'harryheman/slack-clone',
  'farhanmasood-se/slack-clone',
  'leonickson1/chatcn',
  'trycua/cua',
  'benchflow-ai/env0',
  'agent-diff-bench/agent-diff',
  'microsoft/sentinel_environments',
  'TheAgentCompany/TheAgentCompany',
  'ServiceNow/BrowserGym',
  'web-arena-x/webarena',
  'agi-inc/REAL',
  'huggingface/OpenEnv',
];
const get = (path) =>
  JSON.parse(
    execFileSync('gh', ['api', path], { encoding: 'utf8', timeout: 30000, maxBuffer: 2_000_000 }),
  );
const rows = [];
for (const repo of repos) {
  try {
    const r = get(`repos/${repo}`),
      c = get(`repos/${repo}/commits/${r.default_branch}`);
    rows.push({
      repo,
      url: r.html_url,
      description: r.description,
      defaultBranch: r.default_branch,
      sha: c.sha,
      commitDate: c.commit.committer.date,
      license: r.license?.spdx_id ?? 'not-detected',
      archived: r.archived,
      pinnedURL: `${r.html_url}/tree/${c.sha}`,
      inspected: 'README/landing and selected source; not executed',
    });
  } catch (e) {
    rows.push({ repo, error: e.message.slice(0, 250) });
  }
}
mkdirSync('evidence/research', { recursive: true });
writeFileSync(
  'evidence/research/repositories.json',
  JSON.stringify(
    {
      retrievedAt: new Date().toISOString(),
      method: 'GitHub public API via gh; branch-head provenance, not a quality/popularity ranking',
      repositories: rows,
    },
    null,
    2,
  ) + '\n',
);
for (const [repo, path] of [
  ['trycua/cua', 'libs/cua-bench/tasks/slack_env/main.py'],
  ['benchflow-ai/env0', 'packages/environments/mock-slack/README.md'],
  ['agent-diff-bench/agent-diff', 'README.md'],
]) {
  const r = rows.find((r) => r.repo === repo);
  if (!r.sha) continue;
  const file = get(`repos/${repo}/contents/${path}?ref=${r.sha}`);
  const text = Buffer.from(file.content, 'base64').toString();
  const lines = text.split('\n');
  const matchingLineNumbers =
    repo === 'trycua/cua'
      ? lines.flatMap((line, i) =>
          /tasks_config|def evaluate|execute_javascript|getOutboundMessages|1280|800/.test(line)
            ? [i + 1]
            : [],
        )
      : lines
          .flatMap((line, i) =>
            /41 |25 |snapshot|schema|golden|reset|restore|TTL/i.test(line) ? [i + 1] : [],
          )
          .slice(0, 15);
  writeFileSync(
    `evidence/research/${repo.split('/')[1]}-inspection.json`,
    JSON.stringify(
      {
        repo,
        path,
        sha: r.sha,
        sourceURL: `https://github.com/${repo}/blob/${r.sha}/${path}`,
        lineCount: lines.length,
        matchingLineNumbers,
        note: 'Selected line locations for task configuration, evaluation or state lifecycle. Read at the pinned source URL; no upstream source is bundled.',
      },
      null,
      2,
    ) + '\n',
  );
}
console.log(
  JSON.stringify(
    rows.map((r) => ({ repo: r.repo, sha: r.sha, license: r.license, error: r.error })),
    null,
    2,
  ),
);
