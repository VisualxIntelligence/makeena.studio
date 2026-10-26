import { expect, test, type Page } from "@playwright/test";

// G1 motion controller (PRD §8.1) and the ClientRouter lifecycle (decision 0002).

type MotionHook = { allowed: boolean; activeTriggers: number };
const hook = (page: Page) =>
  page.evaluate(() => {
    const m = (window as unknown as { __mknMotion: MotionHook }).__mknMotion;
    return { allowed: m.allowed, activeTriggers: m.activeTriggers };
  });
const opacity = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el) => Number(getComputedStyle(el).opacity));
const lastSection = "main section:last-of-type [data-reveal]";
// G1 loads GSAP on the first interaction; a key press counts and does not scroll.
const interact = (page: Page) => page.keyboard.press("Shift");

test.describe("ClientRouter", () => {
  test("navigates without a full reload and focuses main", async ({ page }) => {
    await page.goto("/en/");
    await page.evaluate(() => ((window as unknown as { marker: number }).marker = 1));
    await page.locator('footer a[href="/en/privacy/"]').click();
    await expect(page).toHaveURL(/\/en\/privacy\/$/);
    await expect(page.locator("main h1")).toHaveText("Privacy and data.");
    expect(await page.evaluate(() => (window as unknown as { marker?: number }).marker)).toBe(1);
    await expect(page.locator("main")).toBeFocused();
    await expect(page.locator("html")).toHaveClass(/\bjs\b/);
  });

  test("effects are torn down on every navigation (no leaked ScrollTriggers)", async ({ page }) => {
    await page.goto("/en/method/");
    await interact(page);
    if ((await hook(page)).allowed) {
      await expect.poll(async () => (await hook(page)).activeTriggers).toBeGreaterThan(0);
    }
    const fresh = (await hook(page)).activeTriggers;
    for (const href of ["/en/engagement/", "/en/studio/", "/en/method/"]) {
      await page.evaluate((h) => {
        const a = document.querySelector<HTMLAnchorElement>(`a[href="${h}"]`)!;
        a.click();
      }, href);
      await expect(page).toHaveURL(new RegExp(`${href}$`));
    }
    await expect.poll(async () => (await hook(page)).activeTriggers).toBe(fresh);
  });

  test("the phone menu still works after a routed navigation", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 });
    await page.goto("/en/");
    await page.locator(".site-header__menu").click();
    await page.locator("#site-nav a").nth(1).click();
    await expect(page).toHaveURL(/\/en\/method\/$/);
    await expect(page.locator("#site-nav a").first()).toBeHidden();
    await page.locator(".site-header__menu").click();
    await expect(page.locator("#site-nav a").first()).toBeVisible();
  });
});

test.describe("reveal and reduced motion", () => {
  test("below-the-fold blocks reveal on scroll, or show at once under reduced motion", async ({
    page,
  }) => {
    await page.goto("/en/method/");
    await page.evaluate(() => document.fonts.ready);
    // Nothing is hidden before the visitor interacts.
    expect(await opacity(page, lastSection)).toBe(1);
    await interact(page);
    const { allowed } = await hook(page);
    if (allowed) {
      await expect.poll(() => opacity(page, lastSection)).toBe(0);
      await page.locator(lastSection).scrollIntoViewIfNeeded();
      await expect.poll(() => opacity(page, lastSection)).toBe(1);
    } else {
      expect(await opacity(page, lastSection)).toBe(1);
    }
    // The header (LCP) is never hidden.
    expect(await opacity(page, "main h1")).toBe(1);
  });

  test("switching OS reduced motion on shows everything without a reload", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en/method/");
    await interact(page);
    await expect.poll(() => opacity(page, lastSection)).toBe(0);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect.poll(() => opacity(page, lastSection)).toBe(1);
    expect((await hook(page)).allowed).toBe(false);
  });

  test("the footer control turns motion off and is remembered", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/en/method/");
    const toggle = page.locator("[data-motion-toggle]");
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await interact(page);
    await expect.poll(() => opacity(page, lastSection)).toBe(0);

    await toggle.click();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");
    await expect.poll(() => opacity(page, lastSection)).toBe(1);
    expect((await hook(page)).allowed).toBe(false);

    await page.reload();
    await expect(page.locator("[data-motion-toggle]")).toHaveAttribute("aria-pressed", "true");
    expect(await opacity(page, lastSection)).toBe(1);

    await page.locator('footer a[href="/en/studio/#register"]').click();
    await expect(page.locator("[data-motion-toggle]")).toHaveAttribute("aria-pressed", "true");

    await page.locator("[data-motion-toggle]").click();
    expect((await hook(page)).allowed).toBe(true);
  });
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("everything is visible and there is no motion control", async ({ page }) => {
    await page.goto("/en/method/");
    expect(await opacity(page, lastSection)).toBe(1);
    await expect(page.locator("[data-motion-toggle]")).toBeHidden();
  });
});
