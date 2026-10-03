import { randomUUID, createHash } from 'node:crypto';

export class RunStop extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const hash = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex');

// Classify only known transport errors, never an arbitrary exception or an HTTP
// rejection. Preserve fixed metadata, not upstream messages/URLs/headers.
const connectionCodes = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'EPIPE',
  'ENOTFOUND',
  'EAI_AGAIN',
  'ETIMEDOUT',
  'UND_ERR_SOCKET',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
]);
function connectionFailure(error, receipt, signal) {
  if (signal?.aborted || ['AbortError', 'TimeoutError'].includes(error.name)) return error;
  const code = error.cause?.code ?? error.code;
  if (!connectionCodes.has(code)) return error;
  const failure = new RunStop(
    'provider_connection_error',
    'Router connection interrupted before a complete receipt. Usage is unknown; reservation retained. No automatic retry.',
  );
  failure.receipt = { ...receipt, failureCode: 'provider_connection_error', transportCode: code };
  return failure;
}

// Only keep the catalog fields used for admission. Do not serialize arbitrary
// provider metadata. Base rates use the same USD/M-token units as Router's table.
export function catalogModel(model) {
  const row = { id: model.id, owned_by: model.owned_by ?? null };
  if (model.router == null) return row; // Older catalogs use exact-ID docs fallback.
  const meta = model.router;
  const validIdentity = meta.schema_version === 1 && meta.request_name === model.id;
  const callable = validIdentity && ['active', 'deprecated'].includes(meta.status);
  const responds = Array.isArray(meta.surfaces) && meta.surfaces.includes('responses');
  const rate = (value) => {
    if (!(
      typeof value === 'number' ||
      (typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value))
    ))
      return null;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 && n <= 1000 ? n : null;
  };
  const input = rate(meta.pricing?.input),
    output = rate(meta.pricing?.output);
  return {
    ...row,
    catalogRates:
      callable && responds && input != null && output != null ? { input, output } : null,
    unavailableReason: !validIdentity
      ? 'Unrecognized catalog metadata; reconnect after Router updates it.'
      : !callable
        ? 'Router marks this model unavailable.'
        : !responds
          ? 'This model needs a different API. For Jev, connect TypeSafe.'
          : input == null || output == null
            ? 'Router did not supply valid base pricing for this exact model.'
            : null,
  };
}

// Status meanings: https://docs.router.com/api/errors-and-limits (2026-09-30).
// Fixed local messages only: never persist an upstream body that may echo secrets.
function httpFailure(status) {
  return (
    {
      400: [
        'provider_request_invalid',
        'Router rejected the request format. Inspect the evidence before retrying.',
      ],
      401: [
        'credentials_invalid',
        'Router rejected this key. Check that it is active and within its spend limits, then reconnect.',
      ],
      402: ['credits_exhausted', 'Router reports no available credit. Check your Router balance.'],
      403: [
        'provider_unavailable',
        'Router reports that this provider is unavailable. Choose another model or check provider access in Router.',
      ],
      404: [
        'model_unavailable',
        'This model is unavailable to your key. Refresh the connection and choose an available model.',
      ],
      429: [
        'provider_rate_limited',
        'Router or the provider is rate limited. Wait before starting another run.',
      ],
      501: [
        'unsupported_capability',
        'The provider cannot support this request. Choose another model or supported interface.',
      ],
      503: [
        'provider_unavailable',
        'Router reports temporarily unavailable credentials or pricing. Try another model or check Router later.',
      ],
    }[status] ?? [
      'provider_error',
      'Router could not complete this request. Inspect the evidence and Router logs.',
    ]
  );
}

// Shared with the audit recorder so the saved body is the body sent on the wire.
// Authentication headers are intentionally not part of this object.
export const responsePayload = ({ model, instructions, input, maxOutputTokens, reasoning }) => ({
  model,
  instructions,
  input,
  max_output_tokens: maxOutputTokens,
  stream: false,
  store: false,
  allow_flex_tier: false,
  ...(reasoning ? { reasoning: { effort: reasoning } } : {}),
});

// Server-side only. Never import into the frontend or serialize this instance.
export class RampRouter {
  constructor({
    apiKey = process.env.RAMP_ROUTER_API_KEY,
    baseURL = 'https://api.router.com/v1',
    fetchImpl = fetch,
  } = {}) {
    this.apiKey = apiKey;
    this.baseURL = baseURL.replace(/\/$/, '');
    this.fetchImpl = fetchImpl;
    if (this.baseURL !== 'https://api.router.com/v1')
      throw Error(
        'Ramp credentials may only be sent to api.router.com. Use an injected transport for tests.',
      );
  }
  async models({ signal, timeoutMs = 15000 } = {}) {
    if (!this.apiKey)
      throw new RunStop(
        'credentials_missing',
        'Set RAMP_ROUTER_API_KEY in the server environment or local .env.',
      );
    const r = await this.fetchImpl(`${this.baseURL}/models`, {
      headers: { authorization: `Bearer ${this.apiKey}` },
      signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(timeoutMs)]),
      redirect: 'error',
    });
    if (!r.ok) {
      const [, message] = httpFailure(r.status);
      throw new RunStop(
        'catalog_error',
        `${message} Catalog HTTP ${r.status}. No automatic retry.`,
      );
    }
    const data = await r.json();
    if (!Array.isArray(data.data) || data.data.some((m) => typeof m.id !== 'string'))
      throw new RunStop('catalog_error', 'Invalid Router model catalog.');
    return {
      at: new Date().toISOString(),
      hash: hash(data),
      models: data.data.map(catalogModel),
    };
  }
  async respond({
    model,
    instructions,
    input,
    maxOutputTokens,
    signal,
    timeoutMs = 30000,
    reasoning,
  }) {
    if (!this.apiKey) throw new RunStop('credentials_missing', 'Ramp Router key is missing.');
    const requestId = randomUUID();
    const payload = responsePayload({ model, instructions, input, maxOutputTokens, reasoning });
    const start = performance.now();
    const requestReceipt = {
      requestedModel: model,
      clientRequestId: requestId,
      requestId,
      requestHash: hash(payload),
    };
    const r = await this.fetchImpl(`${this.baseURL}/responses`, {
      method: 'POST',
      redirect: 'error',
      headers: {
        authorization: `Bearer ${this.apiKey}`,
        'content-type': 'application/json',
        'x-request-id': requestId,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.any([...(signal ? [signal] : []), AbortSignal.timeout(timeoutMs)]),
    }).catch((error) => {
      throw connectionFailure(error, requestReceipt, signal);
    });
    const receipt = {
      requestedModel: model,
      clientRequestId: requestId,
      requestId: r.headers.get('x-request-id') || requestId,
      traceId: r.headers.get('x-trace-id'),
      httpStatus: r.status,
      latencyMs: performance.now() - start,
      requestHash: hash(payload),
    };
    const rejectReceipt = (code, message, metadata = {}) => {
      const error = new RunStop(code, message);
      error.receipt = { ...receipt, ...metadata };
      return error;
    };
    // Do not log raw upstream errors: some echo requests or authentication material.
    if (!r.ok) {
      const [code, message] = httpFailure(r.status);
      throw rejectReceipt(
        code,
        `${message} HTTP ${r.status}; request ${receipt.requestId}. No automatic retry.`,
        { failureCode: code },
      );
    }
    const d = await r.json().catch((error) => {
      throw connectionFailure(error, receipt, signal);
    });
    const metadata = {
      responseHash: hash(d),
      responseId: typeof d.id === 'string' ? d.id : null,
      providerStatus: typeof d.status === 'string' ? d.status : null,
      returnedModel: typeof d.model === 'string' ? d.model : null,
      incompleteReason: ['max_output_tokens', 'content_filter'].includes(
        d.incomplete_details?.reason,
      )
        ? d.incomplete_details.reason
        : null,
    };
    const validCount = (n) => Number.isSafeInteger(n) && n >= 0;
    if (
      d.usage &&
      (!validCount(d.usage.input_tokens) ||
        !validCount(d.usage.output_tokens) ||
        (d.usage.input_tokens_details?.cached_tokens != null &&
          (!validCount(d.usage.input_tokens_details.cached_tokens) ||
            d.usage.input_tokens_details.cached_tokens > d.usage.input_tokens)) ||
        (d.usage.output_tokens_details?.reasoning_tokens != null &&
          (!validCount(d.usage.output_tokens_details.reasoning_tokens) ||
            d.usage.output_tokens_details.reasoning_tokens > d.usage.output_tokens)))
    )
      throw rejectReceipt(
        'provider_receipt_invalid',
        `Router returned invalid usage; request ${requestId}. Cost reservation retained.`,
        metadata,
      );
    const usage = d.usage
      ? {
          inputTokens: d.usage.input_tokens,
          outputTokens: d.usage.output_tokens,
          cachedInputTokens: d.usage.input_tokens_details?.cached_tokens ?? null,
          reasoningTokens: d.usage.output_tokens_details?.reasoning_tokens ?? null,
        }
      : null;
    // A truncated answer is unusable, but validated token usage is still a receipt.
    // Never expose or execute its partial text. Other invalid responses stay fail-closed.
    if (
      d.status === 'incomplete' &&
      metadata.incompleteReason === 'max_output_tokens' &&
      Array.isArray(d.output) &&
      usage
    )
      throw rejectReceipt(
        'output_limit',
        `The model reached its output-token limit. Request ${receipt.requestId}. No action executed.`,
        { ...metadata, usage },
      );
    if (d.status !== 'completed' || !Array.isArray(d.output))
      throw rejectReceipt(
        'provider_receipt_invalid',
        `${metadata.incompleteReason === 'max_output_tokens' ? 'The model reached its output-token limit before finishing a response.' : 'Router did not return a completed response.'} Request ${receipt.requestId}. No action executed.`,
        { ...metadata, usage },
      );
    const text = d.output
      .filter((x) => x.type === 'message')
      .flatMap((x) => x.content ?? [])
      .filter((x) => x.type === 'output_text')
      .map((x) => (typeof x.text === 'string' ? x.text : ''))
      .join('');
    return {
      ...receipt,
      responseHash: metadata.responseHash,
      text,
      requestedModel: model,
      returnedModel: d.model ?? null,
      status: d.status ?? null,
      usage,
      requestId: r.headers.get('x-request-id') || requestId,
      traceId: r.headers.get('x-trace-id'),
      responseId: d.id ?? null,
      provider: d.provider ?? null,
      latencyMs: performance.now() - start,
      requestHash: hash(payload),
    };
  }
}

export function requestEstimate(payload, rates, maxOutputTokens) {
  // Deliberately conservative byte-based reservation, not a tokenizer measurement.
  // Image cost is model-dependent; reserve 8192 input tokens per low-detail image.
  let images = 0;
  const text = JSON.stringify(payload, (key, value) => {
    if (key === 'image_url') {
      images++;
      return '[image]';
    }
    return value;
  });
  const inputUpper = Buffer.byteLength(text) + images * 8192;
  return { inputUpper, usd: (inputUpper * rates.input + maxOutputTokens * rates.output) / 1e6 };
}

export function validateRates(rates) {
  if (
    !rates ||
    !['input', 'output'].every((k) => Number.isFinite(rates[k]) && rates[k] > 0 && rates[k] <= 1000)
  )
    throw new RunStop(
      'pricing_missing',
      'Provide positive input/output USD per million token rates; unknown prices cannot be zero.',
    );
}
