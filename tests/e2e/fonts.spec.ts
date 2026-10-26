import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { ARABIC_CLASS as ARABIC } from "../../src/i18n/text";
import { routes } from "./routes";

// PRD §13: critical (preloaded) fonts ≤ 120 KB per page, Arabic subsets included on /ar/.
const CRITICAL_BUDGET = 120 * 1024;

test.describe("font budget", () => {
  // Byte counts are the same in every engine; measure once.
  test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile);

  for (const { path } of routes) {
    test(`critical fonts ≤ 120 KB: ${path}`, async ({ page }, testInfo) => {
      const sizes = new Map<string, number>();
      page.on("response", async (response) => {
        if (response.url().endsWith(".woff2")) {
          sizes.set(new URL(response.url()).pathname, (await response.body()).length);
        }
      });
      await page.goto(path, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);

      const preloaded = await page.$$eval('link[rel="preload"][as="font"]', (links) =>
        links.map((l) => new URL((l as HTMLLinkElement).href).pathname),
      );
      const critical = preloaded.reduce((sum, p) => sum + (sizes.get(p) ?? 0), 0);
      const total = [...sizes.values()].reduce((sum, b) => sum + b, 0);
      testInfo.annotations.push({
        type: "fonts",
        description: `critical ${(critical / 1024).toFixed(1)} KB, all fonts ${(total / 1024).toFixed(1)} KB`,
      });

      expect(
        preloaded.every((p) => sizes.has(p)),
        "every preloaded font is used",
      ).toBe(true);
      expect(critical).toBeLessThanOrEqual(CRITICAL_BUDGET);
    });
  }
});

// The Arabic subsets (scripts/fonts/subset_arabic.py) keep only some vowel marks in Amiri.
// Any Arabic character rendered in a subset font must exist in that font.
const coverage: Record<string, string[]> = JSON.parse(
  readFileSync(new URL("../../src/assets/fonts/arabic/coverage.json", import.meta.url), "utf8"),
);

test.describe("Arabic glyph coverage", () => {
  test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile);

  for (const { path } of routes.filter((r) => r.lang === "ar")) {
    test(`every Arabic character has a glyph: ${path}`, async ({ page }) => {
      await page.goto(path);
      const runs = await page.evaluate((arabic) => {
        const re = new RegExp(arabic);
        const out: { family: string; weight: string; text: string; where: string }[] = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        for (
          let node = walker.nextNode() as Text | null;
          node;
          node = walker.nextNode() as Text | null
        ) {
          const el = node.parentElement;
          if (!el || !re.test(node.data)) continue;
          const s = getComputedStyle(el);
          const where = `${el.tagName.toLowerCase()}${el.className ? "." + el.className : ""}`;
          out.push({ family: s.fontFamily, weight: s.fontWeight, text: node.data, where });
        }
        return out;
      }, ARABIC);

      const missing: string[] = [];
      for (const { family, weight, text, where } of runs) {
        const file = /^"?Amiri/.test(family)
          ? "amiri-400.woff2"
          : /^"?MKN Sans Arabic/.test(family)
            ? `mkn-sans-arabic-${Number(weight) >= 500 ? 500 : 400}.woff2`
            : null;
        if (!file) {
          missing.push(`${where}: Arabic text not set in an Arabic face (${family.split(",")[0]})`);
          continue;
        }
        for (const ch of new Set(text.match(new RegExp(ARABIC, "g")))) {
          const cp = ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0");
          if (!coverage[file].includes(cp)) {
            missing.push(
              `${where}: U+${cp} "${ch}" is not in ${file}; add it in scripts/fonts/subset_arabic.py`,
            );
          }
        }
      }
      expect(missing).toEqual([]);
    });
  }
});
