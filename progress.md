# Progress: makeena.studio

_Last updated: 26 October 2026_

## Where we are

**Phase 0 (de-risk spikes) is complete and merged to `main`.** Phase 1 (foundation) has started: PR 1 `phase-1/tooling` is open for review. PRs 2–7 still wait on the founder's answers to the seven decisions below (PR 1 doesn't depend on them).

- Production (`main`): https://makeena-website.makeena.workers.dev (scaffold + spike pages, noindex)
- Branch previews: `https://<branch-name-with-dashes>-makeena-website.makeena.workers.dev`, e.g. `phase-1-tooling-makeena-website…`. Cloudflare also posts a per-commit URL on each PR.

## Phase 0 summary

| PR | Branch | Result |
|---|---|---|
| #1 | `phase-0/scaffold` | Astro 7 (not 6, see decision 0001), `/en/` + `/ar/`, `wrangler.jsonc` |
| #2 | `phase-0/aerial-sequence-spike` | 03 canvas sequence: decode window capped at 25 frames, 60 fps at 4× CPU slowdown, GSAP pin with 0 load CLS |
| #3 | `phase-0/section-cut-spike` | 11 section-cut: correct sweep direction per locale in Chromium + WebKit |
| #4 | `phase-0/mirror-line-spike` | 12 language switch + self-hosted fonts: CLS ≤ 0.0007 (target 0.1) |

Write-ups: `docs/decisions/0001`–`0004`. 47 Playwright tests (`npm run build && npm run test:e2e`).

**Device testing:** the founder checked Android and desktop, both fine. **iOS Safari has not been tested (no iPhone).** It is deferred and must happen before the Phase 2 transitions merge (borrowed phone or BrowserStack/LambdaTest).

### Founder decisions made (25 Oct 2026)

- **Astro 7** (current stable) instead of the 6 the PRD names.
- **Astro `<ClientRouter />`** so Firefox animates too. It replaces native cross-document view transitions in every browser (decision 0002; PRD and CLAUDE.md updated).
- **GSAP `pin: true`** for pinned sections (not CSS sticky).
- **No WebP frame sequence:** AVIF only; browsers without AVIF get the stills (PRD §9.2 updated).

### Carry-over findings for later phases

- **Arabic fonts are over budget:** ~290 KB on `/ar/` vs 120 KB (Amiri's Arabic subset alone is 108 KB). They need glyph-level subsetting (Phase 1).
- Aerial frames: budget about **≤ 60 KB/frame desktop, ≤ 25 KB mobile** (AVIF q≈34, 4:2:0). The PRD's q50 gave 20 MB.
- **WebKit doesn't paint off-viewport elements into view-transition snapshots.** Draw the cut line on `::view-transition-group(cut-line)` itself. Re-verify under ClientRouter.
- Astro's automatic font fallbacks are tuned to Latin metrics; they're off for the Arabic faces.
- GSAP pin caveat: a reload while scrolled past a pinned section shifts content once. G1 should create pins before restoring scroll position.

### Environment gotchas

- `wrangler.jsonc` needs `"previews": {}` (or `wrangler preview` fails) and `"preview_urls": true`. Wrangler defaults it to false, and the config overrides the dashboard toggle.
- Preview URLs only appeared after the Worker had its first production deploy.
- Playwright's Windows WebKit can't decode AVIF, so those tests skip there and the stills-fallback test covers it.
- Cloudflare build logs are only in the dashboard. Wrangler isn't logged in on this machine, and Docker needs admin rights.
- Merge stacked PRs with **"Create a merge commit"** (not squash) and delete the branch, so the next PR retargets to `main`.
- Tooling version pins (26 Oct 2026): **TypeScript 6.0** (7.0 is `latest`, but typescript-eslint and @astrojs/check don't support it yet); **eslint-plugin-jsx-a11y-x** instead of eslint-plugin-jsx-a11y (no ESLint 10 support). Revisit both when upstream catches up.
- Stylelint 17.16 crashes on `[attr] :global(x)` in `selector-pseudo-class-no-unknown`; the config ignores `:global` to avoid it.
- `npm audit` reports undici advisories inside wrangler's bundled miniflare (dev-only, local). The suggested fix downgrades wrangler; wait for an upstream wrangler release.

## Next: Phase 1 (foundation), pending approval

Exit criteria (PRD §17): both locales build and deploy; every §5 route exists with placeholder content; CI green. Estimate 6–8 days.

| # | Branch | Scope |
|---|---|---|
| 1 | `phase-1/tooling` | **In review.** ESLint, Prettier, Stylelint (no gradients / backdrop-filter / physical left-right), Vitest, Playwright matrix, axe, GitHub Actions CI |
| 2 | `phase-1/tokens-type` | Tailwind v4 `@theme` tokens, both-script typography, contrast test, Arabic font subsetting |
| 3 | `phase-1/routes-i18n` | All §5 routes × 2 locales, content collections, i18n helpers, Arabic-preference root redirect, hreflang/canonical, sitemap, localised 404, spike pages removed from production |
| 4 | `phase-1/layout-nav-footer` | BaseLayout, 12-col grid, section labels, Nav + mobile menu, skip link, Footer (toggles inert until Phase 2) |
| 5 | `phase-1/motion-controller` | G1 `src/lib/motion/`, built around the ClientRouter lifecycle |
| 6 | `phase-1/provenance` | §10.2 schema + `scripts/provenance/` (exiftool → JSON), seeded from `design/renders/manifest.json` |
| 7 | decision record | `/api/brief`: Astro Cloudflare adapter vs a small Worker entry |

### Open decisions (recommendation first)

1. **ClientRouter timing:** add it in Phase 1 so all scripts use its lifecycle from day one (Phase 2 adds only the animations).
2. **Spike pages:** remove from production in PR 3; keep `src/spikes/` code and placeholder frames for Phase 3.
3. **Arabic placeholder copy:** marked drafts ("AR DRAFT · NOT REVIEWED"), not `[PLACEHOLDER]` markers.
4. **Form back end:** small Worker entry (site stays fully static).
5. **Hero video:** Cloudflare Stream rather than Mux (needed in Phase 3).
6. **Domain:** confirm `makeena.studio`; keep it unattached until launch.
7. **exiftool:** OK to install locally (`winget install OliverBetz.ExifTool`); its output is committed, so CI doesn't need it.

**To resume:** review and merge PR 1 (`phase-1/tooling`), answer the seven decisions (e.g. "all recommended"), then continue with `phase-1/tokens-type`.
