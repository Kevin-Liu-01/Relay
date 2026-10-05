# Relay handoff

## Presentation narrative

Keep the 17-slide deck in this order: my approach and workflows, harness and
interfaces, grading and verification, model comparison and its failure review,
matched-interface study and its interpretation, then scaling and next tests.
Define technical terms once. Use factual headings and one idea per bullet.
Do not restore slogan headings or insert unmatched pilot scores into the main
story. The 306-run controls now belong on the comparison setup slide. Use
`#main-lesson` for the failure review, never a hard-coded slide number.
Slide 1 must introduce Kevin's engineering choices, not restate the known brief.
Speaker transitions and supporting detail live in `docs/presentation-notes.md`.
Preserve the existing grades, records, accounting, and stable result links.

## Viewport layout release

The homepage shell owns `100dvh`; its header and controls do not shrink. The
arena fills the remaining height. Do not restore fixed idle-height caps or
automatic active-page height. Keep captured frames contained, not cropped or
stretched. Desktop evidence panels scroll independently. Phone content scrolls
inside the arena, with a minimum readable frame height. Very short screens may
scroll the page to keep controls reachable. The regression contract is
`tests/browser/viewport-layout.spec.mjs`.

This release was built in `/tmp/relay-viewport-tedJTv` while the study continued
in the root checkout. It can advance `origin/main` without moving root `main`.
Never pull or rebuild the root during collection. After the worker stops, verify
its original archives against the frozen root first. Then fetch and fast-forward
root `main` before integrating final study reports. Preserve the viewport release.

## Completed matched interface study

All **96/96** cells are complete and independently rechecked from their original
archives: **58 passed, 11 incomplete, 27 blocked**, zero unattempted and zero
capture gaps. PID 46950 exited and released its lock. Do not restart or repeat
any cell. Final cell 096 hit the unchanged $1 cell allowance; it did not leave
any unattempted cells. The generic stop message in that phase is not a coverage
claim. Verification passed **7,892 integrity checks and 532 grade checks**.

The final accounting is $20.718042 usage estimates plus $2.043534 unresolved
reservations, totaling **$22.761576 of $25**. All 1,252 requests and 1,233 accepted
receipts remain recorded. Read the generated `evidence/campaigns/interface-study-2026-10-05/analysis.md`
for all paired outcomes, time and costs. Reproduce it with
`node scripts/analyze-interface-study.mjs`. No significance or reliability claim.
The public library contains all 96 attempts, separate from the original 306.

Original source was preserved in `/var/folders/yl/sxf0v4tn14n2pkwqmf_21l540000gn/T/relay-review-validation-0YOtwk`
before root main fast-forwarded to viewport release 4602c7c. The original root
dist remains untouched. Collection verification completed before that source
change; the release source must not be described as trial-generating source.
Final summary SHA-256: `f0d47c998d58a72a401b2b4858dcb74bc0d69c4a46693ad32f94fa8678ebc328`.
Final publication and its software checks are recorded in `docs/verification.md`.

### Historical collection instructions

Read `docs/campaigns/interface-study-2026-10-05.md` and its immutable JSON.
The user approved 96 fresh cells: four image-capable routes, six tasks and four
interfaces, with a separate $25 estimated allowance and no retries. The first
16 cells are verified: 12 passed, four blocked, $1.441392 including unresolved
reservations. Read the pilot review before bulk collection. The worker is
`scripts/run-interface-study.mjs`; never edit its frozen helper, JSON, actor
source or root dist during collection. Inspect `.runtime/interface-study-2026-10-05/worker.lock`
and manifest before any launch. Do not start a second worker or repeat a cell.
The original 306-run comparison is closed and remains untouched.

The new presentation has 17 slides, an all-workflow overview and explicit controls.
Use stable links such as `/presentation#model-comparison`; numeric links still
select their corresponding slide. The separate interface table must say how many
of 96 attempts are recorded. No winner claim from incomplete coverage or a single
attempt per condition. API is tool use. Pixel inputs use low detail on macOS;
keyboard behavior is platform-dependent. Reopen archives with
`scripts/verify-interface-study.mjs` at a stopped boundary before publishing results.
During collection, `--through=16 --publish` rechecks only the sealed admission
prefix. The builder consumes `verified-summary.json`, never the moving summary.
The verified 16-record public snapshot is separate from active collection files.
Do not commit the moving `summary.json` or `manifest.json` until the worker stops.
The active completion heartbeat `finish-relay-coverage-and-publish-every-replay`
owns final verification and publication. It must not restart a stopped worker.
Use `scripts/refresh-source-manifest.mjs` for the release receipt, not the old
evidence collector. The original 306 records and reports remain unchanged.

## Expected-result comparison

Read `docs/expected-results.md`. Runs and replays compare exact required final
values with the selected captured state. `hosted/task-expectations.mjs` owns the
observer-only projection; source and baseline receipts must match. The static
sidecar supports all 306 published trials without rewriting their records.
Never send the projection to the actor or model, treat field matches as a new
grade, or infer state from a missing capture. Task-language caveats remain.

## Public free-tier and navigation release

The user authorized an operator-funded demo: $5/day aggregate, $0.05/run and
three anonymous visitor attempts/day. `docs/free-tier.md` owns the implementation
contract and honest per-network identity limit. `hosted/free-tier.mjs` uses one
atomic durable Redis reservation and fails closed without all server-only secrets.
Never replace it with an in-memory counter, refund unknown usage, or expand the
cheap exact-ID allowlist without review. BYOK is a separate path and never falls
back to the shared credential. Default deployments keep free access disabled
until the operator provisions and verifies its non-evicting quota store.

Homepage navigation now groups public Results & replays and browser-local History.
History contains comparison and replay tabs. Queues/1v1 live with BYOK run controls.
The empty welcome overlay, idle decision panel, timeline and redundant footer are
removed; live/replay evidence behavior and the frozen 306 outcomes are unchanged.

## Results and assignment handoff — 2026-10-03

The collection below is closed. The new `/results` observer page shares slide 9's
table, filters and controller; homepage Results and Replays link to it. Model
names open task-level trace/replay lists. `scripts/lib/report-accounting.mjs`
derives costs from episode-scoped requests and accepted receipts, never run-wide
budgets. The presentation builder checks record hashes and reconciles the derived
report against the frozen summary. CSV/JSON exports separate usage estimates,
unresolved reservations and total allowance; none is an invoice. Read
`docs/trial-review.md`, `docs/onsite-readiness.md` and `docs/presentation-notes.md`.

The new navigation/responsive styling changes the release source fingerprint.
Do not represent this UI release as the source that generated the 306 historical
trials, or rerun the old collection verifier against new actor source. Original
records, archives, summary and completion certificate remain untouched. The
frozen root `dist` is retained; current release builds/tests use an isolated copy.

## Collection complete — 2026-10-03 21:14 UTC

All **306/306 unique cells** are recorded: **152 passed, 61 incomplete, 93 blocked**;
zero unattempted, 4,662 action attempts, 506 rejected steps and zero capture gaps.
PID 33633 exited successfully. Do not launch another collector or repeat a cell.
The final read-only verifier reopened all 277 original archives: 26,403 integrity
checks and 2,007 saved-state grade checks agree. The completion certificate binds
summary `6618f7f2041bf3d9334ba70f47716380b1495a5bf0d51ba68fc6fd144d71211f`.
Shared estimated allowance is $194.10583757 including prior campaigns/reservations,
not an invoice; the original ceiling remains $300. Both task-language caveats below
remain in force. All 306 structured records are exported. The fresh isolated
production build passes 169 backend checks and 90 browser tests, including the
all-306-record replay sweep; original actor source and dist are unchanged.
Use `docs/verification.md` for the release receipt and the public review library
for every trial. Historical stop/resumption instructions below are not authority
to restart a completed campaign. Pause the completion heartbeat after publication.

## Historical resumption — 2026-10-03 20:13 UTC

The user authorized deleting Desktop screen recordings to restore space. Only
13 exact, validated July–August recordings were permanently deleted (16.1546 GB);
all 51 other recordings, screenshots and original research evidence were retained.
Free space recovered to about 28.7 GB. The same frozen worker resumed at untouched
block-213 as PID 33633, starting from 249/306. Check its lock/status before acting;
never start a second collector or repeat a cell. All source, grading, budget and
deadline bindings remain unchanged. The live review release is the verified
249-record snapshot at commit bc34ba7; refresh and reverify it after collection.
The thread heartbeat `finish-relay-coverage-and-publish-every-replay` checks every
five minutes and owns final verification/publication. It must not launch another
collector or bypass a stop. Pause it after verified publication or a stop needing
new user authority. The active worker is the only remaining agent-owned service.

## Historical collection stop — 2026-10-03 19:46 UTC

Disk space fell below the unchanged 10 GB reserve again. PID 44210 exited safely
after block-212. Current coverage is **249/306: 123 passed, 50 incomplete, 76
blocked; 57 unattempted**. All 144 continuation phases are terminal/safe. The next
untouched cell is block-213 (Sol / incident-closeout); the deadline remains
2026-10-04T08:21:43.494Z. Shared recorded allowance is $159.63298283, leaving
$140.36701717. The user was asked to restore another 10–15 GB; do not delete
unrelated files or cycle on transient headroom. Read the latest disk-stop note.

Keep the original `dist` untouched even while paused: all recorded episodes have
the same served-app receipt. `scripts/prepare-review-validation.mjs` creates a
credential-free temporary validation copy with a dependency symlink; run builds
and tests there, then use its `check PATH` mode to prove the original actor source
and `dist` stayed byte-identical. Never copy its generated dist into this checkout
before collection ends. A partial observer release must say 249/306, not complete.

## All-recorded-trial review surface (249-record release)

The user requested trace review and actual-UI replay for every comparison trial.
Read `docs/trial-review.md`. The new static entry is `demo/review.html`, implemented
under `docs/review-app` to leave the collection fingerprint unchanged. It reuses
the frozen Slack replay components. `scripts/export-trial-library.mjs --partial`
exports recorded attempts without claiming completion; its default requires the
matching final verification certificate. `evidence/trial-library/catalog.json`
reports actual export coverage. Do not publish a completed deck until its catalog
matches the completed summary and includes every trial. Raw PNG bytes are omitted
from public structured records; original hashes and archives remain intact.

`scripts/preview-trial-review.mjs` serves a read-only preview on 4352 without
rebuilding `dist`. Check the process ledger before starting another preview.
New tests: `tests/trial-library.test.mjs` and `tests/browser/trial-review.spec.mjs`.
The browser sweep must open every final record, not just selected passes. Current
release receipts are in `docs/verification.md`: 169 backend checks and all 90
production-build browser checks pass, including the all-249-record sweep. Tests
ran in an isolated copy; the original actor source and dist stayed byte-identical.
Never mistake focused-test reports in `artifacts/browser-results.json` for the
full suite. Future collection requires a refreshed export, audit and coverage test.

## Historical resumption — 2026-10-03 17:48 UTC

The user cleared disk space and explicitly requested continuation. Free space
was about 41 GB (decimal). The same frozen worker resumed from untouched
block-127 as PID 44210. Check its current status/lock before acting; do not start
another collector. No limits, source, graders, seeds or prior results changed.
The historical disk-stop checkpoint below is not a claim that it is still stopped.

## Historical disk-space stop

The continuation worker previously stopped between cells after
block-126 at **163/306 attempted: 93 passed, 30 incomplete, 40 blocked; 143
unattempted**. The machine fell below the frozen 10,000,000,000-byte free-disk
reserve. No inference request or in-flight cell was abandoned at this boundary;
all 58 continuation phases are terminal and `safeToContinue: true`, and the
worker lock was released. Read `docs/campaigns/model-breadth-2026-10-03-disk-stop.md`.
After an earlier stop at 162, free space briefly rose above the reserve without
any deletion by this agent. The same frozen worker restarted as PID 98324, ran
only untouched block-126, and stopped again. Both worker PIDs are dead. Do not
keep relaunching on transient disk headroom; restore useful free space first.
The user was asked to free 10–15 GB or identify a disposable folder. Do not delete
unrelated files, lower the reserve, or claim the remaining cells were attempted.
The same frozen worker checks all bindings and prior
phases before sending any request. Do not run `prepare`, repeat a cell or reset
the 24-hour clock. The next untouched phase is block-127 (MiniMax/on-call).
Final verification/publication remains outstanding.

## Current comparison request

The original breadth worker stopped at **105/306** on a known-cost Astra cell
spend limit ($4.16782 accepted; the next reservation could not fit under $5).
It is closed, not resumable. The user reiterated completion of all 306 cells.
The successor is `model-breadth-2026-10-03-continuation`: read its campaign
Markdown/JSON, `scripts/run-breadth-continuation.mjs`, and
`scripts/lib/breadth-continuation.mjs`. It preserves all 105 attempts and runs
only the 201 untouched cells in their original order (block-069 through 269).
The same source, graders, per-cell limits and shared $300 ceiling remain.
Its new scheduler may advance after a verified, known-use cell spend stop;
it never sends another request in that stopped cell. Authentication, bad
receipts/evidence, cleanup, source drift and shared limits still stop it.
The cumulative prior allowance is $35.34935278; no budget reset. The original
24-hour clock and remaining request/archive allowances are retained.

Never edit either frozen worker/helper/JSON, original summaries or actor source
while collecting. The continuation binds the old breadth helper too.
Read live status with `node scripts/run-breadth-continuation.mjs status`.
Do not relaunch it while its lock exists. The active comparison selector now
points at the continuation; original stopped summaries remain historical.
Before declaring completion, run
`node scripts/verify-breadth-completion.mjs model-breadth-2026-10-03-continuation`.
It requires 306 attempted unique cells, reopens every original archive across
all origin campaigns, recomputes the summary/accounting and regrades saved
states. `--partial` never writes a completion certificate. Final slide/report
builders require that certificate to bind the exact completed summary.

Trace review identified a release-sync wording caveat: its trailing engineering
location ambiguously scopes the handoff as well as QA, while the handoff is in
the project channel. Read `docs/campaigns/model-breadth-2026-10-03-observations.md`.
Keep those 17 raw outcomes with the caveat; do not claim they cleanly measure
model capability. Do not fix the frozen task mid-collection or repeat its cells.
Task-language location checks are a future, separately versioned suite gate.
Design-handoff has a second language caveat: its quoted DESIGN placeholder lacks
an explicit substitution instruction. Six completed runs copied it literally while
the grader expects the approved name. The report, slides and trial viewer must
disclose this, preserve the raw failures and avoid capability-ranking claims.

## Original breadth worker (closed)

The user superseded repeats with **multiple flagship/popular-family models, all
tasks, one attempt each**. Current owner: `docs/campaigns/model-breadth-2026-10-03.md`
and its frozen JSON; worker `scripts/run-breadth-campaign.mjs`; helper
`scripts/lib/breadth-campaign.mjs`. Seventeen routes × 18 tasks = 306 cells.
All 37 seed-1042 attempts from the closed Qwen study are preserved, including
four blocks; only 269 missing cells run. No reruns, best-of selection or hidden
replacement. This is a development coverage inventory with explicit preserved/new
cohorts, not a fresh randomized study or a measured popularity ranking.

The new plan binds the unchanged source, task hashes and all $10.42476640 prior
recorded spend/probes; it does not reset the shared $300 ceiling. Twelve new
routes each run the first three specified tasks (36 cells) before a manual
trace-quality gate. Read live `status` and the private manifest before acting.
Once launched, never edit the launcher, its bound helpers, frozen JSON, carried
summary or actor/harness source. Do not rebuild Vite during inference.
`node scripts/stage-presentation.mjs` is safe for presentation-only staging.
Use `scripts/report-breadth-campaign.mjs` for the new report; the old reporter
hardcodes 20 repeats. `docs/current-comparison.json` selects this 306-cell inventory.
Slide 9 displays all 17 model rows, one marker per task, task filters and origin
metadata. No inference key is published. Google requires a separate provider key;
Llama/Mistral are absent from the account catalog; Jev's different action contract
is excluded from the matched comparison.

The 36-cell admission stage finished: 34 passes, one incomplete, one output limit;
all 1,178 archive checks passed with no gaps. Read its `-pilot-review.md` before
bulk operations. The combined checkpoint is 73/306 attempted, 62 passes, six
incomplete and five blocked; $16.78501708 total recorded under the shared ceiling.
Bulk subsequently stopped at 105/306; use the successor above. Only blocks 009
(Astra topic pass) and 019 (Luna thread failure) are public exact-byte archive
examples; all other new originals remain local. Never conflate them with a full
public trajectory release or silently relaunch any completed cell.

## Superseded repeated-trial campaigns

The user clarified **20 trials per task per model**, then approved **all 18 tasks,
five models and a $300 total estimated-spend ceiling**: 1,800 new episodes.
Read `docs/campaigns/all-tasks-2026-10-02.md` and the frozen JSON. It stopped on
its first cell: Gemini 3.8 Flash returned 403; no actions, $0.026841 reservation,
1,799 unattempted. Router documents Gemini as requiring a separate Google key.
Do not resume/edit that frozen plan. The other four requested routes answered
one tiny diagnostic request each; `evidence/campaign-access-2026-10-03.json`
records $0.00026105, not scored trials. The user chose Qwen 3.8 Max; its separate
access probe answered ($0.000284). The now-closed successor is
`docs/campaigns/all-tasks-2026-10-03.md` / JSON, using
`scripts/run-task-campaign-v2.mjs` and `scripts/lib/task-campaign-v2.mjs`.
Both original files remain hash-bound to the stopped attempt; never edit them.
The new ledger includes $1.01542235 in all prior model pilots and access probes;
$298.98457765 was available for the new 1,800 episodes. The 25-trial pilot finished:
21 passed, three incorrect, one output limit, $3.78059050 known usage, no unknown
reservations; 1,214 archive checks verified. Read
`docs/campaigns/all-tasks-2026-10-03-pilot-review.md`. Inspect the actual runtime
manifest/status before doing anything. Bulk admission is trace-based, not a
performance filter. Do not restart an in-flight block or change frozen source.

The task-campaign workers implement sequential, locked, budget-shared
worker with a 25-episode pilot gate, immutable block archives and full planned
denominators. It ultimately stopped at 37/1,800 (28 passes, five incomplete,
four blocked) on a Router 401. Its eight archives pass 2,415 checks; recorded
allowance is $9.40933975 including $0.286934 unresolved reservations. Bulk
archives are local under `.runtime`, not yet published. Never resume this plan.

The previous final cheap-model attempt is closed at 36/60: 20 passed, 11
incomplete, four output limits and one connection failure. All three archives
verify (1,971 checks). Its historical `harness_error` is not rewritten by the
new allowlisted `provider_connection_error` classification. The proposed
remaining-24 continuation was superseded before launch. Preserve all pilot costs
and reservations when binding any successor to the $300 ceiling.

For the onsite deliverable, start with `docs/onsite-readiness.md`, the frozen
`docs/campaigns/onsite-2026-10-01.md` plan and the complete campaign inventory.
That campaign stopped on an incomplete output-limited receipt: 20 attempted,
8 passed, 11 incorrect/step-limited, 1 blocked, 10 unattempted. Never resume it,
relax its grader or present curated replay excerpts as the full matrix.
Original trajectories live in hash-checked compressed bundles; `npm run
inspect:campaign -- workflows` verifies them without a key. `npm run presentation`
builds the 13-slide HTML/PDF from evidence and its editable template; keep headers,
bullets and diagrams, with no marketing claims. MIT covers original code and
documentation, not third-party fonts or brand assets.

The six-model comparison `model-comparison-2026-10-02` is also closed: Nemotron's
first request timed out without usage; 4/120 attempted, 2 passes, 1 incomplete,
1 blocked. Do not resume or disguise the 116 unattempted cells. The new slide
reads its summary, uses raw numeric sorting with unknowns last, and exposes all
planned trials. `/presentation` is canonical; `/presentation.html` redirects.

The strict three-model `model-comparison-2026-10-02-followup` is closed too:
4/60 attempted, 2 passes, 1 incomplete, 1 DeepSeek request timeout; 56 unattempted.
The user explicitly approved the separately frozen
`model-comparison-2026-10-02-reserved` plan: 90-second requests and continue only
past provider-request timeouts with their complete reservations retained. No
retries. Its $2.88 allowance plus the prior $0.10937740 stays within the original
$3 ceiling. `runner/campaign-policy.mjs` owns this CLI-only exception; other
missing receipts/errors still stop. Hosted and console runs reject the overrides.
Never apply that exception retroactively to closed campaigns or public queues.
The reserved-timeout plan is now closed at 7/60: DeepSeek returned an incomplete
output-limit receipt (HTTP 200, 4,096 output tokens), not a TimeoutError. Its
timeout-only exception correctly did not continue. The record retains a
$0.02595030 reservation; do not retroactively reconcile it or relaunch a phase.

The user next approved `model-comparison-2026-10-02-final`: 60 fresh cells,
$2.72 new allowance plus both prior recorded allowances within $3. A validated
output-limit receipt is now accounted but its partial output is never executed.
Only the reviewed CLI plan may continue to the next cell after `output_limit`;
default/hosted behavior still stops. `acceptedOutputLimit` requires known usage
and successful cleanup. Preserve each campaign's original totals and source hash.

Relay is a standalone CUA/RL environment, extracted from `cotcodec/cua-slack` into `Kevin-Liu-01/Relay`. Keep unrelated memory research and private local runs out of this repository. The user-facing name is **Relay** (capital R).

The brand master is `src/assets/relay-mark.svg`; keep favicon, touch icon, README
and presentation synchronized (see `docs/brand.md`). The six fictional portraits
are bundled under `src/assets/portraits/`, mapped by stable user IDs, with prompts
and hashes in `docs/portraits.md`. Never replace them with remote/random image
URLs or alter historical captured evidence to imitate new-renderer fidelity.

Read `README.md`, `docs/architecture.md`, `docs/verification.md`, and `docs/research.md`. The application, trainer and evaluator are deliberately separate interfaces. The browser may never receive control-plane credentials, task answers or evaluator code.

For Relay Lab, read `docs/benchmark-lab.md` and `docs/lab-plan.md`. `npm run lab`
serves the operator-only console on 4330. `runner/` owns interface gateways,
Ramp Responses transport, budget and evidence. Do not substitute another provider
key for Ramp. Live runs require positive pricing and account-discovered model IDs.
Preserve failures and mark missing usage unknown. References are scripts, not model evidence.

For the public release at `relay.kevinliu.studio`, read `docs/hosting.md` and
`docs/system-one.md`. `src/live/` owns the free/BYOK UI; `hosted/` owns
request-isolated execution and NDJSON streaming; `api/relay.mjs` is the Vercel entry.
`/play` (also `play.html`) is the no-key, hands-on sandbox, using the same Slack
React app and `shared/workspace.mjs` transition/search rules. `src/play/session.mjs`
owns only page-memory state. The build emits an actor-visible fictional seed,
never task answers or a grader. Refresh/reset clears it. Do not persist sandbox
state with provider credentials, write it into agent history, or treat it as a
scored benchmark. The agent spectator and recorded replay remain read-only.
Provider keys may persist only in the operator UI's dedicated localStorage record
when “Remember keys on this device” is enabled (default on, as requested by Kevin).
Keep keys out of run history, audit, replay, exports and server persistence. Never
expose the operator key in client code or browser storage. Its deployment is now
explicitly authorized only behind `docs/free-tier.md` limits. Restoring a key may
discover models, never start a run.
History is browser-local, not a shared server database. Jev uses TypeSafe's official
Choice API, not SGLang: text observations, deterministic candidate menu, real returned
probabilities. Fake transport tests are not evidence of live Jev inference.

Read `docs/replay-and-arena.md` for the 1v1 and actual-UI playback contracts.
Read `docs/interface-controls.md` before changing Relay's custom icon menus.
Read `docs/task-suite.md` before adding tasks or changing rewards. The six original
tasks keep v1 fixtures; the 12 new workflows use separate v2 fixtures/contracts.
Never derive grader expectations by replaying the reference policy or transitions.
`npm run test:workflows` verifies deep UI paths; `npm run test:graders` exports the
zero-inference adversarial report. New templates are development tasks, not holdouts.
Keep `RelaySelect` shared and its dialog, keyboard and reduced-motion checks intact.
Hosted pricing comes from `hosted/pricing.mjs`, not user confirmation or frontend
model hints. Prefer validated Router v1 catalog pricing for its exact request ID;
use exact-ID public-doc rates only for older catalogs without metadata. Explicitly
invalid/incompatible metadata cannot fall back to guessed display labels. Keep
source/date/hash, bounded fallback expiry and server-side rate binding intact.
`src/live/run-plan.mjs` gives queued models and matched interfaces separate hosted
requests and full per-cell budgets. Queue up to eight models; one runs at a time.
Stop cancels remaining jobs; unknown usage, interrupted evidence or failed history
save halts the queue. Do not resume on reload or retry inference automatically.
Replace the host viewer stage on every launch/episode handoff, not only its image
child. Late history/replay loads must not replace a newer run or reopen a closed
dialog. An enabled Run must accept a new launch: duplicate-click protection stays
visibly busy, never an invisible post-completion cooldown. Keep the handoff browser
regressions, including the gated second request and no retained old media.
The default $2 allowance is per model, including both 1v1 lanes; show total exposure
before launching multiple cells. Shared connections are key-scoped and tab-local; launches acquire
a synchronous lock. See `docs/interface-controls.md` for debounce/cancellation rules.
Snapshots are observer-only hash-chained evidence, never additional model input.
`runner/pointer-observer.mjs` records trusted browser pointer events only; draw
cursor overlays in the operator UI, never the actor page. API monitoring has no
invented cursor. Preserve trailing frames and pointer samples when throttling;
frame sequence IDs are episode-local. `src/live/playback.mjs` maps recorded timing
to explicitly labeled presentation pacing without rewriting original evidence.
Optional observer capture errors must be recorded as evidence gaps without
aborting a text policy or overwriting grades; required pixel captures remain
fatal. See the separate deadlines and no-stale-observation rule in `docs/hosting.md`.
Replay is inert/offline and may use a newer renderer; do not backfill old capture
fidelity. Arena errors, missing receipts or unmatched provenance are inconclusive.
Provider errors are blocked runs, not ordinary task failures or verified passes.
Keep `shared/run-outcome.mjs` consistent across results, comparisons and replays;
preserve diagnostic grades and unknown usage without treating reservations as
invoices. Router 403 recovery is manual model selection, never hidden retries.

- `npm ci && npm run build && npm start`: local application.
- `npm run build:hosted && npm run live`: BYOK live interface on 4340.
- `npm test`: domain, persistence, isolation and evaluator checks.
- `npx playwright install chromium && npm run test:browser`: committed browser reference tests.
- `npm run bench`: bounded local measurements; overwrites the benchmark evidence.
- `node scripts/collect-evidence.mjs`: exports portable reference evidence after browser tests.
- `npm run package`: checks for capability URLs and builds the submission archive.
- `npm run inspect:campaign -- seed-42 model-comparison-2026-10-02-reserved`: key-free trajectory integrity check.

Keep scripted tests distinct from interactive model trajectories. Never describe the three builder-informed Codex episodes as an independent agent benchmark, RL training result, or population success rate. Preserve the original trajectory evidence when changing fixtures. New task templates need positive and adversarial-negative grader tests, a browser reference trajectory, and an explicit outcome contract. Cosmetic seed changes are not a train/test split.

The source manifest records the final shipped source, not a claim that earlier interactive screenshots used byte-identical CSS. See `docs/verification.md` for the chronology. Do not publish `.runtime`, raw Playwright traces or videos: they include capability URLs. No private assignment PDF belongs in the public package.
