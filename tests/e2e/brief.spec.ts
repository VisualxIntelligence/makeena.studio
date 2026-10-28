import { expect, test, type Page, type Route } from "@playwright/test";

// 14 brief form (PRD §9.6, decision 0019). The static preview has no Worker, so these tests stub
// Turnstile's script and answer /api/brief themselves; worker/brief.ts has its own unit tests.
const path = (lang: "en" | "ar", hash = "") => `/${lang}/studio/${hash}`;
const TURNSTILE_STUB = `window.turnstile = {
  render(el, o) { setTimeout(() => o.callback("XXXX.DUMMY.TOKEN.XXXX"), 10); return "w1"; },
  reset() { window.__turnstileResets = (window.__turnstileResets || 0) + 1; },
  remove() {},
};`;

async function stubTurnstile(page: Page): Promise<() => number> {
  let loads = 0;
  await page.route("https://challenges.cloudflare.com/**", (route) => {
    loads++;
    return route.fulfill({ contentType: "text/javascript", body: TURNSTILE_STUB });
  });
  return () => loads;
}

/** Answers /api/brief and records what the form posted. */
async function api(page: Page, status: number, body: unknown) {
  const posted: string[] = [];
  await page.route("**/api/brief", (route: Route) => {
    posted.push(route.request().postData() ?? "");
    return route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
  });
  return posted;
}

async function fill(page: Page) {
  await page.fill("#brief-name", "Mariam Al-Kuwari");
  await page.fill("#brief-company", "Lusail Developments");
  await page.fill("#brief-email", "mariam@example.com");
  await page.fill("#brief-message", "A tower launch in Q2.");
}

test.beforeEach(async ({ page }) => {
  await stubTurnstile(page);
});

test("labelled fields; a link from /engagement/ preselects the engagement", async ({ page }) => {
  await page.goto(path("en", "#brief-fixed"));
  for (const label of ["Name", "Company (optional)", "Email", "Message"]) {
    await expect(page.getByLabel(label, { exact: true })).toBeVisible();
  }
  await expect(page.getByRole("radio", { name: "Fixed" })).toBeChecked();
  await expect(page.locator("#brief-email")).toHaveAttribute("dir", "ltr");
  await page.goto(path("en", "#brief-retained"));
  await expect(page.getByRole("radio", { name: "Retained" })).toBeChecked();
});

test("Turnstile loads only when the form comes near", async ({ page }) => {
  await page.unrouteAll();
  const loads = await stubTurnstile(page);
  await page.setViewportSize({ width: 1280, height: 700 });
  await page.goto(path("en"), { waitUntil: "load" });
  await page.waitForTimeout(500);
  expect(loads()).toBe(0);
  await page.locator("[data-brief-form]").scrollIntoViewIfNeeded();
  await expect.poll(loads).toBe(1);
});

test("an empty brief: inline errors, linked and announced; focus on the first", async ({
  page,
}) => {
  await page.goto(path("en"));
  await page.locator("[data-brief-form]").scrollIntoViewIfNeeded();
  await page.locator("[data-submit]").click();
  const name = page.locator("#brief-name");
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#brief-name-error")).toHaveText("Please fill this in.");
  await expect(name).toHaveAttribute("aria-describedby", "brief-name-error");
  await expect(page.locator("[data-brief-live]")).toHaveText(
    "Please check the highlighted fields.",
  );
  await page.fill("#brief-email", "not-an-email");
  await page.locator("[data-submit]").click();
  await expect(page.locator("#brief-email-error")).toContainText("name@company.com");
  // Correcting a field clears its error straight away.
  await name.fill("Mariam");
  await expect(page.locator("#brief-name-error")).toBeHidden();
  await expect(name).not.toHaveAttribute("aria-invalid");
});

test("a sent brief: the form gives way to a confirmation, announced", async ({ page }) => {
  const posted = await api(page, 200, { ok: true, id: "abcdef12-3456-7890-abcd-ef1234567890" });
  await page.goto(path("en", "#brief-retained"));
  await page.locator("[data-brief-form]").scrollIntoViewIfNeeded();
  await expect(page.locator("[data-tally-text]")).toHaveText("ON AIR");
  await fill(page);
  await page.locator("[data-submit]").click();

  const done = page.locator("[data-brief-done]");
  await expect(done).toBeVisible();
  await expect(done).toBeFocused();
  await expect(page.locator("[data-done-ref]")).toHaveText("BRIEF RECEIVED · REF ABCDEF12");
  await expect(page.locator("[data-brief-live]")).toHaveText("BRIEF RECEIVED · REF ABCDEF12");
  await expect(page.locator("[data-brief-form]")).toBeHidden();
  await expect(page.locator("[data-tally-text]")).toHaveText("OFF AIR");

  expect(posted).toHaveLength(1);
  for (const part of [
    "Mariam Al-Kuwari",
    "mariam@example.com",
    "retained",
    "XXXX.DUMMY.TOKEN.XXXX",
    'name="lang"',
  ]) {
    expect(posted[0]).toContain(part);
  }
});

test("a rejected check resets Turnstile and asks to send again", async ({ page }) => {
  await api(page, 403, { ok: false, errors: { turnstile: "invalid" } });
  await page.goto(path("en"));
  await page.locator("[data-brief-form]").scrollIntoViewIfNeeded();
  await fill(page);
  await page.locator("[data-submit]").click();
  await expect(page.locator("#brief-turnstile-error")).toHaveText(
    "The check expired. Please send again.",
  );
  expect(
    await page.evaluate(
      () => (window as Window & { __turnstileResets?: number }).__turnstileResets,
    ),
  ).toBe(1);
  await expect(page.locator("[data-submit]")).toBeEnabled();
});

test("when sending fails, the direct email is offered", async ({ page }) => {
  await api(page, 503, { ok: false, error: "unavailable" });
  await page.goto(path("en"));
  await page.locator("[data-brief-form]").scrollIntoViewIfNeeded();
  await fill(page);
  await page.locator("[data-submit]").click();
  await expect(page.locator("[data-form-error]")).toContainText("ahmed@makeena.studio");
  await expect(page.locator("[data-submit]")).toBeEnabled();
  await expect(page.locator("[data-brief-form]")).toBeVisible();
});

test("the tally: ON AIR on screen or with focus, OFF AIR away; no pulse without motion", async ({
  page,
}) => {
  await page.goto(path("en"));
  await expect(page.locator("[data-tally-text]")).toHaveText("OFF AIR");
  await page.locator("[data-brief-form]").scrollIntoViewIfNeeded();
  await expect(page.locator("[data-tally]")).toHaveAttribute("data-on", "");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator("#brief-name").focus();
  await expect(page.locator("[data-tally]")).not.toHaveAttribute("data-pulse");
  await page.locator("#brief-name").blur();
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator("[data-tally-text]")).toHaveText("OFF AIR");
});

test("Arabic: labels, messages and the tally in Arabic; email stays LTR", async ({ page }) => {
  await page.goto(path("ar"));
  await page.locator("[data-brief-form]").scrollIntoViewIfNeeded();
  await expect(page.locator("[data-tally-text]")).toHaveText("على الهواء");
  await expect(page.getByRole("radio", { name: "مستمر" })).toBeVisible();
  await page.locator("[data-submit]").click();
  await expect(page.locator("#brief-name-error")).toHaveText("يرجى تعبئة هذا الحقل.");
  await expect(page.locator("#brief-email")).toHaveCSS("direction", "ltr");
});

test("without JS: no form, the direct email instead", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(path("en"));
  await expect(page.locator("[data-brief-form]")).toBeHidden();
  await expect(page.locator(".brief__nojs")).toBeVisible();
  await expect(page.locator('.brief__nojs a[href="mailto:ahmed@makeena.studio"]')).toBeVisible();
  await context.close();
});
