import { expect, test, type Page } from "@playwright/test";

// 06 exploded axonometric (PRD §9.4), static until real layer cut-outs exist (decision 0017).
const path = (lang: "en" | "ar") => `/${lang}/capability/off-plan-visualisation/`;
const layers = (page: Page) => page.locator(".axo__layers li");
const figure = (page: Page) => page.locator('figure[data-provenance="MKN-AXO-CAM01-EXPLODED"]');
const top = (page: Page, i: number) =>
  layers(page)
    .nth(i)
    .evaluate((el) => el.getBoundingClientRect().top);

test("the layers are an ordered list, foundations to roof, that describes the figure", async ({
  page,
}) => {
  await page.goto(path("en"));
  await expect(layers(page)).toHaveCount(6);
  await expect(layers(page).first()).toContainText("Foundations and basement");
  await expect(layers(page).last()).toContainText("Roof and plant");
  const id = await page.locator(".axo__layers").getAttribute("id");
  await expect(figure(page)).toHaveAttribute("aria-describedby", id!);
});

test.describe("desktop", () => {
  test.use({ viewport: { width: 1440, height: 1000 } });

  test("labels sit level with their layers, the roof at the top", async ({ page }) => {
    await page.goto(path("en"));
    expect(await top(page, 5)).toBeLessThan(await top(page, 0));
    const image = await figure(page).locator("img").first().boundingBox();
    const roof = await layers(page).last().boundingBox();
    const foundations = await layers(page).first().boundingBox();
    // Roof near the top of the drawing, foundations near its bottom (PRD: labels at the layers).
    expect(roof!.y).toBeLessThan(image!.y + image!.height * 0.2);
    expect(foundations!.y).toBeGreaterThan(image!.y + image!.height * 0.75);
    expect(roof!.x).toBeGreaterThan(image!.x + image!.width);
  });

  test("Arabic: labels on the other side; the drawing does not mirror", async ({ page }) => {
    await page.goto(path("ar"));
    const image = await figure(page).locator("img").first().boundingBox();
    const roof = await layers(page).last().boundingBox();
    expect(roof!.x + roof!.width).toBeLessThan(image!.x);
    await expect(figure(page).locator("img").first()).toHaveCSS("transform", "none");
  });

  test("leader lines end drawn, with or without motion", async ({ page }) => {
    await page.goto(path("en"));
    await page.locator("[data-axonometric]").scrollIntoViewIfNeeded();
    const leader = page.locator(".axo__leader").first();
    await expect(leader).toBeVisible();
    await expect(leader).toHaveCSS("transform", "none");
    const width = await leader.evaluate((el) => el.getBoundingClientRect().width);
    expect(width).toBeGreaterThan(40);
  });
});

test.describe("phone", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("numbers on the drawing, the legend under it", async ({ page }) => {
    await page.goto(path("en"));
    const image = await figure(page).locator("img").first().boundingBox();
    const first = await layers(page).first().boundingBox();
    expect(first!.y).toBeGreaterThan(image!.y + image!.height);
    await expect(page.locator(".axo__markers li")).toHaveCount(6);
    await expect(page.locator(".axo__markers li").first()).toBeVisible();
    await expect(page.locator(".axo__leader").first()).toBeHidden();
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  });
});

test("without JS, the drawing and all six labels", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(path("ar"));
  await expect(figure(page).locator("img").first()).toBeVisible();
  await expect(layers(page)).toHaveCount(6);
  for (let i = 0; i < 6; i++) await expect(layers(page).nth(i)).toBeVisible();
  await context.close();
});
