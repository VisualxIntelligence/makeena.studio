# Progress: makeena.studio

_Last updated: 27 October 2026_

## Where we are

**Phases 0–3 are complete and merged** (#1–#22); 06 ships static until real layer cut-outs exist (decision 0017). Phase 4 (studio and conversion) is in progress: the studio page is in review (`phase-4/studio`).

- Production (`main`): https://makeena-website.makeena.workers.dev (every PRD §5 route in both locales, placeholder content, noindex)
- Branch previews: `https://<branch-name-with-dashes>-makeena-website.makeena.workers.dev`. Cloudflare also posts a per-commit URL on each PR.

## Phase 0 summary

| PR | Branch | Result |
|---|---|---|
| #1 | `phase-0/scaffold` | Astro 7 (not 6, see decision 0001), `/en/` + `/ar/`, `wrangler.jsonc` |
| #2 | `phase-0/aerial-sequence-spike` | 03 canvas sequence: decode window capped at 25 frames, 60 fps at 4× CPU slowdown, GSAP pin with 0 load CLS |
| #3 | `phase-0/section-cut-spike` | 11 section-cut: correct sweep direction per locale in Chromium + WebKit |
| #4 | `phase-0/mirror-line-spike` | 12 language switch + self-hosted fonts: CLS ≤ 0.0007 (target 0.1) |

Write-ups: `docs/decisions/0001`–`0004`. Founder decisions after Phase 0 (25 Oct): Astro 7, `<ClientRouter />` so Firefox animates, GSAP `pin: true`, AVIF-only sequences.

## Phase 1 summary

Exit criteria (PRD §17): both locales build and deploy; every §5 route exists with placeholder content; CI green. Met.

| PR | Branch | Result |
|---|---|---|
| #6 | `phase-1/tooling` | ESLint, Prettier, Stylelint design bans, Vitest, Playwright matrix (Chromium, WebKit, two phones, reduced motion), axe, GitHub Actions CI |
| #7 | `phase-1/decisions` | Seven founder decisions recorded (decision 0005) |
| #8 | `phase-1/tokens-type` | Tailwind v4 `@theme` tokens, type roles for both scripts, contrast test, Tailwind class linter |
| #9 | `phase-1/arabic-fonts` | Arabic subsets: critical fonts on `/ar/` 147.8 → 118.5 KB; Plex renamed MKN Sans Arabic for the OFL (decision 0006) |
| #10 | `phase-1/routes-i18n` | All §5 routes × 2 locales, content collections, root language redirect, hreflang, sitemap, localised 404s; spike pages off production |
| #11 | `phase-1/layout-nav-footer` | 12-column grid, sticky nav + mobile menu, footer, page-weight budget, Lighthouse CI (decision 0007) |
| #12 | `phase-1/motion-controller` | ClientRouter (instant until Phase 2), G1 motion controller, footer Reduce motion control, base reveal; GSAP on first interaction (decision 0008) |
| #13 | `phase-1/provenance` | `assets` collection (§10.2), `npm run provenance` (exiftool check → records), `provenance:tag` for masters (decision 0009) |

Phase 1 founder decisions (26 Oct, decision 0005): ClientRouter in Phase 1; spike pages off production; Arabic as marked drafts; `/api/brief` as a small Worker entry; Cloudflare Stream; `makeena.studio` at launch; exiftool local.

## Phase 4 (studio and conversion), in progress

Founder decisions (27 Oct, decision 0018): Resend test sender until launch (`BRIEF_TO_EMAIL` = the Resend account's address); Cloudflare Web Analytics; briefs emailed and logged to D1.

| # | Branch | Scope |
|---|---|---|
| 1 | `phase-4/studio` | **In review.** Credentials line (draft from PRD facts), register as a `<table>`, night contact block (studio + home), JSON-LD Organization + ProfessionalService, home register summary |
| 2 | `phase-4/brief-form` | Form + ON AIR tally light; `/api/brief` Worker entry: Turnstile Siteverify → Resend → D1. Needs from the founder: Turnstile widget (site key + secret), Resend API key, D1 database (or approval to create it), `BRIEF_TO_EMAIL` |
| 3 | `phase-4/analytics` | Cloudflare Web Analytics beacon (needs the site token) |

**To resume:** after the founder reviews `phase-4/studio`, start `phase-4/brief-form` from `main`. Exit (PRD §17): a real test brief arrives by email from a preview deployment.

## Open questions for the founder

- Arabic names for the eight register services (The Twin … The Host), or keep the English brand names?
- Home `<title>`: "Makeena · Production studio and AI content consultancy, Doha". OK?
- Phase 4 facts: founder name and title, phone, email, full address, auditor, data statement (must cover the D1 brief log and its retention), final credential copy.
- Rights terms, the four gates (names, descriptions, and how they map to asset QA), and the copy marked `[PLACEHOLDER]` (`grep -rn PLACEHOLDER src/content design/renders/provenance.json`).
- 07 deliverables copy: four short paragraphs on what standing capacity delivers at months 00 / 06 / 14 / 24 (placeholders in `src/components/concepts/TimeLapse.astro`).
- Arabic labels in MKN Sans 500 (PRD §6.2) cost 37 KB per Arabic page; switching them to 400 is a lever if Arabic LCP matters more (decision 0010).

## Carry-over findings

- **Playwright's Windows WebKit crashes** after a routed view transition from a scrolled phone page (any CSS). Linux WebKit in CI is fine (decision 0011). Real iOS Safari doesn't crash (checked 26 Oct). Footer navigations in e2e use an in-place click.
- **WebKit never fetches a lazy image that was `display:none` at load** once shown: night variants switch to `loading="eager"` on activation (decision 0012).
- **iOS Safari passed** the real-iPhone checklist on 26 Oct 2026 (transitions, language switch, reduced motion, swipe-back, info sheet, scrolled-page footer tap). Re-run it whenever transitions change.
- **Fonts:** Arabic critical fonts are 118.5 KB, only 1.5 KB under budget. Amiri keeps only shadda, sukun and fathatan; a test fails if a headline uses another mark (decision 0006).
- **Lighthouse (lab, mobile):** LCP is 1.50 s on English pages and 2.55–2.70 s on Arabic ones, which are font-bound; Arabic is asserted at ≤ 2.8 s. The field target stays 2.5 s (decisions 0007, 0008).
- **Aerial frames (03):** budget about ≤ 60 KB/frame desktop, ≤ 25 KB mobile (AVIF q≈34, 4:2:0).
- **WebKit doesn't paint off-viewport elements into view-transition snapshots.** Draw the cut line on `::view-transition-group(cut-line)` itself. Re-verify under the router in Phase 2.
- **GSAP pins:** a reload while scrolled past a pinned section shifts content once. Create pins before restoring scroll. Effects needed before the first interaction (03's pin) import GSAP in their own page script (decision 0008).
- **Under the ClientRouter:** scripts run once per visit, so use `onPage()`. `<html>` attributes are replaced on every swap, so re-apply classes on `astro:after-swap`. Don't put `transition:animate` on `<html>` (it renames the root transition).
- **Localised 404s:** Cloudflare serves the nearest `404.html`; a build hook moves `/{lang}/404/index.html` to `/{lang}/404.html`. `astro preview` always serves the root 404.
- **Provenance:** `gatesCleared` is empty and `metadataRetained.iptc` false for every render until the gates are defined and the masters are tagged. `generator` must never be shown publicly without approval.
- **Placeholder copy:** lives in `src/content/` and `design/renders/provenance.json`. Arabic copy, alt text and captions are unreviewed drafts; the draft banner shows on every `/ar/` page until Phase 5.

## Environment gotchas

- `wrangler.jsonc` needs `"previews": {}` and `"preview_urls": true` (the config overrides the dashboard toggle). Preview URLs only appeared after the first production deploy.
- Cloudflare build logs are only in the dashboard. Wrangler isn't logged in on this machine, and Docker needs admin rights.
- Merge PRs with **"Create a merge commit"** and delete the branch.
- `npm run test:spikes` and `npm run build` both write `dist/`: never run them at the same time.
- Playwright's Windows WebKit can't decode AVIF (those spike tests skip).
- Version pins (26 Oct 2026): **TypeScript 6.0** (typescript-eslint and @astrojs/check don't support 7 yet); **eslint-plugin-jsx-a11y-x** (the original has no ESLint 10 support).
- Stylelint 17.16 crashes on `[attr] :global(x)`; the config ignores `:global` in that rule.
- Local tools: Python 3.14 with `fonttools[woff]` 4.62.1 (`npm run fonts:arabic`); exiftool 13.59 at `%LOCALAPPDATA%\Programs\ExifTool` (found automatically by `npm run provenance`); Lighthouse locally needs `CHROME_PATH` (Playwright's Chromium works).
- exiftool on Windows gets non-ASCII arguments in the ANSI code page; `provenance:tag` passes values through a UTF-8 argument file.
- Shell heredocs in this environment can mangle backslash escapes (`\u`, `\\`, `\n`) in generated source. Prefer code without escapes, or check the written file.
- `*.env` files are gitignored. A `makeena.env` appeared in the project folder on 26 Oct; it was never committed or pushed.
- `npm audit` reports undici advisories inside wrangler's bundled miniflare (dev only); wait for an upstream wrangler release.

## Phase 2 (global systems), complete

Founder decisions (26 Oct, decision 0010): generator hidden in the spec sheet; "Concept render · not yet through the gates" until gates exist; 13's toast at a fixed 21:40 AST; iPhone check before the transitions PR merges (borrowed phone or cloud device service); router fallback `swap`.

| # | Branch | Scope |
|---|---|---|
| 1 | `phase-2/provenance-figure` | **Merged (#14).** 08 `ProvenanceFigure`: popover spec sheet, corner brackets, captions, first images on pages, no-unlabelled-media test |
| 2 | `phase-2/transitions` | **Merged (#15).** 11 + 12 on the ClientRouter (decision 0011); Firefox project added. iPhone checklist passed 26 Oct (`docs/qa/ios-safari-checklist.md`) |
| 3 | `phase-2/after-hours` | **Merged (#16).** 13: `data-hours`, footer After hours + Keyboard shortcuts toggles, N / doha, night variant in `ProvenanceFigure`, crossfade, toast (decision 0012) |

Exit (PRD §17): the acceptance criteria in §8 are met, including real iOS Safari for G2.

## Phase 3 (section components), in progress

Founder decisions (26 Oct, decision 0013): generate missing frames in Higgsfield; 03 ships the Phase 0 placeholder sequence; 06 ships static until six layers exist; sun positions for 21 June 2026; hero video later.

| # | Branch | Scope |
|---|---|---|
| 1 | `phase-3/sun-study` | **Merged (#17).** `MatchedFrameScrubber` (continuous) + 04 on off-plan; generated MORNING and M00 frames |
| 2 | `phase-3/time-lapse` | **Merged (#18).** 07: discrete mode (radio-group thumbnails, wipe, live region), months 00/06/14/24; shared crossfade (decision 0014). Founder kept M00's white hoarding |
| 3 | `phase-3/aerial` | **Merged (#20).** 03: scroll mode (pinned canvas sequence, placeholder frames, CSS-reserved scroll distance), home three-still teaser, provenance record for the sequence (decision 0015) |
| 3b | `phase-3/aerial-night` | **Merged (#21).** Night keyframes `MKN-AER-FLT01-NIGHTA/B/C` (8.25 credits), night placeholder sequence at AVIF q28 (9.44 MB), the 13 swap mid-flight for the canvas, poster, sheet, thumbnails, stills and home teaser (decision 0016) |
| 4 | `phase-3/axonometric` | **Merged (#22).** 06 static: the exploded image, six labelled layers with leader lines (desktop), numbered legend (phones), `<ol>` describing the figure. Generated layers did not hold the camera (two attempts, 5.5 credits); real layers need the Blender route (decision 0017) |

Asset notes: the SUN-SKY01 set is 1800 × 771 (21:9), not 1800 × 1018 like the tower sets. Check a generated frame against its set (edge correlation, decision 0013) before using it. The Higgsfield CLI isn't signed in on this machine; the connected Higgsfield account works through the chat tools.

**Phase 3 is complete** apart from 06's animated version, which waits for layers rendered from one fixed camera (decision 0017).

Carry-over from 03: pinned sections reserve their scroll distance in CSS, pin with `pinSpacing: false` and are sticky until GSAP runs, so they need no early GSAP. Never request heavy media before the visitor interacts: Lighthouse counts requests started before the observed LCP as LCP dependencies. Reveal clears its transform (a transformed ancestor breaks a fixed pin).

Carry-over from 07: the shared crossfade lives in `src/lib/crossfade.ts` (use it for any same-document swap, never a raw `startViewTransition`). In Playwright, don't poll `document.getAnimations()` every frame during a view transition: it crashes Windows WebKit (decision 0014).
