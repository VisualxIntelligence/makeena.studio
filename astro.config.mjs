// @ts-check
import { defineConfig } from "astro/config";

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
});
