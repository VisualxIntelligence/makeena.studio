import { expect, test, type Page } from "@playwright/test";
import { routes } from "./routes";

// Phase 5 accessibility audit fixes (PRD §14), kept as regressions. The full audit is
// `npm run audit:a11y`; these are the parts that broke.

// Each test sets its own viewport, so the phone projects would only repeat the desktop runs.
test.skip(({ isMobile }) => isMobile, "viewport set per test");

test.describe("reflow at 320 px (WCAG 1.4.10)", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const { path } of routes) {
    test(`no sideways scroll: ${path}`, async ({ page }) => {
      await page.goto(path);
      const { scroll, client } = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      expect(scroll).toBeLessThanOrEqual(client);
    });
  }
});

async function size(page: Page, selector: string) {
  const box = await page.locator(selector).first().boundingBox();
  return { width: Math.round(box!.width), height: Math.round(box!.height) };
}

for (const lang of ["en", "ar"] as const) {
  test(`header and footer controls are 44 × 44 (${lang})`, async ({ page }) => {
    for (const width of [320, 1280]) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(`/${lang}/`);
      const controls = [".site-header__mark", ".site-header__lang", ".site-header .button"];
      if (width === 320) controls.push(".site-header__menu");
      for (const sel of controls) {
        const { width: w, height: h } = await size(page, sel);
        expect(Math.min(w, h), `${sel} at ${width}px is ${w}×${h}`).toBeGreaterThanOrEqual(44);
      }
      const footer = page.locator(".site-footer li a, .site-footer li button");
      for (let i = 0; i < (await footer.count()); i++) {
        const box = (await footer.nth(i).boundingBox())!;
        const name = await footer.nth(i).textContent();
        expect(Math.min(box.width, box.height), `footer "${name?.trim()}"`).toBeGreaterThanOrEqual(
          44,
        );
      }
    }
  });
}

test("capability links are 44 px tall", async ({ page }) => {
  await page.goto("/en/capability/");
  const links = page.locator(".lead-services h3 a");
  expect(await links.count()).toBeGreaterThan(0);
  for (let i = 0; i < (await links.count()); i++) {
    expect((await links.nth(i).boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
});

test("03: the provenance button stays above the drawn canvas", async ({ page }, info) => {
  test.skip(info.project.name === "reduced-motion", "reduced motion shows stills, no canvas");
  await page.goto("/en/capability/aerial-perspective/");
  // The AVIF probe runs once the flight nears the viewport; without a decoder (Playwright's
  // Windows WebKit) the flight falls back to stills, which have no canvas.
  await page.locator(".flight").scrollIntoViewIfNeeded();
  await page.waitForLoadState("load");
  await page.waitForTimeout(1000);
  const avif = await page.locator(".flight").getAttribute("data-avif");
  test.skip(avif === "no", "no AVIF decoder: stills, no canvas");
  // As if the sequence had drawn its first frame (the canvas covers the poster).
  await page.locator(".flight__canvas").evaluate((c) => c.setAttribute("data-ready", ""));
  // A trial click waits for the button to be stable (the sticky stage settles after scrolling)
  // and fails if another element, such as the canvas, would receive the click.
  await page
    .locator(".flight__media [data-variant='day'] .pfig__info")
    .click({ trial: true, timeout: 5000 });
});

// The studio page has the most stops in <main> (the brief form): without scroll-padding, Shift+Tab
// leaves the email field at the very top, under the header.
test("Shift+Tab never leaves focus under the sticky header (WCAG 2.4.11)", async ({ page }) => {
  await page.goto("/en/studio/");
  await page.locator(".site-footer a").last().focus();
  for (let i = 0; i < 60; i++) {
    await page.keyboard.press("Shift+Tab");
    const covered = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      // The skip link is meant to appear over the header.
      // Past the first stop, focus leaves the page (activeElement falls back to <body>).
      if (
        !el ||
        el === document.body ||
        el.closest(".site-header") ||
        el.classList.contains("skip-link")
      )
        return "";
      const header = document.querySelector(".site-header")!.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      // Only stops that are on screen but behind the header. Playwright's WebKit leaves keyboard
      // focus on the provenance buttons entirely off-screen (no scroll at all; focus() does
      // scroll): a separate issue, checked on real Safari in the cross-browser pass.
      const behind = r.bottom > 0 && r.top < header.bottom - 1;
      return behind
        ? `${el.tagName} "${el.textContent?.trim().slice(0, 30)}" top ${Math.round(r.top)}`
        : "";
    });
    expect(covered).toBe("");
  }
});
