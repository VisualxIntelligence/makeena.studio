# 0009 — Provenance records and the exiftool script

**Date:** 26 October 2026 · **Phase:** 1 · **Status:** accepted

## Sources and output

- `design/renders/manifest.json` (existing): generator facts per render, namely ID, file, size, concepts, IPTC digital source type, Higgsfield job and `derivedFrom`.
- `design/renders/provenance.json` (new, hand-edited): editorial fields per render, namely type, light, aircraft, caption and alt (EN + AR draft, `arReviewed: false`), rights, gates cleared, metadata status. Defaults cover what is shared.
- `npm run provenance` (`scripts/provenance/build.mjs`):
  - merges both sources (`records.mjs`, pure);
  - checks every render with exiftool: the file exists, its dimensions match the manifest, and any embedded `DigitalSourceType` agrees;
  - writes one record per asset to `src/content/assets/{id}.json`.
- The `assets` content collection validates the PRD §10.2 schema at build time. `tests/unit/provenance.test.ts` recomputes the records in CI (no exiftool needed) and fails if the committed files are stale, if a render has no record, if alt text doesn't say "Generated", or if a record claims metadata on a derivative.

## Tagging masters

- `npm run provenance:tag -- <folder>` embeds into **master** files named `{id}.png|jpg|tif`: IPTC Digital Source Type, creator, caption (EN, AR), alt text (EN, AR) and identifier. Rights are added once they are no longer a placeholder.
- It refuses folders inside the repo: web derivatives are re-encoded on build and lose XMP anyway, and the site only ever says "retained on master file".
- Values go through a UTF-8 argument file, because on Windows exiftool receives non-ASCII command-line arguments in the ANSI code page (Arabic was stored as `????` before this fix).
- After tagging, set `metadataRetained.iptc: true` for those assets in `provenance.json` and re-run `npm run provenance`.

## Honest defaults (concept stage)

- `gatesCleared: []`: the brief's four gates aren't mapped to the QA pipeline yet (PRD §12.1 step 7, `[PLACEHOLDER]`).
- `metadataRetained: { iptc: false, c2pa: false, on: "master" }`: no master has been tagged yet (`design/renders/README.md`).
- `rights`: `[PLACEHOLDER: rights terms]`.
- `generator` is in the record but is internal; `ProvenanceFigure` (Phase 2, 08) must not show it unless the founder approves (PRD §10.2).
- Not yet covered: the Phase 0 placeholder sequence `MKN-AER-FLT01-PLACEHOLDER` (spike only, not on the site). Phase 3 adds `sequence` records with the real frames.
