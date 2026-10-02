# Third-party references and dependencies

Relay's application, fixture and task code was written for this assignment. No external Slack clone or benchmark source/task assets were copied. Slack is referenced to explain the workflow target; this project is not affiliated with Slack/Salesforce. The Northstar workspace, names and messages are synthetic.

Direct npm dependencies at the inspected versions:

| Package             | Version | License                                                  |
| ------------------- | ------- | -------------------------------------------------------- |
| React               | 19.3.0  | MIT                                                      |
| React DOM           | 19.3.0  | MIT                                                      |
| Vite                | 8.3.1   | MIT                                                      |
| Playwright Test     | 1.63.0  | Apache-2.0                                               |
| Playwright Core     | 1.63.0  | Apache-2.0                                               |
| @sparticuz/chromium | 153.0.0 | MIT (wrapper); bundled Chromium retains its own notices  |
| Prettier            | 3.9.9   | MIT                                                      |
| Lucide React        | 1.49.0  | ISC                                                      |
| theSVG React        | 3.3.9   | MIT (package code; brand marks retain applicable rights) |
| Radix Select        | 2.3.7   | MIT                                                      |

These are installed using `package-lock.json`; their upstream license files remain with the installed packages. Chromium and the Node container image have their own notices. Review transitive dependency notices for any binary redistribution. The submission archive contains source and lockfile, not `node_modules` or browser binaries.

Public repositories were used as research references only. The survey distinguishes permissive projects, missing/undetected licenses, and env0's AGPL-3.0 license. Detected GitHub metadata is a screening aid; it is not a substitute for reviewing full license terms before reuse. See `docs/research.md` and `evidence/research/repositories.json`.

Kevin's original code and documentation are available under the [MIT license](LICENSE),
authorized by Kevin on 2026-10-01. This does not relicense dependencies, proprietary
fonts or third-party brand assets. Their notices and restrictions below remain in force.

## Public release assets

The public Relay release retains Lato under the included SIL Open Font License,
uses Lucide (ISC) for interface glyphs, and theSVG for provider/technology marks.
Brand marks identify integrations, not sponsorship; each owner's trademark rules
still apply. Fixture avatars use original colored initials, not stock photographs.
Model-family marks from [theSVG](https://thesvg.org) cover OpenAI, Anthropic,
DeepSeek, Qwen, Gemini, NVIDIA, Mistral, Meta, xAI, Cohere and Moonshot. Unrecognized
families use a generic agent glyph rather than a fabricated company logo.
The proprietary icon font and sample photos from the private prototype are not
included in this repository or deployment. Historical evidence JSON may describe
the earlier build; its private screenshots are not redistributed here.

## Historical private visual-fidelity update (not shipped)

The private prototype used a **Slack v2** icon font and six sample photographs. Neither the icon font nor those photographs or screenshots containing them are included in the public repository. The historical trajectory JSON remains useful evidence of application behavior, but does not establish byte-identical public-release visuals.

Lato's SIL Open Font License is included at `src/assets/fonts/OFL.txt`, sourced from [Slack's published design assets](https://github.com/slackapi/assets-app-directory/tree/1276ee44c6f18f1c4009bfdb1f5924b8d59911e3/fonts/Lato). The downloaded font binaries are unmodified.

`src/assets/provenance.json` records sources, sizes and SHA-256 hashes for the retained font files. They are unmodified and served locally. UI and provider icons are bundled from the locked packages, not fetched at runtime.

## Camber — Relay interface

[Camber](https://emtype.net/fonts/camber) is by Eduardo Manso / Emtype Foundry.
The regular, medium, semibold, bold and italic WOFF2 files were supplied from
Kevin's existing mailroom project, with permission to reuse them and confirmation
of webfont-license coverage for `relay.kevinliu.studio` on 2026-09-30.
These proprietary assets are **not covered by Lato's OFL or a code license**;
inclusion does not grant a sublicense. Obtain your own appropriate
[Emtype license](https://emtype.net/licenses) before reusing them elsewhere.

The supplied source labels this asset set a limited-character trial cut. Its
bytes are preserved rather than presented as a full-character commercial build;
Lato supplies glyphs absent from the provided Camber files. Relay's operator
interface uses Camber, while Slack and its replay frame retain Slack-Lato and
audit/code blocks retain monospace.
