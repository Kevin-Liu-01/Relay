import { chromium } from 'playwright-core';

/** Trusted trainer-side bridge. Never expose this object/controlToken to a policy. */
export class RelayEnvironment {
  constructor({
    appURL = 'http://127.0.0.1:4318',
    controlURL = 'http://127.0.0.1:4319',
    controlToken,
    observation = 'screenshot',
    maxSteps = 60,
    viewport = { width: 1440, height: 900 },
    controlTimeoutMs = 10000,
    launchOptions = {},
    onPage,
  } = {}) {
    if (!controlToken) throw Error('A trainer control token is required.');
    if (!['screenshot', 'dom'].includes(observation)) throw Error('Unknown observation mode.');
    if (!Number.isInteger(maxSteps) || maxSteps < 1 || maxSteps > 200)
      throw Error('maxSteps must be 1..200.');
    if (!Number.isInteger(controlTimeoutMs) || controlTimeoutMs < 1 || controlTimeoutMs > 10000)
      throw Error('controlTimeoutMs must be 1..10000.');
    this.options = {
      appURL,
      controlURL,
      controlToken,
      observation,
      maxSteps,
      viewport,
      controlTimeoutMs,
      launchOptions,
      onPage,
    };
  }
  async control(path, method = 'GET', body) {
    const r = await fetch(this.options.controlURL + path, {
      method,
      signal: AbortSignal.timeout(this.options.controlTimeoutMs),
      headers: {
        authorization: `Bearer ${this.options.controlToken}`,
        'content-type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const d = await r.json();
    if (!r.ok) throw Error(d.error);
    return d;
  }
  async reset({ taskId = 'thread-reply', seed = 42 } = {}, { observe = true } = {}) {
    await this.closeEpisode();
    this.session = await this.control('/sessions', 'POST', { taskId, seed });
    await this.openPage();
    return {
      observation: observe ? await this.observe() : null,
      instruction: this.session.task.instruction,
      info: { taskId, seed, maxSteps: this.options.maxSteps },
    };
  }
  async openPage() {
    this.browser ??= await chromium.launch({ headless: true, ...this.options.launchOptions });
    this.context = await this.browser.newContext({
      viewport: this.options.viewport,
      locale: 'en-US',
      timezoneId: 'UTC',
      serviceWorkers: 'block',
    });
    this.page = await this.context.newPage();
    this.steps = 0;
    this.done = false;
    this.transitions = [];
    // The browser may only fetch its actor origin. No control-plane requests.
    await this.context.route('**/*', (route) =>
      new URL(route.request().url()).origin === new URL(this.options.appURL).origin
        ? route.continue()
        : route.abort(),
    );
    await this.page.goto(`${this.options.appURL}/s/${this.session.token}`, { timeout: 10000 });
    await this.page.getByRole('textbox', { name: 'Search Northstar' }).waitFor({ timeout: 10000 });
    await this.options.onPage?.(this.page);
  }
  async observe() {
    const screenshot = (await this.page.screenshot({ type: 'png', timeout: 10000 })).toString(
      'base64',
    );
    return {
      screenshot,
      mimeType: 'image/png',
      viewport: this.options.viewport,
      ...(this.options.observation === 'dom'
        ? { dom: await this.page.locator('body').ariaSnapshot() }
        : {}),
    };
  }
  validate(a) {
    if (!a || !['click', 'move', 'type', 'key', 'scroll', 'wait', 'finish'].includes(a.type))
      throw Error('Unsupported action.');
    if (
      ['click', 'move', 'scroll'].includes(a.type) &&
      (!Number.isFinite(a.x) ||
        !Number.isFinite(a.y) ||
        a.x < 0 ||
        a.y < 0 ||
        a.x >= this.options.viewport.width ||
        a.y >= this.options.viewport.height)
    )
      throw Error('Coordinates outside viewport.');
    if (a.type === 'type' && (typeof a.text !== 'string' || a.text.length > 4000))
      throw Error('Text must be at most 4000 characters.');
    if (
      a.type === 'key' &&
      (typeof a.key !== 'string' ||
        !/^(?:(?:Control|Meta|Shift|Alt)\+){0,3}(?:[a-zA-Z0-9]|Enter|Escape|Tab|Backspace|Delete|ArrowUp|ArrowDown|ArrowLeft|ArrowRight|Home|End|Space)$/.test(
          a.key,
        ))
    )
      throw Error('Unsupported key.');
    if (a.type === 'scroll' && (!Number.isFinite(a.dy) || Math.abs(a.dy) > 2000))
      throw Error('Scroll outside step limit.');
  }
  async step(action) {
    if (!this.page || this.done) throw Error('Reset before stepping a new episode.');
    this.validate(action);
    const start = performance.now();
    this.steps++;
    let error = null;
    try {
      if (action.type === 'click') await this.page.mouse.click(action.x, action.y);
      if (action.type === 'move') await this.page.mouse.move(action.x, action.y);
      if (action.type === 'type') await this.page.keyboard.insertText(action.text);
      if (action.type === 'key') await this.page.keyboard.press(action.key);
      if (action.type === 'scroll') {
        await this.page.mouse.move(action.x, action.y);
        await this.page.mouse.wheel(0, action.dy);
      }
      // Fixed UI settling interval, including explicit wait. No oracle-guided waiting.
      await this.page.waitForTimeout(100);
    } catch (e) {
      error = e.message.slice(0, 250);
    }
    const terminated = action.type === 'finish',
      truncated = !terminated && this.steps >= this.options.maxSteps;
    this.done = terminated || truncated;
    const evaluation = this.done
      ? await this.control(`/sessions/${this.session.token}/evaluate`)
      : null;
    const reward = evaluation?.reward ?? 0;
    this.transitions.push({
      step: this.steps,
      action,
      error,
      durationMs: performance.now() - start,
      reward,
      terminated,
      truncated,
    });
    return {
      observation: await this.observe(),
      reward,
      terminated,
      truncated,
      info: { step: this.steps, error },
    };
  }
  async export() {
    if (!this.session) throw Error('No episode.');
    return {
      evidenceKind: 'trainer-browser-episode',
      observationMode: this.options.observation,
      transitions: this.transitions,
      ...(await this.control(`/sessions/${this.session.token}/export`)),
    };
  }
  async closeEpisode() {
    await this.context?.close();
    this.context = null;
    this.page = null;
    if (this.session) {
      await this.control(`/sessions/${this.session.token}`, 'DELETE');
      this.session = null;
    }
  }
  async close() {
    try {
      await this.closeEpisode();
    } finally {
      await this.browser?.close();
      this.browser = null;
    }
  }
}
