/// <reference types="vitest/config" />
import { getViteConfig } from "astro/config";

// Unit tests run through Astro's Vite config so they can import project modules as the site does.
export default getViteConfig({
  test: {
    include: ["src/**/*.test.ts", "tests/unit/**/*.test.ts"],
    // The first unit tests (token contrast) arrive with phase-1/tokens-type.
    passWithNoTests: true,
  },
});
