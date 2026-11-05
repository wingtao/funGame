import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60000,
  use: {
    browserName: 'chromium',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    timezoneId: 'Asia/Shanghai',
    trace: 'retain-on-failure',
    launchOptions: {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined,
      args: ['--no-sandbox'],
    },
  },
  webServer: [
    {
      command: 'pnpm --filter little-doctor preview --host 0.0.0.0 --port 4175',
      url: 'http://127.0.0.1:4175',
      reuseExistingServer: false,
    },
    {
      command: 'pnpm --filter car-fit preview --host 0.0.0.0 --port 4173',
      url: 'http://127.0.0.1:4173',
      reuseExistingServer: false,
    },
    {
      command:
        'pnpm --filter daily-earnings preview --host 0.0.0.0 --port 4174',
      url: 'http://127.0.0.1:4174',
      reuseExistingServer: false,
    },
  ],
});
