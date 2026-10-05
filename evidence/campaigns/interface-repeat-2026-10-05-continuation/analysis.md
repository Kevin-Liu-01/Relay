# Repeated interface comparison: all 48 attempts

## What was held constant

- Sol and Sonnet each attempted thread reply, message editing and incident closeout through four interfaces, twice. These cover parent selection, editing, and a multi-step workflow.
- Each attempt started in a fresh workspace with the same task-specific seed-2042 fixture, task wording and grader. Modes were shuffled within model/task/repetition blocks.
- Low reasoning, recent-four history, no guide, 40 actions, 180 seconds, 90 seconds per request and a $1 per-cell allowance were unchanged. API is tool use, not computer use.
- These are two attempts on each of three fixed development tasks, not six independent task variants. No retries, replacements or pooling with the earlier 96 or 306 attempts.

## Verification and cost

- All 48 attempted: 35 passed, 1 incomplete and 12 blocked. Zero capture gaps.
- 3755 integrity checks and 218 saved-state grade checks passed.
- 555 requests, 549 accepted receipts, 6 requests with unknown usage.
- $8.234304 accepted estimates + $0.733406 retained reservations = $8.967710 of the $25 study allowance. These are base-rate estimates, not invoices; hosting costs are excluded.
- Collection paused for a reporting-only repair and later for a deactivated Router key. Existing outcomes and costs were preserved. The user restored account access; continuation began at the next untouched cell.

## Outcomes, time, actions and costs

| Interface | Pass / 12 | Incomplete | Blocked | Median seconds, all | Median seconds, passed | Median actions, all | Accepted USD | Reserved USD | Total USD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Accessibility | 10 | 0 | 2 | 13.81 | 13.14 | 6.50 | 3.787724 | 0.000000 | 3.787724 |
| Page JSON | 9 | 0 | 3 | 16.19 | 12.41 | 7.00 | 2.407492 | 0.095958 | 2.503450 |
| Pixels | 4 | 1 | 7 | 131.97 | 32.83 | 31.50 | 1.841782 | 0.637448 | 2.479230 |
| API | 12 | 0 | 0 | 8.13 | 8.13 | 3.00 | 0.197306 | 0.000000 | 0.197306 |

Elapsed time includes provider calls and browser work. All-attempt medians include early stops. Passed-only medians use different successful subsets and are not an overall speed ranking.

## All six paired comparisons

Pair within model, task and repetition. Each row contains 12 pairs. Both, left only, right only and neither sum to 12. Blocked-either overlaps these categories. Time, action and cost differences use only pairs where both passed; they are medians of within-pair differences, not differences between group medians. Positive means the left interface used more.

| Left / right | Both pass | Left only | Right only | Neither | Blocked either | Shared-pass seconds, left minus right | Shared-pass actions difference | Shared-pass allowance difference USD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Accessibility / Page JSON | 9 | 1 | 0 | 2 | 3 | 2.49 | 0.00 | 0.049316 |
| Accessibility / Pixels | 4 | 6 | 0 | 2 | 8 | -20.72 | -5.50 | 0.051001 |
| Accessibility / API | 10 | 0 | 2 | 0 | 2 | 6.29 | 3.00 | 0.130080 |
| Page JSON / Pixels | 3 | 6 | 1 | 2 | 9 | -6.67 | -1.00 | 0.018648 |
| Page JSON / API | 9 | 0 | 3 | 0 | 3 | 1.92 | 4.00 | 0.094376 |
| Pixels / API | 4 | 0 | 8 | 0 | 7 | 26.49 | 8.00 | 0.069299 |

## Both repeats for every condition

| Model | Task | Interface | Passed / 2 | Repeat 1 | Repeat 2 |
| --- | --- | --- | ---: | --- | --- |
| gpt-6.1-sol | thread-reply | Accessibility | 2 | passed | passed |
| gpt-6.1-sol | thread-reply | Page JSON | 2 | passed | passed |
| gpt-6.1-sol | thread-reply | Pixels | 0 | blocked | blocked |
| gpt-6.1-sol | thread-reply | API | 2 | passed | passed |
| gpt-6.1-sol | edit-message | Accessibility | 2 | passed | passed |
| gpt-6.1-sol | edit-message | Page JSON | 1 | passed | blocked |
| gpt-6.1-sol | edit-message | Pixels | 1 | blocked | passed |
| gpt-6.1-sol | edit-message | API | 2 | passed | passed |
| gpt-6.1-sol | incident-closeout | Accessibility | 2 | passed | passed |
| gpt-6.1-sol | incident-closeout | Page JSON | 2 | passed | passed |
| gpt-6.1-sol | incident-closeout | Pixels | 0 | blocked | blocked |
| gpt-6.1-sol | incident-closeout | API | 2 | passed | passed |
| claude-sonnet-5-5 | thread-reply | Accessibility | 2 | passed | passed |
| claude-sonnet-5-5 | thread-reply | Page JSON | 2 | passed | passed |
| claude-sonnet-5-5 | thread-reply | Pixels | 2 | passed | passed |
| claude-sonnet-5-5 | thread-reply | API | 2 | passed | passed |
| claude-sonnet-5-5 | edit-message | Accessibility | 2 | passed | passed |
| claude-sonnet-5-5 | edit-message | Page JSON | 2 | passed | passed |
| claude-sonnet-5-5 | edit-message | Pixels | 1 | passed | blocked |
| claude-sonnet-5-5 | edit-message | API | 2 | passed | passed |
| claude-sonnet-5-5 | incident-closeout | Accessibility | 0 | blocked | blocked |
| claude-sonnet-5-5 | incident-closeout | Page JSON | 0 | blocked | blocked |
| claude-sonnet-5-5 | incident-closeout | Pixels | 0 | blocked | incomplete |
| claude-sonnet-5-5 | incident-closeout | API | 2 | passed | passed |

## Comparisons within each model

### gpt-6.1-sol

| Left / right | Both pass | Left only | Right only | Neither | Blocked either | Shared-pass seconds, left minus right | Shared-pass actions difference | Shared-pass allowance difference USD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Accessibility / Page JSON | 5 | 1 | 0 | 0 | 1 | 2.55 | 0.00 | 0.035704 |
| Accessibility / Pixels | 1 | 5 | 0 | 0 | 5 | -146.00 | -28.00 | 0.034038 |
| Accessibility / API | 6 | 0 | 0 | 0 | 0 | 6.39 | 3.00 | 0.130080 |
| Page JSON / Pixels | 0 | 5 | 1 | 0 | 6 | N/A | N/A | N/A |
| Page JSON / API | 5 | 0 | 1 | 0 | 1 | 0.07 | 4.00 | 0.094376 |
| Pixels / API | 1 | 0 | 5 | 0 | 5 | 151.40 | 31.00 | 0.096042 |

### claude-sonnet-5-5

| Left / right | Both pass | Left only | Right only | Neither | Blocked either | Shared-pass seconds, left minus right | Shared-pass actions difference | Shared-pass allowance difference USD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Accessibility / Page JSON | 4 | 0 | 0 | 2 | 2 | 1.41 | 0.00 | 0.079442 |
| Accessibility / Pixels | 3 | 1 | 0 | 2 | 3 | -4.03 | -1.00 | 0.067964 |
| Accessibility / API | 4 | 0 | 2 | 0 | 2 | 5.78 | 2.50 | 0.188586 |
| Page JSON / Pixels | 3 | 1 | 0 | 2 | 3 | -6.67 | -1.00 | 0.018648 |
| Page JSON / API | 4 | 0 | 2 | 0 | 2 | 4.87 | 2.50 | 0.109135 |
| Pixels / API | 3 | 0 | 3 | 0 | 2 | 8.40 | 2.00 | 0.042556 |

## Comparisons within each task

### thread-reply

| Left / right | Both pass | Left only | Right only | Neither | Blocked either | Shared-pass seconds, left minus right | Shared-pass actions difference | Shared-pass allowance difference USD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Accessibility / Page JSON | 4 | 0 | 0 | 0 | 0 | 2.47 | 0.00 | 0.040402 |
| Accessibility / Pixels | 2 | 2 | 0 | 0 | 2 | -3.15 | -1.00 | 0.067974 |
| Accessibility / API | 4 | 0 | 0 | 0 | 0 | 3.46 | 1.00 | 0.089175 |
| Page JSON / Pixels | 2 | 2 | 0 | 0 | 2 | -5.66 | -1.00 | 0.018658 |
| Page JSON / API | 4 | 0 | 0 | 0 | 0 | 0.90 | 1.00 | 0.048773 |
| Pixels / API | 2 | 0 | 2 | 0 | 2 | 7.48 | 2.00 | 0.042546 |

### edit-message

| Left / right | Both pass | Left only | Right only | Neither | Blocked either | Shared-pass seconds, left minus right | Shared-pass actions difference | Shared-pass allowance difference USD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Accessibility / Page JSON | 3 | 1 | 0 | 0 | 1 | 0.43 | 0.00 | 0.109568 |
| Accessibility / Pixels | 2 | 2 | 0 | 0 | 2 | -91.70 | -19.00 | 0.015553 |
| Accessibility / API | 4 | 0 | 0 | 0 | 0 | 7.80 | 3.50 | 0.198366 |
| Page JSON / Pixels | 1 | 2 | 1 | 0 | 3 | -36.76 | -10.00 | -0.112776 |
| Page JSON / API | 3 | 0 | 1 | 0 | 1 | 7.97 | 4.00 | 0.157066 |
| Pixels / API | 2 | 0 | 2 | 0 | 2 | 97.99 | 22.50 | 0.182942 |

### incident-closeout

| Left / right | Both pass | Left only | Right only | Neither | Blocked either | Shared-pass seconds, left minus right | Shared-pass actions difference | Shared-pass allowance difference USD |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Accessibility / Page JSON | 2 | 0 | 0 | 2 | 2 | 5.73 | 0.00 | 0.156509 |
| Accessibility / Pixels | 0 | 2 | 0 | 2 | 4 | N/A | N/A | N/A |
| Accessibility / API | 2 | 0 | 2 | 0 | 2 | 9.62 | 7.00 | 0.404531 |
| Page JSON / Pixels | 0 | 2 | 0 | 2 | 4 | N/A | N/A | N/A |
| Page JSON / API | 2 | 0 | 2 | 0 | 2 | 3.90 | 7.00 | 0.248022 |
| Pixels / API | 0 | 0 | 4 | 0 | 3 | N/A | N/A | N/A |

## Stops and interpretation

- Accessibility blocks: 2 budget.
- Page JSON blocks: 1 budget, 1 credentials_invalid, 1 output_limit.
- Pixels blocks: 2 output_limit, 5 timeout.
- API blocks: none.
- Pass discordance retains blocked attempts as not passed, but reports blocks separately. It does not isolate model ability.
- All-attempt time medians include early stops. Both-passed differences select on the observed outcome and are secondary descriptions.
- Passed-only medians use different successful task subsets across model/interface cells. No passes means no completion-time estimate, not zero seconds.
- Shared-host activity affects elapsed time. API exposes semantic actions and structured data; pixels use low-detail images on macOS.
- Two repetitions of three selected development tasks do not establish general reliability. No p-values, population confidence intervals or general ranking are claimed.
- The credential-deactivated attempt remains blocked. All six requests without receipts retain their reservations. Prior studies are separate, not pooled.
- Pixel results reflect this low-detail image and macOS keyboard setup. The observations do not isolate perception quality from navigation, keyboard behavior or time limits.
- The design prespecified descriptive counts and all six paired comparisons. No significance test, post-hoc power claim, or stopping after a favorable result was used.

## Reproduce and review

- Run `node scripts/analyze-interface-repeat.mjs` against the verified summary and accounting export.
- Summary SHA-256: `7b1f321ab357d6c619765d61a57e74496c595987f004bb6f0c9301a9a7a24113`.
- [Costs CSV](accounting.csv) · [Full analysis JSON](analysis.json) · [Verification](verification-public-48.json).
- [Every trace and replay](https://relay.kevinliu.studio/demo/review.html?study=repeat).
