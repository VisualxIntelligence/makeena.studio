# 0001 — Astro 7 and a static-assets-only Worker

**Date:** 25 October 2026 · **Phase:** 0 · **Status:** accepted (founder may override)

## Context

The PRD (§11.1) names Astro 6 but also says to confirm the current stable version at install time. On 25 October 2026 the npm `latest` tag for `astro` is **7.4.2**.

## Decision

- Use **Astro 7** (`^7.4.2`). Static output, built-in i18n with `prefixDefaultLocale: true`.
- `redirectToDefaultLocale` is **off**. Astro's built-in root redirect uses a 2-second meta refresh and conflicts with a custom `src/pages/index.astro`. The root page is ours instead: an instant redirect to `/en/` for now, with the Arabic browser-preference redirect and persisted choice added in Phase 1 (PRD §5).
- `wrangler.jsonc` is **static-assets only** (no `main`), `assets.directory: "./dist"`, `not_found_handling: "404-page"`. Phase 1 decides between the Astro Cloudflare adapter and a small Worker entry for `/api/brief` (PRD §11.3).

## Consequences

- CLAUDE.md and the PRD still say "Astro 6"; treat that as "current stable Astro". Update the PRD wording when convenient.
- Versions pinned at install: astro 7.4.2, wrangler 4.152.0.
