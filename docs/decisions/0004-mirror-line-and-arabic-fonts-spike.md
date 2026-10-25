# 0004 — Spike (c): concept 12 mirror-line language switch with real Arabic fonts

**Date:** 25 October 2026 · **Phase:** 0 · **Status:** accepted. CLS exit criterion met; Android and desktop passed on the preview (founder); iOS Safari deferred to Phase 2

## What was built

- **Fonts** through Astro's Fonts API (Fontsource provider, downloaded at build time, self-hosted WOFF2, `font-display: swap`): Cormorant Garamond 400/500, Inter 400/500, JetBrains Mono 500 (Latin subsets) on every page; Amiri 400 and IBM Plex Sans Arabic 400/500 (Arabic subsets) on `/ar/` only. Preloads: Latin display + body 400 on `/en/`, Amiri 400 + Plex Arabic 400 on `/ar/`.
- **Stacks:** Arabic faces are chained in front of the Latin stack (`var(--font-ar-body), var(--font-body)`), so Arabic glyphs come from Plex/Amiri and Latin identifiers inside Arabic text keep Inter / Cormorant / JetBrains Mono. Arabic body is ~8% larger; Arabic display line-height 1.35; no letter-spacing or uppercase on Arabic labels.
- **12 Mirror-line:** the language link carries `data-lang-switch`; a click copies the current `#hash` onto it (section is preserved) and sets a one-shot `sessionStorage` flag. The incoming page's `pagereveal` handler detects the locale change (via `navigation.activation` where it exists, else the flag), sets `html[data-vt="lang"]` and adds the `lang` type. CSS then opens the page from the centre (`clip-path: inset(0 50%)` → `inset(0)`) while two lines (`cut-line`, `cut-line-b`) split outward with arrows pointing to the edges.
- Spike pages carry draft Arabic copy (`src/spikes/copy.ts`), visibly labelled **AR DRAFT · NOT REVIEWED**.

## Findings

1. **CLS is not a problem with this setup.** Layout Instability API (Chromium, Playwright), network throttled:

   | Scenario | Desktop | Pixel 7 |
   |---|---|---|
   | EN → AR, Home (Slow 4G) | 0.0002 | 0.0005 |
   | EN → AR, Method (Slow 4G) | 0.0007 | 0.0001 |
   | AR → EN, Home / Method | 0.0000 | 0.0000 |
   | Cold direct load of `/ar/` on Slow 3G (fonts ready ≈ 7 s) | 0.0002 | 0.0005 |

   Target ≤ 0.1. The reason it is so low: numeric line-heights fix every line box, images have explicit dimensions, and the swap only reflows text inside boxes that keep their size. Keep it that way: no `line-height: normal` on Arabic text, explicit media dimensions, and reserved space for anything font-dependent (e.g. nav wrapping).
2. **Astro's automatic fallbacks don't fit Arabic.** The Fonts API's "optimised fallback" for Amiri and Plex Arabic is computed from Latin metrics of Times New Roman / Arial, and Arial has no Arabic glyphs on iOS/macOS. They are switched off (`optimizedFallbacks: false`, no generic fallback) and the Arabic faces sit in front of the Latin stack instead. If real-device testing shows a visible jump on iOS, add a hand-tuned `@font-face` fallback (`local("Geeza Pro")`, `local("Segoe UI")`, `unicode-range` Arabic, measured `size-adjust`).
3. **Arabic font weight is over budget.** Amiri's Arabic subset is **108 KB**; Plex Arabic is 43 + 45 KB. With Latin faces, `/ar/` loads ~290 KB of fonts against the 120 KB critical-font budget (PRD §13). Phase 1 needs glyph-level subsetting (e.g. `pyftsubset` / `glyphhanger` over the real Arabic copy, keeping GSUB/GPOS shaping features) and possibly dropping Plex Arabic 500 (use 400 + colour for emphasis).
4. **`navigation.activation` is not in Safari 18** (it arrives in Safari 26.2), so a pure "compare old and new URL" approach fails there. The click flag is the fallback; back/forward across locales on old Safari therefore gets the section-cut instead of the mirror-line, which is acceptable.
5. **A data attribute, not `:active-view-transition-type()`,** drives the CSS, so the mirror-line works wherever `pagereveal` exists. The `lang`/`nav` type is still added for tooling. Verified in Chromium and WebKit (desktop and mobile emulation): `vt-reveal-centre`, `vt-split-left`, `vt-split-right` run on EN → AR, and the `#gate-03` hash survives the switch.

## Real-device results

- **Android (founder's phone) and desktop:** the mirror-line runs, Arabic renders in Amiri and Plex Sans Arabic, no visible jump. Passed.
- **iOS Safari: not tested (no iPhone available). Deferred to Phase 2** by founder decision. iOS is where a font-swap jump is most likely (no Arial Arabic glyphs; system fallback is Geeza Pro / SF Arabic), so the Phase 2 check should include a cold load of `/ar/` and the EN → AR switch.

## Impact of the ClientRouter decision (0002)

Phase 2 moves page transitions to Astro's `<ClientRouter />`. The mirror-line CSS and `html[data-vt="lang"]` approach carry over, but locale detection moves from `pagereveal` + `sessionStorage` to the router's `astro:before-preparation` event, which knows both the current and the target URL in every browser (no Safari 18 gap). Fonts: the router swaps `<head>`, so the Arabic `@font-face` blocks must be present (or added) when navigating EN → AR without a full load; re-measure CLS on the switch under the router.
