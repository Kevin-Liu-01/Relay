# Model breadth: one attempt per task

## Scope and provenance

- Supersedes the 1,800-episode plan at the user's request. **17 routes × 18 tasks × one seed = 306 cells.** No repeats, inference retries or selection of the best attempt.
- Preserve every one of the 37 already attempted seed-1042 cells from the closed `all-tasks-2026-10-03` campaign: 28 passes, five incomplete and four blocked. A failed carried cell is not eligible for a fresh attempt. Run only the 269 missing cells.
- The frozen [JSON plan](model-breadth-2026-10-03.json) binds the catalog, prices, all previous spend, carried rows, source fingerprint, task-state hashes and exact schedule. Original archives and stopped campaign denominators are unchanged.
- This is a development coverage inventory, not a new 306-trial randomized experiment. Preserved and new observations were collected at different times and with different outer grouping. Do not interpret differences as causal model effects or statistically reliable rankings.

## Model selection

Cover distinct flagship, standard and efficient routes from OpenAI (Astra, Sol, Luna, GPT-OSS), Anthropic (Fable, Opus, Sonnet, Haiku), xAI, Qwen, DeepSeek (Pro and Flash), GLM (standard and Flash), Kimi, MiniMax and NVIDIA. Exact IDs and catalog rates are in the plan. These are family/tier coverage choices, not measured popularity rankings. Exclude duplicate hosting aliases and older generations.

- Google Gemini is unavailable through this account without a separate Google provider key; retain the earlier 403 evidence separately.
- Meta Llama and Mistral have no eligible route in the preparation catalog.
- Jev uses a different observation/action API and is not part of this matched accessibility-policy comparison.

## Fixed episode contract

- Every task uses seed 1042, unchanged fixtures, source, grader, accessibility observation and browser-action schema. No answer guide; retain the latest four history entries.
- At most 40 actions/requests, 4,096 output tokens per call, 90-second request timeout and 180-second episode deadline. Model sampling/reasoning defaults remain provider defaults. Record requested and returned model IDs.
- One isolated cell per worker block, with separate database, browser context and local server. New outer blocks have a 240-second deadline and a $5 safety ceiling per cell; the shared remaining campaign budget is also enforced. The earlier $5 ceiling covered five-model blocks. These outer grouping differences are disclosed, not hidden.
- A request timeout, validated output limit, connection failure or episode deadline ends that cell, retaining its outcome and any unknown-cost reservation. Never execute partial output or retry inference. Authentication, invalid receipts, cleanup, budget, integrity or source failures stop the worker.

## Admission, limits and reporting

- First run the three specified tasks (topic, thread reply, message edit) on each of the 12 new routes: 36 unique cells that remain in the final matrix. Inspect receipts, traces, audit checks and matching initial hashes before bulk admission. This is a harness-quality gate, not a success-rate filter.
- Shared estimated-spend ceiling: **$300**, including all prior campaigns and probes. At preparation, $10.42476640 is already recorded, including $0.28693400 of unresolved reservation from the carried campaign. Remaining: $289.57523360. Estimates/reservations are not invoices.
- New-work limits: 24 hours elapsed from worker creation, 12,000 requests, 10 GB compressed archive allowance, and 10 GB free-disk reserve. A limit may leave cells unattempted; never silently shrink the denominator.
- Public summary and CSV include every planned cell plus its origin campaign and preserved/new cohort. Model pass fractions include blocked attempts; unknown values sort last. Show task-level results, latency, actions, errors and estimates without pretending one trial measures repeatability.
- Keep private capability URLs and credentials out of public artifacts. Hash-check and inspect exported archives without a key. Old raw observations are immutable.

## Operation

Prepare once with `node scripts/run-breadth-campaign.mjs prepare`, then run `pilot` with a private `RAMP_ROUTER_API_KEY` environment. After inspecting all 36 new pilot archives, run `bulk --reviewed-pilot`. `status` is read-only and requires no key. Never restart an unsafe or in-flight phase, edit the frozen launcher/helper, or rebuild the actor while a worker runs. The worker deliberately does not enable automatic campaign retries.

This plan was recorded before any new scored inference; the separate minimal access diagnostic is recorded in `evidence/breadth-access-2026-10-03.json` ($0.00000430 known usage) and is not a task trial.
