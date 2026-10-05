# Exact handoff

## Current evidence and presentation

- The 17-slide [presentation](https://relay.kevinliu.studio/presentation) and
  [PDF](presentation.pdf) explain the assignment, harness, workflows, controls,
  model comparison, matched-interface results and limitations.
- The original 306 attempts remain unchanged: 152 passed, 61 incomplete and 93 blocked.
- The separate matched study completed all 96 attempts: 58 passed, 11 incomplete
  and 27 blocked. All 96 have public traces and actual-UI state replays.
- [Paired analysis](../evidence/campaigns/interface-study-2026-10-05/analysis.md)
  includes all model/task pairs, time, actions, block reasons and full costs.
  Its $22.761576 allowance includes $2.043534 unresolved; it is not an invoice.
- Both collections are closed. Do not restart them, repeat cells or revise their
  task wording after observing results. New studies need a new plan and approval.
- The latest viewport release is preserved. Root `dist` remains the frozen
  actor build; use an isolated copy for production builds and software tests.

## Hosted release

The live site is [relay.kevinliu.studio](https://relay.kevinliu.studio). Source is
`Kevin-Liu-01/Relay`, branch `main`. Read [hosting](hosting.md) for deployment,
privacy, budgets and cleanup; [System One](system-one.md) for the Jev adapter.
The public page needs the visitor's Ramp or TypeSafe key. There is no deployed
shared key, public history database, SGLang server or GPU allocation.
Use `npm run build:hosted && npm run live` for the same UI locally on 4340.
Real Ramp cloud smokes and failures are separate from the fake-Jev browser contracts.

The live console now adds **1v1**, **Replay studio**, a prominent current-action
card and explicit outcome checks. Read [the replay/arena contract](replay-and-arena.md)
before changing capture or comparison semantics. Replays do not invoke providers;
old recordings retain screenshot/state-only fidelity labels. No new paid model
measurements are implied by this UI release.

## Relay Lab addition

Start the app, then `npm run lab` and open `http://localhost:4330`. The new
[benchmark lab guide](benchmark-lab.md) explains four interfaces, guide/history
conditions, Ramp Router setup, budgets, evidence and the live demo. A 12-cell
reference matrix exercises the harness without model calls. Authenticated model
smokes now have separate receipts; see verification.md. Keys must be configured
locally and are never included in the handoff. The minimal monitor keeps Slack
central, with action replay alongside it; Settings and Results open on demand.
Reference scripts, fake transport tests and real model results must stay distinct.

## Ready now

Start with [Onsite readiness](onsite-readiness.md): the 17-slide deck/PDF,
306 accessibility attempts and 96 matched-interface attempts, full trace/replay
libraries, current measurements and limitations. The earlier 20-attempt campaign
is historical; its ten unattempted cells remain unattempted. Original code is
MIT; third-party assets retain their restrictions.

The current catalog has **18 tasks**. Read [the task suite](task-suite.md) for the
12 new multi-step contracts, richer fixtures, 24 browser recipes, grader challenge
report and bounded model-pilot plan. Older evidence is retained as historical
context; the current assessment distinguishes it from the new campaign.

The standalone project is `Kevin-Liu-01/Relay`, extracted from `cotcodec/cua-slack/`. It includes source, pinned npm lockfile, app/operator CLI, 18 task contracts, trainer bridge, tests, trajectory evidence, research provenance, measurements, a Docker recipe and a 17-slide presentation. No H100, paid API, cloud account or real Slack workspace is required for reference scripts and saved replays.

Run `npm ci && npm run dev`, open `http://localhost:4318`, and create a task with `npm run session -- create thread-reply 47`. Use `docs/presentation.html` and its speaker notes for the original environment discussion. The hosted BYOK release now adds the screen-first console and TypeSafe decision transport; real Jev inference still requires an authenticated pilot.

## Submission checklist

- Extract `artifacts/relay-slack-env.tar.gz` into a fresh directory; verify its `.sha256` companion.
- Run the README setup and verify the 18 task instructions and outcome contracts.
- Include the archive, README, research document, verification document and presentation. Token-free evidence is already in the archive.
- Keep the private assignment PDF, `.runtime`, operator tokens and raw Playwright replay/video folders out of the submission.
- Rehearse a fresh-session demo, outcome grade, cross-session noninterference and reset.
- State the limitations plainly: focused Slack-like subset; no training; builder-informed model smokes; no sustained multi-browser scale claim.
- Original code is MIT, authorized by Kevin on 2026-10-01. Upstream dependency/asset notices remain in force.

## Code map

| Path                            | Responsibility                                      |
| ------------------------------- | --------------------------------------------------- |
| `src/main.jsx`, `src/style.css` | UI and visible interaction behavior                 |
| `server/seed.mjs`               | Deterministic synthetic workspace                   |
| `server/domain.mjs`             | Validated transitions and search                    |
| `server/store.mjs`              | Session lifecycle, transactions, audit, idempotency |
| `server/tasks.mjs`              | User instructions and trusted state graders         |
| `server/server.mjs`             | Separate app/operator HTTP listeners                |
| `runner/environment.mjs`        | Trainer-side browser episode interface              |
| `scripts/session.mjs`           | Human/operator CLI                                  |
| `tests/`                        | Domain, service, recovery and browser verification  |
| `scripts/benchmark.mjs`         | Bounded repeatable performance experiment           |
| `scripts/collect-evidence.mjs`  | Portable evidence and source manifest               |
| `scripts/package.mjs`           | Credential-screened submission archive              |
| `docs/`, `evidence/`            | Durable rationale and actual findings               |

## Next work, in priority order

1. Independent policy runs on unseen semantic tasks, with action/time/token budgets and failure review.
2. Richer semantic fixture variation and template-level train/test separation.
3. 1/4/8/16 concurrent browser workers with full process-tree memory, CPU and long soak measurements.
4. Actor/control process/network isolation before allowing hostile or shell-capable policies.
5. A BrowserGym/OpenEnv adapter if integration is requested; don't claim compatibility until contract tests pass.
6. Slack sandbox conformance checks for whichever additional behavior the team prioritizes.

Do not expand into every Slack feature before validating these gates. Keep unrelated CoTCodec memory research changes untouched.
