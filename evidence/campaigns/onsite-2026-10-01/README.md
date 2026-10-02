# Onsite model evidence

- 30 planned; 20 attempted; 8 strict passes; 11 completed/step-limited incorrect; 1 blocked; 10 unattempted.
- 126 model requests; $0.149874 estimated; usage partly unknown; reservations retained.
- Development examples, not a leaderboard. API outcomes are not computer-use scores. Read the [frozen plan](../../../docs/campaigns/onsite-2026-10-01.md).
- [Machine-readable inventory](summary.json) includes every planned episode and all failures. Each phase has a readable run manifest and audit receipt.

## Exact trajectories

- [pilot bundle](pilot.tar.gz) — 22.71 MiB; SHA-256: `db8be5311717c2ebca62363c55f3dfc3ab2b0ad7c9815c29f92a290401682c05`.
- [workflows bundle](workflows.tar.gz) — 22.09 MiB; SHA-256: `b3262311214bee75dbec426587e5346bb2699185010bf23aa4738fc59602685c`.
- Each bundle contains original request bodies, response receipts, append-only events, screenshots, initial/final state and terminal checks. Compression preserves the original bytes.
- Extract into a fresh directory. Run `node scripts/inspect-campaign.mjs <phase>` from the repository to verify its hash chains and artifact bindings without an API key.

## Episode inventory

- pilot/episode-001: gpt-4o-mini · json-ui · channel-topic · **passed** · 5 attempts.
- pilot/episode-002: gpt-4o-mini · pixels · channel-topic · **incomplete** · 20 attempts.
- pilot/episode-003: gpt-4o-mini · a11y · channel-topic · **incomplete** · 3 attempts.
- workflows/episode-001: gpt-6-luna · api · thread-reply · **passed** · 4 attempts.
- workflows/episode-002: gpt-6-luna · a11y · thread-reply · **passed** · 4 attempts.
- workflows/episode-003: gpt-4o-mini · api · thread-reply · **incomplete** · 2 attempts.
- workflows/episode-004: gpt-6-luna · json-ui · thread-reply · **passed** · 4 attempts.
- workflows/episode-005: gpt-4o-mini · a11y · thread-reply · **incomplete** · 12 attempts.
- workflows/episode-006: gpt-4o-mini · json-ui · thread-reply · **incomplete** · 3 attempts.
- workflows/episode-007: gpt-6-luna · a11y · decision-record · **incomplete** · 17 attempts.
- workflows/episode-008: gpt-6-luna · api · decision-record · **passed** · 7 attempts.
- workflows/episode-009: gpt-4o-mini · api · decision-record · **incomplete** · 7 attempts.
- workflows/episode-010: gpt-6-luna · json-ui · decision-record · **incomplete** · 13 attempts.
- workflows/episode-011: gpt-4o-mini · a11y · decision-record · **incomplete** · 4 attempts.
- workflows/episode-012: gpt-4o-mini · json-ui · decision-record · **incomplete** · 5 attempts.
- workflows/episode-013: gpt-6-luna · api · edit-message · **passed** · 3 attempts.
- workflows/episode-014: gpt-6-luna · a11y · edit-message · **passed** · 6 attempts.
- workflows/episode-015: gpt-4o-mini · api · edit-message · **passed** · 3 attempts.
- workflows/episode-016: gpt-4o-mini · json-ui · edit-message · **incomplete** · 3 attempts.
- workflows/episode-017: gpt-6-luna · json-ui · edit-message · **blocked** · 0 attempts · provider_receipt_invalid.
- workflows/episode-018: gpt-4o-mini · a11y · edit-message · **unattempted** · 0 attempts.
- workflows/episode-019: gpt-4o-mini · api · incident-triage · **unattempted** · 0 attempts.
- workflows/episode-020: gpt-6-luna · json-ui · incident-triage · **unattempted** · 0 attempts.
- workflows/episode-021: gpt-6-luna · a11y · incident-triage · **unattempted** · 0 attempts.
- workflows/episode-022: gpt-4o-mini · a11y · incident-triage · **unattempted** · 0 attempts.
- workflows/episode-023: gpt-6-luna · api · incident-triage · **unattempted** · 0 attempts.
- workflows/episode-024: gpt-4o-mini · json-ui · incident-triage · **unattempted** · 0 attempts.
- pixels/episode-001: gpt-4o-mini · pixels · edit-message · **unattempted** · 0 attempts.
- pixels/episode-002: gpt-4o-mini · pixels · incident-triage · **unattempted** · 0 attempts.
- pixels/episode-003: gpt-4o-mini · pixels · thread-reply · **unattempted** · 0 attempts.

## Interpretation limits

- One seed and repetition on public development templates; no leaderboard or generalization claim.
- Two requested model routes from one lab, through one provider; not cross-provider replication.
- Pixels have a different task/model matrix; pooled interface totals are not causal contrasts.
- API changes both observation and action granularity; it is not computer-use performance.
- Estimated costs use reported usage at catalog base rates, not invoices; reservations stay unknown.
- Local visual capture adds observer overhead and does not establish hosted capture reliability.
