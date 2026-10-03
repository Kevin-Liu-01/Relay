# Onsite submission assessment

## Assessment

- Relay meets the focused implementation brief: runnable Slack-like workflows, private episode state, several interaction approaches, deterministic evaluation and inspectable trajectories.
- This supports an engineering demonstration, not a leaderboard or an RL training result.
- Strongest demonstration: a model replies in the correct thread, then a deeper run performs plausible actions but fails the exact task contract. Show both.
- Remaining weaknesses: no successful new screenshot-only policy, incomplete matrix coverage, no semantic task holdout and no sustained browser-worker scaling measurement.

## What to submit

- [Repository setup](../README.md), pinned lockfile and [MIT license](../LICENSE) for original code.
- [13-slide HTML deck](https://relay.kevinliu.studio/presentation), [PDF](presentation.pdf) and [speaker/demo notes](presentation-notes.md).
- [One-pass model coverage](../evidence/campaigns/model-breadth-2026-10-03/README.md): 17 routes × all 18 tasks × one attempt = 306 cells, no repeats. Preserve 37 existing attempts (28 passes, five incomplete, four blocked); schedule only 269 new cells. The shared $300 ceiling includes prior campaigns/probes. The repeated-trial plan is closed. The linked summary reports actual collection, not the target as completed work; Google remains unavailable without a separate key.
- [Completed pilot evidence](../evidence/campaigns/model-comparison-2026-10-02-final/README.md): 36 attempted, 20 passed, 11 incomplete, four output-limited and one connection failure. All 1,971 archive checks passed; the closed plan retains 24 unattempted cells. Slide 9 links this evidence and exposes the new per-task inventory without pooling the campaigns.
- [Complete model-run inventory](../evidence/campaigns/onsite-2026-10-01/README.md), compressed original trajectories, readable manifests and audit receipts.
- [Software verification](verification.md), [task contracts](task-suite.md), [architecture](architecture.md) and [prior-work review](research.md).
- Credential-screened archive from `npm run package`. Exclude private runtime files, keys and the assignment PDF.

## Runnable environment and harness

- React workspace: channels, DMs, search, threads, edits/deletes, reactions, pins, saved items and channel details.
- 18 task templates; 12 require 3–6 coordinated mutations. Independent declarative expected-state contracts cover the new tasks.
- `/play` is a no-key manual sandbox using the same UI and transition rules. It is not a scored episode or real Slack.
- Trainer supports reset, observation, bounded step, terminal reward, truncation, export and cleanup. No optimizer or training run is included.
- Harness: original MIT-licensed JavaScript runner using Playwright and Ramp Responses. No Codex SDK, BrowserGym or OpenEnv integration is claimed.

## Earlier onsite campaign evidence

- 30 planned; 20 attempted; 8 strict passes; 11 incorrect/step-limited outcomes; 1 blocked; 10 unattempted.
- Pixels, accessibility, visible-page JSON and actor API were exercised. Four task templates were attempted: topic, thread reply, message edit and decision record.
- GPT-4o mini and GPT-6 Luna are two routes from the same lab/provider, not cross-provider replication. Returned-model receipts are retained.
- 126 calls; $0.14838375 estimated from accepted receipts plus $0.0014902 retained reservation = $0.14987395 recorded allowance. Not an invoice.
- Workflow episode 017 stopped with response status `incomplete`, reason `max_output_tokens`: 1,024 output tokens, including 915 reasoning tokens. The receipt was saved, but the runner conservatively marks rejected-response accounting unknown. No action executed.
- One edit cell, six incident cells and three follow-up pixel cells were not launched. Do not count them as evaluated failures or silently retry them.
- Original builder-informed Codex episodes and historical hosted smokes remain separate evidence categories.

## Trace-level findings

- `workflows/episode-002`: Luna opened Maya's thread, filled the exact reply, sent and finished; all three checks passed.
- `workflows/episode-007`: Luna pinned the correct root and saved the approval, but wrote literal `DESIGN` instead of the approved fact. The grader rejected the description and acknowledgement.
- `workflows/episode-008`: Luna recovered from an empty search, retrieved “Willow” through the API, made all four changes and passed. API access is not equivalent to GUI control.
- `pilot/episode-002`: all 20 outputs contained malformed multiple actions. The parser rejected them without workspace mutation. This verifies image transport and a failure trace, not successful pixel control.
- `pilot/episode-003`: Mini posted the requested topic as a channel message and claimed completion. The state grader rejected it.

## Evaluation correctness and integrity

- Deep-task challenges: 84 valid and 2,583 invalid states across 12 templates and seven seeds, plus scripted browser reference paths.
- Grading checks intended state, identity, ownership and collateral changes; it does not trust model completion claims or judge screenshots.
- All 20 attempted episodes have verified local event chains and artifact bindings, with no capture warnings. Hash consistency is not an external authenticity signature.
- Requests, returned output/usage, rejected actions, timestamps, initial/final state and PNGs are in byte-preserving compressed bundles. `node scripts/inspect-campaign.mjs workflows` verifies them without a key.
- Three labeled replay excerpts show a thread pass, decision-record failure and API control. The full inventory retains all failures and unattempted cells.

## Isolation, speed and resource efficiency

- Fresh browser context and private SQLite file per episode; transactional writes with revisions and idempotency keys. Actor/control listeners currently share a process.
- This is tested data isolation, not an OS sandbox for shell-enabled or hostile policies. Public source includes graders; serious held-out evaluation must withhold them from the actor.
- [Current local microbenchmark](../evidence/benchmark-2026-10-01.json): create p50 17.34 ms, reset p50 1.50 ms, screenshot p50 84.15 ms on Apple M5 Max/Node 24. Earlier measurements remain separate.
- Boundaries: 100 sessions, 400 loopback reads at concurrency 16, 10 sequential browser contexts. No simultaneous-agent capacity or full browser-process memory claim.
- Proposed scale path: admission queue, bounded workers, sharded session ownership, separate control service, external evidence storage, active cleanup and threat-model-appropriate containers/VMs.
- Cloud PNG capture remains intermittently incomplete; hosted screenshot-policy reliability is unestablished. The new campaign is local evidence.

## Demonstration and next gates

- Use 10–12 minutes of slides, three minutes of UI/replays, then discussion.
- Start in the no-key sandbox. Use saved pass/failure replays to avoid provider availability and spending during the onsite.
- A new live run needs a provider-side spend cap and verified model. Hosted settings already allow 4,096 output tokens; the frozen campaign's smaller allowance is not the hosted default.
- Discuss Slack fidelity, observation contracts, final-state versus path-level safety, isolation and required throughput.
- Next: finish the separately approved all-task comparison within its shared cap, successful pixel-policy runs, template-level holdouts, trainer compatibility tests and sustained worker measurements. Do not resume any closed historical campaign or silently change the active frozen plan.
