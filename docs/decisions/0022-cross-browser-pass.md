# 0022 — Cross-browser pass (Phase 5, step 3)

**Date:** 28 October 2026 · **Phase:** 5 · **Status:** proposed (founder review)

PRD §17, Phase 5: cross-browser, including Firefox fallbacks, against the §3.3 targets.

## Coverage

- **Firefox:** CI ran only the transition tests in Firefox (decision 0002). The whole e2e suite was run in Firefox at desktop and phone widths: 354 of 354 passed. The CI `firefox` project now runs every spec (177 tests, about 2 extra minutes).
- **Every browser:** every e2e spec now runs in Chromium, WebKit, Firefox, two phone profiles (Pixel 7, iPhone 15) and reduced motion.
- **Accessibility audit (decision 0021) in Firefox:** no new issues.
  - axe reported the night contact block's phone and email links as #000000 on #141414 at 390 px. In fact they render ivory (computed `rgb(246, 242, 234)` before and after rendering; screenshot checked). Axe in Firefox can't resolve colours inside a block `content-visibility: auto` is still skipping. Chromium's axe has no such problem.
  - One 2.51:1 reading on the "Send a brief" button appeared only with animations on, which fits axe catching its hover colour transition mid-animation.

## Found and fixed

| Finding | Where | Fix |
|---|---|---|
| **WebKit doesn't scroll to some focused elements.** After #27 merged, `main`'s CI (Linux WebKit) failed: Shift+Tab left the brief form's fields at y ≈ −40, behind the 64 px header. A trace showed WebKit doesn't scroll at all; `scroll-padding` can't help. The same behaviour left Tab focus on the ⓘ buttons below the viewport (decision 0021) | WebKit (Safari) | `src/lib/focus.ts`: one frame after a keyboard focus (`:focus-visible`, `tabIndex ≥ 0`, not in the header or a popover), scroll by whatever is still behind the header or below the screen. Does nothing where the browser got it right (Chromium, Firefox) |
| **The Turnstile widget pushed the page down 74 px when it loaded** (its holder was collapsed while empty). It loads when the form nears the viewport or gets focus, so a keyboard user coming back up from the footer saw the focused link pushed off-screen. No CLS was recorded for an ordinary scroll (the shifted content was still off-screen) | All | The holder reserves 74 px (`min-block-size`), the widget's rendered height, so nothing moves |

`tests/e2e/a11y-layout.spec.ts` now checks Tab and Shift+Tab through `/en/studio/`: one frame after each key press, the focused element must be clear of the header and at least half on screen. Fixed-header checks stay strict.

## Not issues

- At the very bottom of `/studio/`, after Shift+Tab the last footer link can sit a few pixels past the bottom edge (ring visible). The cause is scroll anchoring when content above re-measures.

## Still needs a person

- **macOS Safari with real keyboard navigation** (Safari › Settings › Advanced › "Press Tab to highlight each item on a webpage"): on `/en/studio/` Tab through the figure grid's ⓘ buttons and the brief form, then Shift+Tab back. Each focused item should stay on screen and clear of the header.
- **Field Core Web Vitals** (§3.3: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 at p75, both locales) need real traffic. Cloudflare Web Analytics (decision 0020) collects them; read them once the site has visitors. Lab numbers are in CI's Lighthouse run.
- Screen readers: `docs/qa/screen-reader-checklist.md` (decision 0021).
