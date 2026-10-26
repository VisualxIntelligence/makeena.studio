import { expect, test } from "@playwright/test";

const menu = ".site-header__menu";
const links = "#site-nav a";

test.describe("narrow screens: links behind a labelled Menu button", () => {
  test.use({ viewport: { width: 375, height: 800 } });

  for (const lang of ["en", "ar"] as const) {
    test(`menu opens, closes with Esc and returns focus (${lang})`, async ({ page }) => {
      await page.goto(`/${lang}/`);
      const button = page.locator(menu);
      await expect(button).toBeVisible();
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await expect(page.locator(links).first()).toBeHidden();
      // Wordmark, language switch and CTA stay in the bar (UX doc §3.0).
      await expect(page.locator(".site-header__mark")).toBeVisible();
      await expect(page.locator("header a[data-lang-switch]")).toBeVisible();
      await expect(page.locator("header .button")).toBeVisible();

      await button.click();
      await expect(button).toHaveAttribute("aria-expanded", "true");
      await expect(page.locator(links)).toHaveCount(4);
      for (const link of await page.locator(links).all()) await expect(link).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(button).toHaveAttribute("aria-expanded", "false");
      await expect(button).toBeFocused();
      await expect(page.locator(links).first()).toBeHidden();
    });
  }

  test("choosing a link closes the menu", async ({ page }) => {
    await page.goto("/en/");
    await page.locator(menu).click();
    await page.locator(links).nth(1).click();
    await expect(page).toHaveURL(/\/en\/method\/$/);
    await expect(page.locator(menu)).toHaveAttribute("aria-expanded", "false");
  });

  test("the bar fits without horizontal scroll", async ({ page }) => {
    for (const lang of ["en", "ar"]) {
      await page.goto(`/${lang}/`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, lang).toBe(0);
    }
  });
});

test.describe("narrow screens without JavaScript", () => {
  test.use({ viewport: { width: 375, height: 800 }, javaScriptEnabled: false });

  test("links are shown and there is no menu button", async ({ page }) => {
    await page.goto("/en/");
    await expect(page.locator(menu)).toBeHidden();
    for (const link of await page.locator(links).all()) await expect(link).toBeVisible();
  });
});

test.describe("desktop", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("links in the bar, no menu button, current page marked", async ({ page }) => {
    await page.goto("/en/engagement/");
    await expect(page.locator(menu)).toBeHidden();
    for (const link of await page.locator(links).all()) await expect(link).toBeVisible();
    await expect(page.locator(`${links}[aria-current="page"]`)).toHaveText("Engagement");
  });

  test("the header stays at the top while scrolling", async ({ page }) => {
    await page.goto("/en/method/");
    await page.evaluate(() => scrollTo(0, 1500));
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500);
    const box = await page.locator(".site-header").boundingBox();
    expect(box?.y).toBe(0);
  });

  test("an anchored section is not hidden under the sticky header", async ({ page }) => {
    await page.goto("/en/method/#provenance");
    const header = await page.locator(".site-header").boundingBox();
    const label = await page.locator("#provenance-label").boundingBox();
    expect(label!.y).toBeGreaterThanOrEqual(header!.y + header!.height);
  });
});

test("every section is in the heading outline with no skipped levels", async ({ page }) => {
  for (const path of ["/en/method/", "/ar/capability/", "/en/studio/"]) {
    await page.goto(path);
    const levels = await page.$$eval("main h1, main h2, main h3, main h4", (hs) =>
      hs.map((h) => Number(h.tagName[1])),
    );
    expect(levels[0], path).toBe(1);
    levels.slice(1).forEach((level, i) => expect(level - levels[i], path).toBeLessThanOrEqual(1));
    expect(await page.locator("main section").count()).toBe(
      await page.locator("main section h2").count(),
    );
  }
});
