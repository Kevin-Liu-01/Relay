# Credential stop at 10 of 48 attempts

## Verified status

The reporting repair succeeded. All seven remaining admission attempts completed,
and the planned eight-cell review passed. The authorized bulk worker then ran
cells 009 and 010 before stopping. Both collection processes have exited and
released their locks. The completion follow-up is paused.

- Cell 009, Sonnet / incident closeout / accessibility / repeat 2, exhausted its
  unchanged $1 per-cell allowance. The next request required a $0.1966 reservation
  but only $0.1437 remained. It retained its $0.856312 accepted usage estimate and
  advanced normally. This was not a timeout or a spent $25 study allowance.
- Cell 010, Sonnet / incident closeout / Page JSON / repeat 2, received HTTP 401
  on request 13. The preceding 12 receipts remain recorded. The rejected request
  retains a $0.095958 reservation because it has no accepted usage receipt.
- A subsequent read-only authenticated `GET /v1/models` returned HTTP 401 with
  error code `api_key_deactivated`. No inference request was added by this check.
  The response establishes deactivation, not why the account deactivated it.

Failing request ID: `fad570bb-ad26-4857-91d2-1d9522779218`.

## Evidence and accounting

The verifier reopened all ten archives, including the authentication failure.
It passed 629 integrity checks and 42 saved-state grade checks, with no capture
gaps or cleanup errors. Seven attempts passed and three were blocked. Thirty-eight
remain unattempted. The original actor source and frozen dist still match the
pre-collection validation receipt.

| Measure | Recorded value |
| --- | ---: |
| Requests | 92 |
| Accepted receipts | 90 |
| Requests with unknown usage | 2 |
| Accepted usage estimate | $1.646900 |
| Retained reservations | $0.223234 |
| Total allowance used | $1.870134 |
| Remaining shared allowance | $23.129866 |

These are base-rate estimates and reservations, not invoices. The original
three-minute pixel timeout, per-cell allowance stop and authentication stop are
distinct outcomes. None has been retried, deleted or relabeled as a pass.

Verified summary SHA-256:
`22788d46fce854226e2e001e1fbc17b3ae37e70feffb95a562a4a14e6fef20ad`.

## Required action

The user must reactivate the Router key or put a replacement in the existing
private environment file, then request continuation. Do not place the key in
documentation, a commit, a command argument, or a public deployment.

Resume planning starts at cell 011: Sonnet / incident closeout / API / repeat 2.
The stopped collection is immutable and not automatically resumable. A reviewed
successor must preserve these ten attempts, their full cost, the 48-cell order,
the unchanged actor and limits, and the original wall-clock deadline. If that
deadline has elapsed, explicitly obtain a revised collection window before any
further inference. Never rerun already attempted cells to hide a failure.

The intended final deliverable is still the separate 48-run results table,
within-model/task/repeat comparisons, elapsed time and costs, and all traces and
replays. Do not publish a complete-study claim or a general interface ranking
from this partial collection. Historical 306-run and 96-run releases are unchanged.
