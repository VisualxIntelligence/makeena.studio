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

test("root sends visitors to a locale", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/(en|ar)\/$/);
});

test("unknown paths get the 404 page", async ({ page }) => {
  const response = await page.goto("/en/does-not-exist/");
  expect(response?.status()).toBe(404);
  await expect(page.locator("h1")).toBeVisible();
});
