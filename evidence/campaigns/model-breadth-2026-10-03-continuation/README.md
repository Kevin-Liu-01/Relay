# One-pass model coverage — completed

Snapshot: 2026-10-03T21:14:41.396Z. Collection and archive verification are complete; completion does not mean every task passed.

- **306/306 attempted: 152 passed, 61 incomplete, 93 blocked; 0 unattempted.**
- 105 original attempts preserved, including every failure; 201 new attempts. No repeated model/task cells, retries or best-of selection.
- 17 requested routes × all 18 public development tasks × one seed (1042). Same source, initial states and outcome graders. Accessibility control only.
- [Plan](../../../docs/campaigns/model-breadth-2026-10-03-continuation.md), [frozen configuration](../../../docs/campaigns/model-breadth-2026-10-03-continuation.json), [all cells CSV](trials.csv), [summary](summary.json), [manifest](manifest.json).
- [Review traces and watch replays](https://relay.kevinliu.studio/demo/review.html): the public library reports its actual recorded count and includes failures and blocked runs. Each record has exact requests, externally visible responses, actions, recorded UI states, state changes and grader checks. [Format and fidelity](../../../docs/trial-review.md).

## Models

Pass fractions include blocked attempts. Unattempted cells are not failures. Click-to-sort and per-task filters are in [the presentation](https://relay.kevinliu.studio/presentation#9).

| Model route | Attempted / 18 | Passed | Incomplete | Blocked | Not run | Median seconds | Recorded estimate / reservation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| gpt-6-astra | 18 / 18 | 14 | 1 | 3 | 0 | 27.06 | $35.96226000 |
| gpt-6.1-sol | 18 / 18 | 14 | 4 | 0 | 0 | 28.50 | $8.43521400 |
| gpt-6-luna | 18 / 18 | 9 | 8 | 1 | 0 | 39.37 | $0.54855670 (usage partly unknown) |
| gpt-oss-120b | 18 / 18 | 5 | 2 | 11 | 0 | 180.12 | $0.80396970 (usage partly unknown) |
| claude-fable-5-1 | 18 / 18 | 13 | 1 | 4 | 0 | 62.78 | $48.47144000 |
| claude-opus-5-5 | 18 / 18 | 13 | 4 | 1 | 0 | 38.27 | $29.07279600 (usage partly unknown) |
| claude-sonnet-5-5 | 18 / 18 | 7 | 4 | 7 | 0 | 39.87 | $14.26265200 (usage partly unknown) |
| claude-haiku-4-5 | 18 / 18 | 6 | 3 | 9 | 0 | 28.28 | $3.79208700 |
| grok-4.7 | 18 / 18 | 10 | 6 | 2 | 0 | 34.32 | $12.29100600 (usage partly unknown) |
| qwen3p8-max | 18 / 18 | 7 | 1 | 10 | 0 | 125.08 | $8.06379400 (usage partly unknown) |
| deepseek-v4-pro-0813 | 18 / 18 | 8 | 1 | 9 | 0 | 106.80 | $4.93627332 (usage partly unknown) |
| deepseek-v4.1-flash | 18 / 18 | 7 | 3 | 8 | 0 | 65.88 | $1.43654970 (usage partly unknown) |
| glm-5p3 | 18 / 18 | 7 | 0 | 11 | 0 | 125.28 | $3.97601320 (usage partly unknown) |
| glm-5p3-flash | 18 / 18 | 8 | 0 | 10 | 0 | 46.19 | $0.44435720 |
| kimi-k3 | 18 / 18 | 11 | 3 | 4 | 0 | 50.04 | $14.80091100 (usage partly unknown) |
| minimax-m3 | 18 / 18 | 5 | 10 | 3 | 0 | 25.93 | $1.50517290 (usage partly unknown) |
| nemotron-3-ultra | 18 / 18 | 8 | 10 | 0 | 0 | 50.06 | $4.28735820 |

## Task matrix

Exactly one planned attempt per model/task. **P** = passed, **F** = incomplete, **B** = blocked, **—** = unattempted. Errors, failed checks, action counts, original campaign and run identifiers are in the CSV. One observation per cell does not estimate repeatability.

| Task | Attempted / 17 | Passed | Incomplete | Blocked | Not run |
| --- | ---: | ---: | ---: | ---: | ---: |
| thread-reply | 17 / 17 | 16 | 1 | 0 | 0 |
| edit-message | 17 / 17 | 16 | 0 | 1 | 0 |
| incident-triage | 17 / 17 | 17 | 0 | 0 | 0 |
| handoff-dm | 17 / 17 | 16 | 1 | 0 | 0 |
| delete-draft | 17 / 17 | 16 | 1 | 0 | 0 |
| channel-topic | 17 / 17 | 17 | 0 | 0 | 0 |
| release-sync | 17 / 17 | 0 | 7 | 10 | 0 |
| incident-closeout | 17 / 17 | 5 | 4 | 8 | 0 |
| saved-cleanup | 17 / 17 | 4 | 4 | 9 | 0 |
| decision-record | 17 / 17 | 5 | 8 | 4 | 0 |
| handoff-repair | 17 / 17 | 5 | 3 | 9 | 0 |
| qa-signoff | 17 / 17 | 5 | 3 | 9 | 0 |
| publish-update | 17 / 17 | 4 | 6 | 7 | 0 |
| oncall-briefing | 17 / 17 | 7 | 3 | 7 | 0 |
| thread-repair | 17 / 17 | 13 | 3 | 1 | 0 |
| pin-refresh | 17 / 17 | 6 | 3 | 8 | 0 |
| design-handoff | 17 / 17 | 0 | 8 | 9 | 0 |
| release-retrospective | 17 / 17 | 0 | 6 | 11 | 0 |

Release-sync has a source-location ambiguity; design-handoff quotes DESIGN without explicitly requiring substitution, while its grader expects the approved design name. Their raw outcomes remain in the matrix with [task-quality caveats](../../../docs/campaigns/model-breadth-2026-10-03-observations.md), not as clean evidence of model capability.

| Task | gpt-6-astra | gpt-6.1-sol | gpt-6-luna | gpt-oss-120b | claude-fable-5-1 | claude-opus-5-5 | claude-sonnet-5-5 | claude-haiku-4-5 | grok-4.7 | qwen3p8-max | deepseek-v4-pro-0813 | deepseek-v4.1-flash | glm-5p3 | glm-5p3-flash | kimi-k3 | minimax-m3 | nemotron-3-ultra |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| thread-reply | P | P | F | P | P | P | P | P | P | P | P | P | P | P | P | P | P |
| edit-message | P | P | P | P | P | P | P | B | P | P | P | P | P | P | P | P | P |
| incident-triage | P | P | P | P | P | P | P | P | P | P | P | P | P | P | P | P | P |
| handoff-dm | P | P | P | F | P | P | P | P | P | P | P | P | P | P | P | P | P |
| delete-draft | P | P | P | P | P | P | P | P | P | P | P | P | P | P | P | F | P |
| channel-topic | P | P | P | P | P | P | P | P | P | P | P | P | P | P | P | P | P |
| release-sync | B | F | F | B | B | F | B | B | F | B | B | B | B | B | F | F | F |
| incident-closeout | P | P | F | B | P | P | B | F | P | B | B | B | B | B | B | F | F |
| saved-cleanup | P | P | F | B | P | P | B | B | F | B | B | B | B | B | B | F | F |
| decision-record | P | P | F | B | P | P | F | B | F | F | F | F | B | B | P | F | F |
| handoff-repair | B | F | P | B | B | F | B | B | P | B | P | B | B | B | P | F | P |
| qa-signoff | P | P | P | B | P | P | B | F | F | B | B | B | B | B | B | B | F |
| publish-update | P | P | F | B | B | B | F | F | P | B | B | F | B | B | P | F | F |
| oncall-briefing | P | P | P | B | P | P | F | B | P | B | B | B | B | P | F | B | F |
| thread-repair | P | P | F | F | P | P | P | P | B | P | P | P | P | P | P | F | P |
| pin-refresh | P | P | P | B | P | P | B | B | B | B | B | F | B | B | P | F | F |
| design-handoff | F | F | B | B | F | F | B | B | F | B | B | B | B | B | F | F | F |
| release-retrospective | B | F | F | B | B | F | F | B | F | B | B | B | B | B | B | B | F |

## Terminal outcomes

A completed agent loop may still fail the task. Output limits and timeouts are blocked attempts, even when their final workspace happens to satisfy diagnostic checks. No partial response is executed; no blocked cell is replaced by a repeat.

13 blocked attempts satisfy their saved-state diagnostic checks. They remain blocked, separately inspectable in the review page's Checks view.

| Recorded terminal status / outcome | Attempts |
| --- | ---: |
| budget / blocked | 7 |
| completed / incomplete | 27 |
| completed / passed | 151 |
| credentials_invalid / blocked | 1 |
| output_limit / blocked | 50 |
| provider_connection_error / blocked | 4 |
| step_limit / incomplete | 34 |
| step_limit / passed | 1 |
| timeout / blocked | 31 |

## Action-contract diagnostics

All routes received the same single-action JSON contract, not a provider-native tool-call adapter. Rejected steps still consume the action allowance. These counts measure this bounded model/provider/harness combination, not pure UI reasoning or a model's best achievable result. The historical field `invalidJSON` counts rejected outputs with no parsed action; it can include schema failures as well as malformed JSON.

| Model route | Action attempts | Steps with errors | No parsed action |
| --- | ---: | ---: | ---: |
| gpt-6-astra | 269 | 0 | 0 |
| gpt-6.1-sol | 304 | 0 | 0 |
| gpt-6-luna | 364 | 16 | 16 |
| gpt-oss-120b | 252 | 62 | 54 |
| claude-fable-5-1 | 219 | 2 | 2 |
| claude-opus-5-5 | 309 | 9 | 9 |
| claude-sonnet-5-5 | 282 | 97 | 97 |
| claude-haiku-4-5 | 200 | 63 | 63 |
| grok-4.7 | 332 | 0 | 0 |
| qwen3p8-max | 231 | 5 | 5 |
| deepseek-v4-pro-0813 | 216 | 1 | 0 |
| deepseek-v4.1-flash | 289 | 86 | 84 |
| glm-5p3 | 171 | 5 | 5 |
| glm-5p3-flash | 195 | 13 | 12 |
| kimi-k3 | 298 | 12 | 12 |
| minimax-m3 | 292 | 134 | 39 |
| nemotron-3-ultra | 439 | 1 | 0 |

Review the original response and step event before assigning a cause. The frozen parser trims whitespace and optional Markdown JSON fences; it does not repair malformed JSON, extract an action from prose, split multiple objects or translate native tool wrappers. No native-format adaptation was introduced after collection started. Protocol changes belong to a separately versioned comparison.

## Accounting and integrity

- Selected 306-cell inventory: $193.09041092 recorded, including $3.77939636 unresolved reservations. This includes the preserved 105 attempts; it is not all newly incurred spend.
- Newly collected work: $158.75648479. All prior campaigns and the separate tiny access diagnostic: $35.34935278. Shared recorded total: **$194.10583757**; remaining **$105.89416243** of the original $300 ceiling. Do not add preserved-row costs again. Estimates/reservations are not invoices.
- Selected attempts: 4747 requests; 74861087 accepted input tokens, 1400260 accepted output tokens. 26403 total integrity checks, including 6495 carried checks; 201 new archived blocks. Hash consistency is not independent attestation or proof of task success.
- Source: `f559a61066ae76d3d8a6bc10d9c0fe3e6c09c9b0b12b18a62f1c1113aefd415c`; plan hash: `84b9b1d2a7b42e5ec32e5b976cf6be3f5628640ebb05e8fab648b18a1ddd4730`.
- Archives live under each row's original campaign: `.runtime/<originCampaign>/`. Byte hashes are in the corresponding manifests. Two exact-byte examples are public: [Astra topic pass](../model-breadth-2026-10-03/block-009.tar.gz) and [Luna thread failure](../model-breadth-2026-10-03/block-019.tar.gz). All other original archives remain local. The separate [structured trial library](../../trial-library/catalog.json) publishes episode traces and UI-state playback without PNG bytes; original image hashes remain inspectable. The two full archive examples are curated examples, not the complete sample.

- [Completion verification](verification.json): all 306 attempted cells reopened from 277 original archives; 26403 integrity checks and 2007 saved-state outcome checks agree. The verifier reconstructs all report rows and accounting; blocked attempts remain blocked even if diagnostic workspace checks pass.


Verify either public example without a key: `node scripts/inspect-task-campaign.mjs block-009 model-breadth-2026-10-03` (or `block-019`). It verifies the published archive hash, source and trace integrity. [Pilot admission review](../../../docs/campaigns/model-breadth-2026-10-03-pilot-review.md) records all 36 inspected archives, including the failed and blocked attempts.

With all original archives and block reports available locally, run `node scripts/verify-breadth-completion.mjs model-breadth-2026-10-03-continuation` for the complete no-inference audit. It refuses partial collection. `--partial` checks a running snapshot without writing or claiming completion.

## Availability and interpretation

- [Task wording and trace review](../../../docs/campaigns/model-breadth-2026-10-03-observations.md): release-sync ambiguously groups two source locations; design-handoff leaves placeholder substitution implicit. Both 17-cell slices remain unchanged with task-quality caveats. Raw totals are not a validated model-accuracy ranking. Scripted executability does not establish instruction clarity.
- Google Gemini: Requires a Google provider key in Router; prior 403. Not silently replaced or counted as task failures.
- Meta Llama / Mistral: No eligible route in the account catalog at preparation.
- Jev: Requires a different API and action contract; excluded from this matched accessibility-policy comparison.
- One attempt per model/task on 18 public development templates at seed 1042. No reliability estimate, significance test, or held-out leaderboard.
- Temporal cohort and provider-routing effects are not controlled. Provider-default reasoning differs under the same 4096-token ceiling. This is a coverage inventory, not a causal ranking.
- Models are curated family/tier representatives from the account catalog, not an exhaustive or measured popularity list. Unavailable families are disclosed separately.
- Same frozen actor/harness/grader source and initial state, accessibility actions, recent-four history, 40 attempts and 180-second deadline. Other interfaces remain separate historical evidence.
- All prior pilot and diagnostic costs stay charged to the same $300 authorization. Imported rows are displayed once and their costs are not charged twice.
- Archives are locally preserved and hash checked, not independently signed or necessarily uploaded. Times include failures and capture overhead; costs are estimates, not invoices.
- All 105 prior attempts remain unchanged in outcome and origin, including the Astra spend-limited attempt. Only 201 untouched cells are collected by this continuation; no repeats.
- The continuation was specified after the original worker stopped on a per-cell spend reservation. Individual caps, grading, source, order and the original $300 total remain unchanged. This disclosed scheduling amendment is not a fresh randomized experiment.
- A receipt-complete, verified cell-spend stop remains blocked but may advance to the next untouched cell. No partial output executes. Authentication, invalid receipts, cleanup, integrity and shared-resource ceilings still stop the worker.

The earlier [1,800-cell campaign](../all-tasks-2026-10-03/README.md) is closed at 37 attempts. Its 1,763 unattempted cells remain in that historical record, not as failures or extra trials in this one-pass inventory.
