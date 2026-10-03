# Between-cell disk-space stop

## Completed after resumption — 2026-10-03 21:14 UTC

- **306/306 recorded: 152 passed, 61 incomplete, 93 blocked; zero unattempted.**
  The same frozen worker finished block-269 and exited successfully. No repeats,
  changed graders or relaxed limits were used. Do not resume this closed collector.
- The final completion verifier reopened all **277 archives / 306 attempts**:
  **26,403 integrity checks and 2,007 saved-state grading checks agree**, with zero
  capture gaps and identical recorded backend/build receipts.
- Final summary SHA-256: `6618f7f2041bf3d9334ba70f47716380b1495a5bf0d51ba68fc6fd144d71211f`.
  See the [completion certificate](../../evidence/campaigns/model-breadth-2026-10-03-continuation/verification.json).
- Shared recorded allowance: **$194.10583757**, leaving **$105.89416243** under
  the original $300 cap. This includes prior campaigns and retained reservations;
  it is not an invoice. Original archives and negative evidence are preserved.
- All stop/resumption instructions below are historical records, not a request
  to launch the worker again. Final release verification is in [verification](../verification.md).

## User-authorized cleanup and resumption — 2026-10-03 20:13 UTC

- The user explicitly identified Desktop screen recordings for deletion to free
  space. The 13 largest exact `Screen Recording … .mov` files (all July–August)
  were checked as regular, non-symlink movie files with unchanged sizes before
  permanent deletion. They totaled 16,154,591,985 bytes. All September recordings,
  51 remaining recordings in total, screenshots, other videos and research evidence
  were retained. Deletion was permanent, not a move to Trash.
- Available space recovered to about 28.7 GB. Preflight confirmed no worker lock,
  all 144 continuation phases terminal/safe, unchanged actor source and an open
  original deadline. PID 33633 resumed the same frozen worker at untouched
  block-213. No trial was repeated, and no policy or budget changed.
- The production trace/replay viewer and presentation already expose the verified
  249-record checkpoint (commit `bc34ba7`). They must be refreshed and independently
  checked against the final summary before claiming all 306 attempts are published.

## Historical stopped checkpoint — 2026-10-03 19:46 UTC

- **249/306 attempts: 123 passed, 50 incomplete, 76 blocked; 57 unattempted.**
- The user-restored run finished 86 additional untouched cells, then free space
  fell below the unchanged 10,000,000,000-byte reserve. PID 44210 exited after
  block-212; all 144 continuation phases are terminal and safe. No active cell
  was abandoned at this boundary. The next cell is block-213, Sol / incident-closeout.
- Free space was about 6.6 GB at the stop. The continuation's local evidence uses
  about 1.5 GB; no unrelated files or historical evidence were deleted. The user
  was asked to restore another 10–15 GB. Do not lower the reserve.
- Continuation estimate/reservation: **$124.28363005**, including **$2.52190490**
  unresolved reservations. Prior bound ledger: **$35.34935278**. Shared total:
  **$159.63298283**; **$140.36701717** remains. Estimates are not invoices.
- Partial verification at 2026-10-03T19:49:19.594Z reopened **220 original archives
  covering all 249 attempts**: **21,422 integrity checks and 1,649 grading checks
  agree**, with zero capture gaps and identical recorded backend/build receipts.
  Summary hash: `e0e24a1816c339cc3e795bfaba443daa156227f94e2a28908832413168d77126`.
  This is not a completion certificate.
- All 249 structured records have been exported for key-free trace/replay review.
  The original local actor build remains untouched; production UI validation uses
  a separate temporary copy. The collection deadline and all frozen limits remain
  unchanged. Historical checkpoints below retain their original counts.

## User-restored space and continuation

At 2026-10-03 17:48 UTC the user confirmed space was cleared. The read-only
preflight found about **41.24 GB free**, no existing worker lock, all 58 saved
phases terminal/safe, and the original deadline still open. The same frozen
worker resumed from untouched block-127 as PID 44210. No task was repeated and
no collection limit, actor source or grader changed. The stop checkpoints below
are historical; use the current campaign summary for live progress.

## Earlier 163-attempt checkpoint

- **163/306 attempts: 93 passed, 30 incomplete, 40 blocked; 143 unattempted.**
- A transient recovery allowed exactly one additional untouched cell, block-126 (GLM 5.3 / on-call briefing). It ended at an output limit after 12 actions with $0.24747080 known estimated usage. It remains blocked.
- The disk gate then stopped the worker again. PID 98324 has exited; all 58 phases are terminal/safe and the lock is released. The next untouched cell is block-127 (MiniMax / on-call briefing).
- Shared recorded allowance is **$94.16933556**, leaving **$205.83066444**. No evidence was deleted and no limit was relaxed. Restore useful free space before another launch rather than cycling on transient headroom.
- Final partial check at 2026-10-03T10:49:36.995Z reopened all **134 archives / 163 attempts**: **12,844 integrity checks and 892 grading checks agree**. Summary SHA-256: `04a4c9d40adcd3d74344eeb9ab3c62f7cfd9ad42e875f79650c7d96b8a8dc457`. The backend suite also passed all 160 tests. Completion/publication is still outstanding.

## Observed state

- At 2026-10-03 10:43 UTC, the continuation was stopped after block-125: **162/306 attempts, 93 passed, 30 incomplete, 39 blocked, 144 unattempted**.
- The frozen preflight rejected free disk below **10,000,000,000 bytes**. A subsequent read found 9,218,093,056 bytes available. This is a machine resource stop, not a new model outcome.
- All 57 continuation phases are terminal with verified archives and `safeToContinue: true`. The last phase is Kimi / on-call briefing, an action-limited incomplete result. The next untouched phase is block-126, GLM 5.3 / on-call briefing, seed 1042.
- The worker exited and released its lock. No collector remained active at that stop. Other applications and their processes were not stopped; no files were deleted.
- Relay's `.runtime` directory is about 1.6 GB and contains original evidence. Disposable build/test artifacts are about 0.4 GB—insufficient to restore useful headroom. The user was asked to free 10–15 GB or identify a disposable folder; unrelated storage is out of scope.

## Evidence and accounting

- Current continuation recorded allowance: **$58.57251198**, including **$1.01609470** unresolved reservations. Bound prior allowance: **$35.34935278**. Shared recorded total: **$93.92186476**, leaving **$206.07813524** of the original $300 ceiling.
- Existing results, raw archives and failure statuses are unchanged. No inference retries, replacement trials, grader edits or budget increases occurred.
- The read-only partial verifier reopened **133 original archives covering all 162 attempts** at 2026-10-03T10:44:16.921Z: **12,771 integrity checks, 884 saved-state outcome checks, full grade agreement, zero capture gaps**. Snapshot SHA-256: `446c7182fb2efd68ff6abec0793c90d5ccbe96d1fe8341f5e51043da207148c5`. This is partial verification, not a 306-cell completion certificate.
- The frozen worker's failure handler updates its private manifest and public summary but leaves the public manifest at the last completed-block snapshot. The read-only verifier binds the stop diagnostic to the private manifest and requires identical phase lists; it does not repair historical evidence or mistake the public `running` label for a live process.
- No completion certificate is issued for this partial inventory. The current public deployment is still the earlier 75-attempt snapshot; the unfinished local changes have not been presented as final results.

## Safe continuation after space is restored

1. Confirm the exact stop, absence of the worker lock, all recorded phases safe, unchanged source/plan/launcher bindings and at least 10 GB free. Prefer additional headroom to avoid another disk stop.
2. The existing frozen worker starts at `manifest.phases.length`, now 144: block-213. The collection deadline is unchanged at **2026-10-04T08:21:43.494Z**. Do not reset it or rerun `prepare`.
3. Run `node --env-file=/private/path/to/provider.env scripts/run-breadth-continuation.mjs bulk`. This is a between-cell continuation, not permission to resume an unsafe/in-flight model attempt. Keep credentials private.
4. After all 306 unique attempts are recorded, run the full completion verifier, regenerate the report and slides/PDF, pass the full software/browser tests, then commit/push and verify the deployment. Do not build Vite while inference is running.

No shared limit or collection policy was relaxed to bypass this stop.

## Same-plan continuation

At a subsequent preflight, free space rose to **10,066,575,360 bytes** without any
deletion by this agent. The same frozen command restarted as PID 98324 from
block-126. No source, schedule, cell limit or global deadline changed; the disk
check remains in force before each new cell. The 162-attempt stop snapshot above
is historical, not the current count. This continuation subsequently stopped
again after block-126, as recorded in the latest checkpoint above.
