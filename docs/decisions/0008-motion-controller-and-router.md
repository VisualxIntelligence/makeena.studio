# 0008 — G1 motion controller and the ClientRouter lifecycle

**Date:** 26 October 2026 · **Phase:** 1 · **Status:** accepted

## What was built

- **Astro `<ClientRouter fallback="swap" />` on every page** (decision 0002, founder decision 0005 #1). The Phase 0 spike pages opt out (`router={false}`) so their native-transition measurements stay valid.
- **Navigations are instant until Phase 2.**
  - How: `view-transitions.css` silences every `::view-transition-*` animation while the router's `html[data-astro-transition]` attribute is present. Phase 2 moves 11 and 12 onto the router events.
  - Don't put `transition:animate` on `<html>`. It renames the root's `view-transition-name`, so `::view-transition-new(root)` disappears (this broke the spike transitions until it was removed).
- **Lifecycle (`src/lib/lifecycle.ts`):** `onPage(setup)` runs on `astro:page-load` with an `AbortSignal` that aborts on `astro:before-swap`. The router runs bundled scripts once per visit and replaces `<html>` attributes on every swap, so:
  - the nav menu and the footer motion control set up through `onPage`;
  - the inline head script re-applies `html.js` and the stored locale on `astro:after-swap`, and moves focus to `<main>` after a routed navigation.
- **G1 (`src/lib/motion/`, PRD §8.1):**
  - `motion.allowed`: OS reduced motion or the footer **Reduce motion** control (`localStorage` `mkn-motion`).
  - `registerEffect({ name, selector, setup })` runs each effect inside `gsap.matchMedia()` with desktop, mobile and reduced conditions. A preference change reverts and re-runs every effect with no reload.
  - Effects revert on `astro:before-swap` (no leaked ScrollTriggers; tested).
  - `ScrollTrigger.refresh()` runs after `document.fonts.ready`.
  - Also provided: `motion.idle()` (waits out view transitions, for 13), `motion.onVisibility()` (scrubbers pause), `motion.canLoadHeavyMedia` (motion allowed and no Save-Data).
- **First effect:** the base reveal (PRD §6.4), on page sections. Only blocks below the fold when it starts are hidden; the page header (LCP) never is.

## GSAP loads on the first interaction

Imported statically, GSAP + ScrollTrigger (≈ 44 KB gzip) on every page raised Lighthouse LCP from 1.35 to 1.82 s (English) and from 2.25 to 2.70 s (Arabic), and CLS rose to 0.018 because the Menu button appeared late.

Now:
- G1 dynamically imports GSAP on the visitor's first scroll, touch, pointer or key event. Effects change only content below the fold, so a visitor who never interacts never needs it. Content already on screen when an effect starts is not hidden.
- The Menu button is shown by CSS under `html.js` (set before first paint), not by un-hiding it from JS.

| Lighthouse (mobile, lab) | PR 4 (no router) | Router + G1 |
|---|---|---|
| Initial JS (gzip) | 1.3 KB | 9.7 KB |
| English LCP | 1.35 s | 1.50 s |
| Arabic LCP | 2.25 s | 2.55–2.70 s |
| CLS | ≤ 0.001 | ≤ 0.005 |

The remaining cost is the router itself and the per-component script requests. Phase 3 effects that must exist before the first scroll (03's pinned aerial) can call `registerEffect` from a page script that imports GSAP directly; budget: 85 KB on that page.
