import { defineConfig, devices } from "@playwright/test";
import { assertE2ETarget } from './scripts/e2e-safety.mjs';
import { loadE2EEnvironment } from './scripts/e2e-environment.mjs';

// Never load production credentials into the mutating test runner.
// Integration is opt-in, with a separate file and project identity guard.
if (process.env.E2E_ENABLED === '1') Object.assign(process.env, loadE2EEnvironment());
assertE2ETarget(process.env);

const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 180_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.E2E_ENABLED === '1' ? './scripts/e2e-reporter.ts' : 'list',
  preserveOutput: process.env.E2E_ENABLED === '1' ? 'never' : 'always',
  // Auth traces contain passwords, cookies and request headers. Never persist them.
  use: { baseURL, trace: process.env.E2E_ENABLED === '1' ? 'off' : 'retain-on-failure', screenshot: process.env.E2E_ENABLED === '1' ? 'off' : 'only-on-failure' },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: process.env.PLAYWRIGHT_CHANNEL || undefined } }],
  webServer: !process.env.E2E_BASE_URL ? {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: baseURL,
    reuseExistingServer: process.env.E2E_ENABLED !== '1' && !process.env.CI,
    timeout: 120_000,
    env: { NEXT_PUBLIC_APP_URL: baseURL, NFC_E2E_SERVER: '1' },
    stdout: 'ignore',
    stderr: process.env.E2E_ENABLED === '1' ? 'ignore' : 'pipe',
  } : undefined,
});
