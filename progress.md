# Progress: makeena.studio

_Last updated: 26 October 2026_

## Where we are

**Phase 0 (de-risk spikes) and Phase 1 (foundation) are complete and merged.** Phase 2 (global systems) is in progress: PR 1 `phase-2/provenance-figure` (08) is in review.

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

## Open questions for the founder

- Arabic names for the eight register services (The Twin … The Host), or keep the English brand names?
- Home `<title>`: "Makeena · Production studio and AI content consultancy, Doha". OK?
- Rights terms, the four gates (names, descriptions, and how they map to asset QA), and the copy marked `[PLACEHOLDER]` (`grep -rn PLACEHOLDER src/content design/renders/provenance.json`).
- Arabic labels in MKN Sans 500 (PRD §6.2) cost 37 KB per Arabic page; switching them to 400 is a lever if Arabic LCP matters more (decision 0010).

## Carry-over findings

- **iOS Safari has not been tested (no iPhone).** It must happen before the Phase 2 transitions merge (borrowed phone or BrowserStack/LambdaTest).
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

## Phase 2 (global systems), in progress

Founder decisions (26 Oct, decision 0010): generator hidden in the spec sheet; "Concept render · not yet through the gates" until gates exist; 13's toast at a fixed 21:40 AST; iPhone check before the transitions PR merges (borrowed phone or cloud device service); router fallback `swap`.

| # | Branch | Scope |
|---|---|---|
| 1 | `phase-2/provenance-figure` | **In review.** 08 `ProvenanceFigure`: popover spec sheet, corner brackets, captions, first images on pages, no-unlabelled-media test |
| 2 | `phase-2/transitions` | 11 section-cut + 12 mirror-line on the ClientRouter; iPhone check required before merge |
| 3 | `phase-2/after-hours` | 13: `data-hours`, footer After hours + Keyboard shortcuts toggles, N / "doha", night `<picture>` swap, toast |

Exit (PRD §17): the acceptance criteria in §8 are met.

**To resume:** merge `phase-2/provenance-figure`, then start `phase-2/transitions`.
