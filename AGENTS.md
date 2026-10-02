# Relay handoff

For the onsite deliverable, start with `docs/onsite-readiness.md`, the frozen
`docs/campaigns/onsite-2026-10-01.md` plan and the complete campaign inventory.
That campaign stopped on an incomplete output-limited receipt: 20 attempted,
8 passed, 11 incorrect/step-limited, 1 blocked, 10 unattempted. Never resume it,
relax its grader or present curated replay excerpts as the full matrix.
Original trajectories live in hash-checked compressed bundles; `npm run
inspect:campaign -- workflows` verifies them without a key. `npm run presentation`
builds the 12-slide HTML/PDF from evidence and its editable template; keep headers,
bullets and diagrams, with no marketing claims. MIT covers original code and
documentation, not third-party fonts or brand assets.

Relay is a standalone CUA/RL environment, extracted from `cotcodec/cua-slack` into `Kevin-Liu-01/Relay`. Keep unrelated memory research and private local runs out of this repository. The user-facing name is **Relay** (capital R).

Read `README.md`, `docs/architecture.md`, `docs/verification.md`, and `docs/research.md`. The application, trainer and evaluator are deliberately separate interfaces. The browser may never receive control-plane credentials, task answers or evaluator code.

For Relay Lab, read `docs/benchmark-lab.md` and `docs/lab-plan.md`. `npm run lab`
serves the operator-only console on 4330. `runner/` owns interface gateways,
Ramp Responses transport, budget and evidence. Do not substitute another provider
key for Ramp. Live runs require positive pricing and account-discovered model IDs.
Preserve failures and mark missing usage unknown. References are scripts, not model evidence.

For the public release at `relay.kevinliu.studio`, read `docs/hosting.md` and
`docs/system-one.md`. `src/live/` owns the screen-first BYOK UI; `hosted/` owns
request-isolated execution and NDJSON streaming; `api/relay.mjs` is the Vercel entry.
`/play` (also `play.html`) is the no-key, hands-on sandbox, using the same Slack
React app and `shared/workspace.mjs` transition/search rules. `src/play/session.mjs`
owns only page-memory state. The build emits an actor-visible fictional seed,
never task answers or a grader. Refresh/reset clears it. Do not persist sandbox
state with provider credentials, write it into agent history, or treat it as a
scored benchmark. The agent spectator and recorded replay remain read-only.
Provider keys may persist only in the operator UI's dedicated localStorage record
when “Remember keys on this device” is enabled (default on, as requested by Kevin).
Keep keys out of run history, audit, replay, exports and server persistence. Never
deploy a shared provider key. Restoring a key may discover models, never start a run.
History is browser-local, not a shared server database. Jev uses TypeSafe's official
Choice API, not SGLang: text observations, deterministic candidate menu, real returned
probabilities. Fake transport tests are not evidence of live Jev inference.

Read `docs/replay-and-arena.md` for the 1v1 and actual-UI playback contracts.
Read `docs/interface-controls.md` before changing Relay's custom icon menus.
Read `docs/task-suite.md` before adding tasks or changing rewards. The six original
tasks keep v1 fixtures; the 12 new workflows use separate v2 fixtures/contracts.
Never derive grader expectations by replaying the reference policy or transitions.
`npm run test:workflows` verifies deep UI paths; `npm run test:graders` exports the
zero-inference adversarial report. New templates are development tasks, not holdouts.
Keep `RelaySelect` shared and its dialog, keyboard and reduced-motion checks intact.
Hosted pricing comes from `hosted/pricing.mjs`, not user confirmation or frontend
model hints. Prefer validated Router v1 catalog pricing for its exact request ID;
use exact-ID public-doc rates only for older catalogs without metadata. Explicitly
invalid/incompatible metadata cannot fall back to guessed display labels. Keep
source/date/hash, bounded fallback expiry and server-side rate binding intact.
`src/live/run-plan.mjs` gives queued models and matched interfaces separate hosted
requests and full per-cell budgets. Queue up to eight models; one runs at a time.
Stop cancels remaining jobs; unknown usage, interrupted evidence or failed history
save halts the queue. Do not resume on reload or retry inference automatically.
The default $2 allowance is per model, including both 1v1 lanes; show total exposure
before launching multiple cells. Shared connections are key-scoped and tab-local; launches acquire
a synchronous lock. See `docs/interface-controls.md` for debounce/cancellation rules.
Snapshots are observer-only hash-chained evidence, never additional model input.
`runner/pointer-observer.mjs` records trusted browser pointer events only; draw
cursor overlays in the operator UI, never the actor page. API monitoring has no
invented cursor. Preserve trailing frames and pointer samples when throttling;
frame sequence IDs are episode-local. `src/live/playback.mjs` maps recorded timing
to explicitly labeled presentation pacing without rewriting original evidence.
Optional observer capture errors must be recorded as evidence gaps without
aborting a text policy or overwriting grades; required pixel captures remain
fatal. See the separate deadlines and no-stale-observation rule in `docs/hosting.md`.
Replay is inert/offline and may use a newer renderer; do not backfill old capture
fidelity. Arena errors, missing receipts or unmatched provenance are inconclusive.
Provider errors are blocked runs, not ordinary task failures or verified passes.
Keep `shared/run-outcome.mjs` consistent across results, comparisons and replays;
preserve diagnostic grades and unknown usage without treating reservations as
invoices. Router 403 recovery is manual model selection, never hidden retries.

- `npm ci && npm run build && npm start`: local application.
- `npm run build:hosted && npm run live`: BYOK live interface on 4340.
- `npm test`: domain, persistence, isolation and evaluator checks.
- `npx playwright install chromium && npm run test:browser`: committed browser reference tests.
- `npm run bench`: bounded local measurements; overwrites the benchmark evidence.
- `node scripts/collect-evidence.mjs`: exports portable reference evidence after browser tests.
- `npm run package`: checks for capability URLs and builds the submission archive.

Keep scripted tests distinct from interactive model trajectories. Never describe the three builder-informed Codex episodes as an independent agent benchmark, RL training result, or population success rate. Preserve the original trajectory evidence when changing fixtures. New task templates need positive and adversarial-negative grader tests, a browser reference trajectory, and an explicit outcome contract. Cosmetic seed changes are not a train/test split.

The source manifest records the final shipped source, not a claim that earlier interactive screenshots used byte-identical CSS. See `docs/verification.md` for the chronology. Do not publish `.runtime`, raw Playwright traces or videos: they include capability URLs. No private assignment PDF belongs in the public package.
