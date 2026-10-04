# Presentation notes

## Format

- Use 13 slides for a 10–12 minute talk, followed by a short demo.
- Use plain technical English. Keep one idea in each bullet.
- Explain the implementation first, then the test design, results, and limitations.
- Keep the HTML and PDF available for the demo.
- Regenerate both with `npm run presentation`. The builder reads verified results.
- Do not describe this work as a new benchmark standard or a reliable model ranking.

## Slide 1 — Relay

- Relay is a Slack-like web app for testing computer-use agents.
- It includes 18 tasks, automatic result checks, and recorded runs.
- All workspace data is synthetic.
- The goal is to find changes that reduce errors, time, and cost.

## Slide 2 — How a run works

- The harness is the code that controls a test run.
- It gives the model an observation and asks for one action.
- It validates the action, executes it, records the result, and takes another observation.
- The run stops when the model finishes or reaches an action, time, or cost limit.
- Separate code checks the final workspace. The model cannot grade its own work.
- React renders the app. SQLite stores the data. Playwright controls the browser.
- UI actions and API actions use the same code to change workspace data.
- The research notes cover Cua Slack, env0, Agent-Diff, and related mockups. I reviewed those projects but did not run comparative tests.

## Slide 3 — Four interfaces

- Screenshot mode gives the model an image. It acts with mouse coordinates and keyboard input.
- Accessibility mode gives the model labeled controls and element references.
- Page JSON mode gives the model a structured description of page controls.
- API mode lets the model read and change workspace data without using the browser.
- Report API results separately. Direct data access is not the same test as browser interaction.
- The model does not receive the expected answer, final check results, or control credentials.
- Documentation and history settings are configurable. Their benefits were not measured here.
- The 306-run comparison uses accessibility mode only.

## Slide 4 — Separate workspaces

- Each run gets a fresh browser context and its own SQLite file.
- Cookies and workspace changes are not shared between runs.
- Version checks reject edits based on an outdated workspace.
- Request IDs prevent a repeated request from writing the same change twice.
- Database transactions prevent partially applied writes.
- The app and grading service share a process. This is data separation, not protection against malicious code.
- An agent with shell access would need separate process and network restrictions.
- Forced termination can prevent cleanup. Multi-host recovery and per-user resource quotas have not been demonstrated.

## Slide 5 — Setup and model settings

- Follow the README to install Node 24 dependencies and Chromium, build the app, and start Relay Live.
- The manual workspace, results, and recorded replays do not need a key.
- New model runs need a Router API key and an available model.
- All 17 models use the same open-source harness and JSON action format.
- This is not a comparison of each provider's native computer-use protocol.
- Each model attempted all 18 public tasks once.
- Each run used seed 1042, accessibility mode, the four most recent history entries, and no guide.
- Limits were 40 actions, 4,096 output tokens per call, 180 seconds, and $5 estimated cost per run.
- The $300 shared budget includes earlier tests.
- The final set includes 105 earlier runs and 201 new runs. No failures were removed or retried.
- Runs were collected at different times. One attempt per public task cannot establish repeatability or a reliable ranking.
- The saved records include the requested model and the model returned by the provider.

## Slide 6 — Tasks and result checks

- The suite contains six simple tasks and 12 tasks with several required changes.
- For the decision-record task, the agent must find an approval, update a description, pin a message, save a reply, and acknowledge the approval.
- The checks verify content, message identity, author, destination, and the number of messages.
- They also check that unrelated workspace data remains unchanged.
- The expected result is declared independently. It is not copied from an agent's proposed solution.
- Wrong facts, wrong threads, duplicate posts, and unrelated changes fail.
- Exact text is required where the task specifies it.
- The checks grade the final state. A wrong action can still pass if the agent fully undoes it.
- A passing result returns reward 1. A failing result returns reward 0.

## Slide 7 — Verification

- The recorded software test reports contain 174 backend tests and 91 browser tests.
- Separate tests check 84 valid results and 2,583 deliberately invalid results for the 12 longer tasks.
- Scripted browser tests show that the UI works. They do not measure model ability.
- The 306 recorded model runs are a separate source of evidence.
- Three older builder-informed Codex tests are also separate. They are not independent evaluations.

## Slide 8 — Earlier interface tests

- 20 runs started: 8 passed, 11 were incomplete, and 1 was blocked.
- 10 planned runs did not start.
- Accessibility passed 2 of 6. Page JSON passed 2 of 7. Screenshot mode passed 0 of 1. API mode passed 4 of 6.
- The task and model sets differ across interfaces. These totals cannot establish which interface is better.
- There were 126 requests.
- Estimated cost plus reservations was $0.14987395. This includes $0.0014902 reserved for missing usage.
- These amounts are not invoices.
- These runs are separate from the 306-run comparison.

## Slide 9 — Model results and costs

- All 306 planned runs are recorded: 152 passed, 61 were incomplete, and 93 were blocked.
- Passed means that the run completed and every required check passed.
- Incomplete means that the run did not satisfy the task, including runs stopped at the action limit.
- Blocked means that a provider, execution, output, time, or cost restriction stopped the run.
- A blocked run is not a completed pass, even if diagnostic final-state checks happen to pass.
- There were 4,662 action attempts and no capture gaps.
- All 277 original archives passed integrity checks. Rechecking 2,007 saved-state checks agreed with the recorded results.
- Click a column heading or a sort button to reorder the table.
- Select a task to compare its 17 runs. Click a model to see all 18 of its tasks.
- Each recorded row links to its trace and replay, including incomplete and blocked runs.
- Open Results from the home page to see the same table outside the presentation.
- One run per task is not a repeatability estimate. The tasks are public and runs were collected at different times.

### Cost definitions

- Usage estimate: reported token usage multiplied by the saved base rates.
- Unresolved: money still reserved for requests without accepted usage information.
- Total allowance: usage estimate plus unresolved reservations.
- These are estimates, not provider invoices. No cache discount is assumed.
- Missing token usage is unknown, not zero.
- The CSV and JSON downloads contain costs, tokens, rates, time, and actions for every run.

### Exact cost totals

- Selected 306 runs: $189.31101456 usage estimate.
- Missing usage: $3.77939636 reserved across 35 requests.
- Selected total allowance: $193.09041092.
- There were 4,747 requests with 4,712 accepted usage receipts.
- Accepted receipts contain 74,861,087 input tokens and 1,400,260 output tokens.
- The shared ledger totals $194.10583757, including $1.01542665 from earlier tests outside the 306 runs.
- The remaining allowance is $105.89416243 under the $300 cap.
- The earlier 36-run pilot stays separate. It had 20 passes and used different limits and models.

## Slide 10 — Why failures need inspection

- Thread repair passed 13 of 17 runs. It requires finding a reviewed estimate, editing an existing reply, adding a reaction, and posting a confirmation.
- Direct-message handoff passed 16 of 17 runs.
- Saved-item cleanup passed 4 of 17 runs. One additional run had correct diagnostic state checks but stopped at an output limit, so it remains blocked.
- Design handoff passed 0 of 17 runs. Six completed runs copied the quoted word DESIGN.
- The checks expected the retrieved name Willow at this seed. The task did not clearly instruct the model to substitute that name.
- Release sync passed 0 of 17 runs. The task gives an unclear location for a source message.
- GPT-6.1 Sol made some required changes, then repeated edit and cancel actions without completing the original-message edit.
- These two tasks do not provide a clear measure of model ability.
- Preserve all recorded results. Fix and version the instructions before collecting new results.
- Scripted tests can verify that a workflow is possible without proving that its written instructions are clear.
- The exact records are linked in [the failure analysis](campaigns/model-breadth-2026-10-03-observations.md).

## Slide 11 — Local speed

- Median times were 17.34 ms to create a session, 1.50 ms to reset state, and 84.15 ms to take a screenshot.
- The machine was an Apple M5 Max running Node 24.
- The tests used 100 stored sessions, 400 reads with up to 16 at once, and 10 sequential browser contexts.
- Each timing measures only the stated operation. It does not include a model call.
- Concurrent API reads do not demonstrate concurrent agents.
- Full browser-process memory, sustained agent concurrency, and multi-host capacity remain unmeasured.

## Slide 12 — Lessons and next tests

- Valid actions do not guarantee a correct result.
- Test task instructions with people before using them to compare models.
- Keep wrong answers, blocked runs, and missing cost data separate.
- The diagram shows a proposed system, not a measured deployment.
- A queue would send runs to workers with private browser sessions and databases.
- Workers would save run records outside their local storage.
- Test 1, 4, 8, and 16 workers. Measure full process memory, CPU use, action latency, failures, and cleanup.
- Choose process, container, or VM separation based on the agent's permissions.

## Slide 13 — Demo and discussion

- Open /play. Search for `in:design navigation`, open the decision thread, and inspect the approval.
- Explain that this is a manual workspace with synthetic data.
- Open the recorded runs. Show Claude Fable's saved-cleanup pass in 15 actions.
- Then show Grok's release-retrospective run and the stale saved item it did not remove.
- Open the trace, workspace changes, and result checks.
- These are demo examples. The table still includes every recorded result.
- Replays use saved UI states and pointer samples. They are not videos.
- Original screenshots remain in the archives. Public records retain their hashes.
- Replay does not call a model or change the saved workspace.
- Ask which workflows, scoring rules, concurrency level, and cost limits matter most.
- Relay implements reset, actions, and rewards. No reinforcement learning training has been run.
- BrowserGym and OpenEnv compatibility have not been demonstrated.
- Remaining work includes successful screenshot-only agents, unseen task variants, training integration, and sustained multi-worker tests.

## Before presenting

- Verify that the site, PDF, results table, and replay links open.
- Keep the PDF and saved evidence available if the live service is unavailable.
- Do not show API keys while sharing the screen.
- A paid live run needs an available model and a provider-side cost limit.
- Original code uses MIT. Third-party fonts and brand assets keep their own restrictions.

## Readability update verification — 2026-10-04

- Rewrote the 13 slides and notes in plain technical English. No model runs were added or changed.
- All 29 targeted comparison, accounting, and replay-library tests passed.
- All five presentation/results browser tests passed with no retries.
- Browser tests checked keyboard controls, sorting, replay links, mobile width, and all 13 printed pages.
- Main narrative bullets contain at most 24 words. Technical settings and full cost totals remain in these notes.
- The saved campaign results, accounting exports, and original actor build remain unchanged.
