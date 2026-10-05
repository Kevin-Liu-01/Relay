# Presentation notes

## How to use this deck

The main story is: I researched how computer-use agents work, mapped that to
Slack workflows, and built a testable environment and harness. Once each run was
independent and inspectable, I used the system for two comparisons. The results
exposed limits in both the task definitions and the interface comparison.

- Use about 18 minutes for the slides, then demonstrate the UI and take questions.
- Explain the editing example once, then refer back to its message, Save button, and stored result.
- Read [Design decisions and tradeoffs](design-discussion.md) before rehearsing. It derives the choices and links to code and tests.
- Main bullets use short, direct technical English. This is inspired by ASD-STE100, not a claim of formal compliance.
- Say what is implemented, what was measured, and what is proposed.
- Diagrams illustrate behavior. They are not screenshots of recorded model executions.
- The generated deck is `docs/presentation.html`, not the raw template.
- Use the slide counter or G to find any slide. N opens the current speaker
  notes, with a manual rehearsal timer and the next slide's title.
- Notes appear on the same screen. They are not a private second-screen view.
- F fits the slide to the window and requests browser fullscreen. Escape exits.
  On narrow screens the deck stays scrollable so text remains readable.
- The keyboard button opens shortcuts, a direct slide link and the PDF download.
- Stable links: `#session-isolation`, `#run-speed`, `#resource-choices`, `#scaling-the-runner`, `#model-comparison`, `#main-lesson`, `#interface-results`.

## Connect the design to what the audience sees

Explain the consequence before naming the mechanism. These points are on the
slides, so they remain understandable without the spoken explanation.

| Design choice                        | Why it matters                                                       | What to point out in a run or replay                                                  |
| ------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Fresh database and browser session   | Earlier edits must not help or disrupt the next model.               | A new attempt starts from the original task data, not the last run's final screen.    |
| Read the page after an action        | The next decision needs the result of the last action.               | After opening the editor, the next observation includes its controls.                 |
| Check saved data                     | Correct text in an unsaved dialog is not a completed edit.           | Compare the stored message with the expected result after Save or Cancel.             |
| Repeat observe, request, and execute | Each decision adds another wait and observation.                     | The workspace pauses while the model responds, then changes when the action executes. |
| Save actions and states              | A reviewer needs to explain a result without buying another attempt. | Scrub a recorded run and inspect the state at the selected step.                      |
| Proposed worker limit                | Starting too many browsers could overload the host.                  | A future waiting state would precede execution, not interrupt an active run.          |

The A/B isolation diagram illustrates the boundary tested by the software. It is
not a recorded multi-agent load test. Both collections were sequential. The disk
stop is an observed constraint; browser exhaustion is a risk to test, not a claimed
cause of those recorded stops.

## 1. My approach

Introduce the design process, not the assignment or just API compatibility.

I first researched how an agent gets information about a page and turns a model
response into an action. I reviewed browser frameworks such as BrowserGym,
Slack mockups, and existing environments including Cua's Slack task, env0, and
Agent-Diff. The [research record](research.md) distinguishes source inspection
from upstream claims. I did not execute those external projects or establish
that Relay outperforms them.

That review helped separate three needs. The app needs working controls and
stored changes. The harness needs to observe the app and execute model actions.
The evaluator needs to check whether those changes satisfy the task.

Use the flow to explain the decisions: research computer use, map Slack workflows,
build the focused environment, then test and record agent runs. Search, threads,
and message editing gave me concrete workflows to build and verify. A static
mockup would not test saved changes; implementing all of Slack would add services
these workflows do not require. The execution loop comes later on slide 4.

The restored visual style uses the older deck's two-color opening, outlined icon
labels, short bullets, and contained diagrams. It does not restore the older
wording, unmatched results, or slide order. Purple identifies the harness, blue
identifies execution, and green identifies checks or saved evidence.

Next: use a specific Slack task to show what this requires.

## 2. The environment

Alex's launch-review message says 14:00. The task requires the same message to say
15:00, with the rest unchanged. Searching, opening an editor, typing, and saving
must all work. A dialog with the right text is not the same as a saved edit.

This explains why I needed more than a static mockup, but not all of Slack.
React renders the interface. SQLite holds each experimental workspace's data.
The manual `/play` sandbox instead uses page memory and is not a graded run.

Next: show how these features support the broader task set.

## 3. All workflows

The suite has six focused tasks and twelve longer workflows. Read one flow from
each column rather than listing every task. A longer task combines existing
features: read several sources, change the right object, and preserve the rest.

The two stars identify task-language caveats, not tasks removed from the results.
Their original outcomes remain recorded.

Next: show how the harness runs any one of these tasks.

## 4. The repeatable harness

Define **run** as one model attempting one task. Define **observation** as the
workspace information supplied at one step.

The model does not directly own the browser. It returns one supported action.
The harness validates and executes that action, then reads the page again.
Playwright performs browser actions; the API path performs application operations.

The loop ends on finish or a limit. The harness records actions, errors, data,
timing, and usage so I can inspect what happened. It does not expose a shell,
the hidden answer, or the trainer credential to the model.

Next: explain the choices for observation and action.

## 5. Agent interfaces

Pixels show a screenshot and require mouse/keyboard actions. Accessibility names
page controls. Page JSON serializes those controls. Neither text-based browser
mode is a direct database dump.

The actor API provides structured application data and operations. It is tool
use, not computer use through the UI. This distinction matters later: setting a
topic directly is different from finding and operating the topic editor.

All models use Relay's shared action protocol, not their native CUA protocol.

Next: check the result independently of whichever route the model used.

## 6. Define success

A completion response is not evidence that the message changed. The grader checks
the stored original message, the exact required text, and unrequested changes.

Reward 1 requires every check. Posting a new message with the right words does
not pass an editing task. Clicking Cancel does not save the typed edit.

This is a final-state check. A mistake that is fully undone may still pass.
Actions remain in the trace, but the current reward does not penalize the path.

Next: explain how I tested this check without trusting a model.

## 7. Verification

The previous slide defines success: change Alex's original message from 14:00
to 15:00 and leave the rest of the workspace unchanged. This slide tests whether
the implementation follows that rule.

- App test: a script makes the edit through the UI, saves it, and checks the
  stored result. This establishes that the app can complete the workflow.
- Grader test: supply the unchanged 14:00 state, then a correct 15:00 edit with
  an extra message. Both must fail. The first checks the required edit; the
  second checks the previous slide's no-extra-changes rule.
- Recording test: open a saved run and grade its final workspace again. The
  recomputed grade must match the recorded grade. This is an offline check,
  not a second model attempt or replaying actions to manufacture a new result.

The long-workflow challenge report contains 84 valid and 2,583 invalid states
across seven seeds. Those are software checks, not thousands of model attempts.
Saved full-suite reports and later targeted release checks are distinguished in
[verification](verification.md).

A script already knows the author's intended answer. It cannot independently
validate the instruction's meaning. Return to this limit on slide 15.

Next: move from one correct run to two independent runs.

## 8. Session isolation

The previous slide checked one run. Now I need to be able to run the task again,
even with the same model. This is a requirement for repeatable execution before
it becomes a requirement for comparing models.

Start with the failure case: if A edits shared data, B may receive an easier task
without doing the work. Separate runs must not affect each other's starting state.
For this task, A changes 14:00 to 15:00. If B inherits that edit, a final-state
check could pass even if B does nothing. That would measure A's work twice.

In a walkthrough, show A's final message, then the new run's starting message.
It starts at 14:00 again. This is task reset and run isolation, not the loss of A's
recording. A's result remains available in history and replay. Do not start a paid
attempt just to demonstrate this when saved initial and final states are available.

Each run owns a database file and a fresh browser context. The database separates
stored data. The context separates browser storage and open UI state. On normal
close, the harness releases the context and deletes the session.

A shared database with session filters is another option. Separate files make
ownership and deletion simpler here, at the cost of more files and open/close work.

The tests write to A and check B, then close A and check B again. This proves the
specified noninterference cases, not a security boundary against arbitrary code.
The actor and control listeners still share a process and host resources.

Next: independent runs are possible, but how long does one run take?

## 9. Run speed

Walk through setup, the repeated loop, then finalization. Each additional
decision adds a model request, observation, action, and recording work.
Opening the editor, entering text, and saving can each require a decision.
This connects the repeatable run from the previous slide to what the viewer
actually waits for during execution.

The shown medians are local component measurements. Reset is 1.50 ms, HTTP action
is 3.31 ms, screenshot is 84.15 ms. They exclude model calls and cannot be added
into a complete run estimate. HTTP action timing is not total UI-action timing.

The measurement used 100 stored sessions but only 10 sequential browser contexts.
Do not call it a 100-agent load test. More concurrent workers would increase
throughput, not make a single provider response faster.

Next: while the model is deciding, the browser is still open. What resources
does that run hold, and what remains after it ends?

## 10. Resource choices

The previous slide explains elapsed time. This slide explains why time also
affects capacity: a browser continues to use memory while it waits for a model
response. Running more tasks together means keeping more browsers open.

The three cards distinguish workspace data, the active browser, and saved
recordings. The browser closes after the run, but its recording stays available.
Active work therefore needs memory, while retained history needs storage.
These are separate limits; a small database file does not establish how many
live browsers fit on one machine.

The SQLite fixture is small: 48 KiB after one post. Browser processes and evidence
are additional costs. The Node memory measurement excludes browser children, so
I cannot derive agents-per-machine from it.

The experiment loop creates and closes a browser per run. That makes lifecycle
ownership simple but pays startup cost. A browser pool could retain a browser
while giving each run a new context; this is a future optimization to measure.

Evidence takes storage and write time, but makes failures reviewable without
another model call. The disk-space incident belongs with the later model results,
after the collection has been introduced, rather than interrupting this explanation.

API mode can omit the browser only when observer visuals are disabled. The later
matched study kept visual recording enabled; it is not a browser-free measurement.

Next: how would I accept more run requests without opening too many browsers?

## 11. Scaling the runner

The previous slide identified the costs. This slide proposes a way to bound
active resource use: queue requests instead of opening a browser for every
visitor immediately. The collections themselves ran sequentially, so this is
not a claim about measured concurrent capacity.

Jobs wait in a queue. A fixed number of workers each own one active run's browser
and data. Waiting work does not allocate browsers. Evidence should become durable
before a worker deletes its local resources.

I would test 1, 4, 8, and 16 workers. Measure successful runs/hour, per-run latency,
full process-tree memory, provider limits, capture failures, and cleanup. Kill one
worker and verify that other runs are correct and its interrupted record survives.

Pooling browsers may save startup work but enlarges the effect of a browser crash.
Processes or containers provide a stronger boundary than browser contexts; this
project has not established hostile-code containment.

Next: show how the repeatable execution system enabled a benchmark.

## 12. The scope expands

The environment and harness came first. Once they could reset, execute, grade,
and record, I could repeat a task without carrying over the previous run's work.

That led to a new question: how do different models perform on the same tasks?
The same harness let me change the model without rebuilding the environment or
changing the success rule. This is where the story moves from building a
repeatable tool to comparing models.

I then expanded the scope into two comparisons. The first asks which tasks each
model completes through accessibility controls. The second changes the interface
for matched model/task pairs. They have separate plans, records, and budgets.

Next: state the first comparison's controls before showing its results.

## 13. Comparison setup

Seventeen routes times eighteen tasks gives 306 attempts. All use accessibility
controls, seed 1042, recent-four history, no site guide, and the same graders.
The limits are 40 actions, 180 seconds, 4,096 output tokens per request, and $5
estimated allowance per run.

This inventory retains 105 earlier runs and adds 201 untouched cells. It is not
a fresh randomized campaign. There are no repeats or replacement failures.
Provider-default reasoning, provider routing, and collection time are not controlled.

Next: inspect the complete table.

## 14. Model comparison

All 306 attempts are recorded: 152 passed, 61 incomplete, and 93 blocked.

- Passed: an eligible run met every final-state check.
- Incomplete: unmet checks after completion or the action limit.
- Blocked: a service error, timeout, output limit, spend stop, or execution interruption.

Diagnostic checks do not turn a blocked attempt into a pass. Sol and Astra each
passed 14/18; across all models, 15/18 tasks passed at least once. That is not a
reliable ranking from one attempt per pair.

Sort the table. Click a model, then select a task to open the trace or replay.
Usage estimates are $189.31101456 and unresolved reservations $3.77939636,
totaling $193.09041092 for the selected 306. These are not invoices.

The resource tradeoff from slide 10 also appeared during collection. The 306-run
collection paused when free disk space fell below its 10 GB storage safeguard.
Existing evidence was preserved. See the [recorded storage stop](campaigns/model-breadth-2026-10-03-disk-stop.md).
This supports budgeting for saved evidence, not a claim that Relay used all the
disk space on a shared machine or that every pause was a model failure.

Next: open the four tasks missed by both models with the highest recorded score.

## 15. Main lesson

Start from the preceding table: Sol and Astra each passed 14 of 18 tasks.
They missed the same four, but the traces do not give one cause for all four.
The highest recorded score is not a measured capability ceiling.

1. **Design handoff:** both finished but sent the literal word DESIGN. The task
   quotes “Implement DESIGN navigation; accessibility approved.” and never
   explicitly says to substitute the approved name, Willow. The second message
   has the same defect. Six completed runs across the collection did this. My
   grader tests checked the answer I intended, not whether an independent reader
   could infer it. This flaw does not explain all 17 outcomes or prove that a
   clearer instruction would pass.
2. **Release synchronization:** the task puts the release handoff and QA matrix
   under one ambiguous location, although they are in different channels. Sol
   found the current facts, updated the topic and sent the QA reply, but left
   other required changes unfinished. Sol reached 40 actions; Astra reached
   its allowance limit after 26. The wording is a validity concern, not an
   isolated explanation of these two outcomes.
3. **Release retrospective:** all 17 runs stopped at a limit. Sol reached 40
   actions; Astra reached its allowance limit after 28. Neither completed all
   required changes. This does not prove impossibility or that a larger limit
   alone would solve the task.
4. **Handoff repair:** both repeatedly filled the correct rollback-owner edit
   and clicked Cancel, not Save changes. The original message stayed unchanged.
   Sol reached 40 actions; Astra reached its allowance limit after 38. Five
   other models passed, so the task was achievable in these conditions.

An allowance stop means the next request's reservation did not fit within the
$5 estimated ceiling. It does not mean the provider billed exactly $5.
Sol has four incomplete outcomes. Astra has one incomplete and three blocked
outcomes. Do not relabel those blocked runs as completed task failures.

Across all models, 15 of 18 tasks passed at least once. Handoff repair accounts
for the difference from the two highest individual scores. The three zero-pass
tasks are design handoff, release synchronization and release retrospective.

Use the [failure review](campaigns/model-breadth-2026-10-03-observations.md) and
the preceding table's task links to inspect each trace. Keep the original grades,
records and limits. Test corrected instructions only under a new task version.

Next: explain what the early development runs taught me before showing the separate interface comparison.

## 16. Matched interface study

This is a learning and design-refinement slide, not another results table.
The early onsite campaign attempted 20 of 30 planned runs. It exercised several
interfaces, but did not give every interface the same task/model combinations.
For example, its only attempted pixel run was Mini on topic update, while the
other interfaces covered more tasks and also used Luna.

Those traces were useful for checking the harness. Mini posted a requested topic
as a message and claimed completion; the state grader rejected it. A pixel run
returned malformed multi-action outputs; the parser rejected them without
changing the workspace. These examples support the existing validation design.
Do not claim that the grader or action validator was added after these runs.

The comparison needed a change: use the same models, tasks, starting data, and
outcome checks for every interface. The later study does that. It also labels API
as tool use, because semantic operations skip browser interaction. This tighter
design still does not isolate visual reasoning or prove a general winner.

Four image-capable routes, six tasks, four interfaces, one attempt each gives 96.
Each model/task block starts from four fresh copies of the same data. Interface
order is randomized within the block.

The plan fixed $25 total, $1 per run, 40 actions, 180 seconds, 90 seconds per
request, 4,096 output tokens, low reasoning, seed 2042, recent-four history, and no
guide. There are no retries. Neither the early development attempts nor the
original 306 trials are reused as its baseline. The full controls remain linked
on the slide. Models are Sol, Sonnet, Qwen, and Grok; tasks are topic update,
thread reply, message edit, incident closeout, saved cleanup, and decision record.

Next: show what happened under that matched design, including every stop.

## 17. Interface results

All 96 attempts are recorded: 58 passed, 11 incomplete, and 27 blocked. Each table
cell contains six tasks. Click its pass count to review them.

Each cell also shows median recorded elapsed time in seconds. “All”
includes all six runs, including blocks and limits. “Passed” includes only
the passed tasks counted at the top of that cell. N/A means no passed tasks,
not an instant completion. These times include model calls and browser work.
The task subsets differ, so do not rank speeds from the passed-only medians.
The next slide reports a paired comparison on tasks both interfaces passed.

API passed 21/24, accessibility 18/24, Page JSON 16/24, and pixels 3/24. Usage
estimates total $20.718042; unresolved reservations are $2.043534; combined
allowance is $22.761576. Missing receipts remain unknown, not free.

Next: the first study tried each condition once. Does the pattern persist when
the same conditions get two fresh attempts?

## 18. Interpreting interface results

The earlier study used one attempt per condition. I followed it with two fresh
attempts per condition for Sol and Sonnet, using thread reply, message editing and
incident closeout. This adds repeat observations while keeping the study small.
The three workflows cover parent selection, editing and multi-step changes.
They are fixed development tasks, not unseen variants.
Introduce the reason before reading another table: an outcome from one attempt
does not tell me whether it will repeat. This follow-up checks that question on
a smaller set, without claiming that two attempts measure general reliability.

All 48 planned attempts are recorded: 35 passed, one incomplete and 12 blocked.
API passed 12/12, accessibility 10/12, Page JSON 9/12, and pixels 4/12.
For API and accessibility, ten pairs both passed and two passed only with API.
On those ten shared passes, API used median within-pair differences of 6.293
fewer seconds, three fewer actions and $0.130080 less allowance.

This supports using the API for these app tasks when direct operations are
available. It does not show better computer use: the API bypasses dialogs,
targeting and text entry. Accessibility had the highest observed browser pass
count, but this small study cannot establish a general ranking.

All-attempt timing includes early stops. Passed-only timing uses different
successful subsets. Neither is a general speed estimate. Pixel input remains
low-detail on macOS. Five pixel attempts timed out, two hit output limits, and
one completed with an incorrect result. Other blocks were three per-cell budget
stops, one Page JSON output limit and one deactivated-key response. The latter
remains in the results after the user restored access; it was not retried.

The total is $8.234304 in accepted estimates plus $0.733406 in reservations,
or $8.967710 of $25. Six requests have no accepted usage receipt. These are
base-rate estimates, not invoices. Keep all outcomes visible.

Click a count, then change model, task, interface or Repeat. Each selection
opens its exact recorded workspace and checks without a model call.
[All six paired comparisons](../evidence/campaigns/interface-repeat-2026-10-05-continuation/analysis.md)
include task-level and model-level breakdowns. The 96-run table and original
306 records remain available and are not pooled with these 48 attempts.

Next: test new task variants and improve the conditions before collecting more.

## 19. The next benchmark version

Have an independent reader solve every task using only the instructions and
visible workspace. Compare their interpretation with the expected result.
Check run limits on short and long tasks, then freeze the conditions.

Add unseen variants and repeated attempts. Keep task ambiguity, incorrect actions,
service failures, and limits separate. New work requires a new study, not changes
to the completed records.

Next: show how reviewers can inspect the existing deliverable.

## 20. Demonstration and discussion

- Use `/play` to search, open a thread, and edit a message yourself.
- In `/results`, select a model and task, then open the trace and replay.
- Use a saved successful run and a failure to show expected versus actual state.
- Open `/demo/review.html?study=interfaces` for the separate matched study.
- Ask about target concurrency, workflow priorities, and whether wrong actions later undone should affect reward.

Relay supports reset, observation, action execution, and a reward. No RL training
has been run. Native Codex, BrowserGym, and OpenEnv compatibility have not been
demonstrated. Use the saved PDF and recordings if the network fails.

## Before presenting

- Rehearse slides 2, 8, 11, and 15 without reading their bullets. Explain the cause, choice, and cost.
- Open the generated deck, PDF, results table, and one replay in advance.
- Keep API keys out of screen sharing.
- Replays need no model calls. A new live run needs a working route and a spending limit.
- Preserve all original outcomes and disclose missing usage.
- Original code is MIT. Third-party fonts and logos retain their restrictions.
