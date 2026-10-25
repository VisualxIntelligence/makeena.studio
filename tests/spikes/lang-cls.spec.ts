// Spike (c) concept 12: CLS on the EN ⇄ AR switch with the real fonts.
// Chromium only (Layout Instability API). Network throttled so font swaps land late.
import { expect, test, type Page } from "@playwright/test";

const observeShifts = () => {
  const w = window as Window & { __shifts?: { value: number; t: number; nodes: string[] }[] };
  w.__shifts = [];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries() as (PerformanceEntry & {
      value: number;
      hadRecentInput: boolean;
      sources?: { node?: Node }[];
    })[]) {
      if (e.hadRecentInput) continue;
      w.__shifts!.push({
        value: e.value,
        t: Math.round(e.startTime),
        nodes: (e.sources ?? []).map((s) => {
          const el = s.node as Element | undefined;
          return el?.nodeName ? `${el.nodeName.toLowerCase()}${el.className ? "." + String(el.className).split(" ")[0] : ""}` : "?";
        }),
      });
    }
  }).observe({ type: "layout-shift", buffered: true });
};

async function throttle(page: Page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  // Roughly "Slow 4G": 150 ms RTT, 1.6 Mbps down.
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 150,
    downloadThroughput: (1.6 * 1024 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: false });
}

for (const [from, to] of [["en", "ar"], ["ar", "en"]] as const) {
  for (const page_ of ["home", "method"]) {
    test(`CLS ${from} → ${to} on /${page_}/`, async ({ page, browserName }, info) => {
      test.skip(browserName !== "chromium");
      test.setTimeout(60_000);
      await page.addInitScript(observeShifts);
      await throttle(page);
      await page.goto(`/${from}/spike/${page_}/`, { waitUntil: "load" });
      await page.waitForTimeout(500);
      await page.locator("a[data-lang-switch]").click();
      await page.waitForURL(`**/${to}/spike/${page_}/`);
      await page.waitForLoadState("load");
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(1500);
      const r = await page.evaluate(() => {
        const w = window as Window & { __shifts?: { value: number; t: number; nodes: string[] }[] };
        const fonts = [...document.fonts].filter((f) => f.status === "loaded").map((f) => `${f.family.split("-")[0]} ${f.weight}`);
        return { shifts: w.__shifts!, fonts: [...new Set(fonts)] };
      });
      const cls = r.shifts.reduce((a, s) => a + s.value, 0);
      console.log(
        `[${info.project.name}] ${from}→${to} /${page_}/ CLS=${cls.toFixed(4)} shifts=${JSON.stringify(r.shifts)} fonts=${r.fonts.join(", ")}`,
      );
      expect(cls).toBeLessThanOrEqual(0.1);
    });
  }
}

test("CLS worst case: cold direct load of /ar/ on Slow 3G", async ({ page, browserName }, info) => {
  test.skip(browserName !== "chromium");
  test.setTimeout(90_000);
  await page.addInitScript(observeShifts);
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 400,
    downloadThroughput: (400 * 1024) / 8,
    uploadThroughput: (400 * 1024) / 8,
  });
  const t0 = Date.now();
  await page.goto("/ar/spike/home/", { waitUntil: "load", timeout: 80_000 });
  await page.evaluate(() => document.fonts.ready);
  const loadedAt = Date.now() - t0;
  await page.waitForTimeout(1500);
  const shifts = await page.evaluate(() => (window as Window & { __shifts?: { value: number; t: number; nodes: string[] }[] }).__shifts!);
  const cls = shifts.reduce((a, s) => a + s.value, 0);
  console.log(`[${info.project.name}] cold /ar/ slow-3G CLS=${cls.toFixed(4)} fontsReady≈${loadedAt}ms shifts=${JSON.stringify(shifts)}`);
  expect(cls).toBeLessThanOrEqual(0.1);
});
