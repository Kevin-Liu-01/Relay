# Strict three-model follow-up — closed

- 60 planned; **4 attempted, 2 passed, 1 incorrect/step-limited, 1 blocked, 56 unattempted**.
- First matched block was message editing at seed 42: GLM and DeepSeek each passed all state checks in six action attempts. GPT-4.1 nano reached 16 attempts, failed to edit the original correctly and introduced collateral state changes.
- DeepSeek's next trial, decision record, completed seven actions before request eight timed out after 30 seconds. There is no response or usage receipt for that request. This was a provider-request deadline, not a screenshot failure or the 120-second episode ceiling.
- The entire strict campaign stopped. No calls were retried; seeds 43–45 did not launch. The user then approved a separately labeled [revised policy](../../../docs/campaigns/model-comparison-2026-10-02-reserved.md), not a resumption of this campaign.

## Complete results

| Requested route | Planned | Attempted | Passed | Incomplete | Blocked | Not run |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| GPT-4.1 nano | 20 | 1 | 0 | 1 | 0 | 19 |
| GLM 5.3 Flash | 20 | 1 | 1 | 0 | 0 | 19 |
| DeepSeek V4.1 Flash | 20 | 2 | 1 | 0 | 1 | 18 |

- 36 requests; 470,554 accepted input tokens and 1,865 output tokens. Missing receipt tokens remain unknown.
- $0.08273260 accepted-usage estimate + $0.02664480 retained reservation = **$0.10937740 recorded allowance**, not an invoice.
- Four archived episodes pass **212 integrity checks**, with no recorded capture gaps. Hash consistency is not independent attestation.
- Source: `e69ff07b04fb9852f9ab591ee17c8de1b4616ab36afb3ceb43cf803a5eb2741d`.
- Archive: `seed-42.tar.gz`, 9,106,845 bytes; SHA-256 `e6be0d295c7f07ad4cfaea31bc801ee9df3bda638116c189045c847069cbd5a5`.

## Files and inspection

- [Frozen plan](../../../docs/campaigns/model-comparison-2026-10-02-followup.json), [manifest](manifest.json), [summary](summary.json), [all 60 planned trials](trials.csv).
- [Original trajectory bundle](seed-42.tar.gz), [run record](seed-42.run.json), [audit](seed-42.audit.json).

```sh
npm run inspect:campaign -- seed-42 model-comparison-2026-10-02-followup
```

- Five public templates with four seed instances, not a held-out benchmark. This incomplete coverage cannot support a model ranking.
- GLM and DeepSeek returned multiple backend model identifiers across requests; requested routes are not pinned weights. Exact receipts are preserved. Do not pool this campaign into the revised campaign's trial counts.
