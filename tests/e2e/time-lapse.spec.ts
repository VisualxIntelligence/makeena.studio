import { expect, test, type Page } from "@playwright/test";

// 07 construction time-lapse (PRD §9.5) on MatchedFrameScrubber, discrete mode.
const path = (lang: "en" | "ar") => `/${lang}/capability/standing-production/`;
const scrubber = (page: Page) => page.locator("[data-scrubber]");
const radio = (page: Page, month: number) =>
  page.locator(`.scrubber__stops input[value="${month}"]`);
const live = (page: Page) => page.locator("[data-scrubber-live]");
const wipe = (page: Page) => page.locator("[data-scrubber-wipe]");
const setWipe = (page: Page, v: number) =>
  page.locator("[data-scrubber-wipe-input]").evaluate((el: HTMLInputElement, value) => {
    el.value = String(value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, v);

test("arrow keys move between stops; frame, notes and live region follow", async ({ page }) => {
  await page.goto(path("en"));
  await expect(scrubber(page)).toHaveAttribute("data-provenance", "MKN-PRG-CAM01-M00");
  await radio(page, 0).focus();
  await page.keyboard.press("ArrowRight");
  await expect(radio(page, 6)).toBeChecked();
  await expect(scrubber(page)).toHaveAttribute("data-provenance", "MKN-PRG-CAM01-M06");
  await expect(live(page)).toHaveText("Month 06 of 24");
  await expect(page.locator(".scrubber__note[data-active]")).toContainText(
    "[PLACEHOLDER: month 06 deliverables of standing capacity]",
  );
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await expect(scrubber(page)).toHaveAttribute("data-provenance", "MKN-TWR-CAM01-OVERCAST");
  await expect(live(page)).toHaveText("Month 24 of 24");
  await scrubber(page).locator(".pfig__info").click();
  await expect(page.locator("[popover]:popover-open")).toContainText("MKN-TWR-CAM01-OVERCAST");
});

test("the wipe compares a stop with the one before, from the inline start", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(path("en"));
  await expect(wipe(page)).toBeHidden();
  await page.locator(".scrubber__stop").nth(2).click();
  await expect(wipe(page)).toBeVisible();
  await expect(wipe(page)).toContainText("Compare with month 06");
  await setWipe(page, 40);
  const current = page.locator('.scrubber__layer[data-provenance="MKN-PRG-CAM01-M14"]');
  await expect(current).toHaveCSS("clip-path", "inset(0px 0px 0px 40%)");
  await expect(page.locator('.scrubber__layer[data-provenance="MKN-PRG-CAM01-M06"]')).toBeVisible();
});

test("Arabic: chronology from the right, the wipe mirrors, no sideways scroll", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(path("ar"));
  const [m00, m06] = await page.$$eval(".scrubber__stop", (els) =>
    els.slice(0, 2).map((el) => el.getBoundingClientRect().left),
  );
  expect(m00).toBeGreaterThan(m06);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBe(0);
  await page.locator(".scrubber__stop").nth(1).click();
  await expect(live(page)).toHaveText("الشهر 06 من 24");
  await setWipe(page, 30);
  await expect(page.locator('.scrubber__layer[data-provenance="MKN-PRG-CAM01-M06"]')).toHaveCSS(
    "clip-path",
    "inset(0px 30% 0px 0px)",
  );
});

test("quick stop changes only ever crossfade (never the page sweep)", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto(path("en"));
  // Record each transition's animations once, when it is ready. (Polling getAnimations() every
  // frame crashes Playwright's Windows WebKit during view transitions.)
  await page.evaluate(() => {
    const w = window as Window & { names?: Set<string> };
    w.names = new Set();
    const start = document.startViewTransition.bind(document);
    document.startViewTransition = ((cb: () => void) => {
      const vt = start(cb);
      vt.ready
        .then(() => {
          for (const a of document.getAnimations()) w.names!.add((a as CSSAnimation).animationName);
        })
        .catch(() => undefined);
      return vt;
    }) as typeof document.startViewTransition;
  });
  await radio(page, 0).focus();
  for (let i = 0; i < 3; i++) await page.keyboard.press("ArrowRight");
  await expect(scrubber(page)).toHaveAttribute("data-provenance", "MKN-TWR-CAM01-OVERCAST");
  await expect(page.locator("html")).not.toHaveAttribute("data-vt", /.+/);
  const names = await page.evaluate(() => [...(window as Window & { names?: Set<string> }).names!]);
  expect(names.filter((n) => n.startsWith("vt-"))).toEqual(
    expect.arrayContaining(["vt-fade-in", "vt-fade-out"]),
  );
  expect(names.filter((n) => /vt-(line|reveal|split)/.test(n))).toEqual([]);
});

test("reduced motion: instant swap and no wipe", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(path("en"));
  await page.evaluate(() => {
    (window as Window & { vt?: number }).vt = 0;
    document.startViewTransition = (() => {
      (window as Window & { vt?: number }).vt! += 1;
      throw new Error("no transition expected");
    }) as typeof document.startViewTransition;
  });
  await page.locator(".scrubber__stop").nth(2).click();
  await expect(scrubber(page)).toHaveAttribute("data-provenance", "MKN-PRG-CAM01-M14");
  await expect(wipe(page)).toBeHidden();
  expect(await page.evaluate(() => (window as Window & { vt?: number }).vt)).toBe(0);
});

test("frames not on screen are not fetched before the visitor interacts", async ({ page }) => {
  await page.goto(path("en"));
  await page.waitForLoadState("networkidle");
  const layerSrcs = await page.$$eval(".scrubber__layer img", (imgs) =>
    imgs.map((i) => ({
      id: i.closest("[data-provenance]")!.getAttribute("data-provenance"),
      done: (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0,
    })),
  );
  expect(layerSrcs.filter((l) => l.done).map((l) => l.id)).toEqual(["MKN-PRG-CAM01-M00"]);
  await radio(page, 0).focus();
  await expect
    .poll(() =>
      page.$$eval(
        ".scrubber__layer img",
        (imgs) => imgs.filter((i) => (i as HTMLImageElement).loading === "eager").length,
      ),
    )
    .toBe(4);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("every stop as a labelled grid with its notes; no picker", async ({ page }) => {
    await page.goto(path("en"));
    await expect(page.locator(".scrubber__layer img")).toHaveCount(4);
    for (const img of await page.locator(".scrubber__layer img").all())
      await expect(img).toBeVisible();
    await expect(page.locator(".scrubber__stops")).toBeHidden();
    await expect(scrubber(page).locator(".pfig__info")).toBeHidden();
    await expect(page.locator(".scrubber__note")).toHaveCount(4);
    await expect(page.locator(".scrubber__layer-label").first()).toHaveText(
      "Month 00 · Empty plot",
    );
  });
});
