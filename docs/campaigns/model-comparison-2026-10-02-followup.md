# Three-model accessibility follow-up

## Preregistration

- New, separately authorized campaign: 20 fresh trials each for GPT-4.1 nano, GLM 5.3 Flash and DeepSeek 4.1 Flash; 60 planned episodes. User approved continuation under a $3 ceiling.
- Selection is informed by responsive routes in the interrupted six-model campaign. This is not a random model sample. Do not combine the previous observations with these denominators or erase the prior provider timeout.
- Fixed tasks: channel topic, thread reply, message edit, incident triage and decision record. Each has seeds 42–45. Five public development templates with four repeated instances, not 20 independent task families or held-out problems.
- Accessibility browser control only. Same unchanged fixtures, prompts, strict final-state graders, recent-four history and no guide. Provider-default sampling/reasoning can differ; routes are not pinned model weights.
- Sequential isolated episodes: fresh workspace, browser context and model conversation. Task/seed blocks contain all three routes in a reproducible shuffled order. Preserve the actual schedule, requested/returned models, raw requests, receipts, action errors, captures and checks.

## Limits and stopping

- 16 action attempts, 4,096 output tokens per response, 250,000 conservative input units, 120 seconds per episode and 30 seconds per provider call.
- Four phases of 15 episodes, 240 maximum requests, 60 minutes and $0.75 maximum estimated spend each. Total $3, 960 maximum requests, 240 minutes, zero GPU hours. Estimates include unknown-use reservations and are not invoices.
- Freeze plan, launcher and execution source before inference. No mid-campaign code, prompt, parser, grader or model changes.
- Inspect the first completed three-model block before advancing beyond the first phase. Stop on broken observation, leaked answers, corrupt traces, provider failure, unknown usage, source drift, audit failure, cleanup failure or phase allowance exhaustion.
- No automatic inference retries, substitutions, resumption after a stop, or budget redistribution. Preserve all unattempted cells. Ordinary policy mistakes and step limits are results, not reasons to modify the experiment.

## Reporting

- Primary outcome: strict terminal-state pass including no collateral changes. Publish passed/attempted, planned, incomplete, blocked and unattempted counts; all 60 planned rows remain visible.
- Median wall time includes every attempted episode and observer overhead, not time-to-success. Publish actual usage and catalog-rate estimates, not claims about billed invoices.
- Descriptive comparison only. No significance claim, general model ranking, train/test split, or independent-trial confidence interval from cosmetic seeds.
- Closed campaigns `onsite-2026-10-01` and `model-comparison-2026-10-02` stay immutable and separately linked.

## Reproduce

```sh
npm ci
npx playwright install chromium
npm run build:hosted
# Provide RAMP_ROUTER_API_KEY privately.
node scripts/run-reviewed-campaign.mjs model-comparison-2026-10-02-followup seed-42
# After the pilot trace check and only if safeToContinue is true:
node scripts/run-reviewed-campaign.mjs model-comparison-2026-10-02-followup seed-43
node scripts/run-reviewed-campaign.mjs model-comparison-2026-10-02-followup seed-44
node scripts/run-reviewed-campaign.mjs model-comparison-2026-10-02-followup seed-45
```

- The launcher refuses overwritten evidence and checks exact account-discovered pricing before each phase. Private progress lives in `.runtime/`; scanned synthetic evidence is exported to `evidence/campaigns/model-comparison-2026-10-02-followup/`.

## Closeout

- Stopped at 4/60 after DeepSeek's eighth decision-record request timed out after 30 seconds with no receipt. Two edit-message passes, one incorrect/step-limited edit, one provider block; 56 cells not launched.
- $0.10937740 recorded allowance includes $0.02664480 unresolved reservation. All 212 archive integrity checks pass. [Full closeout](../../evidence/campaigns/model-comparison-2026-10-02-followup/README.md).
- This campaign is closed. The user approved a [new reserved-timeout plan](model-comparison-2026-10-02-reserved.md); never resume or rewrite this one.
