import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e-auth",
  timeout: 90_000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3010",
    trace: "on-first-retry"
  },
  webServer: {
    command: "npm run dev -- --port 3010",
    url: "http://localhost:3010/sign-in",
    reuseExistingServer: false,
    timeout: 120_000
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
