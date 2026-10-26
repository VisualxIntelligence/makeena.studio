// @ts-check
import { rename, rm } from "node:fs/promises";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

// Fonts (PRD §6.2): self-hosted WOFF2 subsets via the Fonts API, downloaded at build time.
// Exposed as --ff-* and mapped to Tailwind's --font-* roles in src/styles/global.css.
// Arabic faces are only referenced from /ar/ pages (see BaseLayout).
const fontsource = fontProviders.fontsource();
const local = fontProviders.local();

const site = "https://makeena.studio";

// Cloudflare serves the nearest 404.html (wrangler.jsonc: not_found_handling "404-page"), so the
// localised 404 pages must sit at /en/404.html and /ar/404.html rather than /{lang}/404/.
/** @type {import("astro").AstroIntegration} */
const localized404 = {
  name: "mkn-localized-404",
  hooks: {
    "astro:build:done": async ({ dir }) => {
      for (const lang of ["en", "ar"]) {
        await rename(new URL(`${lang}/404/index.html`, dir), new URL(`${lang}/404.html`, dir));
        await rm(new URL(`${lang}/404/`, dir), { recursive: true });
      }
    },
  },
};

export default defineConfig({
  site,
  output: "static",
  integrations: [
    // Both locales with hreflang alternates (PRD §13). The root redirect and 404 pages are left out.
    sitemap({
      i18n: { defaultLocale: "en", locales: { en: "en", ar: "ar" } },
      filter: (page) => page !== `${site}/` && !/\/404\/?$/.test(page),
    }),
    localized404,
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  trailingSlash: "always",
  i18n: {
    locales: ["en", "ar"],
    defaultLocale: "en",
    routing: {
      prefixDefaultLocale: true,
      redirectToDefaultLocale: false,
    },
  },
  fonts: [
    {
      provider: fontsource,
      name: "Cormorant Garamond",
      cssVariable: "--ff-display",
      weights: [400, 500],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["serif"],
    },
    {
      provider: fontsource,
      name: "Inter",
      cssVariable: "--ff-body",
      weights: [400, 500],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],
    },
    {
      provider: fontsource,
      name: "JetBrains Mono",
      cssVariable: "--ff-mono",
      weights: [500],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["monospace"],
    },
    // Arabic faces: our own subsets (scripts/fonts/subset_arabic.py) to fit the 120 KB critical
    // font budget on /ar/. They include punctuation and Western digits, so Arabic text never
    // pulls in a Latin face for a full stop. "MKN Sans Arabic" is IBM Plex Sans Arabic renamed,
    // as the OFL requires for a modified "Plex" font.
    // Chained in front of the Latin stacks in CSS, so no generic fallback here; Astro's
    // optimised fallback would be tuned to Latin metrics and is useless for Arabic.
    {
      provider: local,
      name: "Amiri",
      cssVariable: "--ff-ar-display",
      fallbacks: [],
      optimizedFallbacks: false,
      options: {
        variants: [
          { src: ["./src/assets/fonts/arabic/amiri-400.woff2"], weight: 400, style: "normal" },
        ],
      },
    },
    {
      provider: local,
      name: "MKN Sans Arabic",
      cssVariable: "--ff-ar-body",
      fallbacks: [],
      optimizedFallbacks: false,
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/arabic/mkn-sans-arabic-400.woff2"],
            weight: 400,
            style: "normal",
          },
          {
            src: ["./src/assets/fonts/arabic/mkn-sans-arabic-500.woff2"],
            weight: 500,
            style: "normal",
          },
        ],
      },
    },
  ],
});
