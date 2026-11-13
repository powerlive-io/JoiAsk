import { defineConfig, devices } from '@playwright/test';
import { baseURL, ports } from './tests/e2e/environment.mjs';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  // Tests modify shared site settings; keep the disposable database serial.
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'node tests/e2e/server.mjs',
      url: `${baseURL}/api/config`,
      timeout: 180_000,
      reuseExistingServer: false,
      gracefulShutdown: { signal: 'SIGTERM', timeout: 5_000 },
    },
    {
      command: `npm --prefix frontend run dev -- --hostname 127.0.0.1 --port ${ports.frontend}`,
      url: `http://127.0.0.1:${ports.frontend}`,
      env: {
        SITE_CONFIG_API_URL: `http://127.0.0.1:${ports.backend}/api/config`,
        NEXT_TELEMETRY_DISABLED: '1',
      },
      timeout: 120_000,
      reuseExistingServer: false,
    },
    {
      command: `npm --prefix admin run dev -- --hostname 127.0.0.1 --port ${ports.admin}`,
      url: `http://127.0.0.1:${ports.admin}/admin/`,
      env: { NEXT_TELEMETRY_DISABLED: '1' },
      timeout: 120_000,
      reuseExistingServer: false,
    },
  ],
});
