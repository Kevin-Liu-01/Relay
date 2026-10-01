// A live screencast and an exact PNG share Chromium's compositor. Pause the
// spectator around each fresh capture; never replace it with a cached JPEG.
const STREAM_OPTIONS = {
  format: 'jpeg',
  quality: 65,
  maxWidth: 1440,
  maxHeight: 900,
  everyNthFrame: 1,
};

async function command(session, method, params) {
  let timer;
  try {
    return await Promise.race([
      session.send(method, params),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(Error(`Viewer ${method} timed out.`)), 1000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function startSpectator(page, emitFrame) {
  const session = await page.context().newCDPSession(page);
  let last = 0;
  session.on('Page.screencastFrame', ({ data, sessionId }) => {
    session.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
    if (Date.now() - last < 220) return;
    last = Date.now();
    emitFrame({ image: `data:image/jpeg;base64,${data}`, at: last });
  });
  await command(session, 'Page.startScreencast', STREAM_OPTIONS);
  return async (options) => {
    await command(session, 'Page.stopScreencast');
    try {
      return await page.screenshot(options);
    } finally {
      last = 0;
      await command(session, 'Page.startScreencast', STREAM_OPTIONS);
    }
  };
}
