# 0006 — Arabic font subsets

**Date:** 26 October 2026 · **Phase:** 1 · **Status:** accepted

## Context

Decision 0004 found `/ar/` loading about 290 KB of fonts. The critical (preloaded) pair, Amiri 400 and IBM Plex Sans Arabic 400, came to about 148 KB against the 120 KB budget (PRD §13). Two causes:

- Fontsource's "arabic" files carry the whole Arabic block, presentation forms, extended Arabic and Arabic math letters (Amiri: 5,429 glyphs).
- They carry no ASCII punctuation or digits, so every full stop in Arabic text pulled in a Latin face (Cormorant Garamond, 22 KB).

## Decision

- `scripts/fonts/subset_arabic.py` (fonttools, run locally with `npm run fonts:arabic`; output committed) builds the Arabic faces from upstream TTFs pinned to a google/fonts commit and checked by SHA-256:
  - **Characters:** Modern Standard Arabic letters, Arabic punctuation, tatweel, پ چ ڤ گ for transliterated names, joiners and direction marks, ASCII punctuation, `·`, `« »`, and Western digits.
  - **Vowel marks:** all of them in the body face. In Amiri (display), only shadda, sukun and fathatan (as in أيضاً). Full vowelling adds about 9 KB of mark positioning to Amiri.
  - **Layout features:** Arabic shaping, mark placement and kerning only; stylistic sets and fractions are dropped. Unhinted.
- **IBM Plex Sans Arabic carries the OFL Reserved Font Name "Plex".** A subset is a Modified Version under the OFL, so ours is renamed **MKN Sans Arabic** in its name table. The copyright notice and the licence (`src/assets/fonts/arabic/*-OFL.txt`) are kept. Amiri has no Reserved Font Name and keeps its name.
- Astro's Fonts API serves them with the `local` provider.

## Results (`/ar/`, Chromium)

| | Before | After |
|---|---|---|
| Amiri 400 | 106.0 KB | 81.7 KB |
| Plex / MKN Sans Arabic 400 | 41.8 KB | 36.8 KB |
| Plex / MKN Sans Arabic 500 | 44.2 KB | 37.2 KB |
| **Critical (preloaded)** | **147.8 KB** | **118.5 KB** (budget 120) |
| All fonts, Arabic spike pages | 258.9 KB | 200.1 KB |

## Consequences

- `tests/e2e/fonts.spec.ts` enforces the 120 KB critical budget on every route. It also fails if any Arabic character is rendered in a face that lacks it, for example a damma in a headline, and names the script to change.
- Headroom is only 1.5 KB. Adding Amiri marks or a new preloaded face means re-running the budget, or dropping a preload.
- Language-switch CLS rose from ≤ 0.0009 to ≈ 0.005 (target 0.1): punctuation and digits now swap with the Arabic face. Cold `/ar/` fonts-ready on Slow 3G improved from ≈ 7.1 s to ≈ 5.9 s. Metric-matched Arabic fallbacks (`size-adjust`, `ascent-override`, PRD §6.2) would remove the remaining shift; not done yet.
- Latin faces still come from fontsource. On `/ar/` they load only for real Latin text (the wordmark, the language link, identifiers in mono labels).
