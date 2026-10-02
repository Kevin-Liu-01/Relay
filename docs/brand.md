# Relay mark

Relay's **handoff mark** is a pair of opposing hooked ribbons. Their diagonal
cuts leave a clear transfer point at the center: one action passed to the next.
Ivory (`#fff7eb`) and lilac (`#c7a6e8`) sit on a deep plum (`#35263f`) rounded
tile. Broad, flat shapes remain recognizable at 16px and in light/dark browser
chrome, without fine lines or gradients. This original vector replaces the
earlier generic R. It is not a font glyph or a third-party logo.

- Editable master: [`relay-mark.svg`](../src/assets/relay-mark.svg), 64×64.
- Browser fallback: [`relay-favicon.ico`](../src/assets/relay-favicon.ico), 16×16 and 32×32.
- Touch/bookmark icon: [`relay-touch.png`](../src/assets/relay-touch.png), 180×180.
- Live and Lab wordmarks use the same SVG at 30px and 28px. The adjacent text names
  the link; the image has empty alt text to avoid repeating “Relay.”
- All five HTML entries declare the same icons. Vite emits same-origin hashed
  URLs instead of inlining them; local servers return the correct image types.

Raster exports are checked in, so a normal build needs no graphics dependency.
After editing the master, run `node scripts/brand-assets.mjs` with `sharp` available,
or pass the absolute path to an existing `sharp/package.json`. The current exports
use sharp 0.35.4. This generator emits both ICO resolutions and the touch icon
without changing the SVG. No external asset download or paid generation is needed.

The presentation embeds the same master, and the README header carries the same
two-ribbon mark. Camber remains the interface/slide typeface; Slack retains Lato.
The fictional workspace portraits have [separate provenance](portraits.md).

Browser checks verify decoded header images, matching favicon/logo URLs, MIME
types, ICO dimensions, the touch icon size and the replay entry. The normal mobile
layout checks still apply.
