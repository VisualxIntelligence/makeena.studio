import { expect, test, type Page } from "@playwright/test";

// 13 after hours (PRD §8.4).
const html = (page: Page) => page.locator("html");
const toggle = (page: Page) => page.locator("[data-hours-toggle]");
const heroImg = (page: Page, variant: "day" | "night") =>
  page.locator(`figure[data-provenance="MKN-TWR-CAM01-DUSK"] [data-variant="${variant}"] img`);
const toastText = (page: Page) => page.locator("[data-toast-text]");

test("the footer toggle swaps the hero to night and announces it", async ({ page }) => {
  const nightRequests: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("MKN-TWR-CAM01-NIGHT")) nightRequests.push(r.url());
  });
  await page.goto("/en/");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "false");
  await expect(heroImg(page, "day")).toBeVisible();
  await expect(heroImg(page, "night")).toBeHidden();
  // Night sources are fetched only on activation.
  await page.waitForLoadState("networkidle");
  expect(nightRequests).toEqual([]);

  await toggle(page).click();
  await expect(html(page)).toHaveAttribute("data-hours", "night");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");
  await expect(heroImg(page, "night")).toBeVisible();
  await expect(heroImg(page, "day")).toBeHidden();
  await expect(page.locator('[data-toast][role="status"]')).toBeAttached();
  await expect(toastText(page)).toHaveText("AFTER HOURS · THE CITY AT 21:40 AST");
  await expect.poll(() => nightRequests.length).toBeGreaterThan(0);
  // The night image really loads (WebKit skips lazy images that were hidden at load).
  await expect
    .poll(() =>
      heroImg(page, "night").evaluate((i: HTMLImageElement) => i.complete && i.naturalWidth > 0),
    )
    .toBe(true);

  // The ivory pages stay ivory: only the imagery changes.
  const background = await page.evaluate(
    () => getComputedStyle(document.documentElement).backgroundColor,
  );
  expect(background).toBe("rgb(246, 242, 234)");

  await toggle(page).click();
  await expect(html(page)).not.toHaveAttribute("data-hours", /.+/);
  await expect(heroImg(page, "day")).toBeVisible();
});

test("the state survives navigation, the language switch and a reload, with no flash", async ({
  page,
}) => {
  await page.goto("/en/");
  await toggle(page).click();
  // Navigate from the top of the page with header links (visible on phones too); a scrolled
  // phone navigation is covered by transitions.spec.ts.
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator("header .button").click();
  await expect(page).toHaveURL(/\/en\/studio\/#brief$/);
  await expect(html(page)).toHaveAttribute("data-hours", "night");
  await page.evaluate(() => scrollTo(0, 0));
  await page.locator("header a[data-lang-switch]").click();
  await expect(page).toHaveURL(/\/ar\/studio\/#brief$/);
  await expect(html(page)).toHaveAttribute("data-hours", "night");
  await expect(toggle(page)).toHaveAttribute("aria-pressed", "true");

  await page.addInitScript(() =>
    document.addEventListener("DOMContentLoaded", () => {
      (window as Window & { hoursAtDcl?: string }).hoursAtDcl =
        document.documentElement.dataset.hours;
    }),
  );
  await page.goto("/ar/");
  expect(await page.evaluate(() => (window as Window & { hoursAtDcl?: string }).hoursAtDcl)).toBe(
    "night",
  );
  await expect(heroImg(page, "night")).toBeVisible();
});

test.describe("keyboard shortcuts (WCAG 2.1.4)", () => {
  test("N and typing doha toggle after hours", async ({ page }) => {
    await page.goto("/en/");
    await page.keyboard.press("n");
    await expect(html(page)).toHaveAttribute("data-hours", "night");
    await page.keyboard.type("doha");
    await expect(html(page)).not.toHaveAttribute("data-hours", /.+/);
  });

  test("keys in a form field or with a modifier do nothing", async ({ page }) => {
    await page.goto("/en/");
    await page.evaluate(() => {
      const input = document.createElement("input");
      input.id = "probe";
      document.querySelector("main")!.prepend(input);
    });
    await page.locator("#probe").fill("");
    await page.locator("#probe").pressSequentially("doha n");
    await expect(html(page)).not.toHaveAttribute("data-hours", /.+/);
    await page.locator("main h1").click();
    await page.keyboard.press("Alt+n");
    await page.keyboard.press("Shift+n");
    await expect(html(page)).not.toHaveAttribute("data-hours", /.+/);
  });

  test("shortcuts can be turned off, and stay off", async ({ page }) => {
    await page.goto("/en/");
    const shortcuts = page.locator("[data-shortcuts-toggle]");
    await expect(shortcuts).toHaveAttribute("aria-pressed", "true");
    await shortcuts.click();
    await expect(shortcuts).toHaveAttribute("aria-pressed", "false");
    await page.locator("main h1").click();
    await page.keyboard.press("n");
    await page.keyboard.type("doha");
    await expect(html(page)).not.toHaveAttribute("data-hours", /.+/);
    await page.reload();
    await expect(page.locator("[data-shortcuts-toggle]")).toHaveAttribute("aria-pressed", "false");
    // The footer toggle still works with shortcuts off.
    await toggle(page).click();
    await expect(html(page)).toHaveAttribute("data-hours", "night");
  });
});

test("the toast dismisses itself after 4 s, or on request", async ({ page }) => {
  await page.goto("/en/");
  await toggle(page).click();
  await expect(toastText(page)).not.toBeEmpty();
  await expect(toastText(page)).toBeEmpty({ timeout: 6000 });
  await toggle(page).click();
  await toggle(page).click();
  await page.locator("[data-toast-close]").click();
  await expect(toastText(page)).toBeEmpty();
});

test("the swap crossfades when motion is allowed and is instant otherwise", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en/");
  await page.evaluate(() => {
    const w = window as Window & { vtNames?: string[] };
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = ((cb: () => void) => {
      const vt = start(cb);
      vt.ready
        .then(() => {
          w.vtNames = document.getAnimations().map((a) => (a as CSSAnimation).animationName);
        })
        .catch(() => (w.vtNames = []));
      return vt;
    }) as typeof document.startViewTransition;
  });
  await toggle(page).click();
  await expect
    .poll(() => page.evaluate(() => (window as Window & { vtNames?: string[] }).vtNames))
    .toEqual(expect.arrayContaining(["vt-fade-in", "vt-fade-out"]));

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => {
    (window as Window & { vtCalls?: number }).vtCalls = 0;
    document.startViewTransition = (() => {
      (window as Window & { vtCalls?: number }).vtCalls! += 1;
      throw new Error("no transition expected");
    }) as typeof document.startViewTransition;
  });
  await toggle(page).click();
  await expect(html(page)).not.toHaveAttribute("data-hours", /.+/);
  expect(await page.evaluate(() => (window as Window & { vtCalls?: number }).vtCalls)).toBe(0);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the after-hours controls are hidden", async ({ page }) => {
    await page.goto("/en/");
    await expect(toggle(page)).toBeHidden();
    await expect(page.locator("[data-shortcuts-toggle]")).toBeHidden();
  });
});
