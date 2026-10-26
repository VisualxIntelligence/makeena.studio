import { expect, test, type Page } from "@playwright/test";

/**
 * Activates a link without scrolling to it first. Playwright's Windows WebKit crashes after a
 * routed view transition from a scrolled phone page (decision 0011); that case has its own test.
 */
const clickInPlace = (page: Page, selector: string) =>
  page.locator(selector).evaluate((el: HTMLElement) => el.click());

// G2 on the ClientRouter (PRD §8.2): 11 section-cut and 12 mirror-line.

type Recorded = { ran: boolean; types?: string[]; animations?: string[] };

/** Records the next routed view transition: whether it ran and which animations it played. */
const record = (page: Page) =>
  page.evaluate(() => {
    const w = window as Window & { __vt?: unknown };
    delete w.__vt;
    document.addEventListener(
      "astro:before-swap",
      (e) => {
        const vt = (e as Event & { viewTransition: ViewTransition & { types?: Set<string> } })
          .viewTransition;
        vt.ready
          .then(() => {
            w.__vt = {
              ran: true,
              types: [...(vt.types ?? [])],
              animations: document
                .getAnimations()
                .map(
                  (a) =>
                    `${(a.effect as KeyframeEffect).pseudoElement}:${(a as CSSAnimation).animationName}`,
                )
                .sort(),
            };
          })
          .catch(() => (w.__vt = { ran: false }));
      },
      { once: true },
    );
  });

const recorded = (page: Page) =>
  page
    .waitForFunction(() => (window as Window & { __vt?: unknown }).__vt)
    .then((h) => h.jsonValue() as Promise<Recorded>);

for (const [lang, dir] of [
  ["en", "ltr"],
  ["ar", "rtl"],
] as const) {
  test(`11: ${lang} navigation sweeps ${dir}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/${lang}/`);
    await record(page);
    await clickInPlace(page, `footer a[href="/${lang}/privacy/"]`);
    await expect(page).toHaveURL(new RegExp(`/${lang}/privacy/$`));
    const vt = await recorded(page);
    expect(vt.ran).toBe(true);
    const names = vt.animations!.join(" ");
    expect(names).toContain(`::view-transition-new(root):vt-reveal-${dir}`);
    expect(names).toContain(`::view-transition-group(cut-line):vt-line-${dir}`);
    await expect(page.locator("main")).toBeFocused();
  });
}

for (const [from, to] of [
  ["en", "ar"],
  ["ar", "en"],
] as const) {
  test(`12: ${from} → ${to} language switch splits from the centre and keeps the section`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto(`/${from}/method/#provenance`);
    await record(page);
    await page.locator("header a[data-lang-switch]").click();
    await expect(page).toHaveURL(new RegExp(`/${to}/method/#provenance$`));
    const vt = await recorded(page);
    expect(vt.ran).toBe(true);
    const names = vt.animations!.join(" ");
    expect(names).toContain("::view-transition-new(root):vt-reveal-centre");
    expect(names).toContain("::view-transition-group(cut-line):vt-split-left");
    expect(names).toContain("::view-transition-group(cut-line-b):vt-split-right");
    await expect(page.locator("html")).toHaveAttribute("lang", to);
  });
}

test("the flag is cleared once the transition ends", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en/");
  await clickInPlace(page, 'footer a[href="/en/privacy/"]');
  await expect(page).toHaveURL(/\/en\/privacy\/$/);
  await expect(page.locator("html")).not.toHaveAttribute("data-vt", /.+/);
});

test("OS reduced motion navigates without a transition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/");
  await record(page);
  await clickInPlace(page, 'footer a[href="/en/privacy/"]');
  await expect(page).toHaveURL(/\/en\/privacy\/$/);
  expect((await recorded(page)).ran).toBe(false);
});

test("the footer Reduce motion control navigates without a transition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en/");
  await page.locator("[data-motion-toggle]").click();
  await record(page);
  await page.locator("header a[data-lang-switch]").click();
  await expect(page).toHaveURL(/\/ar\/$/);
  expect((await recorded(page)).ran).toBe(false);
  await page.locator("[data-motion-toggle]").click();
});

test("12: the language switch causes no layout shift (CLS ≤ 0.1)", async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "layout-shift entries are Chromium-only");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/en/method/");
  await page.evaluate(() => {
    const w = window as Window & { __cls?: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceEntry[] &
        { value: number; hadRecentInput: boolean }[]) {
        if (!entry.hadRecentInput) w.__cls! += entry.value;
      }
    }).observe({ type: "layout-shift" });
  });
  await page.locator("header a[data-lang-switch]").click();
  await expect(page).toHaveURL(/\/ar\/method\/$/);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(800);
  const cls = await page.evaluate(() => (window as Window & { __cls?: number }).__cls);
  console.log(`[${browserName}] language switch CLS=${cls!.toFixed(4)}`);
  expect(cls).toBeLessThanOrEqual(0.1);
});

// Playwright's Windows WebKit (WinCairo) crashes after a routed view transition started from a
// scrolled page at phone width, whatever the CSS does (decision 0011). This runs on Linux WebKit in
// CI; real iOS Safari is covered by docs/qa/ios-safari-checklist.md.
test("a navigation from a scrolled phone page completes and the page stays alive", async ({
  browser,
  browserName,
}) => {
  test.skip(
    browserName === "webkit" && process.platform === "win32",
    "Playwright's Windows WebKit build crashes here (WinCairo); checked on Linux CI and real iOS",
  );
  const context = await browser.newContext({
    viewport: { width: 393, height: 659 },
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  let crashed = false;
  page.on("crash", () => (crashed = true));
  await page.goto("/en/");
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  // A real click: Playwright scrolls the link into view first, which is the case under test.
  await page.locator('footer a[href="/en/privacy/"]').click();
  await expect(page).toHaveURL(/\/en\/privacy\/$/);
  await page.waitForTimeout(2500);
  expect(crashed).toBe(false);
  await expect(page.locator("main h1")).toHaveText("Privacy and data.");
  await context.close();
});
