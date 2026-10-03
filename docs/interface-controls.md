# Relay menus

## Workspace interaction coverage

The Slack-like workspace now has real Pins/Messages views, a DMs people directory
and a Details dialog with members and editable channel descriptions. Personal
`is:saved` search and saved/search thread links preserve the correct context.
Drafts remain conversation/thread-scoped until page reload. Sends and mutations
acquire synchronous locks; pending composers are read-only. Out-of-order search
responses cannot overwrite newer results. Enter in the quick switcher prevents
the event from also submitting a search or reactivating the restored opener.

Message menus/reaction popovers support arrow/Home/End navigation and Escape;
closing a nested menu does not also close the thread. Dialogs trap Tab and restore
their opener. The [workflow suite](task-suite.md) exercises these behaviors,
including delayed requests, rapid duplicate sends, cancellation, formatting and
thread editing. This is targeted accessibility verification, not certification.

## Full-width workspace viewer

Once starting or displaying a run, the observer stage uses the agent frame's
1440×900 (8:5) proportions at the full available width. The page grows vertically
when needed rather than adding side gutters, cropping controls or stretching
text. The decision panel follows that height; its lists remain scrollable. Mobile
uses the same full-width frame with the decision panel below. The welcome layout,
fixed agent viewport, pixel coordinates, capture artifacts and model inputs are
unchanged. Arena and actual-UI replay already use proportional stages.

The hosted browser regression checks all four image edges and undistorted frame
proportions at 1920×1080, 1440×900, 800×900 and 390×844, including a saved run. The desktop
image `relay-full-width-desktop.png` is a fake-provider UI check, not model evidence.

## One-click connections and launches

Pasting a valid-looking key connects after 600ms without further typing. The
Connect button can submit immediately; both routes share the same in-flight
request. Only a successful account discovery saves the key, respecting the latest
Remember preference even if it changes during the debounce. Discovery never starts
inference. A failed request is not automatically retried.

`connections.js` shares account metadata across solo, Compare and both 1v1 lanes
for five minutes, scoped to the exact provider/key pair and held only in tab
memory. Switching providers reconnects a saved key automatically. Both arena
lanes start ready from the current connection; an empty sibling inherits a newly
connected key of the same provider. Distinct keys remain distinct. Forget cancels
pending discovery and invalidates all cached keys for that provider. Late replies
cannot resurrect a forgotten or edited connection.

`hosted/pricing.mjs` now prefers Router's authenticated `GET /v1/models` v1
metadata. `runner/router.mjs` retains only validated exact-ID base rates and a
fixed incompatibility reason, not arbitrary upstream metadata. Request-name,
schema version, lifecycle status, Responses support and finite positive prices
are checked. Catalog rates preserve source URL, timestamp and catalog hash per
model. They also retain distinct provider-variant prices (no prefix stripping).
New catalog formats or explicit invalid pricing fail closed. Jev's System One
entry needs the separate TypeSafe adapter, not the Responses transport.

For older Router catalogs without metadata and for TypeSafe, it joins
account-discovered IDs to exact IDs in the current
[Ramp model table](https://docs.router.com/supported-models) or
[TypeSafe model documentation](https://docs.typesafe.ai/models). Public docs are
fetched without credentials, deduplicated and cached for five minutes. A checked-in
2026-09-30 snapshot covers temporary documentation outages for at most seven days;
expired, unknown and undocumented provider/tier aliases are unavailable, never
assigned a guessed or zero price. Jev's documented aliases resolve through the
documented version. Rates are USD per million tokens, with source, date and hash
preserved in the run catalog. Costs use published base rates, not account invoices;
special tiers, caching and contractual discounts can differ. The server binds
freshly resolved rates before browser allocation; client-edited rates cannot lower
budget accounting. The local CLI/Lab retains its explicit experiment rate config.

Run and Start 1v1 acquire a synchronous lock before any request, show Starting…
immediately, stay disabled through execution and history saving, and absorb a
600ms double-click window measured from launch. They stay visibly busy for any
remaining part of that window; there is no hidden cooldown after Run becomes
enabled. Stop is a separate adjacent control: the
same second click cannot accidentally cancel. There are no automatic inference
retries. Pending startup clears the reference screenshot rather than presenting
it as a live frame. Status text and `aria-busy` accompany the CSS spinner;
reduced-motion users get static status without rotation. Keyboard operation uses
native buttons, not a pointer-only gesture.

## Consecutive runs and outcome clarity

Each solo/queued launch replaces the entire observer stage with a fresh keyed
host element, clearing decoded images, cursor, selected step, episode and audit
selection. Evidence is request-local. Normal queued requests wait for the
previous stream to close (after worker cleanup) and history to save before
starting the next. Unknown usage, missing audit or failed storage still stops the
queue; cancellation is not an inference retry and in-flight usage may be unknown.
1v1 deliberately retains two isolated lanes, each with a new stage per match.

History/replay loads are navigation-versioned or invalidated on unmount. A slow
recording cannot reopen over a later run or overwrite a newer selection. Replay
and 1v1 unmount the main spectator while open, so another workspace is not left
behind them. Closing restores the saved/main view without launching a model.

Compare and History use the same outcome badges: green verified pass, amber
incomplete checks, rose execution block, purple time/spend/request limit and a
neutral stopped/pending state. Icons and text accompany color. Blocked diagnostic
checks never become a pass; unknown cost stays unknown. Compare filters retain
that distinction and open the exact episode's evidence. On phones its rows
become cards, with outcome and model first. No stored reward or historical trace
is rewritten by this presentation layer.

`tests/browser/run-handoff.spec.mjs` reproduces delayed replay navigation and
immediate re-launch with deterministic fake receipts, and checks desktop/mobile
outcomes. The real-browser queue test gates the second request until the old
frame, cursor and result disappear, verifies at most one active request, and
checks separate run IDs, budgets, histories and verified audits. These checks
make no paid provider calls or model-performance claims.

`tests/pricing.test.mjs` checks exact-ID parsing, units, expiry, cache sharing,
forget/error recovery and authoritative rate binding. `tests/browser/one-click.spec.mjs`
checks debounced key entry, auto prices, shared lanes, opt-out timing, actual
double clicks, pending states and cancellation with fake transports. No paid
inference or independent model-performance claim is involved.

## Custom menus

Relay Live uses one `RelaySelect` component for tasks, models, interfaces,
context, both arena connections, replay episodes and playback speed. It replaces
visible native select menus, not the Slack application or its replay renderer.

- Task and interface options have individual Lucide SVG icons. Model options
  use the existing, bundled theSVG lab marks. Unknown model families use a bot;
  Jev uses a workflow glyph, not an invented vendor logo.
- A selected row has a checkmark and purple tint. Keyboard focus also has an
  inset outline; disabled choices remain visible and cannot be selected.
- The pinned MIT [Radix Select](https://www.radix-ui.com/primitives/docs/components/select)
  primitive supplies selection semantics, arrow/Home/End navigation, typeahead,
  focus restoration, scrolling and collision handling. Options are text, not
  injected markup. Long names wrap in the menu and truncate in the trigger.
- Menus inside native dialogs portal into that dialog so they remain in its
  top layer. One Escape closes the menu; a second can close the dialog.
- Empty model menus explain that a provider key must be connected. Jev's
  unsupported tasks/interfaces stay disabled. No menu interaction calls a model.

## Motion and verification

The menu uses Relay's Camber/purple palette, 12px corners and a restrained shadow.
Pointer-open menus enter from their trigger at 0.98 scale and fade in over 140ms,
using CSS transitions and the primitive's collision-aware transform origin.
Closure is immediate. Keyboard entry and reduced-motion mode skip transitions;
rapid reopen cannot leave a delayed exit overlay. No animation library was added.

The October 3 regression fix preserves keyboard focus when Home/End scrolling
moves a row underneath a stationary pointer. Radix's resulting pointer-leave
event previously moved focus to the listbox. Pointer-leave is ignored during
keyboard navigation; real pointer movement switches back to pointer behavior.
The original assertion was retained and passed five repeated runs before the
complete browser suite. This changes operator menus only, not the agent workspace.

`tests/browser/dropdowns.spec.mjs` covers desktop 1440×900 and emulated touch
390×844, option icons/brand diversity, pointer and keyboard selection, focus,
outside dismissal, nested-dialog Escape, long catalogs, disabled options, replay
controls and reduced motion. Preview models use a fake transport: these are
interface checks, not inference results or a manual screen-reader certification.
The design was also checked interactively in the in-app browser.

Adding the primitive increased the current Live JS chunk from about 22.7 KB to
51.4 KB gzip (build output, not a latency measurement). This buys shared tested
focus/positioning behavior rather than a new independent menu implementation.
See `evidence/visual/relay-dropdown-{task,models,mobile}.png` for the rendered states.
