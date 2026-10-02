# Task suite and evaluation contract

Relay has **18 tasks: six original controls and 12 multi-step workflows**. The
new workflows require 3–6 state-changing operations, typically many more browser
actions, plus retrieval and disambiguation. They exercise the supported workspace
surfaces without pretending this is a complete Slack implementation.

## What the new workflows measure

| Task ID                 | Required outcome                                                                                             | Source and interaction coverage                                                    |
| ----------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| `release-sync`          | Edit the existing launch message, update the topic, reply to QA and DM the rollback owner                    | Current handoff + final QA matrix; channels, thread, DM, edit, topic               |
| `incident-closeout`     | Replace a stale pin, acknowledge the incident, post confirmed resolution and update the topic                | Confirmed vs provisional thread values; pins, reaction, thread                     |
| `saved-cleanup`         | Replace two stale saved items with current sources and notify Sam                                            | Later, search, cross-channel retrieval, DM; preserve another person's saved copy   |
| `decision-record`       | Update channel description, pin the decision, save final approval and acknowledge it                         | Final approval vs prototype vote; Details, saved thread reply, pin                 |
| `handoff-repair`        | Correct the existing DM and acknowledge/save its source                                                      | Current vs superseded handoff; DM editing, reaction, Later                         |
| `qa-signoff`            | Post factual sign-off, replace only your reaction and save the QA matrix                                     | Thread + cross-channel facts; preserve Leo's reaction                              |
| `publish-update`        | Publish a two-line bold announcement, pin it and remove only the placeholder draft                           | Multiple source facts, formatting, new-message pinning, deletion                   |
| `oncall-briefing`       | DM the primary, save the current rotation and update incident description                                    | Current vs previous rotation; primary vs backup; people directory, thread, Details |
| `thread-repair`         | Edit the original estimate reply, acknowledge the review and post the corrected value                        | Draft vs reviewed estimate; nested editing and reactions                           |
| `pin-refresh`           | Replace the obsolete plan pin, preserve the handoff pin, save it and update the board topic                  | Pins, Later, exact build/window, preservation constraints                          |
| `design-handoff`        | Acknowledge final approval, DM its recipient, reply to the decision and save it                              | Approval vs prototype; thread replies, reaction target, DM                         |
| `release-retrospective` | Summarize three sources in-thread, pin the request, save evidence, DM Priya and remove your stale saved copy | Handoff + QA + incident resolution; multi-channel synthesis, six mutations         |

Original controls remain `channel-topic`, `thread-reply`, `edit-message`,
`incident-triage`, `delete-draft` and `handoff-dm`. Their `northstar-v1` fixture
and original graders are unchanged. New tasks use `northstar-workflows-v2` and
`workflow-state-v2`. Seed variation changes the build, QA count, latency,
rollback owner/window, approved design and estimate, in addition to project names.
This is **public development variation, not a held-out task split**.

## Why the reward is trustworthy—and its limits

The trusted evaluator constructs expected final state declaratively. It does
**not** replay the reference policy or call the application's mutation engine to
manufacture its expected answer. A separate reference policy derives facts from
workspace messages, allowing the tests to expose disagreements between policy,
transition engine and contract.

- Every requested change must be present; partial completion earns zero.
- Posts must have the exact requested text, actor, conversation and thread.
  Duplicate sends and replacement posts for edit requests fail.
- Pins, saves and reactions must affect the correct record and preserve other
  users' choices. Every other workspace field must remain unchanged.
- Message IDs must be unique. Generated timestamps are checked against the
  deterministic revision-based ID/clock convention; edits require valid timestamps.
- Array ordering does not change the outcome. Valid alternative action orders
  pass; an action fully undone before grading can also pass. This is explicitly
  **final-state evaluation**, not path-level safety evaluation.
- Templates specify exact formatting. Equivalent paraphrases intentionally fail;
  no LLM judge, subjective quality score or inferred partial credit is used.
- Task labels are public metadata. Fixture-derived answers and grader code are
  server-side, excluded from built browser assets and policy observations.

An open-source contract can be memorized. Credible generalization measurements
need separately authored, withheld semantic task families and actor isolation
from repository files. More seeds of these templates do not solve that problem.

## Verification that costs no model credits

```sh
npm run test:workflows   # build, workflow contracts, challenge report, real browser paths
npm run verify          # entire build/backend/browser regression gate
npm run test:report     # backend JUnit evidence
npm run evidence        # portable browser trajectories + source hashes
```

The grader challenge report contains **84 valid outcomes and 2,583 incorrect
states**, spanning all 12 new tasks and seven seeds (`0, 1, 42, 43, 97, 999,
1000000000`). Challenges omit each required operation, target decoys, duplicate
sends, change authors/destinations/parents, corrupt metadata, replace edits,
modify unrelated state and claim success without doing the work. Additional unit
checks cover alternative action orders, array order, malformed workspaces,
membership, reset/reopen isolation and the public/private boundary.

There are **24 new end-to-end browser recipes**: each new task on two seeds, using
pointer-led navigation or the keyboard conversation switcher. They retrieve
visible facts, mutate only through UI controls, reload persisted state and then
grade it. Exports include events, per-mutation UI snapshots and final screenshots.
Three additional workspace regressions exercise focus/Escape, cancellation,
scoped drafts, formatting, duplicate sends and delayed search responses.
These are builder-informed recipes, **not autonomous model trajectories**.

The backend suite also runs all **18 API reference tasks on two seeds**. The new
API reference retrieves actor-visible messages and uses disclosed opaque IDs;
it has no grader access. API retrieval is broader than screen visibility and is
not a computer-use performance measurement. Reference scripts ignore the
history/guide intervention and cannot measure its effectiveness.

For a separately exportable zero-inference run, start `npm start`, then:

```sh
npm run experiment -- plan docs/workflow-reference.json
npm run experiment -- run docs/workflow-reference.json
# Use the returned run ID and a new output directory:
npm run experiment -- export RUN_ID evidence/my-workflow-reference
```

The positive dollar cap satisfies configuration validation; `provider: reference`
makes no provider requests and spends $0. Never relabel it as live inference.

## Cost-effective model evaluation, after the correctness gate

1. Discover currently available models and bind current prices. First run one
   generative model on `decision-record`, seed 42, accessibility, no guide, full
   history. Inspect its full trace—not just the reward—before expanding.
2. If transport, accounting and UI behavior are sound, freeze a small pilot:
   `decision-record`, `release-sync`, `release-retrospective` × seeds 42/43 ×
   two account-available models = 12 episodes for one interface/condition.
   Use the same action/time/token budgets and seeded block order for both models.
   Treat this as a development pilot, not a population ranking.
3. Start with a **$0.50 total run cap** (local runner), not $0.50 per cell.
   No automatic retries, fallback models or budget increases. Expensive calls can
   exhaust the cap before all cells run; retain queued/unattempted cells and do
   not cherry-pick completed pairs. Missing usage remains unknown, not free.
4. Inspect failures by category: retrieval/decoy, wrong target, incomplete work,
   collateral change, malformed action, provider error, or budget/time stop.
   Fix harness defects with a new source version and rerun affected matched cells;
   never silently rewrite old outcomes or relax the grader after seeing a model.
5. Only then compare interfaces or guide/history policies, changing one factor
   at a time on matched task/seed blocks. Report per-task outcomes, attempts,
   failures, unattempted cells, calls, usage, estimated cost and latency together.
   Screenshot runs are a distinct, typically more expensive pilot. API is a
   different information/action condition—not a cheaper equivalent CUA score.

The initial expansion was verified without inference. The later
[October 1 campaign](campaigns/onsite-2026-10-01.md) adds real model attempts,
including decision-record. One API cell passed that task; the UI cells did not.
This is development evidence, not proof that cheap models solve the expanded suite.
See the [complete inventory](../evidence/campaigns/onsite-2026-10-01/README.md).

## Workspace improvements and bounds

Pins is now an actual conversation view; Details exposes members and an editable
channel description; DMs opens a people directory. Saved/search thread results
open the correct parent thread. Search supports personal `is:saved`. Drafts are
conversation/thread-scoped within the current page, not durable across reloads.
Menus support arrows/Home/End/Escape, dialogs contain focus and restore it,
mutations/sends are single-flight, and stale search replies cannot replace newer
results. Keyboard and focus regressions are not a full screen-reader certification.

Live defaults to **40 actions / 180 seconds per model** and **$2 estimated
allowance**, adjustable to $5 and 80 actions. The hosted model-loop limit is
190 seconds; output allowance is 4,096 tokens/request, including reasoning.
Complex workflows can still time out. Compare uses separate requests and full
per-cell budgets; 1v1 gives each lane its own full allowance and shows the total.
Jev's bounded Choice menu cannot compose the new fact-dependent outputs, so these
tasks are disabled for Jev in the UI and rejected server-side before inference.

Not implemented: uploads/files, calls, channel creation, permission management,
real multi-user collaboration or arbitrary Slack API compatibility. The feature
set is intentionally tied to executable tasks and tests; no zero-bug or full-Slack
claim is made.
