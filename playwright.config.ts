import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,   // auth creates real Supabase users — run sequentially
  retries: 1,
  timeout: 30_000,
  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],

  // Start both servers before running tests
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3000',
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      command: 'cd ../LLPBackend && npm run start:dev',
      url: 'http://localhost:3001/health',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
