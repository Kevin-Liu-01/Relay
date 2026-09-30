# Relay handoff

Relay is a standalone CUA/RL environment, extracted from `cotcodec/cua-slack` into `Kevin-Liu-01/Relay`. Keep unrelated memory research and private local runs out of this repository. The user-facing name is **Relay** (capital R).

Read `README.md`, `docs/architecture.md`, `docs/verification.md`, and `docs/research.md`. The application, trainer and evaluator are deliberately separate interfaces. The browser may never receive control-plane credentials, task answers or evaluator code.

For Relay Lab, read `docs/benchmark-lab.md` and `docs/lab-plan.md`. `npm run lab`
serves the operator-only console on 4330. `runner/` owns interface gateways,
Ramp Responses transport, budget and evidence. Do not substitute another provider
key for Ramp. Live runs require positive pricing and account-discovered model IDs.
Preserve failures and mark missing usage unknown. References are scripts, not model evidence.

- `npm ci && npm run build && npm start`: local application.
- `npm test`: domain, persistence, isolation and evaluator checks.
- `npx playwright install chromium && npm run test:browser`: committed browser reference tests.
- `npm run bench`: bounded local measurements; overwrites the benchmark evidence.
- `node scripts/collect-evidence.mjs`: exports portable reference evidence after browser tests.
- `npm run package`: checks for capability URLs and builds the submission archive.

Keep scripted tests distinct from interactive model trajectories. Never describe the three builder-informed Codex episodes as an independent agent benchmark, RL training result, or population success rate. Preserve the original trajectory evidence when changing fixtures. New task templates need positive and adversarial-negative grader tests, a browser reference trajectory, and an explicit outcome contract. Cosmetic seed changes are not a train/test split.

The source manifest records the final shipped source, not a claim that earlier interactive screenshots used byte-identical CSS. See `docs/verification.md` for the chronology. Do not publish `.runtime`, raw Playwright traces or videos: they include capability URLs. No private assignment PDF belongs in the public package.
