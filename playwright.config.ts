import { defineConfig, devices } from "@playwright/test";

// tests/e2e: smoke + accessibility across the PRD §11.1 matrix (CI runs these).
// tests/spikes: Phase 0 measurements; slow and timing-sensitive, run locally with `npm run test:spikes`.
export default defineConfig({
  testDir: "tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://localhost:4321",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npx astro preview --port 4321",
    url: "http://localhost:4321/en/",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 15"] } },
    // Firefox is why the site uses the ClientRouter (decision 0002): it runs the G2 tests.
    {
      name: "firefox",
      testDir: "tests/e2e",
      testMatch: /transitions\.spec\.ts/,
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "reduced-motion",
      testDir: "tests/e2e",
      use: { ...devices["Desktop Chrome"], contextOptions: { reducedMotion: "reduce" } },
    },
  ],
});
