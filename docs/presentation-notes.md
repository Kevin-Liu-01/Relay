# Presentation notes

## Writing rules for this deck

- Use STE-inspired technical English. Do not claim formal ASD-STE100 compliance.
- Keep one idea in each main bullet. Use one complete sentence with no more than 20 words.
- Name the person or component that performs the action.
- Use the same term for the same thing. Define technical terms before you depend on them.
- Remove metaphors, vague claims, and asides that interrupt a sentence.
- Keep result limits explicit. Shorter writing must not make a stronger claim.
- Short diagram labels can be phrases. Tables and source notes can carry detail.
- These rules adapt the [official ASD-STE100 guidance](https://www.asd-ste100.org/STE_faq.html). This deck does not audit every word against its dictionary.

## Terms

- **Run:** one model attempts one task with fixed starting data and limits.
- **Harness:** the code that manages a run.
- **Workspace state:** the stored messages, threads, topics, and other app data.
- **Checker:** the code that compares the final state with the task requirements.
- **Trace:** the saved record of requests, responses, actions, and checks.
- **Replay:** a view that displays the recorded workspace changes. It does not call a model.
- **Model route:** the exact model identifier sent to the provider.
- **Reservation:** allowance kept for a request whose usage is unknown. It is not a confirmed charge.

## Talk structure

- Use the 13 slides for a 10–12 minute talk. Then show the app and discuss the design.
- Start with the assignment, then explain the workspace and harness.
- On slide 5, explain why the reusable harness led to a larger comparison.
- Show the results before you explain the task-design lesson.
- End with the next tests and questions for the team.
- Keep slide 9 as the sortable results table. Existing result and replay links must work.
- Generate HTML and PDF with `npm run presentation`. The builder checks the evidence before it inserts results.
- The diagrams explain the design. They are not captured executions.
- This writing revision does not add model runs or change previous results.

## Slide 1 — The assignment

- The brief asked for a runnable Slack-like app that computer-use agents could operate.
- It also asked for meaningful tasks, different interaction methods, and recorded agent runs.
- I split the work into three parts: build the app, verify tasks, and explain the design.
- I started with a small set of complete workflows. I did not plan a full Slack replacement.

## Slide 2 — The environment

- I chose search, threads, and message editing as the core workflows from the brief.
- A longer task can require an agent to find a message, read its thread, and change the correct item.
- Pins, saved items, direct messages, and channel settings support longer tasks.
- React displays the interface. SQLite stores the workspace data.
- People and browser agents use the same interface. API actions use the same state-change rules through a separate interface.
- All workspace data is fictional. Relay does not connect to a real Slack organization.
- I reviewed Cua Slack, env0, Agent-Diff, and UI mockups. I did not run comparisons against them.

## Slide 3 — Define success

- Workspace state is the stored data, such as messages, topics, and saved items.
- The checker compares the final state with the task requirements.
- For a topic task, the requested text must be in the channel topic. A message with that text does not pass.
- Longer tasks also check the author, destination, required changes, and data that must stay unchanged.
- The agent receives task instructions and observations. It does not receive expected answers or control credentials.
- The checker returns a reward of 1 when all required checks pass. Otherwise, it returns 0.
- A blocked run stays blocked, even if its diagnostic state checks pass.
- The checker does not penalize a wrong action that the agent fully undoes. This is a design choice to discuss.

## Slide 4 — The repeatable harness

- The harness is the code that manages each run.
- It starts a fresh browser session and a separate database with known data.
- It observes the workspace, requests one model action, checks that action, and executes it.
- It repeats this loop until the model finishes or the run stops.
- Playwright executes browser actions. Provider adapters send model requests.
- The recorder saves requests, responses, actions, errors, timing, usage receipts, and workspace states.
- A replay displays the saved states and cursor positions. It does not call a model or change the evidence.
- Version checks reject stale edits. Request IDs prevent duplicate writes. Database transactions prevent partial writes.
- Separate databases prevent runs from changing each other's data. They do not contain malicious code that can access the host.
- The actor and control servers currently share a process. Stronger isolation needs separate processes, containers, or virtual machines.

## Slide 5 — The scope expands

- Once the environment and harness worked, I could use the same run process with another model.
- This let me ask which tasks different models could complete through the same interface.
- I expanded the project to 18 tasks and 17 model routes, with one run for each pair.
- The harness became the base for a benchmark prototype.
- This was an expansion of the original assignment, not a claim that I had built a validated benchmark.
- A working harness does not prove that the task instructions are clear.

## Slide 6 — Agent interfaces

- Pixel mode gives the model a screenshot. The model uses mouse coordinates and keyboard actions.
- Accessibility mode gives the model named controls and element references.
- Page JSON gives the model page controls in JSON form.
- API mode lets the model read and change workspace data directly. It is not browser control.
- The earlier study attempted 20 runs: 8 passed, 11 were incomplete, and 1 was blocked.
- Ten planned runs did not start. Tasks and models differed across interfaces, so these results cannot rank the interfaces.
- The one pixel run failed. It verifies image transport and recording, not successful screenshot-only control.
- The larger 306-run comparison uses only accessibility mode. Keep the two studies separate.
- Documentation and history settings are configurable. Their benefits have not been measured.

## Slide 7 — Verification

- Software tests and model runs answer different questions.
- Scripted browser tests confirm that each workflow can work in the app.
- Known valid and invalid states test whether the checker applies its rules correctly.
- Recorded model runs show whether an agent can complete the task under the chosen conditions.
- None of these checks proves that a new reader will interpret the instructions as intended.
- The slide uses saved full-suite reports. Newer release checks are recorded in [the verification log](verification.md).

## Slide 8 — Comparison setup

- I used 17 model routes, 18 tasks, and one run per pair. This gives 306 attempts.
- Six tasks are simple. Twelve tasks require several steps or changes.
- The comparison keeps 105 earlier runs and adds 201 later runs. It does not replace failed runs.
- Models use the same starting data, accessibility controls, action format, and result checks.
- Each run allows 40 actions, 180 seconds, and up to $5 in estimated model allowance.
- The saved plan also fixes the request and output limits.
- The model routes span nine provider families. Exact identifiers appear in the table and run records.
- Google access required another provider key. This comparison does not include every model.
- All models return the same JSON action format. This is not a comparison of their native computer-use protocols.
- One attempt per pair cannot show how often a model will succeed.
- The README has Node 24 setup steps. New model runs need a provider key. The manual workspace and replays do not.

## Slide 9 — Model comparison

- All 306 attempts are recorded: 152 passed, 61 were incomplete, and 93 were blocked.
- No planned attempt is missing. A blocked run cannot become a pass through diagnostic checks alone.
- Sort the table by passes, time, or estimated allowance. Use the task filter to inspect one task.
- Click a model to open its runs. Each run has a trace and replay link.
- Sol and Astra each passed 14 of 18 tasks. Across all models, 15 of 18 tasks passed at least once.
- Thread repair passed 17 of 17 times. Direct-message handoff passed 16 of 17 times. Saved-item cleanup passed 4 of 17 times.
- Costs are estimates from recorded base rates. Unknown usage keeps its reservation. Neither amount is an invoice.
- All records remain tied to the original source and result summary. The current UI did not produce these runs.

## Slide 10 — Main lesson

- I tested the checker, but I did not ask an independent reader to solve every task before the larger comparison.
- The checker can apply its rules correctly while the task instructions remain unclear.
- Design handoff had no passes in 17 attempts. The instructions quoted DESIGN without clearly asking the agent to replace it.
- Six completed runs copied DESIGN. The checker expected the approved name, Willow.
- Release sync also had no passes. Its wording could place both source messages in engineering, but one was in the project channel.
- These instruction problems limit what the scores can tell us. I did not isolate their effect with a controlled comparison.
- Retrospective had no passes because every run reached a limit. More time is not a proven fix.
- Handoff repair passed 5 of 17 times. Sol and Astra entered the correct edit, then clicked Cancel while Save changes was visible.
- Both leading models missed four tasks, but only three tasks had no pass across all models.
- Keep the original outcomes. Correct the instructions in a new task version before collecting new results.
- The [failure review](campaigns/model-breadth-2026-10-03-observations.md) links to the recorded actions.

## Slide 11 — Speed and resources

- I measured local session creation, state reset, and screenshots.
- Median times were 17.34 ms, 1.50 ms, and 84.15 ms, respectively.
- These tests exclude model calls. They do not measure complete run time or the number of agents that can run at once.
- Full browser memory use and sustained concurrency remain unmeasured.
- In the proposed design, a queue assigns each run to a worker with its own browser and database.
- Workers send recordings to external storage.
- Test 1, 4, 8, and 16 workers. Measure memory, CPU, action time, completed runs per minute, errors, and cleanup.
- Choose the isolation boundary based on the code and tools that agents can execute.

## Slide 12 — The next benchmark version

- First, ask someone outside the project to solve each task from its instructions and visible workspace.
- Compare their interpretation with the expected result.
- Set limits with both short and long tasks before the comparison starts.
- Keep instructions, starting data, checkers, model routes, and limits fixed during collection.
- Use new task variants and repeated runs to measure reliability.
- Compare interfaces with the same tasks and models. Change one test condition at a time.
- Report instruction problems, wrong actions, provider errors, and limit stops separately.
- The environment is reusable. The current model comparison is exploratory.
- The [engineering review](build-review.md) covers recording, error labels, replay ownership, and storage. Use it for follow-up questions.

## Slide 13 — Demonstration and discussion

- Open `/play`. Search `in:design navigation`, open the decision thread, and read the approval.
- Open `/results`. Select a model and task, then open its trace and replay.
- Show a pass: Claude Fable's saved-item cleanup run, with 15 actions.
- Show an incomplete task: Grok's retrospective run, which leaves the old saved item in place.
- Show the actions, workspace changes, and result checks.
- Ask which workflows matter, whether undone mistakes should affect the score, and what run capacity and cost the team needs.
- Relay can reset state, provide observations, execute actions, and return a reward. No reinforcement learning training has been run.
- Native Codex, BrowserGym, and OpenEnv compatibility have not been demonstrated.
- Successful screenshot-only control, new task variants, training integration, and sustained worker tests remain future work.

## Reference facts for questions

- Earlier interface passes: accessibility 2/6, page JSON 2/7, pixels 0/1, and API 4/6.
- Earlier costs: 126 requests, $0.14838375 usage estimate, and $0.00149020 unresolved reservations. Combined allowance: $0.14987395.
- Checker tests: 84 valid states and 2,583 invalid states across 12 longer task templates and seven seeds.
- The larger comparison spans OpenAI, Anthropic, DeepSeek, Qwen, Grok, Kimi, MiniMax, GLM, and Nemotron.
- The larger comparison has 4,747 requests and 4,712 accepted receipts. Usage is unresolved for 35 requests.
- Accepted receipts report 74,861,087 input tokens and 1,400,260 output tokens.
- Usage estimate: $189.31101456. Unresolved reservations: $3.77939636. Combined selected allowance: $193.09041092.
- The shared ledger totals $194.10583757, including $1.01542665 outside those runs. The remaining allowance is $105.89416243 against $300.
- These estimates do not apply cache discounts or include hosting charges. Download full precision as CSV or JSON.
- Verification reopened 277 archives. All 26,403 integrity checks and 2,007 saved-state grading checks agreed.
- The comparison recorded 4,662 action attempts, 506 rejected steps, and no capture gaps.
- Original PNGs remain in the archives. Public records retain their hashes.
- Retrospective stops: six action limits, five output limits, four timeouts, and two spending limits.
- For handoff repair, Sol reached 40 actions. Astra stopped after 38 actions at its allowance.
- Timing setup: Apple M5 Max, Node 24, 100 sessions, 400 reads at concurrency 16, and 10 sequential browser sessions.

## Before presenting

- Open the site, PDF, results table, and one replay before the meeting.
- Keep the PDF and saved evidence available if the service fails.
- Do not show API keys while sharing your screen.
- Use recorded examples for a predictable demo. New inference needs a working model route and a spending limit.
- Original code has an MIT license. Third-party fonts and logos keep their own restrictions.
