# Full audit trace

Select a saved run and click **Audit trace ↗**. The monitor stays minimal; the
audit opens on demand. A direct link is `/?run=RUN_UUID&episode=episode-001&view=audit`.
Opening, filtering, refreshing, or downloading an audit never starts inference.

Choose an episode, filter requests/responses/actions/errors/workspace events, or
search the recorded event fields. The two ordered streams are shown agent-first,
then workspace events. They are not a fabricated unified wall-clock timeline:
older model events do not have timestamps. Workspace events retain their own
sequence, timestamps, mutation arguments and before/after state hashes.

## What is available

- Task, interface, guide/history settings, model configuration, limits and spend.
- All recorded events, including rejected actions, provider failures and terminal
  checks. An unattempted episode remains visibly unattempted.
- Actual observations/screenshots; model output text and receipts; parsed actions;
  usage and latency; full final state, mutation events and deterministic grading.
- Configuration/source/guide/catalog hashes, app backend/build provenance,
  event-chain verification, artifact inventory and original capture bindings.

New runs (`auditVersion: 2`) additionally record UTC event timestamps, monotonic
event sequence numbers, elapsed time, initial full-state export, pre-action
observations, action-start records, and the complete prepared request body. The
same request-body builder is used by the transport and recorder. A separate request
event records a call attempt; preparation alone does not imply a call was sent.
Reference scripts prepare inputs but never call a model. Exact requests include
retained history, instructions, optional guide and pixel image data when applicable.

New terminal events hash-bind final state and final screenshots. Observation and
input records bind screenshot and request files. The final-state criterion is
unchanged: this adds audit visibility, not a new path-level safety reward.
Capture and disk-write costs add overhead; do not equate new timings to older runs
as if instrumentation were identical.

## Downloads

| Download    | Contents                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| JSON        | Run and episode metadata, all events, recorded inputs, initial/final state, integrity report and artifact hashes/links      |
| JSONL       | The same evidence as typed records; original trace events are nested without altering their hashes                          |
| Full bundle | A `.tar.gz` containing original JSON/JSONL/PNG files plus the generated audit JSON and JSONL; available after the run stops |

Local operator endpoints: `GET /api/runs/:id/audit`, `/audit.jsonl`, `/audit.tar.gz`.
Add `?download=1` to `/audit` for attachment disposition. These use the existing
loopback and same-origin boundary. Credential-shaped text and configured secrets
block exports. Authentication headers are never recorded. Raw Playwright archives,
session capabilities and the provider key do not belong in portable evidence.

The archive stages a copy, verifies that snapshot, and removes its temporary files
after compression. Original run artifacts remain unchanged. JSON/JSONL snapshots
can be read while a run is active; their integrity is marked in-progress. Refresh
explicitly for later events. A complete archive is refused during an active run.

## Integrity is not completeness or independent attestation

`verified` means the available configuration, event chain, terminal root, episode
checkpoint and recorded artifact bindings passed local checks with no listed
capture gaps. `partial` means available checks pass but capture gaps remain;
`failed` identifies inconsistency; `in-progress` is a changing run snapshot.
These checks detect accidental changes/truncation, not a local operator who can
rewrite the entire bundle. There is no independent signature or external trust root.
Source hashes are provenance identifiers, not a bundled immutable source archive.
Inventory hashes computed on reading are distinguished from original capture hashes.

Historical runs are never repaired or rewritten. Their prompt hashes cannot prove
the exact request body without its bytes. Missing timestamps, initial snapshots,
and unbound outcome files are explicitly listed as gaps. No recreated prompt or
timestamp is presented as contemporaneous evidence. Normalized provider receipts
and visible text are recorded, not hidden model reasoning or raw upstream error
bodies. Unknown usage remains unknown, and estimated cost is not an invoice.

## Verification

The regression suite covers full input/state export, hash linkage, altered inputs,
missing artifacts, truncated/malformed records, legacy gaps, same-origin access,
secret rejection and archive content. Browser checks cover filters, request
inspection, bundle download, deep links, keyboard dismissal and mobile fit. All
verification uses reference policies or fake transport; no paid calls are needed.
