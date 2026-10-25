# 0003 — Spike (b): concept 03 canvas image sequence

**Date:** 25 October 2026 · **Phase:** 0 · **Status:** emulated results in; **real-device check pending (founder)**

## What was built

- `scripts/sequences/placeholder-aerial.mjs` fakes a 150-frame flight from keyframes `MKN-AER-FLT01-A/B/C` (slow push-in on each, 0.5 s crossfades). Output: `public/sequences/MKN-AER-FLT01-PLACEHOLDER/`, labelled PLACEHOLDER.
- `src/spikes/aerial/sequence-player.ts`: frames fetched once as compressed Blobs (every 8th first, then 4th, 2nd, rest; 6 parallel). Only ±12 frames around the target are decoded with `createImageBitmap`; others are closed. Scroll sets a target, rAF draws. Canvas backing store = CSS size × DPR (max 2), never larger than the frame.
- `/{lang}/spike/aerial/`: the pinned section, filmstrip, progress rail, `FRAME 0000 / 0960` timecode, "Skip the flight" link, per-chapter `aria-label`, stills fallback. `?debug` shows a live readout, `?stills` forces the fallback, `?force` ignores the device-memory check.

## Findings

1. **Encoding budget.** AVIF q50 (sharp's default 4:4:4 chroma), the PRD's starting point, gave **19.96 MB** desktop: far over the 6–9 MB budget. **q34 with 4:2:0 chroma, effort 6** gives **9.43 MB** desktop (~63 KB/frame) and **1.61 MB** mobile (75 frames at 828 px). The quality loss is not visible at playback speed. Real flights have more frame-to-frame change than this push-in placeholder, so expect the real sequence to need 120–144 frames or q30 to stay under 9 MB. **Recommendation:** budget by bytes per frame (≤ 60 KB desktop, ≤ 25 KB mobile), not by frame count.
2. **Pin with CSS `position: sticky`, not GSAP `pin`.** The section's scroll distance (`400svh`) is reserved in CSS, decided before first paint by an inline script (reduced motion, Save-Data, `deviceMemory < 4`). ScrollTrigger only reads progress (`scrub: 0.4`). No pin-spacer is inserted, so there is no layout shift when JS arrives, and iOS address-bar resizes don't re-pin. Recommend this for 03 and 06 in Phase 3.
3. **Memory is bounded.** Across five full down/up passes in both locales the decoded window peaked at **25 bitmaps** (±12 + the frame on screen): ~144 MB of bitmaps at 1600 px desktop, ~39 MB at 828 px mobile. The canvas never decodes the full sequence. Mobile memory is what the real-device test must confirm.
4. **Frame rate (emulated).** Pixel 7 emulation with a 4× CPU slowdown: one full pass in 4 s gave a p50 and p95 frame interval of **16.7 ms** and **zero frames over 33 ms**. Desktop Chromium drew every target frame with 3–6 nearest-frame substitutions per run of five fast passes (the frame behind the target is shown while the exact one decodes).
5. **AVIF only, stills as the safety net.** Playwright's Windows WebKit build cannot decode AVIF (real Safari has since 16). Rather than ship a WebP copy of every frame (~15 MB more), the page probe-decodes frame 1 and falls back to the stills (which ship WebP/JPEG through `<Picture>`) if AVIF fails. **Recommendation:** drop the WebP sequence fallback from PRD §9.2; every target browser decodes AVIF.
6. **Reduced motion and Save-Data load nothing from the sequence**, not even the poster frame: the poster preload is injected by the pre-paint script only on the sequence path (tested).

## Still to verify (exit criterion)

The PRD requires 55–60 fps on a **real** mid-range Android and a recent iPhone, with no tab crash after five full passes. Emulation can't prove that. On the preview URL, open `/en/spike/aerial/?debug` on each phone, scroll the flight five times down and up, and note: smoothness, any reload/crash, and the readout's `peak` value.

## Not done in the spike

ProvenanceFigure wrapping (Phase 2), Arabic copy, live reduced-motion switching (the G1 controller, Phase 1), the home-page three-still teaser.
