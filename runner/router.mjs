import { randomUUID, createHash } from 'node:crypto';

export class RunStop extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}
const hash = (v) => createHash('sha256').update(JSON.stringify(v)).digest('hex');

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
    if (!r.ok)
      throw new RunStop(
        'catalog_error',
        `Router catalog HTTP ${r.status}. Check your key and account access.`,
      );
    const data = await r.json();
    if (!Array.isArray(data.data) || data.data.some((m) => typeof m.id !== 'string'))
      throw new RunStop('catalog_error', 'Invalid Router model catalog.');
    return {
      at: new Date().toISOString(),
      hash: hash(data),
      models: data.data.map((m) => ({ id: m.id, owned_by: m.owned_by ?? null })),
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
    if (!r.ok)
      throw rejectReceipt(
        r.status === 501 ? 'unsupported_capability' : 'provider_error',
        `Router HTTP ${r.status}; request ${requestId}. No automatic retry.`,
      );
    const d = await r.json();
    const metadata = {
      responseHash: hash(d),
      responseId: typeof d.id === 'string' ? d.id : null,
      providerStatus: typeof d.status === 'string' ? d.status : null,
      returnedModel: typeof d.model === 'string' ? d.model : null,
    };
    if (d.status !== 'completed' || !Array.isArray(d.output))
      throw rejectReceipt(
        'provider_receipt_invalid',
        `Router did not return a completed response; request ${requestId}. No action executed.`,
        metadata,
      );
    const text = (d.output ?? [])
      .filter((x) => x.type === 'message')
      .flatMap((x) => x.content ?? [])
      .filter((x) => x.type === 'output_text')
      .map((x) => (typeof x.text === 'string' ? x.text : ''))
      .join('');
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
