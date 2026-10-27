# 0016 — Night variants of the aerial (03) for after hours (13)

**Date:** 27 October 2026 · **Phase:** 3 · **Status:** proposed (founder review on the preview)

PRD §8.4: after hours switches the hero **and the aerial imagery** to night. PRD §12.3 listed the aerial's night variants as missing.

## Keyframes

- `MKN-AER-FLT01-NIGHTA`, `NIGHTB` and `NIGHTC`: GPT Image 2.5 (high, 2K) edits of keyframes A, B and C, set at about 21:40, with the camera and geometry held. They cost 8.25 credits in total (decision 0013 approved the credits).
- Masters (2688 × 1520 PNG) stay in the Higgsfield account. The repo has 1800 × 1018 JPEG derivatives, like every render.
- Camera match (edge correlation with the day keyframe, decision 0013):

  | Keyframe | Correlation |
  |---|---|
  | NIGHTA | 0.68 |
  | NIGHTB | 0.71 |
  | NIGHTC | 0.60 (its sea reflections add edges) |

  The accepted SUN-SKY01 midday/night pair scores 0.66. By eye, the buildings, piers, boats, palms and rocks all stay in place.

## Night sequence

- **`MKN-AER-FLT01-NIGHTPLACEHOLDER`**: the same camera moves as the day placeholder over the night keyframes (`npm run sequences:placeholder -- --night`), so day and night frames match one for one. It is labelled as a placeholder, like the day sequence.
- **Encoded at AVIF q28, not q34.** At q34 the lit windows and reflections came to 11.44 MB (≈ 76 KB a frame). At q28 it's **9.44 MB desktop and 1.49 MB mobile**, the same bytes as the day sequence and inside the budget. There's no visible banding in the night sky at 100%.

## On the site

- **The flight** (`AerialFlight`, scroll mode) takes `nightSequence`, plus a `night` still per chapter.
  - With `html[data-hours="night"]` the canvas plays the night frames.
  - CSS swaps the poster, its ⓘ button and spec sheet, the caption and the filmstrip thumbnails.
  - The stills fallback uses `ProvenanceFigure`'s `night` variant.
- **The switch happens mid-flight.** A `MutationObserver` on `data-hours` calls `SequencePlayer.setSource()`, which fetches the frames around the current position first.
  - The canvas keeps the frame on screen until the new one has decoded, so it changes a moment after 13's crossfade.
  - A generation counter drops fetches and decodes from the old source.
- **Home teaser:** the three stills turn to night with the hero.
- **Loading:** night images are lazy and hidden until after hours is on, and hours.ts makes them eager on activation (decision 0012). The night sequence is fetched only while after hours is on.
- **Tests:**
  - night frames load only after activation;
  - a page loaded after hours fetches only night frames;
  - the canvas label, ⓘ and poster swap both ways;
  - the stills and the teaser turn to night.
