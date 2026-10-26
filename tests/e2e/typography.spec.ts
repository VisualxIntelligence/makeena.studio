import { expect, test, type Page } from "@playwright/test";

// Type roles per script (PRD §6.2), read from computed styles.
const style = (page: Page, selector: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        family: s.fontFamily,
        size: parseFloat(s.fontSize),
        lineHeight: parseFloat(s.lineHeight) / parseFloat(s.fontSize),
        letterSpacing: s.letterSpacing,
        transform: s.textTransform,
      };
    });

test("English: Latin faces, uppercase tracked labels", async ({ page }) => {
  await page.goto("/en/");
  const body = await style(page, "body");
  expect(body.family).toMatch(/^"?Inter/);
  expect(body.size).toBeGreaterThanOrEqual(16);

  const display = await style(page, "h1.display");
  expect(display.family).toMatch(/^"?Cormorant Garamond/);
  expect(display.lineHeight).toBeCloseTo(1.05, 2);

  const label = await style(page, ".label");
  expect(label.family).toMatch(/^"?JetBrains Mono/);
  expect(label.transform).toBe("uppercase");
  expect(label.letterSpacing).not.toBe("normal");
  expect(parseFloat(label.letterSpacing)).toBeGreaterThan(0);
});

test("Arabic: Arabic faces first, larger body, no uppercase or letter-spacing", async ({
  page,
}) => {
  await page.goto("/en/");
  const latinBody = (await style(page, "body")).size;
  await page.goto("/ar/");

  const body = await style(page, "body");
  expect(body.family).toMatch(/^"?IBM Plex Sans Arabic/);
  expect(body.size / latinBody).toBeCloseTo(1.08, 2);

  const display = await style(page, "h1.display");
  expect(display.family).toMatch(/^"?Amiri/);
  expect(display.lineHeight).toBeGreaterThanOrEqual(1.3);
  expect(display.lineHeight).toBeLessThanOrEqual(1.4);
  expect(["0px", "normal"]).toContain(display.letterSpacing);

  const label = await style(page, ".label");
  expect(label.family).toMatch(/^"?IBM Plex Sans Arabic/);
  expect(label.transform).toBe("none");
  expect(["0px", "normal"]).toContain(label.letterSpacing);
});
