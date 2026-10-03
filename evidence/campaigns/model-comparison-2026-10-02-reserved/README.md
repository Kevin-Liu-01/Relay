# Reserved-timeout comparison — closed

- 60 planned; **7 attempted, 4 passed, 2 incorrect/step-limited, 1 blocked, 53 unattempted**.
- GLM and DeepSeek passed the message-edit and channel-topic blocks. GPT-4.1 nano failed both at the 16-action limit.
- DeepSeek's decision-record trial stopped on request eight after seven executed actions. The 90-second request deadline allowed the response to arrive: HTTP 200, status `incomplete`, reason `max_output_tokens`, with 16,360 input and 4,096 output tokens reported. The response headers arrived after about 60 seconds.
- The frozen runner classified that as `provider_receipt_invalid`, not a request timeout. The authorized timeout-only exception therefore did not apply. No action was executed from the incomplete output; the campaign stopped and was not resumed.

## Counts and accounting

| Requested route | Planned | Attempted | Passed | Incomplete | Blocked | Not run |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| GPT-4.1 nano | 20 | 2 | 0 | 2 | 0 | 18 |
| GLM 5.3 Flash | 20 | 2 | 2 | 0 | 0 | 18 |
| DeepSeek V4.1 Flash | 20 | 3 | 2 | 0 | 1 | 17 |

- 61 requests; 808,614 input and 3,755 output tokens accepted into the runner's totals. The rejected receipt's usage is preserved separately in the trace.
- $0.13073200 accepted estimate + $0.02595030 retained reservation = **$0.15668230 recorded allowance**, not an invoice. The rejected receipt is not retroactively credited to this frozen record.
- Including the earlier strict follow-up, recorded allowance is $0.26605970 against the original $3 ceiling.
- **361 audit checks pass**, no capture gaps. This verifies local hash consistency, not independent attestation or model capability.
- Source hash: `e868bd2298aab300ceb23722b43d61f2acf8be4123f55f9dda1582d8c922d892`.
- Archive: `seed-42.tar.gz`, 15,365,427 bytes; SHA-256 `b227d6a9784973e8cede1201b96ab643bbda272c38e40671d4ff85df3c0afbef`.

## Original artifacts

- [Frozen plan](../../../docs/campaigns/model-comparison-2026-10-02-reserved.json), [manifest](manifest.json), [summary](summary.json), [all 60 planned rows](trials.csv).
- [Original trajectory bundle](seed-42.tar.gz), [run record](seed-42.run.json), [audit](seed-42.audit.json).

```sh
npm run inspect:campaign -- seed-42 model-comparison-2026-10-02-reserved
```

These are repeated public development templates with incomplete coverage. Do not combine these trials with another campaign's denominators or present them as a completed 20-trial-per-model comparison.
