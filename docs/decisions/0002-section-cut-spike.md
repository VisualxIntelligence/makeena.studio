# 0002 — Spike (a): concept 11 section-cut page transition

**Date:** 25 October 2026 · **Phase:** 0 · **Status:** accepted. Android and desktop passed on the preview (founder); iOS Safari deferred to Phase 2. **Founder decision: adopt Astro `<ClientRouter />`** (see below)

## What was built

- `src/styles/view-transitions.css`: `@view-transition { navigation: auto }`, off under reduced motion. The incoming page (`::view-transition-new(root)`) is revealed with an animated `clip-path: inset()`; the outgoing page stays static underneath (no crossfade, `mix-blend-mode: normal`). 550 ms desktop, 350 ms under 768 px, `cubic-bezier(0.65, 0, 0.35, 1)`.
- `src/components/global/CutLine.astro`: an invisible anchor element with `view-transition-name: cut-line`, in every page via `BaseLayout`.
- Spike pages `/{lang}/spike/home/` ⇄ `/{lang}/spike/method/` (and `/spike/aerial/`), with a stand-in nav.
- After an internal navigation, focus moves to `<main>` (inline head script).
- `tests/spikes/transitions.spec.ts` records the animations running on the incoming page.

## Findings

1. **Direction needs no JS.** The `::view-transition` pseudo-tree hangs off the *new* document's `<html>`, so `html[dir="rtl"]::view-transition-new(root)` picks the sweep direction. The PRD's plan (read `dir` in `pagereveal`, add a type) works but is unnecessary for 11. Types are kept for 12 (language switch), where the old and new documents must be compared.
2. **WebKit does not paint off-viewport elements into transition snapshots.** The first version drew the line and markers inside an element parked just outside the viewport. Chromium captured it; WebKit created the group but its image was empty, so the line was missing in Safari. **Fix:** the element is only an anchor that creates the `cut-line` group. The line and the A–A markers are drawn on `::view-transition-group(cut-line)` itself as SVG backgrounds, and the anchor's snapshots are hidden. This also means nothing can flash on the live page before or after a transition.
3. **Verified (Playwright, Windows):** Chromium desktop + Pixel 7, WebKit desktop + iPhone 15. `/en/` sweeps left to right (`vt-reveal-ltr`, `vt-line-ltr`), `/ar/` right to left, the arrow points in the sweep direction and the "A" never mirrors. Reduced motion: no transition (`pagereveal` has no `viewTransition`). Focus lands on `<main>`.
4. **Light first paint.** The Method page is text only, so the reveal looks right even before images arrive (Safari has no render-blocking for cross-document transitions). The Home hero image arrives within the reveal on a fast connection; on slow connections the hero box shows ivory behind the line, which reads acceptably. Real pages should keep explicit image dimensions so the revealed layout doesn't jump.
5. Firefox stable has no cross-document view transitions: plain navigation, as the PRD accepts. Not tested here (no Firefox in the local Playwright install).

## Real-device results

- **Android (founder's phone) and desktop:** the sweep runs in the correct direction for each locale. Passed.
- **iOS Safari: not tested (no iPhone available). Deferred to Phase 2** by founder decision; re-test on a real iPhone (borrowed, or a BrowserStack/LambdaTest device) before the Phase 2 transitions are merged. Evidence so far: Playwright WebKit desktop and iPhone 15 emulation.

## Decision: Astro `<ClientRouter />` (founder, 25 October 2026)

Firefox should animate too, so Phase 2 adopts Astro's `<ClientRouter />` instead of native cross-document transitions. What that means:

- The router handles navigation in **every** browser and runs **same-document** view transitions (`document.startViewTransition`), which Firefox supports since 144, Safari since 18 and Chrome since 111. It replaces `@view-transition { navigation: auto }`: one implementation, not two.
- Carries over: the `::view-transition-*` CSS (reveal, cut line, markers), the `html[dir]` direction selectors and the WebKit lesson (draw the line on the group, not in an off-screen element). Re-verify all three under the router.
- Changes: `pagereveal`/`pageswap` are not used for routed navigations; the 11/12 type logic moves to Astro's `astro:before-preparation` / `astro:before-swap` events. Page scripts run once, so every effect initialises on `astro:page-load` and tears down on `astro:before-swap` (GSAP ScrollTriggers, the 03 player, observers). The G1 motion controller (PRD §8.1) owns that lifecycle. Reduced motion must still navigate instantly.
- Gains: the router fetches the next page before the transition starts, so Safari no longer reveals an unpainted page. Costs: a few KB of router JS on every page (within the §13 budget; measure in Phase 2) and the script-lifecycle discipline above.
- Browsers without view transitions fall back to the router's `fallback` behaviour (`animate` by default). Decide `animate` vs `swap` in Phase 2.
