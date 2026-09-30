# Relay mark

The original geometric **R** pairs a white loop with a lilac outgoing leg, suggesting
a handoff. A graphite rounded tile matches Relay's controls and stays visible in
light and dark browser chrome. The shape is drawn as paths, not a font glyph or a
third-party logo; it has no font dependency.

- Editable master: [`relay-mark.svg`](../src/assets/relay-mark.svg), 64×64.
- Browser fallback: [`relay-favicon.ico`](../src/assets/relay-favicon.ico), 16×16 and 32×32.
- Touch/bookmark icon: [`relay-touch.png`](../src/assets/relay-touch.png), 180×180.
- Live and Lab wordmarks use the same SVG at 30px and 28px. The adjacent text names
  the link; the image has empty alt text to avoid repeating “Relay.”
- All four HTML entries declare the same icons. Vite emits same-origin hashed
  URLs instead of inlining them; local servers return the correct image types.

Raster exports are checked in, so a normal build needs no graphics dependency.
After editing the master, run `node scripts/brand-assets.mjs` with `sharp` available,
or pass the absolute path to an existing `sharp/package.json`. The current exports
use sharp 0.35.4. This generator emits both ICO resolutions and the touch icon
without changing the SVG. No external asset download or paid generation is needed.

Browser checks verify decoded header images, matching favicon/logo URLs, MIME
types, ICO dimensions, the touch icon size and the replay entry. The normal mobile
layout checks still apply.
