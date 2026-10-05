# Expected and actual results

Runs and replays include a collapsible **Expected vs actual** panel below the
workspace. Each row shows the required final value and the recorded value.
Rows cover message text and destinations, channel details, reactions, pins,
saved messages, edits, deletions and the number of new messages.

## Reading the comparison

- In a live run, actual values come from the latest structured capture. They
  can lag the streamed image while the agent acts. The label states this.
- In a replay, actual values follow the selected frame. Required final values
  stay fixed. At the last frame, compare the recorded final workspace.
- **Matches** means that this field meets its expected requirement.
- **Different** means that the captured value differs from the requirement.
- **Unknown** means that the frame has no structured state. An image is not
  enough to determine a value.
- Expand **Target message** to identify the message affected by a requirement.
- The panel hides in workspace focus mode to leave room for the workspace.

Field matches are a visual aid, not a new grade. They do not check every
unrelated field in the workspace. The original saved outcome and the
`no_unrequested_state_changes` check remain authoritative. A blocked run stays
blocked even if its final diagnostic checks pass.

## Source and version binding

`hosted/task-expectations.mjs` projects requirements from the existing task
contracts. Workflow requirements use `workflowContract`. The six legacy task
projections are tested against independent solutions and the original grader.
The projection never executes a reference policy to invent a solution.

Each projection binds the task ID, seed, baseline hash, exact instruction,
backend source hash and grader version. An unknown version has no comparison.
Relay does not apply current answers to an incompatible old recording.

All 306 published trial records have a matching backend receipt. The build
generates `/demo/task-expectations.json` as a separate observer file. Original
compressed records, hashes, results and costs are unchanged. The two documented
task-language issues remain visible for `release-sync` and `design-handoff`.
The panel shows their original grader requirements, not revised instructions.

## Agent boundary

Live execution sends requirements in a separate `expected_result` observer
message. Browser-local history retains that message for later playback,
including records from 1v1 runs. It does not enter the hashed actor trace,
model request, task instruction, Slack application state or replay iframe.

The actor service rejects the observer file path. Its gateways expose the
workspace, not the operator website. Publishing these development answers is
for human review; this public suite is not a secret held-out benchmark.

## Verification

- `tests/task-expectations.test.mjs` checks all 18 tasks at three seeds,
  provenance mismatches, missing captures, exact values and all 306 records.
- `tests/server.test.mjs` checks that the actor cannot request the observer file.
- `tests/browser/hosted.spec.mjs` checks live results, local persistence and
  absence of comparison data from provider requests.
- `tests/browser/trial-review.spec.mjs` checks seeking, zero-action trials,
  wording caveats, incompatible versions, keyboard use and mobile layout.
- `tests/browser/trial-review-sweep.spec.mjs` opens all 306 published replay
  pages and records a coverage report. It does not duplicate those pages into
  another video or DOM trace. These checks make no paid model calls.
