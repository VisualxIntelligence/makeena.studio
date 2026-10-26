# 0012 — 13 after hours

**Date:** 26 October 2026 · **Phase:** 2 · **Status:** accepted

## How it works (PRD §8.4)

- **State:** `data-hours="night"` on `<html>`.
  - The inline head script in `BaseLayout` sets it from `localStorage` (`mkn-hours`) before first paint, so night pages never flash day.
  - It re-applies it after every router swap (the router replaces `<html>` attributes), so it survives navigation and the language switch.
- **What changes:** only figures with a night variant. Today that's the home hero (`TWR-CAM01-DUSK` → `TWR-CAM01-NIGHT`). The site is not recoloured (tested: the page stays ivory). The aerial has no night renders yet (PRD §12.3).
- **`ProvenanceFigure night="…"`** renders a day and a night `ProvenanceVariant`, each with its own picture, ⓘ sheet and caption; CSS shows the active one.
  - The night picture is lazy and hidden until after hours, so it isn't fetched.
  - On activation it's switched to `loading="eager"`: **WebKit never fetches a lazy image that was `display:none` at load once it's shown** (found in testing).
- **Triggers:**
  - the footer **After hours** toggle (`aria-pressed`, primary);
  - **N**, and typing **doha** within 1.5 s per letter. Both match physical keys (`event.code`), so they work on an Arabic layout too.
  - Shortcuts are ignored in inputs, textareas, selects and contenteditable, with any modifier held, and on key repeat. A footer **Keyboard shortcuts** toggle turns them off, persisted as `mkn-shortcuts` (WCAG 2.1.4).
- **The swap:**
  - it waits for `motion.idle()`, so it never runs during a page transition;
  - it's a same-document `startViewTransition` with `html[data-vt="hours"]`: a 300 ms crossfade of the root, with the cut lines hidden;
  - under reduced motion or the footer **Reduce motion**, it's an instant swap with no view transition.
- **Toast:** `role="status"` region, always present, so the first message is announced. It reads `AFTER HOURS · THE CITY AT 21:40 AST`, a fixed time (decision 0010), with an Arabic draft. It has a Dismiss button, auto-dismisses after 4 s, and ignores pointer events when empty.
- **Without JS:** both toggles are hidden.

## Tests

`tests/e2e/hours.spec.ts`, all projects:
- footer toggle: night image visible and actually loaded; not fetched before activation; toast text; page colour unchanged
- persistence across router navigation, the language switch and a reload, with the attribute already set at `DOMContentLoaded`
- N and doha; no effect in a form field or with Alt/Shift; shortcuts off, remembered across a reload
- toast auto-dismiss and Dismiss
- crossfade when motion is allowed, no view transition under reduced motion
- no-JS state

## Test note

Footer-link navigations in the e2e suite use an in-place `.click()`. A real tap scrolls the page first, which crashes Playwright's **Windows** WebKit (decision 0011). Linux WebKit in CI passes the dedicated scrolled-phone test, and that test still uses a real click.
