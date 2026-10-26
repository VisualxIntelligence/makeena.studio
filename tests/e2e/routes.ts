// Every page the e2e suite visits, in both locales. phase-1/routes-i18n replaces this with the
// full PRD §5 route list and drops the Phase 0 spike pages.
export const locales = ["en", "ar"] as const;

export const pages = ["", "spike/home/", "spike/method/", "spike/aerial/"];

export const routes = locales.flatMap((lang) =>
  pages.map((page) => ({ lang, dir: lang === "ar" ? "rtl" : "ltr", path: `/${lang}/${page}` })),
);
