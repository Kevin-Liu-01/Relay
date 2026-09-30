import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    sourcemap: false,
    rolldownOptions: { input: { app: 'index.html', lab: 'lab.html', live: 'live.html' } },
  },
  server: { host: '127.0.0.1' },
});
