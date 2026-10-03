# Six-model comparison — stopped, incomplete coverage

The requested 20 trials per model were **not completed**. The preregistered safety
rule stopped this campaign on Nemotron's first request: a 30-second provider timeout,
no returned usage, no executed action. No inference was retried or model substituted.

| Requested model route | Attempted / planned | Passed | Incomplete | Blocked | Not run |
| --- | ---: | ---: | ---: | ---: | ---: |
| gpt-6-luna | 0 / 20 | 0 | 0 | 0 | 20 |
| gpt-4.1-nano | 1 / 20 | 0 | 1 | 0 | 19 |
| gemini-2.5-flash-lite | 0 / 20 | 0 | 0 | 0 | 20 |
| deepseek-v4.1-flash | 1 / 20 | 1 | 0 | 0 | 19 |
| glm-5p3-flash | 1 / 20 | 1 | 0 | 0 | 19 |
| nemotron-lightning-3p5-30b-a3b | 1 / 20 | 0 | 0 | 1 | 19 |

- Four attempted: two strict passes, one incorrect/step-limited, one blocked; 116 unattempted. All four attempted the topic task on seed 42. This is not a six-model ranking or evidence across five workflows.
- 25 requests; accepted receipts report 319,911 input and 619 output tokens. $0.04140145 estimated for accepted receipts plus $0.00158460 retained reservation = $0.04298605 recorded allowance, **not an invoice**. Actual usage/cost of the timed-out call is unknown.
- GLM and DeepSeek opened the topic dialog, filled, saved and finished correctly in four actions each. GPT-4.1 nano made 16 attempts, including 13 rejected actions, and did not set the topic.
- GLM's returned route IDs included both `zai-org/GLM-5.3-Flash` and `accounts/fireworks/models/glm-5p3-flash`. These are mutable Router routes, not pinned weights or proof of a single backend.
- Verified local audit, no capture gaps. Hash consistency is not an external authenticity signature. Existing grading, browser inputs and model protocol were unchanged during collection.

## Inspect everything

- [Sortable presentation, slide 9](https://relay.kevinliu.studio/presentation#9).
- [All 120 planned trial rows](trials.csv), [machine-readable summary](summary.json), [phase manifest](manifest.json), [run](seed-42.run.json), [audit](seed-42.audit.json).
- [Frozen plan and limits](../../../docs/campaigns/model-comparison-2026-10-02.md).
- [Original trajectory bundle](seed-42.tar.gz): 6,519,243 bytes; SHA-256 `ae3fa9e0979e07b0bca75e70c1a70b5f18d9d1759046797918976d6fff69f127`.
- The bundle contains original request bodies, response receipts, event chains, initial/final states and PNGs. It is separately scanned for keys and capability URLs. Private runtime files are not published.

```sh
npm run inspect:campaign -- seed-42 model-comparison-2026-10-02
```

Do not resume this campaign or backfill the missing cells. A follow-up requires a
separate declared model set, limits and evidence lineage. Historical onsite results
remain [separate](../onsite-2026-10-01/README.md).
