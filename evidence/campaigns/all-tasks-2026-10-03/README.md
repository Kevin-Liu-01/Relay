# Full task comparison — stopped

Updated 2026-10-03T07:42:42.243Z. This page reports actual collection, not the planned matrix as completed work.

- **37/1800 attempted; 28 passed, 5 incomplete, 4 blocked, 1763 unattempted.**
- Target: all 18 tasks × five models × 20 fixture seeds, 360 trials per model. Accessibility control only; public development templates, not an independent semantic holdout.
- [Frozen plan](../../../docs/campaigns/all-tasks-2026-10-03.md), [JSON](../../../docs/campaigns/all-tasks-2026-10-03.json), [all planned rows](trials.csv), [summary](summary.json), [manifest](manifest.json).

## Models

| Requested model | Attempted / planned | Passed | Incomplete | Blocked | Not run | Median seconds | Recorded allowance |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| gpt-6.1-sol | 8 / 360 | 8 | 0 | 0 | 352 | 11.88 | $2.00389200 |
| claude-sonnet-5-5 | 8 / 360 | 5 | 2 | 1 | 352 | 12.52 | $5.10290400 (usage unknown) |
| qwen3p8-max | 7 / 360 | 5 | 1 | 1 | 353 | 26.07 | $1.70645600 (usage unknown) |
| deepseek-v4.1-flash | 7 / 360 | 5 | 2 | 0 | 353 | 13.63 | $0.46192410 |
| glm-5p3-flash | 7 / 360 | 5 | 0 | 2 | 353 | 10.06 | $0.13416365 |

## Every task

Each cell shows **passed / attempted**, with **20 planned per model/task**. A zero denominator means not attempted, not a zero-percent score. The CSV distinguishes blocked trials from ordinary task failures.

| Task | gpt-6.1-sol | claude-sonnet-5-5 | qwen3p8-max | deepseek-v4.1-flash | glm-5p3-flash |
| --- | ---: | ---: | ---: | ---: | ---: |
| thread-reply | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |
| edit-message | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |
| incident-triage | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |
| handoff-dm | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |
| delete-draft | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| channel-topic | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |
| release-sync | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| incident-closeout | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| saved-cleanup | 1 / 1 | 0 / 1 | 0 / 0 | 0 / 0 | 0 / 0 |
| decision-record | 1 / 1 | 0 / 1 | 0 / 1 | 0 / 1 | 0 / 1 |
| handoff-repair | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| qa-signoff | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| publish-update | 1 / 1 | 0 / 1 | 0 / 1 | 0 / 1 | 0 / 1 |
| oncall-briefing | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| thread-repair | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| pin-refresh | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| design-handoff | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| release-retrospective | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |

## Accounting and integrity

- 423 requests; 6300095 accepted input tokens and 101050 accepted output tokens.
- $9.12240575 accepted-usage estimate + $0.28693400 unresolved reservations = **$9.40933975** recorded for this campaign. Not an invoice; missing usage is not free.
- Prior recorded allowance: $1.01542235. Remaining campaign ceiling: $289.57523790 of the shared $300 authorization. The frozen prior ledger identifies included access diagnostics; any later diagnostics must also be deducted before a successor campaign. Changing campaign names never resets this allowance.
- 2415 local integrity checks over 8 archived blocks. Hash consistency is not independent attestation. A verified archive can contain a blocked run.
- Source hash: `f559a61066ae76d3d8a6bc10d9c0fe3e6c09c9b0b12b18a62f1c1113aefd415c`; plan hash: `1800dc8a06458e319eb8b4ce0993deee4b162e11e40ed4f9e9716e1bd044f68a`.
- Original trajectory archives are preserved locally under `.runtime/all-tasks-2026-10-03/`, with byte hashes in the manifest. They have **not** been uploaded; the repository contains summaries and receipts, not fabricated download links to unpublished originals.

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
