# One-pass model coverage — stopped

Snapshot: 2026-10-03T09:12:36.213Z. Planned work is not a completed result.

- **105/306 attempted: 76 passed, 13 incomplete, 16 blocked; 201 unattempted.**
- 37 original attempts preserved, including every failure; 68 new attempts. No repeated model/task cells, retries or best-of selection.
- 17 requested routes × all 18 public development tasks × one seed (1042). Same source, initial states and outcome graders. Accessibility control only.
- [Plan](../../../docs/campaigns/model-breadth-2026-10-03.md), [frozen configuration](../../../docs/campaigns/model-breadth-2026-10-03.json), [all cells CSV](trials.csv), [summary](summary.json), [manifest](manifest.json).

## Models

Pass fractions include blocked attempts. Unattempted cells are not failures. Click-to-sort and per-task filters are in [the presentation](https://relay.kevinliu.studio/presentation#9).

| Model route | Attempted / 18 | Passed | Incomplete | Blocked | Not run | Median seconds | Recorded estimate / reservation |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| gpt-6-astra | 6 / 18 | 5 | 0 | 1 | 12 | 11.74 | $8.05000000 |
| gpt-6.1-sol | 9 / 18 | 8 | 1 | 0 | 9 | 12.07 | $3.40351600 |
| gpt-6-luna | 6 / 18 | 3 | 3 | 0 | 12 | 13.23 | $0.13321400 |
| gpt-oss-120b | 5 / 18 | 3 | 1 | 1 | 13 | 21.24 | $0.15693525 (usage partly unknown) |
| claude-fable-5-1 | 5 / 18 | 5 | 0 | 0 | 13 | 14.77 | $5.52557000 |
| claude-opus-5-5 | 5 / 18 | 5 | 0 | 0 | 13 | 10.17 | $2.55965600 |
| claude-sonnet-5-5 | 8 / 18 | 5 | 2 | 1 | 10 | 12.52 | $5.10290400 (usage partly unknown) |
| claude-haiku-4-5 | 5 / 18 | 3 | 0 | 2 | 13 | 14.87 | $0.32652200 |
| grok-4.7 | 5 / 18 | 4 | 1 | 0 | 13 | 13.40 | $1.77822800 |
| qwen3p8-max | 8 / 18 | 5 | 1 | 2 | 10 | 40.78 | $2.40840600 (usage partly unknown) |
| deepseek-v4-pro-0813 | 6 / 18 | 4 | 0 | 2 | 12 | 15.22 | $1.09268808 (usage partly unknown) |
| deepseek-v4.1-flash | 8 / 18 | 5 | 2 | 1 | 10 | 14.46 | $0.51119010 |
| glm-5p3 | 6 / 18 | 4 | 0 | 2 | 12 | 25.48 | $1.17231880 (usage partly unknown) |
| glm-5p3-flash | 8 / 18 | 5 | 0 | 3 | 10 | 10.09 | $0.17052750 |
| kimi-k3 | 5 / 18 | 4 | 0 | 1 | 13 | 8.69 | $1.39650900 (usage partly unknown) |
| minimax-m3 | 5 / 18 | 4 | 1 | 0 | 13 | 16.13 | $0.08404080 |
| nemotron-3-ultra | 5 / 18 | 4 | 1 | 0 | 13 | 8.74 | $0.46170060 |

## Task matrix

Exactly one planned attempt per model/task. **P** = passed, **F** = incomplete, **B** = blocked, **—** = unattempted. Errors, failed checks, action counts, original campaign and run identifiers are in the CSV. One observation per cell does not estimate repeatability.

| Task | gpt-6-astra | gpt-6.1-sol | gpt-6-luna | gpt-oss-120b | claude-fable-5-1 | claude-opus-5-5 | claude-sonnet-5-5 | claude-haiku-4-5 | grok-4.7 | qwen3p8-max | deepseek-v4-pro-0813 | deepseek-v4.1-flash | glm-5p3 | glm-5p3-flash | kimi-k3 | minimax-m3 | nemotron-3-ultra |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| thread-reply | P | P | F | P | P | P | P | P | P | P | P | P | P | P | P | P | P |
| edit-message | P | P | P | P | P | P | P | B | P | P | P | P | P | P | P | P | P |
| incident-triage | — | P | — | — | — | — | P | — | — | P | — | P | — | P | — | — | — |
| handoff-dm | P | P | P | F | P | P | P | P | P | P | P | P | P | P | P | P | P |
| delete-draft | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| channel-topic | P | P | P | P | P | P | P | P | P | P | P | P | P | P | P | P | P |
| release-sync | B | F | F | — | — | — | — | — | — | — | B | — | B | — | — | — | — |
| incident-closeout | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| saved-cleanup | P | P | F | B | P | P | B | B | F | B | B | B | B | B | B | F | F |
| decision-record | — | P | — | — | — | — | F | — | — | F | — | F | — | B | — | — | — |
| handoff-repair | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| qa-signoff | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| publish-update | — | P | — | — | — | — | F | — | — | B | — | F | — | B | — | — | — |
| oncall-briefing | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| thread-repair | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| pin-refresh | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| design-handoff | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |
| release-retrospective | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — | — |

## Terminal outcomes

A completed agent loop may still fail the task. Output limits and timeouts are blocked attempts, even when their final workspace happens to satisfy diagnostic checks. No partial response is executed; no blocked cell is replaced by a repeat.

| Recorded terminal status / outcome | Attempts |
| --- | ---: |
| budget / blocked | 1 |
| completed / incomplete | 6 |
| completed / passed | 76 |
| credentials_invalid / blocked | 1 |
| output_limit / blocked | 7 |
| step_limit / incomplete | 7 |
| timeout / blocked | 7 |

## Accounting and integrity

- Selected 306-cell inventory: $34.33392613 recorded, including $0.94903191 unresolved reservations. This includes the preserved 37 attempts; it is not all newly incurred spend.
- Newly collected work: $24.92458638. All prior campaigns and the separate tiny access diagnostic: $10.42476640. Shared recorded total: **$35.34935278**; remaining **$264.65064722** of the original $300 ceiling. Do not add preserved-row costs again. Estimates/reservations are not invoices.
- Selected attempts: 1118 requests; 15334138 accepted input tokens, 299289 accepted output tokens. 6495 total integrity checks, including 2415 carried checks; 68 new archived blocks. Hash consistency is not independent attestation or proof of task success.
- Source: `f559a61066ae76d3d8a6bc10d9c0fe3e6c09c9b0b12b18a62f1c1113aefd415c`; plan hash: `2fbb76f547ff2ac55c4df16f668d5ff4c4f65b04669c2be58497eb5347076c57`.
- Archives live under each row's original campaign: `.runtime/<originCampaign>/`. Byte hashes are in the corresponding manifests. Two exact-byte examples are public: [Astra topic pass](block-009.tar.gz) and [Luna thread failure](block-019.tar.gz). All other originals remain local. These are curated inspection examples, not the complete sample or a replacement for its inventory.


Verify either public example without a key: `node scripts/inspect-task-campaign.mjs block-009 model-breadth-2026-10-03` (or `block-019`). It verifies the published archive hash, source and trace integrity. [Pilot admission review](../../../docs/campaigns/model-breadth-2026-10-03-pilot-review.md) records all 36 inspected archives, including the failed and blocked attempts.

With all original archives and block reports available locally, run `node scripts/verify-breadth-completion.mjs model-breadth-2026-10-03` for the complete no-inference audit. It refuses partial collection. `--partial` checks a running snapshot without writing or claiming completion.

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
