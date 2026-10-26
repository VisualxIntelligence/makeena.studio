# Progress: makeena.studio

_Last updated: 26 October 2026_

## Where we are

**Phase 0 (de-risk spikes) is complete and merged to `main`.** Phase 1 (foundation) is in progress: PRs #6–#11 are merged; `phase-1/motion-controller` is in review. The seven Phase 1 decisions are made (decision 0005).

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

- ~~Arabic fonts over budget~~ Fixed in `phase-1/arabic-fonts` (decision 0006): critical 118.5 KB, only 1.5 KB headroom. Amiri keeps only shadda, sukun and fathatan; a test fails if a headline uses another mark.
- Aerial frames: budget about **≤ 60 KB/frame desktop, ≤ 25 KB mobile** (AVIF q≈34, 4:2:0). The PRD's q50 gave 20 MB.
- **WebKit doesn't paint off-viewport elements into view-transition snapshots.** Draw the cut line on `::view-transition-group(cut-line)` itself. Re-verify under ClientRouter.
- Astro's automatic font fallbacks are tuned to Latin metrics; they're off for the Arabic faces.
- GSAP pin caveat: a reload while scrolled past a pinned section shifts content once. G1 should create pins before restoring scroll position.

- Placeholder copy: every `[PLACEHOLDER: …]` lives in `src/content/` (`grep -rn PLACEHOLDER src/content`). Arabic page copy, nav strings and register keys are unreviewed drafts; the draft banner shows on every `/ar/` page until Phase 5. Register service names (The Twin … The Host) are English in both locales pending Arabic names.
- Lighthouse asserts Arabic LCP at ≤ 2.8 s in the lab (font-bound under simulated throttling), English at ≤ 2.5 s; see decision 0007. Field target stays 2.5 s.
- Under the ClientRouter, scripts run once per visit: use `onPage()`; `<html>` attributes are replaced on every swap (re-apply classes on `astro:after-swap`). Don't put `transition:animate` on `<html>` (renames the root transition). `npm run test:spikes` and `npm run build` both write `dist/`: never run them at the same time.
- Localised 404s: Cloudflare serves the nearest `404.html`; an Astro build hook moves `/{lang}/404/index.html` to `/{lang}/404.html`. `astro preview` always serves the root 404, so check `/ar/404.html` directly locally.

### Environment gotchas

- `wrangler.jsonc` needs `"previews": {}` (or `wrangler preview` fails) and `"preview_urls": true`. Wrangler defaults it to false, and the config overrides the dashboard toggle.
- Preview URLs only appeared after the Worker had its first production deploy.
- Playwright's Windows WebKit can't decode AVIF, so those tests skip there and the stills-fallback test covers it.
- Cloudflare build logs are only in the dashboard. Wrangler isn't logged in on this machine, and Docker needs admin rights.
- Merge stacked PRs with **"Create a merge commit"** (not squash) and delete the branch, so the next PR retargets to `main`.
- Tooling version pins (26 Oct 2026): **TypeScript 6.0** (7.0 is `latest`, but typescript-eslint and @astrojs/check don't support it yet); **eslint-plugin-jsx-a11y-x** instead of eslint-plugin-jsx-a11y (no ESLint 10 support). Revisit both when upstream catches up.
- Stylelint 17.16 crashes on `[attr] :global(x)` in `selector-pseudo-class-no-unknown`; the config ignores `:global` to avoid it.
- Python 3.14 with `fonttools[woff]` 4.62.1 is installed for `npm run fonts:arabic`.
- exiftool 13.59 is installed at `%LOCALAPPDATA%\Programs\ExifTool` (on the user PATH; open a new terminal to pick it up).
- Font faces are exposed as `--ff-*` by Astro's Fonts API and mapped to Tailwind's `--font-*` roles in `global.css`; `:lang(ar)` swaps the roles to the Arabic faces.
- `npm audit` reports undici advisories inside wrangler's bundled miniflare (dev-only, local). The suggested fix downgrades wrangler; wait for an upstream wrangler release.

## Next: Phase 1 (foundation), pending approval

Exit criteria (PRD §17): both locales build and deploy; every §5 route exists with placeholder content; CI green. Estimate 6–8 days.

| # | Branch | Scope |
|---|---|---|
| 1 | `phase-1/tooling` | **Merged (#6).** ESLint, Prettier, Stylelint (no gradients / backdrop-filter / physical left-right), Vitest, Playwright matrix, axe, GitHub Actions CI |
| 2 | `phase-1/tokens-type` | **Merged (#8).** Tailwind v4 `@theme` tokens, both-script typography, contrast test, Tailwind class linter |
| 2b | `phase-1/arabic-fonts` | **Merged (#9).** Arabic subsets: critical fonts on `/ar/` 147.8 → 118.5 KB (decision 0006) |
| 3 | `phase-1/routes-i18n` | **Merged (#10).** All §5 routes × 2 locales, content collections, i18n helpers, Arabic-preference root redirect, hreflang/canonical, sitemap, localised 404, spike pages removed from production |
| 4 | `phase-1/layout-nav-footer` | **Merged (#11).** 12-column grid, sticky nav + mobile menu, footer, page-weight budget, Lighthouse CI (decision 0007). Footer toggles come with 13 in Phase 2 |
| 5 | `phase-1/motion-controller` | **In review.** ClientRouter on every page (instant until Phase 2), G1 `src/lib/motion/`, footer Reduce motion control, base reveal; GSAP loads on first interaction (decision 0008) |
| 6 | `phase-1/provenance` | §10.2 schema + `scripts/provenance/` (exiftool → JSON), seeded from `design/renders/manifest.json` |
| 7 | decision record | Done: `docs/decisions/0005` (Worker entry for `/api/brief`) |

### Phase 1 decisions (founder, 26 Oct 2026: all recommended, decision 0005)

1. ClientRouter added in Phase 1 (G1 built on its lifecycle).
2. Spike pages removed from production in PR 3; spike code kept for Phase 3.
3. Arabic placeholder copy as marked drafts ("AR DRAFT · NOT REVIEWED").
4. `/api/brief` as a small Worker entry; the site stays fully static.
5. Cloudflare Stream for the hero video (Phase 3).
6. Domain `makeena.studio`, attached at launch.
7. exiftool installed locally; its JSON output is committed.

**To resume:** merge `phase-1/motion-controller`, then continue with `phase-1/provenance` (PR 6: §10.2 schema + `scripts/provenance/` exiftool → JSON, seeded from `design/renders/manifest.json`). That is the last Phase 1 PR.
