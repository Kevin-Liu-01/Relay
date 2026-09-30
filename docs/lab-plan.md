# Relay Lab implementation contract

Status: implemented and locally verified, 2026-09-29; Router authentication and
bounded live smokes now exercised (see verification.md). This is engineering a comparative
evaluation harness, not promoting a novel research mechanism into CoTCodec's roadmap.

## Frozen first experiment

Question: for the same model, task, seed, actor and outcome contract, how do
observation/action interfaces, optional website documentation and retained history
change task completion, interaction count, latency and inference cost?

The unit is an episode. Task/seed/repetition is a block. Model × interface × guide ×
history cells receive fresh isolated sessions and a reproducibly shuffled order.
The six existing task templates and `state-contract-v1` grader stay unchanged.
Fixture seeds vary identifiers, not reasoning structure: this is a development
suite, not a held-out generalization benchmark. No significance claims from smoke runs.

Interfaces: screenshot + coordinate actions; accessibility tree + element actions;
visible-page JSON + the same element actions; application API + permission-checked
domain actions. The API condition changes both information access and action
granularity, so it is not a pure observation ablation or a CUA score.

Guide: none versus the exact hash-recorded site-owned llms.txt + linked interaction
guide, supplied at initialization. This tests supplied documentation, not discovery.
History: full versus last four observations/actions. Task, action protocol and guide
remain fixed. Context overflow stops explicitly; no unrecorded summarization.

## Boundaries and budgets

- Keep app, hidden grader/control, and operator console separate.
- Policies receive only selected observations, instructions and allowlisted actions.
- No policy shell, arbitrary JavaScript, filesystem, network, control tokens or grader.
- Ramp Router uses its own server-side key and `/v1/responses`, never Chat Completions.
- Discover exact callable model IDs from `/v1/models`; labels are not callable IDs.
- No fallback models or hidden retries; record requested/returned model and trace IDs.
- Per-run request, step, wall-time, input/output and estimated-dollar limits.
- Missing pricing/credentials/capabilities fails closed for live mode.
- Estimated local limits are not a billing guarantee. Set a provider-side spend cap.
- Offline reference policies are visibly labeled and excluded from model comparisons.
- Current implementation wave: at most 90 minutes, 0 GPU-hours, $0 until explicit
  authorization and Router credentials; at most $1 for an authorized first smoke.
  User supplied the key for integration on 2026-09-29. This follow-up uses a
  $0.10 initial run cap, $0.40 first comparison cap, and $0.35 revised comparison
  cap (larger input allowance after the preserved failure), no GPUs. At most
  $0.85 total declared local estimates; hosted billing can differ.

## Acceptance

Runnable live console and CLI; four real interface gateways; factorial schedule;
append-only step evidence plus manifest/source hashes; replay and comparison table;
cancel and failure persistence; provider HTTP contract tests; modality, budget,
cross-origin, grader and negative-control tests; operator documentation and live demo.
Preserve earlier interactive evidence. Record unsupported/missing live integration
honestly rather than substituting a scripted policy or another credential.
