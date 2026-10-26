import { expect, test } from "@playwright/test";
import { routes } from "./routes";

test.describe("every route renders", () => {
  for (const { lang, dir, path } of routes) {
    test(path, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(err.message));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(msg.text());
      });

      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", lang);
      await expect(page.locator("html")).toHaveAttribute("dir", dir);
      await expect(page.locator("main h1")).toBeVisible();
      expect(errors).toEqual([]);
    });
  }
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  for (const { path } of routes) {
    test(`content is visible: ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.locator("main h1")).toBeVisible();
    });
  }
});

test.describe("root redirect", () => {
  test("English browser goes to /en/", async ({ browser }) => {
    const page = await browser.newPage({ locale: "en-GB" });
    await page.goto("/");
    await expect(page).toHaveURL(/\/en\/$/);
    await page.close();
  });

  test("Arabic browser goes to /ar/", async ({ browser }) => {
    const page = await browser.newPage({ locale: "ar-QA" });
    await page.goto("/");
    await expect(page).toHaveURL(/\/ar\/$/);
    await page.close();
  });

  test("a stored choice wins over the browser language", async ({ browser }) => {
    const page = await browser.newPage({ locale: "en-GB" });
    await page.goto("/ar/");
    await page.goto("/");
    await expect(page).toHaveURL(/\/ar\/$/);
    await page.close();
  });

  test("without JavaScript, English", async ({ browser }) => {
    const page = await browser.newPage({ locale: "ar-QA", javaScriptEnabled: false });
    await page.goto("/");
    await expect(page).toHaveURL(/\/en\/$/);
    await page.close();
  });
});

test("the language switch opens the same page and section in the other locale", async ({
  page,
}) => {
  await page.goto("/en/method/#provenance");
  await page.locator("header a[data-lang-switch]").click();
  await expect(page).toHaveURL(/\/ar\/method\/#provenance$/);
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await page.locator("header a[data-lang-switch]").click();
  await expect(page).toHaveURL(/\/en\/method\/#provenance$/);
});

test("hreflang and canonical point at both locales", async ({ page }) => {
  await page.goto("/ar/capability/aerial-perspective/");
  const href = (sel: string) => page.locator(sel).getAttribute("href");
  expect(await href('link[rel="canonical"]')).toBe(
    "https://makeena.studio/ar/capability/aerial-perspective/",
  );
  expect(await href('link[hreflang="en"]')).toBe(
    "https://makeena.studio/en/capability/aerial-perspective/",
  );
  expect(await href('link[hreflang="x-default"]')).toBe(
    "https://makeena.studio/en/capability/aerial-perspective/",
  );
});

test("the skip link is the first focus stop and targets main", async ({ page, browserName }) => {
  test.skip(browserName === "webkit", "WebKit does not Tab to links by default");
  await page.goto("/en/");
  await page.keyboard.press("Tab");
  const skip = page.locator(".skip-link");
  await expect(skip).toBeFocused();
  await expect(skip).toBeVisible();
  await expect(skip).toHaveAttribute("href", "#main");
});

// Cloudflare serves the nearest 404.html; `astro preview` always serves the root one, so check
// the localised files directly.
for (const lang of ["en", "ar"] as const) {
  test(`localised 404 page: /${lang}/404.html`, async ({ page }) => {
    await page.goto(`/${lang}/404.html`);
    await expect(page.locator("html")).toHaveAttribute("lang", lang);
    await expect(page.locator("main h1")).toBeVisible();
    await expect(page.locator(`main a[href="/${lang}/"]`)).toBeVisible();
  });
}

test("unknown paths get a 404", async ({ page }) => {
  const response = await page.goto("/en/does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toBeVisible();
});
