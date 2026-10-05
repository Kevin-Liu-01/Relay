# Matched interface study

## Question and approval

Which observation and action interface helps the same model complete the same task?
The user approved 96 fresh attempts with a separate $25 estimated-spend ceiling and
no retries. This study does not change or extend the original 306-run collection.

## Design fixed before inference

- Four exact Router routes: GPT-6.1 Sol, Claude Sonnet 5.5, Qwen 3.8 Max and Grok 4.7.
- Account metadata must confirm image input, Responses support, pricing and low reasoning.
- Six tasks: topic update, thread reply, message edit, incident closeout, saved-item cleanup and decision record.
- Each model attempts each task through accessibility, Page JSON, pixels and API.
- One fresh session per cell; seed 2042. No prior result is reused as a baseline.
- Unit: one model/task/interface attempt. Pairing block: one model and one task.
- Topic is the admission task. Remaining tasks, model order and interface order use recorded deterministic randomization.
- The first 16 cells cover all four models and modes on topic update. Review transport, capture, exact input, accepted actions, grading and cleanup before the remaining 80 cells.
- Admission is not a success filter. Do not replace weak models, failed tasks or blocked cells.

## Fixed controls

- Same task instructions, initial state, grader, served build and runner source in all cells.
- No site guide or llms.txt. Four-turn history. One JSON action per response.
- Forty actions, forty requests, 180 seconds per episode, 90 seconds per provider request.
- 4,096 output tokens per request. Low reasoning for each route, not provider defaults.
- $1 estimated ceiling per cell, additionally bounded by the remaining shared $25.
- Sequential execution. A new session begins only after the prior session closes.
- Pixel input is a 1440×900 screenshot with `detail: low`, as in the existing protocol.
- Accessibility exposes a rendered document tree and current control references.
- Page JSON exposes visible text and controls. It is not identical to the accessibility tree.
- API exposes structured records and semantic operations. It is a tool-use condition.

## Stop and evidence rules

- No inference retries, replacement attempts, success-based selection or partial-output execution.
- Preserve every returned response, rejected action, final state, grader result and cost reservation.
- Valid output-limit receipts count as known usage. Timeouts and connection failures keep their full reservation and can end that cell without stopping later cells.
- Authentication, unsupported requests, malformed usage, failed cleanup, evidence gaps, source drift or mismatched initial state stop collection for review.
- Forty requests per cell, 3,840 total; eight hours total; 12 GB compressed archive ceiling; 10 GB minimum free disk.
- Raw runs and immutable screened archives remain in the ignored private campaign directory. Public summaries contain no capability URLs or keys.
- Record both source fingerprint and the preserved served-build fingerprint. The current operator UI is not claimed to be the source of the historical 306 runs.

## Analysis

- Report all 96 planned cells, including unattempted cells if a safeguard stops collection.
- Report passes, incomplete outcomes and blocked outcomes separately by model and interface.
- Compare modes within complete model/task blocks. Show pass discordance, actions, elapsed time and cost.
- Separate usage-based estimates from unresolved reservations. Neither is an invoice.
- No significance, reliability or universal-best claim from one attempt per cell.
- These are six public development tasks, not all 18 tasks or a held-out test.
- Interface changes both observations and actions. Results cannot isolate visual reasoning alone.
- Equal action limits do not equalize work per action. Low-detail image delivery and provider routing are limitations.

## Operation

Prepare once with `scripts/run-interface-study.mjs prepare` and a private environment
containing `RAMP_ROUTER_API_KEY`. Run `pilot`, inspect every admission trace, then run
`bulk --reviewed-pilot`. Never edit the frozen worker, helper, plan or actor source
after collection begins. `status` is read-only. A worker lock prevents overlap.

The authenticated catalog and plan are recorded separately before the first paid call.
The earlier 306-run campaign used accessibility only, no guide and recent-four history.
Earlier mixed-mode demonstrations did not use a matched matrix and cannot select a winner.
