# Breadth admission review

## Decision

Admit the remaining **233 missing cells** under the frozen plan. No repeat of any
of the 73 attempted cells. This gate concerns trace/receipt integrity and matching
source/initial states, not choosing a favorable pass rate.

## Observed pilot

- 36 new episodes: three tasks each for 12 new routes. **34 passed, one incomplete,
  one output-limited.** Topic: 12/12; thread reply: 11/12; message edit: 11/12.
- 171 requests, 170 action attempts, 10 rejected actions, zero capture warnings.
- All 36 exported archives independently reopened without a key: **1,178 integrity
  checks**, no failed checks or gaps. Every initial-state hash matches its frozen
  task/seed hash and every run matches the source fingerprint. “Independently
  reopened” means a second local read, not a third-party attestation.
- New recorded estimate: **$6.36025068**, all usage known, no new unresolved
  reservations. Earlier recorded spend/probes: $10.42476640. Shared recorded
  allowance: $16.78501708; remaining $283.21498292 of $300. Not invoices.
- Combined inventory at this checkpoint: **73/306 attempted, 62 passed, six
  incomplete, five blocked, 233 unattempted**. This includes every prior failure.

## Trace review

- Inspected the action sequences and rejected-output prefixes for all 36 new
  episodes, plus their usage, requested/returned routes and outcome checks.
- Astra, Fable, Opus, GPT-OSS, Grok, DeepSeek Pro, GLM, Kimi, MiniMax and Nemotron
  passed all three simple tasks. Luna and Haiku each passed two. Three tasks and
  one seed do not establish broad model superiority.
- Luna's thread attempt generated multiple JSON objects, including invented
  post-action observations, in one response. Strict parsing rejected it before
  execution. The next response was `finish`; no reply was added. The independent
  final-state checks correctly failed message-count and destination/content checks.
- Haiku prefixed several actions with prose, causing JSON rejections. On message
  editing it returned an output-limit receipt after two rejected actions. Usage
  was validated and charged; partial output was not executed. The block is retained.
- GPT-OSS emitted two actions in one thread-reply response. That response was
  rejected, then later legal single actions completed the task within the original
  episode. This is agent recovery in its action budget, not an inference-request
  retry or a second trial.
- Catalog aliases can resolve to provider-qualified returned IDs; all receipts
  are retained. Kimi and Nemotron already show multiple returned hosting IDs.
  Exact request routes are compared, not immutable weights or controlled providers.

## Boundaries

- Same actor, grader, browser-action schema and observation policy as the 37
  preserved attempts. Source fingerprint:
  `f559a61066ae76d3d8a6bc10d9c0fe3e6c09c9b0b12b18a62f1c1113aefd415c`.
- No source/plan/launcher edits after admission collection began. Presentation,
  reports, documentation and verification are outside the inference binding.
- Full software suite: 150 backend checks and 84 browser checks pass. Some ran
  on the same host during this pilot; reported episode times include observer and
  possible shared-host contention and are not controlled latency benchmarks.
- All exported originals remain local, with two explicitly curated public archive
  examples (one success and one failure). Examples are not a replacement for the
  306-cell inventory and are not independent benchmark evidence.
