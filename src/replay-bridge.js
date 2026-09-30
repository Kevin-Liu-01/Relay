// Observer-only state. This data is never part of a model observation/request.
export const REPLAY_MODE = location.pathname === '/replay.html';
export function readVisibleUI() {
  return {
    fields: [...document.querySelectorAll('input,textarea')].map((el) => ({
      label: el.getAttribute('aria-label'),
      value: el.value,
    })),
    scroll: [...document.querySelectorAll('.messages-scroll,.thread-scroll')].map((el) => ({
      className: el.className,
      top: el.scrollTop,
    })),
    targets: [...document.querySelectorAll('[data-relay-ref]')].map((el) => {
      const r = el.getBoundingClientRect();
      return {
        ref: el.getAttribute('data-relay-ref'),
        x: r.x,
        y: r.y,
        width: r.width,
        height: r.height,
      };
    }),
  };
}

export function validSnapshot(snapshot) {
  const s = snapshot?.data?.state;
  return (
    snapshot?.version === 1 &&
    s &&
    Array.isArray(s.users) &&
    s.users.length > 0 &&
    Array.isArray(s.channels) &&
    s.channels.length > 0 &&
    Array.isArray(s.messages) &&
    s.users.some((u) => u.id === s.currentUserId)
  );
}
