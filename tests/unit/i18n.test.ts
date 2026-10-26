import { describe, expect, it } from "vitest";
import {
  counterpartPath,
  formatDate,
  langOf,
  pathTo,
  preferredLang,
  routeKeys,
  routes,
} from "../../src/i18n/config";
import { isLatinOnly, labelParts } from "../../src/i18n/text";

describe("paths", () => {
  it("builds locale paths with trailing slashes and hashes", () => {
    expect(pathTo("en", "home")).toBe("/en/");
    expect(pathTo("ar", "aerial")).toBe("/ar/capability/aerial-perspective/");
    expect(pathTo("en", "studio", "brief")).toBe("/en/studio/#brief");
  });

  it("covers every PRD §5 route", () => {
    expect(Object.values(routes)).toEqual([
      "",
      "capability/",
      "capability/aerial-perspective/",
      "capability/off-plan-visualisation/",
      "capability/standing-production/",
      "method/",
      "engagement/",
      "studio/",
      "privacy/",
    ]);
    expect(routeKeys).toHaveLength(9);
  });

  it("maps a page to its counterpart in the other locale", () => {
    expect(counterpartPath("/en/method/", "ar")).toBe("/ar/method/");
    expect(counterpartPath("/ar/capability/standing-production/", "en")).toBe(
      "/en/capability/standing-production/",
    );
    expect(counterpartPath("/en/", "ar")).toBe("/ar/");
    expect(counterpartPath("/", "ar")).toBe("/ar/");
    expect(counterpartPath("/english/", "ar")).toBe("/ar/");
  });

  it("reads the locale from a path", () => {
    expect(langOf("/ar/method/")).toBe("ar");
    expect(langOf("/en/")).toBe("en");
    expect(langOf("/")).toBeUndefined();
    expect(langOf("/arabic/")).toBeUndefined();
  });
});

describe("preferredLang", () => {
  it.each([
    [["ar-QA", "en"], "ar"],
    [["en-GB", "ar"], "en"],
    [["fr-FR", "ar-SA"], "ar"],
    [["fr-FR", "de"], "en"],
    [[], "en"],
  ] as const)("%j → %s", (languages, expected) => {
    expect(preferredLang(languages)).toBe(expected);
  });
});

describe("Western digits in both locales (PRD §7.1)", () => {
  it("formats Arabic dates with Latin digits", () => {
    const date = new Date(Date.UTC(2026, 9, 26));
    const ar = formatDate(date, "ar", { year: "numeric", month: "2-digit", timeZone: "UTC" });
    expect(ar).toMatch(/2026/);
    expect(ar).not.toMatch(/[٠-٩]/);
  });
});

describe("labels", () => {
  it("marks Latin and digit runs LTR in Arabic labels", () => {
    expect(labelParts("00 · الدوحة · QFC 04998")).toEqual([
      { text: "00", ltr: true },
      { text: " · ", ltr: false },
      { text: "الدوحة", ltr: false },
      { text: " · ", ltr: false },
      { text: "QFC 04998", ltr: true },
    ]);
  });

  it("detects text with no Arabic letters", () => {
    expect(isLatinOnly("[PLACEHOLDER: auditor]")).toBe(true);
    expect(isLatinOnly("Makeena LLC")).toBe(true);
    expect(isLatinOnly("السجل المؤسسي")).toBe(false);
    expect(isLatinOnly("ترخيص QFC رقم 04998")).toBe(false);
  });
});
