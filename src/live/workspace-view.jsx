import React, { useEffect, useRef, useState } from 'react';
import { MousePointer2, Radio } from 'lucide-react';

export function AgentCursor({
  point,
  viewport = { width: 1440, height: 900 },
  smooth = true,
  target = false,
}) {
  const ref = useRef(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const observer = new ResizeObserver(([e]) => setBox(e.contentRect));
    observer.observe(ref.current.parentElement);
    return () => observer.disconnect();
  }, []);
  const scale = Math.min(box.width / viewport.width, box.height / viewport.height);
  const valid =
    point &&
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.y >= 0 &&
    point.x < viewport.width &&
    point.y < viewport.height;
  return (
    <div
      ref={ref}
      className="cursor-plane"
      aria-hidden="true"
      style={{
        width: viewport.width * scale,
        height: viewport.height * scale,
        left: (box.width - viewport.width * scale) / 2,
        top: (box.height - viewport.height * scale) / 2,
      }}
    >
      {valid && (
        <div
          className={`agent-cursor ${smooth ? 'smooth' : ''} ${target ? 'target-only' : ''}`}
          data-source={target ? 'action-target' : 'browser-event'}
          style={{ transform: `translate3d(${point.x * scale}px, ${point.y * scale}px, 0)` }}
        >
          {smooth && ['pointerdown', 'pointerup'].includes(point.type) && (
            <span key={point.sequence} className="cursor-click" />
          )}
          {target ? (
            <span className="cursor-target" />
          ) : (
            <MousePointer2 size={23} fill="currentColor" />
          )}
        </div>
      )}
    </div>
  );
}

// Decode offscreen and keep the previous image visible. One decoding frame plus
// one latest pending frame bounds memory and avoids decode races/blank flashes.
export function StreamImage({ image, alt, onPresented }) {
  const [shown, setShown] = useState(null);
  const pending = useRef(null),
    decoding = useRef(false),
    alive = useRef(true);
  const notify = useRef(onPresented);
  notify.current = onPresented;
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  useEffect(() => {
    pending.current = image;
    const load = () => {
      if (decoding.current || !pending.current || !alive.current) return;
      const next = pending.current;
      pending.current = null;
      decoding.current = true;
      const img = new Image();
      img.src = next;
      img
        .decode()
        .then(() => {
          if (alive.current) {
            setShown(next);
            notify.current?.();
          }
        })
        .catch(() => {})
        .finally(() => {
          decoding.current = false;
          load();
        });
    };
    load();
  }, [image]);
  return (
    <img
      src={shown ?? undefined}
      alt={alt}
      className="stream-image"
      aria-busy={!shown}
      style={{ visibility: shown ? 'visible' : 'hidden' }}
    />
  );
}

export function StreamBadge({ live, frame, label }) {
  const [now, setNow] = useState(Date.now());
  // Use local arrival time: a worker clock is not the viewer's clock.
  const arrived = useRef(Date.now());
  useEffect(() => {
    arrived.current = Date.now();
    setNow(Date.now());
  }, [frame]);
  useEffect(() => {
    if (!live) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [live]);
  const age = Math.max(0, Math.floor((now - arrived.current) / 1000));
  return (
    <div className={`viewport-tag ${live && frame ? 'stream-live' : ''}`}>
      <Radio size={12} />
      {live
        ? frame
          ? age >= 4
            ? `Last frame ${age}s ago`
            : 'Live stream'
          : 'Connecting'
        : label}
    </div>
  );
}
