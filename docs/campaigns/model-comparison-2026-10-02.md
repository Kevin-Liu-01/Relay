# Six-model accessibility comparison

## Question and preregistration

- User-requested 20 trials per model: five development tasks × four seeds (42–45), six exact Router routes, 120 planned episodes. This plan is saved and hash-bound before the first inference request.
- Primary outcome: strict terminal-state pass, including absence of collateral changes. Report passed / attempted with planned and unattempted counts alongside it. Provider, budget and harness blocks remain distinct from incorrect/step-limited tasks.
- Tasks: channel topic, thread reply, message edit, incident triage and decision record. Fixtures, instructions and graders are unchanged. Four seeds are repeated instances of five public templates, not 20 independent reasoning problems or a held-out benchmark.
- Every episode has fresh browser context, workspace and model conversation. One sequential worker; no overlapping workspaces. Task/seed is the block, with seeded shuffled model order within each block. Model routes are treatments, not immutable weights; preserve requested and returned IDs.
- Accessibility browser control only: no actor API or pixels pooled into the score. Recent-four history, no guide, provider-default sampling/reasoning (not assumed identical across providers). Models see the same protocol and observation format, but their resulting trajectories differ.

## Selection and fixed limits

- Six low-cost, account-discovered routes spanning OpenAI, Google, DeepSeek, Zhipu and NVIDIA model families; catalog membership is not proof of inference availability. Exact IDs and positive base rates are in the [frozen config](model-comparison-2026-10-02.json).
- 16 action attempts and 120 seconds per episode; 4,096 output tokens per response (increased from the old campaign before collection); 250,000 conservative input units. Default reasoning can consume that output allowance. No prompt, parser, seed or model changes after seeing results.
- Four phases, one per seed: 30 episodes, 480 requests, 60 minutes and $1.50 estimated maximum each. Total ceiling $6, 1,920 requests, 240 minutes; zero GPU hours. Typical observed use may be much lower. Estimates and retained reservations are not provider invoices.
- Stop the entire campaign on unknown usage, provider failure, audit failure, cleanup failure, source drift or phase exhaustion. No automatic inference retry, resume, substitution, or redistribution of budget. Preserve all unattempted cells. If the stop rule fires, the requested 20/model is **not completed**.
- Pilot-quality checks: existing software and grader controls plus manual inspection of the first completed block; stop on broken observation, grader leakage or corrupt trace. Policy errors alone are results, not grounds for changing the plan.

## Reporting

- Publish all 120 planned rows, strict outcomes, checks, actual action attempts, rejection counts, model receipts, reported tokens, estimates and unknown usage. Median wall time includes all attempted episodes, including early blocks; do not interpret it as time-to-success.
- Sortable model table is descriptive. Sorting is not statistical significance. No confidence intervals treating seeds/actions as independent task families, no population ranking, no cross-provider reliability or training claim.
- Keep the old 30-cell onsite campaign unchanged and labeled separately. Original request bodies, hash-chained events and captured frames remain immutable; export scanned synthetic evidence only.

## Reproduce

```sh
npm ci
npx playwright install chromium
npm run build:hosted
# Set RAMP_ROUTER_API_KEY privately, or use an ignored .env.local.
node scripts/run-model-comparison.mjs
```

- The launcher refuses existing evidence, freezes source/plan/launcher hashes, and writes progress under `.runtime/model-comparison-2026-10-02`. Completed and interrupted results are exported under `evidence/campaigns/model-comparison-2026-10-02`.
- The catalog check is free of inference; account identity and authentication headers are not published.

## Closeout

- Stopped on the fourth episode: Nemotron's first request timed out after 30 seconds without usage. Two topic-edit passes (GLM and DeepSeek), one 16-action failure (GPT-4.1 nano), one provider block; 116 cells were not launched. No inference retried.
- The $0.04298605 recorded allowance includes a $0.00158460 unresolved reservation. The task's request for 20 trials per model remains incomplete; no statistical ranking is supportable.
- [Full results and trajectory archive](../../evidence/campaigns/model-comparison-2026-10-02/README.md). This plan's JSON and original evidence remain frozen. Do not resume it.
