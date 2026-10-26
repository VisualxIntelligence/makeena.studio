import { readFileSync, readdirSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { routes } from "./routes";

// 08 ProvenanceFigure (PRD §8.3).
const assetsDir = new URL("../../src/content/assets/", import.meta.url);
const records = Object.fromEntries(
  readdirSync(assetsDir).map((f) => {
    const r = JSON.parse(readFileSync(new URL(f, assetsDir), "utf8"));
    return [r.id, r];
  }),
);

test.describe("no unlabelled media", () => {
  test.skip(({ browserName, isMobile }) => browserName !== "chromium" || isMobile);

  for (const { path } of routes) {
    test(`every img, canvas and video sits in a ProvenanceFigure: ${path}`, async ({ page }) => {
      await page.goto(path);
      const orphans = await page.$$eval("img, canvas, video", (els) =>
        els
          .filter((el) => !el.closest("figure[data-provenance]"))
          .map((el) => el.outerHTML.slice(0, 80)),
      );
      expect(orphans).toEqual([]);
      const ids = await page.$$eval("figure[data-provenance]", (fs) =>
        fs.map((f) => f.getAttribute("data-provenance")!),
      );
      for (const id of ids) expect(records[id], id).toBeTruthy();
    });
  }
});

test.describe("spec sheet", () => {
  test("opens with a click, matches the record, closes with Esc", async ({ page }) => {
    await page.goto("/en/capability/aerial-perspective/");
    const figure = page.locator('figure[data-provenance="MKN-AER-FLT01-B"]');
    const record = records["MKN-AER-FLT01-B"];
    await expect(figure.locator("img")).toHaveAttribute("alt", record.alt.en);
    await expect(figure.locator("figcaption")).toHaveText(record.caption.en);

    await figure.locator(".pfig__info").click();
    const sheet = figure.locator("[popover]");
    await expect(sheet).toBeVisible();
    await expect(sheet).toContainText("MKN-AER-FLT01-B");
    await expect(sheet).toContainText("Generated with AI");
    await expect(sheet).toContainText(record.light.label.en);
    await expect(sheet).toContainText("None · no permit");
    await expect(sheet).toContainText("Concept render · not yet through the gates");
    await expect(sheet).toContainText("Not yet embedded in the master file");
    // Internal generator details are never shown (decision 0010).
    await expect(sheet).not.toContainText(record.generator.jobId);
    await expect(sheet).not.toContainText(record.generator.service);

    await page.keyboard.press("Escape");
    await expect(sheet).toBeHidden();
  });

  test("works from the keyboard and returns focus", async ({ page, browserName }) => {
    test.skip(browserName === "webkit", "WebKit does not Tab to buttons by default");
    await page.goto("/en/studio/");
    const button = page.locator('figure[data-provenance="MKN-STU-CAM01-CONTROL"] .pfig__info');
    await button.focus();
    await page.keyboard.press("Enter");
    const sheet = page.locator('figure[data-provenance="MKN-STU-CAM01-CONTROL"] [popover]');
    await expect(sheet).toBeVisible();
    await sheet.locator(".pfig__close").click();
    await expect(sheet).toBeHidden();
  });

  test("is in Arabic on /ar/ and the image is not mirrored", async ({ page }) => {
    await page.goto("/ar/capability/aerial-perspective/");
    const figure = page.locator('figure[data-provenance="MKN-AER-FLT01-A"]');
    await expect(figure.locator("img")).toHaveAttribute("alt", records["MKN-AER-FLT01-A"].alt.ar);
    await figure.locator(".pfig__info").click();
    await expect(figure.locator("[popover]")).toContainText("مولّدة بالذكاء الاصطناعي");
    const transform = await figure
      .locator("img")
      .evaluate((img) => getComputedStyle(img).transform);
    expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(transform);
  });
});

test("corner brackets show when focus is inside the figure", async ({ page }) => {
  await page.goto("/en/studio/");
  const media = page.locator('figure[data-provenance="MKN-STU-CAM02-RUNBOOK"] .pfig__media');
  const corner = () => media.evaluate((el) => getComputedStyle(el, "::before").opacity);
  expect(await corner()).toBe("0");
  await media.locator(".pfig__info").focus();
  await expect.poll(corner).toBe("1");
});

test("at most one image per page is high priority", async ({ page }) => {
  for (const { path } of routes) {
    await page.goto(path);
    expect(await page.locator('img[fetchpriority="high"]').count(), path).toBeLessThanOrEqual(1);
  }
});

test("the home hero still is the eager, high-priority LCP image", async ({ page }) => {
  await page.goto("/en/");
  const hero = page.locator('figure[data-provenance="MKN-TWR-CAM01-DUSK"] img');
  await expect(hero).toHaveAttribute("fetchpriority", "high");
  await expect(hero).toHaveAttribute("loading", "eager");
  const others = await page.$$eval('img:not([fetchpriority="high"])', (imgs) =>
    imgs.map((i) => i.getAttribute("loading")),
  );
  for (const loading of others) expect(loading).toBe("lazy");
});
