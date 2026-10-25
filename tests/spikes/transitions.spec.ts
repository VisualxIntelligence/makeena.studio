// Spike (a) concept 11: assert that a cross-document view transition runs with the
// expected sweep for each locale. Records animations on the incoming page.
import { expect, test } from "@playwright/test";

const recordReveal = () => {
  addEventListener("pagereveal", (e: Event) => {
    const vt = (e as Event & { viewTransition?: ViewTransition }).viewTransition;
    const w = window as Window & { __vt?: unknown };
    if (!vt) {
      w.__vt = { ran: false };
      return;
    }
    vt.ready.then(() => {
      w.__vt = {
        ran: true,
        types: [...(vt as ViewTransition & { types?: Set<string> }).types ?? []],
        animations: document
          .getAnimations()
          .map((a) => `${(a.effect as KeyframeEffect).pseudoElement}:${(a as CSSAnimation).animationName}`)
          .sort(),
      };
    });
  });
};

for (const [lang, dir] of [["en", "ltr"], ["ar", "rtl"]] as const) {
  test(`${lang}: Home → Method sweeps ${dir}`, async ({ page, browserName }) => {
    await page.addInitScript(recordReveal);
    await page.goto(`/${lang}/spike/home/`);
    await page.locator(`nav a[href="/${lang}/spike/method/"]`).click();
    await page.waitForURL(`**/${lang}/spike/method/`);
    const vt = await page.waitForFunction(() => (window as Window & { __vt?: unknown }).__vt).then((h) => h.jsonValue());
    console.log(`[${browserName} ${lang}]`, JSON.stringify(vt));
    expect(vt).toMatchObject({ ran: true });
    const names = (vt as { animations: string[] }).animations.join(" ");
    expect(names).toContain(`::view-transition-new(root):vt-reveal-${dir}`);
    expect(names).toContain(`::view-transition-group(cut-line):vt-line-${dir}`);
    await expect(page.locator("h1")).toHaveText(lang === "en" ? "Four gates." : "أربع بوابات.");
    await expect(page.locator("main")).toBeFocused();
  });
}

test("reduced motion navigates without a transition", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.addInitScript(recordReveal);
  await page.goto("/en/spike/home/");
  await page.getByRole("link", { name: "Method" }).click();
  await page.waitForURL("**/en/spike/method/");
  const vt = await page.waitForFunction(() => (window as Window & { __vt?: unknown }).__vt).then((h) => h.jsonValue());
  expect(vt).toEqual({ ran: false });
  await context.close();
});

for (const from of ["en", "ar"] as const) {
  const to = from === "en" ? "ar" : "en";
  test(`${from} → ${to}: language switch uses the mirror-line and keeps the section`, async ({ page, browserName }) => {
    await page.addInitScript(recordReveal);
    await page.goto(`/${from}/spike/method/#gate-03`);
    await page.locator("a[data-lang-switch]").click();
    await page.waitForURL(`**/${to}/spike/method/#gate-03`);
    const vt = await page.waitForFunction(() => (window as Window & { __vt?: unknown }).__vt).then((h) => h.jsonValue());
    console.log(`[${browserName} ${from}→${to}]`, JSON.stringify(vt));
    const names = (vt as { animations: string[] }).animations.join(" ");
    expect(names).toContain("::view-transition-new(root):vt-reveal-centre");
    expect(names).toContain("::view-transition-group(cut-line):vt-split-left");
    expect(names).toContain("::view-transition-group(cut-line-b):vt-split-right");
    await expect(page.locator("html")).toHaveAttribute("lang", to);
  });
}
