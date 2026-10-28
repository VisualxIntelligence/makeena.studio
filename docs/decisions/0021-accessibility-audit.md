# 0021 — Accessibility audit (Phase 5, step 2)

**Date:** 28 October 2026 · **Phase:** 5 · **Status:** proposed (founder review)

PRD §3.3 / §14: WCAG 2.2 AA in both locales, zero critical axe issues, keyboard and screen-reader paths for every concept, 44 × 44 targets, visible focus.

## How

`npm run audit:a11y` (`tests/audit/`, Chromium, after `npm run build`) checks all 18 pages and prints the findings grouped by check. It covers what the CI axe run (one state, first paint) doesn't:

- **axe in more states:** after scrolling through (reveals done), after hours, a phone, and a phone with the menu open;
- **keyboard:** every Tab and Shift+Tab stop has a 2 px copper-deep ring (copper-light on the night contact block, where copper-deep is under 3:1), isn't covered by anything (2.4.11), and the order doesn't jump back up the page;
- **targets:** PRD 44 × 44 and WCAG 2.5.8 24 × 24 (inline links in text exempt);
- **reflow** at 320 px and at 200% zoom (640 px) (1.4.10), and **text spacing** (1.4.12);
- **structure:** one h1, no skipped heading levels, the four landmarks, labelled navs, alt text that says the image is generated.

It takes about 4 minutes, so it isn't in CI. The fixes below are guarded in CI by `tests/e2e/a11y-layout.spec.ts`; each of those tests was checked to fail without its fix.

## Found and fixed

| Finding | WCAG / PRD | Fix |
|---|---|---|
| The header bar overflowed at 320 px in both locales (~30 px): the page scrolled sideways on small phones and at 400% zoom | 1.4.10 | Below 24rem: tighter gaps and padding; the bar may wrap (actions on a second row) instead of overflowing. One row from 360 px |
| 03: the aerial figure's ⓘ button was painted under the canvas once a frame was drawn, focus ring included: a keyboard stop you couldn't see | 2.4.7, 2.4.11 | `.pfig__info` gets `z-index: 1` (above media drawn later in the figure) |
| The wordmark was 24 px tall; the header language switch 36 px wide; the footer language switch a bare 21 px inline link (the footer's 44 px rule was scoped and didn't reach the LanguageSwitch component); Entity 31–37 px wide; capability links 29 px tall | PRD 44 × 44 | Wordmark `inline-block` + `line-height: 44px`; 44 px minimum width on the language switches and footer links; capability links get 8 px block padding with a matching negative margin (layout unchanged) |
| Focus scrolling only cleared the sticky header for elements with an id (`[id] { scroll-margin }`); without it, Shift+Tab left the brief form's email field under the header | 2.4.11 | `html { scroll-padding-block-start }` (header height + 16 px; 104 px below 24rem, where the header may wrap) replaces the `[id]` rule and covers anchors and focus alike |

**No axe violations** in any state on any page, before or after. Headings, landmarks, alt text and tab order were already clean.

## Not issues

- Text-spacing "clipping" on `.visually-hidden` text and the brief form's honeypot: deliberate.
- 07's month radios are visually hidden; the label around each shows the focus ring (`:has(:focus-visible)`).
- Turnstile's widget: three tab stops whose focus styles are inside Cloudflare's iframe (a closed shadow root around it), outside our control.

## Gotchas

- The wordmark first used `inline-flex` for its 44 px height. That made Playwright's Windows WebKit crash after routed view transitions in 5 of 6 runs (`main`: 0 of 6; decision 0011's engine bug), so it's `inline-block` + `line-height`.
- **Playwright's WebKit leaves keyboard focus on the provenance buttons off-screen** (Tab and Shift+Tab, with or without scroll-padding; `focus()` does scroll; Chromium is fine). Possibly the Windows port only: check on real macOS Safari (Settings › Advanced › "Press Tab to highlight each item") in the cross-browser pass.

## Still to do

- Screen readers (PRD §14: VoiceOver on iOS and macOS, NVDA on Windows, both locales): `docs/qa/screen-reader-checklist.md`, for the founder or a tester.
