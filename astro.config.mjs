// @ts-check
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

// Fonts (PRD §6.2): self-hosted WOFF2 subsets via the Fonts API, downloaded at build time.
// Exposed as --ff-* and mapped to Tailwind's --font-* roles in src/styles/global.css.
// Arabic faces are only referenced from /ar/ pages (see BaseLayout).
const fontsource = fontProviders.fontsource();
const local = fontProviders.local();

export default defineConfig({
  site: "https://makeena.studio",
  output: "static",
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
