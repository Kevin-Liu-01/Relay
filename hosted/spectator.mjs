// Keep the viewing feed separate from fresh, bounded native PNG captures.
// Do not stop/restart the screencast: that degraded frame delivery in cloud tests.
const STREAM_OPTIONS = {
  format: 'jpeg',
  quality: 65,
  maxWidth: 1440,
  maxHeight: 900,
  everyNthFrame: 1,
};

async function bounded(promise, timeout, phase) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Error(`Screenshot ${phase} timed out.`)), timeout);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function startSpectator(page, emitFrame) {
  const session = await page.context().newCDPSession(page);
  let last = 0,
    sequence = 0,
    pending,
    timer,
    closed = false;
  const flush = () => {
    timer = null;
    if (closed || !pending) return;
    last = Date.now();
    emitFrame({ ...pending, sequence: ++sequence });
    pending = null;
  };
  const close = () => {
    closed = true;
    clearTimeout(timer);
    pending = null;
  };
  page.on?.('close', close);
  session.on('Disconnected', close);
  session.on('Page.screencastFrame', ({ data, sessionId, metadata }) => {
    session.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    if (closed) return;
    // Conflate intermediate frames, but always deliver the last changed screen.
    // A trailing timer avoids leaving the viewer stuck just before a UI update.
    pending = {
      image: `data:image/jpeg;base64,${data}`,
      at: Date.now(),
      capturedAt: metadata?.timestamp ? metadata.timestamp * 1000 : null,
      viewport: page.viewportSize?.() ?? { width: 1440, height: 900 },
    };
    if (!timer) {
      const wait = Math.max(0, 80 - (Date.now() - last));
      if (wait) timer = setTimeout(flush, wait);
      else flush();
    }
  });
  await bounded(session.send('Page.startScreencast', STREAM_OPTIONS), 1000, 'stream startup');
  return async (options) => {
    if (options.type !== 'png' || !(options.timeout > 0))
      throw Error('Bounded PNG capture required.');
    const deadline = performance.now() + options.timeout;
    const within = (promise, phase) =>
      bounded(promise, Math.max(1, deadline - performance.now()), phase);
    await within(session.send('Page.bringToFront'), 'activation');
    await within(
      page.evaluate(() => document.fonts.ready.then(() => true)),
      'fonts',
    );
    const { data } = await within(
      session.send('Page.captureScreenshot', {
        format: 'png',
        fromSurface: true,
        captureBeyondViewport: false,
        optimizeForSpeed: true,
      }),
      'native capture',
    );
    const png = Buffer.from(data, 'base64');
    if (!png.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a', 'hex')))
      throw Error('Native capture did not return a PNG.');
    return png;
  };
}
