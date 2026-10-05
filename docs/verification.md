# Verification and evidence

## Slide-one title: 2026-10-05

- Changed the opening title to “How does an Agent use Slack?” as requested.
  The opening body, diagram, remaining slides and results are unchanged.
- Regenerated HTML/PDF. All four presentation browser tests passed in an
  isolated production build, including all 20 print pages and mobile width.
  Inspected the opening screenshot. The frozen actor source and root build
  remain unchanged; no inference or backend changes were needed.

## Repeated interface follow-up: 2026-10-05

- All **48/48** planned attempts are recorded: **35 passed, 1 incomplete, 12
  blocked**, with no retries or replacements. The collector stopped normally
  at 21:28:58Z and released its lock. The two prior stops and all original
  records remain preserved in separate collection directories.
- Archive verification passed **3,755 integrity checks and 218 saved-state
  grade checks**. Zero capture gaps. Summary SHA-256:
  `7b1f321ab357d6c619765d61a57e74496c595987f004bb6f0c9301a9a7a24113`.
- Accounting retains **555 requests, 549 accepted receipts and six unknown
  requests**. Base-rate estimates are **$8.234304**, reservations **$0.733406**,
  total **$8.967710 of $25**. No missing receipt was refunded or inferred.
- Analysis pairs within model/task/repetition, covers all six mode pairs,
  includes every stop and shows all-attempt time plus shared-pass differences.
  API passed 12/12, accessibility 10/12, Page JSON 9/12 and pixels 4/12. This is
  a small fixed-task development study, not an authoritative interface ranking.
- Added the separate 48-record library, a Repeat selector, sortable follow-up
  table, per-task repeat links, accepted/reserved costs and source-bound exports.
  The 20-slide deck retains the approach-first narrative and earlier tables.
  The original 306 and 96 libraries and their summary bindings are unchanged.
- A credential-free isolated production build passed **229 backend tests** and
  **17 browser tests**, with retries disabled. The browser checks cover the
  presentation, results, reviewer behavior and all **450 records** across the
  three distinct libraries. No provider calls were made by software tests.
- Validation workspace:
  `/var/folders/yl/sxf0v4tn14n2pkwqmf_21l540000gn/T/relay-review-validation-s0kEMT`.
  Original actor source and root `dist` match the preserved pre-study receipt.
  Builds ran only in isolated copies. All 20 print pages passed clipping checks;
  the follow-up PDF slide and phone reviewer screenshot were inspected visually.
- `npm run package` screened text and all decompressed public records against
  credential patterns and the existing private Router key without exposing it.
  Raw runtime archives, private state, test videos and credentials are excluded.
- Release `c106c46` reached Vercel Ready and the production domain. All 48 hosted
  gzip records passed exact size/hash and record validation; hosted accounting
  and PDF match local bytes. The 306/96 catalogs retain their original bindings.
  Live browser review confirmed table sorting, Repeat 1/2 selection, playback,
  trace review and per-task links without provider requests. The existing result
  anchors still open the correct tables. See the [production receipt](../evidence/verification/interface-repeat-production.json).

[Analysis](../evidence/campaigns/interface-repeat-2026-10-05-continuation/analysis.md)
· [Archive receipt](../evidence/campaigns/interface-repeat-2026-10-05-continuation/verification-public-48.json)
· [Browser checks and 48/96 coverage](../evidence/verification/interface-repeat-browser.json)
· [306-record regression sweep](../evidence/verification/interface-repeat-historical-sweep.json).

## Research-led presentation opening: 2026-10-05

- Rewrote slide 1 around Kevin's design process: research computer use, map
  Slack workflows, build the environment, then test and record runs. The
  heading is “I started with how agents would use a Slack workspace.” It no
  longer presents API compatibility as the full approach.
- The slide links the existing research record. Speaker notes distinguish
  source review from execution of external projects and make no comparative
  performance claim. The remaining 19 slides and all historical results stay
  unchanged.
- All **four presentation browser tests passed** in an isolated production
  build, including narrative checks, all-slide layout, print bounds, mobile
  width, sorting, and production security policy. Reviewed the final opening
  screenshot. The backend suite was not rerun for this document-only change.
- Regenerated the 20-page HTML/PDF. Initial long copy overflowed print, and an
  early heading wrapped to three lines in the browser. Both were shortened
  without shrinking type or weakening layout checks.
- Refreshed the source receipt and passed the package credential screen.
  Actor source and frozen root `dist` remain byte-identical. No inference,
  campaign changes, or historical data edits were required.

## Design explanations tied to live runs: 2026-10-05

- Revised slides 4–11 to connect each design choice to a failure case or visible
  consequence. The isolation slide now explains why inheriting a completed edit
  would invalidate the next attempt, including when models run sequentially.
  Its diagram shows A at 15:00 and B still at 14:00, with an explicit live-demo
  explanation. This is an illustration, not a concurrent model-run result.
- The other slides connect observation to the next decision, grading to Save
  versus Cancel, model requests to waits between actions, and saved evidence to
  replay without new inference. Resource discussion links the actual collection
  disk stop. Worker queueing remains proposed and capacity remains unmeasured.
- Added a reason/visible-effect rehearsal guide, source-backed discussion, and
  presentation regressions. Retained the 20-slide sequence, style, tables, timing,
  costs, task caveats, and all historical outcomes.
- All **216 backend tests and seven browser tests passed** in isolated production
  builds. Browser checks cover the final deck's content, all 20 slides, print
  bounds, mobile width, sorting, production security policy, and run handoff.
  Reviewed screenshots of all eight edited slides. An initial PDF overflow on
  isolation was fixed by combining two repetitive captions, without shrinking text.
- Regenerated HTML/PDF and the release source manifest. The package credential
  screen passed. Actor source and frozen root `dist` remain byte-identical to
  their pre-edit state. No new model calls, actor edits, or collection changes.

## Compact dropdowns and grading-slide heading: 2026-10-05

- Removed unconditional scroll-arrow space from operator dropdowns. The empty
  model menu now measures 52px on desktop instead of 100px, and 56px on mobile.
  Both 24px arrow slots remain reserved for overflowing menus, so scrolling
  cannot move a row between pointer-down and pointer-up.
- Overflow is computed from natural option-list height and the menu's available
  height, not the viewport after arrow space is subtracted. Resizing the content
  or menu updates this decision. Observers are disconnected on unmount; closed
  Radix fragments do not start layout observers.
- Changed the grading-slide heading to “Success means the requested change was
  saved.” The body still requires the exact requested edit and preservation of
  unrelated data. Regenerated the HTML and 20-page PDF without changing grades.
- The new compact-menu regression failed against the previous build's 24px empty
  slots, then passed after the fix. An initial implementation needed a guard for
  Radix's detached closed content. The resize test now varies the menu height
  limit directly because Radix intentionally dismisses on window resize.
- All **216 backend tests and 12 browser tests passed** in an isolated production
  build. Coverage includes empty/single-option menus, changing height limits,
  long-list geometry, pointer/keyboard/typeahead, modal focus, touch, reduced
  motion, presentation controls, all-slide print clipping, and viewport layout.
  Inspected dropdown and slide screenshots. The package credential screen passed.
- The release fingerprint changed because it includes operator UI source.
  Historical runs, graders, accounting, and the frozen root `dist` are unchanged.
  No paid inference or changes to Slack's actor controls were required.

## Reference-style presentation and development lessons: 2026-10-05

- Restored the earlier deck's visual language: a two-color opening, actual Slack
  mark, outlined icon labels, short bullets, and a four-node flow in a pale panel.
  Verification, resource, interpretation, and demo cards use the same treatment.
  The approach-first opening and newer 20-slide sequence remain intact.
- The matched-study introduction now explains what the early development runs
  established, why their different task/model coverage could not compare
  interfaces, and which controls the later study uses. No third results table
  was added. Speaker notes link the actual examples without inventing later
  grader or parser changes.
- All **four presentation browser tests passed** in an isolated production
  build. They cover all slides, the updated opening, narrative rules, keyboard
  navigation, sorting, mobile width, production security policy, and all 32
  interface timing values. The backend suite was not rerun for this document-only
  change. An initial selector incorrectly expected a hidden slide link to be
  visible; it now checks that link's content and destination directly.
- Regenerated the 20-page PDF and checked every page for overflow. Corrected two
  initial print spacing issues, inspected slide screenshots, and rendered the
  PDF opening to confirm its appearance. The package credential screen passed.
- Original actor source and root `dist` remain byte-identical. Historical
  records, grades, accounting, and interface timing data are unchanged. No new
  inference was used.

## Interface-comparison timing: 2026-10-05

- Each model/interface cell now shows median recorded elapsed seconds for all
  six attempts and for its passed tasks only. N/A marks cells without a pass;
  blocked diagnostic passes remain excluded from the passed-only measure.
- Timing is derived from the verified episode durations. All-attempt medians
  include early stops. The slide explains that successful task subsets differ
  across cells and that these values are not a speed ranking. Existing paired
  comparisons, outcomes, costs, and the source-summary hash are unchanged.
- Added a per-model/interface table and timing fields to the derived analysis.
  Regenerated the 20-slide HTML/PDF and checked all 32 displayed time values
  against the verified rows. Sorting, keyboard controls, mobile width, and the
  production security policy remain covered by the four presentation tests.
- All **216 backend tests and four presentation browser tests passed** in an
  isolated production build. Initial print/navigation overlap was corrected by
  shortening the status note and adjusting spacing. An initial backend check
  ran before the isolated build existed; the full post-build suite passed.
- The original actor source, root build, and historical records remain
  byte-identical. No new inference or changed grades were used.

## Social-preview release: 2026-10-05

- Replaced the three-box README banner with a 1200 × 630 social card and a
  2400 × 1260 README export. The editable SVG uses the exact Relay and Northstar
  marks, bundled Camber and Lato fonts, and existing fictional portraits.
- The topic-edit example is labeled as an illustration with an expected result.
  It is not a model trajectory, performance claim, or recorded pass. Asset and
  export hashes are recorded in `docs/social-card-provenance.json`.
- Hosted staging adds page-specific static Open Graph and Twitter metadata to
  seven public documents. The shared image has a content-hashed same-origin
  PNG URL. Previews do not require JavaScript or expose private query parameters.
- All **215 backend tests and five targeted browser tests passed**. The browser
  checks cover the public image bytes, metadata, disabled-JavaScript previews,
  and the four existing presentation regressions. The new preview test initially
  used a non-public local filename; it now uses the public routes. Inspected
  screenshots at 1200, 600, and 300 pixels wide.
- Validation used an isolated production build. The original actor source and
  root `dist` remain byte-identical. No model calls, task changes, or historical
  evidence edits were needed. The package credential screen passed.

## Design reasoning and concrete examples: 2026-10-05

- Rebuilt the presentation as 20 slides. A saved message edit now connects the
  environment, action loop, and grader. Verification uses executable examples
  instead of presenting test counts as the explanation. Four dedicated slides
  derive session isolation, run speed, resource choices, and proposed scaling.
- The task-definition review shows the actual instruction excerpt, the literal
  message sent by six completed runs, and the grader's expected message. No
  original task, grade, record, or outcome was changed. The interface explanation
  compares one direct topic operation with the browser's edit flow.
- Added `docs/design-discussion.md` with code-linked reasoning, alternative
  designs, benefits, costs, and remaining tests. Rewrote speaker notes for the
  new sequence and updated the assignment coverage links.
- All **213 backend tests and 13 targeted browser tests passed** in a
  credential-free isolated production build. Browser coverage includes every
  slide, sorting, keyboard navigation, mobile width, production security policy,
  and final-workspace rendering for all **402** published comparison records.
  This is a targeted browser release check, not a new full-browser-suite result.
- The 20-page tagged PDF passes the export clipping check. Inspected the new
  slides visually and rendered the isolation and task-review pages from the
  actual PDF. An initial print overflow and a main-bullet style violation were
  corrected before the final passing run.
- The original actor source and root `dist` remain byte-identical. Both study
  collections, graders, and accounting remain unchanged. No new inference ran.

## Approach-first opening: 2026-10-05

- Slide 1 now introduces Kevin's model-API harness, separation of execution and
  grading, and consistent run process. Removed the assignment recap and updated
  the opening speaker notes. The remainder of the slide sequence is unchanged.
- All four presentation browser tests passed in an isolated production build,
  including navigation, sorting, mobile layout, and print clipping. The opening
  slide was inspected visually, and the 17-page PDF was regenerated.
- Original actor source, root build, and both experiment collections are
  unchanged. No new inference or backend behavior changes.

## Presentation narrative revision: 2026-10-05

- Rewrote the 17-slide deck around the assignment, implementation, two separate
  comparisons, findings, and next tests. Removed slogan headings and unmatched
  pilot scores from the main story. Each study now has its setup, results, and
  interpretation in sequence. Speaker notes follow the same order and provide
  transitions. Useful technical terms are defined, not banned.
- Combined the 306-run setup and accessibility controls. Added a separate
  interpretation of the verified interface study, including paired outcomes,
  selected-pair time/cost differences, pixel delivery, service failures, and
  single-attempt limitations. Values are derived from the verified evidence.
- All **213 backend tests and six targeted browser tests passed**. Browser
  checks cover every slide, keyboard navigation, mobile width, production CSP,
  sortable tables, stable result links, and all 96 interface-study replays.
  This is not a new full-browser-suite report or a new inference campaign.
- The 17-page PDF passes the clipping check. Rendered slides were inspected.
  An initial scaling-slide overflow was fixed by shortening its text. An
  expanded layout test initially assumed every slide had source notes; it now
  checks the final content element on each narrative slide.
- Validation used a credential-free isolated production build. The original
  actor source and root `dist` remain byte-identical. Original trial catalogs,
  records, graders, and accounting are unchanged. No paid inference was used.
- The optional agent-docs audit still reports missing repository enrollment
  scaffolding and a root `SKILL.md`; these pre-existing documentation-kit gaps
  are outside this presentation revision. Its safety and link checks pass.

## Complete matched-interface study: 2026-10-05

- All **96/96** planned attempts are recorded once: **58 passed, 11 incomplete,
  27 blocked**, zero unattempted and zero capture gaps. No inference retries,
  replacement cells, changed graders or increased limits were used. The worker
  exited and released its lock. The final cell hit its $1 cap; no cell remained.
- The verifier reopened all 96 original archives. All **7,892 integrity checks
  and 532 recomputed outcome checks agreed**. The completed summary is bound by
  `verification-public-96.json`; the earlier admission receipts are retained.
- Accounting reconciles **1,252 requests, 1,233 receipts and 19 unknown-usage
  requests**. Usage estimates are **$20.718042**, unresolved reservations are
  **$2.043534**, and the combined allowance is **$22.761576 of $25**. These are
  recorded base-rate estimates, not invoices or hosting costs.
- The separate public library contains all 96 attempts. Existing public records
  retain their exact hashes. The original 306-run catalog, records, summary,
  accounting and graders are unchanged. Both collections are closed.
- The 17-slide HTML/PDF now includes the completed sortable interface matrix.
  Pass counts open the corresponding model/interface replay selection. Full cost
  exports and a reproducible paired-outcome, time and action report are linked.
  Nineteen pixel blocks, including 14 connection failures, remain explicit.
  The report makes no significance, reliability or universal-best claim.
- All **213 backend tests and 15 targeted browser tests passed**. The browser
  checks render final workspaces for all **402** published comparison attempts,
  check the new study's exact outcome labels and expected-state comparisons,
  and cover sorting, keyboard controls, production security policy, mobile
  width, viewport sizing and replay switching. No paid inference was used.
- Initial browser validation found a writing-rule violation and an incorrect
  test selector; both were fixed. A trace-artifact transfer also failed once.
  The final full targeted pass used one worker, retained its trace settings,
  and had no retries, skipped tests or flaky results. The 17-page PDF export
  and print checks pass without clipping. The result slide was inspected visually.
- Software checks used an isolated, credential-free production build. The
  trial-generating source was preserved and checked against its source hash
  before root main advanced to viewport commit `4602c7c`. The original root
  build remains byte-identical. The updated package scanner also decompresses
  and screens every interface-study record before creating the submission.

See [paired analysis](../evidence/campaigns/interface-study-2026-10-05/analysis.md),
[verification receipt](../evidence/campaigns/interface-study-2026-10-05/verification-public-96.json)
and [all study traces](https://relay.kevinliu.studio/demo/review.html?study=interfaces).

## Dynamic viewport layout: 2026-10-05

- The homepage uses `100dvh`, with a `100vh` fallback. The workspace fills the
  height left after the header and controls. Removed the idle preview's 57vh /
  640 px cap and the active view's automatic page height.
- Captured frames retain their aspect ratio and show the full image. Wide or
  short screens can have letterboxing. Desktop decisions and task comparisons
  scroll within their panels. On phones, the workspace and decisions scroll
  inside the remaining screen area. Run controls stay above that area.
- All **17 targeted browser tests passed**, with one worker, no retries and no
  paid inference. Checks cover idle, running, completed, focus, replay, queues,
  sequential launches and free/BYOK flows. Viewport checks include dynamic height
  changes, widths from 320 to 1920 px and a short landscape fallback.
- Initial checks found that two small-phone previews became too short. A minimum
  frame size and internal scrolling fixed this. Desktop and phone screenshots
  were inspected. Safe-area padding and reachable controls are retained.
- The hosted build and tests ran in an isolated worktree. The running study's
  root actor source and frozen build were not changed. These are UI software
  checks, not new model trials or a rerun of the backend suite.

## Presentation and matched-interface admission snapshot: 2026-10-05

- The 17-slide deck starts with the harness-first approach, then shows all 18
  workflows after the worked example. A separate slide explains the controls
  used in the original 306 accessibility runs. New slides cover the matched
  four-interface study and its verified results. Named slide links remain stable.
- The published snapshot contains **16 of 96 planned attempts: 12 passed and
  four blocked**. Collection is still running. The archive review passed **778
  integrity checks and 32 recomputed outcome checks**. It retained all failures,
  including a blocked run whose final workspace happened to satisfy the grader.
- The snapshot records **$1.087356** in usage estimates plus **$0.354036** in
  unresolved reservations, for **$1.441392** of the separate **$25** allowance.
  It contains 103 requests and 100 accepted receipts. No request was retried.
- Every published study attempt has a trace and actual-UI replay. The reviewer
  keeps model, task and interface selections separate. Pixel requests use
  lossless image references; unit checks reconstruct each request and verify
  its original hash. Original event chains and archives remain unchanged.
- All **210 backend tests and 14 targeted browser tests passed**. The browser
  suite opens all 306 historical records and all 16 new study records, checks
  exact outcomes, task comparisons, interface switching, keyboard interaction,
  mobile width, table sorting, cost exports and production security policy.
  No paid inference was used by these software checks.
- The final layout pass adds a desktop content-bound check and reruns all four
  presentation tests. The HTML and 17-page PDF have no print clipping. The
  workflow and interface-results slides were inspected visually. Initial
  validation found a tall results layout and a test fixture-scope error; both
  were corrected before the successful checks.
- Validation used an isolated, credential-free build and one browser worker.
  Root actor source and frozen `dist` remain byte-identical. The original 306
  records, summary and accounting exports are unchanged. Shared-host activity
  during collection is disclosed; recorded durations are not isolated inference
  speed measurements. The new study is exploratory, with one attempt per cell.

Study plan: [matched interface study](campaigns/interface-study-2026-10-05.md).
Admission findings: [pilot review](campaigns/interface-study-2026-10-05-pilot-review.md).
Publication binding: [16-run verification](../evidence/campaigns/interface-study-2026-10-05/verification-public-16.json).

## Integrated header and access controls: 2026-10-04

- Moved the title and explanation into the logo row. Free / Your key now sits
  immediately before Run. Your key also opens connection settings and exposes
  connecting, connected and disconnected states through its icon and accessible
  description. The separate connection button and intro row are removed.
- All **26 targeted browser tests passed**, without retries or paid inference.
  Checks cover seven widths from 320 to 1920 px, control alignment, keyboard menus,
  saved/revoked keys, opt-out, free/BYOK switching, quotas, duplicate launches,
  sequential queues, 1v1, provider errors, audit, focus mode and replays.
- The desktop idle workspace starts at 158 px, compared with about 220 px in the
  preceding release at 1440 px width. At 390 px width it starts at about 294 px,
  compared with 408 px. Controls remain visible and there is no horizontal overflow.
  Desktop, tablet and phone screenshots were inspected.
- Validation used an isolated production build. Frozen root `dist`, task
  definitions, recorded trajectories, the 306 outcomes and cost records are
  unchanged. Free access remains disabled in production; its infrastructure
  activation is separate from this layout change.

## Compact run header: 2026-10-04

- Reduced navigation height and the vertical gaps around the heading and run
  controls. Button and dropdown sizes are unchanged. The workspace starts about
  59 px higher in the desktop idle view and 41 px higher after a run.
- All **10 targeted browser tests passed**, with automatic retries disabled.
  The layout check covers 1920, 1440, 1280, 800 and 390 px widths, keyboard menus,
  control sizes and horizontal overflow. Existing checks cover free/BYOK runs,
  sequential launches, 1v1, live views, history, focus mode and replays.
- Initial height assertions underestimated the access switch and mobile wrapping.
  Final bounds preserve those control sizes while enforcing the reduced gaps.
  Desktop and mobile screenshots were inspected. These are simulated-provider
  software checks; no paid inference was used.
- The production build and tests ran in an isolated copy. Frozen root `dist`,
  historical task definitions, the 306 outcomes and cost records are unchanged.

## Expected and actual task results: 2026-10-04

- Runs and replays now show exact required final values beside captured values.
  Replay seeking updates the actual column. Missing structured captures show
  unknown values. Unsupported task versions have no inferred comparison.
- All **203 backend tests and 16 targeted browser tests passed**. The browser
  suite opened all **306 published trials**, checked each expected-result panel,
  and confirmed matching fields for all 152 saved passes. No paid model calls
  were made. These are software checks, not new benchmark trials.
- Tests cover all 18 task types at three seeds, provenance mismatches, exact
  text and destinations, missing states, edits, reactions, pins, saves,
  deletions, duplicate messages, keyboard use and mobile width. Live and 1v1
  records retain requirements in browser-local history. Provider inputs and
  the actor service do not expose the observer comparison.
- The initial browser run caught replay-dialog overflow and timed out in four
  other checks under parallel load. The dialog now keeps scrolling inside its
  body. The final run used one worker and a 60-second per-test timeout; the
  inventory sweep retained its 240-second limit. It keeps its coverage report
  without duplicating all 306 records into another video/DOM trace. Focused
  browser tests still retain visual evidence. Automatic retries were disabled.
- Validation used isolated, credential-free builds. Backend source receipt
  `0e4f3e9bcece947e83df0921747922387797f5c754e7a177cab0943516b7c759`,
  frozen root `dist`, original records, campaign summary and costs are unchanged.
  The two task-language caveats remain visible. The saved grader is still the
  outcome authority. See [Expected and actual results](expected-results.md).

## Tab icons and punctuation: 2026-10-04

- Added Relay SVG and ICO favicons to the presentation and results pages, including
  standalone downloads and the raw presentation template. Hosted pages publish the
  same icon bytes on their own origin. Trial review now has an ICO fallback.
- Short tab titles distinguish Computer use, Presentation, and Results and replays.
  Removed em dashes from authored interface copy and presentation notes. Missing
  numeric values display `N/A`; their empty sort values remain unchanged. Historical
  messages, recorded model output, trial outcomes, and cost data were not rewritten.
- All **181 backend tests and 19 targeted browser tests passed**, without retries.
  New tests verify both icon formats, served MIME types, exact asset bytes, SVG
  decoding, offline icons, and page titles across six public routes. Existing checks
  cover replay, BYOK, errors, sorting, navigation, and 13 unclipped PDF pages.
- Validation used a credential-free temporary build. The frozen root actor build
  and historical evidence remain unchanged. No paid inference was performed.

## STE-inspired presentation writing — 2026-10-04

- Rewrote the 13-slide narrative and speaker notes in short, direct technical English.
  The story still starts with the assignment, explains the environment and harness,
  then covers the larger comparison, results, task-design lesson, and next tests.
- Main narrative bullets each contain one complete sentence of at most 20 words.
  The browser test enforces these limits. Technical terms have explicit definitions;
  detailed figures remain in the results table and the notes. This is STE-inspired
  writing, not a claim of formal ASD-STE100 dictionary compliance.
- All **34 focused evidence/accounting tests and five presentation/results browser
  tests passed**, without retries. Checks cover table sorting, cost exports, all-trial
  links, keyboard navigation, production CSP, mobile width, and 13 unclipped print
  pages. HTML and PDF were regenerated. This is not a new full-app test run.
- No inference was performed. The frozen 306 outcomes, cost exports, task contracts,
  original records, and campaign summary are unchanged. Validation used a separate
  credential-free copy and confirmed the original actor source and build were unchanged.

## Simpler homepage and guarded free access — 2026-10-04

- **181 backend tests and all 94 browser tests passed**, with test retries disabled.
  The complete browser pass reopens all 306 public trial recordings. No paid model
  inference was used for software verification.
- The homepage has one run toolbar, Free/Your key selection, Results & replays,
  and grouped History/Compare/Replays tabs. The large welcome overlay, empty
  decision panel and redundant isolation/grader footer are removed. BYOK queues,
  1v1, live streaming, audit and manual Slack access remain covered.
- Free access enforces a fixed cheap-model allowlist, $0.05 per-run reservation,
  $5 per UTC day and three admitted attempts per network per UTC day. The operator
  credential stays server-side. Extra fields, arbitrary model/config overrides,
  invalid prices and unavailable quota storage fail closed. BYOK never falls back
  to the operator's credential. See [the policy](free-tier.md) for identity and
  estimated-cost limitations.
- New checks cover pending quota concurrency, disconnects, daily key persistence,
  hashed network identity, safe errors, free/BYOK key separation, double clicks,
  exhaustion after refresh and responsive navigation. Redis and provider transports
  are simulated; these tests do not certify the real quota service.
- Validation caught a non-idempotent staging step that could overwrite the actor
  entry on a second staging pass. Fresh build plus repeated staging now preserves
  that entry. Another full pass caught a custom-menu click failure: appearing
  scroll arrows moved rows by 24 px. A new regression fails on the old layout;
  reserved arrow space and five repeated checks fix the shift without weakening
  the trace-filter assertions. The final full suite passed after both fixes.
- The public build and submission package are screened against the actual private
  Router key without printing or exporting it. The new desktop/mobile screenshots
  are UI verification with fake inference, not new model-performance evidence.
- Builds/tests ran in an isolated copy. Frozen root `dist` remains
  `9406fbc350a17bf2f4f0f45ef69d3ecca6574c39b07fdf1d470c10efd6dece5d`.
  Historical task contracts, 306 outcomes, archives, public records and completion
  certificate are unchanged; the new release is not their original actor source.
- **Activation pending:** production secrets are configured, but
  `RELAY_FREE_ENABLED=0`. The linked Vercel integration offered only paid Redis
  plans. Creating that separate infrastructure resource needs operator approval.
  No real Redis concurrency check or live free-tier inference is claimed.

## Presentation narrative and diagrams — 2026-10-04

- Rebuilt the 13-slide story around the assignment, focused Slack workflows, repeatable harness, expansion into a benchmark prototype, recorded results, and task-validation lessons.
- Added editable diagrams for requirements, workflow dependencies, state checks, run ownership and the action loop, scope expansion, interface differences, verification layers, instruction mismatch, and proposed scale-out. Camber, Relay colors, and existing SVG marks remain in use.
- The 306-row evidence inventory, costs, original task outcomes, and campaign summary are unchanged. Slide 9 retains the sortable model table and all trace/replay links. Routine engineering mistakes remain in the linked written review.
- All 29 focused evidence/accounting tests and five presentation/results browser tests pass. The updated tests assert story order, diagram presence, readable bullets, keyboard controls, numeric sorting, all-trial access, production CSP, mobile width, and 13 unclipped print pages.
- The initial focused browser pass found missing text spacing across the cover title's line break. The HTML was corrected and all five checks passed on the next run. These checks are not a new full-app test run or new model trials.
- Interactive browser review inspected the scope-expansion and harness diagrams. HTML/PDF generation uses the same verified result source and requires no inference.
- Validation builds use a credential-free temporary copy. The root actor source and frozen build remain unchanged.

## Results and assignment handoff — 2026-10-03

- **174 backend tests and 91 browser tests passed**, retries disabled. Coverage includes all 306 public trial records, production-CSP sorting, model/task drilldowns, cost exports, keyboard navigation and narrow-screen layouts.
- The first full pass caught horizontal overflow at 800 px after adding Results navigation. Wrapping fixed it without weakening the assertion; the next complete run passed. The first failure report remains local in `artifacts/results-initial-regression.json`.
- `/results` and slide 9 share one table/controller. Homepage Results and Replays expose all model/task traces. Links stay beside model names in the wide trial table.
- Episode accounting reconciles 4,747 requests: 4,712 accepted receipts and 35 unresolved requests. Usage-based estimates total $189.31101456; reservations total $3.77939636. Selected allowance: $193.09041092; shared ledger: $194.10583757. No invoice, cache discount, unknown-token total or hosting bill is inferred.
- Accounting tests reject duplicate receipts, impossible tokens and mismatched totals. They distinguish rejected and accepted output-limit usage and prevent run-wide budget duplication.
- The 13-page PDF passes overflow checks. Slides, notes and `onsite-readiness.md` map the assignment to setup, tasks, four interaction approaches, trajectories and isolation/scaling/resource tradeoffs. RL training, native trainer compatibility and successful pixel-only control remain unclaimed.
- Interactive visual review covered Results, model drilldowns and the opening slide. The polish/accessibility pass added visible sorting, keyboard-safe controls, sticky evidence links and responsive wrapping. This is targeted testing, not accessibility certification.
- Tests used an isolated production build. This release changes observer navigation/styles, not historical trials. The campaign summary, certificate, public records and root frozen `dist` remain unchanged. No paid model requests were made.

## Completed 306-cell inventory — 2026-10-03

- **306/306 unique attempts: 152 passed, 61 incomplete, 93 blocked; none unattempted.**
  The final worker exited successfully after block-269. One attempt per task/model;
  no repeats, replacements, grader edits or hidden exclusions. The original 105
  attempts retain their identities, outcomes and accounting.
- The [completion certificate](../evidence/campaigns/model-breadth-2026-10-03-continuation/verification.json)
  reopens **277 original archives**: **26,403 integrity checks and 2,007 saved-state
  grading checks agree**. All recorded backend/build receipts match, with zero
  capture gaps. It binds summary
  `6618f7f2041bf3d9334ba70f47716380b1495a5bf0d51ba68fc6fd144d71211f`.
- There are **4,662 action attempts and 506 rejected steps**. Rejections include
  malformed output and unsupported action schemas, not just incorrect UI clicks.
  Terminal provider/output/resource blocks are retained, even when diagnostic
  state checks pass. Task-language caveats for release-sync and design-handoff
  remain disclosed; this is not a validated model ranking or repeatability study.
- Shared estimates/reservations total **$194.10583757** under the original $300
  cap, including prior campaigns and probes. Unknown charges remain reserved;
  the amount is not an invoice. No extra inference is used for verification,
  replay exports or software tests.
- All **306 public structured records** are exported (81.04 MB compressed,
  lazy-loaded one at a time). The earlier 249 compressed records remain
  byte-identical. Every trial has trace/replay links on slide 9; zero-action runs
  show their original initial workspace without invented playback.
- **169 backend checks and all 90 browser tests pass**, with no test retries.
  The full production-build sweep opened, hash-checked and rendered every one of
  the 306 records. The [per-record receipt](../evidence/reference/every-published-trial-opens-and-renders-its-final-captured-workspace-without-inference/replay-coverage.json)
  binds all 306 archive identities to the final summary; there were no model API
  requests or browser page errors. Other checks cover strict production CSP,
  cancelled late loads, cursor/playback controls, downloads, mobile layouts,
  separate run workspaces and all 13 unclipped slides.
- Tests used a credential-free temporary workspace, not the frozen collection
  build. Post-checks confirm original actor source and dist stayed byte-identical.
  Raw Playwright traces/videos remain private; only portable token-free evidence
  is included. No new Docker or scale benchmark is claimed by this release.

## Historical 249-record trial review release — 2026-10-03

- **249 recorded attempts, not 306 completed trials:** 123 passed, 50 incomplete,
  76 blocked; 57 unattempted. The collector stopped safely between cells when
  free disk fell below its unchanged 10 GB reserve. No active trial was discarded.
  [Resume state and immutable checkpoint](campaigns/model-breadth-2026-10-03-disk-stop.md).
- All 249 structured episode records are public in the [trial library](trial-review.md).
  Each retains complete ordered events, exact prepared requests, visible responses,
  UI snapshots, original outcome checks and archive identity. PNG bytes are omitted;
  original image hashes remain. The library is 66.67 MB compressed, lazy-loaded
  one trial at a time. No key or new model call is needed.
- Read-only verification reopened 220 original archives: **21,422 integrity checks
  and 1,649 saved-state grading checks agree**. All episodes have matching recorded
  backend and served-build receipts, with zero capture gaps. The checked snapshot
  is `e0e24a1816c339cc3e795bfaba443daa156227f94e2a28908832413168d77126`.
  This is partial verification, not a 306-cell completion certificate.
- **169 backend checks and 90 browser tests pass, with no test retries.** The full
  browser suite used an isolated production build. It opened all 249 public records,
  hash-checked them, and rendered each final captured workspace (first state for
  zero-action runs), with zero inference calls. The [per-record playback receipt](../evidence/reference/every-published-trial-opens-and-renders-its-final-captured-workspace-without-inference/replay-coverage.json)
  lists every checked trial and its original archive hash.
- The strict production-CSP test passes replay/cursor controls, expansion/Escape,
  exact requests, readable model output, parsed actions, checks, state changes,
  provenance and JSON download with an empty browser-error list. Additional tests
  cover zero-action/diagnostic blocks, cancelled late loads, Back, tampered bytes,
  invalid IDs, keyboard selection, mobile layout and reduced motion. No console
  errors were filtered to turn the earlier development-only failure into a pass.
- After refreshing the displayed test counts and 13-slide PDF, all four presentation
  tests passed again. The original full 90-test report is retained separately from
  that focused check. Formatting and credential-screened submission packaging pass.
  The Docker build recipe includes the new entry files, but no new container smoke
  was performed in this storage-constrained session.
- The preparation helper copied only public project inputs to a temporary validation
  workspace; it did not copy credentials/private runs. Its post-check confirmed the
  original actor source and dist remained byte-identical. Generated observer assets
  must not replace that frozen local build while collection remains resumable.
- Release-sync and design-handoff wording caveats are visible in the review page,
  report and slides. Raw results remain unchanged. Protocol-format rejections are
  separated from successful UI mutations; these are bounded-system development
  results, not causal model rankings or evidence of repeatability.

## All-trial review development checks — 2026-10-03

- Added a static, key-free [trial reviewer](trial-review.md), derived structured-record exporter and per-trial trace/replay links in the results table. The implementation is outside the frozen actor/harness directories; the campaign source hash remains `f559a61066ae76d3d8a6bc10d9c0fe3e6c09c9b0b12b18a62f1c1113aefd415c`.
- First export: 207 recorded attempts, including failures and blocked outcomes. Every compressed record passed byte/hash checks, secret screening, full event-chain checks and exact request-body checks. The full backend suite passed 168 checks. These counts are development checkpoints, not final campaign coverage.
- The real-browser preview sweep opened all 207 records and rendered each final captured workspace (first captured state for zero-action runs), with zero model API calls. Four additional preview tests passed for zero-action/diagnostic handling, cancelled/late loads and browser Back, invalid IDs/tampered files, and mobile/keyboard/reduced-motion behavior.
- A fifth preview test reached all replay/trace/check/download assertions but failed its strict empty-console assertion on Vite's development WebSocket warnings and the existing workspace's development-only `filled` attribute warning. The final production build must pass this strict check without filtering these errors. It is not counted as passed at this checkpoint.
- Interactive in-app review caught and fixed an initial-null loading error, then verified actual topic-dialog playback, exact input inspection and Escape from expanded replay. Presentation readability and 13-page/mobile containment checks both pass with the added library link.
- No new model inference was used for these checks. Software verification shares the local machine with collection; timings are operational diagnostics, not a controlled speed benchmark. Final full-library export, archive verification, production-build browser suite and deployment verification remain release gates.

## One-pass breadth inventory — 2026-10-03

- The user replaced repeated trials with multiple model families, all tasks and no repeats. [New frozen plan](campaigns/model-breadth-2026-10-03.md): 17 exact routes × 18 tasks × seed 1042 = 306 cells. Preserve all 37 attempted cells from the closed Qwen campaign (28 passed, five incomplete, four blocked), including the terminal 401. Run only the 269 missing cells. No historical data are rewritten.
- The original eight archives pass 2,415 checks, no failed checks or gaps. Original recorded estimate/reservation: $9.40933975, including $0.286934 unresolved. A separately recorded tiny access diagnostic now succeeds for $0.00000430; this does not prove why the previous 401 disappeared. New prior ledger: $10.42476640; remaining $289.57523360 under the existing $300 ceiling.
- The new worker binds identical source, task initial-state hashes and carried rows. Twelve new routes have a first-three-task admission stage (36 unique cells); traces and accounting, not pass rate, determine admission to bulk. Later task order/model order is seeded. This is a development inventory mixing preserved and later observations, not a fresh randomized comparison or popularity ranking.
- Six additional zero-inference tests pass: exact 306-cell coverage, unique missing cells, three-task admission coverage, duplicate/carryover-retry rejection, shared accounting and new-result overlay/origin rendering. Full backend suite: 150 tests passed. The full browser suite also passes all 84 tests, including four presentation checks with all 17 logo rows, task filtering, keyboard sorting, origin metadata, mobile/CSP and 13 unclipped print pages. Software tests are not counted as model trials. Some verification ran on the same machine during pilot collection; latency is an operational diagnostic, not a controlled speed benchmark.
- [Live collection snapshot](../evidence/campaigns/model-breadth-2026-10-03/README.md) reports current attempts, grades, requests, estimates and unresolved reservations. Local original archives remain private; the public table does not pretend unattempted cells are completed failures.

## Expanded task matrix and accounting — 2026-10-03

- User clarified 20 trials per **task/model**, then approved all 18 tasks, five routes and a $300 total estimated ceiling. The [frozen plan](campaigns/all-tasks-2026-10-02.md) contains 1,800 cells, complete matched five-model blocks, a 25-episode trace-review gate, shared ledger, atomic worker lock and source/plan/launcher bindings. It is not a completed benchmark.
- First cell: Gemini 3.8 Flash, channel-topic, seed 1042 returned HTTP 403 before an action; $0.026841 reserved, usage unknown. The worker stopped as preregistered. Four separate access probes answered on GPT-6.1 Sol, Sonnet 5.5, DeepSeek V4.1 Flash and GLM 5.3 Flash; $0.00026105 reported estimate, not task scores. Router's [documented Gemini BYOK requirement](https://docs.router.com/api/errors-and-limits) is consistent with this access block. The user approved replacing Gemini with Qwen 3.8 Max; its separately recorded access probe answered for $0.000284.
- The separately frozen [Qwen successor](campaigns/all-tasks-2026-10-03.md) completed its 25-trial pilot: 21 passes, three incorrect outcomes, one output limit, 1,775 not yet attempted. All five archives pass 1,214 integrity checks, with matched initial states within blocks and no capture gaps. All usage is known for this pilot: $3.78059050 plus $1.01542235 in the bound prior ledger leaves $295.20398715. These are estimates, not invoices. See the [trace review](campaigns/all-tasks-2026-10-03-pilot-review.md); bulk admission is based on evidence integrity, not selecting a high pass rate.
- The [earlier 36-attempt campaign](../evidence/campaigns/model-comparison-2026-10-02-final/README.md) has 20 passes, 11 incomplete, four output limits and one connection failure. All 1,971 integrity checks pass with no gaps. Twelve attempts per model: GLM 10 passes, DeepSeek 10, Nano zero. Preserve 24 unattempted cells; no inference retry or retroactive error recategorization.
- Prior strict and reserved-timeout studies remain closed at 4/60 and 7/60. Their unknown reservations remain counted. Validated `max_output_tokens` receipts now contribute reported usage while partial actions never execute. Defaults still stop; only reviewed CLI campaigns can advance to a new cell. Connection failures require allowlisted transport codes and a positive retained reservation; arbitrary exceptions, cancellation and cleanup failures do not qualify.
- New matrix/report tests verify every task/model has exactly 20 distinct planned seeds, five-model blocks, deterministic schedules, duplicate rejection, the global ledger and missing-value handling. Provider simulations verify accounting without spending or executing partial output; these are software tests, not model findings.
- The custom operator-menu Home/End focus regression was reproduced, diagnosed through focus events, fixed without weakening the assertion, and passed five repeats. Complete suite: 144 backend tests and 84 browser tests passed. Agent workspace/grader behavior was unchanged by this UI fix.
- Slide 9 now supports a custom task filter, five-model raw-value sorting, compact overall coverage bars, 20 per-task markers and all 1,800 planned rows. Four dedicated slide checks pass, including CSP, mobile, keyboard, unknown-last sorting and thirteen unclipped PDF pages. `/presentation` remains canonical.

## Sortable comparison and canonical presentation — 2026-10-02

The new [six-model plan](campaigns/model-comparison-2026-10-02.md) specifies 20
trials per route, five tasks and four seeds, accessibility-only control, fixed
limits and a $6 estimated ceiling. It stopped after **4/120 attempted**: two
passes, one incorrect/step-limited and one provider block. Nemotron's first
request timed out without usage. The complete 120-row inventory preserves 116
unattempted cells. This does not fulfill the requested 20 trials per model.

The compressed original evidence passes 157 audit checks with no gaps. The
recorded $0.04298605 includes a $0.00158460 unresolved reservation; no invoice or
complete usage claim is made. No subsequent inference or automatic replacement
was run. The previous onsite campaign is unchanged.

Slide 9 renders the new summary with model-family logos, twenty outcome markers
per model, numeric column sorting and a sortable all-trials dialog. Missing values
sort last in both directions; blocked diagnostic grades cannot become passes.
Keyboard activation, focus return, reduced-motion cancellation, mobile overflow,
all 13 printed pages and same-origin CSP behavior have committed regressions.
`/presentation` is canonical; old HTML URLs retain fragments through a 308 redirect.

The full-suite run also exposed a replay readiness race. A seek could arrive before
the iframe's React receiver even though its load handler had marked it ready. A
deterministic regression drops pre-ready messages and fails on the old implementation;
the fix explicitly resends the latest snapshot on the trusted same-origin readiness
message. This is observer-only delivery, not new agent inference or a rewrite of
recorded trajectories. The initial test expectation was corrected from “Loading”
to the application's actual “Opening Northstar” copy before the negative proof.

The final full gate passes **127 backend checks and 84 browser checks**, with no
test retries. A presentation test locator was changed to use its accessible button
name after HTML formatting added leading whitespace; the sorting assertion was
not weakened. PDF export verifies 13 unclipped pages. Source manifests and
scripted screenshots are refreshed; neither historical model campaign is rewritten.

## Northstar workspace identity — 2026-10-02

The fictional team's N badge is replaced by an original eight-point compass
mark with a gold north facet. The rail, loading/error state and sidebar signature
share one local SVG; Relay's own logo and favicon are unchanged. Browser checks
verify decoded assets, stable native dimensions, no external requests, loading
and error continuity, home navigation, the practice sandbox and scaled actual-UI
replay. The replay assertion measures native layout rather than host-scaled bounds.

The full gate passes **123 backend checks and 82 browser checks**. Manual browser
review checked the mark in the real workspace. Scripted reference images are
refreshed; historical model captures, graders and task state remain untouched.
No model inference or generated bitmap is needed for this original SVG identity.

## Fictional portraits and Relay handoff identity — 2026-10-02

Six generated fictional portraits now appear in messages, threads, member stacks,
the DM list/directory and the signed-in avatar. The shared renderer carries them
into the no-key sandbox and actual-UI replay. Images are 256×256 same-origin WebP,
39,880 bytes total, with initials on load failure and independent presence dots.
[Prompts and output hashes](portraits.md) document their origin. No stock photos
or private-prototype photographs were reintroduced.

The custom two-ribbon handoff mark replaces the earlier R tile across Live, Lab,
the sandbox, favicon/touch exports, README header and regenerated slide deck.
Browser checks cover all six decoded images, correct MIME types, distinct stable
sources, zero third-party requests, missing-image fallback, sandbox and replay.
An asset contract checks the hashes, size budget and README/master geometry.
Initial test assertions were corrected to test an image rather than text content
and to disambiguate the DM's two headings; application behavior was not weakened.

The release gate passes **123 backend checks and 81 browser checks**. Manual
browser review covered the home logo, people thumbnails and DM navigation.
No model inference was used. Task state, rewards, graders and frozen model
campaigns are unchanged. Current scripted reference screenshots are refreshed;
historical model PNGs and evidence hashes are preserved. Future pixel inputs
include the new portraits; actual-UI replay remains a current-renderer view.

## Consecutive run handoff and readable outcomes — 2026-10-02

Three deterministic regressions reproduced the reported behavior before the
corresponding fixes: a dismissed replay's delayed fetch reopened over a running
workspace; an enabled Run silently rejected a consecutive launch during its
post-completion cooldown; and a decoded image node remained beside the next
queue item's loading state even after record/frame state reset. The viewer now
replaces its entire host stage at each handoff. The queue test gates request two
until the old image, cursor and outcome card are absent, and measures one active
hosted request at most across two real isolated browser runs with fake providers.

History and Compare now distinguish passed checks, incomplete changes, provider
blocks, limits and interrupted capture through icons, short explanations and
color. Filters and View links target the exact episode; mobile uses cards.
Successful diagnostic checks on blocked runs deliberately remain blocked in the
test fixtures. Original grades, traces and frozen model campaigns are unchanged.
Interactive local-browser review covered Compare and actual-UI replay; the main
workspace is unmounted while replay/1v1 is shown. No paid inference was used.

The release gate passes **122 backend checks and 80 browser checks**. The new
desktop/mobile outcome screenshots are synthetic UI fixtures, not model results.

## Onsite evidence and presentation — 2026-10-01

The [frozen model campaign](campaigns/onsite-2026-10-01.md) planned 30 cells and
attempted 20: **8 strict passes, 11 incorrect/step-limited, 1 blocked and 10
unattempted**. It used GPT-4o mini and GPT-6 Luna through Ramp, four interfaces,
fresh local Chromium contexts and fixed source hash
`4823d0671d035e2759cd0bb7f01c4ddba63a45a04fd6c4c92cdf8bf4e74161d8`.
The accepted receipts estimate $0.14838375; the rejected incomplete response
retains $0.0014902, for $0.14987395 recorded allowance across 126 calls. Not an invoice.

Workflow episode 017 hit the frozen 1,024-output-token allowance, including 915
reasoning tokens. The response was HTTP 200 but incomplete; no action executed.
Its allowlisted usage is preserved, while run accounting remains conservatively
unknown. This triggered the declared stop rule. The remaining edit/incident cells
and pixel follow-ups were not launched. No retries, changed prompts or increased
allowances were used to improve the reported result.

All attempted episodes have verified local hash chains/artifact bindings and zero
capture warnings. [Full inventory and compressed originals](../evidence/campaigns/onsite-2026-10-01/README.md)
retain requests, receipts, actions, failures, initial/final states and PNGs. Verify
without a key using `npm run inspect:campaign -- workflows`. Hash consistency is
not independent authentication. Browser totals are 2/6 accessibility, 2/7 page JSON
(including one blocked), 0/1 pixels; API is a separate 4/6 control. Different
coverage prevents treating pooled totals as causal interface comparisons.

The public replay library adds three explicit excerpts: thread pass, decision-record
failure and API decision-record pass. Each records its original episode and archive
hash; the full matrix remains the evidence source. A browser regression confirms
the pass/failure outcomes and recorded Slack text without inference or actor writes.
The first new replay test incorrectly expected a terminal label at the initial
frame; it was corrected to seek the final frame, not by changing application behavior.

The 12-slide deck contains technical headers, bullets and diagrams only. Model
counts and timing figures are generated from evidence. Tests check all slides,
keyboard navigation, no external requests, mobile containment and print clipping.
The fresh [local benchmark](../evidence/benchmark-2026-10-01.json) preserves raw
samples and source provenance; old timings remain unchanged. It does not measure
sustained browser-agent concurrency or Chromium child memory.

See [the readiness assessment](onsite-readiness.md) for requirement coverage,
trace findings and unresolved gates. This is development evidence, not a trained
policy, held-out benchmark or statistical leaderboard.

Release checks: **121 backend/harness checks, 77 browser checks**, 84 positive
and 2,583 adversarial-negative grader states; all passed with no test retries.
The PDF contains 12 pages. The deployed presentation uses same-origin external
controls under the existing content-security policy; the offline HTML remains
standalone. Both compressed phase bundles pass key-free hash-chain verification.

## Continuous viewing, cursor evidence and paced replay — 2026-10-01

A deterministic regression reproduced dropped final frames: three changes inside
the old 220 ms throttle delivered only the first. It now passes with first/latest
delivery, ordered episode-local sequences, acknowledgment of all received frames
and pending-timer cancellation on page close. Delivery is capped at 12.5/s, not
advertised as a guaranteed frame rate. Live image decoding is bounded and keeps
the previous decoded frame visible while the next loads.

New browser episodes hash-chain trusted pointer events. Replay and live/1v1 views
draw the cursor outside the actor page. A real-browser regression compares PNG
bytes before/after telemetry plus movement/clicks: they are identical on the
unchanged fixture. Another test changes a real page's background and verifies
screencast updates and native PNG dimensions. No API cursor is invented. Pointer
capture is observer-only; actor inputs are checked for absence of the binding.

Playback now has smart pacing, original capture intervals, pause/seek/speed,
recorded cursor coordinates with disclosed interpolation, and an expanded view.
Older recordings retain explicit target-only/legacy fallbacks. Pure timing tests
check interval mapping, backward seek and missing history; browser checks cover
the actual Slack dialog/text, focus fit/escape, mobile/reduced motion and inert,
network-free replay. The no-inference example was refreshed; historical model
captures were not rewritten. Manual in-app review checked focus and replay layout.

The local gate passes **119 backend/harness checks and 74 browser checks**. These
are deterministic and fake-provider verification, not new model benchmark results.
No grader, reward or task fixture changed. The known intermittent hosted PNG
capture limitation remains separate from the live JPEG feed.

Production `f163c6d`: GPT-6 Luna completed the topic task through accessibility
in four calls/actions, 35.163 seconds and $0.0035314 estimated with known usage.
Run `d216230c-08a9-41de-9873-bc305e928878` delivered 18 ordered JPEG frames
(1,042,618 base64-image bytes over 19.100 seconds), six pointer events, five UI
snapshots including final state, two PNGs and a verified audit. The third step's
observer PNG and the final PNG timed out. The strict smoke therefore exited
nonzero despite task success: this is stream/cursor wiring evidence, **not** a
clean PNG-capture or hosted pixel-policy reliability result. Private raw evidence
is retained in `.runtime/hosted-smokes/`; no inference retry followed.

Final review also reproduced stale live status: the worker did not publish
`inFlight: false` until after executing the action and taking the next observation.
It now publishes the response/usage update before `action_started`. The streamed
ordering regression fails before that change and passes afterward. Production
home/replay controls were checked interactively; Vercel reported Ready and a
short post-deploy error-log scan returned no logs. This does not erase the two
application-level capture warnings above.

## Catalog pricing, usable allowances and model queues — 2026-10-01

Two deterministic failing regressions reproduced the report: the Router adapter
dropped v1 pricing metadata, leaving display-label docs as the only price source;
and a normal 10,000-byte input plus 4,096-output allowance at $10/$50 per million
requires about $0.305, above the old $0.25 default. Both regressions now pass.

A read-only authenticated catalog check returned 88 entries: 45 were selectable
before the fix, 87 afterward. The remaining Jev entry advertises `systemone`, not
`responses`, and is correctly directed to the separate TypeSafe connection. This
is catalog/admission evidence, not proof every provider can serve every model.
Base-rate units were cross-checked against overlapping IDs in Router's official
[model table](https://docs.router.com/supported-models); provider variants retain
their catalog prices, never a stripped-prefix guess. Catalog schema/status/API
and numeric validation, exact-ID binding, and dated docs fallback have regressions.

The default is now $2 / 40 actions / 180 seconds per model, adjustable to $5 / 80
actions. 1v1 no longer halves the configured allowance. **Try models** selects up
to eight and shows combined exposure before launch. Each runs in a separate worker
request with matched task/seed/settings and independent workspace/audit/history.
Matched interfaces also use separate requests, not a shared short deadline.
Unknown usage, interrupted/unverified evidence and failed history persistence
stop the remaining queue; no retries or automatic restart on reload.

The release gate passes **115 backend/harness checks and 72 browser checks**.
New browser coverage uses an explicitly fake transport for sequential model jobs,
full per-cell budgets, audited isolated histories, secret-free evidence,
comparison rows, unknown-usage stops, search, selection bounds and mobile/keyboard
controls. This is wiring evidence, not model quality. The picker was also checked
interactively in a local no-inference preview. Existing screenshot-capture limits
below remain unresolved by this change.

The first production pair after deployment preserved both outcomes. GPT-6 Luna
passed the topic task through Actor API in two calls (9.219 s, $0.0002086 estimated,
known usage, verified audit, five live frames, three PNGs, no capture gaps).
The simultaneous Gemini 3.8 Flash request failed before inference with
`spawn ETXTBSY` (zero requests): both cold starts could call Chromium extraction
against the shared `/tmp/chromium` path. The pinned library checks file existence,
not completion of another caller's decompression. This is a harness startup
failure, not a Gemini model result or a budget stop. Private raw runs are retained
under `.runtime/hosted-smokes/`, IDs `7f6009d0-0950-4532-bd13-84e561107c98` and
`eb8912e7-5768-46b4-b996-dc21976bbb0d`; no capability-bearing raw exports are public.

The function now shares one worker-local executable-initialization promise;
browser contexts, processes and workspaces remain separate. A failed initialization
stays failed for that worker, rather than retrying against a partial file. Two new
red-to-green regressions exercise concurrent initialization and retained rejection.
This guard is worker-local, not a cross-process filesystem lock.

Post-fix simultaneous production checks on `e196c16` both launched browsers and
returned verified audits, with no capture gaps. GPT-6 Luna passed again in two
calls (10.601 s, $0.0002291 estimated, six live frames, three PNGs; run
`8fa6b351-6e1e-4926-97f7-c963ea002752`). Gemini reached Router and received
provider-unavailable HTTP 403, not a Relay cap: request
`430e3158-ea55-4fed-8439-ebda95b826a1`, run
`95ba6c92-d762-4c12-ab18-b40229741379`, four live frames and two PNGs. Its single
request has unknown usage; $0.01816575 is retained reservation, **not a billed
cost**. No retry or provider substitution followed. Both GPT checks together
used $0.0004377 in known-usage base-rate estimates. The catalog counts were also
confirmed through the deployed endpoint. Vercel reported Ready; its short error-log
scan was empty, which does not override the application-level provider failure.

## Hands-on Slack sandbox — 2026-10-01

`/play` opens the actual interactive Slack components without a key or a model.
The homepage has **Try Slack** links; they open a separate tab so running episodes
are not interrupted. This is a page-memory practice session, with no grader or
benchmark history. Reset/refresh clears the tab, and sibling tabs stay independent.

The sandbox and server share the same transition/search engine, extracted without
semantic changes. Three new unit checks cover transition parity, ownership,
idempotency, stale writes, immutable reads, search and independent sessions. Two
browser cases cover messaging, edits, reactions, saving, pins, threads, search,
DMs, topics, descriptions, reset, new-tab entry and narrow-screen containment.
They assert no actor/provider API requests. Manual browser checks also exercise
the actual message composer and topic dialog. No paid inference is needed.
The release gate passes **106 backend/harness checks and 69 browser checks**.
The shared-engine refactor also passes the existing independent grader challenge
suite; none of the task rewards or fixture contracts was changed.

## Screenshot failure isolation and compact sidebar — 2026-10-01

An authenticated production reproduction with the operator's existing Ramp key
confirmed the reported failure: `gpt-6-luna` / accessibility / `channel-topic`,
seed 42, stopped after two actions on a 2.5-second `page.screenshot` timeout.
The run was `d51ac958-ca89-49d8-b94a-39882528b081`, with two provider requests,
$0.0010997 estimated spend and a verified event chain. This is a failed development
smoke, not a model task failure or reliability estimate. Its private raw evidence
remains under ignored `.runtime/hosted-smokes/`; no key is published.

The observer capture inherited the short action deadline and its exception escaped
into the model loop. The final screenshot could also overwrite an already valid
grade. New failure-injection regressions failed before the fix. The runner now
separates optional observer captures from required observations, records evidence
gaps, avoids a discarded setup PNG, and uses explicit capture deadlines. Pixel
observation failures still stop the policy. See [the capture contract](hosting.md#capture-failures).

The sidebar now has one compact model row and a small live-action strip. Terminal
results replace that strip rather than duplicating it, empty failed-action lists
are omitted, and the top bar reports the episode outcome rather than calling
every finished schedule “Complete.” Desktop/mobile browser checks cover the
compact idle geometry, result title fit, and terminal status consistency. Fake
transport screenshots remain rendering evidence, not real model results.

The release gate passes **98 backend/harness checks and 67 browser checks**.
New regressions inject initial, mid-run and final observer failures, verify
continued task success and visible audit gaps, and separately verify fatal pixel
observation failures and explicit deadlines. Post-deployment real-model results
are recorded separately below when available.

The first post-deployment accessibility run (`341957be-8d48-42d1-94a7-a124145c2dab`)
had no capture warnings, but Router returned `status: incomplete` before any
action. Its unreconciled reservation was $0.0017891; billing is unknown. The
old receipt discarded the incomplete reason, so token exhaustion for that
particular response is unproven. One separate, manually requested replay of the
same prepared request completed (3,494 input / 271 output, including 216 reasoning
tokens; estimated $0.0004849), with no workspace action executed.

The hosted output default was only 512 tokens, shared with internal reasoning.
Following [the Responses token-budget contract](https://developers.openai.com/api/docs/guides/reasoning),
hosted requests now permit 4,096 tokens without increasing per-run dollar/time
caps or altering reasoning effort. This is a configuration hardening, not proof
that every incomplete response was caused by the old cap. A new red-to-green
transport test verifies allowlisted incomplete reasons, validated usage and no
partial-action execution; arbitrary provider strings are not copied to errors.
The combined gate passes **99 backend/harness checks and 67 browser checks**.

With the larger allowance, run `89716590-78b9-4090-bb37-fec1192e6a0a` completed
the same accessibility task in four actions/four calls (39.7 seconds, $0.0035369
estimated, usage reported, both outcome checks passed). It still had two observer
PNG timeouts, so the smoke correctly exited nonzero for incomplete image evidence.
This confirms that capture failure no longer kills the text policy, not complete
capture reliability. Twenty live frames and the actual-UI replay state survived.

The next targeted experiment paused Chromium's live screencast around each exact
PNG capture and resumed it even on failure. Unit tests enforced that ordering;
the full hosted browser tests exercised real screencast plus PNG behavior. A live
post-deployment run was required to test the cloud-contention hypothesis.
The coordination release gate passes **101 backend/harness and 67 browser checks**.

That hypothesis failed in production. Run `31039bdf-598f-41cf-b329-85349a73dbde`
passed both task checks in four actions/four calls (44.0 seconds, $0.0035329
estimated, usage reported), but the same two PNG timeouts remained and only one
live frame arrived. Its smoke exited nonzero. The pause/resume change was removed.

The replacement keeps the stream running and requests a fresh native Chromium
viewport PNG, with page activation, font readiness and capture sharing one finite
deadline. It does not substitute a cached frame. Unit checks cover fresh bytes,
capture rejection, no stream restart and an unresponsive capture deadline.
Local tests alone do not establish cloud capture reliability; post-deployment
results are recorded below when available.

The first full native-capture browser suite exposed an additional delivery bug:
the four-action 1v1 lane ended before its final audit, while the short lane
completed. Larger native PNGs made the synchronous final evidence batch exceed
the two-megabyte stream queue guard. The final PNGs and audit now wait for stream
drain between writes, with cancellation and a five-second drain deadline. A
deterministic slow-writer check covers large artifacts and cancellation, and
the real hosted-browser scenario must pass without retries before release.

The next full suite passed the 1v1 scenario but had one unrelated test-fixture
failure before page creation (`apiRequestContext ... browser has been closed`).
The raw trace was preserved privately. No UI assertion ran for that failed case;
no production behavior was changed to mask it and test retries remain disabled.
The subsequent complete gate passed **103 backend/harness and 67 browser checks**,
including the no-capture-warning hosted check, 1v1, and credential opt-out.
The hosted smoke additionally requires multiple live frames, PNG artifacts and
completed episode statuses, not just a passing diagnostic grade.

Native surface capture did not eliminate the cloud stall. Run
`e166e1cf-474e-4a39-a1a6-e61db8e7c4f8` passed both outcome checks in five
actions/five calls (49.5 seconds, $0.0060344 estimated, usage reported), with
18 live frames and three PNGs. Step four and final PNGs timed out specifically
in the native capture phase; the smoke correctly failed. The stream and final
audit completed. A final bounded capture experiment switches only the native
source to `fromSurface: false`, the view path exposed by
[Chromium's capture API](https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-captureScreenshot).
This was not a cached-frame fallback and still required the same viewport and
fresh-image checks. It failed locally: the hosted replay could not find its
initial PNG, and a separate 1v1 teardown hit a closed-browser fixture error.
The native view experiment was reverted without deployment or paid inference.
Its private trace was retained; native surface capture remains the shipped path.

### Closeout boundary

The run-aborting screenshot failure is fixed and the duplicate/oversized sidebar
is removed. Three consecutive production task episodes passed after output
headroom and observer isolation, but none had fully complete PNG evidence. The
last production test (`e166e1cf…`, source `6380510`) delivered 18 live frames,
three exact PNGs, actual-UI replay snapshots and a verified final audit. That is
not a clean screenshot-capture pass, a pixel-policy verification, or a population
reliability claim. The strict hosted smoke continues to fail on capture gaps.

Known provider-usage-based estimates across all live debugging calls sum to
$0.0146888. One rejected receipt has unknown billing and a retained $0.0017891
reservation, not a known charge. No provider retry or model substitution was
introduced. Private keys and raw recordings remain excluded from Git.

## Compact result typography — 2026-09-30

Result titles now stay on one line, use Camber semibold (600) at 18px, and
step down to 16px in the narrow tablet sidebar. The small result label uses
medium (500). Other Relay headings and the Slack workspace are unchanged.
Browser checks verify single-line text geometry, no right-edge clipping and
both font weights at 1440, 900, 375 and 320px for incomplete and provider-blocked
results. `relay-result-compact.png` is a fake-transport rendering check, not
model-performance evidence. No new motion or paid inference was introduced.

## Router rejection and result presentation — 2026-09-30

A user-reported Router 403 exposed a misleading result card: “WORKSPACE VERIFIED”
and “Task incomplete” appeared despite zero agent actions. New deterministic
transport and full hosted-browser reproductions failed against that behavior
before the fix. A 403 now produces **Provider unavailable / RUN BLOCKED**, with
the returned request ID, manual model-selection recovery and no automatic retry
or substitute model. Replays and comparison rows use the same presentation rule,
including older stored 403 records without rewriting them. Error episodes cannot
count as passes even if their diagnostic final-state snapshot happens to pass.

Unknown token usage no longer displays as zero. Unknown cost remains unknown;
the footer identifies its conservative local budget allowance as **not a provider
charge**. Reservations remain in budget accounting: a failed request is not
silently counted as free. Terminal errors clear the in-flight flag. Raw provider
error bodies remain excluded because they can echo credentials or prompts.

The release gate passes **93 backend/harness and 67 browser checks**. The new
browser case verifies one rejected request, zero actions, unknown accounting,
model-menu recovery with no request on selection, then a manually started second
run using a fake responding model. It distinguishes that completed-but-wrong
outcome from provider blockage. The screenshot `relay-provider-blocked.png` is
from this fake transport, not a live outage recording.

The full release pass also exposed an ambiguous older reply-test locator: it
matched both the committed message and the composer while the composer was
clearing. The check now targets the message article and separately verifies the
empty composer; no retries or longer timeouts were added.
The menu keyboard check also waits for the selected option to receive focus
after reopening before sending Home, instead of treating CSS readiness as
keyboard readiness.

Router's [documented 403 meaning](https://docs.router.com/api/errors-and-limits)
is provider unavailability; 401 and 402 have distinct key/credit meanings. The
original provider-side reason cannot be recovered from the previous discarded
error body, and this update does not claim to change account permissions or make
an unavailable provider available. No real provider calls were made for this fix.

## Multi-step task expansion — 2026-09-30

The catalog now contains 18 tasks: six unchanged v1 controls and 12 separately
versioned v2 workflows. They combine source retrieval, current-versus-stale
disambiguation and 3–6 required mutations across channels, threads and DMs. See
[the task suite](task-suite.md) for every outcome contract and the explicitly
bounded model-pilot plan.

Verification passed **89 backend/harness checks and 66 browser checks**. This
includes all 18 API reference tasks on two seeds, 24 new full browser workflows
(12 tasks × two seeds), and three additional workspace interaction regressions.
The separate [grader challenge report](../evidence/workflows/grader-challenges.json)
accepts **84 correct outcomes and rejects 2,583 deliberately wrong final states**
across seven seeds. Additional tests accept valid alternative action orders and
fully undone actions, consistent with the declared final-state reward policy.

New browser recipes mutate only through the actual UI, reload persistent state
and independently export/grade the outcome. Portable trajectories include
per-mutation UI snapshots and the original event log; final screenshots are
collected in [the reference inventory](../evidence/reference/summary.json).
These recipes are builder-informed scripts, not blind model runs. **No paid
inference, RL training or GPU work was performed for this expansion.** Existing
real-model success/failure recordings remain unchanged.

The tests found a real quick-switcher Enter propagation bug: restoring focus
could submit the underlying search. The fix prevents the default key action and
propagation. Menus/dialogs now manage focus and nested Escape; saved-thread links
open their actual thread; scoped drafts survive navigation; delayed search results
cannot replace newer results; rapid sends commit once. A new dedicated test store
per suite also fixes the repeated-run 256-session-cap problem described in the
earlier entry below. Normal teardown removes only that suite's disposable data.

Intermediate failures are not concealed as model errors: initial test locators
matched multiple headings/search hits, a helper confused the pre-existing
`new-team` ID with generated messages, and a formatting test used Control+A
instead of the platform-neutral select-all chord. Those test defects were fixed.
The deeper API reference also exposed that four-turn retention discarded its
source records; reference scripts now retain their history, as documented, while
real models' full/recent-4 behavior is unchanged.

Pins, Details and a decision-record workflow were also exercised interactively
in the in-app browser. This is a development UI check, not an independent agent
benchmark or full accessibility certification. Seed variation is not semantic
holdout coverage; all new templates are public. The original presentation and
historical measurements below remain dated evidence, not updated performance
claims for the larger fixture.

## Full-width observer frame — 2026-09-30

The Slack frame now fills the observer stage edge to edge without side gutters.
Its 8:5 proportions are preserved: the surrounding page can grow vertically,
rather than cropping or stretching recorded actions. Agent viewport, observation
boundaries, coordinates and saved artifacts are unchanged. Desktop and mobile
geometry assertions accompany the existing hosted run/history test; the checks
use fake providers and do not spend model credits.

## One-click Live setup — 2026-09-30

Published prices and saved connections now load automatically across solo,
Compare and 1v1. The manual pricing form is gone. Run/Start respond immediately,
remain single-flight under double clicks, expose loading/cancellation states and
keep Stop separate. Startup no longer labels the reference screenshot as live.
See [the interaction contract](interface-controls.md) for pricing provenance,
bounded fallback, key-scoped cache, opt-out races and reduced-motion behavior.

All **71 backend/harness and 39 browser checks** pass. New cases cover exact-ID
pricing, expiry, metadata deduplication, server replacement of manipulated client
prices, debounced pastes, shared lanes, opt-out during debounce, double-click
launches and cancellation before browser allocation. These use fake transports,
not paid model inference. Public pricing parsers were also checked against the
current provider documents (67 Ramp entries and three documented Jev IDs/aliases).

The UI was inspected interactively with a local fake provider. The new
`relay-one-click-arena.png` and `relay-starting.png` images show setup/pending
states, not model performance. Existing real-model recordings are unchanged.

## Custom icon menus — 2026-09-30

Relay Live now uses styled, icon-led menus across its run controls, settings,
arena and replay surfaces. Task/interface glyphs and bundled model-lab logos
appear in both selected controls and their options. The Slack environment is
unchanged. See the [menu contract](interface-controls.md) for scope, keyboard and
dialog behavior, motion decisions, bundle cost and verification boundaries.

Three new browser cases exercise pointer/touch and keyboard navigation,
typeahead, focus restoration, nested Escape, viewport fit, long catalogs,
disabled Jev options and reduced motion. Existing remembered-key, arena and
replay checks now operate the custom controls. All **65 backend/harness and 35
browser checks** pass. No live inference was performed.

## Remembered provider connections — 2026-09-30

At the user's request, successful connections can now persist keys in dedicated,
unencrypted localStorage (Remember defaults on). This supersedes the original
reload-forgets-key behavior below. History, audit, replay and downloads remain
key-free; restoration discovers models only and never launches inference.

New unit and browser checks cover provider separation, replacement, opt-out,
forgetting, solo/1v1 reuse, corrupt records, revoked credentials, blocked storage,
and forgetting during an in-flight connection. All provider traffic in these
checks uses fake transports; no real credentials or paid inference are used.
All **65 backend/harness and 32 browser checks** pass. The trust/retention tradeoff
is disclosed in the UI and [hosting guide](hosting.md).

A repeated pre-release run hit the shared local test store's 256-session cap;
one arena check also reported a closed browser context. The test-only store was
retained under a backup name and the full suite rerun with a fresh store, passing
without changing application limits or adding retries. Repeated local test runs
still need a fresh test store; this release does not claim to fix that harness
lifecycle limitation.

## Welcome refinement — 2026-09-30

The welcome headline is “Computer Use Playground.” with the Slack/computer-use
eyebrow removed. The idle “Waiting for a decision” label is 15px medium; actual
action titles retain their existing prominence. Browser regressions cover the
copy, absent eyebrow, idle/action sizing and mobile welcome layout. This update
changes no workflow or model evidence.

The follow-up copy is “Try out Computer Use” without a trailing period. Only
“Computer Use” uses Relay's existing purple (`#62416f`); “Try out” remains
graphite. The same desktop/mobile test checks the exact wording and both colors.

## Relay identity — 2026-09-30

The [original Relay mark](brand.md) now appears beside the Live and Lab wordmarks
and as the favicon across Live, Lab, Slack and replay entries. SVG, 16/32px ICO
and 180px touch assets are local and cache-busted. The 59 backend/harness and 28
browser checks include logo decoding, icon MIME types and sizes, consistent
entry metadata and mobile layout. This update runs no live model inference.

## Relay typography — 2026-09-30

Relay Live and the local Lab now use the user-approved, self-hosted Camber files.
Headings use positive `0.015em` tracking; the wordmark no longer uses negative
tracking. Slack's application and replay frame keep Slack-Lato, and structured
audit data keeps monospace. The supplied Camber cut has limited glyph coverage;
Lato is the fallback. Font provenance and separate proprietary rights are recorded
in [third-party notices](../THIRD_PARTY_NOTICES.md#camber--relay-interface).

All **59 backend/harness and 28 browser checks** pass. Regression assertions
verify loaded Camber regular/bold faces in both operator interfaces, inherited
control typography, positive header tracking and the unchanged Slack frame font.
Desktop and mobile screenshots were refreshed; replay was also exercised in the
in-app browser. This cosmetic update made no inference calls and changes no task,
grader or historical model evidence.

## Replay studio + 1v1 arena — 2026-09-30

This update passes **59 backend/harness checks and 28 browser checks**. New cases
verify matched arena outcomes, provenance/condition mismatches, missing receipts,
two isolated histories, and actual-UI replay with restored dialog/input state.
Playback tests cover play/pause/restart/backward seek, zero model or actor API
requests, legacy fidelity labels, mobile fit and reduced-motion behavior.

The [no-inference reference recording](../evidence/replay/reference-topic.json)
contains five captured UI states and a verified event chain. It is a scripted
example, not new model evidence. Existing real hosted pass/fail recordings remain
unchanged and are available in the replay library at their original fidelity.
The arena screenshot is a **fake-provider contract test**, not a real Jev victory.

The interface was also exercised directly in the in-app browser; that found and
fixed replay dialog overflow. The [replay/arena contract](replay-and-arena.md)
documents state fidelity, measurement limits, motion choices and code ownership.
No paid inference, RL training or GPU work was performed for this UI update.

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
