import { defineConfig, devices } from "@playwright/test";

// Phase 0: spike measurements only. Phase 1 adds the full e2e matrix (PRD §11.1).
export default defineConfig({
  testDir: "tests",
  fullyParallel: false,
  reporter: [["list"]],
  use: {
    baseURL: "http://localhost:4321",
  },
  webServer: {
    command: "npx astro preview --port 4321",
    url: "http://localhost:4321/en/",
    reuseExistingServer: true,
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chromium", use: { ...devices["Pixel 7"] } },
    { name: "mobile-webkit", use: { ...devices["iPhone 15"] } },
  ],
});
