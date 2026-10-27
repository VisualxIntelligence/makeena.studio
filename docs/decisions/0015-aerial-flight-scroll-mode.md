# 0015 — The scroll-flown aerial (03) and the scrubber's scroll mode

**Date:** 27 October 2026 · **Phase:** 3 · **Status:** proposed (founder review on the preview)

## What was built

- **`MatchedFrameScrubber` scroll mode** (`ScrollScrubber.astro`, `scroll.ts`). The Phase 0 player moved from `src/spikes/aerial/` to `src/components/scrubber/sequence-player.ts` unchanged: frames fetched once as Blobs (every 8th first), a decode window of ±12 frames, drawing in `requestAnimationFrame`, DPR capped at 2.
- **03 on `/capability/aerial-perspective/`** (`AerialFlight.astro`): the pinned stage, a filmstrip of the three chapters (high approach, descent over the marina, low pass along the promenade), a progress rail, the `FRAME 0000 / 0960` timecode, and the caption. The canvas's `aria-label` follows the chapter. "Skip the flight" moves focus past the section.
- **Home teaser:** the three chapter stills under 02 · Capability.
- **The flight is the Phase 0 placeholder** (decision 0013). It now has its own provenance record, `MKN-AER-FLT01-PLACEHOLDER` (type `sequence`), and its caption ends `PLACEHOLDER FLIGHT`.

## Decisions

| # | Decision | Why |
|---|---|---|
| 1 | **The scroll distance is reserved in CSS.** The track is one stage plus three viewports tall, and GSAP pins the stage with `pinSpacing: false`. Until GSAP runs, the stage is `position: sticky`. | The page never changes height when the pin starts. This removes the Phase 0 caveat that a reload while scrolled past the section shifted content once (decision 0003). Still GSAP's `pin`, as the founder chose. |
| 2 | **03 starts on the first interaction, like every G1 effect.** Frames are fetched only after that, after `load`, and within one viewport of the section. Decision 0008 expected 03 to need GSAP before the first scroll; with decision 1 it doesn't, because the sticky stage holds its place until the pin takes over. | Tried first: start after `load`. Lighthouse then counted GSAP and the first megabytes of frames as LCP dependencies (on localhost `load` fires before the poster paints), and simulated LCP went to 6–12 s. Now: 1.96 s (en) and 2.93 s (ar, font-bound like every `/ar/` page). A visitor who never scrolls downloads no frames. |
| 3 | **The LCP is the first chapter still, not frame 1.** The poster under the canvas is `MKN-AER-FLT01-A` through `<Picture>` (AVIF/WebP, ≤ 108 KB at 1600 w), the page's one high-priority image. The stills reuse its URLs. | It is a still in every browser, even without AVIF, and there's no pre-paint preload script. Frame 1 is the same image (zoom 1.0 of A). PRD §13 updated. |
| 4 | **Mode chosen before first paint** by a small inline script in the component, from the same rules as the G1 controller: OS reduced motion, the footer control, Save-Data, `deviceMemory < 4`. A live change of the motion preference switches modes without a reload. | The two modes have very different heights, so deciding late would shift the layout. |
| 5 | **AVIF probe without a request.** A 285-byte AVIF is decoded from memory. If that fails, the flight switches to the stills. | Phase 0 fetched frame 1 to find out. |
| 6 | **The reveal effect clears its transform** when it finishes. | A leftover `transform` made the revealed block the containing block of the pinned (fixed) stage. |
| 7 | **The timecode stays Latin** (`FRAME 0412 / 0960`, `lang="en"`, `dir="ltr"`) in both locales, and is `aria-hidden`. | It's an identifier readout like an asset ID. Screen readers get the chapter from the canvas label instead. |

## Measurements (local Chromium, 1440 × 900 and Pixel 7 emulation)

- Decoded window peak: **25 bitmaps** (≈ 98 MB at 1600 px desktop, ≈ 23 MB at 828 px mobile). Frames drawn without misses at the scroll steps tested.
- Sequence bytes: 9.43 MB desktop (150 frames), 1.61 MB mobile (75), fetched only after `load` and within one viewport of the section. Reduced motion, Save-Data, low memory and no JS fetch none of them (tested).
- Page weight: HTML + CSS 15.0 KB, JS 14.7 KB (en). GSAP stays a dynamic import, fetched on the first interaction.
- Lighthouse (mobile, lab): LCP 1.96 s en and 2.93 s ar, CLS 0.000 en and 0.002 ar (the Arabic font swap), performance 99 en and 94 ar, accessibility 100.
- No layout shift while scrolling into the flight or when the pin takes over (Pixel-sized viewport).

## Tried and dropped

- **A pin spacer in the markup** (ScrollTrigger's `pinSpacer`), so the pin wouldn't move the poster in the DOM. GSAP copies the stage's `display: grid` onto it, and the stage shifted (CLS 0.93). It wasn't needed: LCP recording stops at the first scroll, before the pin exists.

## Still to do

- Night variants for 13: generated 27 Oct (`MKN-AER-FLT01-NIGHTA/B/C`, 8.25 credits). The night placeholder sequence and the swap come in `phase-3/aerial-night`.
- Real-device check: mid-range Android and a recent iPhone, five full passes (PRD §9.2 acceptance).
- A real flight (PRD §12.1 step 3) replaces the placeholder. Budget by bytes per frame (≤ 60 KB desktop, ≤ 25 KB mobile), as in decision 0003.
