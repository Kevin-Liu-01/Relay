# One-pass trace observations

These are descriptive observations from completed cells, not statistical model rankings. Each route has one attempt per task at seed 1042. Original campaign/run identities remain in the [aggregate inventory](../../evidence/campaigns/model-breadth-2026-10-03-continuation/README.md).

## Completed task slices

| Task                    | Attempted | Passed | Incomplete | Blocked |
| ----------------------- | --------: | -----: | ---------: | ------: |
| Channel topic           |        17 |     17 |          0 |       0 |
| Thread reply            |        17 |     16 |          1 |       0 |
| Message editing         |        17 |     16 |          0 |       1 |
| Incident triage         |        17 |     17 |          0 |       0 |
| Handoff DM              |        17 |     16 |          1 |       0 |
| Saved-item cleanup      |        17 |      4 |          4 |       9 |
| Release synchronization |        17 |      0 |          7 |      10 |
| On-call briefing        |        17 |      7 |          3 |       7 |
| Thread repair           |        17 |     13 |          3 |       1 |
| QA sign-off             |        17 |      5 |          3 |       9 |
| Publish update          |        17 |      4 |          6 |       7 |
| Release retrospective   |        17 |      0 |          6 |      11 |
| Design handoff          |        17 |      0 |          8 |       9 |
| Pin refresh             |        17 |      6 |          3 |       8 |
| Incident closeout       |        17 |      5 |          4 |       8 |
| Draft deletion          |        17 |     16 |          1 |       0 |
| Handoff repair          |        17 |      5 |          3 |       9 |
| Decision record         |        17 |      5 |          8 |       4 |

- Handoff DM is a simpler workflow; this slice does not establish reliability on other workflows or repetitions.
- Saved-item cleanup has four strict passes. A fifth final workspace satisfied diagnostic checks, but that trial ended at an output limit and remains blocked. Do not promote diagnostic success to a completed-policy result.
- Release synchronization includes six action limits, three timeouts, four output limits, two spend limits, one connection failure and one completed-but-incorrect result. None of its final workspaces met the full contract.
- On-call briefing has seven strict passes, three action-limited incomplete attempts, four output limits and three timeouts. These outcomes span the recorded disk-space interruptions; the task/seed and per-trial limits did not change.
- Thread repair has 13 strict passes, two completed-but-incorrect outcomes, one action limit and one connection failure. It combines source-fact retrieval, editing an existing own reply, reacting to another user's review and sending an in-thread confirmation. No failed cell was replaced.
- QA sign-off has five strict passes. Four additional blocked trials have diagnostic state passes (Sonnet: connection failure; Qwen, DeepSeek V4 Pro and GLM: output limits). They remain blocked. The terminal inventory is six completed, three timeouts, one connection failure, five output limits and two action limits.
- Publish update has four strict passes, five action-limited incomplete attempts, one completed-but-incorrect result, three output limits, three timeouts and one spend limit. Four blocked final states satisfy diagnostic checks; they are not promoted.
- Release retrospective has no full-contract pass in these 17 attempts: six action limits, five output limits, four timeouts and two spend limits. This is bounded-system evidence, not proof the task is impossible or a model capability ceiling.
- Pin refresh has six strict passes, two completed-but-incorrect attempts, one action limit, two timeouts and six output limits. Three blocked final workspaces satisfy diagnostic checks (Grok, DeepSeek V4 Pro and GLM Flash); all three remain blocked. The task requires preserving the current handoff pin while replacing the obsolete plan pin, saving the current handoff and updating the topic with retrieved facts.
- Incident closeout has five strict passes, one completed-but-incorrect attempt, three action limits, three timeouts and five output limits. It requires retrieving the confirmed (not provisional) resolution, replacing the old incident pin, acknowledging the current root, posting in its thread and updating the topic. Astra, Sol, Fable, Opus and Grok passed their single attempts; this is not a repeatability estimate. No blocked final workspace satisfied the full diagnostic contract.
- Draft deletion has 16 strict passes and one action-limited incomplete attempt, with no blocked attempts. MiniMax's 40 outputs were rejected (31 unsupported action schemas and nine malformed JSON outputs). This separates a protocol mismatch from failure after accepted UI actions; the frozen parser was not changed.
- Handoff repair has five strict passes, one completed-but-incorrect attempt, two action limits, six output limits, one timeout and two per-cell spending stops. It requires editing the existing DM rather than posting a replacement, while acknowledging and saving the current handoff. DeepSeek Pro, Kimi, Luna, Nemotron and Grok passed their single attempts. Sol's inspected failure exposes an edit-versus-cancel loop rather than incorrect source facts.
- Decision record has five strict passes, eight completed-but-incorrect attempts, two output limits and two timeouts. Sol, Opus, Astra, Fable and Kimi passed. Unlike design-handoff, its instruction explicitly requires substituting the approved design; the inspected DeepSeek Pro failure below is therefore a distinct case. No blocked final state satisfied the full diagnostic contract.
- The full inventory is **306/306 recorded: 152 passed, 61 incomplete and 93 blocked**. All 277 original archives pass verification, with 2,007 saved-state grade checks in agreement. This does not isolate the cause of model differences: provider defaults, finite observation/history contracts, temporal cohorts and resource limits remain part of the measured system.

## Task-wording caveat discovered during trace review

### Design handoff: unspecified placeholder substitution

- `design-handoff` quotes “Implement DESIGN navigation; accessibility approved.” and “Handed off DESIGN to Leo Park.” Unlike decision-record, it does not explicitly say to substitute the approved design. Its intended grader expects the retrieved name (`Willow` at seed 1042).
- Six completed-but-incomplete attempts—Grok, Fable, Astra, Sol, Opus and Kimi—sent both quoted strings with literal `DESIGN`. Their other requested-change checks passed; message-content and exact-state checks failed. For example, Fable run `7bad91b7-c942-4af0-8775-99fe795d2886`, Sol `a435dbde-36e9-4e63-a843-ce212c6f5496` and Opus `deb39efe-5a70-4939-b25f-b066ee18c22b` retain the original approval and sent messages.
- This is a concrete instruction-contract ambiguity. Do not attribute the 0/17 raw score solely to model capability. The other 11 attempts have their own partial/blocked outcomes; the wording's causal contribution has not been isolated.
- Preserve all original instructions, traces and outcomes. A future version should explicitly define placeholder substitution and validate task language independently of a reference script. No post-hoc pass relabeling or paid rerun is performed here.

### Release synchronization: ambiguous source location

- `release-sync` says “Find the current release handoff and final QA matrix in #engineering.” The final QA matrix is in engineering, but the current release handoff is in the project channel. The trailing location can be read as applying to both sources; it should name the two locations separately.
- This is a task-instruction ambiguity, not evidence that the UI workflow is impossible or that its deterministic state checks are wrong. Sol's inspected trace did recover the correct build/window and made partial changes. The wording's contribution to failures has not been isolated.
- Treat all 17 release-sync cells as raw diagnostic observations with this quality caveat. Do not use their 0/17 outcome to claim a model capability limit or treat the aggregate as a validated accuracy ranking.
- No instructions, fixtures, outcomes or graders are changed mid-collection, and no affected cell is repeated. A wording correction and content-location validation belong to a separately versioned future task suite, not a repair of historical results.
- Scripted UI solutions establish executability; they do not independently validate natural-language task clarity. The reference policy already knows source locations, so that distinction matters.

## Examples inspected in the original traces

- **Fable / saved cleanup**: original breadth block-045, 15 recorded actions, strict pass. It removed outdated saved items, saved the requested current items and sent the required handoff message.
- **Nemotron / saved cleanup**: original breadth block-039, 40 actions, incomplete. Save/navigation/scroll actions were recorded, but the required new-message checks failed. Valid UI actions alone did not satisfy the task.
- **Sol / release synchronization**: original breadth block-064, 40 actions, incomplete. It set the topic and posted a QA reply, then repeatedly opened and cancelled message editing. The requested original-message edit and exact message/collateral-state checks failed. No action was rejected by the gateway; semantic task completion still failed.
- **Astra / release synchronization**: original breadth block-068, 26 actions, spend-limited. $4.16782 accepted estimate; the next reservation would not fit under $5. The attempt was preserved and not repeated by the separate continuation.
- **Grok / release retrospective**: continuation run `c7f67efa-f064-4a0a-ad03-98d03a0efbfa`, 40 actions, incomplete. The retrospective reply, root pin, current-source saves and Priya DM satisfy their checks. Removing the obsolete saved handoff does not; the exact final-state contract rejects the incomplete cleanup. The final actions navigate Later/project/the retrospective thread without completing that removal. This is an inspectable partial-completion case, not a claimed success.
- **MiniMax / delete draft**: continuation run `090c11c9-0aa2-49bf-bb36-cb2159c01044`, 40 rejected action attempts, incomplete. Its first response was `{"type":"ACTION","action":"click","ref":"e18"}` rather than the specified `type: click` contract; the gateway rejected it. Other responses include malformed JSON. This is a concrete protocol-format failure, not evidence that 40 valid clicks failed to delete the draft. Original outputs and rejection errors are retained without parser adaptation or a repeat.
- **Sol / handoff repair**: continuation run `251d089d-18a6-4808-a268-53621e955316`, 40 accepted actions, incomplete. It acknowledged and saved the correct handoff, but did not persist the requested DM edit. At steps 30/37 it filled the correct replacement text, then at steps 31/38 clicked the element explicitly labeled **Cancel**; **Save changes** was a separate visible element. The final-state grader rejected the unchanged DM and missing edit timestamp. Accepted actions and correct draft text did not establish completion.
- **DeepSeek Pro / decision record**: continuation run `69ea32db-2460-4fb5-aed4-e992fb6f0b7e`, 12 actions, completed-but-incomplete. It pinned the decision and saved the final approval, but entered literal `DESIGN` in the description and acknowledgement. Unlike design-handoff, this task explicitly says to substitute the approved design. The content and exact-state checks failed; the two correctly targeted mutations remain visible as partial progress.

## Action-contract interpretation

- Every route uses the same single-action JSON text contract. It is not a provider-native tool-call evaluation, and each model has not been individually prompt-tuned.
- Inspected rejected responses include prose, multiple concatenated JSON objects and XML-like native tool wrappers. These outputs are retained verbatim in response events. The frozen parser trims whitespace and optional Markdown JSON fences, but does not repair malformed JSON, extract from prose, split objects or translate native tool wrappers. Step errors are fed back within the same bounded episode, not retried as new trials.
- The generated report separates action attempts, error-bearing steps and outputs with no parsed action. The historical `invalidJSON` field measures the last category; it can include schema rejection, not only JSON syntax. Do not interpret every rejected step as a wrong UI click.
- The resulting scores describe a model/provider/harness combination under this contract. A native-tool adapter or different recovery policy is a future separately versioned condition, not a post-hoc correction to these outcomes.

## Evidence boundary

- The immutable exported archives, not these notes, are the source. Use the original campaign IDs with `scripts/inspect-task-campaign.mjs`.
- The completion verifier reopens all original archives, reconstructs table rows/accounting and reruns deterministic grading on saved final states. It does not infer hidden reasoning or turn local hashes into independent authenticity signatures.
- Scripted browser reference paths separately establish that intended workflows are executable; they are not model successes. No fixture, prompt, budget or grader was repaired after observing these outcomes.
