// Observer-only browser input telemetry. No DOM/text/target data and no drawing
// in the actor page: pixel observations must remain unchanged.
export async function observePointer(page, onPointer) {
  let closed = false,
    count = 0;
  page.once('close', () => {
    closed = true;
  });
  await page.exposeBinding('__relayObservePointer', ({ frame }, point) => {
    if (closed || frame !== page.mainFrame() || ++count > 10000) return;
    const viewport = page.viewportSize();
    if (
      !['pointermove', 'pointerdown', 'pointerup', 'wheel'].includes(point?.type) ||
      !Number.isFinite(point.x) ||
      !Number.isFinite(point.y) ||
      point.x < 0 ||
      point.y < 0 ||
      point.x >= viewport.width ||
      point.y >= viewport.height
    )
      return;
    onPointer({ source: 'browser-event', type: point.type, x: point.x, y: point.y, viewport });
  });
  await page.evaluate(() => {
    let lastMove = 0,
      pending,
      timer;
    const send = (point) => window.__relayObservePointer(point).catch(() => {});
    const flush = () => {
      clearTimeout(timer);
      timer = null;
      if (pending) {
        send(pending);
        pending = null;
        lastMove = performance.now();
      }
    };
    for (const type of ['pointermove', 'pointerdown', 'pointerup', 'wheel'])
      document.addEventListener(
        type,
        (e) => {
          if (!e.isTrusted) return;
          const point = { type, x: e.clientX, y: e.clientY };
          if (type === 'pointermove') {
            pending = point;
            if (!timer) {
              const wait = Math.max(0, 32 - (performance.now() - lastMove));
              if (wait) timer = setTimeout(flush, wait);
              else flush();
            }
          } else {
            flush();
            send(point);
          }
        },
        { capture: true, passive: true },
      );
  });
}
