import { getCollection, getEntry } from "astro:content";
import { locales, type Lang, type RouteKey } from "../i18n/config";

/** getStaticPaths for a route that exists in both locales. */
export const langPaths = () => locales.map((lang) => ({ params: { lang } }));

/** Page copy for one route and locale (src/content/pages/{lang}/{route}.json). */
export async function getPage(route: RouteKey, lang: Lang) {
  const entry = (await getCollection("pages")).find(
    (p) => p.data.route === route && p.data.lang === lang,
  );
  if (!entry) throw new Error(`Missing page copy: src/content/pages/${lang}/${route}.json`);
  return entry.data;
}

export async function getServices(kind: "lead" | "register") {
  return (await getCollection("services"))
    .filter((s) => s.data.kind === kind)
    .sort((a, b) => a.data.order - b.data.order)
    .map((s) => s.data);
}

export async function getGates() {
  return (await getCollection("gates"))
    .map((g) => g.data)
    .sort((a, b) => a.number.localeCompare(b.number));
}

export async function getRegister() {
  return (await getCollection("register"))
    .map((r) => ({ id: r.id, ...r.data }))
    .sort((a, b) => a.order - b.order);
}

/** Site-wide facts: legal line, contact details. */
export async function getSite() {
  const entry = await getEntry("site", "site");
  if (!entry) throw new Error("Missing src/content/site.json");
  return entry.data;
}

/** True for a `[PLACEHOLDER: …]` marker (never linked or put into structured data). */
export const isPlaceholder = (text: string) => text.startsWith("[PLACEHOLDER");
