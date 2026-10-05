# Reporting repair and continuation

## What stopped

The first attempt completed its recorded episode, then the collector crashed
while building its report. The new schedule had a `repetition` label. The old
report helper copied that label into the actor config, whose strict validator
correctly rejected it. No second attempt started.

This is separate from the first attempt's timeout. Sol issued 33 valid-format
pixel actions over 180.201 seconds. Many actions repeated top-bar clicks and
Control shortcuts. It never posted a reply. The 34th request had about 3.7
seconds left before the episode deadline and was aborted without a receipt.
The trace does not show a single 90-second provider stall. Saved UI captures
show navigation but no persistent workspace changes. Low-detail visual input
and platform-specific shortcuts remain limitations; this trace does not isolate
their causal effects.

## Authorized repair

The user explicitly requested fixing the failure and continuing to completion.
The repair is limited to reporting and collection continuity. It does not change
the models, prompts, tasks, viewport, image detail, action vocabulary, grades,
180-second episode deadline, or any other frozen limit.

- Original plan, worker, helper, stopped manifest and raw attempt remain intact.
- `scripts/lib/interface-repeat-recovery.mjs` removes the repeat label only at
  the report-to-config boundary. It first checks the exact phase and config.
- Regression tests reproduce the original exception and exercise reporting for
  every planned model/task/mode/repetition. They reject changed limits, unknown
  fields, skipped cells, duplicate runs and a reset clock.
- `scripts/recover-interface-repeat-first.mjs` makes a screened exact-byte copy
  of the original raw attempt and seals a new archive without model inference.
  A receipt binds all original artifact hashes and the stopped manifest.
- `scripts/run-interface-repeat-recovery.mjs` executes only untouched cells,
  in the original order, with the original eight-cell admission boundary.
- `scripts/verify-interface-repeat-recovery.mjs` reopens the archives and
  reconstructs outcomes and accounting. `--publish` uses the separate repeated
  study library, not either historical library.

## Preserved first attempt

- Run: `f65e4b6f-d462-4d5c-986a-19e14d7ba8f8`, Sol, thread reply, pixels, repeat 1.
- Outcome: blocked by episode timeout, 33 actions, no capture gaps.
- 245 integrity checks and all three recomputed grade checks agree.
- 34 requests, 33 accepted receipts, one unresolved request.
- Accepted usage estimate: $0.103440. Retained reservation: $0.127276.
- Total recorded allowance: $0.230716. Remaining shared allowance: $24.769284.
- This attempt remains one of the planned 48, not an excluded pilot or retry.

## Operational boundary

The new collection directory is `interface-repeat-2026-10-05-recovery`; the
study ID and frozen 48-cell plan remain `interface-repeat-2026-10-05`.
The original 20:18:30.673Z start controls the eight-hour wall-clock cap.
No accounting reset, request retry, replacement, relaxed limit or source change
is allowed. A valid timed-out cell ends that cell and advances to the next one
under the already approved failure policy. Inference, cleanup or evidence
failures outside that policy stop the collector.

The old summary reported zero because report creation failed. It is preserved
as a historical failed output, not used for current coverage. Use the recovery
summary and its archive-verification receipts. The first record retains its
original campaign provenance. Remaining records identify the recovery collector.
