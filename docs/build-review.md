# Relay build review

## Main lesson

I checked whether the app worked and whether the grading code enforced its rules.
I did not independently check that every task instruction stated those rules clearly.
That was the main mistake in this evaluation.

A scripted solution can pass because its author already knows the intended answer.
It does not prove that another person or an agent can understand the task from its instructions alone.

## What the four unsuccessful tasks showed

Sol and Astra each passed 14 of 18 tasks. They missed the same four tasks.
Across all 17 models, 15 of 18 tasks had at least one pass.
All 306 attempts were recorded. These are different counts and should be labeled separately.

| Task                    | Evidence                                                                                                                                                                                    | What I can conclude                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Design handoff          | Six completed runs copied the quoted word DESIGN. The grader expected Willow, but the instructions did not explicitly require substitution.                                                 | I left a required rule unstated. The score is not a clean measure of model ability.                                                   |
| Release synchronization | The instructions appear to place both sources in engineering. The handoff is in the project channel. Some agents still found it and failed later steps.                                     | I wrote an ambiguous source location. I cannot establish how much it contributed to the failures.                                     |
| Release retrospective   | All 17 attempts reached a limit: six action limits, five output limits, four timeouts, and two spending limits. Grok completed five required changes but missed removing an old saved item. | The workflow is reasonable, but I have not established that the chosen limits give agents enough room. More time is not a proven fix. |
| Handoff repair          | Sol and Astra entered the correct edit, then repeatedly selected Cancel rather than Save changes. Five other models passed.                                                                 | These runs contain an observable execution failure. The task is solvable under the existing settings.                                 |

The UI tests passed these workflows at seeds 42 and 43. Those tests establish
that the intended actions can be performed. They do not establish instruction
clarity or agent success within the campaign's limits at seed 1042.

**Next change:** have a reviewer complete each task using only the instructions
and visible workspace. Compare the result with the expected state before running
models. Check source locations, placeholders, exact text, and preservation rules.
Publish corrected tasks as a new version. Keep all original results unchanged.

Evidence: [task definitions](../server/workflow-tasks.mjs),
[failure analysis](campaigns/model-breadth-2026-10-03-observations.md), and
[complete results](../evidence/campaigns/model-breadth-2026-10-03-continuation/summary.json).

## Other mistakes

### 1. My pilot did not establish limits for the hardest task

- The new-model admission stage used topic editing, thread replies, and message editing.
- Those runs checked transport, accounting, and recording. They did not establish suitable limits for the longest workflow.
- The full comparison allowed 40 actions, 180 seconds, and a $5 estimated allowance per run.
- Every release-retrospective attempt reached a limit. I cannot present its zero passes as proof that models cannot perform the task.
- Next time, include a representative long workflow in the development pilot. Measure its steps, time, output usage, and cost before fixing the evaluation limits.
- Do not raise limits only for failed models or combine replacement runs with the original comparison.

**Status:** unresolved calibration work. The recorded outcomes remain valid descriptions of runs under the stated limits.

Evidence: [admission plan and fixed limits](campaigns/model-breadth-2026-10-03.md#fixed-episode-contract) and
[task outcomes](campaigns/model-breadth-2026-10-03-observations.md#completed-task-slices).

### 2. I allowed recording failures to stop the work being recorded

- An optional screenshot timed out and stopped an accessibility-based agent after two actions.
- The screenshot used the short action deadline. Its exception escaped into the model run.
- A final screenshot failure could also overwrite a valid grade.
- I separated optional observer captures from observations the model requires. Missing recordings are now marked as evidence gaps.
- A failed screenshot still stops a screenshot-based agent because that image is required input.

**Status:** the run-aborting observer failure was fixed and tested. Hosted screenshot capture can still be incomplete. This does not establish reliable screenshot-only agents.

Evidence: [reproduction and regression tests](verification.md#screenshot-failure-isolation-and-compact-sidebar--2026-10-01) and
[current capture boundary](hosting.md#capture-failures).

### 3. I showed infrastructure failures as task failures

- A Router 403 produced “WORKSPACE VERIFIED” and “Task incomplete” even though the agent took no actions.
- That display made a provider access failure look like evidence about model performance.
- The UI now separates blocked runs from completed runs with incorrect results.
- Unknown usage remains unknown. Reserved money is not displayed as a confirmed provider charge.

**Status:** corrected in the result, history, and replay views, including older records. The raw outcomes were not rewritten.

Evidence: [the original error and fix](verification.md#router-rejection-and-result-presentation--2026-09-30).

### 4. I did not handle late UI updates correctly

- A dismissed replay could finish loading and reopen over a running workspace.
- An old image could remain visible beside the next run's loading state.
- An enabled Run button could reject a consecutive launch during an invisible cooldown.
- I added run ownership checks, removed stale views at handoff, and tested consecutive launches with delayed responses.

**Status:** reproduced and fixed with regression tests. These were display and launch-control bugs, not evidence that separate workspace databases shared data.

Evidence: [consecutive-run failures and fixes](verification.md#consecutive-run-handoff-and-readable-outcomes--2026-10-02).

### 5. I did not secure enough storage headroom

- The shared development machine fell below the 10 GB free-space reserve during collection.
- The worker stopped safely between runs, but the campaign needed several resumptions.
- The machine's other files also used space. The evidence does not establish that Relay alone caused the shortage.
- The safety check was correct. The planning mistake was relying on a machine whose free space was not reserved for the job.
- Next time, measure recording size during the pilot and reserve storage for the remaining runs, temporary files, and other machine activity.

**Status:** collection finished with all 306 attempts preserved. Dedicated storage and a sustained resource test remain future work.

Evidence: [storage stops and final completion](campaigns/model-breadth-2026-10-03-disk-stop.md).

## Tradeoffs and unfinished work are not all mistakes

- One run per task was a deliberate scope decision. It gives coverage, not repeatability or a reliable ranking.
- A shared JSON action format makes the harness consistent. It does not isolate model ability from format compatibility.
- MiniMax's draft-deletion run had 40 rejected outputs. It is not evidence that 40 valid UI actions failed.
- Final-state grading allows an incorrect action if the agent fully undoes it. That is a declared scoring rule, not an accidental pass.
- Session data is separated, but the current service is not a sandbox for malicious code.
- Multi-worker capacity and full browser-process memory have not been measured. No reinforcement learning training has been run.

Evidence: [action-format failures](campaigns/model-breadth-2026-10-03-observations.md#action-contract-interpretation),
[grading rules](task-suite.md#outcome-contract-and-its-limits), and
[submission boundaries](onsite-readiness.md).

## What I would do differently

1. Have an independent reviewer solve the tasks from the written instructions.
2. Run a small pilot that includes a long workflow and checks model output compatibility.
3. Test provider rejection, missing usage, recording failure, and consecutive runs before public use.
4. Measure time, actions, cost, and storage before starting the full collection.
5. Keep every result and label its cause. Test corrections under a new version instead of replacing failures.

## Short presentation summary

- My main mistake was validating the software without independently validating every task instruction.
- Two tasks showed why that matters: the grader enforced requirements that the wording did not communicate clearly.
- I also coupled recording to execution, mislabeled provider errors, missed late UI updates, and did not secure enough storage headroom.
- I fixed the confirmed software bugs. Task clarity and long-workflow limit calibration still need separate validation.
- The lesson is to test the evaluation process before using its scores to judge a model.
