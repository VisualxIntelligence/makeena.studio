# 0020 — Cloudflare Web Analytics

**Date:** 28 October 2026 · **Phase:** 4 · **Status:** proposed (founder review)

Decision 0018 chose Cloudflare Web Analytics: free, cookieless, no consent banner. The founder added the site `makeena-website.makeena.workers.dev` in the dashboard (Web Analytics → Add a site) and supplied its token, which is public.

## How it works

- **`src/lib/analytics/`**, imported by BaseLayout's router script:
  - `hosts.ts` maps hostnames to site tokens;
  - `index.ts` adds Cloudflare's beacon (`static.cloudflareinsights.com/beacon.min.js`, as a module) once per visit.
- **Routed navigations are counted by the beacon itself.** It follows the Navigation API or `pushState` (on by default), so nothing hooks the ClientRouter.
- **Production hostname only.** A site matches hostnames by suffix, so this token would also accept every branch preview (`<branch>-makeena-website.makeena.workers.dev`). Only the exact production hostname loads the beacon:
  - founder reviews on previews aren't counted;
  - nothing loads on `localhost`, so CI's e2e and Lighthouse runs are unaffected.
- **No page weight.** The beacon is third-party and loads after the page's own script, so it isn't in the `dist/` budget. Ad blockers often block it, so numbers will run low.

## At launch

- `makeena.studio` doesn't match this site. Add it as a second site in Web Analytics and put its token in `hosts.ts`.
- The privacy page / data statement should say the site uses Cloudflare Web Analytics (cookieless, no personal data). The copy is the founder's to supply.

## Verifying

Previews don't load the beacon, so verify on production after merging:

1. Open https://makeena-website.makeena.workers.dev/en/ with DevTools → Network. `beacon.min.js` loads, and a request to `cloudflareinsights.com/cdn-cgi/rum` is sent on navigation or when leaving the page.
2. Visits appear in the dashboard (Web Analytics → the site) within a few minutes.
