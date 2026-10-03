# Review traces and replay trials

## Complete inventory

**306/306 attempts** are available: 17 model routes × 18 tasks × one attempt,
with 152 passes, 61 incomplete outcomes and 93 blocks. The
[completion certificate](../evidence/campaigns/model-breadth-2026-10-03-continuation/verification.json)
binds every row to the original archives and final grades. All earlier 249 public
records remain byte-identical; the last 57 were added without replacing failures.
The complete library is 81.04 MB compressed, loaded one selected trial at a time.

## Open a trial

- Open [the trial library](https://relay.kevinliu.studio/demo/review.html), or **All 306 trials** on [slide 9](https://relay.kevinliu.studio/presentation#9).
- Every published attempt has **Review trace** and **Watch replay** links, including incomplete and blocked attempts. The catalog reports its actual recorded count; a planned cell is never presented as a recording.
- Choose a model and task, or move to the previous/next trial. Each selection has a shareable URL. Browser Back restores the previous selection.
- No key, model request, paid inference, browser-local run history or private workspace is needed.

## What each view contains

| View         | Contents                                                                                                                                                                                     |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Watch replay | Recorded Slack UI snapshots in the same inert workspace renderer; recorded pointer events; play, pause, step, scrub, speed and timing controls.                                              |
| Review trace | Every original event in order, with search and event-type filtering. Input events expose exact prepared model requests; responses retain externally visible model output and usage receipts. |
| Checks       | Original deterministic outcome checks. Blocked runs show diagnostic workspace checks, never a completed pass.                                                                                |
| Changes      | Initial-to-final state differences and both complete state snapshots. Arrays are compared as whole values. Intermediate states remain in the trace.                                          |
| Provenance   | Original campaign/run/episode, archive hash, public-record hash, source hash, artifact inventory, configuration, run-scoped budget and audit limitations.                                    |
| JSON         | Download the selected structured record. Original event hashes and timestamps are preserved.                                                                                                 |

Zero-action runs show their captured workspace and an explicit **No actions recorded** message. They do not get an invented sequence or play button. Release-sync and design-handoff carry their documented instruction-language caveats in the viewer.

The header counts **action attempts**, including rejected outputs and the finish
action—not just successful workspace mutations. Trace distinguishes parsed actions,
recorded model output and step errors. Repeated unchanged snapshots are retained;
they are not evidence that a rejected action changed Slack.

## Fidelity and integrity

This is recorded **UI-state playback**, not video or action re-execution. The current renderer restores recorded channels, dialogs, drafts, threads and scroll positions. Smart pacing and cursor smoothing are presentation transformations; recorded timing and raw pointer events remain inspectable. Missing captures are not fabricated. See [replay fidelity](replay-and-arena.md).

Each compressed record preserves all structured evidence for one episode: the original ordered event stream, requests, externally visible responses, initial/final states, captured UI states and evaluation. Hidden model reasoning, authentication headers and raw provider error bodies were not recorded and cannot be reviewed. PNG bytes are omitted from the public structured library to limit transfer/storage; their original hashes remain in the artifact inventory. The original full archives remain immutable, with two publicly downloadable breadth examples and the remaining originals retained locally. The structured library is not a replacement for those exact-byte archives.

The browser fetches only the selected record, bounds its compressed and decompressed size, checks its SHA-256 against the catalog, validates the model/task/seed/episode binding, and only then allows rendering. Catalog paths are allowlisted; query parameters cannot become arbitrary fetch URLs. Switching trials removes the old workspace immediately and cancels the previous load. A late response cannot replace the current selection.

Hashes establish local consistency, not independently signed authenticity. Artifact hashes refer to original archive files, not the derived JSON. In preserved multi-episode runs, the original configuration and budget retain their **run-wide** scope; the trial header uses the selected episode's accounting. Estimates and unresolved reservations are not invoices.

## Reproduce locally

```sh
npm ci
npm run build:hosted
npm run live
# Open http://localhost:4340/demo/review.html
node --test tests/trial-library.test.mjs
```

The checked-in public records are sufficient for review. There is no need to call a provider or possess the local original archives.

Maintainers with all original archives can regenerate the library after completing the campaign audit:

```sh
node scripts/verify-breadth-completion.mjs model-breadth-2026-10-03-continuation
node scripts/export-trial-library.mjs
```

The exporter requires the completion certificate to match the exact summary. It checks original archive hashes, safe archive members, the original audit and secret screening. Existing records cannot be silently rewritten. `--partial` explicitly exports only completed attempts and never claims full coverage; it is for development previews. A complete presentation build requires complete matching coverage.

`node scripts/preview-trial-review.mjs` serves a read-only development preview on 4352 without replacing the benchmark worker's frozen `dist` assets. Its inference endpoint is disabled. The static reviewer lives under `docs/review-app` so its implementation did not change the source fingerprint during collection.
