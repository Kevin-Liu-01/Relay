# Final three-model comparison — validated truncation accounting

## Authorization and question

- User approved this final, separately labeled 60-trial campaign after two interrupted attempts. Original estimates/reservations remain charged against the same $3 allowance, not reset by changing the plan name.
- Compare exact account-discovered GPT-4.1 nano, GLM 5.3 Flash and DeepSeek V4.1 Flash routes on 20 fresh trials each: five public development tasks × seeds 42–45. Selection follows observed route responsiveness; it is not random or held out.
- Task/seed blocks contain all three models in a seeded shuffled order. One sequential worker; each trial uses a fresh workspace, browser context and conversation. No previous result is reused.
- Same prompts, fixtures, accessibility control, strict final-state grader, recent-four history, no guide, 16 action attempts, 4,096 output tokens and 120-second episode deadline. Provider-default sampling/reasoning differs and returned backend IDs may vary.
- 90-second per-request deadline, bounded by the remaining episode/run time. Source, plan, launcher and schedules are frozen before the first call.

## Revised trial and campaign boundaries

- A validated incomplete response with reason `max_output_tokens` is an `output_limit` trial. Its usage is accounted at frozen catalog rates; no partial action is parsed or executed. That trial remains blocked/truncated even if some diagnostic state checks pass. The next planned trial may run, without retrying the failed call.
- Only integer, nonnegative, internally consistent token counts from a structurally valid output-limit receipt qualify. Missing/invalid usage, content filtering, authentication errors and other rejected responses still stop the campaign.
- A provider-request timeout retains its full conservative reservation, permanently marks its usage unknown, and allows the next planned trial after successful cleanup. No retry, substitution or crediting it as free.
- Ordinary incorrect/step-limited episodes remain results. Harness, cleanup, source-drift and audit failures stop; cancellation and all dollar/request/wall-time limits remain enforced.
- Hosted/console runs reject these continuation overrides. They still stop after output limits; the accounting correction keeps valid reported usage rather than marking it unknown.

## Fixed resources

- Four phases of 15 trials, 240 requests and 60 minutes maximum each. Each phase has $0.68 estimated allowance; total new allowance **$2.72**, 960 requests, 240 minutes and zero GPU hours.
- Prior recorded allowances: $0.10937740 strict follow-up + $0.15668230 reserved-timeout attempt. Combined maximum with this campaign **$2.98605970**, below the original $3 ceiling. Both prior reservations remain included; no redistribution between phases.
- Pre-request reservations use conservative input units and maximum output tokens. Known usage replaces reservations at catalog base rates. Unknown reservations remain. This is not a provider invoice guarantee; provider key caps are the external billing control.
- Existing software controls and a first-block trace inspection precede the second phase. Fixes after collection require a new study; no hidden prompt or grader edits.

## Reporting

- All 60 planned rows, including incorrect, output-limited, timed-out and unattempted trials, stay visible. Primary metric: strict passed / attempted with planned denominator alongside it.
- Preserve raw requests, receipts, observations, rejected actions, final state and original screenshots. Publish checks, action attempts, model IDs, tokens, time, estimates and unresolved reservations.
- Median time includes all attempted trials and observer overhead, not time-to-success. Five task templates with repeated seeds do not establish broad model superiority, statistical significance or an independent holdout.
- Earlier campaigns remain immutable and separately linked, not pooled into this campaign.

## Commands

```sh
npm run build:hosted
# Supply RAMP_ROUTER_API_KEY privately. Check each phase before advancing.
node scripts/run-final-comparison.mjs model-comparison-2026-10-02-final seed-42
node scripts/run-final-comparison.mjs model-comparison-2026-10-02-final seed-43
node scripts/run-final-comparison.mjs model-comparison-2026-10-02-final seed-44
node scripts/run-final-comparison.mjs model-comparison-2026-10-02-final seed-45
npm run inspect:campaign -- seed-42 model-comparison-2026-10-02-final
```

## Closeout

- Stopped at 36/60: 12 attempts per model, 20 passes, 11 incomplete, four output-limited trials and one connection failure. The other 24 cells were never attempted.
- Seed 44, episode 006: GPT-4.1 nano's tenth request failed with `fetch failed` after nine actions. No receipt or HTTP status was received; the cause was not retained, so the archive cannot distinguish local versus upstream connection failure. Historical status remains `harness_error`.
- $0.66961055 accepted-usage estimate + $0.00938000 retained reservation = $0.67899055. Combined with the two prior attempts: $0.94505025, below the original $3 cap. All 1,971 archive integrity checks pass.
- The user initially approved a separately labeled remaining-24 continuation, then expanded the request to 20 trials **per task/model**, all 18 tasks, five stronger model routes and a $300 ceiling. The remaining-24 continuation was never launched. This campaign stays closed; the larger matrix is separate.
