# CLAUDE.md — makeena.studio

Bilingual (English / Arabic) website for **Makeena**, a Doha production studio and AI content consultancy (QFC licence 04998). Read **`docs/PRD.md`** before starting any task; it is the source of truth for scope, design and acceptance criteria. `docs/reference/homepage-ux.md` holds the original design tokens and copy; the PRD overrides it where they differ.

## Current state

Docs and concept renders only. No app code yet. The next step is **Phase 0: de-risk spikes** (PRD §17).

## Stack (PRD §11)

- Astro 6, static output, built-in i18n: `/en/…` and `/ar/…` with `prefixDefaultLocale: true`
- Tailwind CSS v4 (`@theme` tokens), logical-property utilities only
- GSAP + ScrollTrigger, native scroll (no Lenis or other smooth-scroll library)
- Native cross-document View Transitions (no `<ClientRouter />` unless the founder decides otherwise after Phase 0)
- Cloudflare Pages / Workers; Turnstile + Resend for the brief form
- No Next.js, no Webflow, no Three.js at launch, no UI kit with its own look

Check current stable versions in official docs before installing; don't rely on remembered versions.

## Concept numbering

Use these numbers in branch names, commits, comments and PR titles.

| # | Concept | Kind |
|---|---|---|
| 03 | Scroll-flown aerial | Section component (`MatchedFrameScrubber`, scroll mode) |
| 04 | Sun study slider | Section component (scrubber, continuous mode) |
| 06 | Exploded axonometric | Section component |
| 07 | Construction time-lapse | Section component (scrubber, discrete mode) |
| 08 | Provenance HUD | Global: `ProvenanceFigure` wraps all media |
| 11 | Section-cut page transition | Global: view transition type `nav` |
| 12 | Mirror-line language switch | Global: view transition type `lang` |
| 13 | After hours (night mode) | Global: `data-hours="night"` |
| 14 | Studio without a portrait | Page `/studio/` |

## Non-negotiable rules

**Design**
- Tokens: ivory `#F6F2EA`, sand `#EFEAE1`, ink `#1A1A1A`, copper `#B4653A` (≥ 24 px text only), copper-deep `#9A522C` (small text, links, focus), muted `#5C5650`, night `#141414`, copper-light `#C8A27A` (on night only).
- Fonts: Cormorant Garamond (display), Inter (body), JetBrains Mono (labels); Amiri + IBM Plex Sans Arabic for Arabic. Self-hosted WOFF2 subsets.
- No gradients, no `backdrop-filter`/glass, no card shadows, radius ≤ 2 px, no emoji, no icon fonts.
- **No photograph or likeness of the founder anywhere.**

**Bilingual / RTL**
- CSS logical properties only in components (`margin-inline-start`, `inset-inline-end`, `text-align: start`).
- Identifiers stay Western digits and `dir="ltr"` in Arabic: section numbers, asset IDs, licence/tax/phone numbers, timecodes, coordinates.
- Never mirror photos/renders, the logo, or the sun-study track (04). Mirror layout, nav, arrows, filmstrips, chronology. Full table: PRD §7.2.
- Never split Arabic text into characters for animation. Never letter-space or uppercase Arabic.
- Don't invent or "improve" Arabic copy. Mark drafts clearly for native review.

**Motion and accessibility**
- Every effect has a reduced-motion fallback and a no-JS state where content is visible. Gate all motion through the G1 motion controller (`src/lib/motion/`).
- Native `<input type="range">` for sliders, native `popover` for the provenance sheet, real buttons and links. 44 × 44 px targets. Visible focus.
- Keyboard shortcuts for 13 (N, "doha") are ignored in form fields and with modifiers, and can be turned off in the footer (WCAG 2.1.4).

**Media and provenance**
- Every `<img>`, `<canvas>` and `<video>` goes through `ProvenanceFigure` with an asset ID that exists in the provenance collection.
- Asset names: `MKN-{SERIES}-{CAM}-{VARIANT}[_{NNNN}]`, Western digits; the name equals the provenance `id`.
- Never claim metadata is embedded in a web derivative. Say "retained on master file".
- The LCP element is always a still image, never video or canvas. Heavy media loads after `load` and near the viewport; never under Save-Data or reduced motion.

**Content**
- Don't invent facts, clients, testimonials, prices, gate names or legal details. Use the `[PLACEHOLDER: …]` markers from the PRD and list them in the PR.

## How to work

- One branch per task: `phase-{n}/{short-name}` (e.g. `phase-0/section-cut-spike`). Open a pull request for every branch; Cloudflare Pages posts a preview URL the founder reviews on desktop and phones. Don't push directly to `main` once the app exists.
- Keep PRs small enough to review on a phone. Each PR description: what changed, how to test on the preview URL (which routes, which browsers, both locales), open questions, placeholders added.
- Meet the per-PR definition of done (PRD §17.1) before asking for review.
- Record spike results and decisions as short notes in `docs/decisions/NNNN-title.md`.
- When something in the PRD looks wrong or a decision is needed, ask the founder instead of guessing.

## Repository map

| Path | Contents |
|---|---|
| `docs/PRD.md` | Product requirements (read first) |
| `docs/reference/homepage-ux.md` | Original UX recommendation: tokens, copy, section logic |
| `docs/decisions/` | Decision records (create as needed) |
| `design/renders/` | 19 concept-stage renders + `manifest.json` (IDs, concepts, Higgsfield job IDs, digital source type). Source material, not served directly. Known gaps: PRD §12.3 |

## Commands

None yet. Add the real commands here (dev, build, test, lint, preview) once Phase 1 scaffolds the project.
