# Concept renders

21 generated images made for the concept board in October 2026 (two added on 26 Oct to fill gaps: the sun study's morning frame and a daylight month 00). All are AI-generated (IPTC digital source type `trainedAlgorithmicMedia`) and show fictional buildings and places.

- Files are web-sized JPEG derivatives, maximum 1800 px wide. Full-resolution PNG masters are in the founder's Higgsfield account; `manifest.json` lists each image's job ID.
- Each file name is its asset ID (`MKN-{SERIES}-{CAM}-{VARIANT}`), which the provenance system uses.
- Images in a series were made as edits of one base image, so their camera views match closely but not pixel-exactly.
- These are concept-stage assets for spikes and early layouts. Production assets follow the pipeline in `docs/PRD.md` §12, and the known gaps are listed in §12.3.
- Metadata is not embedded in these web derivatives. `provenance.json` holds captions, alt text, light and rights for each asset; `npm run provenance` turns both JSON files into the site's provenance records, and `npm run provenance:tag -- <folder>` embeds IPTC metadata into the master files (decision 0009).

| Series | Files | Used by |
|---|---|---|
| `TWR-CAM01` | DUSK, NIGHT, OVERCAST, CLAY, WIRE, PLOT | Home hero, 13 after hours, 07 (PLOT, OVERCAST) |
| `PRG-CAM01` | M00, M06, M14 | 07 time-lapse |
| `AER-FLT01` | A, B, C | 03 scroll-flown aerial (keyframes), 08 |
| `SUN-SKY01` | DAWN, MORNING, MIDDAY, GOLD, NIGHT | 04 sun study, 12, 13 |
| `AXO-CAM01` | EXPLODED | 06 (reference / static fallback) |
| `STU-CAM01/02` | CONTROL, RUNBOOK | 14 studio |
| `PLN-TOP01` | SITE | Reference only |
