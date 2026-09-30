# Verification and evidence

## Hosted BYOK + Jev adapter — 2026-09-30

The live site is [relay.kevinliu.studio](https://relay.kevinliu.studio). The release
passes **56 backend/harness checks and 26 browser checks**, including two concurrent
hosted requests, fresh session IDs, real Chromium screen frames, no shared history
API, key-free IndexedDB history, reload-forgets-key, mobile layout, replay and audit.
Jev's protocol and topic workflow use a **fake TypeSafe transport**. They are not
live Jev inference; no TypeSafe API key was supplied.

Real hosted Ramp smokes are retained in [the hosted evidence inventory](../evidence/hosted/summary.json),
with full structured downloads including PNGs, exact requests and initial/final state.
The first GPT-4o mini accessibility run **failed** after two calls: it filled the
message composer instead of editing the topic, then claimed finish. The grader
correctly rejected it. It cost $0.00153555 estimated and delivered 12 spectator
frames with a verified capture-time audit. A later GPT-4o mini **actor API** run
passed in two calls, $0.00025260 estimated, with 9 frames and a verified audit.
These are different interface/deployment cells, not a matched model comparison.

A third cloud smoke used GPT-5 nano / page JSON. Its one call returned an incomplete
provider response; the harness executed no action and stopped with
`provider_receipt_invalid`. The final audit is consistent, but task success is
false and billed usage is unknown. The $0.00067425 figure is a retained reservation,
not measured spend. No retry or substitute model was used. This result is preserved
in the same inventory rather than hidden as an infrastructure exception.

The first deployed root page exposed the wrong HTML entry despite HTTP 200.
A real browser check caught it; the hosted build now preserves the private
workspace entry separately and serves the BYOK console as the public index.
The corrected domain was then checked over HTTPS and with real model execution.

No RL training, H100 work, sustained scalability result, or novel benchmark claim
is made. Browser/application isolation is not hostile-code isolation. See
[hosting](hosting.md), [System One](system-one.md), and the limits below.

## Standalone public baseline — 2026-09-30 (earlier checkpoint)

Relay now has a standalone source tree for `Kevin-Liu-01/Relay`, separate from
the memory research repository. The public UI uses unmodified OFL Lato fonts,
Lucide controls, bundled theSVG model marks and synthetic initial avatars. The
private prototype's proprietary icon font, stock portraits and screenshots are
excluded. Historical token-free trajectory JSON is retained without rewriting
its provenance. Public screenshots are freshly captured by reference tests.

The release gate is a production build, **50 backend/harness checks**, **24
browser/presentation checks**, portable evidence export and the credential-shaped
content scan. These are correctness checks, not a new model performance result.
The README and presentation show the public build. Hosting and System-1 serving
are not claimed by this local-first checkpoint.

## Audit trace — 2026-09-29

The current suite passes **50 backend/harness and 24 browser/presentation checks**.
The on-demand audit exposes every recorded event rather than only successful
actions, plus workspace mutations, states, receipts, costs and capture gaps.
New runs preserve exact prepared requests, initial state, timestamps and artifact
bindings; old runs are untouched and explicitly partial. Tests detect tampering,
missing files and malformed/truncated chains; exercise secret-blocked exports;
and verify filters, downloads, deep links, keyboard dismissal and mobile layout.
See [audit contract](audit-trace.md). This update made no live inference calls.
The earlier test counts and model evidence below remain historical records.

## Minimal live monitor — 2026-09-29

The current suite passes **46 backend/harness and 24 browser/presentation checks**.
The updated browser cases exercise the Slack-first layout, one-click model launch
(fake transport explicitly labeled), modal keyboard dismissal, replay, final-state
images, mobile fit, and an API spectator that follows the same session without
changing its revision or adding images to model input. The screen is a read-only
operator capture, not a second writable workspace. It updates at action boundaries,
not as continuous video. No decorative motion was added; button press feedback
disables its transform for reduced motion.

The first authenticated [Router smoke](../evidence/lab/live-smoke/run.json) used
GPT-4o mini, accessibility, channel-topic seed 42, no guide and recent-4 history.
It passed in **4 actions / 4 requests**, reporting **34,397 input + 34 output tokens**
and **$0.00517995 estimated** at the recorded base rates. This is one development
episode, not a reliability claim.

The [first three-model matrix](../evidence/lab/live-comparison-v1/run.json) stopped
after 3/9 cells started: GPT-6 Luna/page-JSON and GPT-4o mini/accessibility passed;
GPT-6 Luna/accessibility returned two concatenated JSON actions four times, then
hit the 64,000 conservative input-unit allowance. Those rejected outputs and the
six unattempted cells are retained. Cost estimate: **$0.01068565**, 12 calls with
reported usage. No action parser was relaxed and no grader changed.

A separate `lab-live-comparison-v2.json` raises the input-unit allowance to
128,000 while lowering its run estimate cap to $0.35. This is a revised configuration,
not a replacement for the failed matrix. All three run caps sum to $0.85; actual
provider billing may differ from local estimates. API monitoring adds browser
overhead recorded under `operatorVisuals`, so CLI API-only timings are not equivalent.

The [revised matrix](../evidence/lab/live-comparison-v2/run.json) stopped after 4/9
cells started. GPT-6 Luna passed page JSON (6 actions) and accessibility (7);
GPT-4o mini finished after 2 actions but failed the state check. Nemotron's page-JSON
cell had one rejected action, then Router returned a non-completed response: no
action was executed from that receipt. The run stopped without retries; five
cells remain unattempted. Its estimate is **$0.01535505**, including an unreconciled
reservation, so actual usage/cost is **unknown**, not zero. No further model calls
were made after that stop. Across these three runs the local accounting totals
**$0.03122065**, not an invoice. No complete three-model leaderboard is claimed.

The API spectator is browser-test verified; these live matrices stopped before
reaching their API cells. Live pixels and API policy performance remain unverified.
The UI screenshot is a scripted reference test capture, not a fabricated live run.
Original run/source hashes remain unchanged; the later minimal loading-state and
deep-link UI changes do not retroactively change earlier receipts.

## Relay Lab expansion — 2026-09-29

The expanded suite passes **46 backend/harness tests and 22 browser/presentation
tests**, including the original workspace checks. New checks cover paired scheduling,
context, Router Responses transport, malformed receipts, missing/zero pricing,
reservations, cancellation, interruption recovery, concurrent starts, network
timeouts, opaque API IDs, viewport clipping, modality boundaries, live console
launch/replay and mobile fit. All six API reference tasks pass on two fixture seeds.

These are **scripts and fake-provider contract tests**, not independent live-model
outcomes. This earlier expansion had no Ramp key or provider spend; subsequent
authenticated runs are recorded above.
The exported [12-cell reference matrix](../evidence/lab/reference-matrix/run.json)
passed 12/12: accessibility, page JSON and API × guide absent/present × full/recent-4
history, channel-topic at seed 42. It contains 77 portable artifacts with per-step
hash chains and operator screenshots. Scripts ignore guide/history, so this proves
the comparison machinery executes, not that those interventions help a model.
See [the lab guide](benchmark-lab.md). The tables below preserve the original
deliverable's evidence chronology.

## Evidence levels—do not conflate them

| Evidence                     | Delivered result                                        | What it establishes                                                                                            |
| ---------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Backend/domain tests         | 24 passing                                              | Transition rules, negative graders, isolation, revisions, persistence                                          |
| Browser reference tests      | 16 passing, 0 retries                                   | Actual UI workflows on two seeds, focus/XSS regression, browser isolation, trainer contract and asset fidelity |
| Presentation browser check   | 1 passing                                               | Nine-slide navigation, local image loading and horizontal fit                                                  |
| Interactive Codex episodes   | 3 completed, each reward 1                              | Builder-informed live use through three interaction approaches                                                 |
| Local performance experiment | 100 sessions, 400 reads, 10 sequential browser contexts | Small-fixture latency and storage measurements                                                                 |
| Container check              | See `evidence/container.json`                           | Clean Linux image build and bounded runtime smoke                                                              |

This is verification of an environment, **not** a statistically powered agent leaderboard or RL learning curve. No model training was performed. No independent model credentials were supplied or required. The implementing Codex agent knew the application design and is not a blind evaluator.

## Interactive agent trajectories

The model selected actions from visible browser observations and used the app UI. The operator created sessions and graded/exported them after completion; it did not apply task mutations through the backend. No prerecorded solver script was executed for these three episodes.

| Task / seed          | Observation and interaction                                                              | Recorded artifacts                                                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Thread reply / 47    | Visible DOM labels; search `in:proj-orbit ORBIT-288`; open Maya's thread; compose/send   | [State + event trajectory](../evidence/agent/thread-reply/trajectory.json), [JSONL](../evidence/agent/thread-reply/events.jsonl), screenshots 01–04 |
| Edit message / 48    | Visible DOM for orientation; ArrowUp, select-all/type, Tab navigation, Enter; reload     | [Trajectory](../evidence/agent/edit-message/trajectory.json), [JSONL](../evidence/agent/edit-message/events.jsonl), screenshots 01–03               |
| Incident triage / 49 | **Screenshot-only after session navigation**; coordinate clicks and hover; no DOM lookup | [Trajectory](../evidence/agent/incident-triage/trajectory.json), [JSONL](../evidence/agent/incident-triage/events.jsonl), screenshots 01–04         |

The incident interaction clicked the visible incidents channel, read both updates, hovered the elevated-latency message, chose ✅, opened its menu and pinned it. The old closed incident remained untouched. The edit used the original message, not an extra message, and the changed text survived reload.

`events.jsonl` contains UI diagnostics plus transaction-bound mutation records with before/after hashes. It is **not** the complete model reasoning/tool transcript: text insertion and every hover are not emitted by the app. The screenshots and this explicit action narrative complement those logs. Interactive episodes have no claimed token cost, inference latency or exact provider-model revision because this runtime did not independently record them. Browser-native scripted traces include richer replay data, but contain capability URLs and are excluded from the shareable package.

Chronology: interactive screenshots were captured before the final cosmetic fixes to italic rendering and per-day channel dividers. The final build subsequently passed the full browser suite. No task semantics changed. The final source manifest attests the shipped source bytes, not byte-identical interactive screenshot provenance.

A subsequent user-requested visual update replaced the fallback typeface/initials/Lucide icons with actual Slack-Lato fonts, Slack v2 glyphs and local sample photos. The added visual-asset browser test verifies loaded font weights, native glyph code points, six decoded portraits and zero third-party requests. There are now **17 browser/presentation tests**. The three original interactive episodes remain unmodified historical evidence; the current UI screenshot is `evidence/visual/slack-assets.png`.

## Scripted browser references

`tests/browser/workflows.spec.mjs` performs all six tasks through UI controls at seeds 42 and 43. It includes search/thread use, keyboard editing, hover/menu triage, quick-switch handoff, delete confirmation and topic editing. Two extra cases verify same-browser-context session isolation and typed-edit focus/inert HTML. `adapter.spec.mjs` verifies screenshot observations, unsupported-action rejection, budget truncation, reset and terminal rewards through the trainer bridge.

The [reference summary](../evidence/reference/summary.json) lists each status and duration. Twelve task-specific exports include final state and successful evaluator checks. Shared-context isolation and adapter tests are tests, not extra solved benchmark tasks.

Re-run `npm run test:browser` to generate `test-results/` traces/videos and `playwright-report/`. View them locally with `npx playwright show-report` or `npx playwright show-trace path/to/trace.zip`. Do not distribute those raw archives without removing live capability URLs. `scripts/collect-evidence.mjs` exports viewport screenshots and token-free state/event data for sharing.

## Backend and negative coverage

- Deterministic fixture equality, seed variation and independent object state.
- Search phrases, filters, exclusions, date and thread behavior.
- Ownership enforcement and cross-channel/thread validation.
- Invalid transitions leave original state unchanged.
- Reaction/pin reversibility.
- Every task: baseline fails; intended outcome passes; collateral mutation fails across four seeds.
- Correct answer in wrong destination and duplicate-answer failures.
- Missing operator authentication, missing actor capability and path-shaped token rejection.
- Independent physical databases; no write leakage between sessions.
- Idempotent retry and conflicting reuse; stale concurrent write rejection.
- Reset restores seed state, preserves audit and fences old revisions.
- Fresh-OS-process committed-state recovery; sibling state unchanged.
- Bad input/origin, inert HTML content and isolated session close.

A UI focus defect was found during implementation: defining message components inside the parent recreated their identity on every keystroke. The rendering structure was corrected and a typed-edit regression test added. This is why filling a field once is insufficient evidence that a human/agent can actually type into it.

Not covered: power failure at every I/O boundary, hostile browser escapes, rich-text parity, full accessibility certification, all international input methods, million-message fixtures, multiuser realtime collisions, cross-host storage or a sustained browser soak. Preserve these limits in the presentation.

## Performance results

Measured locally on Apple M5 Max, 18 logical CPUs, 128 GiB memory, macOS/Darwin arm64, Node 24.13.0, Chromium 153.0.8010.12. [Machine-readable report with raw samples](../evidence/benchmark.json).

| Operation                    |   n |      p50 |      p95 |
| ---------------------------- | --: | -------: | -------: |
| Create session, direct store | 100 |  5.19 ms |  7.50 ms |
| Reset session, direct store  | 100 |  0.37 ms |  0.56 ms |
| Mutate, loopback HTTP        | 100 |  1.35 ms |  2.23 ms |
| Read, HTTP concurrency 16    | 400 |  5.25 ms |  8.37 ms |
| Page ready, fresh context    |  10 | 67.29 ms | 73.15 ms |
| Screenshot, 1440×900         |  10 | 69.49 ms | 84.10 ms |

The read burst was ~2,703 requests/s over ~148 ms. Such a short run is a diagnostic, not a stable throughput SLA. At n=10 the reported p95 is the sample maximum. Browser contexts were sequential, not concurrent. Creation/reset figures exclude HTTP overhead; action/read include it.

The 100 session files occupied 4,915,200 bytes (49,152 each after the benchmark actions). Node RSS started at ~140 MiB, was ~157 MiB after creation and ~230 MiB at the end; it includes the benchmark client and imported browser library, excludes browser subprocess memory, and is not a standalone server memory measurement. The initial measured asset build was 272,653 bytes uncompressed. This benchmark predates the added locally hosted fonts/photos; its asset size and browser latency are historical, not measurements of the updated visual build. These distinctions prevent unjustified “thousands of agents on one machine” claims.

## Container check

The Docker image uses Node 24.13.0, builds the frontend in one stage and runs as the non-root `node` user in a smaller stage without frontend/build dependencies. The base image is digest-pinned. The runtime check creates two sessions, changes one, verifies isolation, restarts the container and verifies the committed state remains. Local host ports are loopback-only. The report records exact image and platform metadata.

This is a local Docker/Colima smoke, not a Kubernetes deployment or hostile-code isolation audit. Compose limits apply to the app only; a browser worker needs its own resource budget. The control listener must never be published to untrusted networks.

## Reproduce and interpret

Use `npm ci`, build, install the locked Playwright browser and run `npm run verify`. Tests use their own ports and data directory. A passing test suite is evidence for the documented cases, not evidence of Slack API conformance. `npm run bench` intentionally updates measured values; retain the prior report if comparing changes. Regenerate the portable evidence and source manifest only after final changes have passed.
