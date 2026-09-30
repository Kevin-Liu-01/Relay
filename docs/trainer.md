# Trainer and operator interface

## Minimal integration

Run the app with `ALLOW_DEMO=0 npm start`, install Chromium, then use the trusted bridge in a Node trainer:

```js
import { readFileSync, writeFileSync } from 'node:fs';
import { RelayEnvironment } from './runner/environment.mjs';

const env = new RelayEnvironment({
  controlToken: readFileSync('.runtime/control-token', 'utf8').trim(),
  observation: 'screenshot', // or 'dom': screenshot + visible accessibility tree
  maxSteps: 60,
});
try {
  let result = await env.reset({ taskId: 'thread-reply', seed: 47 });
  // Give ONLY result.instruction and result.observation to the policy.
  // action = await yourPolicy(result.observation, instruction);
  result = await env.step({ type: 'wait' });
  result = await env.step({ type: 'finish' }); // this no-op episode scores zero
  writeFileSync('episode.json', JSON.stringify(await env.export(), null, 2));
} finally {
  await env.close();
}
```

The example is an integration skeleton, not a trained policy. Connect your preferred vision model's action schema to the bounded actions below. The deliverable does not require a paid model key and does not start training automatically.

## Observation/action contract

`reset()` returns `{instruction, observation, info}`. Observation has a base64 PNG, MIME type and viewport `{width:1440,height:900}`. DOM mode adds `dom`, a visible accessibility-tree snapshot. Screenshot mode never adds DOM. No source code, state JSON, task answers, internal message IDs or control token are returned by the bridge.

| Action   | Fields                | Meaning                                                   |
| -------- | --------------------- | --------------------------------------------------------- |
| `click`  | `x`, `y`              | Left click within the viewport                            |
| `move`   | `x`, `y`              | Hover to reveal message controls                          |
| `type`   | `text` (≤4,000 chars) | Insert into currently focused control                     |
| `key`    | `key`                 | Allowlisted key/chord, e.g. `Control+k`, `ArrowUp`, `Tab` |
| `scroll` | `x`, `y`, `dy`        | Scroll under pointer, ≤2,000 px per step                  |
| `wait`   | —                     | Allow a fixed short UI settling interval                  |
| `finish` | —                     | End episode and grade final state                         |

`step()` returns `{observation,reward,terminated,truncated,info}`. A valid action consumes one step; invalid action schemas throw to the trainer. Exhausting the budget truncates and grades. Finishing terminates and grades. Both may return zero or one. A fixed 100 ms settling interval is deliberately simple; an asynchronous server would need request-aware settling without oracle access. Add an outer wall-clock/model-token budget in the trainer.

The bridge launches headless Chromium, one fresh context per episode; browser requests outside the app origin are blocked. Browser context isolation is not a hostile-JavaScript/OS sandbox. The trusted object has `page` and `control` for orchestration/testing—never serialize or expose it as an agent tool. The app's normal browser API remains inspectable in DOM/devtools-enabled settings, so enforce modality through the policy's action gateway.

## Operator HTTP API (port 4319)

All routes require `Authorization: Bearer CONTROL_TOKEN`. Requests carrying `Origin` are rejected. This is an additional browser boundary, not authentication by itself.

| Method/path                     | Body / result                                  |
| ------------------------------- | ---------------------------------------------- |
| `GET /tasks`                    | Task instructions at seed 42                   |
| `POST /sessions`                | `{taskId,seed}` → token, metadata, instruction |
| `POST /sessions/:token/reset`   | Same fixture, increased revision               |
| `GET /sessions/:token/evaluate` | Reward and diagnostic checks                   |
| `GET /sessions/:token/export`   | State, task, audit events and evaluation       |
| `DELETE /sessions/:token`       | Close exactly one session                      |

## Actor HTTP API (port 4318)

`GET /api/state`, `GET /api/search?q=...`, `POST /api/action` and `POST /api/events` require `x-session-token`. The React application uses these; a screenshot policy should not receive them as extra tools. An action body is `{requestId,revision,action}`. Available state transitions are `message.send`, `message.edit`, `message.delete`, `reaction.toggle`, `pin.toggle`, `save.toggle`, and `channel.topic`.

Error status: 400 validation, 401 bad capability, 403 ownership/origin, 404 unknown resource, 409 stale/conflicting write, 410 expired session, 413 oversized body, 429 session/event cap. Stale writes never silently overwrite newer state. The UI refreshes and asks the operator/agent to retry.

## Search and keyboard behavior

Queries AND their terms, are case-insensitive, accept quoted phrases and negative terms. Supported filters: `in:channel`, `from:handle`, `from:me`, `has:pin`, `has:reaction`, `is:thread`, `before:YYYY-MM-DD`, `after:YYYY-MM-DD`, `on:YYYY-MM-DD`. Dates use UTC; before/after are exclusive. `is:thread` matches replies, not every root that has replies. This is a documented subset, not Slack search parity.

Ctrl/Cmd+K: quick switcher. Ctrl/Cmd+G (also F): search. Enter: send; Shift+Enter: newline. ArrowUp in an empty channel composer: edit your latest root message. Escape closes panels/dialogs. The environment intentionally has no upload or call buttons that pretend to work.
