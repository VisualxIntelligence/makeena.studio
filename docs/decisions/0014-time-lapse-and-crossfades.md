# 0014 — The construction time-lapse (07), discrete mode, and shared crossfades

**Date:** 26 October 2026 · **Phase:** 3 · **Status:** accepted (founder kept M00's white hoarding)

## MatchedFrameScrubber is now one entry point with a file per mode

`MatchedFrameScrubber.astro` dispatches on `mode` to `ContinuousScrubber` (04) or `DiscreteScrubber` (07). Shared prop types live in `scrubber/types.ts`; 03's scroll mode comes next.

## 07 on `/capability/standing-production/` (PRD §9.5)

- **Stops:** months 00 (`PRG-CAM01-M00`, generated, decision 0013), 06, 14 and 24 (`TWR-CAM01-OVERCAST`, the finished tower). Labels use the PRD's phases: empty plot, piling and core, frame at level 20, handover.
- **Radio group:** the stops are a native radio group of thumbnails, so arrow keys move between them (the radio-group pattern for free). A polite live region announces "Month 14 of 24" ("الشهر 14 من 24").
- **On change:** the frame, caption, ⓘ sheet and that stop's notes change. The notes are `[PLACEHOLDER: month NN deliverables of standing capacity]` until the founder supplies them.
- **Wipe:** a range control compares the stop with the one before. The earlier month shows on the inline-start side of a `clip-path` divider, which mirrors in Arabic. Hidden at month 00 and under reduced motion (PRD).
- **Chronology follows `dir`:** month 00 sits at the inline start (right in Arabic). On phones the stops form a scroll-snap strip.
- **Loading:** with JS, frames not on screen are `display: none`, so they aren't fetched until first contact. They're then set to `loading="eager"` (the WebKit lazy-image issue, decision 0012).
- **Without JS:** all four months as a labelled grid with their notes; the picker and ⓘ are hidden.
- **Two layout bugs fixed on the way:**
  - A `<fieldset>` defaults to `min-inline-size: min-content`, which widened the page instead of scrolling the strip.
  - The visually hidden radio, which is absolute, escaped the strip because the stop wasn't positioned.

## Shared crossfade (`src/lib/crossfade.ts`)

13 and 07 both use one helper: a 300 ms same-document view-transition fade (`html[data-vt="fade"]`), instant without motion. Quick successive changes exposed a race. A skipped fade's cleanup removed the flag while a newer fade was running, so that fade fell back to the 11 section-cut sweep. Now:

- each call is tagged when made, and only the last one clears the flag;
- a call superseded while waiting is dropped (each update applies the latest state);
- a fade waits for a page transition, never for another fade;
- the expected "transition was skipped" rejections are caught.

A regression test checks that quick stop changes only ever play fade animations.

## Test note

Calling `document.getAnimations()` every frame during view transitions crashes Playwright's Windows WebKit (WinCairo). Tests record animations once per transition, at `ready`.
