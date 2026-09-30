# Relay menus

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
