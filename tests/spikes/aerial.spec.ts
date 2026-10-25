// Spike (b) measurements for concept 03. Emulated browsers on a desktop machine:
// these catch logic and memory-window bugs, not real-device frame rates.
import { expect, test } from "@playwright/test";

const SEQ = "/sequences/MKN-AER-FLT01-PLACEHOLDER/";

for (const lang of ["en", "ar"] as const) {
  test(`${lang}: five scroll passes keep the decode window bounded`, async ({ page, browserName }) => {
    // Playwright's Windows WebKit build has no AVIF decoder; it is covered by the fallback test below.
    test.skip(browserName === "webkit" && process.platform === "win32", "no AVIF in Windows WebKit");
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));

    await page.goto(`/${lang}/spike/aerial/?debug&force`, { waitUntil: "load" });
    await page.locator(".aerial").scrollIntoViewIfNeeded();
    await page.waitForFunction(() => document.querySelector(".aerial__canvas")?.hasAttribute("data-ready"));

    // GSAP wraps the pinned section in a .pin-spacer that carries the scroll distance.
    const { top, travel } = await page.evaluate(() => {
      const spacer = document.querySelector<HTMLElement>(".pin-spacer")!;
      return { top: spacer.offsetTop, travel: spacer.offsetHeight - innerHeight };
    });

    for (let pass = 0; pass < 5; pass++) {
      for (const dir of [1, -1]) {
        for (let s = 0; s <= 40; s++) {
          const t = dir === 1 ? s / 40 : 1 - s / 40;
          await page.evaluate((y) => window.scrollTo(0, y), top + t * travel);
          await page.waitForTimeout(16);
        }
      }
    }
    // Land on the last frame and let the scrub settle.
    await page.evaluate((y) => window.scrollTo(0, y), top + travel);
    await page.waitForTimeout(1500);

    const hud = await page.locator(".hud").textContent();
    console.log(`[${lang}] ${hud?.replace(/\n/g, " | ")}`);
    const peak = Number(/peak (\d+)/.exec(hud ?? "")?.[1]);
    expect(peak).toBeLessThanOrEqual(26); // ±12 window + the frame on screen
    expect(await page.locator("[data-tc]").textContent()).toBe("0960");
    expect(errors).toEqual([]);
  });
}

test("reduced motion loads stills only, no sequence frames", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  const seqRequests: string[] = [];
  page.on("request", (r) => r.url().includes(SEQ) && seqRequests.push(r.url()));
  await page.goto("/en/spike/aerial/", { waitUntil: "load" });
  await page.evaluate(() => window.scrollTo(0, 4000));
  await page.waitForTimeout(800);
  await expect(page.locator(".aerial")).toBeHidden();
  await expect(page.locator(".aerial-stills img")).toHaveCount(3);
  expect(seqRequests).toEqual([]);
  await context.close();
});

test("a browser without AVIF falls back to the stills", async ({ page, browserName }) => {
  test.skip(!(browserName === "webkit" && process.platform === "win32"), "needs a browser without AVIF");
  await page.goto("/en/spike/aerial/?force", { waitUntil: "load" });
  await expect(page.locator(".aerial")).toBeHidden();
  await expect(page.locator(".aerial-stills img").first()).toBeVisible();
});

test("no JS shows the three stills", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/en/spike/aerial/");
  await expect(page.locator(".aerial")).toBeHidden();
  await expect(page.locator(".aerial-stills img").first()).toBeVisible();
  await context.close();
});

// Rough mid-range Android stand-in: Pixel 7 viewport, 4× CPU slowdown. Not a substitute
// for the real-device check in the PRD exit criteria.
test("throttled mobile Chromium: frame intervals during the scrub", async ({ page, browserName }, info) => {
  test.skip(browserName !== "chromium" || info.project.name !== "mobile-chromium");
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });

  await page.goto("/en/spike/aerial/?debug&force", { waitUntil: "load" });
  await page.locator(".aerial").scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector(".aerial__canvas")?.hasAttribute("data-ready"));
  await page.waitForTimeout(3000); // let the progressive fetch finish

  const result = await page.evaluate(async () => {
    const spacer = document.querySelector<HTMLElement>(".pin-spacer")!;
    const top = spacer.offsetTop;
    const travel = spacer.offsetHeight - innerHeight;
    const gaps: number[] = [];
    let last = performance.now();
    let running = true;
    const loop = (t: number) => {
      gaps.push(t - last);
      last = t;
      if (running) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    const start = performance.now();
    const duration = 4000; // one full pass in 4 s
    await new Promise<void>((done) => {
      const step = () => {
        const t = Math.min(1, (performance.now() - start) / duration);
        scrollTo(0, top + t * travel);
        if (t < 1) requestAnimationFrame(step);
        else done();
      };
      requestAnimationFrame(step);
    });
    running = false;
    gaps.sort((a, b) => a - b);
    const pct = (p: number) => gaps[Math.floor(p * (gaps.length - 1))].toFixed(1);
    return { frames: gaps.length, p50: pct(0.5), p95: pct(0.95), over33: gaps.filter((g) => g > 33.4).length };
  });
  const hud = await page.locator(".hud").textContent();
  console.log(`[throttled] ${JSON.stringify(result)} | ${hud?.replace(/\n/g, " | ")}`);
});

// GSAP inserts its pin-spacer when the script runs (after `load`). Measure the shift it causes.
test("pinning on load causes no layout shift", async ({ page, browserName }, info) => {
  test.skip(browserName !== "chromium");
  await page.addInitScript(() => {
    const w = window as Window & { __cls?: number };
    w.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!e.hadRecentInput) w.__cls! += e.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto("/en/spike/aerial/?force", { waitUntil: "load" });
  await page.waitForSelector(".pin-spacer");
  await page.waitForTimeout(1500);
  const cls = await page.evaluate(() => (window as Window & { __cls?: number }).__cls!);
  console.log(`[${info.project.name}] aerial load CLS=${cls.toFixed(4)}`);
  expect(cls).toBeLessThanOrEqual(0.1);
});
