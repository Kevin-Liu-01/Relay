# Completed matched-interface study

## Scope and verification

- All 96 planned cells were attempted once. No retry or replacement was made.
- Four models each attempted six public development tasks through four interfaces.
- Outcomes: 58 passed, 11 incomplete and 27 blocked.
- Archive verification passed 7,892 integrity checks and 532 saved-state grade checks.
- Estimated allowance: $20.718042 usage plus $2.043534 unresolved, totaling $22.761576 of $25.
- 1252 requests returned 1233 accepted receipts. 19 requests have unknown usage.
- Costs use recorded base rates. They are not invoices and exclude hosting costs.
- The final cell stopped at its unchanged $1 run cap. No planned cell remained after it.

## Outcomes, time, actions and cost

Each interface has 24 attempts. Time and action medians include every attempt, including early stops.

| Interface | Pass | Incomplete | Blocked | Median seconds | Median actions | Usage estimate | Unresolved | Total allowance |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Accessibility | 18 | 2 | 4 | 28.37 | 9.50 | $9.193720 | $0.000000 | $9.193720 |
| Page JSON | 16 | 5 | 3 | 19.04 | 9.50 | $6.472618 | $0.178794 | $6.651412 |
| Pixels | 3 | 2 | 19 | 55.21 | 9.50 | $3.327162 | $1.811368 | $5.138530 |
| API | 21 | 2 | 1 | 9.95 | 4.50 | $1.724542 | $0.053372 | $1.777914 |

## Time by model and interface

Seconds are recorded episode elapsed time, including model requests and browser work. All-attempt medians include early stops. Passed-only medians use just the passed tasks in each cell, not the same task subset across cells. N/A means no passed task, not zero seconds. These values do not establish a speed ranking; the matched differences below use shared successful pairs.

| Model | Interface | Passed / attempted | Median seconds, all attempts | Median seconds, passed only |
| --- | --- | ---: | ---: | ---: |
| gpt-6.1-sol | Accessibility | 6 / 6 | 28.41 | 28.41 |
| gpt-6.1-sol | Page JSON | 5 / 6 | 33.17 | 50.34 |
| gpt-6.1-sol | Pixels | 1 / 6 | 107.43 | 76.72 |
| gpt-6.1-sol | API | 6 / 6 | 9.95 | 9.95 |
| claude-sonnet-5-5 | Accessibility | 4 / 6 | 26.29 | 10.24 |
| claude-sonnet-5-5 | Page JSON | 4 / 6 | 26.54 | 10.77 |
| claude-sonnet-5-5 | Pixels | 2 / 6 | 23.71 | 19.19 |
| claude-sonnet-5-5 | API | 5 / 6 | 9.93 | 7.80 |
| qwen3p8-max | Accessibility | 5 / 6 | 26.70 | 14.73 |
| qwen3p8-max | Page JSON | 4 / 6 | 23.89 | 36.61 |
| qwen3p8-max | Pixels | 0 / 6 | 55.21 | N/A |
| qwen3p8-max | API | 5 / 6 | 11.87 | 6.27 |
| grok-4.7 | Accessibility | 3 / 6 | 20.77 | 7.84 |
| grok-4.7 | Page JSON | 3 / 6 | 17.20 | 7.79 |
| grok-4.7 | Pixels | 0 / 6 | 40.52 | N/A |
| grok-4.7 | API | 5 / 6 | 9.01 | 5.22 |

## Matched task outcomes

Each row contains the same 24 model/task pairs. Blocked attempts count as not passed and remain separately identified. The first four outcome columns are disjoint and sum to 24. The last column overlaps them.

| Left / right | Both pass | Left only | Right only | Neither pass | Blocked in either |
| --- | ---: | ---: | ---: | ---: | ---: |
| Accessibility / Page JSON | 16 | 2 | 0 | 6 | 6 |
| Accessibility / Pixels | 3 | 15 | 0 | 6 | 19 |
| Accessibility / API | 17 | 1 | 4 | 2 | 5 |
| Page JSON / Pixels | 3 | 13 | 0 | 8 | 19 |
| Page JSON / API | 15 | 1 | 6 | 2 | 4 |
| Pixels / API | 3 | 0 | 18 | 3 | 19 |

## Matched time, actions and cost

Secondary description: include only tasks that both interfaces passed. Each value is the median of the within-pair left-minus-right difference. These outcome-selected subsets are not a speed ranking or a causal estimate. Positive values mean the left interface used more.

| Left / right | Both passed | Seconds difference | Actions difference | Allowance difference USD |
| --- | ---: | ---: | ---: | ---: |
| Accessibility / Page JSON | 16 | 0.01 | 0.00 | 0.057535 |
| Accessibility / Pixels | 3 | -15.60 | -5.00 | 0.017810 |
| Accessibility / API | 17 | 5.46 | 2.00 | 0.130080 |
| Page JSON / Pixels | 3 | -15.31 | -5.00 | -0.013678 |
| Page JSON / API | 15 | 4.06 | 2.00 | 0.063130 |
| Pixels / API | 3 | 15.71 | 7.00 | 0.050008 |

## Blocked attempts

- Accessibility: 4 budget.
- Page JSON: 1 output_limit, 2 provider_connection_error.
- Pixels: 3 output_limit, 14 provider_connection_error, 2 timeout.
- API: 1 timeout.
- cell-012 and cell-026 reached passing diagnostic states but remain blocked under the unchanged outcome rule.

## Comparisons within each model

### gpt-6.1-sol

| Left / right | Both pass | Left only | Right only | Neither pass | Blocked in either |
| --- | ---: | ---: | ---: | ---: | ---: |
| Accessibility / Page JSON | 5 | 1 | 0 | 0 | 1 |
| Accessibility / Pixels | 1 | 5 | 0 | 0 | 5 |
| Accessibility / API | 6 | 0 | 0 | 0 | 0 |
| Page JSON / Pixels | 1 | 4 | 0 | 1 | 5 |
| Page JSON / API | 5 | 0 | 1 | 0 | 1 |
| Pixels / API | 1 | 0 | 5 | 0 | 5 |

### claude-sonnet-5-5

| Left / right | Both pass | Left only | Right only | Neither pass | Blocked in either |
| --- | ---: | ---: | ---: | ---: | ---: |
| Accessibility / Page JSON | 4 | 0 | 0 | 2 | 2 |
| Accessibility / Pixels | 2 | 2 | 0 | 2 | 3 |
| Accessibility / API | 4 | 0 | 1 | 1 | 2 |
| Page JSON / Pixels | 2 | 2 | 0 | 2 | 3 |
| Page JSON / API | 4 | 0 | 1 | 1 | 1 |
| Pixels / API | 2 | 0 | 3 | 1 | 3 |

### qwen3p8-max

| Left / right | Both pass | Left only | Right only | Neither pass | Blocked in either |
| --- | ---: | ---: | ---: | ---: | ---: |
| Accessibility / Page JSON | 4 | 1 | 0 | 1 | 1 |
| Accessibility / Pixels | 0 | 5 | 0 | 1 | 6 |
| Accessibility / API | 4 | 1 | 1 | 0 | 1 |
| Page JSON / Pixels | 0 | 4 | 0 | 2 | 6 |
| Page JSON / API | 3 | 1 | 2 | 0 | 2 |
| Pixels / API | 0 | 0 | 5 | 1 | 6 |

### grok-4.7

| Left / right | Both pass | Left only | Right only | Neither pass | Blocked in either |
| --- | ---: | ---: | ---: | ---: | ---: |
| Accessibility / Page JSON | 3 | 0 | 0 | 3 | 2 |
| Accessibility / Pixels | 0 | 3 | 0 | 3 | 5 |
| Accessibility / API | 3 | 0 | 2 | 1 | 2 |
| Page JSON / Pixels | 0 | 3 | 0 | 3 | 5 |
| Page JSON / API | 3 | 0 | 2 | 1 | 0 |
| Pixels / API | 0 | 0 | 5 | 1 | 5 |

## Interpretation and limits

- API had 21 passes, accessibility 18, Page JSON 16 and pixels 3 in this fixed setup.
- API tied or exceeded the pass count of each other interface for all four models.
- API is tool use, not browser control. It changes both visible information and action size.
- 19 pixel attempts were blocked: 3 output_limit, 14 provider_connection_error, 2 timeout. These are not all perception failures.
- Pass discordance retains blocked attempts as not passed, but reports blocks separately. It does not isolate model ability.
- All-attempt time medians include early stops. Both-passed differences select on the observed outcome and are secondary descriptions.
- Passed-only medians use different successful task subsets across model/interface cells. No passes means no completion-time estimate, not zero seconds.
- Shared-host activity affects elapsed time. API exposes semantic actions and structured data; pixels use low-detail images on macOS.
- No p-values, confidence intervals, repeated-trial reliability estimates or general model ranking are claimed.
- The observations can guide a new preregistered study. Do not tune or relabel this completed one.

## Reproduce and inspect

- Run `node scripts/analyze-interface-study.mjs` against the verified snapshot and accounting export.
- Original archives were verified before the viewport release was integrated. Current release source is not trial-generating source.
- Verified summary SHA-256: `f0d47c998d58a72a401b2b4858dcb74bc0d69c4a46693ad32f94fa8678ebc328`.
- [Study plan](../../../docs/campaigns/interface-study-2026-10-05.md) · [Verification receipt](verification-public-96.json) · [Costs CSV](accounting.csv) · [Analysis JSON](analysis.json).
- [All traces and replays](https://relay.kevinliu.studio/demo/review.html?study=interfaces).
