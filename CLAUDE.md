# CLAUDE.md — makeena.studio

Bilingual (English / Arabic) website for **Makeena**, a Doha production studio and AI content consultancy (QFC licence 04998). Read **`docs/PRD.md`** before starting any task; it is the source of truth for scope, design and acceptance criteria. `docs/reference/homepage-ux.md` holds the original design tokens and copy; the PRD overrides it where they differ.

## Current state

**Phase 0 (de-risk spikes) is complete and merged.** Phase 1 (foundation) is in progress; its seven founder decisions are recorded in `docs/decisions/0005`. Read **`progress.md`** first: it has the current status, decisions made, carry-over findings, environment gotchas and the Phase 1 plan. Keep it up to date at the end of each work session.

What exists today: an Astro 7 static site with `/en/` and `/ar/`, Phase 0 spike pages under `/{lang}/spike/` (to be removed from production in Phase 1), self-hosted fonts, and Playwright spike tests. Production deploys from `main` to https://makeena-website.makeena.workers.dev; branch previews are at `https://<branch-with-dashes>-makeena-website.makeena.workers.dev`.

## Stack (PRD §11)

- Astro 7 (current stable; PRD says 6, see `docs/decisions/0001`), static output, built-in i18n: `/en/…` and `/ar/…` with `prefixDefaultLocale: true`
- Tailwind CSS v4 (`@theme` tokens), logical-property utilities only
- GSAP + ScrollTrigger, native scroll (no Lenis or other smooth-scroll library)
- Astro `<ClientRouter />` for page transitions (founder decision after Phase 0, `docs/decisions/0002`): same-document View Transitions in every browser, including Firefox. Effects initialise on `astro:page-load` and tear down on `astro:before-swap`
- Cloudflare **Workers** with static assets, deployed by Workers Builds from GitHub (project `makeena-website`). Needs a `wrangler.jsonc` at the repo root (see PRD §11.3). Turnstile + Resend for the brief form
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

- One branch per task: `phase-{n}/{short-name}` (e.g. `phase-0/section-cut-spike`). Open a pull request for every branch; Cloudflare Workers Builds comments on the PR with the build status and a preview URL the founder reviews on desktop and phones. Don't push directly to `main` once the app exists.
- Keep PRs small enough to review on a phone. Each PR description: what changed, how to test on the preview URL (which routes, which browsers, both locales), open questions, placeholders added.
- Meet the per-PR definition of done (PRD §17.1) before asking for review.
- Record spike results and decisions as short notes in `docs/decisions/NNNN-title.md`.
- When something in the PRD looks wrong or a decision is needed, ask the founder instead of guessing.

## Repository map

| Path | Contents |
|---|---|
| `progress.md` | Current status and resume point (read first) |
| `docs/PRD.md` | Product requirements (source of truth for scope) |
| `docs/reference/homepage-ux.md` | Original UX recommendation: tokens, copy, section logic |
| `docs/decisions/` | Decision records: 0001 Astro 7 + static Worker, 0002 section-cut + ClientRouter decision, 0003 aerial sequence, 0004 mirror-line + Arabic fonts, 0005 Phase 1 founder decisions |
| `src/spikes/` | Phase 0 spike code (aerial sequence player, draft spike copy); reused in Phase 3 |
| `scripts/sequences/` | Frame-sequence generation (Phase 0 placeholder aerial) |
| `public/sequences/` | Encoded AVIF frame sequences |
| `tests/spikes/` | Playwright spike measurements |
| `design/renders/` | 19 concept-stage renders + `manifest.json` (IDs, concepts, Higgsfield job IDs, digital source type). Source material, not served directly. Known gaps: PRD §12.3 |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server on localhost |
| `npm run build` | Static build into `dist/` (what Workers Builds runs) |
| `npm run preview` | Build, then serve `dist/` through `wrangler dev` (closest to production) |
| `npm run lint` | ESLint, Stylelint (design bans: gradients, `backdrop-filter`, shadows, physical left/right, radius > 2 px) and Prettier check |
| `npm run format` | Prettier write |
| `npm run typecheck` | `astro check` |
| `npm run test:unit` | Vitest |
| `npm run test:e2e` | Playwright smoke + axe in `tests/e2e/`: Chromium, WebKit, two phones, reduced motion (run `npm run build` first; `npx playwright install chromium webkit` once) |
| `npm run test:spikes` | Phase 0 measurements in `tests/spikes/` (local only; timing-sensitive) |
| `npm run sequences:placeholder` | Regenerate the Phase 0 placeholder aerial sequence (needs ffmpeg) |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit and e2e on every PR and on `main`. Keep it green before asking for review.
