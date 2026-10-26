# 0013 — Phase 3 decisions, MatchedFrameScrubber and the sun study (04)

**Date:** 26 October 2026 · **Phase:** 3 · **Status:** accepted by the founder

## Phase 3 decisions

| # | Decision | Consequence |
|---|---|---|
| 1 | **Generate the missing frames in Higgsfield** (founder's account, credits approved) | Done for 04 (morning) and 07 (daylight month 00), 8.25 credits in total (one morning retake). Aerial night variants (13) and 06's six layers are generated, or attempted, when their PRs start. |
| 2 | **03 ships the Phase 0 placeholder sequence**, labelled as a placeholder in provenance, until a real flight exists | `phase-3/aerial` |
| 3 | **06 ships static** (the flattened exploded image plus the numbered layer list, the PRD's reduced-motion state) until six real layers exist | `phase-3/axonometric` |
| 4 | **Sun positions computed for 21 June 2026** (summer solstice) | `src/lib/sun.ts`; the readout says so |
| 5 | **Hero video loop later**, in its own PR once a loop exists (Cloudflare Stream) | The still poster stays |

## Generated frames (PRD §12.3 gaps)

GPT Image 2.5 (high, 2K) edits of existing renders. Each frame is checked against its set with an edge-map correlation (lighting-independent).

- **`MKN-SUN-SKY01-MORNING`**:
  - The first attempt was generated at 16:9 and saved at the wrong size (the SUN-SKY01 set is 1800 × 771, about 21:9).
  - Retaken at 21:9: correlation 0.86 with DAWN and 0.84 with MIDDAY, inside the existing set's 0.79–0.88. Dawn → morning → midday now reads as one camera.
- **`MKN-PRG-CAM01-M00`**: M06's camera and daylight, with an empty plot. A close match. The hoarding is white here and blue at month 06.

## MatchedFrameScrubber (PRD §9.1), continuous mode

- `src/components/scrubber/`: frames are provenance assets stacked in an aspect-ratio box. A native `<input type="range">` crossfades the two nearest frames by opacity; under reduced motion (OS setting or the footer control) the nearest frame swaps in instantly.
- The `<output>` readout and `aria-valuetext` come from a per-step table. Two lines are reserved for the readout, so its changing length never shifts the layout.
- One ⓘ button (and the caption and figure ID) always follows the frame on screen.
- **Loading:**
  - Only the initial frame loads with the page.
  - The other frames sit in `<template>`s, which are never fetched, until the visitor points at, focuses or touches the scrubber.
  - Thumbnails load at low priority.
  - Result: off-plan lab LCP went from 2.26–2.70 s to 1.88 s, and the page is now in the Lighthouse set.
- **Without JS:** the initial frame and the labelled thumbnails; the control is hidden.
- `directionLock: "ltr"` keeps the track and its thumbnails left-to-right in Arabic; the labels mirror.

## 04 sun study (PRD §9.3)

- `SunStudy.astro` on `/capability/off-plan-visualisation/`. Frames:
  - 05:30 dawn
  - 08:30 morning
  - 12:00 midday
  - 17:30 golden hour (the initial and no-JS frame)
  - 20:30 night
- The control runs 05:30–20:30 in 15-minute steps. The readout reads like "17:30 · Golden hour · sun azimuth 291°, altitude 11°", or "sun below the horizon". Values come from SunCalc 2 (degrees, azimuth from north) for Doha (25.29° N, 51.53° E) on 21 June 2026, computed at build time.
- Arabic readout and labels (drafts) keep Western digits; the coordinates sit in a left-to-right isolate.
- **Tests:**
  - keyboard: Home, End and arrows reach every state; the value text and readout agree
  - thumbnails select frames; the ⓘ sheet follows
  - two layers blend, or exactly one under reduced motion
  - Arabic: the track stays LTR
  - frames are deferred until first contact
  - no layout shift on interaction
  - no-JS state
- Unit tests check the sun positions.
