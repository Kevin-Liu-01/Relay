# Three-model comparison with reserved timeout accounting

## Preregistered revision

- User explicitly approved a new campaign after the strict follow-up stopped: 90 seconds per request; continue to the next planned trial after an individual request timeout while retaining its entire reservation; never retry that call or replace its trial.
- 60 fresh trials: three exact Router routes × five public development templates × four seeds. GPT-4.1 nano, GLM 5.3 Flash and DeepSeek V4.1 Flash were selected after observing responsive routes. These are not random model samples or independent held-out task families.
- Same tasks, seed set, accessibility protocol, strict grader, recent-four history, no guide, 16 action attempts, 4,096 output tokens and 120-second episode deadline as the prior follow-up. Model order is seeded and shuffled inside task/seed blocks (see JSON). One sequential worker, fresh workspace, browser context and model conversation per trial.
- Source, plan, launcher and schedules are hash-bound before inference. No outcome-dependent prompt, parser, task, model or grader changes. Preserve requested and returned route IDs and all failed attempts. No pooling with earlier campaigns.

## Accounting and stopping

- Prior follow-up consumed $0.10937740000000003 of recorded allowance, including a $0.0266448 unknown-use reservation. This plan allocates $2.88 more, so combined exposure is at most $2.9893774000000004 against the original $3 estimated allowance.
- Four sequential phases of 15 trials, each capped at $0.72, 240 requests and 60 minutes; total 960 requests, 240 minutes, zero GPU hours. No budget redistribution.
- Each request is reserved before sending using conservative input units and maximum output tokens. Accepted usage replaces that reservation at frozen catalog base rates. A timed-out request retains its entire reservation and keeps usage unknown permanently.
- Only a provider-request TimeoutError with a positive retained reservation and successful workspace cleanup allows the next planned cell. It remains a blocked outcome. Episode/run deadlines still apply. Cancellation, cleanup/harness errors, non-timeout provider errors, missing or rejected receipts, budget exhaustion, source drift and audit failure stop the campaign.
- The next phase also requires verified audit integrity and only ordinary completed/step-limited episodes or explicitly reserved request timeouts. No retries, substitutions, or launch after a closed phase.
- This is conservative estimated accounting, not a provider invoice guarantee. A timeout does not prove the provider stopped processing. Provider key billing limits remain the authoritative external cap.
- The hosted playground retains strict stop-on-unknown behavior; this override is rejected outside a reviewed local CLI campaign.

## Analysis and artifacts

- Primary: strict final-state pass including no collateral mutations. Show all planned, attempted, passed, incomplete, blocked and unattempted counts. A completed collection can include failed or blocked trials.
- Five public task templates × four seed instances, not 20 independent reasoning problems. Report descriptive counts and per-task results; no population ranking or independent-trial significance claim.
- Median wall time includes every attempted trial, including blocks and observer overhead. Unknown cost sorts last; totals disclose retained reservations. All original requests, responses, observations, actions, terminal snapshots and audit records remain archived.
- Existing software/grader controls precede inference; inspect the first completed block before starting the second phase. Policy errors are results, not grounds to rewrite the plan.

## Execute and inspect

```sh
npm run build:hosted
# Supply RAMP_ROUTER_API_KEY privately. Four commands, only after each phase audit:
node scripts/run-timeout-tolerant-campaign.mjs model-comparison-2026-10-02-reserved seed-42
node scripts/run-timeout-tolerant-campaign.mjs model-comparison-2026-10-02-reserved seed-43
node scripts/run-timeout-tolerant-campaign.mjs model-comparison-2026-10-02-reserved seed-44
node scripts/run-timeout-tolerant-campaign.mjs model-comparison-2026-10-02-reserved seed-45
npm run inspect:campaign -- seed-42 model-comparison-2026-10-02-reserved
```

## Closeout

- Stopped after 7/60 attempts: four passes, two incorrect/step-limited trials, one block. DeepSeek returned an incomplete output-limit response with usage, which the frozen runner rejected rather than classifying as an allowed request timeout.
- $0.15668230 recorded allowance, including a $0.02595030 retained reservation. All 361 archive checks pass. [Complete evidence and diagnosis](../../evidence/campaigns/model-comparison-2026-10-02-reserved/README.md).
- This campaign is closed. Its records and source bindings must not be rewritten to apply later accounting changes.
