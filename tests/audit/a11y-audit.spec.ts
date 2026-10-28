// Phase 5 accessibility audit (PRD §3.3, §14). Collects findings instead of failing, so one run
// reports everything: `npx playwright test tests/audit --project=chromium` after `npm run build`.
// Findings go to test-results/a11y-audit/<page>.json; tests/audit/summarise.mjs prints them.
import AxeBuilder from "@axe-core/playwright";
import { test, type Page } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";
import { routes } from "../e2e/routes";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];
const OUT = "test-results/a11y-audit";

type Finding = { check: string; detail: string };

async function axe(page: Page, state: string, findings: Finding[]) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  for (const v of violations) {
    findings.push({
      check: `axe:${state}`,
      detail: `${v.id} (${v.impact}): ${v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(" "))
        .join(" | ")}`,
    });
  }
}

/** Scroll through the page so reveal effects and lazy content settle, then back to the top. */
async function scrollThrough(page: Page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight / 2) {
      scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    scrollTo(0, 0);
  });
  await page.waitForTimeout(300);
}

async function overflow(page: Page, label: string, findings: Finding[]) {
  const wide = await page.evaluate(() => {
    const doc = document.documentElement;
    if (doc.scrollWidth <= doc.clientWidth + 1) return [];
    return [...document.querySelectorAll<HTMLElement>("body *")]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && (r.right > doc.clientWidth + 1 || r.left < -1);
      })
      .filter((el) => !el.closest("[aria-hidden='true']"))
      .slice(0, 5)
      .map(
        (el) =>
          `${el.tagName.toLowerCase()}.${[...el.classList].join(".")} (${Math.round(el.getBoundingClientRect().right)}px)`,
      );
  });
  if (wide.length)
    findings.push({
      check: `reflow:${label}`,
      detail: `page scrolls sideways: ${wide.join(", ")}`,
    });
}

for (const { path } of routes) {
  test(`audit ${path}`, async ({ page, browser }) => {
    test.setTimeout(120_000);
    const findings: Finding[] = [];

    // 1. axe after the page has fully settled (reveals done), not only on first paint.
    await page.goto(path);
    await scrollThrough(page);
    await axe(page, "settled", findings);

    // 2. Structure: one h1, no skipped heading levels, landmarks, alt text says "generated".
    const structure = await page.evaluate(() => {
      const out: string[] = [];
      const hs = [...document.querySelectorAll("h1,h2,h3,h4,h5,h6")].filter(
        (h) => (h as HTMLElement).offsetParent !== null,
      );
      const h1s = hs.filter((h) => h.tagName === "H1").length;
      if (h1s !== 1) out.push(`headings: ${h1s} visible h1`);
      let prev = 0;
      for (const h of hs) {
        const level = Number(h.tagName[1]);
        if (prev && level > prev + 1)
          out.push(`headings: h${prev} → h${level} at "${h.textContent?.trim().slice(0, 40)}"`);
        prev = level;
      }
      for (const sel of ["header", "nav", "main", "footer"]) {
        if (!document.querySelector(sel)) out.push(`landmarks: no <${sel}>`);
      }
      const navs = [...document.querySelectorAll("nav")];
      if (navs.length > 1) {
        for (const n of navs) {
          if (!n.getAttribute("aria-label") && !n.getAttribute("aria-labelledby"))
            out.push("landmarks: unlabelled <nav> among several");
        }
      }
      const generated =
        document.documentElement.lang === "ar" ? /مولد|مولّد|توليد|مُولَّد/ : /generated/i;
      for (const img of document.querySelectorAll("img")) {
        const alt = img.getAttribute("alt");
        if (alt === null) out.push(`alt: missing on ${img.currentSrc || img.src}`);
        else if (alt && !generated.test(alt))
          out.push(`alt: doesn't say generated: "${alt.slice(0, 60)}"`);
      }
      return out;
    });
    for (const s of structure)
      findings.push({ check: s.split(":")[0], detail: s.slice(s.indexOf(":") + 2) });

    // 3. Target size: PRD 44 × 44; WCAG 2.5.8 floor 24 × 24 (inline links in text are exempt).
    const targets = await page.evaluate(() => {
      const sel =
        "a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button], [tabindex]:not([tabindex='-1'])";
      return [...document.querySelectorAll<HTMLElement>(sel)]
        .filter((el) => el.offsetParent !== null || getComputedStyle(el).position === "fixed")
        .map((el) => {
          // A radio/checkbox's target includes its label.
          const box = (el.closest("label") ?? el).getBoundingClientRect();
          const inline =
            el.tagName === "A" &&
            !!el.closest("p, li, dd, td") &&
            getComputedStyle(el).display === "inline";
          const name = (
            el.getAttribute("aria-label") ||
            el.textContent ||
            el.getAttribute("name") ||
            el.tagName
          )
            .trim()
            .replace(/\s+/g, " ")
            .slice(0, 30);
          return {
            name,
            w: Math.round(box.width),
            h: Math.round(box.height),
            inline,
            skip: el.classList.contains("skip-link"),
          };
        })
        .filter((t) => !t.skip && t.w > 0 && (t.w < 44 || t.h < 44));
    });
    for (const t of targets) {
      const level = t.w < 24 || t.h < 24 ? (t.inline ? "inline<24 (exempt)" : "WCAG<24") : "PRD<44";
      findings.push({ check: `target:${level}`, detail: `"${t.name}" ${t.w}×${t.h}` });
    }

    // 4. Keyboard: visible focus ring, not hidden by the sticky nav, order follows layout.
    // Forward with Tab, then back with Shift+Tab (which scrolls stops to the top, under the header).
    await page.goto(path);
    await page.evaluate(() => scrollTo(0, 0));
    const stops: { name: string; x: number; y: number }[] = [];
    let first = "";
    const probe = () =>
      page.evaluate(async () => {
        // Let scroll-linked effects (03's pin) catch up with the focus scroll before measuring.
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        let el = document.activeElement as HTMLElement | null;
        if (!el || el === document.body) return null;
        // A visually hidden radio shows its focus on the label around it (07's month stops).
        if (el.getBoundingClientRect().width <= 1 && el.closest("label")) el = el.closest("label")!;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        const name = (
          el.getAttribute("aria-label") ||
          el.textContent ||
          el.getAttribute("name") ||
          el.tagName
        )
          .trim()
          .replace(/\s+/g, " ")
          .slice(0, 30);
        const id = `${el.tagName}|${name}|${Math.round(r.top + scrollY)}`;
        const ring = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) >= 2;
        const cx = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1);
        const cy = Math.min(Math.max(r.top + Math.min(r.height / 2, 10), 0), innerHeight - 1);
        const hit = document.elementFromPoint(cx, cy);
        const covered =
          r.height > 0 && !!hit && hit !== el && !el.contains(hit) && !hit.contains(el);
        return {
          id,
          name,
          ring,
          // Turnstile's widget is a closed shadow root around Cloudflare's iframe: the page only
          // sees the host <div>, and the focus styles live inside the iframe.
          turnstile: !!el.closest("[data-turnstile]"),
          // On the night contact block the ring is copper-light: copper-deep is under 3:1 there.
          night: !!el.closest(".contact"),
          colour: cs.outlineColor,
          html: el.outerHTML.slice(0, 120),
          covered: covered ? `${hit!.tagName.toLowerCase()}.${[...hit!.classList].join(".")}` : "",
          size: r.width * r.height,
          x: Math.round(r.left + scrollX),
          y: Math.round(r.top + scrollY),
        };
      });
    for (let i = 0; i < 120; i++) {
      await page.keyboard.press("Tab");
      const info = await probe();
      if (!info) continue;
      if (info.id === first) break;
      if (!first) first = info.id;
      const expected = info.night ? /200, 162, 122/ : /154, 82, 44/;
      if (info.turnstile)
        findings.push({ check: "info", detail: "a Turnstile stop (third-party focus styles)" });
      else if (!info.size)
        findings.push({ check: "focus:invisible", detail: `"${info.name}" has no size` });
      else if (!info.ring)
        findings.push({ check: "focus:no-ring", detail: `"${info.name}" ${info.html}` });
      else if (!expected.test(info.colour))
        findings.push({ check: "focus:colour", detail: `"${info.name}" ${info.colour}` });
      if (info.covered)
        findings.push({ check: "focus:obscured", detail: `"${info.name}" under ${info.covered}` });
      stops.push({ name: info.name, x: info.x, y: info.y });
    }
    for (let i = 0; i < stops.length; i++) {
      await page.keyboard.press("Shift+Tab");
      const info = await probe();
      if (info?.covered)
        findings.push({
          check: "focus:obscured(back)",
          detail: `"${info.name}" under ${info.covered}`,
        });
    }
    // Order: flag big jumps back up the page (more than half a screen).
    for (let i = 1; i < stops.length; i++) {
      if (stops[i].y < stops[i - 1].y - 400) {
        findings.push({
          check: "focus:order",
          detail: `"${stops[i - 1].name}" (y ${stops[i - 1].y}) → "${stops[i].name}" (y ${stops[i].y})`,
        });
      }
    }
    findings.push({ check: "info", detail: `${stops.length} tab stops` });

    // 5. Other states: night mode, reduced motion, phone with the menu open.
    await page.evaluate(() => localStorage.setItem("mkn-hours", "night"));
    await page.goto(path);
    await scrollThrough(page);
    await axe(page, "night", findings);
    await page.evaluate(() => localStorage.removeItem("mkn-hours"));

    const phone = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const p = await phone.newPage();
    await p.goto(path);
    await axe(p, "phone", findings);
    const menu = p.locator("[aria-controls][aria-expanded]").first();
    if (await menu.isVisible()) {
      await menu.click();
      await p.waitForTimeout(400);
      await axe(p, "phone-menu-open", findings);
    }
    await phone.close();

    // 6. Reflow (1.4.10): 320 px wide, and 200% zoom of a 1280 px window (640 px).
    for (const width of [320, 640]) {
      const ctx = await browser.newContext({
        viewport: { width, height: 800 },
        reducedMotion: "reduce",
      });
      const q = await ctx.newPage();
      await q.goto(path);
      await scrollThrough(q);
      await overflow(q, `${width}px`, findings);
      // Text spacing (1.4.12) on the 640 px layout.
      if (width === 640) {
        await q.addStyleTag({
          content:
            "* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; } p { margin-block-end: 2em !important; }",
        });
        await q.waitForTimeout(200);
        await overflow(q, "text-spacing", findings);
        const clipped = await q.evaluate(() =>
          [...document.querySelectorAll<HTMLElement>("body *")]
            .filter((el) => {
              const cs = getComputedStyle(el);
              // Screen-reader-only text and the brief form's honeypot are clipped on purpose.
              if (el.closest(".visually-hidden, .brief__trap")) return false;
              return (
                (cs.overflow === "hidden" || cs.overflowY === "hidden") &&
                el.scrollHeight > el.clientHeight + 2 &&
                el.clientHeight > 0 &&
                (el.textContent ?? "").trim().length > 0
              );
            })
            .slice(0, 5)
            .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join(".")}`),
        );
        if (clipped.length)
          findings.push({ check: "text-spacing:clipped", detail: clipped.join(", ") });
      }
      await ctx.close();
    }

    mkdirSync(OUT, { recursive: true });
    writeFileSync(
      `${OUT}/${path.replaceAll("/", "_") || "root"}.json`,
      JSON.stringify({ path, findings }, null, 2),
    );
  });
}
