# Presentation notes

## Story and format

- Use 13 slides for a 10–12 minute talk, then a short demo and discussion.
- Start with the assignment. Explain the environment and repeatable harness before introducing the expanded benchmark scope.
- The turning point is slide 5: the reusable run process made a wider comparison possible.
- End with what trace review revealed about evaluation quality and what a new benchmark version needs.
- Use plain technical English. State one idea at a time. Do not read every source note aloud.
- Diagrams use editable HTML, Camber, Relay colors, and existing SVG assets. They are not screenshots of measured executions.
- Slide 9 remains the sortable results table. Existing result links still work.
- Regenerate HTML and PDF with `npm run presentation`. The builder verifies the recorded results before rendering them.
- No new inference or trials were run for this redesign.

## Slide 1 — The assignment

- The PDF asked for a runnable Slack-like environment, meaningful tasks with different interaction approaches, trajectories, and design tradeoffs.
- I treated that as three deliverables: a working app, recorded verification, and an explanation of isolation, speed, and resources.
- The initial goal was a focused environment, not a full Slack replacement or a leaderboard.
- Transition: which workflows did the app need to support completely?

## Slide 2 — The environment

- Search, threads, and message editing were the core workflows in the brief.
- They create useful dependencies: find the source, read the context, then change the right item.
- Pins, saved items, DMs, and channel settings extend those operations into longer workflows.
- All data is synthetic. Relay does not access a real Slack organization.
- React renders the UI. SQLite stores state. People and browser agents use the same interface.
- UI and API actions share state-transition code, but direct API access is a different test.
- The research notes review Cua Slack, env0, Agent-Diff, and mockups. I reviewed them but did not run comparative tests.
- Transition: how can I verify success without trusting the agent's claim?

## Slide 3 — Define success

- Start with the requested final state, not a preferred sequence of clicks.
- For a topic task, the exact text must appear in channel settings. Posting it as a message does not pass.
- Unrelated state must remain unchanged. Longer tasks also check authorship, ownership, destinations, and required changes.
- The agent receives its task and observations, not the expected answer or control credentials.
- Separate code grades final state. Terminal reward is 1 for a pass and 0 for failure.
- Stopped or blocked runs retain that status even when diagnostic state checks are available.
- A wrong action that the agent fully undoes is not penalized. That is a scoring choice to discuss.
- Transition: make the same test runnable again without mixing state or losing evidence.

## Slide 4 — The repeatable harness

- The harness controls reset, observation, one model action, validation, execution, recording, and final checks.
- Each episode owns a fresh browser context and a separate SQLite file. Cookies and workspace changes are not shared.
- Version checks reject stale edits. Request IDs prevent duplicate writes. Transactions prevent partial writes.
- Playwright executes browser actions. Provider adapters handle model requests without changing workspace rules.
- The recorder saves requests, responses, rejected actions, timing, receipts, and workspace states.
- Replays use saved UI states and pointer samples, not video. They do not call a model or alter the record.
- Original PNGs remain in archives. Public records keep their hashes.
- Actor and control listeners currently share a process. Data isolation is not an OS boundary for hostile code.
- Transition: the repeatable loop became useful beyond the original demonstration.

## Slide 5 — The scope expands

- Once the environment and harness worked, I could swap models while keeping tasks and result checks fixed.
- That made a broader question practical: which tasks could different models complete through the same interface?
- I expanded to 18 tasks and 17 routes, with one recorded attempt per pair.
- This was a benchmark prototype built on the environment, not a benchmark standard established at the start.
- Repeatable execution is necessary for comparison. It does not validate task wording or experimental design.
- Transition: first explain what information and actions each interface gives the model.

## Slide 6 — Agent interfaces

- Pixels provide a screenshot, with mouse-coordinate and keyboard actions.
- Accessibility provides labeled controls and element references.
- Page JSON provides structured page controls. API mode reads and changes workspace data directly.
- Earlier study: 20 attempted, 8 passed, 11 incomplete, 1 blocked, and 10 planned runs not started.
- Passes: accessibility 2/6, page JSON 2/7, pixels 0/1, API 4/6.
- Model and task coverage differ. These fractions cannot establish which interface is better.
- The pixel attempt demonstrates image transport and a failure trace, not successful screenshot-only control.
- Earlier costs: 126 requests, $0.14838375 accepted-usage estimate, $0.00149020 missing-usage reservation, $0.14987395 combined allowance. Not an invoice.
- The 306-run study uses accessibility only. Do not pool the studies.
- Documentation and history settings are configurable, but their benefits were not measured.
- Transition: software verification and model evaluation answer different questions.

## Slide 7 — Verification

- Software counts come from the saved backend and browser reports, not this deck's focused regression tests.
- Scripted browser tests show that workflows are possible. They do not show model ability.
- Longer-task checker tests include 84 valid states and 2,583 invalid states across 12 templates and seven seeds.
- These tests verify grading code against declared expectations.
- Model runs test whether an agent can execute a task with the provided information and actions.
- None alone proves that a new reader interprets the instructions as intended.
- Transition: keep the comparison conditions explicit.

## Slide 8 — Comparison setup

- Seventeen exact routes × 18 tasks × one attempt = 306 attempts.
- The suite has six simple tasks and 12 longer workflows.
- The inventory retains 105 earlier attempts and adds 201 continuation attempts. No recorded failure was replaced.
- Runs share task data, accessibility controls, text-action format, and result checks.
- Limits include 40 actions, 180 seconds, and a $5 estimated allowance per run. The plan also records output and request limits.
- Families include OpenAI, Anthropic, DeepSeek, Qwen, Grok, Kimi, MiniMax, GLM, and Nemotron. Read exact IDs in the table.
- Google required another provider key. This is not all models or a measured popularity ranking.
- Use Node 24 and the README install/build/start steps. New inference needs a Router key and an available route.
- The manual workspace and replays need no key.
- The action format is shared JSON text, not each provider's native computer-use protocol.
- Public tasks, one attempt per pair, and collection at different times prevent stable-ranking or repeatability claims.
- Transition: show every outcome, including incomplete and blocked attempts.

## Slide 9 — Model comparison

- All 306 attempts are recorded: 152 passed, 61 incomplete, 93 blocked, zero unattempted.
- A pass needs a successful terminal run and required state checks. A blocked run may still have diagnostic checks.
- Sort by passes, latency, usage estimate, reservations, or total allowance. Filter by task.
- Click a model to inspect its runs, then open a trace or replay.
- Sol and Astra each passed 14/18. Across models, 15/18 tasks passed at least once.
- Thread repair passed 17/17, DM handoff 16/17, saved-item cleanup 4/17.
- There were 4,747 requests and 4,712 accepted receipts. Thirty-five requests have unresolved usage.
- Accepted receipts: 74,861,087 input tokens and 1,400,260 output tokens.
- Accepted-usage estimate: $189.31101456. Reservations: $3.77939636. Selected allowance: $193.09041092.
- Shared ledger: $194.10583757, including $1.01542665 outside the selected runs. Remaining against $300: $105.89416243.
- These are base-rate estimates without cache discounts, not invoices. Download full precision as CSV or JSON.
- The verifier reopened 277 original archives. All 26,403 integrity checks and 2,007 saved-state grading checks agreed.
- The comparison recorded 4,662 action attempts, 506 rejected steps, and zero capture gaps.
- Results remain bound to their original actor source and frozen summary. This UI revision did not produce them.
- Transition: why did tasks fail?

## Slide 10 — Main lesson

- I tested the UI and grading code, but did not independently validate every task instruction before expanding collection.
- Correct grading code does not guarantee a valid test. Instructions and expected results must agree.
- Design handoff: 0/17. Quoted DESIGN was not explicitly marked for substitution. Six completed runs copied it; checks expected Willow.
- Release sync: 0/17. The wording can place both sources in engineering, although the handoff is in the project channel.
- These are task-definition caveats. Their contribution to each failure was not isolated experimentally.
- Retrospective: 0/17. Six action limits, five output limits, four timeouts, and two spending limits. More time is not a proven fix.
- Handoff repair: 5/17. Sol and Astra entered the correct DM edit, then selected Cancel while Save changes was visible.
- Sol reached 40 actions. Astra stopped after 38 at its allowance. These are observable execution failures, not impossibility.
- Both models missed design handoff, release sync, retrospective, and handoff repair. Only three tasks had no pass across models.
- Preserve all outcomes. Correct instructions in a new task version before collecting new evidence.
- [Failure analysis and trace links](campaigns/model-breadth-2026-10-03-observations.md).
- Transition: measured and proposed scaling also need clear separation.

## Slide 11 — Speed and resources

- Median local times: create 17.34 ms, reset 1.50 ms, screenshot 84.15 ms.
- Apple M5 Max, Node 24. Tests: 100 sessions, 400 reads at concurrency 16, 10 sequential browser contexts.
- These are operation timings, not complete episode latency or simultaneous-agent capacity.
- Full browser-process memory, sustained concurrency, and multi-host capacity are unmeasured.
- Proposed: a queue assigns runs to bounded workers. Each owns a browser and database, and sends recordings to external storage.
- Test memory, CPU, action latency, failure rate, and cleanup at 1, 4, 8, and 16 workers.
- Choose processes, containers, or VMs according to agent permissions. Data isolation alone cannot contain hostile code.
- Transition: validate both tasks and operating conditions before the next comparison.

## Slide 12 — The next benchmark version

- Have an independent solver use only task instructions and visible workspace. Compare their interpretation with expected state.
- Include long workflows when calibrating limits, not only simple provider-admission tasks.
- Freeze wording, seeds, graders, model routes, and limits before collection.
- Use unseen semantic task variants. Repeat matched conditions when measuring reliability or interface differences.
- Separate instruction defects, execution errors, provider errors, and limit stops. Never silently remove failures.
- The reusable environment is delivered. The current comparison is exploratory, not a validated benchmark standard.
- The [engineering review](build-review.md) retains recording, error-labeling, replay-ownership, and storage lessons with evidence. They support the talk rather than define its main story.
- Transition: let the audience inspect the evidence and choose the next test.

## Slide 13 — Demonstration and discussion

- Open /play. Search `in:design navigation`, open the decision thread, and inspect the approval.
- Open /results. Choose a model and task, then show its full record.
- Pass example: Claude Fable's saved-cleanup run in 15 actions.
- Failure example: Grok's retrospective run with the stale saved item left in place.
- Show actions, state changes, and checks. Replay is recorded-state playback, not new inference.
- Discuss workflows, action-level scoring, concurrency, and cost requirements.
- Relay supports reset, observations, actions, terminal reward, and export. No RL training has been run.
- Native Codex, BrowserGym, and OpenEnv compatibility have not been demonstrated.
- Successful screenshot-only control, unseen variants, training integration, and sustained worker tests remain next steps.

## Before presenting

- Open the site, PDF, table, and a replay before the meeting.
- Keep the PDF and saved evidence available if the service is unavailable.
- Do not show API keys while screen-sharing.
- New paid inference needs an available model and provider-side spending limits. Saved examples make the demo predictable.
- Original code is MIT licensed. Third-party fonts and logos retain their restrictions.
