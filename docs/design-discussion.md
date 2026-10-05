# Relay: design decisions and tradeoffs

This is the reasoning behind the presentation. It separates the system that exists
today from changes I would test next. A **run** means one model attempting one task.
A **harness** is the code that manages that run.

## Why I built a harness around model APIs

A model API returns a response. It does not, by itself, own a Slack workspace,
click a button, save an edit, or check whether the task succeeded. I needed code
between the model and the application to do those things.

I kept four responsibilities separate:

1. The model chooses the next action from the information it receives.
2. The harness validates that action and executes it.
3. The application applies its own rules and stores any change.
4. The grader checks the final stored data against the task requirements.

This separation lets me change a model without rewriting the application or the
grader. It also lets me test application behavior without a paid model call.
The tradeoff is that the comparison measures models through **my action protocol**.
It does not establish how they perform with each provider's native computer-use
agent or a different harness.

Source: [experiment loop](../runner/experiment.mjs),
[interface adapter](../runner/interfaces.mjs), [task checks](../server/tasks.mjs).

## Why a working Slack-like app, not just a mockup

Consider an editing task. Alex's message says the launch review starts at 14:00.
The agent must change that to 15:00 and keep everything else unchanged.

A screenshot can show an edit dialog, but cannot tell us whether Save changes the
right message. I need a working interface and stored data to test that. Building
all of Slack would add identity, collaboration, and infrastructure that these
tasks do not require. I implemented the workflows and rules needed by the task set.

React renders the UI. A shared transition function validates actions. SQLite
stores each experimental workspace. This is a focused simulation, not a claim of
Slack feature or API compatibility.

The manual `/play` page is different: its data stays in page memory and resets on
refresh. It is useful for trying the UI, but it is not a scored experimental run.

Source: [application architecture](architecture.md),
[shared action rules](../shared/workspace.mjs), [manual sandbox](../src/play/session.mjs).

## How I know whether an action completed the task

The model can type 15:00 into a dialog and then click Cancel. The screen briefly
contained the right text, but the saved message is still wrong. It can also post
the right words as a new message instead of editing the original.

The grader therefore checks the saved result, not the model's completion message.
For the editing task, it checks the exact text in the original message and rejects
unrequested changes elsewhere. All required checks must pass for reward 1.

This gives a reproducible check and needs no judging-model call. It also makes the
task specification important: exact-string checks are appropriate only when the
instruction clearly requires that string. The grader does not measure writing
quality, and it does not penalize a mistaken action that the agent fully undoes.
Those actions remain visible in the trace.

I test the software in three separate ways:

- A scripted browser solution checks that the UI can complete the workflow.
- A known correct result, then deliberately wrong variants, checks the grader.
- Reopening saved runs checks that their recorded grades agree with their data.

These are not three estimates of model performance. They test different parts of
the system. Nor do they prove that someone unfamiliar with the task will interpret
its wording as I intended.

Source: [browser workflows](../tests/browser/workflows.spec.mjs),
[positive and negative checks](../tests/domain.test.mjs),
[long-workflow challenges](../tests/helpers/workflow-cases.mjs).

## What session isolation means here

Suppose two agents start with the same launch-review message. Agent A changes its
copy to 15:00. Agent B must still see 14:00 until it makes its own change. Otherwise,
B can benefit from A's work or be disrupted by it, and neither score describes an
independent attempt.

Each run gets a separate SQLite file, selected by a random session token. It also
gets a fresh browser context, which is an independent browser session. The file
separates stored messages and topics. The context separates browser storage and
open UI state. Resetting only the database would not close an old edit dialog.

A shared database with a session column could also separate runs. It would
require every query and update to select the right session. I chose separate
files because ownership and deletion are easier to inspect at this scale.
The cost is more files and per-request database open/close work. This is a
design choice, not a claim that shared databases cannot isolate sessions.

The harness creates the session from a known task and seed. On normal completion,
it saves evidence, closes the context, and deletes the session. The experiment
runner also closes that run's browser. The hosted path owns a temporary directory
and removes it in its cleanup handler.

Tests create A and B, write to A, and check that B did not change. They also close
A and check that B still works. A separate process test checks that a committed
edit survives reopening the store.

**The boundary is limited.** The actor and control listeners share a Node process.
Runs share host resources. A database file is not a sandbox for malicious code,
and a browser context is not protection from a host failure. The model receives
allowlisted actions, not a shell or the trainer's control credential. If I allowed
arbitrary agent code, I would need a stronger process or container boundary and
separate credentials. That containment has not been established by these tests.

Source: [session store](../server/store.mjs),
[browser lifecycle](../runner/environment.mjs),
[isolation tests](../tests/server.test.mjs),
[process restart test](../tests/restart.test.mjs),
[hosted cleanup](../hosted/service.mjs).

## What determines speed

A run has setup work, repeated decisions, and finalization:

```text
Create workspace
  → [observe → request a model action → execute → record] repeated
  → check the result → save evidence → clean up
```

Reducing reset time helps when starting the next run. Reducing the number of
decisions can remove several model requests and observations within a run. These
are different optimizations. More workers can increase the number of runs
completed in an hour, but do not make one model request faster.

The local component benchmark measured median database reset at 1.50 ms, HTTP
application action at 3.31 ms, and screenshot capture at 84.15 ms. These are
different operations measured separately, not a breakdown of one agent trial.
They exclude model requests. The HTTP action is also not the full browser-action
path, which includes UI interaction and settling.

The benchmark used 100 stored sessions, 400 reads at concurrency 16, and 10
sequential browser contexts on an M5 Max. It did **not** run 100 agents at once.
Do not add the medians, extrapolate browser capacity from the read burst, or treat
shared-host trial time as isolated model latency.

Source: [measurement code](../scripts/benchmark.mjs),
[samples and machine details](../evidence/benchmark-2026-10-01.json).

## Where resources go and what I would optimize

| Area           | Current choice                                    | Benefit                                              | Cost or limit                                                   | Next measurement                              |
| -------------- | ------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------- | --------------------------------------------- |
| Workspace data | One SQLite file per run                           | Clear ownership and simple deletion                  | Files grow with state and events; writes use synchronous SQLite | File growth and write latency on longer tasks |
| Browser        | Fresh browser per experiment run                  | Simple lifecycle with no browser carried across runs | Startup time and browser memory                                 | Full process-tree memory and startup time     |
| Evidence       | Save actions, state, images, timing, and receipts | Explain failures and replay without new inference    | Disk use and recording work                                     | Bytes per run and time spent recording        |
| Concurrency    | Sequential collection                             | Straightforward ordering and accounting              | Cannot use all available parallel capacity                      | Successful runs/hour as concurrency increases |

The small fixture database occupied 48 KiB after one post. That is disk size for
this fixture, not total RAM per agent. The benchmark's Node memory number excludes
browser child processes, so it cannot support a sessions-per-GB claim.

A browser pool could reuse a browser while creating a fresh context per run. It
may reduce startup work, but a browser crash could then affect multiple runs.
I would measure this tradeoff before adopting it. The base environment supports
reusing its browser across resets; the current experiment loop creates and closes
an environment per run instead.

API execution can avoid a browser when observer visuals are disabled. The matched
study enabled visuals, so its costs are not evidence for a browser-free deployment.

## How I would scale while keeping runs separate

I would add a durable queue and a fixed number of workers. Each worker would own
one active run, its browser, and its data. Waiting jobs would not allocate browsers.
The worker would save evidence to durable storage before releasing local resources.

The worker limit controls peak demand. I would select it using measured browser
memory, CPU, storage speed, provider rate limits, and the spending budget. Increasing
workers until the machine is full can slow every run and cause more timeouts.

This is a proposal, not a deployed distributed system. I would first compare 1, 4,
8, and 16 workers with the same workload. I would measure successful runs per hour,
per-run latency, peak process-tree memory, capture failures, and cleanup. I would
then kill one worker and check that other runs remain correct and its incomplete
record is retained.

A queue retry also needs an explicit experiment policy. If a worker dies after
sending a paid request, the provider may have processed it. I would retain unknown
usage and the interrupted attempt rather than silently retrying or replacing it.
The completed comparisons allow no hidden replacement of failed attempts.

## What changed when this became a benchmark

Once the harness could reset, execute, grade, and record a run, I could use it to
compare models. This introduced a new requirement: not only must the software work,
but the tasks and controls must support a meaningful comparison.

The first collection recorded 306 attempts across 17 model routes and 18 tasks,
all using accessibility controls. The second recorded 96 fresh attempts across
four models, six tasks, and four interfaces. These are separate studies.

Review exposed a task-definition defect: one instruction quoted DESIGN without
saying to replace it, while the grader expected Willow. Six completed runs copied
the quoted text. The grader enforced my intended answer, but the wording did not
clearly specify it. A scripted solution had not caught that because it already
knew the intended answer.

The next gate is an independent reader solving each task from only the instruction
and visible workspace, followed by checking that interpretation against the grader.
Any correction needs a new task version. The old results stay intact.

Other failures need different explanations. Sol and Astra entered a correct edit
in the handoff-repair task, then clicked Cancel. Every retrospective attempt hit
a limit. These observations do not establish that either task is impossible.

Source: [failure review and trace references](campaigns/model-breadth-2026-10-03-observations.md).

## What the interface results mean

An API call can set a topic directly. A browser agent must find the topic editor,
enter text, and save it. The final result can be identical even though the
information and actions available to the agent differ.

The API passed 21/24 attempts, accessibility 18/24, Page JSON 16/24, and pixels
3/24 in the matched study. This does not show that the API is better _computer
use_: it bypasses browser interaction. Nineteen pixel attempts were blocked, so
their low pass count also includes service failures and limits, not just incorrect
decisions. Pixel inputs used low detail, and keyboard behavior depended on macOS.

On 17 pairs where both API and accessibility passed, accessibility used a median
within-pair difference of two more actions, 5.462 more seconds, and $0.13008 more
allowance. That is a selected successful subset, not a general speed claim.

There is only one attempt per condition. I can describe these traces, their costs,
and the failures they reveal. I cannot estimate repeat-run reliability or claim a
general ranking of computer-use models.

Source: [paired outcomes, time, and costs](../evidence/campaigns/interface-study-2026-10-05/analysis.md).
