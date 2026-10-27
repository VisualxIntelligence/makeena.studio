# Makeena Studio Website — Product Requirements Document

| | |
|---|---|
| **Product** | makeena.studio, the bilingual (English / Arabic) website for Makeena |
| **Owner** | Ahmed, founder |
| **Version** | 1.0 (draft for build) |
| **Date** | 25 October 2026 |
| **Status** | Approved concepts; build not started |
| **Readers** | Claude Code (primary builder), the founder, any future developer or motion designer |

**Precedence.** When documents disagree: the founder's instructions in a session, then this PRD, then `docs/reference/homepage-ux.md`, then everything else. If something here is ambiguous or seems wrong, stop and ask rather than guess. Items marked **[DECISION]** or **[PLACEHOLDER]** are open; do not invent content for them.

---

## 1. Summary

Makeena is a Doha-based production studio and AI content consultancy (Media City Qatar, QFC licence 04998). It produces generated aerials, off-plan architectural visualisation and standing content capacity for real estate developers and corporate clients in Qatar, the UAE and Saudi Arabia.

The website has to prove the service rather than describe it. The imagery is the product, and the method (four quality gates, provenance metadata on every asset) is the differentiator. The site is an editorial, ivory-and-copper, multi-page Astro site with nine interactive concepts. Each concept appears once, where it demonstrates a service, so the site reads as a studio's portfolio of capability, not a demo reel.

The founder must not appear in photographs anywhere on the site.

## 2. Background

### 2.1 Positioning (from the company brief)

- **Buyer:** marketing and brand leads at real estate developers (Qatar, UAE, KSA) and corporate clients.
- **Gap:** elite visualisation studios are slow; volume social agencies are below standard. Makeena sits between them: "A broadcast studio that works at the speed of a content team. A content partner that finishes to the standard of a broadcast studio."
- **Services:** two lead services (aerial perspective and off-plan visualisation), plus standing production. Eight further services sit inside a retained engagement: The Twin, The Velocity, The Launch, The Marquee, The Stage, The Season+, The Pipeline, The Host.
- **Method:** four gates. Nothing reaches a client that has not cleared all of them. Provenance metadata is retained on all delivered assets.
- **Engagement:** two ways in. Fixed (event-triggered package) and Retained (standing capacity). Exclusions are published rather than discovered.
- **Languages:** English and Arabic (MSA or Gulf).
- **Credentials:** founder with twenty years in broadcast (Al Jazeera, ABC); every engagement runs on a written runbook with a second senior producer on call; corporate register (legal entity, licence, tax ID, address, auditor, data, languages, rights) shown openly.

### 2.2 Why these concepts

The founder reviewed 14 concepts (storyboards on the private "Makeena Site Concepts" design canvas in claude.ai) and selected nine. Their numbering is kept throughout this document and in code comments, branch names and commits so everyone can refer to them unambiguously.

| # | Concept | Role |
|---|---|---|
| 03 | Scroll-flown aerial | Section component: proves generated aerials |
| 04 | Sun study slider | Section component: proves "any hour, any light" |
| 06 | Exploded axonometric | Section component: speaks to engineering clients |
| 07 | Construction time-lapse | Section component: illustrates standing production over a project's life |
| 08 | Provenance HUD | Global system: every image carries its provenance sheet |
| 11 | Section-cut page transition | Global system: page-to-page navigation |
| 12 | Mirror-line language switch | Global system: EN ⇄ AR |
| 13 | Night mode easter egg ("after hours") | Global system: hero and aerial imagery switch to night |
| 14 | Studio without a portrait | Page: studio, credentials, corporate register, brief form |

Not selected, and out of scope unless the founder asks: 01 plot-to-tower reveal, 02 assembly by gate, 05 masterplan register, 09 drafting linework (as an effect; hairline rules remain part of the design system), 10 surveyor cursor.

## 3. Goals, non-goals and success measures

### 3.1 Goals

1. A qualified marketing or brand lead sends a brief or books a call.
2. A procurement or legal reader can verify the entity in under 30 seconds from any page.
3. Each lead service is demonstrated by an interactive piece of real work, not just claimed.
4. Arabic is a first-class edition, equal in structure and quality to English.
5. Fast and accessible on a mid-range phone, including every effect's fallback.

### 3.2 Non-goals (do not build)

- Client logo strip (until three or more real clients agree), pricing, testimonials, blog or news, client login, newsletter, chat widget.
- WebGL / Three.js at launch (only if a real GLB/BIM model becomes available; see §9.4).
- A light/dark theme toggle. "After hours" (13) is the only alternate state.
- Smooth-scroll hijacking (Lenis, Locomotive). Native scroll only.
- Any photograph or likeness of the founder.

### 3.3 Success measures

| Measure | Target |
|---|---|
| Brief form submissions + call bookings | Tracked from launch; baseline set in first 60 days **[DECISION: analytics tool]** |
| Time to find licence and legal entity from home | ≤ 30 s, ≤ 2 interactions (footer "Entity" link) |
| Core Web Vitals (field, p75, both locales) | LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 |
| Accessibility | WCAG 2.2 AA; zero critical axe issues; full keyboard and screen-reader paths for every concept |
| Locale parity | Every EN route has an AR counterpart with reviewed copy before launch |

## 4. Audience and key journeys

| Persona | Arrives via | Needs | Journey |
|---|---|---|---|
| Marketing / brand lead, developer (primary) | Referral, LinkedIn, search | Evidence of quality and speed, how to engage | Home → capability page (03/04/06/07) → Engagement → brief form |
| Procurement / legal reviewer | Link in a proposal or email | Entity, licence, tax ID, auditor, rights, data handling | Any page → footer "Entity" → `/studio/#register` |
| Arabic-first decision maker | Same, on `/ar/` | The same evidence in Arabic, correct RTL | Mirrors the primary journey on `/ar/` |
| Mobile visitor (any of the above) | Messaging apps | Fast load, readable, tappable | Lighter sequences, stills fallback, 44 px targets |

## 5. Information architecture

All routes exist in both locales with identical slugs: `/en/...` and `/ar/...` (`prefixDefaultLocale: true`). `/` redirects to `/en/` (or `/ar/` when the browser's preferred language is Arabic) and the choice persists.

| Route | Purpose | Concepts | Key content |
|---|---|---|---|
| `/{lang}/` | Home | 08, 11, 12, 13 global; 03 as a 3-still teaser | Hero, position statement, three capability teasers, method summary, engagement summary, studio/register summary, contact |
| `/{lang}/capability/` | Capability index | 08 | Three lead services + the full register of eight |
| `/{lang}/capability/aerial-perspective/` | Generated aerials | **03** (full) | The flight, the "no aircraft, no flight window" argument |
| `/{lang}/capability/off-plan-visualisation/` | Visualisation and engineering | **04**, **06** | Sun study, exploded axonometric |
| `/{lang}/capability/standing-production/` | Retained, standing capacity | **07** | Month 00/06/14/24 time-lapse and what each phase delivers |
| `/{lang}/method/` | Four gates + provenance | 08 explained | The gates, what provenance metadata contains, how to verify a file |
| `/{lang}/engagement/` | Fixed vs Retained | — | Two columns, two CTAs, published exclusions |
| `/{lang}/studio/` | Studio | **14** | Studio photography, credentials, corporate register (`#register`), brief form (`#brief`) |
| `/{lang}/privacy/` | Privacy and data | — | **[PLACEHOLDER: privacy text]** |
| `/404` | Not found | 11 | Localised |

Navigation (per the UX doc): wordmark · Capability · Method · Engagement · Studio · EN/عربي · **Send a brief**. "Send a brief" goes to `/{lang}/studio/#brief`. Engagement CTAs go to the same form with the engagement type pre-selected via a query-free anchor and in-page state (e.g. `#brief-fixed`, `#brief-retained`).

Footer on every page: `MAKEENA LLC · QFC LICENCE 04998 · TIN T04998`, an **Entity** link to `/{lang}/studio/#register`, language switch, keyboard-shortcuts on/off (see 13), after-hours on/off, ©.

This IA merges the research's separate `/provenance/` page into `/method/`, and names capability pages after the brief's service names. Flag it if that causes problems.

## 6. Design system

The design extends the company brief's own document style. Tokens are final unless the founder changes them. Full rationale is in `docs/reference/homepage-ux.md` §2.

### 6.1 Colour tokens

| Token | Hex | Use |
|---|---|---|
| `ivory` | `#F6F2EA` | Page ground |
| `sand` | `#EFEAE1` | Panels |
| `ink` | `#1A1A1A` | Text, rules |
| `copper` | `#B4653A` | Rules, large display accents, text ≥ 24 px only (3.9:1 on ivory) |
| `copper-deep` | `#9A522C` | Small text, mono labels, links, focus rings (5.2:1) |
| `muted` | `#5C5650` | Secondary text (6.5:1) |
| `night` | `#141414` | Dark blocks, overlays, after-hours ground |
| `copper-light` | `#C8A27A` | Labels on night only |

Rules: copper is the only chromatic colour. No gradients, no `backdrop-filter`, no glassmorphism, no shadows on cards, border radius ≤ 2 px. Enforce with a Stylelint rule banning `*-gradient(` and `backdrop-filter`, and a CI contrast test over every text/background pair used.

### 6.2 Typography

| Role | Latin | Arabic |
|---|---|---|
| Display | Cormorant Garamond 400/500, `clamp(2.5rem, 6vw, 5.5rem)`, lh 1.05, ls −0.01em, sentence case with full stops | Amiri 400, lh 1.3–1.4, no letter-spacing |
| Body | Inter 400/500, 17–18 px desktop, ≥ 16 px mobile, lh 1.6, 60–70ch | IBM Plex Sans Arabic 400/500, ~8% larger |
| Labels / metadata | JetBrains Mono 500, 11–12 px, uppercase, ls 0.14em | IBM Plex Sans Arabic 500 at the same size, no uppercase, no letter-spacing |

Self-host all fonts as WOFF2 subsets with `font-display: swap` and metric-matched fallbacks (`size-adjust`, `ascent-override`). Load Arabic faces only on `/ar/` routes. Select fonts with `:lang(ar)`.

### 6.3 Layout

- 12-column grid, 1280 px max content width, 24 px gutters (16 px mobile).
- 8 px vertical rhythm; section padding 96–128 px desktop, 64 px mobile.
- Hairline rules (`1px` ink or ink at 15%) are the main structural device.
- Every section starts with a mono section label top-start, e.g. `03 · CAPABILITY`. Numbers are Western digits in both locales.
- CSS logical properties only (`margin-inline-start`, `inset-inline-end`, `text-align: start`). No physical `left`/`right` in component CSS except where a component is deliberately direction-locked (see §7.2).
- Z-index scale: nav 30, menu overlay 40, popovers 45, toast 50.

### 6.4 Motion principles

- One motion system (GSAP + ScrollTrigger) with one reduced-motion switch (§8.1).
- Base reveal: opacity 0→1 and translateY 12 px→0, 300 ms, ease-out, 60 ms stagger. Content must be visible without JS.
- Micro-interactions: colour transitions 200 ms. Focus ring 2 px `copper-deep`, 2 px offset, always visible.
- No scale-on-hover, no parallax on text, no looping animation except the hero film.
- Arabic text is never split into characters for animation. Animate whole lines or blocks.

### 6.5 Iconography

Only inline SVG arrows, menu, close and the ⓘ provenance mark. No emoji, no icon fonts. Directional arrows flip with `dir`.

## 7. Bilingual and RTL requirements

### 7.1 General

- `<html lang dir>` set per route at build time (`en`/`ltr`, `ar`/`rtl`).
- `hreflang` alternates for `en`, `ar` and `x-default` on every page; canonical per locale.
- Language choice persists (cookie or `localStorage`) and the switch links to the counterpart route, preserving the current section via `#section-id`.
- The switch label is written in the target language and marked up with its own `lang` (`<a lang="ar" hreflang="ar">عربي</a>`).
- Identifiers use Western digits in both locales: section numbers, asset IDs, licence and tax numbers, timecodes, coordinates, phone numbers, months in 07. Format times with `Intl.DateTimeFormat('ar-u-nu-latn', …)`.
- Wrap identifiers, phone numbers, emails and URLs in `dir="ltr"` (or `<bdi>`) inside Arabic text.
- All Arabic copy is reviewed by a native editor before launch. Concept-board Arabic is a draft only.
- Test at 375 / 768 / 1024 / 1440 in both directions.

### 7.2 What mirrors and what never mirrors

| Mirrors with `dir` | Never mirrors |
|---|---|
| Grid and column order, navigation order, arrows, section labels' position, leader lines and labels in 06, filmstrip and progress bars in 03, chronology in 07 (month 00 at inline-start), the section-cut sweep in 11 | Photographs and renders, logo/wordmark, timecodes, asset IDs, coordinates, licence/tax/phone numbers, the sun-study track in 04 (it maps to a real east–west sun path, so it stays left-to-right; Arabic labels sit around it) |

## 8. Global systems

These are built before the section components and are used on every page.

### 8.1 G1 — Motion controller (`src/lib/motion/`)

- Registers GSAP and ScrollTrigger once. Exposes `motion.allowed`, true unless `prefers-reduced-motion: reduce` matches or the visitor turned motion off (footer control, stored in `localStorage`).
- Wraps every ScrollTrigger in `gsap.matchMedia()` contexts with three conditions: desktop, mobile, reduced. Reduced contexts set final states with no tweens.
- Provides a lock so effects don't collide: after-hours (13) waits while `document.activeViewTransition` exists; scrubbers pause when the page is hidden.
- Calls `ScrollTrigger.refresh()` once after `document.fonts.ready` (pins mis-measure on `/ar/` otherwise).
- Never fetches heavy media when `motion.allowed` is false or `navigator.connection.saveData` is true.

**Acceptance:** toggling OS reduced motion or the footer control changes every effect on the site to its fallback without a reload; no console errors; no pinned section left mid-state.

### 8.2 G2 — Navigation transitions: 11 section-cut and 12 mirror-line

One engine, two transition types, built on native **cross-document View Transitions** (`@view-transition { navigation: auto; }`) with no client router.

**11 Section-cut (type `nav`)**
- On navigation between pages, a 2 px copper vertical line with A–A section markers (circle with letter + triangle pointing in the sweep direction) crosses the viewport.
- The outgoing page (`::view-transition-old(root)`) is clipped away behind the line (`clip-path: inset()`); the incoming page (`::view-transition-new(root)`) is revealed ahead of it.
- The line is its own element with `view-transition-name: cut-line`.
- Direction: left-to-right on `ltr` pages, right-to-left on `rtl` pages. Set via `pagereveal`, reading the new document's `dir`, adding the type to `event.viewTransition.types`.
- Duration 450–600 ms desktop, 350 ms mobile. Ease: a crisp ease-in-out, no bounce.

**12 Mirror-line (type `lang`)**
- Triggered only by the language switch. The line starts at the centre and splits outward to both edges while the counterpart page is revealed.
- The switch is a normal link to the counterpart route; the transition type comes from a `pageswap` handler that detects a locale change.

**Both**
- `@media (prefers-reduced-motion: reduce) { @view-transition { navigation: none; } }`.
- **Decided after Phase 0 (founder, 25 Oct 2026): adopt Astro `<ClientRouter />`** so Firefox animates too. The router runs same-document view transitions in every browser and replaces native cross-document transitions; see `docs/decisions/0002`. The `pageswap`/`pagereveal` wording in this section becomes the router's `astro:before-preparation`/`astro:before-swap` events in Phase 2.
- Focus lands on the new page's `<main>` / `h1`.
- The incoming page's first paint must be light (Safari has no render-blocking for cross-document transitions), so hero media must not be required for the reveal to look right.

**Acceptance:** Chrome/Edge 126+ and Safari 18.2+ (real iOS device) show the sweep in the correct direction for each locale; the EN⇄AR switch shows the split; reduced motion and Firefox navigate instantly; CLS ≤ 0.1 on the switch, measured with the real Arabic fonts.

### 8.3 G3 — Provenance HUD: 08 (`ProvenanceFigure`)

Every image, sequence and video on the site renders through one component, `<ProvenanceFigure assetId="…">`. There is no way to place unlabelled media.

**Behaviour**
- Hover or keyboard focus on the figure shows copper corner brackets (CSS only).
- A visible ⓘ button (44 × 44 px hit area) toggles a native `popover` with the spec sheet. Hover alone never hides information; the button works on touch, keyboard and screen readers. `Esc` closes; content meets WCAG 1.4.13.
- Spec sheet as a `<dl>` in the figure's locale: asset ID, type, virtual camera, light, aircraft ("none · no permit" for generated aerials), gates cleared, provenance status, rights, and the visible "Generated" label.
- Every caption that sits under media states provenance in mono, e.g. `GENERATED AERIAL · NO AIRCRAFT · NO FLIGHT WINDOW`.

**Data**
- Source of truth is the master file's embedded metadata (IPTC/XMP and, later, a C2PA manifest). A build script (`scripts/provenance/`) runs `exiftool -json` (and `c2patool` when signing is in place), and writes one validated JSON entry per asset into an Astro content collection. The HUD reads that collection; it never parses metadata in the browser.
- Web derivatives (AVIF/WebP) usually lose XMP/C2PA. So the HUD must say "Metadata retained on master file" rather than claim the delivered derivative carries it. The `/method/` page explains how a client verifies a master (e.g. contentcredentials.org/verify).
- Schema: see §10.2.

**Acceptance:** every `<img>`, `<canvas>` and `<video>` in built HTML sits inside a `ProvenanceFigure` (enforced by a test that scans `dist/`); the sheet opens and closes with mouse, touch, keyboard and VoiceOver; content is identical to the manifest.

### 8.4 G4 — After hours: 13

- `data-hours="night"` on `<html>` switches the hero and aerial imagery to night renders and shows a status toast: `AFTER HOURS · THE CITY AT 21:40 AST` (localised; digits stay Western). It does **not** recolour the whole site; ivory pages stay ivory.
- Triggers: a visible **After hours** toggle in the footer (primary, accessible), plus keyboard shortcuts **N** and typing **"doha"**.
- Keyboard rules (WCAG 2.1.4 Character Key Shortcuts): ignore keys when focus is in an input, textarea, select or contenteditable, or when any modifier is held; the footer has a **Keyboard shortcuts: on/off** control that disables them, persisted.
- State set before first paint by a tiny inline script reading `localStorage`, so there is no flash. Night sources are `<picture>` alternatives fetched only on activation.
- The swap runs inside a same-document `document.startViewTransition()` crossfade (instant under reduced motion) and never during a cross-document transition.
- Toast: `role="status"`, auto-dismisses after 4 s, also dismissible.

**Acceptance:** footer toggle, N and "doha" all work; typing "doha" in the brief form does nothing; shortcuts can be turned off; state survives navigation and the language switch.

## 9. Section components

### 9.1 Shared: `MatchedFrameScrubber`

One component, three modes, used by 04, 07 and 03. It owns keyboard support, labelling, preloading, provenance IDs per frame and fallbacks.

| Prop | Meaning |
|---|---|
| `mode` | `continuous` (04), `discrete` (07), `scroll` (03) |
| `frames[]` | Ordered frames, each with an asset ID (provenance), sources and a label in both locales |
| `directionLock` | `ltr` (04) or `inherit` (07, 03) |
| `reducedMotion` | `instant` (swap with no animation) or `stills` (stepped stills, used by 03) |

### 9.2 Concept 03 — Scroll-flown aerial

**Where:** full version on `/capability/aerial-perspective/`; a three-still teaser on the home page.

**What the visitor sees:** a pinned section. Scrolling flies a generated drone path frame by frame: high approach, descent over the marina, low pass along the promenade. Beside it: a filmstrip of the three chapters, a progress rail, a virtual timecode (`FRAME 0412 / 0960`) and the caption `GENERATED AERIAL · NO AIRCRAFT · NO FLIGHT WINDOW`.

**Technique**
- Canvas image sequence driven by ScrollTrigger (`scrub: 0.3–0.5`, `pin: true`). Not scroll-scrubbed video.
- Decode on demand with `createImageBitmap` into an LRU window of about ±12 frames. A 1600 × 900 RGBA frame is about 5.8 MB decoded, so never decode the whole sequence (iOS will crash the tab).
- Progressive loading: fetch every 8th frame first, then fill in. Start fetching only when the section is within one viewport (IntersectionObserver, `rootMargin: 100%`) and after `load`.
- Draw in `requestAnimationFrame` only; scroll handlers set a target frame. Cap device pixel ratio at 2.
- The timecode maps progress to a virtual 0000–0960 count, `dir="ltr"`.

**Assets and budget**

| Variant | Frames | Width | Format | Budget |
|---|---|---|---|---|
| Desktop | 144–180 | 1600 px | AVIF only (≈ q34, 4:2:0; ≤ 60 KB/frame). No WebP sequence: browsers without AVIF get the stills (decision 0003) | 6–9 MB total |
| Mobile | 72–96 | 828 px | AVIF only (≤ 25 KB/frame) | ≤ 3 MB total |
| Stills fallback | 3 | responsive | AVIF/WebP via `<picture>` | ≤ 450 KB |

**Fallbacks**
- Reduced motion, Save-Data, `navigator.deviceMemory < 4`, or no AVIF decoder: no pin, no sequence; the three chapter stills as a stepped figure with captions.
- No JS: the same three stills.

**RTL:** filmstrip order and progress rail mirror; the frame image and timecode do not.

**Accessibility:** a "Skip the flight" link before the pinned section; canvas has `role="img"` and an `aria-label` that updates per chapter; the caption is real text.

**Acceptance:** 55–60 fps scrub on a mid-range Android and a recent iPhone with no tab crash after five full scroll passes; Save-Data and reduced motion load only the stills.

### 9.3 Concept 04 — Sun study slider

**Where:** `/capability/off-plan-visualisation/`.

**What the visitor sees:** one skyline camera. Dragging a copper sun along a hairline timeline (05:30–20:30) moves the scene through dawn, morning, midday, golden hour and night. A readout shows time, light name and sun position for Doha (25.29° N, 51.53° E). Small labelled thumbnails show the states.

**Technique**
- `MatchedFrameScrubber` in `continuous` mode.
- Input is a native `<input type="range">` (minutes 330–1230, step 15) styled as the sun on the track. No custom `role="slider"`.
- 4–6 stacked `<img>` layers; opacity interpolates between the two nearest keyframes (GPU-composited, no canvas).
- Sun azimuth and altitude precomputed at build time with SunCalc for Doha on a stated date; the readout labels that date (e.g. "computed for 21 June 2026").

**Assets:** 5 matched renders (dawn 05:30, morning, midday, golden 17:30, night 20:30) at 2400 / 1600 / 828 px, about 150–250 KB each in AVIF, lazy loaded. Total ≤ 1.2 MB. The repo has four of these today (§12.3); a morning frame is still needed.

**Fallbacks:** reduced motion makes the crossfade an instant swap; the slider still works. No JS: the golden-hour still with the other states as a labelled row of thumbnails.

**RTL:** the track is `dir="ltr"` in both locales; surrounding labels mirror.

**Accessibility:** arrow keys, Home/End and PageUp/PageDown via the native range input; `aria-valuetext` in the form "17:30, golden hour, sun azimuth {az}°, altitude {alt}°" with the SunCalc values; the readout is an `<output>`; 44 px thumb hit area.

**Acceptance:** keyboard-only users can reach every state; the screen reader announces the value text; no layout shift on first interaction.

### 9.4 Concept 06 — Exploded axonometric

**Where:** `/capability/off-plan-visualisation/`, after 04.

**What the visitor sees:** a pinned axonometric drawing of a mid-rise building. Scrolling separates it vertically into six labelled layers: foundations and basement, frame and cores, floor plates, services and MEP, façade, roof and plant. Leader lines draw in to labels.

**Technique**
- Six transparent AVIF/WebP layer cut-outs from one fixed axonometric camera, translated on Y by a pinned ScrollTrigger timeline.
- SVG leader lines drawn with `stroke-dashoffset`; labels are HTML.
- No WebGL at launch. If a real GLB/BIM model becomes available, revisit with Three.js / React Three Fiber.

**Assets:** 6 layers × 1600 px, about 80–150 KB each; total ≤ 0.8 MB. Production route: a Blender massing model rendered per collection from one axonometric camera, then an AI style pass on the composite, masked back per layer. The repo's current axonometric (`MKN-AXO-CAM01-EXPLODED`) is a single flattened image, usable only as a reference or a static fallback.

**Fallbacks:** reduced motion and no JS show the fully exploded state with all labels.

**Mobile:** shorter separation; labels collapse to a numbered legend under the figure.

**RTL:** labels and leader lines move to the other side via logical properties; the drawing does not mirror.

**Accessibility:** labels are a real `<ol>` in DOM order (foundations → roof); the figure is `aria-describedby` that list.

### 9.5 Concept 07 — Construction time-lapse

**Where:** `/capability/standing-production/`.

**What the visitor sees:** one fixed camera on one site at months 00, 06, 14 and 24 (empty plot, piling and core, frame at level 20, handover). Four thumbnail stops with labels; an optional before/after wipe between adjacent stops. Copy explains what standing capacity delivers at each phase. **[PLACEHOLDER: per-phase deliverable copy]**

**Technique:** `MatchedFrameScrubber` in `discrete` mode. The stops are a radio group of thumbnail buttons (arrow keys move between them). The optional wipe uses `clip-path: inset()` driven by a range input.

**Assets:** 4 frames + 4 thumbnails, about 0.9 MB total. Needed: a daytime month-00 frame matching the progress camera (the current `MKN-TWR-CAM01-PLOT` is lit at dusk).

**Fallbacks:** reduced motion gives an instant swap with no wipe.

**Mobile:** thumbnails become a horizontal scroll-snap strip.

**RTL:** chronology follows `dir` (month 00 at inline-start); month labels use Western digits.

**Accessibility:** radio-group pattern; a polite live region announces "Month 14 of 24".

### 9.6 Concept 14 — Studio without a portrait

**Where:** `/studio/`.

**Content**
- Studio photography with no people's faces: control room, hands on the runbook, kit details. 4–6 images, about 1 MB, lazy loaded.
- Credentials as text: twenty years in broadcast (Al Jazeera, ABC); written runbook; second senior producer on call. **[PLACEHOLDER: final credential copy]**
- Corporate register (`id="register"`) as a real `<table>` with `<th scope="row">`:

| Field | Value |
|---|---|
| Legal entity | Makeena LLC |
| Licence | QFC 04998 |
| Tax ID | T04998 |
| Address | Media City Qatar, Doha **[PLACEHOLDER: full address]** |
| Auditor | **[PLACEHOLDER]** |
| Data | **[PLACEHOLDER: data handling statement]** |
| Languages | English · Arabic (MSA or Gulf) |
| Rights | **[PLACEHOLDER: rights terms]** |

- Contact block (night): `CONTACT` label, founder name and title in text (no photo), phone and email shown as selectable text with `tel:`/`mailto:` links. **[PLACEHOLDER: phone, email]**
- Brief form (`id="brief"`): Name, Company, Engagement (radio: Fixed / Retained / Not sure), Message. Labels always visible; inline errors linked with `aria-describedby`; submit disabled with a spinner while sending; success replaces the form with a mono confirmation line in an `aria-live` region.
- **Tally light:** a copper lamp next to the form heading that reads `ON AIR` (text, not colour alone) while the form is open or any field has focus. No pulse under reduced motion.

**Back end:** an Astro endpoint on Cloudflare (`/api/brief`) validates input, verifies the **Cloudflare Turnstile** token server-side via Siteverify (tokens are single-use; rendering the widget without verifying gives no protection), then sends the brief by email via **Resend**, optionally logging to D1. Turnstile loads only when the form section is near the viewport.

**Structured data:** JSON-LD `Organization` + `ProfessionalService` with `legalName`, `address`, `identifier` (QFC licence 04998), `areaServed` (QA, AE, SA), `availableLanguage` (en, ar).

**RTL:** form layout mirrors; phone and email inputs are `dir="ltr"`.

### 9.7 Home page

Sections in order (copy from the brief and `docs/reference/homepage-ux.md` §3):

1. **Hero:** still poster (LCP, `fetchpriority="high"`) and a ≤ 2.5 MB generated aerial loop at night, muted, starting after `load`; poster only on mobile < 768 px, reduced motion and Save-Data. Eyebrow `00 · DOHA · QFC 04998`. Headline "Every real estate developer is now a media company." Line "Most are not staffed like one." CTAs: Send a brief; See the four gates. In after-hours mode the poster and loop swap to night variants.
2. **Position:** three-constraint copy **[COPY FROM BRIEF]**, pull line, and the positioning statement in its own band. No founder photo; use a studio still or none.
3. **Capability:** three teasers (Aerial perspective, Standing production, Off-plan visualisation) linking to their pages; the aerial teaser shows 03's three stills. The full register of eight beneath.
4. **Method summary:** four gates **[PLACEHOLDER: gate names and descriptions from the brief]**, link to `/method/`.
5. **Engagement summary:** Fixed / Retained with their CTAs, link to `/engagement/`.
6. **Studio and register summary:** credentials line and the key register rows, link to `/studio/#register`.
7. **Contact** block and footer.

## 10. Content model

Start with Astro Content Collections in git (Markdown/MDX or JSON per locale, Zod schemas). Add a headless CMS only when a non-developer needs to edit weekly. **[DECISION later]**

### 10.1 Collections

| Collection | Shape |
|---|---|
| `pages` | Per route and locale: title, description, sections (structured blocks), `lang` |
| `services` | Lead services (3) and register services (8): id, name (en/ar), summary (en/ar), order |
| `gates` | id `01`–`04`, name (en/ar), description (en/ar) |
| `assets` | Provenance records, one per asset (below); generated by the provenance script, not hand-edited |
| `sequences` | Frame sequences for 03/04/07: id, mode, frame asset IDs in order, labels (en/ar) |
| `register` | Corporate register rows (en/ar) |
| `site` | Contact details, social links, legal footer line |

### 10.2 Provenance record (`assets`)

```ts
{
  id: string;                  // e.g. "MKN-AER-FLT01-B"; Western digits; equals the file stem
  type: "image" | "sequence" | "video";
  digitalSourceType:
    | "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia"            // created with generative AI
    | "http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia" // existing media edited with generative AI
    | "http://cv.iptc.org/newscodes/digitalsourcetype/digitalCapture";                      // real photography
  virtualCamera?: { lensMm?: number; heightM?: number; headingDeg?: number; lat?: number; lon?: number };
  light?: { label: { en: string; ar: string }; timeLocal?: string; sunAzimuthDeg?: number; sunAltitudeDeg?: number };
  aircraft?: "none";           // generated aerials
  gatesCleared: Array<"01" | "02" | "03" | "04">;
  metadataRetained: { iptc: boolean; c2pa: boolean; on: "master" | "derivative"; manifestUrl?: string };
  rights: { en: string; ar: string };
  caption: { en: string; ar: string };
  alt: { en: string; ar: string };  // states what is shown and that it is generated
  generator?: { service: string; model: string; jobId?: string; derivedFrom?: string }; // internal; not shown publicly unless approved
}
```

Studio photography, if real, uses `digitalCapture`.

## 11. Technical architecture

### 11.1 Stack

| Layer | Choice | Notes |
|---|---|---|
| Framework | **Astro 6**, `output: 'static'`, built-in i18n (`locales: ['en','ar']`, `prefixDefaultLocale: true`) | Islands only where effects live. Check the current stable version at install time. |
| Styling | Tailwind CSS v4 with `@theme` tokens, plus component CSS where clearer | Logical-property utilities (`ps-*`, `ms-*`, `start-*`, `text-start`) |
| Motion | GSAP 3.13+ with ScrollTrigger (free for commercial use, all plugins) | `gsap.matchMedia()` for breakpoints and reduced motion. CSS scroll-driven animations only for trivial reveals behind `@supports`. |
| Transitions | Astro `<ClientRouter />` (same-document View Transitions) | Decided after Phase 0 so Firefox animates too (decision 0002) |
| Images | Astro `<Picture>` (Sharp) → AVIF + WebP + JPEG fallback with `srcset`/`sizes` and explicit dimensions | Frame sequences pre-encoded by script and served as static files (or R2) |
| Video | Cloudflare Stream for the hero loop (adaptive HLS). Never stream anything that is scrubbed. | Decided: Stream (decision 0005) |
| Hosting | **Cloudflare Workers with static assets**, deployed by Workers Builds (GitHub-connected project `makeena-website`) | Preview build per branch and pull request; production from `main`. See §11.3 |
| Forms | Worker entry (`/api/brief`, decision 0005) → Turnstile Siteverify → Resend (+ optional D1) | Secrets as Cloudflare environment variables |
| Testing | Vitest (units), Playwright (e2e in Chromium + WebKit, both locales, reduced-motion project), axe-core, Lighthouse CI | |
| Lint | ESLint, Prettier, Stylelint (bans gradients, `backdrop-filter`, physical `left/right` in components) | |

Not used: Next.js, Webflow, Lenis, Three.js (at launch), any UI kit with its own visual style. The purchased Studiova template is **not** the base; individual layouts may be borrowed if they are restyled to these tokens.

### 11.2 Suggested repository layout

```
/
├─ CLAUDE.md
├─ wrangler.jsonc               ← Cloudflare Workers config (static assets from dist/)
├─ docs/
│  ├─ PRD.md                    ← this file
│  └─ reference/homepage-ux.md
├─ design/
│  └─ renders/                  ← concept-stage renders + manifest.json (source, not served directly)
├─ scripts/
│  ├─ provenance/               ← exiftool/c2patool → src/content/assets/*.json
│  └─ sequences/                ← ffmpeg + sharp/avifenc frame extraction and encoding
├─ public/
│  ├─ fonts/
│  └─ sequences/{id}/{desktop|mobile}/MKN-…_0001.avif
└─ src/
   ├─ content/                  ← collections (pages, services, gates, assets, sequences, register, site)
   ├─ i18n/                     ← UI strings en/ar, helpers (counterpart route, digit formatting)
   ├─ layouts/BaseLayout.astro  ← <html lang dir>, fonts, view-transition CSS, after-hours inline script
   ├─ components/
   │  ├─ global/                ← Nav, Footer, LanguageSwitch, AfterHoursToggle, Toast
   │  ├─ media/ProvenanceFigure.astro
   │  ├─ scrubber/MatchedFrameScrubber.(astro|ts)
   │  └─ concepts/              ← AerialFlight (03), SunStudy (04), Axonometric (06), TimeLapse (07), BriefForm (14)
   ├─ lib/motion/               ← G1 motion controller
   ├─ lib/transitions/          ← G2 pageswap/pagereveal handlers
   ├─ styles/                   ← tokens, base, view-transitions.css
   └─ pages/[lang]/…            ← routes from §5
```

### 11.3 Environments

| Environment | Source | URL |
|---|---|---|
| Production | `main` | makeena.studio (decision 0005; attached at launch, `makeena-website.makeena.workers.dev` until then) |
| Preview | every branch and pull request | Workers preview URL, posted as a comment on the PR (may be behind Cloudflare Access) |
| Local | `npm run dev` | localhost |

**Cloudflare setup (already done by the founder, 25 Oct 2026).** Workers & Pages project `makeena-website` is connected to this repo with: build command `npm run build`, deploy command `npx wrangler deploy`, preview command `npx wrangler preview`, root directory `/`, preview builds on. The first build failed only because the repo had no `package.json` yet.

What the repo must provide (Phase 0's first PR):
- `package.json` with a `build` script that produces `dist/`, and `wrangler` as a dev dependency.
- `wrangler.jsonc` at the root: `name: "makeena-website"`, a current `compatibility_date`, and `assets: { directory: "./dist" }` (plus `not_found_handling` for the 404 page). Check the current Cloudflare docs for the exact keys.
- For the `/api/brief` endpoint (Phase 4), a small Worker entry (`main`) that handles `/api/*` and serves everything else from the assets binding. The Astro build stays static (decision 0005).

Environment variables (never committed; set in the Worker's Settings > Variables and Secrets, separately for production and preview): `TURNSTILE_SECRET_KEY`, `PUBLIC_TURNSTILE_SITE_KEY`, `RESEND_API_KEY`, `BRIEF_TO_EMAIL`, video provider keys.

## 12. Assets

### 12.1 Production pipeline

1. **Lock the camera first.** Build a cheap 3D blockout (Blender or SketchUp) of each scene with fixed named cameras (`CAM-SKY-01`, `CAM-SITE-02`, …) and render depth and line passes.
2. **Generate matched variants with structural control** (depth/edge conditioning, fixed seed and prompt skeleton), varying only time of day (04) or construction stage (07). Text-only prompting does not hold a camera match across 4–6 images.
3. **Aerial flight (03):** generate keyframes A/B/C, then image-to-video with first/last-frame conditioning per segment, or fly a camera over the blockout and restyle at low denoise. Mezzanine: 24 fps, 6–8 s, ProRes or high-bitrate H.264.
4. **Extract and encode:**
   - Frames: `ffmpeg -i flight.mov -vf "fps=24,scale=1600:-2:flags=lanczos" frames/MKN-AER-FLT01_%04d.png`, then AVIF (q≈50) + WebP via sharp/avifenc. Repeat at 828 px for mobile.
   - Hero loop: H.264 high profile, CRF 26–28, 1280–1920 w, ≤ 2.5 MB, plus the provider's adaptive renditions.
5. **Naming:** `MKN-{SERIES}-{CAM}-{VARIANT}[_{NNNN}]`, Western digits only. The name equals the provenance `id`.
6. **Metadata:** embed IPTC Digital Source Type with exiftool (`-XMP-iptcExt:DigitalSourceType=…trainedAlgorithmicMedia`, or `compositeWithTrainedAlgorithmicMedia` where AI restyled a 3D render), plus creator, copyright and EN/AR caption. Later, sign C2PA manifests with `c2patool`. Self-signed manifests verify as "unrecognised signer"; a certificate from a C2PA-trusted issuer is needed for "trusted". **[DECISION later]**
7. **QA gates** before an asset ships: camera-match overlay check, brand QA, rights QA (no recognisable real people, national symbols or third-party marks), label check. These feed `gatesCleared`. **[PLACEHOLDER: map to the brief's actual four gates]**

### 12.2 Series in use

| Series | Content | Concept |
|---|---|---|
| `TWR-CAM01` | Tower on the waterfront, one camera: dusk, night, overcast, clay, line, empty plot | Hero, 13, reference for 07 |
| `PRG-CAM01` | Same camera, construction months | 07 |
| `AER-FLT01` | Aerial flight keyframes A/B/C | 03 |
| `SUN-SKY01` | Skyline camera through the day | 04 |
| `AXO-CAM01` | Exploded axonometric | 06 |
| `STU-CAM0x` | Studio photography | 14 |

### 12.3 What is in the repo now

`design/renders/` holds 19 concept-stage renders (web-sized JPEG, max 1800 px) with `manifest.json` listing each one's ID, concepts, description, digital source type and Higgsfield job ID. Full-resolution PNG masters are in the founder's Higgsfield account. They are good enough for Phase 0 spikes and early layouts, not final production:

- Matches are close but not pixel-exact (no blockout yet).
- 03 has three keyframes, not a frame sequence. For the Phase 0 spike, generate a placeholder sequence (e.g. interpolate or pan/zoom across the three keyframes with ffmpeg) and label it as a placeholder.
- 04 lacks a morning frame. 07 lacks a daytime month-00 frame. 06 needs per-layer cut-outs.
- Night variants exist for the tower hero and skyline; the aerial needs night variants for 13.

## 13. Performance budget and loading

| Item | Home | Heaviest page (`/capability/aerial-perspective/`) |
|---|---|---|
| HTML + CSS (gzip) | ≤ 45 KB | ≤ 45 KB |
| Initial JS (gzip) | ≤ 70 KB | ≤ 85 KB |
| Critical fonts | ≤ 120 KB (Latin subsets; Arabic subsets on `/ar/`) | same |
| LCP element | AVIF still ≤ 150 KB, `fetchpriority="high"` | first chapter still (the poster under the canvas) ≤ 120 KB, `fetchpriority="high"` (decision 0015) |
| Above the fold | ≤ 450 KB | ≤ 450 KB |
| Deferred media | hero loop ≤ 2.5 MB after `load` | sequence 6–9 MB desktop / ≤ 3 MB mobile, progressive |
| Full scroll | ≤ 6 MB desktop / ≤ 3.5 MB mobile | ≤ 11 MB desktop / ≤ 4.5 MB mobile |

Rules: the LCP is always a still, never video or canvas. Heavy media loads after `load` and within one viewport. Pinned sections reserve their height in CSS. Lighthouse CI fails the build when budgets are exceeded. These figures are estimates; Phase 0 replaces them with measurements.

## 14. Accessibility requirements

- WCAG 2.2 AA across both locales.
- Every concept has a keyboard path, a screen-reader description and a reduced-motion fallback (specified per concept above).
- Visible focus everywhere (2 px `copper-deep`, 2 px offset). Tab order matches visual order in both directions.
- Touch targets ≥ 44 × 44 px, including mono links.
- Alt text states what is shown and that it is generated.
- Single-character shortcuts (13) can be turned off (WCAG 2.1.4).
- Pinned sections have skip links. No content is only available on hover.
- Test with keyboard only, VoiceOver (iOS and macOS), NVDA (Windows) and 200% zoom, in both locales.

## 15. SEO and metadata

- Static HTML for all content; real text for every heading and caption (never text drawn on canvas).
- Per-page title and description in both locales; Open Graph images (generated stills, labelled).
- `hreflang` alternates and `x-default`; XML sitemap with both locales.
- JSON-LD as in §9.6.

## 16. Compliance notes

- No binding Qatari, UAE or Saudi law found (Oct 2026 research) requires labelling AI-generated marketing imagery. Qatar MCIT and Saudi SDAIA guidance recommend disclosure. Binding rules (UAE Media Council standards and advertiser permits, Dubai Trakheesi, Saudi REGA) penalise **misleading** images. Makeena labels every generated asset regardless: it is the brand promise.
- Claims must be literally true. If a delivered derivative has no embedded metadata, say "retained on master file", never "embedded in this image".
- No recognisable real people, national symbols or third-party marks in generated imagery.
- Have Qatari counsel confirm the privacy page and any client-campaign obligations in KSA and Dubai before launch. **[DECISION]**

## 17. Delivery plan

Work in phases. Each phase is one or more branches named `phase-{n}/{short-name}` (e.g. `phase-0/section-cut-spike`), each opened as a pull request so Cloudflare posts a preview URL the founder can open on desktop and phones. Merge to `main` only after the founder reviews the preview.

| Phase | Scope | Exit criteria | Estimate |
|---|---|---|---|
| **0 — De-risk spikes** | (a) 11 section-cut between two static Astro pages, both directions; (b) 03 canvas sequence with 150 placeholder frames; (c) 12 EN⇄AR switch with real Arabic fonts | (a) works in Chrome and real-device Safari 18.2+; (b) smooth on a mid-range iPhone and Android with no crash; (c) CLS measured ≤ 0.1. Findings written to `docs/decisions/` | 5–7 days |
| **1 — Foundation** | Astro + i18n routes, tokens, typography for both scripts, layout primitives, Nav/Footer, G1 motion controller, provenance schema + script, Cloudflare deploy with previews, lint/test/CI | Both locales build and deploy; every route from §5 exists with placeholder content; CI green | 6–8 days |
| **2 — Global systems** | G2 (11 + 12), G3 `ProvenanceFigure` (08), G4 after hours (13) | Acceptance criteria in §8 met | 6–8 days |
| **3 — Section components** | `MatchedFrameScrubber` → 04, then 07; 03 full; 06 layered axonometric | Acceptance criteria in §9 met with current assets | 13–17 days |
| **4 — Studio and conversion** | 14 page, register, JSON-LD, brief form with Turnstile + Resend, tally light | A real test brief arrives by email from a preview deployment | 3–4 days |
| **5 — Content, Arabic, QA** | Final copy, native Arabic review, accessibility audit, field CWV, cross-browser including Firefox fallbacks | §3.3 targets met; launch checklist signed off | 6–8 days |
| **Parallel — assets** | Blockouts, matched renders, aerial sequence, layers for 06, night variants, metadata | Assets in the pipeline with manifests | 3–5 weeks |

Build order: spikes → foundation → 11/12 → 08 → scrubber (04, then 07) → 03 → 06 → 13 → 14 → QA. Estimated total 8–11 weeks of build effort for a solo founder working with Claude Code.

### 17.1 Definition of done (every pull request)

- Works in both locales and both directions at 375 / 768 / 1024 / 1440.
- Works with reduced motion, keyboard only and without JS (content visible).
- No new axe violations; Lighthouse budgets pass.
- Every new media element uses `ProvenanceFigure` and has a manifest entry.
- PR description states what changed, how to test it on the preview URL, and any open questions.

## 18. Open decisions and placeholders

| Item | Owner | Needed by |
|---|---|---|
| Names and descriptions of the four gates (from the brief) | Founder | Phase 2 (08) |
| Exclusions paragraph, three-constraint copy, method intro copy (from the brief) | Founder | Phase 5 |
| Native Arabic copy review | Founder (editor) | Phase 5 |
| Full address, auditor, data statement, rights terms, phone, email | Founder | Phase 4 |
| Per-phase deliverables copy for 07 | Founder | Phase 3 |
| ~~Animate Firefox (ClientRouter) or accept plain navigation~~ Decided: ClientRouter (decision 0002) | Founder | Done |
| ~~Mux vs Cloudflare Stream for the hero loop~~ Decided: Stream (decision 0005) | Founder | Done |
| Analytics tool (privacy-friendly) | Founder | Phase 4 |
| ~~Production domain~~ Decided: makeena.studio, attached at launch (decision 0005) | Founder | Done |
| C2PA signing certificate | Founder | Post-launch |
| Headless CMS | Founder | Post-launch |

## 19. Sources behind technical choices (verified October 2026)

- Cross-document View Transitions: Chrome/Edge 126+, Safari 18.2+; Firefox stable not yet — developer.chrome.com/docs/web-platform/view-transitions/cross-document
- Same-document View Transitions Baseline (Firefox 144) — web.dev/blog/same-document-view-transitions-are-now-baseline-newly-available
- GSAP free including all plugins (3.13) — css-tricks.com/gsap-is-now-completely-free-even-for-commercial-use/
- WCAG 2.1.4 Character Key Shortcuts — w3.org/WAI/WCAG21/Understanding/character-key-shortcuts.html
- ARIA slider guidance (prefer native range) — w3.org/WAI/ARIA/apg/patterns/slider/
- IPTC Digital Source Type vocabulary — iptc.org/news/newscodes-2024-q3-release-including-media-topics-and-digital-source-type-updates/
- C2PA in the browser (c2pa-web) — opensource.contentauthenticity.org/docs/sdk-repos/c2pa-js/
- Turnstile server-side validation — developers.cloudflare.com/turnstile/get-started/client-side-rendering/
- Webflow Localization limits (why not Webflow) — help.webflow.com/hc/en-us/articles/33961240676371

Library and framework versions move. Confirm current stable versions and APIs from official docs before installing.
