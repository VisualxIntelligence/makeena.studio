// Locales and routes (PRD §5). Every route exists in both locales with identical slugs.

export const locales = ["en", "ar"] as const;
export type Lang = (typeof locales)[number];
export const defaultLang: Lang = "en";

export const isLang = (value: unknown): value is Lang => locales.includes(value as Lang);
export const dirOf = (lang: Lang) => (lang === "ar" ? "rtl" : "ltr");
export const otherLang = (lang: Lang): Lang => (lang === "en" ? "ar" : "en");

/** Route keys and their slugs after `/{lang}/`. Slugs end in `/` (trailingSlash: "always"). */
export const routes = {
  home: "",
  capability: "capability/",
  aerial: "capability/aerial-perspective/",
  offPlan: "capability/off-plan-visualisation/",
  standing: "capability/standing-production/",
  method: "method/",
  engagement: "engagement/",
  studio: "studio/",
  privacy: "privacy/",
} as const;
export type RouteKey = keyof typeof routes;
export const routeKeys = Object.keys(routes) as RouteKey[];

/** `/{lang}/{slug}` plus an optional `#hash`. */
export function pathTo(lang: Lang, route: RouteKey, hash?: string): string {
  return `/${lang}/${routes[route]}${hash ? `#${hash}` : ""}`;
}

/** The same page in the other locale: `/en/method/` → `/ar/method/`. Non-locale paths go home. */
export function counterpartPath(pathname: string, to: Lang): string {
  return /^\/(en|ar)(\/|$)/.test(pathname)
    ? pathname.replace(/^\/(en|ar)(?=\/|$)/, `/${to}`)
    : `/${to}/`;
}

/** Locale of a path, or undefined outside `/en/` and `/ar/`. */
export function langOf(pathname: string): Lang | undefined {
  const match = /^\/(en|ar)(\/|$)/.exec(pathname);
  return match ? (match[1] as Lang) : undefined;
}

/**
 * Locale for a visitor with no stored choice: Arabic when the browser prefers Arabic over
 * English, otherwise English (PRD §5). `languages` is `navigator.languages`.
 */
export function preferredLang(languages: readonly string[]): Lang {
  for (const tag of languages) {
    const base = tag.toLowerCase().split("-")[0];
    if (isLang(base)) return base;
  }
  return defaultLang;
}

/** Dates with Western digits in both locales (PRD §7.1: `ar-u-nu-latn`). */
export function formatDate(date: Date, lang: Lang, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-u-nu-latn" : "en-GB", options).format(date);
}
