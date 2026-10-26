# 0007 — Layout primitives, nav, and performance checks

**Date:** 26 October 2026 · **Phase:** 1 · **Status:** accepted

## Layout and nav

- `.wrap` (1280 px content + gutters), `.grid-12` (12 columns from 768 px, stacked below; spans mirror with `dir`), `.section` (64 px on phones, 112 px on desktop, hairline on top). Headings span 9 columns and body copy 7; components span all 12.
- A section without its own heading uses its mono label as the `h2`, so the outline never skips a level (Lighthouse flagged `heading-order` on `/method/`).
- Sticky 64 px header. Below 1024 px the four links sit behind a labelled **Menu** button; the wordmark, language switch and "Send a brief" stay in the bar. Without JS the links wrap under the bar instead. Esc closes the menu and returns focus to the button.
- **Deferred:** the header is solid everywhere. "Transparent over the hero" (UX doc) arrives with the hero film in Phase 3. The footer's keyboard-shortcut and after-hours toggles arrive with 13 in Phase 2.

## Performance checks

- `npm run budget` (`scripts/budget/check.mjs`) measures every built page exactly: gzip HTML + CSS ≤ 45 KB, JS ≤ 70 KB (85 KB on the aerial page), including scripts Astro inlines. Pages today are about 10 KB of HTML + CSS and about 1.3 KB of JS.
- Lighthouse CI (`lighthouserc.cjs`, `npm run lighthouse`): mobile emulation, median of 3 runs, on six pages in both locales. Asserts performance ≥ 0.9, accessibility = 1, best practices ≥ 0.9, CLS ≤ 0.1, TBT ≤ 200 ms, and LCP ≤ 2.5 s on `/en/`.
- **Arabic LCP is asserted at ≤ 2.8 s.**
  - Why: Lighthouse's simulated throttling treats text as painted only once its web font arrives. Arabic pages need 118.5 KB of fonts against about 45 KB for Latin, so lab LCP is about 2.25–2.55 s, against about 1.35 s in English.
  - Measured: dropping the Amiri preload made first paint worse in the lab (about 1.5 → 1.95 s) without improving LCP, so the preload stays.
  - The field target stays LCP ≤ 2.5 s at p75, checked with real-user data in Phase 5.
- Reports are kept as a CI artifact, not uploaded to public temporary storage.

## Not done: metric-matched Arabic fallback fonts

Before the Arabic faces load, the fallback is whichever Arabic system font the OS has (Segoe UI or Arial on Windows, Geeza Pro or SF Arabic on Apple, Noto Naskh or Noto Sans Arabic on Android). Their metrics differ, so one `size-adjust` / `ascent-override` set can't match them all. The measured language-switch CLS is about 0.005 against 0.1. Revisit only if field CLS on `/ar/` says otherwise.
