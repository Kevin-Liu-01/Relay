# One-pass model coverage — running

Snapshot: 2026-10-03T08:33:13.723Z. Planned work is not a completed result.

- **75/306 attempted: 63 passed, 6 incomplete, 6 blocked; 231 unattempted.**
- 37 original attempts preserved, including every failure; 38 new attempts. No repeated model/task cells, retries or best-of selection.
- 17 requested routes × all 18 public development tasks × one seed (1042). Same source, initial states and outcome graders. Accessibility control only.
- [Plan](../../../docs/campaigns/model-breadth-2026-10-03.md), [frozen configuration](../../../docs/campaigns/model-breadth-2026-10-03.json), [all cells CSV](trials.csv), [summary](summary.json), [manifest](manifest.json).

## Models

Pass fractions include blocked attempts. Unattempted cells are not failures. Click-to-sort and per-task filters are in [the presentation](https://relay.kevinliu.studio/presentation#9).

| Model route | Attempted / 18 | Passed | Incomplete | Blocked | Not run | Median seconds | Recorded estimate / reservation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| gpt-6-astra | 4 / 18 | 4 | 0 | 0 | 14 | 11.74 | $3.63693000 |
| gpt-6.1-sol | 8 / 18 | 8 | 0 | 0 | 10 | 11.88 | $2.00389200 |
| gpt-6-luna | 3 / 18 | 2 | 1 | 0 | 15 | 10.28 | $0.01502060 |
| gpt-oss-120b | 3 / 18 | 3 | 0 | 0 | 15 | 18.09 | $0.02768760 |
| claude-fable-5-1 | 3 / 18 | 3 | 0 | 0 | 15 | 14.77 | $2.32466000 |
| claude-opus-5-5 | 3 / 18 | 3 | 0 | 0 | 15 | 10.17 | $0.92978400 |
| claude-sonnet-5-5 | 8 / 18 | 5 | 2 | 1 | 10 | 12.52 | $5.10290400 (usage partly unknown) |
| claude-haiku-4-5 | 3 / 18 | 2 | 0 | 1 | 15 | 14.87 | $0.25487900 |
| grok-4.7 | 3 / 18 | 3 | 0 | 0 | 15 | 9.65 | $0.36649600 |
| qwen3p8-max | 7 / 18 | 5 | 1 | 1 | 11 | 26.07 | $1.70645600 (usage partly unknown) |
| deepseek-v4-pro-0813 | 3 / 18 | 3 | 0 | 0 | 15 | 8.29 | $0.20811648 |
| deepseek-v4.1-flash | 7 / 18 | 5 | 2 | 0 | 11 | 13.63 | $0.46192410 |
| glm-5p3 | 3 / 18 | 3 | 0 | 0 | 15 | 12.70 | $0.20512460 |
| glm-5p3-flash | 8 / 18 | 5 | 0 | 3 | 10 | 10.09 | $0.17052750 |
| kimi-k3 | 3 / 18 | 3 | 0 | 0 | 15 | 8.69 | $0.44888400 |
| minimax-m3 | 3 / 18 | 3 | 0 | 0 | 15 | 16.13 | $0.04915260 |
| nemotron-3-ultra | 3 / 18 | 3 | 0 | 0 | 15 | 8.74 | $0.09629580 |

## Task matrix

Exactly one planned attempt per model/task. **P** = passed, **F** = incomplete, **B** = blocked, **—** = unattempted. Errors, failed checks, action counts, original campaign and run identifiers are in the CSV. One observation per cell does not estimate repeatability.

| Task | gpt-6-astra | gpt-6.1-sol | gpt-6-luna | gpt-oss-120b | claude-fable-5-1 | claude-opus-5-5 | claude-sonnet-5-5 | claude-haiku-4-5 | grok-4.7 | qwen3p8-max | deepseek-v4-pro-0813 | deepseek-v4.1-flash | glm-5p3 | glm-5p3-flash | kimi-k3 | minimax-m3 | nemotron-3-ultra |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| thread-reply | P | P | F | P | P | P | P | P | P | P | P | P | P | P | P | P | P |
| edit-message | P | P | P | P | P | P | P | B | P | P | P | P | P | P | P | P | P |
| incident-triage | — | P | — | — | — | — | P | — | — | P | — | P | — | P | — | — | — |
| handoff-dm | — | P | — | — | — | — | P | — | — | P | — | P | — | P | — | — | — |
| delete-draft | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| channel-topic | P | P | P | P | P | P | P | P | P | P | P | P | P | P | P | P | P |
| release-sync | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| incident-closeout | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| saved-cleanup | P | P | — | — | — | — | B | — | — | — | — | — | — | B | — | — | — |
| decision-record | — | P | — | — | — | — | F | — | — | F | — | F | — | B | — | — | — |
| handoff-repair | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| qa-signoff | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| publish-update | — | P | — | — | — | — | F | — | — | B | — | F | — | B | — | — | — |
| oncall-briefing | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| thread-repair | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| pin-refresh | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| design-handoff | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| release-retrospective | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |

## Accounting and integrity

- Selected 306-cell inventory: $18.00873428 recorded, including $0.28693400 unresolved reservations. This includes the preserved 37 attempts; it is not all newly incurred spend.
- Newly collected work: $8.59939453. All prior campaigns and the separate tiny access diagnostic: $10.42476640. Shared recorded total: **$19.02416093**; remaining **$280.97583907** of the original $300 ceiling. Do not add preserved-row costs again. Estimates/reservations are not invoices.
- Selected attempts: 631 requests; 8773099 accepted input tokens, 138622 accepted output tokens. 3795 total integrity checks, including the original 2,415; 38 new archived blocks. Hash consistency is not independent attestation or proof of task success.
- Source: `f559a61066ae76d3d8a6bc10d9c0fe3e6c09c9b0b12b18a62f1c1113aefd415c`; plan hash: `2fbb76f547ff2ac55c4df16f668d5ff4c4f65b04669c2be58497eb5347076c57`.
- New archives: `.runtime/model-breadth-2026-10-03/`. Preserved archives: `.runtime/all-tasks-2026-10-03/`. Byte hashes are in their respective manifests. Two exact-byte examples are also public: [Astra topic pass](block-009.tar.gz) and [Luna thread failure](block-019.tar.gz). All other originals remain local. These are curated inspection examples, not the complete sample or a replacement for its inventory.

Verify either public example without a key: `node scripts/inspect-task-campaign.mjs block-009 model-breadth-2026-10-03` (or `block-019`). It verifies the published archive hash, source and trace integrity. [Pilot admission review](../../../docs/campaigns/model-breadth-2026-10-03-pilot-review.md) records all 36 inspected archives, including the failed and blocked attempts.

## Availability and interpretation

- Google Gemini: Requires a Google provider key in Router; prior 403. Not silently replaced or counted as task failures.
- Meta Llama / Mistral: No eligible route in the account catalog at preparation.
- Jev: Requires a different API and action contract; excluded from this matched accessibility-policy comparison.
- One attempt per model/task on 18 public development templates at seed 1042. No reliability estimate, significance test, or held-out leaderboard.
- All 37 prior matching attempts are preserved, including failed and access-blocked cells; they are never retried. Cohort and original campaign/episode identities remain explicit.
- Temporal cohort and provider-routing effects are not controlled. Provider-default reasoning differs under the same 4096-token ceiling. This is a coverage inventory, not a causal ranking.
- Models are curated family/tier representatives from the account catalog, not an exhaustive or measured popularity list. Unavailable families are disclosed separately.
- Same frozen actor/harness/grader source and initial state, accessibility actions, recent-four history, 40 attempts and 180-second deadline. Other interfaces remain separate historical evidence.
- Partial output never executes. Allowed truncations/transport failures end the cell and retain receipts/reservations; authentication, unsafe cleanup, invalid evidence and the shared cap stop the worker.
- All prior pilot and diagnostic costs stay charged to the same $300 authorization. Imported rows are displayed once and their costs are not charged twice.
- Archives are locally preserved and hash checked, not independently signed or necessarily uploaded. Times include failures and capture overhead; costs are estimates, not invoices.

The earlier [1,800-cell campaign](../all-tasks-2026-10-03/README.md) is closed at 37 attempts. Its 1,763 unattempted cells remain in that historical record, not as failures or extra trials in this one-pass inventory.
