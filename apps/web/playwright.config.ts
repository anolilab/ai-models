
import { defineConfig, devices } from '@playwright/test'
import { getDummyServerPort, getTestServerPort } from './__tests__/setup/derive-port'

import packageJson from './package.json' with { type: 'json' }

const PORT = await getTestServerPort(packageJson.name)
const EXTERNAL_PORT = await getDummyServerPort(packageJson.name)
const baseURL = `http://localhost:${PORT}`

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './__tests__',
  workers: 1,

  reporter: [['line']],

  globalSetup: './__tests__/setup/global.setup.ts',
  globalTeardown: './__tests__/setup/global.teardown.ts',

  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL,
  },

  webServer: {
    command: `VITE_NODE_ENV="test" VITE_EXTERNAL_PORT=${EXTERNAL_PORT} pnpm build && VITE_NODE_ENV="test" VITE_EXTERNAL_PORT=${EXTERNAL_PORT} VITE_SERVER_PORT=${PORT} PORT=${PORT} pnpm start`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})