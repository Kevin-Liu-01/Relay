# Eight-cell evidence review

## Decision

Admit the remaining 40 planned cells. All eight original attempts are terminal,
sealed, and independently verified. Admission is based on complete evidence and
correct controls, not on the seven passes. The original timeout remains included.

## Evidence checked

`node scripts/verify-interface-repeat-recovery.mjs` reopened all eight archives:
453 integrity checks and 24 recomputed outcome checks agree. There are zero
capture gaps, zero rejected actions and no cleanup errors. Each attempt has a
distinct run and workspace. All eight start with the same fixture hash and
served-app provenance. The preserved source/build validation also passes.

Verified summary hash:
`a9492499d5fc46f3a677bc673e0f524cb1cdf2a15b622fb957469c25c94d71e8`.

The exact saved request objects use the planned route, low reasoning, 4,096
output-token ceiling and identical thread-reply instruction. Pixel requests
contain the 1440×900 screenshot with `detail: low`; the other modes contain their
respective accessibility tree, page JSON or actor-API observation. Both pixel
attempts begin with the same screenshot. The action traces and final states
confirm the model used its assigned interface. The grader is not model input.

## Observations

| Cell | Route | Interface | Result | Actions |
| --- | --- | --- | --- | ---: |
| 001 | Sol | Pixels | Episode timeout | 33 |
| 002 | Sol | Accessibility | Passed | 4 |
| 003 | Sol | Page JSON | Passed | 4 |
| 004 | Sol | API | Passed | 3 |
| 005 | Sonnet | Pixels | Passed | 5 |
| 006 | Sonnet | Accessibility | Passed | 4 |
| 007 | Sonnet | API | Passed | 3 |
| 008 | Sonnet | Page JSON | Passed | 4 |

Sol's pixel attempt repeatedly clicked near the top bar and used Control
shortcuts. It made no persistent workspace changes before its 180-second
deadline. The final in-flight request retained its full reservation. This is
not a 90-second provider stall. Sonnet clicked the visible reply count, entered
the required text in the thread and sent it; the final screenshot and stored
parent ID agree. These observations do not isolate why the routes differed.

The text-UI attempts opened the correct parent thread, filled its composer and
sent the exact reply. Both API attempts fetched the channel messages before
sending to the observed parent ID. The seven passes each create exactly one
correct reply, with no unrelated persistent changes.

## Accounting and continuation

- 61 requests; 60 accepted receipts; one unresolved timeout request.
- Accepted base-rate estimate: $0.509034.
- Retained unresolved reservation: $0.127276.
- Recorded allowance: $0.636310 of $25; $24.363690 remains.
- No paid diagnostic calls, request retries or replacement attempts.
- The original stopped collector and raw attempt remain unchanged. The reporting
  repair is separately bound and tested; it does not alter the actor experiment.

Continue at cell 009 with the recovery worker and `bulk --reviewed-pilot`.
Keep the original plan, source, build, accounting, wall clock and all limits.
These eight cells cover one task, not the entire study or a general ranking.
