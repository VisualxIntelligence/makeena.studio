# Screen-reader check (Phase 5 accessibility audit)

**Result:** not run yet.

**Why:** PRD §14 asks for VoiceOver (iOS and macOS) and NVDA (Windows) in both locales. The automated audit (decision 0021) covers axe, keyboard order, focus visibility, target sizes, reflow and text spacing, but only a person can hear whether the site makes sense read aloud.

**What you need:** one of these, about 20 minutes per screen reader:
- **iPhone:** Settings › Accessibility › VoiceOver (triple-click the side button to toggle it once you set Accessibility Shortcut). Swipe right to move, double-tap to activate, rotor (two-finger twist) › Headings to jump between headings.
- **Mac:** Cmd+F5 starts VoiceOver in Safari. VO = Ctrl+Option. VO+→ moves, VO+Space activates, VO+U opens the rotor (headings, links, landmarks).
- **Windows:** NVDA (free, nvaccess.org) with Firefox or Chrome. ↓ reads on, H jumps to the next heading, D to the next landmark, Tab to the next control, Enter / Space activates.

**Where:** production, https://makeena-website.makeena.workers.dev/en/ and `/ar/`. Do every item in English, then the pages marked **(ar)** in Arabic.

Tick each box and note anything that's confusing, read twice, skipped, or read in the wrong language.

## Every page

- [ ] The first thing read is the **Skip to content** link; activating it jumps to the page heading.
- [ ] Headings are a sensible outline: one main heading, then sections (rotor / H).
- [ ] Landmarks: banner, **Primary** navigation, main, **Footer** navigation, content info.
- [ ] **(ar)** Arabic text is read with an Arabic voice; IDs and numbers (QFC 04998, asset IDs, phone) are read as Latin/Western digits, not garbled.
- [ ] The language switch announces its target language ("عربي" in Arabic, "English" in English).

## Concepts

- [ ] **03 aerial** (`/en/capability/aerial-perspective/`): **Skip the flight** is offered before the flight; the flight image has a description; its chapter captions are read as text.
- [ ] **04 sun study** (`/en/capability/off-plan-visualisation/`): the slider announces a time with "golden hour" style wording and the sun's azimuth/altitude; arrow keys (or swipe up/down on iPhone) change it and each value is read.
- [ ] **07 time-lapse** (`/en/capability/standing-production/`): the months are a radio group; choosing one announces "Month 14 of 24" (or similar).
- [ ] **06 axonometric**: the layer list is read in order, foundations to roof.
- [ ] **08 provenance:** on any image, the **Provenance: MKN-…** button opens a sheet that is read in full; Escape (or Close) closes it and focus returns to the button.
- [ ] **13 after hours** (footer): the toggle announces on/off; switching it doesn't move focus.

## Studio and the brief form (`/en/studio/`, then **(ar)**)

- [ ] The register table is read as a table (row and column headers announced).
- [ ] Each form field announces its label; Company says it's optional.
- [ ] Submit with Name empty: the error is announced and focus moves to Name.
- [ ] The Turnstile check is announced and can be completed (it's Cloudflare's widget, so note any trouble rather than fixing it).
- [ ] *(Optional, sends a real email.)* A complete brief announces **BRIEF RECEIVED · REF …**.

**Send back:** which screen reader and browser, "all ticked", or the unticked items with notes.
