# Presentation and demonstration notes

## Format and timing

- 13 slides; 10–12 minutes, followed by a three-minute demonstration and discussion.
- Technical headings, bullets and diagrams. HTML works offline; PDF is the portable fallback.
- Camber matches Relay's interface; Lato supplies missing glyphs. Relay's mark,
  theSVG Slack/OpenAI marks and Lucide diagrams are bundled without external asset
  requests. Original asset restrictions still apply. `presentation.css` and
  `presentation.template.html` own the visual design; the builder embeds fonts for
  offline use, while hosting serves the same font bytes under the existing CSP.
- Regenerate with `npm run presentation` after updating verified evidence. Do not type improved results into the deck.
- Do not claim a new benchmark standard, secure sandbox, trained RL agent or model leaderboard.

## Slide 1 — Environment

- An agent must change a realistic workspace, not merely describe a solution.
- 18 tasks, synthetic data, independent terminal checks and actual browser interaction.
- Point to the runnable code, manual sandbox and evidence first.

## Slide 2 — Scope and prior work

- React, SQLite and Playwright keep state and interactions inspectable.
- Review covered mockups, functional clones, Cua Slack, env0 and Agent-Diff; external projects were inspected, not executed comparatively.
- MIT covers original code; proprietary fonts and third-party marks remain separate.

## Slide 3 — Interfaces

- Pixels use screenshot input and coordinates; text gateways use disclosed controls and references.
- API changes both information access and action granularity; do not combine it into a CUA score.
- Observer replay state and final grader diagnostics never enter the policy input.
- Guide/history controls are implemented but fixed in this campaign; no measured benefit is claimed.

## Slide 4 — Isolation

- Private SQLite file and fresh browser context per episode; no shared session cookie.
- Revisions fence stale writes; request IDs prevent duplication; reset retains audit history.
- Actor/control listeners share a process. Shell-capable policies need separate process/network isolation.
- Forced termination can prevent cleanup. No multi-host durability or tenant resource quotas are claimed.

## Slide 5 — Tasks and grading

- Decision-record combines fact retrieval, channel description, pin, saved reply and in-thread acknowledgement.
- Wrong target, stale fact, duplicate post and collateral changes fail even if the model says done.
- Expected states are independent contracts, not reference-policy replay or an LLM judge.
- Exact text is deliberate; fully undone collateral actions can pass under final-state grading.

## Slide 6 — Verification

- Software tests verify transitions, isolation, persistence and UI paths; grader challenges test false passes.
- Backend/browser counts come from test reports. The 84 positive and 2,583 negative grader states are a separate denominator.
- Real-model episodes are distinct from scripts, fake transport tests and three historical builder-informed Codex smokes.

## Slide 7 — One-pass campaign design

- 17 routes across nine model families × 18 public tasks × one attempt; seed 1042, accessibility control, recent-four history and no guide.
- Fixed 40-action, 4,096-output-token, 180-second and $5 trial ceilings; $300 cumulative allowance includes every prior pilot/probe.
- Preserved 37 earlier attempts plus 68 from the stopped first breadth worker; the continuation collected only the 201 untouched cells. All 306 are now recorded, with no repeats or hidden exclusions.
- The new scheduler can advance after a fully accounted cell-spend stop, but that cell remains blocked. This amendment and temporal cohorts are disclosed; no causal ranking or repeatability claim.
- Same source, fixtures and deterministic grader; exact requested/returned model receipts retained.

## Slide 8 — Earlier interface results (separate denominator)

- 20 attempted: 8 passes, 11 incorrect/step-limited, 1 blocked; 10 unattempted.
- Accessibility 2/6, page JSON 2/7 including one blocked, pixels 0/1; API control 4/6.
- Unequal task/model coverage makes this an inventory, not a causal comparison.
- 126 calls; $0.14987395 estimate/reservation, not an invoice; $0.0014902 remains reserved.
- No new incident-triage cells ran. Older scripted and builder-informed incident evidence stays separate.

## Slide 9 — Sortable model comparison

- Latest scope: **one attempt per task/model**, no repeats. All 18 tasks × 17 routes = 306 cells. Accessibility only, 40 actions, recent-four history, no guide, fixed grader. Family/flagship/efficient coverage is not a measured popularity ranking.
- The previous Qwen-inclusive study supplied 37 attempts, including a 401 block. The first breadth worker added 68 and stopped on Astra's $5 cell-spend boundary. All 105 attempts remain preserved; the continuation collects only the 201 untouched cells. Each row exposes its original campaign/run identity. Google still requires a separate provider key.
- In the original five-route pilot, four simpler tasks passed across all five routes. On decision-record, GPT passed; Qwen and DeepSeek used literal DESIGN, Sonnet posted three acknowledgements, and GLM used literal DESIGN before an output limit. This describes that earlier pilot, not all 17 routes or repeatability.
- Completed totals: **306 recorded, 152 passed, 61 incomplete, 93 blocked**; 4,662 action attempts and zero capture gaps. Shared estimates/reservations including earlier campaigns total $194.10583757, not an invoice. All 277 archives passed the completion audit and saved-state regrading.
- Custom task menu selects one task's 17-model comparison, one recorded cell each. All-tasks view shows 18 markers per model. Click column headers for raw-value sorting; unknown costs sort last. All 306 cells remain inspectable, including failures and blocks. A single observation per task cannot establish repeatability or statistical ranking.
- Open **All 306 trials**, then **Watch replay** or **Review trace** on a recorded row. The public library contains each exported attempt, including incomplete and blocked outcomes. Show a successful action sequence, its exact input/response, and a blocked zero-action record. Switch models without starting new inference. Checks, initial/final Changes and Provenance are separate views; JSON downloads the structured episode.
- State the fidelity boundary: recorded UI snapshots and pointer samples, not video. PNG bytes remain in original archives; their hashes are retained publicly. A blocked run's diagnostic state checks do not make it a completed pass.
- This is one shared JSON-text action contract, not each provider's native tool protocol. The report separates rejected steps and outputs without a parsed action. Inspect the original response before attributing a failure to UI reasoning; the parser was not adapted after seeing a route's output.
- The earlier 36-attempt pilot is linked separately: GLM and DeepSeek each passed 10/12, Nano 0/12. Four output limits and one missing-receipt connection failure remain blocks. This is not a global ranking; the action budget/model set differ from the new plan.
- Valid output-limit receipts now count reported usage without executing partial output. CLI-only continuation rules retain unknown timeout/connection reservations. Public defaults stay conservative.
- The $300 shared ceiling includes earlier model pilots. Receipts/reservations are estimates, not invoices. Source and launch plans stay immutable; no retries, substitutions or relaxed graders after looking at scores.

## Slide 10 — Findings

- Design-handoff is 0/17 with an instruction-contract ambiguity: six completed attempts copied literal DESIGN from both quoted messages, while the grader expects Willow at this seed. The task lacks an explicit substitution instruction. Keep those raw outcomes and show the exact input/actions; no retrospective regrading or reruns. Scripted execution tests do not validate natural-language clarity.
- Thread repair passed 13/17: agents had to retrieve the reviewed estimate, edit their existing reply, react to the review and post a confirmation. Three attempts were incomplete and one had a connection failure. This is one attempt per model, not a reliability estimate.
- The completed handoff slice passed 16/17, while release synchronization passed 0/17 under the fixed trial limits. Release-sync ambiguously locates the handoff and QA in engineering, although the handoff is in the project channel. Flag the 17 cells as diagnostic with a task-wording caveat, not clean capability evidence; no mid-run repair or rerun is performed.
- Saved-item cleanup passed 4/17. One extra diagnostic final-state pass ended at an output limit and correctly remains blocked.
- Fable's saved-cleanup trace passed in 15 actions. Nemotron's 40-action attempt missed the required message despite valid navigation/save actions.
- Sol set the release topic and posted QA, then repeated edit/cancel navigation and never completed the required original-message edit. The gateway accepted its actions; the state grader still rejected the outcome.
- Read the [original trace identities](campaigns/model-breadth-2026-10-03-observations.md). No hidden-reasoning inference, causal ranking or selection of successful retries.

## Slide 11 — Performance

- Current p50 measurements: create 17.34 ms, reset 1.50 ms, screenshot 84.15 ms.
- Distinguish direct-store reset, HTTP, page-ready and screenshot timing.
- 100 sessions and 16 concurrent API reads do not establish 16 concurrent agents.
- Browser child memory and sustained concurrency remain unmeasured; historical runs are not a controlled speed comparison.

## Slide 12 — Scaling

- Proposed path: admission queue, bounded workers, private state, separate control and evidence storage.
- Share immutable assets; partition synchronous state work; recycle workers and enforce limits.
- Use process/container/VM tiers according to policy privileges.
- Next measurement: 1/4/8/16 workers, full process-tree RSS, CPU, p95 step latency, failures and cleanup over a soak period.

## Slide 13 — Demonstration

- Open `/play`; search `in:design navigation`, open the decision thread and inspect final approval. Label it a manual synthetic sandbox.
- Open the trial library from slide 9 or 13. Select Fable / saved cleanup; play the 15-action pass, then inspect its exact request and outcome checks.
- Select Grok / release retrospective; scrub to the end and show the missing stale-save removal alongside the changes it completed. Open Trace, Changes and Provenance. The complete 17-model task slice remains in the table; these two are demonstration examples, not a curated denominator.
- The main site's older Replays menu still contains Luna's thread pass, decision-record failure and API control, labeled as earlier campaign excerpts.
- Optionally show the API decision-record pass as a retrieval/action control, not mouse-and-keyboard CUA.
- Open the full campaign inventory, including failures and unattempted cells. Curated examples are not the complete result set.
- Replay uses no inference or workspace writes. If a live service stalls, use recorded evidence and say so.

## Rehearsal

- Run `npm ci`, install Chromium, then `npm run verify`, `npm run test:graders`, `npm run inspect:campaign -- workflows` and `npm run presentation`.
- Run `npm run build:hosted && npm run live`, or use the public site. Keep the PDF/evidence locally available.
- Never screen-share keys. A paid live demo needs a provider-side cap and model availability check.
- Show cross-session noninterference/reset if asked; the committed isolation test is the reproducible fallback.

## Discussion answers

- Why a focused clone? Selected tasks need state, reset and reward; enterprise auth, uploads and calls add unrelated complexity.
- RL-ready? Reset/step/reward exist; training, standardized trainer adapters and held-out evaluation are not delivered results.
- Can policies cheat? Bounded gateways hide grader/control data. Shell access to this repository does not; serious evaluation must isolate and withhold them.
- How trustworthy are grades? Independent positive/adversarial challenges and UI recipes support tested contracts, not every future grader.
- What is replay fidelity? UI boundary states and pointer samples through the current renderer, not lossless video. Original PNGs remain the reference.
- Main gaps? Successful pixel policies, semantic holdouts and sustained worker measurements.
- Main finding? Plausible activity can use the wrong fact or destination; strict grading and complete traces expose it.
