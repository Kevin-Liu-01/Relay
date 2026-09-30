# Landscape research: Slack mockups → executable CUA/RL environments

**Interface/context expansion:** [Relay Lab's design and closest-prior analysis](benchmark-lab.md)
adds primary-source review of Ramp Router, llms.txt, Beyond Browsing, MCPWorld,
BrowserGym, AgentLab and the current WebMCP draft. GUI/API comparisons are prior art;
the delivered extension is a controlled engineering testbed, not a first-ever claim.

Reviewed 2026-09-29. This is a broad, assignment-focused survey, not an assertion that every project on the internet was found. Primary repository pages, selected source files, official product/help pages and papers were inspected. External repositories were **not executed**. Their stated counts/capabilities below are upstream claims unless marked source inspection. Relay's measurements are separate.

## Executive finding

The closest prior work already includes a literal Slack browser environment: Cua's `slack_env`. env0 goes further on Slack API breadth and adds a UI, while Agent-Diff focuses on API replicas and isolated outcome-based evaluation. Many attractive Slack clones are ordinary collaboration apps with no evaluator, reset or session lifecycle. Building another pretty frontend alone would therefore miss the assignment's central engineering question.

Relay's choice is an original, focused UI with a small transactional backend, independent server-side outcome contracts, session-private files and explicit evidence. This is an engineering tradeoff for the brief, **not a novelty claim** or a claim to outperform the projects surveyed.

## 1. Visual mockups, components and functional clones

| Source                                                                              | What it supplies                                               | Useful lesson / why not the whole solution                                                                                                                                     |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [Sirneij/slack-clone-ui](https://github.com/Sirneij/slack-clone-ui)                 | HTML/CSS/vanilla-JS Slack-like interface, rich-text work       | Strong low-dependency visual reference. A UI shell does not establish persistent task outcomes or isolation. MIT at inspected head.                                            |
| [lukejacksonn/react-slack-clone](https://github.com/lukejacksonn/react-slack-clone) | React chat application built around Chatkit                    | Useful component and conversation structure; legacy service dependency makes it a poor self-contained submission base. MIT.                                                    |
| [remarkablemark/clask](https://github.com/remarkablemark/clask)                     | React/Redux, Express, Socket.IO, MongoDB Slack clone           | Demonstrates real chat behavior; adapting auth, persistence, reset and scoring is more work than the focused state model needs. MIT.                                           |
| [chunkangwong/slack-clone](https://github.com/chunkangwong/slack-clone)             | Next/Convex/shadcn tutorial-style collaboration app            | Modern visual and interaction reference. Hosted backend and authentication are extra operational dependencies. License not detected by GitHub; do not assume permissive reuse. |
| [harryheman/slack-clone](https://github.com/harryheman/slack-clone)                 | Another Next/Convex implementation in the same tutorial family | Good threads/reactions/editing reference; not an independent research environment. MIT at inspected head.                                                                      |
| [Code With Antonio's tutorial](https://www.youtube.com/watch?v=lXITA5MZIiI)         | First-party walkthrough of a substantial Slack clone           | Useful workflow coverage. Tutorial descendants should not be counted as independent architecture discoveries.                                                                  |
| [Chatcn](https://github.com/leonickson1/chatcn)                                     | Reusable React/shadcn chat components                          | Useful message, thread and reaction primitives; components still need state/reset/evaluation. MIT.                                                                             |
| [shadcn Slack-style block](https://www.shadcn.io/blocks/chat-slack-style)           | Polished UI block/preview                                      | Visual reference, not an RL system. Purchase/access conditions are not permission to redistribute its implementation.                                                          |
| [Back4App Slack clone](https://www.back4app.com/database/back4app/slackclone)       | React/Parse-oriented clone/tutorial landing page               | Illustrates backend-backed chat; only landing documentation was examined, not a runnable benchmark.                                                                            |

One additional search lead, `farhanmasood-se/slack-clone`, was not accessible through the GitHub API at snapshot time (404). It is retained as a failed retrieval in the provenance file, **not** relied upon as an available dependency. This matters because search-index results are not proof a project is still retrievable.

Visual patterns adopted conceptually: a persistent workspace rail, channel/DM list, compact message rows, contextual hover controls, a separate thread pane, global search, and familiar keyboard entry points. No clone's code or task text was copied. The private prototype explored Slack's icon font and sample photographs. The public release uses OFL Lato, Lucide controls, theSVG provider marks and fictional initials; proprietary icons and stock photos are excluded. Sources and restrictions are recorded in `THIRD_PARTY_NOTICES.md` and `src/assets/provenance.json`.

## 2. Slack-specific agent and RL environments

### Cua Slack environment — closest browser-native reference

[Pinned source](https://github.com/trycua/cua/blob/c3941497a5545b6b977c55962c29391da10bdc03/libs/cua-bench/tasks/slack_env/main.py) defines a simulated desktop Slack task with a local HTML GUI, train/test configurations and evaluators. Source inspection found 10 generated training configurations (5 basic messages, 2 channel messages, 3 thread replies) and 3 test configurations, using a 1280×800 simulated desktop. The directory also contains screenshots and tests for the Slack interactions.

The evaluator reads outbound messages/thread replies through a JavaScript bridge in the simulated app. The channel-message evaluator uses text matching with a channel-specific branch. This is a useful quick integration pattern. For an actor capable of arbitrary page JavaScript, an exposed in-page state bridge would require a carefully enforced observation/action boundary; that is a threat-model inference, not a demonstrated exploit of Cua. Relay instead grades server state and does not trust browser-reported success.

An older Cua registry search result pointed to a page that returned “Dataset not found” during review. The directly inspected source, not the stale registry count, is the basis for this comparison.

### env0 / mock-slack — closest broad functional replica

[Pinned mock-slack README](https://github.com/benchflow-ai/env0/blob/a292cc5aae29b12a0779da895616175485a526af/packages/environments/mock-slack/README.md) documents 41 Slack Web API endpoints, SQLite, a Jinja-based UI, MCP access, snapshot/restore, action logging and 57 golden fixtures captured from a real Slack sandbox. These are upstream-declared capabilities, not independent measurements. It also documents reset/state/diff/snapshot administration routes.

This is a strong reuse candidate if wire compatibility or cross-service agent testing is the priority. Relay deliberately omits that breadth and keeps operator endpoints on a separate listener. env0's inspected repository license is AGPL-3.0; any incorporation/distribution needs an appropriate license review. No env0 code is incorporated here.

### Agent-Diff — state-diff evaluation and cheap API session clones

[Pinned README](https://github.com/agent-diff-bench/agent-diff/blob/3bb9c40707df23d89e5dbc0e40c424ba38c69ff8/README.md) documents Slack, Box, Linear and calendar replicas; its Slack table lists 25 endpoints. It uses template PostgreSQL schemas, temporary environment copies and cleanup/TTL. Evaluation focuses on state differences rather than reproducing a particular action trace. See also the [paper](https://arxiv.org/abs/2602.11224).

This is highly relevant to session isolation and outcome verification, but an API environment is not by itself screenshot-based computer use. Relay adopts the principle of outcome checks, not this implementation. Source inspection does not justify equating the two systems' reset latency, fidelity or scaling.

### ClawsBench — realistic workplace and safety composition

[BenchFlow's first-party report](https://www.benchflow.ai/research/clawsbench) and [paper](https://arxiv.org/abs/2604.05172) describe a workplace benchmark over wire-compatible services with normal and safety-sensitive tasks. Useful ideas include cross-service tasks, realistic distractors and testing whether a requested action should occur at all. Its API/CLI emphasis should not be mislabeled as a pixel-only Slack benchmark. Relay's current six tasks test functionality, not a full workplace-safety suite.

### Sentinel / MicroChat — changing state over time

[Microsoft's Sentinel environments](https://github.com/microsoft/sentinel_environments) include evolving web-app replicas and a Slack/Teams-like communication environment. They motivate monitoring, waiting and handling updates that arrive after the initial observation. Relay is intentionally static apart from the actor's actions; adding timed coworker events would create a new task family and require deterministic event scheduling.

## 3. Broader systems worth knowing

| Reference                                                                   | Relevant contribution                                                         | Boundary for this assignment                                                                     |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| [TheAgentCompany](https://github.com/TheAgentCompany/TheAgentCompany)       | Simulated company workflows; Rocket.Chat as a workplace communication service | Richer ecosystem, substantially heavier services; Rocket.Chat is not an exact Slack replica      |
| [BrowserGym](https://github.com/ServiceNow/BrowserGym)                      | Common browser benchmark interfaces and observation/action tooling            | Natural future wrapper; does not remove the need for our app-specific state contract             |
| [WebArena](https://github.com/web-arena-x/webarena)                         | Self-hosted functional websites and outcome-oriented tasks                    | Shows why resets and realistic state matter; not a Slack environment                             |
| [REAL](https://github.com/agi-inc/REAL)                                     | Deterministic web replicas and browser-agent evaluation                       | Useful environment engineering comparison; do not infer Slack support from the general framework |
| [OpenEnv](https://github.com/huggingface/OpenEnv)                           | Standardized environments for agent/RL interaction                            | A future compatibility layer, not something this custom JS bridge claims to implement            |
| [OpenApps](https://huggingface.github.io/OpenEnv/environments/openapp.html) | Configurable apps including messaging, content/appearance variation           | Motivates separating task semantics from UI skin and measuring robustness to both                |
| [Scale RL environments](https://scale.com/rlenvironments)                   | Commercial description of computer-use and enterprise-tool environments       | Marketing/availability reference only; no public implementation or measured internals inspected  |

Commercial environments may provide broader task/data operations than a small open project. Public product descriptions are insufficient to rank their isolation, speed, fidelity or evaluation quality. No unsupported comparison is made here.

## 4. Slack behavior as the semantic reference

Official help pages were used to identify familiar workflows: [search](https://slack.com/help/articles/202528808-Search-in-Slack), [threads](https://slack.com/help/articles/115000769927-Use-threads-to-organize-discussions), [editing/deletion](https://slack.com/help/articles/202395258-Edit-or-delete-messages) and [sending/reading messages](https://slack.com/help/articles/201457107-Send-and-read-messages). [Role permissions](https://slack.com/help/articles/201314026-Permissions-by-role-in-Slack-Permissions-by-role-in-Slack) underscore that production ownership rules are configurable. Relay specifies its smaller policy explicitly: the actor can edit/delete only their own messages, and cannot delete roots with replies.

Slack's engineering posts on [Koi Pond load testing](https://slack.engineering/load-testing-with-koi-pond/) and [development environments](https://slack.engineering/development-environments-at-slack/) are useful reminders that realism and isolation have infrastructure costs. Their production architectures and scale are not requirements or measurements for this submission.

## 5. Build/reuse decision

| Option                   | Fast visual start  | Outcome/reset ready           | Local simplicity       | Main tradeoff                                        |
| ------------------------ | ------------------ | ----------------------------- | ---------------------- | ---------------------------------------------------- |
| Static clone/components  | High               | No                            | High                   | Must implement actual environment semantics          |
| Full collaboration clone | High               | Usually no benchmark contract | Often lower            | Auth, hosted DB and realtime machinery add scope     |
| Cua Slack task           | High               | Yes, existing task framework  | Framework-dependent    | Closest comparator; different grading/actor boundary |
| env0                     | High functionality | Yes, admin/state machinery    | Python stack           | More Slack breadth; review AGPL reuse obligations    |
| Agent-Diff               | API-first          | Yes                           | PostgreSQL-backed      | Add GUI to measure computer use                      |
| Original focused Relay   | Implemented here   | Yes, six explicit contracts   | One local Node process | Narrower fidelity; deliberate scale/security limits  |

For a short implementation/presentation exercise, owning the small state/evaluator core makes the tradeoffs easy to explain and falsify. If the next requirement becomes “evaluate the real Slack SDK,” revisit env0/Agent-Diff rather than endlessly expanding a custom API. If it becomes cross-app desktop interaction, prefer an established harness such as Cua/BrowserGym.

## 6. Next research experiments

1. **Independent policies:** run at least two unrelated agents on unseen task templates; report attempted episodes, failures and action budgets. Keep builder traces as smoke evidence only.
2. **Modality ablation:** same semantic task under screenshot-only, screenshot+accessibility tree and direct API conditions. API success is an upper-bound control, not equivalent CUA performance.
3. **Template holdout:** vary facts, actors, targets, distractor density and compositions. Seed-dependent names alone cannot prevent memorization.
4. **Grader challenges:** correct text/wrong destination, duplicate sends, replacement-not-edit, unintended deletes, forged browser success and repeated toggle actions. Add independent reference-state validation for new task families.
5. **Scaling study:** 1/4/8/16 simultaneous browser contexts, then process/container isolation tiers; record full process-tree RSS, CPU, p95/p99 step time, resets, failures and a multi-hour soak.
6. **Environment fidelity:** compare key behaviors against permitted real-Slack test workspaces; use synthetic fixtures and do not scrape private workspace data.

## Provenance and reproducibility

[Repository metadata](../evidence/research/repositories.json) records repository heads, commit dates, detected licenses, retrieval failures and pinned links. The three closest systems have selected [source-inspection records](../evidence/research/). Re-run `node scripts/research-snapshot.mjs` with the GitHub CLI to refresh public metadata; this changes provenance and should be reviewed, not silently treated as the original snapshot.

Search coverage included UI-only clones/components, full Slack clones, Slack RL/browser environments, API replicas, workplace benchmarks and primary Slack documentation. Useful reproducible search recipes: `Slack clone UI HTML CSS React`, `Slack environment reinforcement learning benchmark`, `site:github.com slack_env`, `mock-slack snapshot restore`, `Slack API agent benchmark state diff`, and `computer use environment isolation reset`. Star counts and copied tutorial multiplicity were not used as evidence of quality. Licenses detected by GitHub are a screening aid, not a legal conclusion.
