import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    // Real, cache-busted icon URLs also work under the hosted same-origin CSP.
    assetsInlineLimit: (path) =>
      path.includes('/relay-') || path.includes('/northstar-') ? false : undefined,
    sourcemap: false,
    rolldownOptions: {
      input: {
        app: 'index.html',
        lab: 'lab.html',
        live: 'live.html',
        replay: 'replay.html',
        play: 'play.html',
        review: 'demo/review.html',
      },
    },
  },
  server: { host: '127.0.0.1' },
});
