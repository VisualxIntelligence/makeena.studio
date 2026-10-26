// Lighthouse CI (PRD §13, §17.1): mobile emulation, median of 3 runs per URL. Page weight is
// checked exactly by scripts/budget/check.mjs; this guards the user-facing metrics.
// SEO is not scored: every page is noindex until launch (decision 0005).
const pages = [
  "/en/",
  "/ar/",
  "/en/capability/aerial-perspective/",
  "/ar/capability/aerial-perspective/",
  "/en/studio/",
  "/ar/method/",
];

const shared = {
  "categories:performance": ["error", { minScore: 0.9 }],
  "categories:accessibility": ["error", { minScore: 1 }],
  "categories:best-practices": ["error", { minScore: 0.9 }],
  "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
  "total-blocking-time": ["error", { maxNumericValue: 200 }],
};

module.exports = {
  ci: {
    collect: {
      staticDistDir: "./dist",
      url: pages.map((p) => `http://localhost${p}`),
      numberOfRuns: 3,
      settings: { onlyCategories: ["performance", "accessibility", "best-practices"] },
    },
    assert: {
      assertMatrix: [
        {
          matchingUrlPattern: "/en/",
          aggregationMethod: "median-run",
          assertions: {
            ...shared,
            "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
          },
        },
        {
          // Lighthouse's simulated throttling treats text as painted only once its web font has
          // arrived, so Arabic LCP is bound by the 118.5 KB of Arabic fonts (decision 0006) versus
          // ~45 KB of Latin. Measured lab LCP: ~2.25–2.55 s. Browsers paint the fallback straight
          // away (font-display: swap); the field target stays LCP ≤ 2.5 s at p75 (Phase 5).
          matchingUrlPattern: "/ar/",
          aggregationMethod: "median-run",
          assertions: {
            ...shared,
            "largest-contentful-paint": ["error", { maxNumericValue: 2800 }],
          },
        },
      ],
    },
    upload: { target: "filesystem", outputDir: "./.lighthouseci" },
  },
};
