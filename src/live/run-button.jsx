import React, { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Play, Square } from 'lucide-react';

// Acquire synchronously: React's next render is too late for duplicate events.
// Lock through cleanup/history writes, then absorb the tail of a double click.
export function useLaunchLock() {
  const held = useRef(false),
    until = useRef(0);
  return {
    acquire() {
      if (held.current || Date.now() < until.current) return false;
      held.current = true;
      return true;
    },
    release() {
      held.current = false;
      until.current = Date.now() + 600;
    },
  };
}
export function RunButton({
  busy,
  starting,
  disabled,
  onStart,
  onStop,
  label = 'Run',
  stopLabel = 'Stop',
  icon: Icon = Play,
}) {
  const [stopping, setStopping] = useState(false);
  useEffect(() => {
    if (!busy) setStopping(false);
  }, [busy]);
  return (
    <div className="run-actions">
      {busy && (
        <button
          className="stop"
          disabled={stopping}
          onClick={() => {
            setStopping(true);
            onStop();
          }}
        >
          <Square size={12} aria-hidden="true" />
          {stopping ? 'Stopping…' : stopLabel}
        </button>
      )}
      <button
        className="primary run-trigger"
        disabled={disabled || busy}
        aria-busy={busy}
        onClick={() => {
          setStopping(false);
          onStart();
        }}
      >
        {busy ? (
          <LoaderCircle className="busy-spinner" size={15} aria-hidden="true" />
        ) : (
          <Icon size={15} aria-hidden="true" />
        )}
        {busy ? (starting ? 'Starting…' : 'Running…') : label}
      </button>
    </div>
  );
}
export function ModelPrice({ rates }) {
  return (
    <span className="model-price">
      {rates
        ? `$${rates.input} in · $${rates.output} out / 1M tokens · auto`
        : 'Pricing unavailable · choose another model'}
    </span>
  );
}
