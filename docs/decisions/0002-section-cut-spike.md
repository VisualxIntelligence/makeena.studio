# 0002 — Spike (a): concept 11 section-cut page transition

**Date:** 25 October 2026 · **Phase:** 0 · **Status:** works in Chromium and WebKit (Playwright); **real-device Safari check pending (founder)**

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

## Still to verify (exit criterion)

On the preview URL, on a **real iPhone with Safari 18.2+** and in desktop Safari and Chrome: open `/en/spike/home/`, tap Method and Home a few times, then repeat on `/ar/spike/home/`. Expected: a copper line with "A" markers crossing left→right on English and right→left on Arabic, the new page revealed behind it, no flash or jump at the end.

## Decision requested

**[DECISION]** Firefox: accept plain navigation at launch (recommended; no extra code), or adopt Astro `<ClientRouter />` to animate it too (adds a client router and a second transition implementation).
