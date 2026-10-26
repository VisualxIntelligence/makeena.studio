# 0011 — 11 section-cut and 12 mirror-line on the ClientRouter

**Date:** 26 October 2026 · **Phase:** 2 · **Status:** accepted; real-iPhone check passed on 26 Oct 2026 (`docs/qa/ios-safari-checklist.md`)

## How it works

- `src/lib/transitions/` picks the type for each routed navigation (`type.ts`, pure and unit-tested):
  - `lang` when the locale changes (the language switch → 12)
  - `nav` otherwise (→ 11)
  - `none` under OS reduced motion or the footer **Reduce motion** control
- `astro:before-preparation` compares the source and target paths.
- `astro:before-swap` writes `data-vt` onto the **incoming** document's `<html>`, because the router replaces root attributes on swap. It also adds the view-transition type where supported, and clears the flag when the transition finishes.
- For `none` it calls `viewTransition.skipTransition()`: the router itself always starts a view transition and ignores reduced motion. CSS backs this up with `html[data-vt="none"]` and `@media (prefers-reduced-motion: reduce)`, which set every `::view-transition-*` animation to none.
- **The animations are the Phase 0 CSS, unchanged:**
  - 11's reveal and line sweep left-to-right on `ltr` pages and right-to-left on `rtl` pages, keyed on the new page's `html[dir]`.
  - 12 opens from the centre and splits the line to both edges.
  - The line is still drawn on `::view-transition-group(cut-line)`, so WebKit, which doesn't snapshot off-viewport elements, renders it (checked with mid-transition captures in Chromium and WebKit).
- The Phase 1 rule that silenced routed transitions is gone.
- The `@view-transition { navigation: auto }` rule stays for the Phase 0 spike pages only; the spike measurements still pass.

## Verified

- Playwright, in Chromium, WebKit, both phone projects, **Firefox 157** (new project, transitions only) and the reduced-motion project:
  - sweep direction per locale
  - the split and `#section` kept on the language switch
  - the flag cleared afterwards
  - no transition under OS reduced motion or the footer control
  - focus on `<main>`
- Language-switch CLS 0.0000 (Chromium).

## Known issue: Playwright's Windows WebKit crashes

In Playwright's WebKit build for Windows (WinCairo, not Apple's Safari), the page **crashes** about a second after a routed view transition that starts from a **scrolled page at phone width**. Bisected on 26 Oct:

- Chromium never crashes, and neither does WebKit at desktop width or at the top of the page.
- WebKit doesn't crash under reduced motion (no transition), or with a JS `.click()` that doesn't scroll.
- It still crashes with every part of our transition CSS disabled (no cut line, no animations, no sticky header, no clip-path).

So it's in WebKit's same-document view transition (or the router's scroll-to-top inside it), not our CSS, and it predates this PR: routed navigations have used view transitions since #12, with animations silenced. A regression test runs on Linux WebKit in CI and is skipped only on Windows WebKit. The real-iPhone checklist has the same step.

## Real iOS Safari

Passed on 26 October 2026: the founder ran the full checklist on a real iPhone. That covers the sweep in both directions, the mirror-line split with the section kept, reduced motion, Safari's swipe-back, the info sheet, and the scrolled-page footer tap. The Windows-WebKit crash doesn't happen on real Safari.
