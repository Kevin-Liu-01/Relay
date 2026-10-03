# One-pass coverage: remaining 201 cells

## Recorded before continuation inference

- The user requested completion of the existing 17-model × 18-task, one-attempt inventory. This is not additional model/task coverage, a repeat campaign, or a higher spending authorization.
- The original [one-pass worker](model-breadth-2026-10-03.md) is closed at **105/306 attempts: 76 passed, 13 incomplete, 16 blocked**. Its final cell, Astra / release-sync, stopped after 26 actions because the next $0.9771 reservation exceeded the $0.8322 left under its $5 trial ceiling. Accepted usage was $4.16782000. The stop is retained as a blocked result, never retried.
- All 105 attempted cells were reopened from 76 original archives: **6,495 integrity checks and 466 saved-state grading checks agree**. The stopped cell had known usage, no outstanding request reservation, verified artifacts, the matched initial state and no cleanup error. The original worker, plan, summary, reports and archives are not resumed or rewritten.
- Carry all 105 attempts into a separately labeled aggregate with original campaign/run identities. Only the 201 never-attempted cells run, in their unchanged original order, starting at block-069 and ending at block-269. The combined denominator remains 306.

## Unchanged per-trial contract

- Same actor, harness, grader, source hash, initial workspace hashes and seed 1042.
- Same model routes and catalog base rates; accessibility control, no guide, recent-four history.
- Same 40 actions/requests, 4,096 output tokens per request, 90-second request timeout, 180-second episode deadline and $5 per-cell ceiling (also bounded by the remaining shared allowance).
- One fresh workspace and browser context at a time. No inference retry, model substitution, task replacement, grading change or execution of partial output.
- The original 36-cell new-model pilot admission remains applicable because actor/model contracts are unchanged. It is bound by hash; no new pilot repeats are added.

## Explicit scheduling amendment

- A fully accounted per-cell **spend reservation stop** still ends that cell and counts as blocked. It may permit the next untouched cell only when accepted usage is known, outstanding reservation is zero, the archive verifies, the initial state matches and cleanup succeeded.
- This is implemented in the new worker's scheduling layer. The frozen `Experiment` and its original terminal statuses remain unchanged; a stopped run is not relabeled successful or completed.
- Existing allowlisted request timeouts, validated output limits, connection failures and episode deadlines retain their original receipts/reservations and permit the next cell. Authentication, missing/invalid evidence, invalid receipts, cleanup failures, source drift and shared-resource limits still stop the worker.
- The amendment was specified after observing the original spend stop. It is disclosed as an operational cohort difference, not a preregistered feature of the original run or a causal model comparison. There is no outcome-based selection or significance testing.

## Shared bounds and reporting

- **$300 original cumulative ceiling**, not reset. Prior recorded allowance is **$35.34935278**, leaving **$264.65064722**. The 105 selected attempts include $0.94903191 unresolved reservations; all other prior campaigns/probes remain in the cumulative ledger. Estimates are not invoices.
- The 24-hour deadline remains measured from the original worker's creation. The remaining request/archive allowances subtract work already collected by that worker; the 10 GB free-disk reserve remains unchanged.
- Freeze the new JSON, scheduling helper and worker before launch. Preserve every terminal result and missing cell in the aggregate. Reopen all original archives and recompute grades before publishing a completed result.
- Original summaries stay immutable. The continuation's summary distinguishes preserved/new rows and retains their real origin campaign. One attempt per public task cannot establish repeatability, broad model superiority or held-out generalization.

## Commands

Prepare once: `node scripts/run-breadth-continuation.mjs prepare`.
Collect: `node --env-file=/private/path/to/provider.env scripts/run-breadth-continuation.mjs bulk`.
Status: `node scripts/run-breadth-continuation.mjs status`.
Do not resume an unsafe/in-flight block or rebuild the actor while collecting.
