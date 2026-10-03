# Model comparison — stopped

Generated from the frozen plan, run records and complete summary. No earlier campaign is pooled into these counts.

## Results

- **36/60 trials attempted: 20 passed, 11 incomplete, 5 blocked/truncated, 24 unattempted.**
- Five public tasks × four seeds per model; accessibility browser control only. These are development results, not 20 independent held-out problems or a general model ranking.
- Strict terminal-state checks include collateral changes. Blocked/truncated trials never become passes from diagnostic state checks. No inference retries or substitutions.

| Requested route | Planned | Attempted | Passed | Incomplete | Blocked | Not run | Median seconds | Recorded allowance |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| gpt-4.1-nano | 20 | 12 | 0 | 11 | 1 | 8 | 17.031 | $0.21247440 incl. unknown reservation |
| glm-5p3-flash | 20 | 12 | 10 | 0 | 2 | 8 | 12.557 | $0.14766055 |
| deepseek-v4.1-flash | 20 | 12 | 10 | 0 | 2 | 8 | 10.709 | $0.31885560 |

## Task breakdown

Passed / attempted; each full model/task cell has four planned seed instances. Unattempted rows remain in [the complete CSV](trials.csv).

| Task | gpt-4.1-nano | glm-5p3-flash | deepseek-v4.1-flash |
| --- | ---: | ---: | ---: |
| channel-topic | 0/2 | 2/2 | 2/2 |
| thread-reply | 0/2 | 2/2 | 2/2 |
| edit-message | 0/3 | 3/3 | 3/3 |
| incident-triage | 0/3 | 3/3 | 3/3 |
| decision-record | 0/2 | 0/2 | 0/2 |

## Accounting and limits

- 337 requests; 3,885,609 accepted input tokens and 52,288 accepted output tokens. Validated output-limit receipt usage is included. Missing receipt tokens are unknown, not zero.
- $0.66961055 accepted-usage estimate + $0.00938000 retained missing-receipt reservations = **$0.67899055 recorded allowance**. Not a provider invoice.
- 1 trials have unknown usage; 4 have validated output-limit receipts. Partial output never executes.
- Prior stopped attempts: $0.26605970. Combined recorded allowance: **$0.94505025**, within the $3 authorization.
- 332 action attempts, 55 rejected actions, 0 capture warnings. Median time includes all attempts and observer overhead, including blocked trials; not time-to-success.
- Requested routes are not pinned weights. Returned identifiers: gpt-4.1-nano → gpt-4.1-nano-2025-04-14; glm-5p3-flash → zai-org/GLM-5.3-Flash, accounts/fireworks/models/glm-5p3-flash; deepseek-v4.1-flash → accounts/fireworks/models/deepseek-v4p1-flash, deepseek-ai/DeepSeek-V4.1-Flash.

## Integrity and original trajectories

- 1971 local integrity checks; all verified, no recorded gaps. Hash consistency is not independent attestation or proof against rewriting an entire bundle.
- Execution source: `cc68de66e72d68eea96e53a663db254c9a028952c237e45ddc13224760599729`; frozen plan: `1c7dcfbae0f1d9af6c5cced20b59885aadf21a139e920d1d60b25cdfbb7d98c6`; launcher: `8a22d7f3cf3dd8218fe6534f4ca27e09ccfc871c4c4e8dbe217ada0adb78f45c`.
- [Plan](../../../docs/campaigns/model-comparison-2026-10-02-final.md), [frozen JSON](../../../docs/campaigns/model-comparison-2026-10-02-final.json), [manifest](manifest.json), [full summary](summary.json), [every planned trial](trials.csv).

| Phase | Status | Audit checks | Trajectory archive | SHA-256 |
| --- | --- | ---: | --- | --- |
| seed-42 | completed | 874 | [seed-42.tar.gz](seed-42.tar.gz) | `5021381ddb71c7356a9fb76bdcf557f2e4bfcf39cd8e219b5f795843574f68e3` |
| seed-43 | completed | 789 | [seed-43.tar.gz](seed-43.tar.gz) | `af1075d3529935a3241ed8f71dbc954f6b631b76a1fc07f7185997aa3d0ee3bb` |
| seed-44 | stopped | 308 | [seed-44.tar.gz](seed-44.tar.gz) | `3b2abb11ca94790362414de785d0f5a4285c4e1d3701faf733ab7d7496acebcc` |

```sh
npm run inspect:campaign -- seed-42 model-comparison-2026-10-02-final
# Repeat for each published phase listed above. No model key needed.
```

## Earlier attempts

- [model-comparison-2026-10-02-followup](../model-comparison-2026-10-02-followup/README.md): immutable, separately accounted; never resumed or used to replace failed trials.
- [model-comparison-2026-10-02-reserved](../model-comparison-2026-10-02-reserved/README.md): immutable, separately accounted; never resumed or used to replace failed trials.
- [Original six-model attempt](../model-comparison-2026-10-02/README.md): separately authorized earlier study, not charged again to this follow-up allowance.
