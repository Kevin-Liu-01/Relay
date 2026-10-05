# Repeated interface comparison

## Authorization and question

On 2026-10-05 the user approved the proposed **48 new runs with an additional
$25 estimated-spend ceiling**. This is separate from the closed 96-run study
and 306-run inventory. Neither historical collection is resumed or pooled.

Question: for Sol and Sonnet on these workflows, which interface completes the
task most consistently within the fixed limits, and at what time and cost?

## Frozen design

- Routes: `gpt-6.1-sol` and `claude-sonnet-5-5`. Both must support image input,
  Responses, low reasoning and exact account-catalog pricing at preparation.
- Tasks: `thread-reply`, `edit-message`, and `incident-closeout`. They cover
  parent-thread selection, editing an existing message, and a multi-step
  workflow. They were chosen for workflow coverage, not a promised score gap.
- Four interfaces: accessibility, Page JSON, pixels, API. API is tool use.
- Two fresh attempts per model/task/interface, on unchanged seed 2042 fixtures.
  Each attempt creates a new workspace, browser context and model conversation.
  These are two stochastic attempts, not two independent task variants.
- Twelve complete blocks contain one model, one task and one repetition each.
  Shuffle the four modes within each block. The first two blocks cover thread
  reply, both models and all modes for an eight-cell trace-quality review.
  Shuffle the ten remaining blocks. Seed: 26100548; the JSON records every cell.
  The LCG/Fisher-Yates method matches the existing JavaScript study machinery.
- The admission cells count toward the 48. Review input, capture, grading,
  accounting and cleanup, not the success rate, before admitting the remaining 40.
- No request retries, replacement cells, best-of selection or early success stop.

## Controls and hard limits

The actor contract remains unchanged from the previous interface study: same
task text, initial data, grader, one JSON action per reply, recent-four history,
no guide, 40 actions/requests, 180 seconds per episode, 90-second request timeout,
4,096 output tokens, and low reasoning. Each cell has at most $1 estimated
allowance, further bounded by the remaining shared $25. There are at most 1,920
requests, eight wall-clock hours, 12 GB compressed archives, and a 10 GB free-disk
reserve. These caps can prevent full coverage; the planned denominator stays 48.

Pixels remain 1440×900 with low detail, using macOS keyboard semantics. This is
a replication of that interface bundle, not an optimized vision benchmark.
Accessibility and Page JSON expose different page representations; API exposes
records and semantic operations. Equal step limits do not mean equal work.
Do not tune prompts, shortcuts, image quality or limits after seeing outcomes.

Only one collector runs. No release builds or local test suites should run on
this agent's behalf during inference. Other activity on this shared Mac may
still affect elapsed time. Preserve the root `dist`; it is separately bound
from current source. Do not describe it as a freshly rebuilt current UI.

## Failure and accounting policy

- Valid output-limit usage remains charged to the ledger; partial actions are
  never executed. Request timeouts and connection failures retain full cost
  reservations and end that attempt without retry.
- Known-cost cell limits and episode deadlines end the cell. Unknown usage is
  never refunded. Passes, incomplete outcomes and blocks remain separate.
- Authentication, unsupported requests, bad receipts, evidence gaps, initial
  state mismatches, failed cleanup, source drift or shared limits stop collection.
- Keep every response, rejected action, state, grade and original archive.
  Public records are screened derivatives. Private tokens and keys never ship.

## Analysis fixed before collection

- Primary table: outcomes for every model/task/interface/repetition, with 48
  planned attempts and explicit unattempted cells if stopped.
- Show per-interface passes out of 12 attempts, plus each model's six attempts.
  For each model/task/interface show whether zero, one or both repeats passed.
- Pair modes within model/task/repetition. Report pass discordance, not just
  aggregate percentages. Summarize by task as well, rather than treating all
  repeats as unrelated tasks. Report all six mode pairs without selecting a
  favorable comparison after collection.
- Report elapsed time for all attempts and separately for shared successful
  pairs. Include early-stop caveats. Show actions, token usage, accepted cost
  estimates and unresolved reservations separately. Estimates are not invoices.
- A scoped recommendation requires a consistent pattern across both models
  and tasks, with its time/cost tradeoff stated. Otherwise report the tradeoff
  or inconclusive result. Never collect until a desired winner appears.
- This small development study is not powered for an authoritative general
  ranking. Strong models do not remove stochastic or task-selection variation.
  No significance claim or claim about all 18 tasks is planned.

## Operation and verification

Use `scripts/run-interface-repeat-study.mjs prepare` once with the existing
private Router credential supplied through the environment. Then run `pilot`.
At that stopped boundary, `scripts/verify-interface-repeat-study.mjs` reopens
the eight archives and reconstructs grades and accounting. Write the pilot
review before `bulk --reviewed-pilot`; the worker requires its receipt.
`status` is read-only. Do not restart a stopped worker automatically or repeat
an attempted cell. Do not edit the bound worker, helper, plan, source or dist.

At the final boundary, verify again. Optional `--publish` writes the separate
`evidence/interface-repeat-trial-library` and does not overwrite either previous
library. Reports must use the rechecked summary, not a moving progress snapshot.
