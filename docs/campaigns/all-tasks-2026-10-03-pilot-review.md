# Qwen successor — pilot trace review

## Scope and admission

- Reviewed the first five matched blocks, 25 episodes, seed 1042. This is a trace-quality gate for the already authorized 1,800-trial plan, not a new experiment or a success-rate threshold.
- Result: **21 passed, three incorrect outcomes, one output limit**. The other 1,775 cells have not been attempted at this gate. No retries, grader changes or post-hoc allowance increases.
- Original block archives verify: 141 + 141 + 196 + 221 + 515 = **1,214 integrity checks**, no failures or gaps. All five blocks record safe cleanup. Local hash consistency is not external attestation.
- Every model in a task/seed block started from the same state hash. Each episode has a separate session and fresh conversation. Requests contain the task, permitted action schema, rendered accessibility observation and bounded history, not the evaluator export.
- Requested routes match the plan. Returned-model receipts preserve Router's provider-specific aliases; GLM and DeepSeek can route to different serving providers. This compares Router model routes, not immutable model checkpoints or a fixed serving backend.
- All 202 requests have accepted usage, including GLM's validated output-limit receipt. No partial action from that incomplete response executed. The pilot has 201 action attempts, 18 rejected actions and zero capture warnings.
- Admission: proceed with the unchanged bulk plan. Preserve failures; do not optimize the prompt, recent-four history, task, UI, limits or grader against these findings during collection.

## Actual findings

| Task            | GPT-6.1 Sol | Sonnet 5.5 | Qwen 3.8 Max | DeepSeek V4.1 Flash | GLM 5.3 Flash |
| --------------- | ----------- | ---------- | ------------ | ------------------- | ------------- |
| Channel topic   | Pass        | Pass       | Pass         | Pass                | Pass          |
| Thread reply    | Pass        | Pass       | Pass         | Pass                | Pass          |
| Edit message    | Pass        | Pass       | Pass         | Pass                | Pass          |
| Incident triage | Pass        | Pass       | Pass         | Pass                | Pass          |
| Decision record | Pass        | Incorrect  | Incorrect    | Incorrect           | Output limit  |

- Decision record's visible final approval says **Willow**. The instruction explicitly requires substituting the approved design, changing the channel description, pinning the root, saving the approval and posting exactly one acknowledgement in that thread.
- GPT made the four requested mutations and passed all nine checks.
- Qwen changed the topic instead of the description and posted literal `DESIGN`. Its description stayed unchanged. GLM reached the same incorrect state before an output-limited response. Their pin and save changes were correct.
- DeepSeek changed the description but left literal `DESIGN` in both description and acknowledgement. Its pin and save changes were correct.
- Sonnet used Willow and made the requested description/pin/save changes, but posted the acknowledgement three times. The exact-message-count and collateral-change checks correctly rejected it.
- These are single-seed development observations. Neither 21/25 nor five attempts per model is a generalization estimate or a statistically established ranking. There are 13 task templates not yet attempted at this gate.

## Accounting

- Accepted-usage estimate: **$3.78059050**; unresolved pilot reservations: **$0**.
- Bound prior pilots, blocked Gemini attempt and access diagnostics: **$1.01542235**.
- Total recorded allowance: **$4.79601285**; remaining of the shared $300 ceiling: **$295.20398715**. Not a provider invoice or a guarantee that the full target fits the cap.
- The difficult fifth block cost more than the first four combined. Continue the fixed schedule with admission checks before every call; stop at the authorized ceiling rather than silently lowering limits or omitting difficult tasks.

## Reproduce the integrity review

Run `node scripts/inspect-task-campaign.mjs block-001` through `block-005` without a provider key. The inspector verifies the manifest-bound archive bytes and checks the original event chains, requests, artifacts, final states and source binding. It never reconstructs missing evidence.

The archive SHA-256 values are in the public campaign manifest. The original compressed archives are currently preserved locally under `.runtime/all-tasks-2026-10-03/`, not uploaded. The public summary is updated after each later block; this document remains a record of the first 25 episodes.
