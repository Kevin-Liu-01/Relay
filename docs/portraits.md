# Workspace portraits

Six fictional adult portraits were generated for Relay on 2026-10-02 using
OpenAI's built-in image-generation tool. They do not depict identified people,
Slack employees or real workspace members. They are not stock photographs or
the private prototype's sample images.

## Delivery

- The same stable fixture IDs map to the same bundled portraits in messages,
  threads, member stacks, DMs and the signed-in user's avatar.
- Each asset is a 256×256 WebP, served from the application's own origin. No
  external image service, random portrait URL or runtime generation is used.
- Decorative images do not duplicate accessible names. Initials remain visible
  if an image fails; presence dots remain separate from the photograph.
- Practice, live actor sessions and actual-UI replay use the shared renderer.
  Original captured screenshots and model evidence are **not** rewritten.
  This changes pixel observations for future runs, not task state or graders.
- [Asset hashes and sizes](../src/assets/portraits/provenance.json) include both
  generated originals and optimized output. The repo ships the optimized files.

## Generation prompts

Each image used this shared prompt, replacing `[ID]` and `[SUBJECT]` with its row:

> Use case: photorealistic-natural. Asset type: one Slack-style profile avatar
> for a fictional demo-workspace colleague ([ID]); no real person is being depicted.
> [SUBJECT] A relaxed, approachable expression with a small natural smile, looking
> at camera. Realistic casual editorial headshot, soft window light, natural skin
> texture, no beauty smoothing. Square composition, head and shoulders, face large
> and centered, entire hair silhouette visible with a little padding, crop just
> below shoulders. Flat softly lit solid-color background. Optimized to stay
> recognizable in a 36px UI thumbnail. One person only. No text, border, logos,
> watermarks, circles, contact sheet, or extra objects.

| ID     | Subject                                                                                                                                                          |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| alex   | A fictional adult man with warm medium brown skin, short dark curly hair, subtle stubble, wearing a slate-blue cotton shirt. Soft pale blue-gray backdrop.       |
| maya   | A fictional adult woman with light-medium skin, straight dark bob haircut tucked behind one ear, wearing a cream casual crewneck. Soft warm terracotta backdrop. |
| jordan | A fictional adult with dark brown skin, close-cropped natural black hair, round thin glasses, wearing a forest green overshirt. Soft pale lavender backdrop.     |
| sam    | A fictional adult man with olive skin, shoulder-length wavy dark hair, neat mustache and short beard, wearing a sand-colored shirt. Soft pale sage backdrop.     |
| priya  | A fictional adult woman with medium brown skin, long dark wavy hair, small simple gold earrings, wearing a burgundy knit top. Soft pale rose backdrop.           |
| leo    | A fictional adult man with light-medium skin, short black hair loosely parted to the side, wearing a navy T-shirt. Soft warm pale ochre backdrop.                |

## Re-export

`node scripts/portrait-assets.mjs /absolute/path/to/sharp/package.json alex=/path/to/alex.png maya=/path/to/maya.png jordan=/path/to/jordan.png sam=/path/to/sam.png priya=/path/to/priya.png leo=/path/to/leo.png`

This deterministic image export preserves originals and updates the output hashes.
Generating new people is a separate creative operation; the prompts do not imply
byte-identical regeneration. Normal builds need no image-processing dependency.
