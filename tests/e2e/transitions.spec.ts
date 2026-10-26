import { expect, test, type Page } from "@playwright/test";

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
    await page.locator(`footer a[href="/${lang}/privacy/"]`).click();
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
  await page.locator('footer a[href="/en/privacy/"]').click();
  await expect(page).toHaveURL(/\/en\/privacy\/$/);
  await expect(page.locator("html")).not.toHaveAttribute("data-vt", /.+/);
});

test("OS reduced motion navigates without a transition", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/en/");
  await record(page);
  await page.locator('footer a[href="/en/privacy/"]').click();
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
