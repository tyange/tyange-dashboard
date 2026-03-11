import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:4000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'bun run dev --host 127.0.0.1',
    url: 'http://127.0.0.1:4000',
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
