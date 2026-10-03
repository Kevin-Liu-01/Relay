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

## Slide 7 — Campaign design

- Freeze tasks, model routes, seed, prompts, budgets and source before inference.
- Three pilot cells, 24 matched workflow cells, three pixel follow-ups; one seed/repetition, no ranking.
- $3 total estimated allowance; no hidden retry, fallback model or cap increase.
- Exact requested/returned model receipts are retained.

## Slide 8 — Results

- 20 attempted: 8 passes, 11 incorrect/step-limited, 1 blocked; 10 unattempted.
- Accessibility 2/6, page JSON 2/7 including one blocked, pixels 0/1; API control 4/6.
- Unequal task/model coverage makes this an inventory, not a causal comparison.
- 126 calls; $0.14987395 estimate/reservation, not an invoice; $0.0014902 remains reserved.
- No new incident-triage cells ran. Older scripted and builder-informed incident evidence stays separate.

## Slide 9 — Sortable model comparison

- Corrected scope: 20 trials **per task/model**. All 18 tasks × five model routes × 20 fixture seeds = 1,800 planned; 360 per model. Accessibility only, 40 actions, recent-four history, no guide, fixed grader.
- Gemini's original first cell returned HTTP 403. The user approved a separately frozen successor with Qwen 3.8 Max. Its first 25 trials produced 21 passes, three incorrect outcomes and one output limit; the slide's generated counts report the current collection snapshot, not all 1,800 as completed.
- The four simpler pilot tasks passed for all models. On decision-record, GPT passed; Qwen and DeepSeek used literal DESIGN, Sonnet posted three acknowledgements, and GLM used literal DESIGN before an output limit. Preserve the failures. This is one seed per pilot task, not a model ranking.
- Custom task menu selects one task's five-model comparison, each with 20 planned markers. All-tasks view uses compact coverage bars. Click column headers for raw-value sorting; unknown costs sort last. All 1,800 trial rows remain inspectable.
- The earlier 36-attempt pilot is linked separately: GLM and DeepSeek each passed 10/12, Nano 0/12. Four output limits and one missing-receipt connection failure remain blocks. This is not a global ranking; the action budget/model set differ from the new plan.
- Valid output-limit receipts now count reported usage without executing partial output. CLI-only continuation rules retain unknown timeout/connection reservations. Public defaults stay conservative.
- The $300 shared ceiling includes earlier model pilots. Receipts/reservations are estimates, not invoices. Source and launch plans stay immutable; no retries, substitutions or relaxed graders after looking at scores.

## Slide 10 — Findings

- Luna passed thread reply through all three matched text/API interfaces; Mini failed those cells. One task does not establish broad superiority.
- UI decision-record failures copied literal `DESIGN`; API retrieved “Willow” and passed. Pin/save actions alone were insufficient.
- Pixel outputs contained malformed multiple actions; the parser rejected all 20 without mutation.
- Stop was an incomplete output-limited response, not 403: 1,024 output tokens, including 915 reasoning tokens.
- Hosted defaults already allow 4,096; this campaign froze a smaller allowance. A changed budget requires a new plan, not rewritten results.

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
- Relay → Replays → `GPT-6 Luna · thread reply passed`; play to the final state and show the exact reply.
- Open `GPT-6 Luna · decision record incomplete`; scrub to the end and show literal `DESIGN` and the failed outcome.
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
