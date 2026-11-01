# 0023 — NVDA pass (Phase 5)

**Date:** 1 November 2026 · **Phase:** 5 · **Status:** proposed (founder review)

PRD §14 asks for NVDA on Windows in both locales. `docs/qa/screen-reader-checklist.md` was run with NVDA 2026.2 and Chromium (Playwright's build), driven by Guidepup (`@guidepup/guidepup` 0.36.4, its portable NVDA build with a speech-capture add-on). Each check recorded what NVDA actually said. English ran on production and then on the fixed local build; Arabic ran on the fixed local build.

## Found and fixed

| Finding | Fix |
|---|---|
| **Focus on `<main>` reads the whole page as one phrase.** The skip link and every routed navigation focused `<main>`. NVDA then spoke all of main (on the home page, several thousand characters) before the reader could do anything | Focus goes to the page heading: the `h1` has `id="page-title" tabindex="-1"`, and the skip link points there. NVDA now says "main landmark, Four gates., heading, level 1" and reading continues from the heading. The PRD allows `<main>` or `h1` (§8); pages without one (spikes) fall back to `<main>` |
| **The provenance sheet (08) wasn't read when it opened.** Enter only said "expanded". The sheet sits after the figure's other content in the DOM, so reading on from the button went through the slider and thumbnails first | The sheet has `tabindex="-1" autofocus`: a popover's autofocus acts when it opens, so focus moves into the sheet and NVDA reads it in full. Escape closes it and focus returns to the button (now checked in `provenance.spec.ts`) |
| **Numbers ran into names.** NVDA got "01Foundations and basement" (06) and "01High approach" (03): Chromium drops plain spaces between flex and grid items | A visually hidden non-breaking space after the number. Now "01 Foundations and basement" |
| **The after-hours toast read its Dismiss button as part of the message** ("… 21:40 AST Dismiss") | `role="status"` moved from the toast to its text |

## Passed

- Skip link is the first thing read in both locales; the draft banner comes next on `/ar/`.
- Heading outline: one `h1` per page, sections as `h2`, no skipped levels (home, aerial, off-plan, standing, studio, both locales).
- Landmarks: banner, Primary navigation (التنقل الرئيسي), main, one region per section, content info, Footer navigation (تذييل الصفحة).
- Language switch: "عربي, link" on `/en/`; NVDA announces each change of language, so `lang` is right on the wordmark (`en`), the Arabic text and the English placeholders.
- 03: "Skip the flight" comes before the flight; the image has its description; the chapters are a list ("current step, 01 High approach").
- 04: the slider announces "17:30 Golden hour sun azimuth 291 degrees, altitude 11 degrees" and each arrow key reads the new value, in both locales.
- 06: the layer list is read in order, foundations to roof.
- 07: the months are a radio group ("MONTH 00 EMPTY PLOT, radio button, checked, 1 of 4"); arrow keys announce "Month 06 of 24". In Arabic, Right moves to the previous month, the browser's RTL behaviour, which matches the mirrored chronology.
- 13: the toggle announces "toggle button, not pressed" and keeps focus; switching on is announced by the toast.
- Studio: the register is a table ("8 rows and 2 columns"), rows and columns announced while moving through it; every form field announces its label and required state, Company says "(optional)"; submitting empty announces "Please check the highlighted fields." and focus moves to Name ("invalid entry, Please fill this in.").

## Minor, not changed

- "Skip the flight" lands on an empty target, so NVDA says "blank" before reading on to the next heading. A visible "end of the flight" target would need new copy in both languages.
- Tabbing into the Engagement radios announces only the group ("Engagement, grouping"), not the checked option. Focused directly, the option reads correctly ("Not sure, radio button, checked, 3 of 3"). This looks like NVDA with Chromium; check by hand.
- Turnstile reads as "Studio Makeena, document" with Cloudflare's links; the check passed without interaction. Cloudflare's widget, not ours.

## Limits of this run

- **No Arabic voice.** The portable NVDA build has no Arabic synthesiser, so it says "Arabic (not supported)" where the language changes. The text NVDA receives is right, but how it sounds, including Latin IDs and Western digits read inside Arabic, needs NVDA with an Arabic voice (eSpeak NG Arabic or a OneCore Arabic voice), or a native listener.
- **Chromium only.** Firefox with NVDA wasn't run.
- **Automation safety.** Guidepup sends keys to whichever window is in front. Playwright reports `document.hasFocus()` as true even when the browser is behind another window, so that check can't guard a run. One Arabic run sent about ten keys to a mail client before the browser came back to the front (no deletions or typing). A future automated run should confirm the foreground window through NVDA itself (NVDA+T reads the window title) before each key, on a machine nobody is using.
