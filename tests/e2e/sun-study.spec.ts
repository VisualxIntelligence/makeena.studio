import { expect, test, type Page } from "@playwright/test";

// 04 sun study (PRD §9.3) on MatchedFrameScrubber, continuous mode.
const path = (lang: "en" | "ar") => `/${lang}/capability/off-plan-visualisation/`;
const scrubber = (page: Page) => page.locator("[data-scrubber]");
const input = (page: Page) => page.locator("[data-scrubber-input]");
const opacities = (page: Page) =>
  page.$$eval(".scrubber__layer", (els) => els.map((el) => Number(getComputedStyle(el).opacity)));

test("keyboard reaches every state; value text and readout agree", async ({ page }) => {
  await page.goto(path("en"));
  await input(page).focus();
  await page.keyboard.press("End");
  await expect(input(page)).toHaveValue("1230");
  await expect(input(page)).toHaveAttribute(
    "aria-valuetext",
    /^20:30 · Night · sun below the horizon$/,
  );
  await expect(page.locator("[data-scrubber-output]")).toHaveText(/^20:30 · Night/);
  await expect(scrubber(page)).toHaveAttribute("data-provenance", "MKN-SUN-SKY01-NIGHT");

  await page.keyboard.press("Home");
  await expect(input(page)).toHaveValue("330");
  await expect(scrubber(page)).toHaveAttribute("data-provenance", "MKN-SUN-SKY01-DAWN");
  await page.keyboard.press("ArrowRight");
  await expect(input(page)).toHaveValue("345");
  await expect(input(page)).toHaveAttribute(
    "aria-valuetext",
    /^05:45 · Dawn · sun azimuth \d+°, altitude \d+°$/,
  );
});

test("only the initial frame loads with the page; the rest on first contact", async ({ page }) => {
  await page.goto(path("en"));
  await expect(page.locator(".scrubber__layer img")).toHaveCount(1);
  await expect(page.locator("template[data-deferred]")).toHaveCount(4);
  await input(page).focus();
  await expect(page.locator(".scrubber__layer img")).toHaveCount(5);
});

test("thumbnails pick a frame and the info sheet follows it", async ({ page }) => {
  await page.goto(path("en"));
  await expect(scrubber(page)).toHaveAttribute("data-provenance", "MKN-SUN-SKY01-GOLD");
  await page.locator('.scrubber__thumb[data-value="510"]').click();
  await expect(input(page)).toHaveValue("510");
  await expect(page.locator('.scrubber__thumb[data-value="510"]')).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(scrubber(page)).toHaveAttribute("data-provenance", "MKN-SUN-SKY01-MORNING");
  await expect(page.locator("[data-scrubber-caption]")).toHaveText(
    "GENERATED RENDER · MORNING 08:30",
  );
  await scrubber(page).locator(".pfig__info").click();
  const sheet = page.locator("[popover]:popover-open");
  await expect(sheet).toContainText("MKN-SUN-SKY01-MORNING");
  await page.keyboard.press("Escape");
});

test("between two states the frames crossfade; reduced motion swaps instantly", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(path("en"));
  const set = (v: string) =>
    input(page).evaluate((el: HTMLInputElement, value) => {
      el.value = value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
    }, v);
  await set("885");
  expect((await opacities(page)).filter((o) => o > 0)).toHaveLength(2);

  await page.emulateMedia({ reducedMotion: "reduce" });
  await set("870");
  const reduced = await opacities(page);
  expect(reduced.filter((o) => o > 0)).toEqual([1]);
});

test("Arabic: labels mirror, the sun track and its thumbnails stay left to right", async ({
  page,
}) => {
  await page.goto(path("ar"));
  await expect(input(page)).toHaveAttribute("dir", "ltr");
  await expect(page.locator(".scrubber__thumbs")).toHaveAttribute("dir", "ltr");
  await expect(page.locator("[data-scrubber-output]")).toContainText("الساعة الذهبية");
  const [first, last] = await page.$$eval(".scrubber__thumb", (els) =>
    [els[0], els.at(-1)!].map((el) => el.getBoundingClientRect().left),
  );
  expect(first).toBeLessThan(last);
});

test("no layout shift on first interaction", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium", "layout-shift entries are Chromium-only");
  await page.goto(path("en"));
  await input(page).scrollIntoViewIfNeeded();
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
  await page.evaluate(() => {
    const w = window as Window & { cls?: number };
    w.cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as unknown as { value: number }[]) w.cls! += e.value;
    }).observe({ type: "layout-shift" });
  });
  await input(page).focus();
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Home");
  await page.locator('.scrubber__thumb[data-value="720"]').click();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => (window as Window & { cls?: number }).cls)).toBe(0);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the golden-hour still and the labelled thumbnails; no dead control", async ({ page }) => {
    await page.goto(path("en"));
    await expect(input(page)).toBeHidden();
    await expect(
      page.locator('.scrubber__layer[data-provenance="MKN-SUN-SKY01-GOLD"] img'),
    ).toBeVisible();
    await expect(page.locator(".scrubber__thumb")).toHaveCount(5);
    await expect(page.locator(".scrubber__thumb").first()).toContainText("05:30 · Dawn");
  });
});
