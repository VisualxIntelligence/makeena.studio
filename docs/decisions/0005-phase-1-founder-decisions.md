# 0005 — Phase 1 founder decisions

**Date:** 26 October 2026 · **Phase:** 1 · **Status:** accepted by the founder ("all recommended")

The Phase 1 brief raised seven decisions. The founder accepted the recommendation for each.

| # | Decision | Consequence |
|---|---|---|
| 1 | **Add Astro `<ClientRouter />` in Phase 1**, not Phase 2 | `phase-1/motion-controller` builds G1 around `astro:page-load` / `astro:before-swap` from the start. Phase 2 adds only the 11 and 12 animations on top. |
| 2 | **Remove the Phase 0 spike pages from production** in `phase-1/routes-i18n` | `src/pages/[lang]/spike/` goes; `src/spikes/`, `scripts/sequences/`, `public/sequences/` and the spike tests stay for Phase 3. |
| 3 | **Arabic placeholder copy is written as marked drafts** ("AR DRAFT · NOT REVIEWED"), not `[PLACEHOLDER]` markers | Arabic layout, line length and fonts are tested with real text. Every draft string carries the marker and is listed for native review in Phase 5. Facts (clients, prices, legal details) still use `[PLACEHOLDER: …]` in both locales. |
| 4 | **`/api/brief` runs in a small Worker entry**, not the Astro Cloudflare adapter | The Astro build stays `output: "static"`. Phase 4 adds `main` to `wrangler.jsonc`: a Worker that handles `/api/*` (Turnstile Siteverify → Resend) and passes every other request to the assets binding. |
| 5 | **Cloudflare Stream** for the hero loop, not Mux | One vendor and bill with hosting. Needed in Phase 3. Scrubbed media is never streamed (unchanged). |
| 6 | **Production domain is `makeena.studio`**, attached at launch | Until launch the site lives at `makeena-website.makeena.workers.dev`. `astro.config.mjs` `site` already uses `https://makeena.studio` for canonical URLs, hreflang and the sitemap; pages stay `noindex` until launch. |
| 7 | **exiftool is installed locally** (winget `OliverBetz.ExifTool`) | `scripts/provenance/` runs on the founder's machine and commits its JSON output, so CI never needs exiftool. |
