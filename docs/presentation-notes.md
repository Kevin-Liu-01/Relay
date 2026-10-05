# Presentation notes

## Writing rules

- Use direct technical English inspired by ASD-STE100, without claiming formal compliance.
- State what a component does or what the evidence shows.
- Keep one complete sentence per main bullet, with no more than 20 words.
- Use technical terms when they help, and define them before relying on them.
- Do not use slogans, metaphors, em dashes, or asides inside a sentence.
- Put the test conditions before the results, and the interpretation immediately after them.
- Keep important limitations beside the claim they qualify.
- Use diagrams for relationships and tables for results, not as decoration.
- The style constraints must not hide a technical distinction or strengthen a result.

## Narrative

I approached the project by building a harness around model APIs, with separate
action execution and result checks. Once it could run repeatable tests, I used it
for two comparisons. Reviewing those results showed what the environment measures
and what still needs validation.

- Slides 1–3: my approach and the workflows I chose.
- Slides 4–7: execution, interfaces, grading, and verification.
- Slide 8: why the scope expanded from an environment into a benchmark prototype.
- Slides 9–11: model comparison, results, and task-definition findings.
- Slides 12–14: interface comparison, results, and interpretation.
- Slides 15–17: scaling limits, next tests, and discussion.
- Allow 12–15 minutes, then demonstrate the app.
- Keep older pilot counts in reference notes, outside the main narrative.
- Generate HTML and PDF with `npm run presentation`.
- Use stable links such as `#model-comparison`, `#main-lesson`, and `#interface-results`.
- Diagrams explain the implementation. They are not recorded executions.

## Terms

- **Run:** one model attempts one task with fixed starting data and limits.
- **Harness:** code that connects model APIs to the environment and manages a run.
- **Observation:** the workspace information provided to the model at a step.
- **Workspace state:** stored messages, topics, threads, and other application data.
- **Grader:** code that checks the final state against task requirements.
- **Trace:** the saved requests, responses, actions, errors, and checks.
- **Replay:** a display of recorded workspace changes, with no new model calls.
- **Model route:** the model identifier sent to the provider, not pinned model weights.
- **Reservation:** allowance retained for unknown usage, not a confirmed charge.

## Slide 1: My approach

- The audience already knows the problem. Start with my engineering choices, not a recap of the brief.
- I built the harness around model APIs rather than tying it to one model.
- I separated model requests, action execution, and grading so I could check each part independently.
- I researched what information and controls each computer-use interface provides.
- I kept the run process consistent so I could compare task completion across models.
- The broader benchmark came later, once this execution and recording process worked.
- Next: show the concrete workflow that determined what the app needed.

## Slide 2: The environment

- Search, threads, and message editing came from the assignment.
- The example is a complete workflow: find a message, read the thread, and make the correct change.
- React displays the interface, and SQLite stores workspace data.
- Pins, saved items, direct messages, and channel settings support longer tasks.
- People and browser agents use the same app. All people and content are fictional.
- I reviewed Cua Slack, env0, Agent-Diff, and mockups, but did not benchmark against them.
- Next: show how these features support the complete task set.

## Slide 3: All workflows

- The set includes six focused tasks and twelve tasks with several steps.
- Read one flow from each column, not all eighteen.
- These diagrams summarize workflows, not replacement task instructions.
- The starred tasks had wording problems found during result review.
- Keep that detail brief here because slide 11 explains the evidence.
- Next: explain how a model executes one of these tasks.

## Slide 4: The repeatable harness

- A run starts with known data in a separate database and browser session.
- The harness provides an observation, requests one model action, validates it, and executes it.
- The loop continues until the model finishes or a run limit stops it.
- Playwright executes browser actions, and provider adapters send model requests.
- The recorder saves actions, errors, timing, usage receipts, and workspace states.
- Replay displays saved states and cursor positions without new inference.
- Separate data prevents runs from modifying each other's workspace.
- It does not contain malicious code that can access the shared host.
- Next: explain exactly what the model can see and do.

## Slide 5: Agent interfaces

- Pixels provide a screenshot and coordinate-based mouse and keyboard actions.
- Accessibility provides named page controls and element references.
- Page JSON describes page controls as structured data, not the underlying database.
- Actor API access provides workspace data and direct application operations.
- API is tool use, not browser control.
- The interfaces use the same application rules, but expose different information and action sizes.
- All models use Relay's shared action protocol, not provider-native computer-use protocols.
- Next: show how results are checked independently of the model's response.

## Slide 6: Define success

- The grader compares final stored data with the task requirements.
- Posting the requested topic as a message does not satisfy a channel-topic task.
- The example requires both the exact topic and no unrelated changes.
- Longer tasks also check author, destination, and required changes.
- Expected answers and control credentials are not sent to the agent.
- The grader returns reward 1 only when every required check passes.
- A blocked attempt stays blocked even if its diagnostic state checks pass.
- Fully undone mistakes are not penalized by this final-state grader.
- Next: explain how the app, grader, and recording were tested.

## Slide 7: Verification

- Scripted browser tests complete workflows without model inference.
- Constructed valid and invalid states test the grader's implemented rules.
- Saved steps let reviewers inspect the observation, action, and resulting workspace.
- The slide uses saved full-suite reports. Later release checks are in [verification](verification.md).
- These checks establish software behavior, not independent validation of task wording.
- Next: explain why a reusable test system made a broader comparison practical.

## Slide 8: The scope expands

- Once a run could be reset and recorded, changing models no longer required rebuilding the test.
- I expanded the environment exercise into a benchmark prototype.
- The first comparison used 17 models on 18 tasks through accessibility controls.
- The second used four models and six tasks through four interfaces.
- These answer different questions and use separate records and budgets.
- Next: describe the first comparison's controls before showing scores.

## Slide 9: Comparison setup

- Seventeen model routes times eighteen tasks gives 306 attempts.
- Every attempt uses accessibility controls and a single JSON action per request.
- Seed 1042 fixes starting data. Each observation includes the recent four turns and no site guide.
- Limits are 40 actions, 180 seconds, 4,096 output tokens per request, and a $5 estimated allowance.
- The comparison preserves 105 earlier runs and adds 201 untouched cells without retries.
- Provider-default reasoning, backend routing, and collection time were not controlled.
- The routes cover nine provider families. This is not a test of every available model.
- The original 306 records remain fixed. The current observer UI did not generate those records.
- Next: show recorded outcomes, costs, and links to each attempt.

## Slide 10: Model comparison

- All 306 attempts are recorded: 152 passed, 61 incomplete, and 93 blocked.
- Passed means the eligible run met every final-state check.
- Incomplete means unmet checks after completion or the action limit.
- Blocked means a service error, timeout, output limit, spending stop, or other execution interruption.
- Diagnostic checks do not convert a blocked attempt into a pass.
- Sort the table and use its task filter. Click a model to inspect traces and replays.
- Sol and Astra each passed 14/18 tasks. Across all models, 15/18 tasks passed at least once.
- One attempt per model/task pair cannot establish a reliable ranking.
- Usage estimates and unresolved reservations are separate. Neither is an invoice.
- Next: inspect why low scores cannot all be interpreted as model inability.

## Slide 11: Main lesson

- Reviewing failures revealed both task-definition problems and model execution errors.
- Design handoff quoted DESIGN without explicitly requiring substitution.
- Six completed runs copied DESIGN, but the grader expected Willow.
- Release sync's wording could place both sources in engineering, though one was in the project channel.
- I tested grader logic without independently validating each task's interpretation.
- This limits the comparison, but does not prove that clearer wording would fix every failure.
- Retrospective had no passes because all runs hit limits.
- Handoff repair passed five times. Sol and Astra entered a correct edit, then clicked Cancel.
- Preserve all original outcomes. A corrected instruction belongs in a new task version.
- Next: investigate a different question with a separate matched-interface study.

## Slide 12: Matched interface study

- I used four models, six tasks, four interfaces, and one attempt per condition.
- The plan fixed a separate $25 allowance before inference, with no retries.
- Every model/task block starts four fresh workspaces from identical data.
- Interface order is randomized within each block.
- All routes support image input. Low reasoning is requested in every condition.
- Each run allows 40 actions, 180 seconds, 90 seconds per request, and a $1 estimated allowance.
- Seed 2042, recent-four history, no guide, and 4,096 output tokens remain fixed.
- The first sixteen attempts verified transport and trace integrity before the remaining eighty.
- The original 306 runs are not reused as a baseline.
- Next: show the completed matrix before interpreting interface differences.

## Slide 13: Interface results

- All 96 attempts are recorded: 58 passed, 11 incomplete, and 27 blocked.
- Each model/interface cell includes six tasks.
- API passed 21/24, accessibility 18/24, Page JSON 16/24, and pixels 3/24.
- Click a pass count to inspect the six underlying attempts.
- The table keeps incomplete and blocked counts visible.
- Usage estimates total $20.718042, with $2.043534 in unresolved reservations.
- Combined allowance is $22.761576 of $25, not a billing receipt.
- Next: explain what could have caused these differences.

## Slide 14: Interpreting interface results

- API and accessibility both passed seventeen of the twenty-four matched model/task pairs.
- Only API passed four pairs, only accessibility passed one, and neither passed two.
- Five pairs include a blocked attempt, so pass differences do not isolate model ability.
- On seventeen shared passes, accessibility used median within-pair differences of two more actions, 5.462 more seconds, and $0.13008 more allowance.
- This successful subset is not a general speed or cost estimate.
- API exposes broader structured data and larger actions than browser controls.
- Nineteen pixel attempts were blocked: fourteen connection failures, three output limits, and two timeouts.
- All four accessibility blocks hit the $1 run cap.
- Pixel observations were low-detail images, and Chromium ran on macOS.
- macOS keyboard shortcuts differ from common Windows/Linux shortcuts. Element modes also provide direct fill.
- Observer builds shared the host, so elapsed time is not isolated model speed.
- No reliable winner or general CUA ranking follows from one attempt per condition.
- [Paired analysis](../evidence/campaigns/interface-study-2026-10-05/analysis.md) defines every measurement.
- Next: distinguish observed local performance from the untested scaling design.

## Slide 15: Speed and resources

- Local median times were 17.34 ms for creation, 1.50 ms for reset, and 84.15 ms for screenshots.
- These exclude model calls and do not measure end-to-end concurrent agent throughput.
- The current actor and control servers share a process.
- Proposed workers each own a browser and database, then send recordings to external storage.
- Full browser memory, sustained concurrency, and multi-worker cleanup remain unmeasured.
- Test one, four, eight, and sixteen workers before claiming capacity.
- Stronger containment requires separate processes, containers, or virtual machines.
- Next: identify the specific work needed for the next benchmark version.

## Slide 16: The next benchmark version

- Have an independent reader solve tasks from the instructions and visible workspace.
- Compare that interpretation with the expected result before collecting scores.
- Test limits on short and long workflows, then freeze settings for collection.
- Add unseen task variants and repeated attempts to estimate reliability.
- Separate task ambiguity, wrong actions, service errors, and resource limits.
- Change one test condition at a time where possible.
- The [engineering review](build-review.md) covers recording, replay ownership, and storage.
- Next: demonstrate the current deliverable and ask which extensions matter.

## Slide 17: Demonstration and discussion

- Open `/play`, search `in:design navigation`, and inspect the decision thread.
- Open `/results`, select a model/task, then inspect its trace and replay.
- Show Claude Fable's saved-item cleanup pass and Grok's incomplete retrospective.
- The interface study is separately available at `/demo/review.html?study=interfaces`.
- Discuss workflow coverage, undone mistakes, concurrency, and per-run cost.
- Relay can reset, observe, act, and return a reward, but no RL training has been run.
- Native Codex, BrowserGym, and OpenEnv compatibility have not been demonstrated.
- The three screenshot-only passes do not establish reliable pixel control.

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
