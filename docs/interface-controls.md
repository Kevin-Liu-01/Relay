# Relay menus

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

`hosted/pricing.mjs` joins account-discovered IDs to exact IDs in the current
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
600ms post-completion double-click tail. Stop is a separate adjacent control: the
same second click cannot accidentally cancel. There are no automatic inference
retries. Pending startup clears the reference screenshot rather than presenting
it as a live frame. Status text and `aria-busy` accompany the CSS spinner;
reduced-motion users get static status without rotation. Keyboard operation uses
native buttons, not a pointer-only gesture.

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
