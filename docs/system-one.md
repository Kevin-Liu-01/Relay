# Jev / System One decisions

Relay supports **Jev through TypeSafe's hosted API**. It does not deploy Jev weights, provide an SGLang server or require your own GPU. The screen-first visual layout is inspired by the [SGLang decision-model demo](https://x.com/sgl_project/status/2105095379272515603); the implemented provider is TypeSafe because that is the available account.

## Connect

At [Relay Live](https://relay.kevinliu.studio), choose **Connect a key → Jev · TypeSafe**, paste a TypeSafe API key, and connect. Select the catalog-returned model (normally `jev-latest`), **Update a topic**, and **Accessibility** or **Page JSON**, then run. Do not paste a key into chat or commit it. A Jev web-app login alone is not an API credential; obtain the API key in your TypeSafe account if needed.

Official protocol inspected 2026-09-30: [TypeSafe API](https://docs.typesafe.ai/api), [models](https://docs.typesafe.ai/models), [TypeSafe SDK](https://github.com/typesafe-ai/typesafe-sdk-js). Current Jev is text-only. The configured starting rate is $0.042 per million input tokens and $0 output; verify your account's current terms before larger runs.

## What the policy sees and does

1. Capture the configured visible-page text representation.
2. Build a deterministic menu from disclosed, enabled controls. Offer clicks/hover, fills using literal task quotes and task search spans, basic keys, scroll, wait and finish.
3. Send task, observation, retained history, optional guide and the complete menu to `POST https://api.typesafe.ai/v1/systemone` as one Choice question.
4. Validate the returned choice, complete probability distribution, model identity and usage. Reject an invented action, malformed receipt or unsupported menu; never silently retry or truncate.
5. Execute only the selected offered action through the same restricted browser gateway. Record every candidate, probability, request, receipt and outcome.

The candidate builder is versioned `visible-controls-and-task-quotes-v1`. It cannot read the fixture seed, task ID, grader, reference policy or hidden state. Menus above 255 candidates fail closed. The model catalog is discovered through `GET /v1/models`; no substitute model is used when the selected ID is unavailable.

For CLI use, set `TYPESAFE_API_KEY` privately and run `npm run experiment -- models typesafe`.
A run config with `provider: "typesafe"` selects this adapter. The original port-4330
console remains Ramp-only and rejects Jev rather than routing a TypeSafe request
through a Ramp key. Prefer Relay Live on port 4340 for the Jev UI.

The side panel shows the **actual returned conditional probabilities over this offered menu**. These are not calibrated probabilities of completing the task. Generative policies have no equivalent menu distribution and are never given fabricated bars. The exact returned model version is preserved even when the selected ID is an alias.

## Comparison boundary

| Condition             | Observation                                   | Action policy                      |
| --------------------- | --------------------------------------------- | ---------------------------------- |
| Jev                   | Accessibility or visible-page JSON            | Select one deterministic candidate |
| Ramp generative model | Pixels, accessibility, page JSON or actor API | Generate a validated action        |

Jev currently rejects the free-composition handoff task, all 12 new multi-step
workflows and pixel/API conditions. The new tasks require composing outputs from
retrieved facts; their answers are never injected into Jev's candidate menu.
Unsupported combinations are disabled in the UI and rejected before inference.
This is not screenshot-grounded Jev computer use: the spectator sees pixels,
while Jev reads text. Menu construction is part of the harness, so comparing Jev
with a generative model changes both model and action policy. Report it as a
**system comparison**, not a clean model-only causal effect.

Keep task, seed, interface, guide, history, action/time budgets, candidate-policy version and app/source provenance explicit. Hosted Compare lists these factors but does not magically pair unlike runs or establish significance. The local factorial runner offers matched cells and paired summaries; development seeds are not held-out reasoning tasks.

## Evidence and remaining work

Contract tests use an explicitly fake TypeSafe transport with real browser interactions. They verify a four-action topic workflow, request/response integrity, probabilities, persistence boundaries and replay. They are **not real Jev inference**. No TypeSafe key was supplied during implementation, so Jev quality, billed latency and live API compatibility remain unverified until the first authenticated run.

Next gates: a small authenticated pilot, adversarial candidate/receipt cases, paired controlled runs, semantic task holdouts, a context-policy ablation and sustained resource measurements. A future SGLang adapter must implement and test its separate protocol; this TypeSafe adapter is not advertised as a drop-in `/v1/decisions` client.
