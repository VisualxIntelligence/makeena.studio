// @ts-check
import { defineConfig, fontProviders } from "astro/config";

// Fonts (PRD §6.2): self-hosted WOFF2 subsets via the Fonts API, downloaded at build time.
// Arabic faces are only referenced from /ar/ pages (see BaseLayout).
const fontsource = fontProviders.fontsource();

export default defineConfig({
  site: "https://makeena.studio",
  output: "static",
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
      cssVariable: "--font-display",
      weights: [400, 500],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["serif"],
    },
    {
      provider: fontsource,
      name: "Inter",
      cssVariable: "--font-body",
      weights: [400, 500],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["sans-serif"],
    },
    {
      provider: fontsource,
      name: "JetBrains Mono",
      cssVariable: "--font-mono",
      weights: [500],
      styles: ["normal"],
      subsets: ["latin"],
      fallbacks: ["monospace"],
    },
    {
      provider: fontsource,
      name: "Amiri",
      cssVariable: "--font-ar-display",
      weights: [400],
      styles: ["normal"],
      subsets: ["arabic"],
      // Chained in front of the Latin stack in CSS, so no generic fallback here.
      // Astro's optimised fallback would be tuned to Latin metrics; useless for Arabic.
      fallbacks: [],
      optimizedFallbacks: false,
    },
    {
      provider: fontsource,
      name: "IBM Plex Sans Arabic",
      cssVariable: "--font-ar-body",
      weights: [400, 500],
      styles: ["normal"],
      subsets: ["arabic"],
      // Chained in front of the Latin stack in CSS, so no generic fallback here.
      // Astro's optimised fallback would be tuned to Latin metrics; useless for Arabic.
      fallbacks: [],
      optimizedFallbacks: false,
    },
  ],
});
