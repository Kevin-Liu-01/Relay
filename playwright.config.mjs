import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/browser',
  fullyParallel: true,
  workers: 3,
  timeout: 30000,
  retries: 0,
  reporter: [
    ['list'],
    ['json', { outputFile: 'artifacts/browser-results.json' }],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: 'http://127.0.0.1:4320',
    viewport: { width: 1440, height: 900 },
    trace: 'on',
    video: 'on',
    screenshot: 'on',
  },
  webServer: {
    command:
      'PORT=4320 CONTROL_PORT=4321 DATA_DIR=.runtime/browser-tests CONTROL_TOKEN=browser-test-only ALLOW_DEMO=0 node server/server.mjs',
    url: 'http://127.0.0.1:4320/health',
    reuseExistingServer: false,
  },
});
