import { randomUUID, createHash } from 'node:crypto';
import { RelayEnvironment } from './environment.mjs';
import { INTERFACES } from './protocol.mjs';

// Trusted policy gateway. Never provide this object (or its base environment) to a model.
export class InterfaceEnvironment {
  constructor({ mode, operatorVisuals = false, ...options }) {
    if (!INTERFACES.includes(mode)) throw Error('Unknown interface.');
    this.mode = mode;
    this.operatorVisuals = operatorVisuals;
    this.base = new RelayEnvironment(options);
    this.aliases = new Map();
    this.reverse = new Map();
  }
  async reset(spec) {
    await this.base.closeEpisode();
    this.aliases.clear();
    this.reverse.clear();
    this.refs = null;
    this.monitorChannel = null;
    this.appProvenance = await this.actor('/health');
    if (this.mode === 'api') {
      this.base.session = await this.base.control('/sessions', 'POST', spec);
      if (this.operatorVisuals) await this.base.openPage();
    } else {
      // This gateway supplies its own observation; do not take a discarded PNG
      // during text/API setup or capture the first pixel observation twice.
      await this.base.reset(spec, { observe: false });
      this.base.page.setDefaultTimeout(2500);
    }
    const initial = await this.actor('/api/state');
    this.revision = initial.revision;
    this.initialHash = createHash('sha256').update(JSON.stringify(initial.state)).digest('hex');
    // Replace semantic seed IDs (e.g. qa-target) with opaque, episode-local IDs.
    for (const [prefix, items] of [
      ['u', initial.state.users],
      ['c', initial.state.channels],
    ]) {
      for (const item of items) this.alias(item.id, prefix);
    }
    this.apiResult = this.publicChannels(initial.state);
    return { instruction: this.base.session.task.instruction, observation: await this.observe() };
  }
  alias(id, prefix) {
    if (id == null) return null;
    if (!this.aliases.has(id)) {
      const name = `${prefix}${this.aliases.size + 1}`;
      this.aliases.set(id, name);
      this.reverse.set(name, id);
    }
    return this.aliases.get(id);
  }
  resolve(id) {
    if (!this.reverse.has(id)) throw Error('Unknown ID. Read the relevant conversation first.');
    return this.reverse.get(id);
  }
  publicChannels(s) {
    return {
      currentUser: this.alias(s.currentUserId, 'u'),
      users: s.users.map((u) => ({ id: this.alias(u.id, 'u'), name: u.name, handle: u.handle })),
      channels: s.channels
        .filter((c) => c.members.includes(s.currentUserId))
        .map((c) => ({
          id: this.alias(c.id, 'c'),
          name: c.name,
          kind: c.kind,
          topic: c.topic,
          description: c.description,
          members: c.members.map((id) => this.alias(id, 'u')),
        })),
    };
  }
  publicMessages(messages) {
    return messages.map((m) => ({
      ...m,
      id: this.alias(m.id, 'm'),
      channelId: this.alias(m.channelId, 'c'),
      userId: this.alias(m.userId, 'u'),
      parentId: this.alias(m.parentId, 'm'),
      reactions: Object.fromEntries(
        Object.entries(m.reactions).map(([k, v]) => [k, v.map((id) => this.alias(id, 'u'))]),
      ),
      savedBy: m.savedBy.map((id) => this.alias(id, 'u')),
    }));
  }
  async actor(path, body) {
    const r = await fetch(this.base.options.appURL + path, {
      method: body ? 'POST' : 'GET',
      signal: AbortSignal.timeout(this.base.options.controlTimeoutMs),
      headers: {
        'content-type': 'application/json',
        ...(this.base.session ? { 'x-session-token': this.base.session.token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await r.json();
    if (!r.ok) throw Error(data.error);
    return data;
  }
  async observe() {
    if (this.mode === 'api') return { interface: 'api', result: this.apiResult };
    const page = this.base.page;
    if (this.mode === 'pixels')
      return {
        image: (await this.base.captureScreenshot({ type: 'png', timeout: 10000 })).toString(
          'base64',
        ),
        viewport: this.base.options.viewport,
      };
    const ui = await page.evaluate(() => {
      const visibleRect = (el, rect) => {
        if (!rect.width || !rect.height) return false;
        let left = Math.max(0, rect.left),
          right = Math.min(innerWidth, rect.right),
          top = Math.max(0, rect.top),
          bottom = Math.min(innerHeight, rect.bottom);
        for (let p = el; p; p = p.parentElement) {
          const s = getComputedStyle(p);
          if (
            s.display === 'none' ||
            s.visibility === 'hidden' ||
            s.opacity === '0' ||
            p.getAttribute('aria-hidden') === 'true'
          )
            return false;
          if (
            p !== el &&
            /(auto|scroll|hidden|clip)/.test(s.overflow + s.overflowX + s.overflowY)
          ) {
            const r = p.getBoundingClientRect();
            left = Math.max(left, r.left);
            right = Math.min(right, r.right);
            top = Math.max(top, r.top);
            bottom = Math.min(bottom, r.bottom);
          }
        }
        return right > left && bottom > top;
      };
      const candidates = [
        ...document.querySelectorAll(
          'article[aria-label],button,input,textarea,select,a[href],[role="button"],[role="textbox"]',
        ),
      ];
      document
        .querySelectorAll('[data-relay-ref]')
        .forEach((el) => el.removeAttribute('data-relay-ref'));
      const elements = candidates
        .filter((el) => visibleRect(el, el.getBoundingClientRect()))
        .map((el, i) => {
          const ref = `e${i + 1}`;
          el.setAttribute('data-relay-ref', ref);
          return {
            ref,
            role:
              el.getAttribute('role') ||
              (el.tagName === 'BUTTON'
                ? 'button'
                : ['INPUT', 'TEXTAREA'].includes(el.tagName)
                  ? 'textbox'
                  : el.tagName.toLowerCase()),
            name: (
              el.getAttribute('aria-label') ||
              el.getAttribute('title') ||
              el.innerText ||
              el.getAttribute('placeholder') ||
              ''
            ).slice(0, 200),
            ...(el.value !== undefined ? { value: el.value } : {}),
            disabled: !!el.disabled,
          };
        });
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT),
        lines = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent.trim() || ['SCRIPT', 'STYLE'].includes(node.parentElement?.tagName))
          continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        if ([...range.getClientRects()].some((r) => visibleRect(node.parentElement, r)))
          lines.push(node.textContent.trim());
      }
      return { text: lines.join('\n'), elements };
    });
    this.refs = new Set(ui.elements.map((el) => el.ref));
    return this.mode === 'a11y'
      ? {
          interface: 'a11y',
          scope: 'rendered-document-tree; viewport action refs',
          tree: await page.locator('body').ariaSnapshot(),
          elements: ui.elements,
        }
      : {
          interface: 'json-ui',
          scope: 'viewport text and controls; not an occlusion-perfect pixel reconstruction',
          ...ui,
        };
  }
  async act(action) {
    if (action.type === 'finish') return;
    if (this.mode === 'api') return this.apiAction(action);
    if (this.mode === 'pixels') {
      this.base.validate(action);
      // No browser navigation/privileged shortcut, even though input keys are otherwise valid.
      if (action.type === 'key') safeKey(action.key);
      const p = this.base.page;
      if (action.type === 'click') await p.mouse.click(action.x, action.y);
      if (action.type === 'move') await p.mouse.move(action.x, action.y);
      if (action.type === 'type') await p.keyboard.insertText(action.text);
      if (action.type === 'key') await p.keyboard.press(action.key);
      if (action.type === 'scroll') {
        await p.mouse.move(action.x, action.y);
        await p.mouse.wheel(0, action.dy);
      }
    } else {
      const p = this.base.page;
      if (['click', 'hover', 'fill'].includes(action.type)) {
        if (!this.refs?.has(action.ref))
          throw Error('Use an element ref from the latest observation.');
        const target = p.locator(`[data-relay-ref="${action.ref}"]`);
        if (action.type === 'fill') {
          if (typeof action.text !== 'string' || action.text.length > 4000)
            throw Error('Text limit exceeded.');
          await target.fill(action.text);
        } else await target[action.type]();
      } else if (action.type === 'key') {
        this.base.validate(action);
        safeKey(action.key);
        await p.keyboard.press(action.key);
      } else if (action.type === 'scroll') {
        if (!Number.isFinite(action.dy) || Math.abs(action.dy) > 2000)
          throw Error('Invalid scroll.');
        await p.mouse.move(900, 500);
        await p.mouse.wheel(0, action.dy);
      } else if (action.type !== 'wait') throw Error('Action not allowed by this interface.');
    }
    await this.base.page.waitForTimeout(100);
  }
  async apiAction(a) {
    const snapshot = await this.actor('/api/state');
    const monitorId =
      a.channelId != null
        ? this.reverse.get(a.channelId)
        : snapshot.state.messages.find((m) => m.id === this.reverse.get(a.id))?.channelId;
    const monitorChannel = snapshot.state.channels.find((c) => c.id === monitorId);
    if (monitorChannel) this.monitorChannel = monitorChannel;
    this.revision = snapshot.revision;
    if (a.type === 'channels') this.apiResult = this.publicChannels(snapshot.state);
    else if (a.type === 'messages') {
      const channelId = this.resolve(a.channelId);
      if (
        !snapshot.state.channels.some(
          (c) => c.id === channelId && c.members.includes(snapshot.state.currentUserId),
        )
      )
        throw Error('Conversation unavailable.');
      this.apiResult = {
        messages: this.publicMessages(
          snapshot.state.messages.filter((m) => m.channelId === channelId),
        ),
      };
    } else if (a.type === 'search') {
      if (typeof a.query !== 'string' || a.query.length > 500) throw Error('Invalid query.');
      this.apiResult = {
        messages: this.publicMessages(
          (await this.actor(`/api/search?q=${encodeURIComponent(a.query)}`)).messages,
        ),
      };
    } else {
      if (
        ![
          'message.send',
          'message.edit',
          'message.delete',
          'reaction.toggle',
          'pin.toggle',
          'save.toggle',
          'channel.topic',
          'channel.description',
        ].includes(a.type)
      )
        throw Error('Action not allowed by this interface.');
      const action = { ...a };
      for (const key of ['id', 'channelId', 'parentId'])
        if (action[key] != null) action[key] = this.resolve(action[key]);
      this.apiResult = await this.actor('/api/action', {
        requestId: randomUUID(),
        revision: this.revision,
        action,
      });
    }
  }
  async evaluate() {
    return this.base.control(`/sessions/${this.base.session.token}/evaluate`);
  }
  async export() {
    return this.base.control(`/sessions/${this.base.session.token}/export`);
  }
  async screenshot() {
    // Operator-only rendering of the SAME API session. Never included in API policy inputs.
    if (this.mode === 'api' && this.base.page) {
      await this.base.page.reload({ timeout: 10000 });
      await this.base.page
        .getByRole('textbox', { name: 'Search Northstar' })
        .waitFor({ timeout: 10000 });
      if (this.monitorChannel) {
        const c = this.monitorChannel;
        await this.base.page
          .getByRole('button', {
            name: `${c.kind === 'dm' ? 'Direct message' : 'Channel'} ${c.name}`,
            exact: true,
          })
          .click();
      }
    }
    // Observer captures have their own finite deadline, not the 2.5s action timeout.
    return this.base.page
      ? (await this.base.captureScreenshot({ type: 'png', timeout: 5000 })).toString('base64')
      : null;
  }
  async close() {
    await this.base.close();
  }
  async replaySnapshot() {
    if (!this.operatorVisuals || !this.base.page) return null;
    return this.base.page.evaluate(() => window.__relayCapture?.() ?? null);
  }
}

function safeKey(key) {
  if (key.includes('+') && !/^(?:(?:Control|Meta)\+[akgf]|Shift\+(?:Enter|Tab))$/i.test(key))
    throw Error('Browser-level shortcut is not allowed.');
}
