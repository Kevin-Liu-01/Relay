# Full task comparison — stopped

Updated 2026-10-03T06:54:59.913Z. This page reports actual collection, not the planned matrix as completed work.

- **1/1800 attempted; 0 passed, 0 incomplete, 1 blocked, 1799 unattempted.**
- Target: all 18 tasks × five models × 20 fixture seeds, 360 trials per model. Accessibility control only; public development templates, not an independent semantic holdout.
- [Frozen plan](../../../docs/campaigns/all-tasks-2026-10-02.md), [JSON](../../../docs/campaigns/all-tasks-2026-10-02.json), [all planned rows](trials.csv), [summary](summary.json), [manifest](manifest.json).

## Models

| Requested model | Attempted / planned | Passed | Incomplete | Blocked | Not run | Median seconds | Recorded allowance |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| gpt-6.1-sol | 0 / 360 | 0 | 0 | 0 | 360 | — | — |
| claude-sonnet-5-5 | 0 / 360 | 0 | 0 | 0 | 360 | — | — |
| gemini-3.8-flash | 1 / 360 | 0 | 0 | 1 | 359 | 0.88 | $0.02684100 (usage unknown) |
| deepseek-v4.1-flash | 0 / 360 | 0 | 0 | 0 | 360 | — | — |
| glm-5p3-flash | 0 / 360 | 0 | 0 | 0 | 360 | — | — |

## Every task

Each cell shows **passed / attempted**, with **20 planned per model/task**. A zero denominator means not attempted, not a zero-percent score. The CSV distinguishes blocked trials from ordinary task failures.

| Task | gpt-6.1-sol | claude-sonnet-5-5 | gemini-3.8-flash | deepseek-v4.1-flash | glm-5p3-flash |
| --- | ---: | ---: | ---: | ---: | ---: |
| thread-reply | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| edit-message | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| incident-triage | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| handoff-dm | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| delete-draft | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| channel-topic | 0 / 0 | 0 / 0 | 0 / 1 | 0 / 0 | 0 / 0 |
| release-sync | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| incident-closeout | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| saved-cleanup | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| decision-record | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| handoff-repair | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| qa-signoff | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| publish-update | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| oncall-briefing | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| thread-repair | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| pin-refresh | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| design-handoff | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| release-retrospective | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |

## Accounting and integrity

- 1 requests; 0 accepted input tokens and 0 accepted output tokens.
- $0.00000000 accepted-usage estimate + $0.02684100 unresolved reservations = **$0.02684100** recorded for this campaign. Not an invoice; missing usage is not free.
- Prior recorded allowance: $0.98803630. Remaining campaign ceiling: $298.98512270 of the shared $300 authorization. Separately recorded access diagnostics must also be deducted before a successor campaign.
- 13 local integrity checks over 1 archived blocks. Hash consistency is not independent attestation. A verified archive can contain a blocked run.
- Source hash: `f559a61066ae76d3d8a6bc10d9c0fe3e6c09c9b0b12b18a62f1c1113aefd415c`; plan hash: `8cd2758c07b2325fadf375936e38483386a5321d410048a2e49f2c024183276f`.
- Original trajectory archives are preserved locally under `.runtime/all-tasks-2026-10-02/`, with byte hashes in the manifest. They have **not** been uploaded; the repository contains summaries and receipts, not fabricated download links to unpublished originals.

## Limits

- 18 public development task templates, 20 fixture seeds per model/task; not 360 independent semantic tasks or a held-out benchmark.
- Accessibility browser control only; no pixel-policy or actor-API equivalence claim.
- One provider with model-default sampling/reasoning; exact request routes, not pinned weights. All returned identifiers are retained.
- Strict passed/attempted includes blocked trials. Missing trials stay unattempted. No global model ranking or significance claim.
- Known output-limit usage is included; unknown connection/timeout receipts retain full reservations. No inference retries.
- Budget, authentication, invalid receipt, harness, cleanup and integrity failures stop collection. Per-episode deadlines remain truncated results.
- Median time includes failures and observer overhead. Dollar figures are catalog-rate estimates/reservations, not invoices.
- Pilot stage is the first five prespecified task/seed blocks; results stay in this campaign if software/source/settings remain frozen.

Earlier [36-trial pilot](../model-comparison-2026-10-02-final/README.md): 20 passes, 11 incomplete, four output limits and one connection failure. Different action budget and model set; not pooled into this campaign.
