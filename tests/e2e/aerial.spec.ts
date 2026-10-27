import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

// 03 scroll-flown aerial (PRD §9.2) on MatchedFrameScrubber, scroll mode.
const path = (lang: "en" | "ar") => `/${lang}/capability/aerial-perspective/`;
const flight = (page: Page) => page.locator('[data-scrubber][data-mode="scroll"]');
const record = (id: string) =>
  JSON.parse(
    readFileSync(new URL(`../../src/content/assets/${id}.json`, import.meta.url), "utf8"),
  ) as { alt: { en: string; ar: string } };

/** Counts requests for sequence frames. */
function countFrames(page: Page): () => number {
  let frames = 0;
  page.on("request", (request) => {
    if (request.url().includes("/sequences/")) frames++;
  });
  return () => frames;
}

/** Scrolls through the whole flight in steps, then to its end. */
async function fly(page: Page, to = 1): Promise<void> {
  const { top, distance } = await page.locator(".flight__track").evaluate((track: HTMLElement) => {
    const header = document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
    return {
      top: track.getBoundingClientRect().top + scrollY - header,
      distance: track.offsetHeight - (innerHeight - header),
    };
  });
  for (let step = 1; step <= 10; step++) {
    await page.evaluate((y) => scrollTo(0, y), top + (distance * to * step) / 10);
    await page.waitForTimeout(80);
  }
}

test.describe("the flight", () => {
  test.skip(
    ({ browserName }) => browserName === "webkit" && process.platform === "win32",
    "Playwright's Windows WebKit can't decode AVIF, so it gets the stills (decision 0003)",
  );
  test.skip(
    ({ contextOptions }) => contextOptions.reducedMotion === "reduce",
    "covered by the stills tests",
  );

  for (const lang of ["en", "ar"] as const) {
    test(`pins, scrubs timecode and chapters, decodes a bounded window: ${lang}`, async ({
      page,
    }) => {
      await page.goto(path(lang));
      await expect(flight(page)).toHaveAttribute("data-flight", "sequence");
      await expect(page.locator(".flight__stills")).toBeHidden();

      await fly(page, 0.5);
      await expect(page.locator(".flight__stage")).toHaveCSS("position", "fixed");
      await expect(page.locator(".flight__canvas")).toHaveAttribute("data-ready", "");
      await expect(page.locator(".flight__filmstrip li").nth(1)).toHaveAttribute(
        "aria-current",
        "step",
      );

      await fly(page);
      await expect(page.locator("[data-flight-timecode]")).toHaveText("0960");
      await expect(page.locator(".flight__filmstrip li").nth(2)).toHaveAttribute(
        "aria-current",
        "step",
      );
      await expect(page.locator(".flight__filmstrip [aria-current]")).toHaveCount(1);
      await expect(page.locator(".flight__canvas")).toHaveAttribute(
        "aria-label",
        record("MKN-AER-FLT01-C").alt[lang],
      );
      // ±12 frames around the target plus the one on screen, never the whole sequence.
      const peak = await flight(page).evaluate(
        (el) =>
          (el as HTMLElement & { flightPlayer: { stats: { decodedPeak: number } } }).flightPlayer
            .stats.decodedPeak,
      );
      expect(peak).toBeGreaterThan(0);
      expect(peak).toBeLessThanOrEqual(25);
    });
  }

  test("the page never changes height when the pin starts", async ({ page }) => {
    await page.goto(path("en"), { waitUntil: "domcontentloaded" });
    const before = await page.evaluate(() => document.documentElement.scrollHeight);
    await fly(page, 0.3);
    await expect(page.locator(".flight__stage")).toHaveCSS("position", "fixed");
    await page.evaluate(() => scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBe(before);
  });

  test("frames are fetched only once the visitor scrolls, and after load", async ({ page }) => {
    const frames = countFrames(page);
    await page.goto(path("en"), { waitUntil: "load" });
    await page.waitForTimeout(1000);
    expect(frames()).toBe(0);
    await fly(page, 0.1);
    const timing = await page.evaluate(async () => {
      const first = () =>
        performance
          .getEntriesByType("resource")
          .find((entry) => entry.name.includes("/sequences/"));
      while (!first()) await new Promise((r) => setTimeout(r, 50));
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      return { frame: first()!.startTime, load: nav.loadEventStart };
    });
    expect(timing.frame).toBeGreaterThanOrEqual(timing.load);
  });

  test("Skip the flight moves focus past it", async ({ page }) => {
    await page.goto(path("en"));
    await page.getByRole("link", { name: "Skip the flight" }).click();
    await expect(page.locator(".flight__after")).toBeFocused();
    const below = await page.locator(".flight__track").evaluate((el) => {
      return el.getBoundingClientRect().bottom <= innerHeight;
    });
    expect(below).toBe(true);
  });

  test("Arabic: the filmstrip mirrors; the frame and the timecode don't", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(path("ar"));
    await fly(page, 0.2);
    const [frame, side] = await page.$$eval([".flight__frame", ".flight__side"].join(","), (els) =>
      els.map((el) => el.getBoundingClientRect().left),
    );
    expect(frame).toBeGreaterThan(side);
    await expect(page.locator(".flight__timecode")).toHaveCSS("direction", "ltr");
    await expect(page.locator(".flight__canvas")).toHaveCSS("transform", "none");
    await expect(page.locator(".flight__media img")).toHaveCSS("transform", "none");
  });

  test("turning motion off in the footer switches to the stills", async ({ page }) => {
    await page.goto(path("en"));
    await expect(flight(page)).toHaveAttribute("data-flight", "sequence");
    await page.locator("[data-motion-toggle]").click();
    await expect(flight(page)).not.toHaveAttribute("data-flight", "sequence");
    await expect(page.locator(".flight__stills figure")).toHaveCount(3);
    await expect(page.locator(".flight__stills figure").first()).toBeVisible();
    await page.locator("[data-motion-toggle]").click();
    await expect(flight(page)).toHaveAttribute("data-flight", "sequence");
  });
});

test.describe("the stills", () => {
  const expectStills = async (page: Page, frames: () => number) => {
    await expect(flight(page)).not.toHaveAttribute("data-flight", "sequence");
    await expect(page.locator(".flight__track")).toBeHidden();
    await expect(page.getByRole("link", { name: "Skip the flight" })).toBeHidden();
    const stills = page.locator(".flight__stills figure[data-provenance]");
    await expect(stills).toHaveCount(3);
    await stills.last().scrollIntoViewIfNeeded();
    await expect(stills.last().locator("img")).toBeVisible();
    await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(500);
    expect(frames()).toBe(0);
  };

  test("reduced motion loads only the stills", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const frames = countFrames(page);
    await page.goto(path("en"));
    await expectStills(page, frames);
  });

  test("Save-Data loads only the stills", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "connection", { value: { saveData: true } });
    });
    const frames = countFrames(page);
    await page.goto(path("en"));
    await expectStills(page, frames);
  });

  test("low device memory loads only the stills", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "deviceMemory", { value: 2 });
    });
    const frames = countFrames(page);
    await page.goto(path("ar"));
    await expectStills(page, frames);
  });

  test("without JS, the stills", async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    const frames = countFrames(page);
    await page.goto(path("en"));
    await expectStills(page, frames);
    await context.close();
  });
});

test("the home page teases the flight with its three stills, and fetches no frames", async ({
  page,
}) => {
  const frames = countFrames(page);
  await page.goto("/en/");
  const teaser = page.locator("#capability figure[data-provenance]");
  await expect(teaser).toHaveCount(3);
  for (const [i, id] of ["MKN-AER-FLT01-A", "MKN-AER-FLT01-B", "MKN-AER-FLT01-C"].entries()) {
    await expect(teaser.nth(i)).toHaveAttribute("data-provenance", id);
  }
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(300);
  expect(frames()).toBe(0);
});
