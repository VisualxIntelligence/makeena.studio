import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { locales, routeKeys } from "../../src/i18n/config";

// Structural checks Zod can't express across files: both locales exist for every route and
// share section ids, so the language switch can keep the reader's #section.
const dir = new URL("../../src/content/pages/", import.meta.url);
const read = (lang: string, route: string) =>
  JSON.parse(readFileSync(new URL(`${lang}/${route}.json`, dir), "utf8"));

describe("page content", () => {
  it("has exactly one file per route in each locale", () => {
    for (const lang of locales) {
      const files = readdirSync(new URL(`${lang}/`, dir)).map((f) => f.replace(/\.json$/, ""));
      expect(files.sort()).toEqual([...routeKeys].sort());
    }
  });

  for (const route of routeKeys) {
    it(`${route}: same sections and links in both locales`, () => {
      const [en, ar] = locales.map((lang) => read(lang, route));
      expect(en.route).toBe(route);
      expect(ar.route).toBe(route);
      expect(en.lang).toBe("en");
      expect(ar.lang).toBe("ar");
      const ids = (p: { sections: { id: string }[] }) => p.sections.map((s) => s.id);
      expect(ids(ar)).toEqual(ids(en));
      const targets = (p: { sections: { links?: { route: string; hash?: string }[] }[] }) =>
        p.sections.flatMap((s) => (s.links ?? []).map((l) => `${l.route}#${l.hash ?? ""}`));
      expect(targets(ar)).toEqual(targets(en));
    });
  }

  it("every link hash exists as a section id on the target page", () => {
    const sectionIds = Object.fromEntries(
      routeKeys.map((r) => [r, new Set(read("en", r).sections.map((s: { id: string }) => s.id))]),
    );
    // Anchors that pages add outside the content files.
    sectionIds.studio.add("brief-fixed").add("brief-retained");
    for (const route of routeKeys) {
      for (const s of read("en", route).sections) {
        for (const l of s.links ?? []) {
          if (l.hash)
            expect(sectionIds[l.route].has(l.hash), `${route} → ${l.route}#${l.hash}`).toBe(true);
        }
      }
    }
  });
});
