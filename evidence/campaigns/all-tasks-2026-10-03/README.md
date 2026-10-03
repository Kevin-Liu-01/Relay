# Full task comparison — pilot-review

Updated 2026-10-03T07:22:53.234Z. This page reports actual collection, not the planned matrix as completed work.

- **25/1800 attempted; 21 passed, 3 incomplete, 1 blocked, 1775 unattempted.**
- Target: all 18 tasks × five models × 20 fixture seeds, 360 trials per model. Accessibility control only; public development templates, not an independent semantic holdout.
- [Frozen plan](../../../docs/campaigns/all-tasks-2026-10-03.md), [JSON](../../../docs/campaigns/all-tasks-2026-10-03.json), [all planned rows](trials.csv), [summary](summary.json), [manifest](manifest.json).

## Models

| Requested model | Attempted / planned | Passed | Incomplete | Blocked | Not run | Median seconds | Recorded allowance |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| gpt-6.1-sol | 5 / 360 | 5 | 0 | 0 | 355 | 11.68 | $0.75727200 |
| claude-sonnet-5-5 | 5 / 360 | 4 | 1 | 0 | 355 | 11.54 | $1.84551200 |
| qwen3p8-max | 5 / 360 | 4 | 1 | 0 | 355 | 26.07 | $0.88582000 |
| deepseek-v4.1-flash | 5 / 360 | 4 | 1 | 0 | 355 | 8.91 | $0.22424460 |
| glm-5p3-flash | 5 / 360 | 4 | 0 | 1 | 355 | 10.06 | $0.06774190 |

## Every task

Each cell shows **passed / attempted**, with **20 planned per model/task**. A zero denominator means not attempted, not a zero-percent score. The CSV distinguishes blocked trials from ordinary task failures.

| Task | gpt-6.1-sol | claude-sonnet-5-5 | qwen3p8-max | deepseek-v4.1-flash | glm-5p3-flash |
| --- | ---: | ---: | ---: | ---: | ---: |
| thread-reply | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |
| edit-message | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |
| incident-triage | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |
| handoff-dm | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| delete-draft | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| channel-topic | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 | 1 / 1 |
| release-sync | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| incident-closeout | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| saved-cleanup | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| decision-record | 1 / 1 | 0 / 1 | 0 / 1 | 0 / 1 | 0 / 1 |
| handoff-repair | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| qa-signoff | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| publish-update | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| oncall-briefing | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| thread-repair | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| pin-refresh | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| design-handoff | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |
| release-retrospective | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 | 0 / 0 |

## Accounting and integrity

- 202 requests; 2762621 accepted input tokens and 48225 accepted output tokens.
- $3.78059050 accepted-usage estimate + $0.00000000 unresolved reservations = **$3.78059050** recorded for this campaign. Not an invoice; missing usage is not free.
- Prior recorded allowance: $1.01542235. Remaining campaign ceiling: $295.20398715 of the shared $300 authorization. The frozen prior ledger identifies included access diagnostics; any later diagnostics must also be deducted before a successor campaign. Changing campaign names never resets this allowance.
- 1214 local integrity checks over 5 archived blocks. Hash consistency is not independent attestation. A verified archive can contain a blocked run.
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
