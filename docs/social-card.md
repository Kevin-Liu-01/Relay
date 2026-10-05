# Social preview and README graphic

The graphic introduces Relay to someone who has not opened the app. Its headline
names the purpose: test computer use agents. A simplified Northstar topic edit
shows the environment and action. The expected-result strip explains what the
task requires. This is a product illustration, not a screenshot or trial record.
It makes no performance, cost, model-ranking, or free-access claim.

## Files

- `social-card.template.svg`: editable layout and text.
- `architecture.svg`: self-contained SVG with exact fonts, marks, and portraits.
- `relay-social.png`: 1200 × 630 social preview.
- `relay-social@2x.png`: 2400 × 1260 README image.
- `social-card-provenance.json`: source and export SHA-256 hashes.

Regenerate from the repository root with `node scripts/social-assets.mjs`.
The renderer loads bundled assets and fonts without network requests. It checks
font availability and text bounds before exporting both resolutions.

`scripts/hosted-assets.mjs` copies the 1200-pixel PNG into a content-hashed asset
path. It adds static Open Graph and Twitter card tags to the homepage, live,
hands-on, presentation, results, and review documents. Each page has its own
title and description. Shared URLs contain no keys, run IDs, or query parameters.
Changing the PNG changes its public asset URL. Platforms may still cache a page's
previous preview until they fetch it again.

## Sources and rights

- Relay and Northstar use the exact project SVG masters. See [brand](brand.md).
- Camber is used under Kevin's recorded permission for Relay. Its font files
  retain their existing restrictions and are not relicensed by this graphic.
- Slack UI text uses the bundled Lato fonts under their existing OFL license.
- Alex and Maya are the project's generated fictional portraits, not stock
  photos or real Slack users. See [portrait provenance](portraits.md).
- The input files and hashes are recorded in `social-card-provenance.json`.
  See [third-party notices](../THIRD_PARTY_NOTICES.md) for font terms.

An image-generation exploration informed the composition. Its raster, invented
logo, and UI text are not shipped. The final layout is code-native SVG using
the project's actual assets and editable text. No external stock image is used.
The design was reviewed at 1200, 600, and 300 pixels wide. Fine UI labels provide
context at full size; the product name, headline, and dialog carry the small card.
