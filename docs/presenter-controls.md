# Presentation controls

The document viewer adds navigation and rehearsal tools to the existing
20-slide deck. It does not change experiment data or make model requests.

- Click the slide counter, press G, or press / to search all slide titles and
  topics. A number selects that exact slide. Enter opens the first result.
- Arrow keys and Page Up/Down move between slides. Home/End select the first
  or last slide. Shortcuts do not intercept typing, table controls or dialogs.
- Notes opens the existing speaker notes for the current slide, with the next
  slide's title. Notes are visible on the same screen, not private presenter output.
- The rehearsal timer starts only when clicked. It can pause, resume and reset.
  It does not measure agent execution or persist across page reloads.
- Present fits the slide to the available window and requests browser fullscreen.
  If fullscreen is denied, window fitting still works. Escape exits. Phone layouts
  remain scrollable so controls and text do not shrink into an unreadable slide.
- Tools provides a canonical slide link, the PDF and keyboard shortcuts. Clipboard
  denial selects the link for manual copying. Existing named and numeric links work.

## Implementation

`docs/presenter.js` owns viewer state. `docs/presenter.css` owns its styles.
The builder embeds both into the offline HTML and extracts the script for the
hosted site's existing content security policy. No new package is required.
The shared results page skips presenter initialization because it has no slides.

`scripts/lib/presenter-notes.mjs` compiles the numbered sections of
`docs/presentation-notes.md`. It checks section order, escapes raw HTML and
allows only HTTP(S) links. There is no second editable copy of the notes.

Overview and tools use native modal dialogs. Closing restores the trigger's
focus; choosing a slide focuses its heading. Phone notes temporarily remove
covered slide controls from keyboard navigation. Printing hides all presenter
surfaces and retains the existing 20-page export.

## Interaction and motion contract

- Route: `/presentation`, all named anchors, plus offline generated HTML.
- Navigation: immediate for keyboard and reduced-motion users. Pointer navigation
  has a 150 ms opacity-only transition using the Web Animations API.
- Rapid navigation cancels the previous slide animation before showing the next.
  There is never an outgoing interactive slide underneath the active slide.
- Fullscreen entry is guarded while its promise settles. Fit changes are not
  animated; a resize observer recomputes scale after layout or note changes.
- Dialog and search changes are immediate. No spring, stagger, background motion,
  or animated page scaling is added to this repeated-use interface.
- Browser checks cover desktop, short windows, 390 px and 320 px screens,
  keyboard focus, reduced motion, print, fullscreen denial and clipboard denial.

Run the committed presentation, presenter, repeated-interface and results browser
tests in an isolated validation copy. Never rebuild the frozen root actor `dist`.
