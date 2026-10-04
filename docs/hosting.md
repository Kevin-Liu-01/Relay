# Relay Live · hosted BYOK

To use the mocked Slack UI yourself, open **[Try Slack](https://relay.kevinliu.studio/play)**
or the **Try Slack** link on the home page. It opens a separate tab, including
during an agent run, so your interactions cannot alter the evaluated workspace.
No key, model request, server browser or database allocation is needed. The same
React UI and transition/search rules run against fictional data in page memory;
each tab is independent, and **Reset** or refresh returns it to its initial state.
On narrow screens the Slack workspace pans within its own area; the Relay and
Reset controls stay visible. It is a practice sandbox, not a scored session,
durable chat service, or shared workspace. No messages are sent to real Slack.

Open **[relay.kevinliu.studio](https://relay.kevinliu.studio)**. Choose **Connect a key**, select **Jev · TypeSafe** or **Ramp Router**, and enter that provider's key. Model discovery uses your account, not a fabricated model list. Select a task, model and interface, then **Run**. A TypeSafe key is sufficient for Jev; no SGLang server, GPU or H100 allocation is required.

The large screen is the agent's actual browser, streamed while it works. It is read-only for the observer. The right panel shows Jev's returned action probabilities or a generative model's recorded actions. Replay, Audit, History and Compare stay out of the workspace until needed.

The expand icon puts the workspace in a distraction-free, aspect-correct view;
Escape restores the panels and **Stop run** remains available. Browser input
positions and click feedback are drawn only on the viewing surface. API runs have
no fabricated cursor. Frame delivery coalesces to at most 12.5/s and preserves the
trailing update; decoded images replace the previous frame without blanking it.
Sequence numbers fence late images within each episode. The age label reports
when no fresh frame has arrived; it is not proof of a disconnected worker.

**1v1** runs two matched, request-isolated systems side by side. **Replays** offers
no-key examples and your saved runs, played through the actual read-only Slack UI.
The current action and independent outcome checks have dedicated cards. See the
[match and replay contract](replay-and-arena.md), including legacy capture limits.

## Run the same interface locally

```sh
npm ci
npx playwright install chromium
npm run build:hosted
npm run live
```

Open `http://localhost:4340`. This path accepts keys in the UI; it does not load a shared provider key from `.env`. The original local operator lab on port 4330 remains available for larger matrices, CLI runs and raw audit archives. The cloud limits below do not apply to that separately configured local runner.

## Where data goes

```mermaid
flowchart LR
  B[Your browser: key in memory] -->|HTTPS request| F[One bounded worker request]
  B -->|Remember enabled| K[Local storage: provider keys]
  K -->|Reload: discover models only| B
  F -->|Key + model input| P[Selected official provider]
  F --> W[Private Chromium + SQLite workspace]
  W --> F
  F -->|Live frames + audit| B
  B --> I[History: browser IndexedDB]
  B --> D[Download: evidence JSON]
```

- The key is sent to Relay's worker and only the selected provider's fixed official API. It is not a browser-to-provider direct connection. Keys and authentication headers never intentionally enter server persistence, run history, audit, replay or downloads. JavaScript memory is not guaranteed to be securely zeroized.
- **Remember keys on this device** is enabled by default, per the operator's requested behavior. After a successful connection, the latest key per provider is saved in the `relay-credentials-v1` localStorage record, separate from IndexedDB evidence. Solo and 1v1 connections share it. Reload restores the last connected provider and discovers its account models; it never resumes a run or starts inference. Editing or unsuccessfully connecting a replacement does not overwrite the saved key.
- Local storage is **not encrypted** and scripts running on this origin can read it. Anyone with access to this browser profile may use it. Avoid shared devices. Unchecking Remember immediately clears all saved provider keys while leaving current in-memory connections usable. With remembering enabled, one key per provider is retained; if both arena lanes use different keys for the same provider, the most recently connected one is remembered.
- **Forget key** clears that provider's saved copy and the current UI connection, including matching arena lanes. It does not erase run history, revoke the provider credential or clear copies already held in another tab's memory. Clearing this site's browser data removes keys and history. Provider-side revoke/rotation remains your responsibility. A key previously pasted into a conversation should be rotated before continued use.
- Corrupt stored credentials are ignored. Blocked storage falls back to in-memory use with a visible warning on save/removal failure. A saved key that fails authentication remains available to update or forget; there is no retry loop or provider substitution.
- History belongs to this browser profile and origin. Other visitors cannot query a shared history endpoint. Clearing browser storage deletes history; another device will not see it. Download important runs.
- Each run owns a random temporary directory, loopback application/control listeners, control secret, SQLite sessions and fresh browser contexts. Normal completion/disconnect closes them and deletes temporary run files. Forced process termination can prevent cleanup; temporary files are not durable storage or a recovery guarantee.
- The observer receives initial/final state and grader results as audit evidence. The model receives only its configured observation interface, not the observer's final audit or control secret.

## Bounds and costs

**Try models** queues 1–8 selected models against the current task, seed, interface,
guide and history. Each is a separate request with a fresh workspace, its full
allowance, and its own audit/replay/history. They run sequentially in selection
order, while this tab stays open. Stop cancels the active request and the remaining
queue. Reload never resumes it. Unknown usage, interrupted/unverified evidence,
or failed history saving stops later jobs. Known task failures remain results;
they do not turn into hidden retries. Compare's matched interfaces use the same
separate-request scheduling, so later cells no longer inherit a nearly exhausted
shared deadline. These convenience queues are not randomized research experiments.

| Resource                      |             Hosted maximum |
| ----------------------------- | -------------------------: |
| Episodes / run                |                          3 |
| Actions / episode             |                         80 |
| Model calls / run             |                         80 |
| Model-loop time / run         |                190 seconds |
| Episode time                  |                180 seconds |
| Estimated model spend / run   |                      $5.00 |
| Input allowance / request     | 128,000 conservative units |
| Generated output / request    |               4,096 tokens |
| Concurrent runs / warm worker |                          2 |

The UI defaults to **$2, 40 actions and 180 seconds per model**. The per-model
allowance is not divided in 1v1 or queues: two models permit at most $4 estimated,
eight at most $16 by default. The total is shown before launch; changing Run
settings changes it explicitly. Unused allowance is not spent. Estimates use the
recorded base rates, not invoices. Missing usage stays unknown and stops further
calls. Set provider-side spend caps. Stopping or losing the connection can leave
one already-sent request billable; there are no hidden retries or substitutions.

The output allowance includes internal reasoning, not only visible action JSON.
Hosted defaults allow 4,096 tokens instead of the original 512. This is room to
finish a response, not a target token spend.
Reasoning effort remains the provider default unless explicitly configured; it
is not silently disabled. Incomplete responses never execute partial actions.
Audits retain allowlisted incomplete reasons and validated usage when supplied;
rejected receipts still conservatively retain the reservation in run accounting.

All [tasks and workflows](task-suite.md) now use the same 40-action / 180-second
defaults, adjustable up to 80 actions. Longer workflows may still hit the hosted
time limit; the separately budgeted local runner supports longer episodes. More
permitted actions are not a promise that any model will finish within the cap.
Before each call, Relay reserves conservative input units plus the full output
allowance. It releases unused reservation when valid usage returns. A stop now
reports the next request's required allowance and what remains; a reservation is
not a bill. Unknown receipts remain unknown, never free.

Pricing loads automatically; there is no confirmation form. For Router, the
worker uses validated v1 pricing from the authenticated account catalog, matched
to the exact callable request ID. This includes IDs absent from the display-label
documentation. Catalog entries must support Responses and be active or deprecated
but still callable; retired or incompatible entries remain disabled. Jev's Router
System One entry cannot be sent to Responses: use the TypeSafe connection.
Older catalogs without metadata fall back to exact-ID public documentation,
with dated expiry. Invalid metadata never permits guessing. Rates are rechecked
before execution and source/date/hash is preserved per model. Public documentation
requests carry no credentials. Saved connections work across solo and 1v1; key entry is debounced
and run launches are single-flight. See the [interaction contract](interface-controls.md)
for cache, fallback and cancellation details.

**These are not global abuse controls.** Autoscaled workers each have their own concurrency counter. A valid provider key is required before browser allocation, but is not Relay user authentication. The operator still pays hosting compute/egress. Before promoting this beyond a bounded demo, configure hosting spend alerts/limits, global rate limiting or authenticated access, and measure sustained browser load. Those controls are not claimed by this release. The function time limit is 240 seconds; graceful cleanup is attempted before it.

## Deployment and operations

The deck's canonical URL is `/presentation`. Legacy `/presentation.html` links
redirect permanently, preserving slide fragments in the browser. Hosted controls
and fonts remain same-origin under the production CSP. Slide 9 sorts recorded
model results without making provider calls; its full-trial dialog includes
unattempted rows and keeps unknown costs distinct from zero.

### If Router rejects a run

Router [documents HTTP 403](https://docs.router.com/api/errors-and-limits) as
provider unavailability, not a failed Slack action. Relay shows **Provider
unavailable**, preserves the request ID, and offers **Choose another model**.
Selecting a model does not start a paid request; press Run when ready. A model's
presence in the account catalog does not guarantee it can serve every request.
For persistent 403s, check the selected provider's availability/access in Router
or contact Router support with the request ID. Relay cannot change provider or
account access, and never circumvents a rejection or silently substitutes a model.

401 points to a key requiring attention, 402 to Router credit, 404 to model
availability, 429 to a rate limit and 501 to an unsupported capability. The UI
keeps provider blockage separate from completed-but-wrong task outcomes. A
zero-action error's workspace checks are diagnostic only. Missing usage is
**unknown**, and retained budget allowances are not billed charges. Router's logs
are needed to resolve actual billing; no raw error body is persisted.

### Release process

`/results` is a static, key-free results surface generated from the same table,
controls and immutable campaign records as slide 9. The homepage and Replays
menu link to it. `build-presentation.mjs` derives per-episode cost accounting from
hash-checked records, validates it against original allowances, and exports CSV
and JSON. Hosting serves the controller and fonts under the same-origin CSP.
No result browsing, filtering or replay action triggers inference.

The Vercel project is `relay` in `kl01s-projects`, connected to `Kevin-Liu-01/Relay` on `main`. `vercel.json` builds `build:hosted` and packages a Node 24 function with Chromium. The build preserves `workspace.html` for the private app and makes the public `index.html` the live console; an index-file rewrite alone is insufficient on this deployment.

No shared model secret is deployed. `.env*` (except the example), `.runtime`, `.vercel`, private traces and local reports are excluded from the public repository/archive. Content Security Policy restricts the UI to bundled, same-origin assets and requests. There is no arbitrary upstream URL field or generic proxy.

Before release: `npm run verify`, `npm run test:report`, `npm run evidence`, `npm run package`. After deployment, check the home page in a browser, public config, TLS and a bounded live run. A 200 response alone did not catch the initial wrong-entry-page bug.

The optional `scripts/hosted-smoke.mjs` uses a private `RAMP_ROUTER_API_KEY` environment variable and accepts only the verified Relay production hosts. Its arguments are host, interface, exact model ID and optional task ID (default `channel-topic`). It checks the authenticated account catalog and published server pricing before launch. Each invocation caps eight calls and $0.10 estimated spend. It saves failures as well as successes under ignored `.runtime/hosted-smokes`; it is not a benchmark campaign. A missing final audit, no live frames, failed task or capture warning produces a nonzero exit. It never retries inference or substitutes a model.

### Capture failures

Cold concurrent requests share a worker-local promise for Chromium executable
extraction before either launches. This avoids executing a partially unpacked
shared `/tmp/chromium` file; only executable readiness is shared, never browser or
workspace state. A failed initialization is retained until the worker is recycled,
not automatically retried against a partial executable.

Required pixel observations have an explicit 10-second deadline; a failure stops
the episode, without substituting an older frame or a text interface. Text-mode
setup does not capture a discarded initial PNG. Observer PNGs have a separate
5-second deadline instead of inheriting the 2.5-second action deadline.
Hosted capture activates the private page, waits for its fonts, and requests a
fresh viewport PNG from Chromium's native capture API. These phases share the
same total capture deadline. The live screencast stays active; it is never used
as a cached replacement for a PNG. No caret-hiding stylesheet is injected into
the app for capture. This differs from local Playwright capture and is bound to
the release source; do not claim byte-identical rendering across those paths.
Exact replay PNGs and the final audit are delivered sequentially with bounded
backpressure waits (five seconds per drain), so the final evidence batch does not
overflow the live stream's two-megabyte queue guard. A disconnected client still
cancels delivery; no evidence is silently replaced or marked complete early.

**Current hosted limitation (2026-10-01):** production `gpt-6-luna` text-mode
tasks complete, live frames arrive and audits verify, but fresh PNG capture can
still time out later in an episode. Those gaps remain visible. The native view
alternative failed local replay verification and was not deployed. Hosted pixel
policy reliability is not established by these text-mode passes; required image
failures remain fatal. See [the recorded investigation](verification.md#screenshot-failure-isolation-and-compact-sidebar--2026-10-01).

Observer PNG/replay failures record `capture_warning` in the hash-chained audit
and `captureWarnings` in the episode. They do not abort a text policy or overwrite
a valid final-state grade. After the first failed per-step observer PNG, later
per-step PNG attempts stop; one final capture is still attempted. State replay and
the live JPEG feed are separate. The result discloses incomplete replay imagery;
audit integrity means consistency, not complete capture. No stale observer image
is inserted into the model's input, and actions/provider calls are not retried.

## What a download proves

Hosted downloads contain structured run/events, the exact prepared request objects, original recorded event hashes, initial/final state, integrity checks, and PNG artifacts. Live JPEG frames are a transient viewing feed, not substituted for hashed policy observations. The hosted JSON is not the local lab's byte-for-byte `.tar.gz` filesystem archive; inventory paths are provenance labels, not publicly retrievable links.

`verified` reports local consistency at capture, not an independent signature or proof against the operator rewriting everything. An interrupted stream may lack the final audit and images; it is saved as incomplete with unknown usage. There is no claim to expose hidden model reasoning.

For scaling, move to a queued worker pool with global admission, per-run leases, encrypted private object storage, authenticated histories, crash cleanup and process-tree resource measurements. Use isolated containers/VMs and network policy before granting policies arbitrary code or shell access. Current browser-context/application isolation is not a hostile-code sandbox.
