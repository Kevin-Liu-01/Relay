import {
  mkdirSync,
  writeFileSync,
  readFileSync,
  appendFileSync,
  readdirSync,
  renameSync,
} from 'node:fs';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { InterfaceEnvironment } from './interfaces.mjs';
import { observePointer } from './pointer-observer.mjs';
import { RampRouter, requestEstimate, responsePayload, RunStop } from './router.mjs';
import { TypeSafeRouter } from './typesafe.mjs';
import { validateConfig, schedule, aggregate, pairedComparisons } from './design.mjs';
import { buildInput, parseAction, PROTOCOL_VERSION, LLMS_TXT, SITE_GUIDE } from './protocol.mjs';
import { referenceAction } from './reference.mjs';
import {
  retainedRequestTimeout,
  acceptedOutputLimit,
  retainedConnectionFailure,
  acceptedEpisodeDeadline,
} from './campaign-policy.mjs';
const hash = (v) =>
  createHash('sha256')
    .update(typeof v === 'string' || Buffer.isBuffer(v) ? v : JSON.stringify(v))
    .digest('hex');
export const atomicJSON = (path, value) => {
  writeFileSync(path + '.tmp', JSON.stringify(value, null, 2));
  renameSync(path + '.tmp', path);
};

export function sourceFingerprint(root) {
  const files = ['server', 'runner', 'src', 'hosted', 'api', 'shared'].flatMap(function walk(p) {
    return readdirSync(join(root, p), { withFileTypes: true })
      .sort((a, b) => a.name.localeCompare(b.name))
      .flatMap((f) => (f.isDirectory() ? walk(`${p}/${f.name}`) : [`${p}/${f.name}`]));
  });
  files.push('package-lock.json', 'vercel.json');
  return hash(files.map((p) => [p, hash(readFileSync(join(root, p)))]));
}

export class Experiment {
  constructor({
    config,
    root,
    runRoot,
    environment,
    router,
    onChange = () => {},
    launcher = 'library',
    operatorVisuals = false,
    onRecord = () => {},
  }) {
    if (!['console', 'cli', 'library'].includes(launcher)) throw Error('Unknown run launcher.');
    this.config = validateConfig(config);
    if (
      launcher !== 'cli' &&
      (config.requestTimeoutSeconds !== undefined ||
        config.continueAfterRequestTimeout !== undefined ||
        config.continueAfterOutputLimit !== undefined ||
        config.continueAfterConnectionFailure !== undefined ||
        config.continueAfterEpisodeTimeout !== undefined)
    )
      throw Error('Request-timeout overrides require an explicitly reviewed CLI campaign.');
    this.router =
      router ??
      (this.config.provider === 'typesafe'
        ? new TypeSafeRouter({ apiKey: process.env.TYPESAFE_API_KEY })
        : new RampRouter());
    this.environment = environment;
    this.operatorVisuals = operatorVisuals;
    this.id = randomUUID();
    this.dir = join(runRoot, this.id);
    this.onChange = onChange;
    this.onRecord = onRecord;
    this.abort = new AbortController();
    this.data = {
      schemaVersion: 1,
      auditVersion: 2,
      id: this.id,
      launcher,
      operatorVisuals,
      status: 'queued',
      createdAt: new Date().toISOString(),
      evidenceKind:
        config.provider === 'reference' ? 'scripted-reference' : 'live-model-evaluation',
      protocolVersion: PROTOCOL_VERSION,
      config: this.config,
      configHash: hash(this.config),
      sourceHash: sourceFingerprint(root),
      guideHash: hash(LLMS_TXT + SITE_GUIDE),
      catalog: null,
      budget: { requests: 0, inputTokens: 0, outputTokens: 0, estimatedUSD: 0, usageKnown: true },
      episodes: schedule(config).map((cell) => ({ cell, status: 'queued', steps: 0 })),
      limitations: [
        'Development task templates; seeds do not form a reasoning holdout.',
        'API changes both visibility and action granularity.',
        'Local application isolation, not a hostile-code sandbox.',
        'Local cost estimates are not billing guarantees; use provider key caps.',
        'No statistical significance or novelty claim.',
      ],
    };
    mkdirSync(this.dir, { recursive: true, mode: 0o700 });
    this.persist();
  }
  persist() {
    this.data.summary = aggregate(this.data.episodes);
    this.data.paired = pairedComparisons(this.data.episodes);
    atomicJSON(join(this.dir, 'run.json'), this.data);
    this.onChange(this.data);
  }
  cancel() {
    this.abort.abort(new RunStop('cancelled', 'Cancelled by operator.'));
  }
  async run() {
    this.data.status = 'running';
    this.data.startedAt = new Date().toISOString();
    this.start = Date.now();
    this.persist();
    try {
      if (this.config.provider !== 'reference') {
        this.data.catalog = await this.router.models({
          signal: this.abort.signal,
          timeoutMs: Math.min(15000, this.config.runSeconds * 1000),
        });
        for (const m of this.config.models)
          if (!this.data.catalog.models.some((x) => x.id === m.id))
            throw new RunStop(
              'model_unavailable',
              `Model ${m.id} is not in this key's catalog. No substitution.`,
            );
        this.persist();
      }
      for (const episode of this.data.episodes) {
        this.checkRunBudget();
        await this.runEpisode(episode);
        if (
          (this.config.continueAfterRequestTimeout ||
            this.config.continueAfterOutputLimit ||
            this.config.continueAfterConnectionFailure ||
            this.config.continueAfterEpisodeTimeout) &&
          !['completed', 'step_limit'].includes(episode.status) &&
          !retainedRequestTimeout(this.config, episode) &&
          !acceptedOutputLimit(this.config, episode) &&
          !retainedConnectionFailure(this.config, episode) &&
          !acceptedEpisodeDeadline(this.config, episode)
        )
          throw new RunStop(
            'campaign_stop',
            'Failure outside the reviewed continuation policy; other cells remain unattempted.',
          );
        if (
          episode.status === 'provider_error' ||
          episode.status === 'unsupported_capability' ||
          episode.status === 'budget' ||
          (episode.status === 'output_limit' && !acceptedOutputLimit(this.config, episode)) ||
          (episode.usageKnown === false &&
            !retainedRequestTimeout(this.config, episode) &&
            !retainedConnectionFailure(this.config, episode))
        )
          throw new RunStop(
            'provider_stop',
            'Stopped after a budget limit, provider failure or missing usage. Other cells remain unattempted.',
          );
      }
      this.data.status = 'completed';
    } catch (e) {
      this.data.status = this.abort.signal.aborted ? 'cancelled' : 'stopped';
      this.data.stopReason = { code: e.code ?? 'harness_error', message: this.safeError(e) };
    } finally {
      this.data.finishedAt = new Date().toISOString();
      this.persist();
    }
    return this.data;
  }
  safeError(e) {
    let msg = String(e.message ?? e).slice(0, 800);
    if (this.router.apiKey) msg = msg.replaceAll(this.router.apiKey, '[redacted]');
    if (this.environment.controlToken)
      msg = msg.replaceAll(this.environment.controlToken, '[redacted]');
    return msg
      .replace(/\/s\/[a-f0-9]{64}/g, '/s/[redacted]')
      .replace(/[a-f0-9]{64}\.sqlite/g, '[session].sqlite');
  }
  checkRunBudget(checkRequests = true) {
    if (this.abort.signal.aborted) throw new RunStop('cancelled', 'Cancelled by operator.');
    if (Date.now() - this.start >= this.config.runSeconds * 1000)
      throw new RunStop('budget', 'Run wall-time limit reached.');
    if (
      checkRequests &&
      this.config.provider !== 'reference' &&
      this.data.budget.requests >= this.config.maxRequests
    )
      throw new RunStop('budget', 'Run request limit reached.');
  }
  async runEpisode(e) {
    const c = this.config,
      cell = e.cell,
      dir = join(this.dir, cell.episodeId);
    mkdirSync(dir);
    const start = Date.now(),
      env = new InterfaceEnvironment({
        ...this.environment,
        mode: cell.mode,
        operatorVisuals: this.operatorVisuals,
        maxSteps: c.maxSteps,
      });
    e.status = 'running';
    e.startedAt = new Date().toISOString();
    e.estimatedUSD = 0;
    e.usageKnown = true;
    this.persist();
    let traceHash = '0'.repeat(64),
      sequence = 0,
      turns = [];
    const record = (event) => {
      const value = {
        ...event,
        sequence: ++sequence,
        at: new Date().toISOString(),
        elapsedMs: Date.now() - start,
        previousHash: traceHash,
      };
      traceHash = hash(value);
      appendFileSync(
        join(dir, 'steps.jsonl'),
        JSON.stringify({ ...value, hash: traceHash }) + '\n',
      );
      this.onRecord(cell.episodeId, { ...value, hash: traceHash });
    };
    // Viewer evidence is not a policy observation. Record gaps without retrying
    // actions/inference or substituting a stale frame into the model's input.
    let operatorImageUnavailable = false;
    const capture = async (kind, step, fn) => {
      try {
        return await fn();
      } catch (err) {
        const warning = { kind, step, error: this.safeError(err) };
        (e.captureWarnings ??= []).push(warning);
        record({ kind: 'capture_warning', capture: warning });
        if (kind === 'operator_screenshot') operatorImageUnavailable = true;
        return null;
      }
    };
    try {
      let { instruction, observation } = await env.reset({ taskId: cell.taskId, seed: cell.seed });
      if (this.operatorVisuals && cell.mode !== 'api')
        await capture('pointer_observer', 0, () =>
          observePointer(env.base.page, (pointer) =>
            record({ kind: 'pointer', step: e.currentStep ?? 0, pointer }),
          ),
        );
      e.instruction = instruction;
      e.initialHash = env.initialHash;
      e.appProvenance = env.appProvenance;
      atomicJSON(join(dir, 'initial.json'), await env.export());
      record({
        kind: 'episode_started',
        instruction,
        initialHash: e.initialHash,
        appProvenance: e.appProvenance,
        artifacts: { 'initial.json': hash(readFileSync(join(dir, 'initial.json'))) },
      });
      for (let i = 0; i < c.maxSteps; i++) {
        this.checkRunBudget();
        if (Date.now() - start >= c.episodeSeconds * 1000)
          throw new RunStop('timeout', 'Episode wall-time limit reached.');
        const stepStart = performance.now();
        const obs = this.saveObservation(dir, i, observation);
        const captureStart = performance.now();
        const operatorImage =
          cell.mode !== 'pixels' && !operatorImageUnavailable
            ? await capture('operator_screenshot', i + 1, () => env.screenshot())
            : null;
        const operatorScreenshot = operatorImage
          ? `visual-${String(i).padStart(3, '0')}.png`
          : null;
        if (operatorImage)
          writeFileSync(join(dir, operatorScreenshot), Buffer.from(operatorImage, 'base64'));
        record({
          kind: 'observation',
          step: i + 1,
          observation: obs,
          replay: await capture('replay_snapshot', i + 1, () => env.replaySnapshot()),
          operatorScreenshot,
          artifacts: {
            ...(obs.imageFile ? { [obs.imageFile]: obs.imageHash } : {}),
            ...(operatorScreenshot
              ? { [operatorScreenshot]: hash(readFileSync(join(dir, operatorScreenshot))) }
              : {}),
          },
        });
        const operatorCaptureMs = performance.now() - captureStart;
        e.operatorScreenshot = operatorScreenshot;
        e.currentObservation = obs;
        e.currentStep = i + 1;
        this.persist();
        let response,
          action,
          error = null;
        const prompt = buildInput({
          instruction,
          mode: cell.mode,
          guide: cell.guide,
          history: cell.history,
          turns,
          observation,
        });
        let promptHash = hash(prompt);
        const requestFile = `request-${String(i + 1).padStart(3, '0')}.json`;
        const prepared =
          c.provider === 'typesafe'
            ? this.router.prepare({
                model: cell.model.id,
                instruction,
                observation,
                turns,
                guide: cell.guide,
                history: cell.history,
              })
            : null;
        if (prepared) promptHash = hash(prepared.body);
        const request =
          c.provider === 'reference'
            ? prompt
            : (prepared?.body ??
              responsePayload({
                model: cell.model.id,
                ...prompt,
                maxOutputTokens: c.maxOutputTokens,
                reasoning: cell.model.reasoning,
              }));
        atomicJSON(join(dir, requestFile), request);
        record({
          kind: 'input',
          step: i + 1,
          promptHash,
          requestFile,
          requestHash: hash(request),
          preparedOnly: true,
          artifacts: { [requestFile]: hash(readFileSync(join(dir, requestFile))) },
        });
        if (c.provider === 'reference') {
          response = {
            text: JSON.stringify(referenceAction(cell, observation, i, turns)),
            usage: null,
            latencyMs: 0,
            requestedModel: 'scripted-reference',
            returnedModel: null,
          };
        } else {
          const reservation = requestEstimate(
            prepared?.body ?? prompt,
            cell.model.rates,
            c.provider === 'typesafe' ? 0 : c.maxOutputTokens,
          );
          if (reservation.inputUpper > c.maxInputUnits)
            throw new RunStop('budget', 'Input-unit/context limit reached; no hidden truncation.');
          if (this.data.budget.estimatedUSD + reservation.usd > c.maxEstimatedUSD)
            throw new RunStop(
              'budget',
              `Next request needs $${reservation.usd.toFixed(4)} of estimated allowance; ` +
                `$${Math.max(0, c.maxEstimatedUSD - this.data.budget.estimatedUSD).toFixed(4)} remains ` +
                `of the $${c.maxEstimatedUSD.toFixed(2)} run cap. Raise the allowance in Run settings. ` +
                'This reservation is not a charge.',
            );
          this.data.budget.requests++;
          e.inFlight = true;
          e.usageKnown = false;
          this.data.budget.usageKnown = false;
          // Keep the whole reservation if the call fails/usage is unknown: never call it free.
          this.data.budget.estimatedUSD += reservation.usd;
          e.estimatedUSD += reservation.usd;
          this.persist();
          record({
            kind: 'request',
            step: i + 1,
            promptHash,
            reservedUSD: reservation.usd,
            inputUnits: reservation.inputUpper,
            requestedModel: cell.model.id,
            requestFile,
          });
          try {
            response = await this.router.respond({
              prepared,
              model: cell.model.id,
              ...prompt,
              maxOutputTokens: c.maxOutputTokens,
              reasoning: cell.model.reasoning,
              signal: this.abort.signal,
              timeoutMs: Math.max(
                1,
                Math.min(
                  (c.requestTimeoutSeconds ?? 30) * 1000,
                  c.episodeSeconds * 1000 - (Date.now() - start),
                  c.runSeconds * 1000 - (Date.now() - this.start),
                ),
              ),
            });
          } catch (err) {
            e.inFlight = false;
            e.usageKnown = false;
            if (err.name === 'TimeoutError' && !this.abort.signal.aborted)
              e.requestTimeoutReservationUSD = reservation.usd;
            if (err.code === 'provider_connection_error' && !this.abort.signal.aborted)
              e.connectionFailureReservationUSD = reservation.usd;
            if (err.code === 'output_limit' && err.receipt?.usage) {
              const usage = err.receipt.usage;
              const cost =
                (usage.inputTokens * cell.model.rates.input +
                  usage.outputTokens * cell.model.rates.output) /
                1e6;
              e.estimatedUSD += cost - reservation.usd;
              this.data.budget.estimatedUSD += cost - reservation.usd;
              this.data.budget.inputTokens += usage.inputTokens;
              this.data.budget.outputTokens += usage.outputTokens;
              e.usageKnown = true;
              e.outputLimitUsageAccepted = true;
            }
            if (err.receipt)
              e.providerFailure = {
                code: err.code,
                httpStatus: err.receipt.httpStatus,
                requestId: err.receipt.requestId,
                clientRequestId: err.receipt.clientRequestId,
                traceId: err.receipt.traceId,
              };
            this.data.budget.usageKnown = this.data.episodes.every((x) => x.usageKnown !== false);
            record({
              kind: 'provider_error',
              step: i + 1,
              error: this.safeError(err),
              receipt: err.receipt ?? null,
              reservedUSD: reservation.usd,
              usageAccepted: e.outputLimitUsageAccepted === true,
            });
            throw err;
          }
          if (response.usage) {
            const cost =
              (response.usage.inputTokens * cell.model.rates.input +
                response.usage.outputTokens * cell.model.rates.output) /
              1e6;
            e.estimatedUSD += cost - reservation.usd;
            this.data.budget.estimatedUSD += cost - reservation.usd;
            this.data.budget.inputTokens += response.usage.inputTokens;
            this.data.budget.outputTokens += response.usage.outputTokens;
            e.usageKnown = true;
            this.data.budget.usageKnown = this.data.episodes.every((x) => x.usageKnown !== false);
          } else {
            e.usageKnown = false;
            this.data.budget.usageKnown = false;
          }
          e.inFlight = false;
        }
        record({ kind: 'response', step: i + 1, promptHash, response });
        // Publish the end of inference before input starts. Waiting until the
        // next observation leaves spectators showing "Deciding" over real actions.
        this.persist();
        if (response.usage === null && c.provider !== 'reference')
          throw new RunStop(
            'usage_missing',
            'Provider omitted usage. No action executed; reservation retained.',
          );
        this.checkRunBudget(false);
        if (Date.now() - start >= c.episodeSeconds * 1000)
          throw new RunStop('timeout', 'Episode deadline reached before executing the response.');
        try {
          action = parseAction(response.text);
          record({ kind: 'action_started', step: i + 1, action });
          await env.act(action);
        } catch (err) {
          error = this.safeError(err);
        }
        e.steps++;
        e.lastAction = action ?? null;
        e.lastError = error;
        record({
          kind: 'step',
          step: e.steps,
          observation: obs,
          promptHash,
          response,
          action: action ?? null,
          error,
          operatorScreenshot,
          operatorCaptureMs,
          nonInferenceStepMs: performance.now() - stepStart - response.latencyMs,
        });
        turns.push({ observation, output: response.text, error });
        // Builder references are deterministic controls, not history-ablation policies.
        if (cell.history === 'recent-4' && c.provider !== 'reference') turns = turns.slice(-4);
        observation = await env.observe();
        e.currentObservation = this.saveObservation(dir, i + 1, observation);
        this.persist();
        if (response.usage === null && c.provider !== 'reference')
          throw new RunStop(
            'usage_missing',
            'Provider omitted usage; stopped conservatively with cost reservation retained.',
          );
        if (!error && action?.type === 'finish') {
          e.status = 'completed';
          break;
        }
        if (i === c.maxSteps - 1) e.status = 'step_limit';
      }
    } catch (err) {
      e.status = this.abort.signal.aborted
        ? 'cancelled'
        : typeof err.code === 'string'
          ? err.code
          : err.name === 'TimeoutError'
            ? 'timeout'
            : 'harness_error';
      e.error = this.safeError(err);
      record({ kind: 'episode_error', error: e.error, code: e.status });
    } finally {
      e.inFlight = false;
      if (env.base.session) {
        try {
          e.evaluation = await env.evaluate();
          atomicJSON(join(dir, 'outcome.json'), await env.export());
          const screenshot = await capture('final_screenshot', e.steps, () => env.screenshot());
          record({
            kind: 'replay_final',
            replay: await capture('final_replay', e.steps, () => env.replaySnapshot()),
          });
          if (screenshot) {
            writeFileSync(join(dir, 'final.png'), Buffer.from(screenshot, 'base64'));
            e.finalScreenshot = 'final.png';
          }
        } catch (err) {
          e.status = 'harness_error';
          e.error = this.safeError(err);
        }
      }
      try {
        await env.close();
      } catch (err) {
        e.cleanupError = this.safeError(err);
        e.status = 'harness_error';
        record({ kind: 'cleanup_error', error: e.cleanupError });
      }
      e.durationMs = Date.now() - start;
      e.finishedAt = new Date().toISOString();
      e.traceRoot = traceHash;
      record({
        kind: 'terminal',
        status: e.status,
        evaluation: e.evaluation ?? null,
        artifacts: Object.fromEntries(
          ['outcome.json', 'final.png']
            .filter((file) => readdirSync(dir).includes(file))
            .map((file) => [file, hash(readFileSync(join(dir, file)))]),
        ),
      });
      e.traceRoot = traceHash;
      atomicJSON(join(dir, 'episode.json'), e);
      this.persist();
    }
  }
  saveObservation(dir, index, observation) {
    if (!observation.image) return observation;
    const file = `observation-${String(index).padStart(3, '0')}.png`;
    writeFileSync(join(dir, file), Buffer.from(observation.image, 'base64'));
    return {
      interface: 'pixels',
      imageFile: file,
      viewport: observation.viewport,
      imageHash: hash(Buffer.from(observation.image, 'base64')),
    };
  }
}
