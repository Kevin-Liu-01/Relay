# Verification and evidence

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
