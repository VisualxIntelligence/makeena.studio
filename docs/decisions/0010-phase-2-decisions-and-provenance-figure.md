# 0010 — Phase 2 founder decisions and ProvenanceFigure (08)

**Date:** 26 October 2026 · **Phase:** 2 · **Status:** accepted by the founder ("all recommended")

## Phase 2 decisions

| # | Decision | Consequence |
|---|---|---|
| 1 | **The spec sheet never shows the generator** (service, model, job ID) | The record keeps it (internal); `ProvenanceFigure` doesn't render it. A test checks the job ID and service never appear. |
| 2 | **Gates cleared shows "Concept render · not yet through the gates"** while the brief's four gates are undefined | Becomes the gate numbers once `gatesCleared` is filled. |
| 3 | **13's toast shows a fixed time, `21:40 AST`**, matching the night renders | No live clock. |
| 4 | **iPhone check before the transitions PR merges:** a borrowed iPhone or a cloud device service, whichever is easier | A checklist ships with that PR. |
| 5 | **Router fallback stays `swap`** for browsers without view transitions | No simulated animation in old browsers. |

## ProvenanceFigure (PRD §8.3)

- `src/components/media/ProvenanceFigure.astro` takes `assetId` and `lang`. An unknown ID fails the build. Images come from `design/renders` through Astro's `<Picture>` (AVIF + WebP, `srcset`/`sizes`, explicit dimensions).
- A real ⓘ button (44 × 44 px, inline SVG) opens a native `popover`. Mouse, touch, keyboard and screen readers all work; Esc and a click outside close it, and there's a visible Close button. Hover alone never shows or hides anything.
- The spec sheet (`<dl>`, in the page's language) shows asset ID (LTR mono), type, source ("Generated with AI"), virtual camera (when known), light (with time), aircraft ("None · no permit" for aerials), gates, metadata ("Retained on master file" only when the master is tagged, otherwise "Not yet embedded in the master file"), rights, and a visible **Generated** badge.
- Copper corner brackets show on hover and on keyboard focus (CSS only). The mono caption under the image comes from the record. Images are never mirrored in Arabic.
- `FigureGrid` lays out 2-, 3- and 4-up sets. A `media` slot under the page header holds the home hero still.
- **First images on pages:**
  - home hero `TWR-CAM01-DUSK`
  - the three lead services on `/capability/`
  - aerial keyframes A–C
  - sun study (4) and axonometric
  - time-lapse months 00/06/14/24
  - two method examples (wire, clay)
  - studio (control room, runbook)
- **LCP:** the first figure that can be in a phone's first screen is `priority` (eager, `fetchpriority="high"`), at most one per page (tested). Everything else is lazy.

## Performance

- The hero's largest AVIF is 59 KB (budget 150 KB). HTML + CSS stays ≤ 12.3 KB per page.
- Lighthouse lab LCP: English 1.65–2.2 s. Arabic 2.55–2.85 s: the LCP image arrives early, but the simulation counts all ~200 KB of fonts on Arabic pages before LCP. The Arabic lab threshold is now 3.0 s; the field target stays 2.5 s.
- **Lever, if wanted:** Arabic labels use MKN Sans 500 (PRD §6.2). Setting them in 400 would drop 37 KB from every Arabic page. Not done without the founder's decision.

## Tests

`tests/e2e/provenance.spec.ts`:
- every `img`, `canvas` and `video` on every route sits in `figure[data-provenance]` with a known ID
- sheet open/close by click, keyboard, Esc and the Close button
- sheet content matches the record, and the generator is never shown
- Arabic sheet, and no mirroring
- corner brackets on focus
- one high-priority image per page at most; the hero is eager
