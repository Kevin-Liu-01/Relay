# Relay handoff

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
model hints. Keep exact-ID matching, dated provenance, expiry and server-side rate
binding intact. Shared connections are key-scoped and tab-local; launches acquire
a synchronous lock. See `docs/interface-controls.md` for debounce/cancellation rules.
Snapshots are observer-only hash-chained evidence, never additional model input.
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
