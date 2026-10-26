# CLAUDE.md — makeena.studio

Bilingual (English / Arabic) website for **Makeena**, a Doha production studio and AI content consultancy (QFC licence 04998). Read **`docs/PRD.md`** before starting any task; it is the source of truth for scope, design and acceptance criteria. `docs/reference/homepage-ux.md` holds the original design tokens and copy; the PRD overrides it where they differ.

## Current state

**Phases 0 and 1 are complete; Phase 2 (global systems) is in progress:** 08 `ProvenanceFigure` first, then 11/12 on the router, then 13 after hours. Phase 2 decisions: `docs/decisions/0010`. Read **`progress.md`** first: it has the current status, decisions made, carry-over findings, environment gotchas and the Phase 1 plan. Keep it up to date at the end of each work session.

What exists today: an Astro 7 static site with every PRD §5 route in `/en/` and `/ar/` (placeholder content from `src/content/`), localised 404s, sitemap, hreflang, the root language redirect, tokens and type for both scripts, and CI. The Phase 0 spike pages are no longer built for production; `npm run test:spikes` builds them with `MKN_SPIKES=1`. Production deploys from `main` to https://makeena-website.makeena.workers.dev; branch previews are at `https://<branch-with-dashes>-makeena-website.makeena.workers.dev`.

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
- Fonts: Cormorant Garamond (display), Inter (body), JetBrains Mono (labels); Amiri + IBM Plex Sans Arabic for Arabic. Self-hosted WOFF2 subsets. The Arabic faces are our own subsets in `src/assets/fonts/arabic/` (Plex renamed **MKN Sans Arabic** for the OFL); change them only through `npm run fonts:arabic` (decision 0006).
- No gradients, no `backdrop-filter`/glass, no card shadows, radius ≤ 2 px, no emoji, no icon fonts.
- Tokens and type roles live in `src/styles/global.css` (Tailwind `@theme`). Every text/background pair must be listed in `src/styles/contrast.ts` (checked by `npm run test:unit`). `npm run lint` rejects forbidden CSS and Tailwind classes (physical left/right, shadows, gradients, backdrop, radius > 2 px).
- **No photograph or likeness of the founder anywhere.**

**Bilingual / RTL**
- CSS logical properties only in components (`margin-inline-start`, `inset-inline-end`, `text-align: start`).
- Identifiers stay Western digits and `dir="ltr"` in Arabic: section numbers, asset IDs, licence/tax/phone numbers, timecodes, coordinates.
- Never mirror photos/renders, the logo, or the sun-study track (04). Mirror layout, nav, arrows, filmstrips, chronology. Full table: PRD §7.2.
- Never split Arabic text into characters for animation. Never letter-space or uppercase Arabic.
- Don't invent or "improve" Arabic copy. Mark drafts clearly for native review.

**Motion and accessibility**
- Every effect has a reduced-motion fallback and a no-JS state where content is visible. Gate all motion through the G1 motion controller (`src/lib/motion/`): `registerEffect()` with `conditions.reduced`; never import GSAP directly in a page script except for effects that must exist before the first interaction (decision 0008). DOM scripts set up with `onPage()` from `src/lib/lifecycle.ts`.
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
| `docs/decisions/` | Decision records: 0001 Astro 7 + static Worker, 0002 section-cut + ClientRouter decision, 0003 aerial sequence, 0004 mirror-line + Arabic fonts, 0005 Phase 1 founder decisions, 0006 Arabic font subsets, 0007 layout + performance checks, 0008 G1 motion controller + router lifecycle, 0009 provenance records, 0010 Phase 2 decisions + ProvenanceFigure, 0011 transitions on the router |
| `src/styles/` | `global.css` (Tailwind theme, base, `.display` / `.label` / `.wrap`), `contrast.ts` (allowed colour pairs), `view-transitions.css` |
| `scripts/lint/` | Tailwind class linter for the design rules |
| `scripts/fonts/`, `src/assets/fonts/arabic/` | Arabic font subsetting (Python fonttools) and its committed output + coverage map |
| `src/i18n/` | Locales, route table and path helpers (`config.ts`), UI strings (`ui.ts`), bidi helpers (`text.ts`) |
| `src/content/`, `src/content.config.ts` | Content collections: `pages/{lang}/{route}.json`, `services`, `gates`, `register`, `site` (PRD §10.1) |
| `src/layouts/` | `BaseLayout` (html lang/dir, head, fonts, nav/footer), `Page` (route shell on the 12-column grid: header + sections from content) |
| `src/pages/[lang]/` | One file per PRD §5 route; extras go into a section via a slot named after the section id |
| `src/lib/transitions/` | G2: picks 11 (`nav`), 12 (`lang`) or `none` per routed navigation; animations in `src/styles/view-transitions.css` |
| `docs/qa/` | Manual device checklists (iOS Safari) |
| `src/components/media/` | `ProvenanceFigure` (08: every image goes through it, `priority` on a page's first in-view figure) and `FigureGrid` |
| `src/lib/motion/`, `src/lib/lifecycle.ts` | G1 motion controller (`motion`, `registerEffect`, effects in `effects/`) and `onPage()` for the ClientRouter lifecycle |
| `src/spikes/` | Phase 0 spike code (aerial sequence player, draft spike copy); reused in Phase 3 |
| `scripts/provenance/`, `src/content/assets/` | Provenance records (PRD §10.2): built from `design/renders/manifest.json` + `provenance.json` by `npm run provenance`; generated, never hand-edited |
| `scripts/sequences/` | Frame-sequence generation (Phase 0 placeholder aerial) |
| `public/sequences/` | Encoded AVIF frame sequences |
| `tests/spikes/` | Playwright spike measurements |
| `design/renders/` | 19 concept-stage renders + `manifest.json` (IDs, concepts, Higgsfield job IDs, digital source type) + `provenance.json` (captions, alt, light, rights; hand-edited). Source material, not served directly. Known gaps: PRD §12.3 |

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Astro dev server on localhost |
| `npm run build` | Static build into `dist/` (what Workers Builds runs) |
| `npm run preview` | Build, then serve `dist/` through `wrangler dev` (closest to production) |
| `npm run lint` | ESLint, Stylelint and the Tailwind class check (design bans: gradients, `backdrop-filter`, shadows, physical left/right, radius > 2 px), Prettier check |
| `npm run format` | Prettier write |
| `npm run typecheck` | `astro check` |
| `npm run test:unit` | Vitest: token values and contrast pairs, class-lint rules |
| `npm run test:e2e` | Playwright smoke + axe in `tests/e2e/`: Chromium, WebKit, two phones, reduced motion, Firefox (transitions only) (run `npm run build` first; `npx playwright install chromium webkit` once) |
| `npm run budget` | Page-weight budgets on `dist/` (PRD §13): gzip HTML+CSS ≤ 45 KB, JS ≤ 70/85 KB |
| `npm run lighthouse` | Lighthouse CI on `dist/` (locally set `CHROME_PATH`, e.g. Playwright's Chromium) |
| `npm run test:spikes` | Builds with the spike pages (`MKN_SPIKES=1`) and runs the Phase 0 measurements in `tests/spikes/` (local only; timing-sensitive). Run `npm run build` afterwards before `test:e2e` |
| `npm run provenance` | Rebuild `src/content/assets/` from the render manifests and verify the renders with exiftool (`--no-exif` to skip) |
| `npm run provenance:tag -- <dir>` | Embed IPTC metadata into master files outside the repo |
| `npm run fonts:arabic` | Rebuild the Arabic font subsets (needs Python + `pip install -r scripts/fonts/requirements.txt`) |
| `npm run sequences:placeholder` | Regenerate the Phase 0 placeholder aerial sequence (needs ffmpeg) |

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit, budget, e2e and Lighthouse on every PR and on `main`. Keep it green before asking for review.
