# Onsite submission assessment

## Assessment

- Relay meets the focused implementation brief: runnable Slack-like workflows, private episode state, several interaction approaches, deterministic evaluation and inspectable trajectories.
- This supports an engineering demonstration, not a leaderboard or an RL training result.
- Completed one-pass coverage is **306/306: 152 passed, 61 incomplete, 93 blocked**. All 306 attempts have public structured traces and UI-state replays; zero cells are unattempted. The final verifier reopened all 277 archives, with 26,403 integrity checks and 2,007 grading checks in agreement.
- Strongest demonstration: a model replies in the correct thread, then a deeper run performs plausible actions but fails the exact task contract. Show both.
- Remaining weaknesses: no successful new screenshot-only policy, wording ambiguities in two tasks, no semantic task holdout or repeatability estimate, and no sustained browser-worker scaling measurement.

## Assignment coverage

Checked against the supplied CUA take-home brief on 2026-10-03. The private PDF
is not part of the repository or submission package.

| Requirement                        | Delivered evidence                                                                                 | Boundary                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Runnable Slack-like environment    | README setup, lockfile, `/play`, React UI and private SQLite sessions                              | Focused synthetic workflows, not production Slack                                       |
| Meaningful tasks                   | 18 templates including search, threads, edits and 12 deeper workflows; independent state contracts | Two instruction-language caveats remain disclosed, never retrospectively repaired       |
| Different interaction approaches   | Earlier real-model traces across pixels, accessibility, page JSON and actor API                    | Unequal coverage; no successful new pixel-only policy and no causal interface ranking   |
| Models with a compatible harness   | Original MIT-licensed Playwright/Responses runner; 17 exact routes, 306 attempts                   | Not native Codex/BrowserGym/OpenEnv integration or a popularity ranking                 |
| Trajectories and verification      | `/results`, 306 trace/replay links, state checks, provenance, requests and responses               | UI-state playback, not video; public library omits original PNG bytes                   |
| Setup and README                   | No-key sandbox/replay instructions, BYOK setup, CLI configuration                                  | New inference requires provider access; no shared secret shipped                        |
| Isolation and scalability          | Slides 4 and 11; architecture and hosting docs                                                     | Session data isolation, not hostile-code sandboxing; scale-out is proposed              |
| Speed and resource efficiency      | Slide 11, raw microbenchmark; per-trial latency, tokens, calls and cost downloads                  | No full worker-memory or sustained agent-throughput measurement; cost is not an invoice |
| Onsite presentation and discussion | 13-slide HTML/PDF, plain technical bullets, diagrams and demo notes                                | Keep time for questions; do not claim RL training                                       |

## Submission contents

- [Repository setup](../README.md), pinned lockfile and [MIT license](../LICENSE) for original code.
- [13-slide HTML deck](https://relay.kevinliu.studio/presentation), [PDF](presentation.pdf) and [speaker/demo notes](presentation-notes.md).
- Presentation order: assignment → focused environment → repeatable harness → expanded benchmark prototype → results → task-validation lesson → next version. Diagrams show state checks, run ownership, the model loop, interface differences, and proposed scale-out. The sortable results remain on slide 9; routine engineering fixes remain in the written review.
- [Build review](build-review.md): the task-validation mistake, other documented engineering mistakes, completed fixes, and remaining validation work.
- [One-pass model coverage](../evidence/campaigns/model-breadth-2026-10-03-continuation/README.md): 17 routes × all 18 tasks × one attempt = 306 cells, no repeats. The first breadth worker preserved 37 earlier attempts and added 68. Its continuation preserves all 105 and collects only the 201 untouched cells. The shared $300 ceiling includes prior campaigns/probes. The linked report distinguishes actual collection from the target; Google remains unavailable without a separate key.
- [Completed pilot evidence](../evidence/campaigns/model-comparison-2026-10-02-final/README.md): 36 attempted, 20 passed, 11 incomplete, four output-limited and one connection failure. All 1,971 archive checks passed; the closed plan retains 24 unattempted cells. Slide 9 links this evidence and exposes the new per-task inventory without pooling the campaigns.
- [Complete model-run inventory](../evidence/campaigns/onsite-2026-10-01/README.md), compressed original trajectories, readable manifests and audit receipts.
- [Software verification](verification.md), [task contracts](task-suite.md), [architecture](architecture.md) and [prior-work review](research.md).
- [All-trial review library](https://relay.kevinliu.studio/demo/review.html): per-model/task replays, exact requests, responses, actions, outcome checks, state differences and JSON downloads. [Public evidence contents and limits](trial-review.md).
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

- [Task-quality caveat](campaigns/model-breadth-2026-10-03-observations.md): release-sync ambiguously locates both the handoff and QA in engineering, although the handoff is in the project channel. Keep all 17 unchanged raw outcomes with this caveat; do not interpret them as clean capability evidence. A task-wording fix/content-location gate belongs to a future version, not a post-result repair.
- Design-handoff also leaves substitution of its quoted DESIGN placeholder implicit. Six completed attempts copied the literal quoted strings while the grader expects the approved name. Retain their original failures, but do not attribute that task's score solely to model capability. A separately versioned instruction-language gate is needed.
- Deep-task challenges: 84 valid and 2,583 invalid states across 12 templates and seven seeds, plus scripted browser reference paths.
- Grading checks intended state, identity, ownership and collateral changes; it does not trust model completion claims or judge screenshots.
- All 20 attempted episodes in the earlier interface study have verified local event chains and artifact bindings, with no capture warnings. The separate breadth report records its own archive verification and denominator. Hash consistency is not an external authenticity signature.
- Requests, returned output/usage, rejected actions, timestamps, initial/final state and PNGs are in byte-preserving compressed bundles. `node scripts/inspect-campaign.mjs workflows` verifies them without a key.
- Three earlier labeled replay excerpts show a thread pass, decision-record failure and API control. The new breadth library exposes every published attempt rather than only selected successes, with explicit zero-action and blocked-result handling. Its compact records omit PNG bytes but preserve image hashes and all structured evidence.

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
- Next research gates: successful pixel-policy runs, explicit language checks for task instructions, template-level holdouts, trainer compatibility tests and sustained worker measurements. The one-pass comparison is complete at $194.10583757 in shared estimates/reservations under the $300 cap; do not resume closed campaigns or repeat their cells.
