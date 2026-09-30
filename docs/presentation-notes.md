# Presentation notes and discussion guide

Suggested timing: 10 minutes of slides, 3 minutes live demo, then open discussion. Do not read the source survey aloud; lead with the environment and the decision it illustrates.

## Slide-by-slide notes

1. **Outcome first (45 sec).** “Relay is a runnable Slack-like browser environment. The UI is real enough to support search, threads, edits and decisions; every evaluated change lands in isolated persistent state.” Explain the narrow scope and synthetic workspace.
2. **Prior art (90 sec).** Start with the surprising important finding: Cua already has a literal Slack environment. Distinguish it from UI clone repos, env0's much broader API surface and Agent-Diff's evaluation architecture. Say that external implementations were inspected, not benchmarked. The value of this work is its inspectable tradeoff, not novelty.
3. **Architecture (90 sec).** Walk actor → browser → app → private state, then trusted trainer → grader. State that both listeners currently share a process. Say “data isolation and a separate operator interface,” not “secure sandbox.” Explain capability routing and no shared session cookie.
4. **Task design (60 sec).** Choose two examples: correct text in the wrong thread fails; sending a replacement instead of editing fails. Each task is an outcome contract. Exact wording is deliberate so the grader can be deterministic without an LLM judge.
5. **Evidence (75 sec).** Separate 24 domain/backend tests, 16 scripted app/browser checks (plus one presentation check) and 3 interactive model episodes. Avoid “100% agent success” language. The implementing agent already knew the app. Discuss the typed-edit focus bug as a concrete verification finding. Original interactive screenshots predate the font/icon/avatar update.
6. **Visual episode (30 sec).** Show the old incident and the correct one. The agent used screenshots and coordinates; the terminal grade came from state, not a screenshot classifier. Link the event export if asked.
7. **Performance (75 sec).** Reset p50 0.37 ms, screenshot p50 69.49 ms on this machine. Explain direct-store vs HTTP vs browser measurement boundaries. Do not turn the 148 ms read burst into a production throughput promise. Chromium child RSS remains unmeasured.
8. **Tradeoffs (90 sec).** Single-process SQLite is inspectable and cheap for small states; synchronous work and whole-state JSON are limits. Scale by partitioning sessions, isolating control, bounding browser pools and measuring resource usage. Add diverse held-out templates before claiming evaluation generalization.
9. **Transition to demo (30 sec).** Invite discussion on fidelity, modality, recovery and isolation. A good answer may depend on whether the target policy is screenshot-only, DOM-enabled or full-computer-access.

## Live demo rehearsal

1. Before the call, use Node 24.13, `npm ci`, `npm run build`, install Chromium, and run `npm run verify`. Start the app separately.
2. Create two `thread-reply` sessions with seed 47. Keep each printed URL in its own tab. Never screen-share the operator key.
3. In the first, search `in:proj-orbit ORBIT-288`. Open Maya's thread. Reply `QA checklist complete. Ready for review.`
4. Grade the first: reward 1. Reload the second: no new reply. Grade it: reward 0.
5. Export the first to a fresh artifact directory. Reset it, reload, then grade: reward 0. Explain why a fresh browser context is preferable in automated runs.
6. If time permits: ArrowUp in the empty channel composer edits the latest own message; show that the independent customer-preview message remains unchanged.

If a live demo stalls, show the recorded screenshot sequence and state export. Do not pretend it is live. Do not reset all sessions globally to recover one demo.

## Questions to prepare for

**Why not use an existing Slack clone?** Many solve production chat, not reset and reward. Cua/env0 are closer and worth evaluating if requirements expand. Here a small original state model makes every contract easy to inspect and keeps setup local.

**Is this genuinely RL-ready?** It provides reset, observation, bounded action steps, terminal reward, truncation, exports and cleanup. It does not ship an optimizer, training run, held-out benchmark or OpenEnv/BrowserGym compatibility claim. A trainer supplies the policy and outer budgets.

**Can the agent cheat?** A screenshot policy cannot call the evaluator through the provided action bridge. An agent with shell access to this repository can read the grader and key; production evaluation must hide them behind OS/network isolation. Frontend API access must be governed by the intended modality.

**How do you know the grader is right?** Positive and adversarial negative states across multiple seeds; UI reference episodes; complete expected-state comparisons. That is evidence, not proof for arbitrary future task families. Add independently authored graders and mutation tests as the suite grows.

**Why exact text?** It removes semantic-judge uncertainty for selected procedural tasks. For natural-language synthesis tasks, define a richer semantic contract and validate its false-positive/false-negative behavior separately.

**Does reset exactly reproduce an episode?** Fresh sessions reproduce fixture state and action-derived timestamps. Reset-in-place intentionally increases revisions to reject stale requests. Browser state also needs a fresh context. Model stochasticity is independent.

**What does isolation mean here?** Private data files and browser contexts, tested across sessions. Not CPU/memory quotas per tenant, kernel isolation or multi-host guarantees. Docker wraps the app, not each policy.

**How would you support 1,000 agents?** First measure the full browser/model worker footprint, not just SQLite. Use sharded session ownership, immutable shared assets, bounded browser pools, external evidence storage, an isolated control plane and active cleanup. Choose context/process/container/VM tiers from the threat model, then run a soak test.

**How do you prevent benchmark memorization?** Current cosmetic seeds do not. Next split at task-template/semantic-structure level, randomize facts and distractors, hold out compositions, and keep private evaluator data outside the actor filesystem.

**What would you cut under a tighter deadline?** Keep search, threads and edit, one state engine and strong evidence. Cut decorative features before independent grading or lifecycle tests.
