> **Reference document.** This is the original home page UX recommendation (September 2026), derived from the *Makeena Company Brief, August 2026*. It is kept here for its design tokens, copy and section logic. Where it conflicts with `docs/PRD.md`, **the PRD wins**. Known overrides:
> - No founder photograph anywhere on the site (the "founder still" in §3.2 is replaced by studio photography).
> - The site is multi-page; the home page links out to capability pages that carry the full interactive concepts.
> - Motion goes beyond "scroll reveals only" for the selected concepts (03, 04, 06, 07, 11, 12, 13), each with a reduced-motion fallback.

# Makeena — Home Page UX Recommendation

Source: *Makeena Company Brief, August 2026* (3 pp). Nothing else was used.

---

## 1. What the brief tells us about the page's job

| Input from the brief | UX consequence |
|---|---|
| Buyer: marketing/brand leads at real estate developers (Qatar, UAE, KSA) and corporate clients | One audience, one primary CTA. No "I am a…" path splitting by industry. |
| Position: between elite visualisation studios (slow) and volume social agencies (below standard) | The page must *demonstrate* speed and finish, not just claim it. Imagery is the product. |
| Two services lead (aerial, off-plan); the rest sits in a retained engagement | Visual hierarchy: 2 large + 1 medium, then a compact register of 8. Not eight equal cards. |
| Four gates, provenance metadata retained | The method is the differentiator. Give it full-width prominence, not a footnote. |
| Two ways in: Fixed / Retained | The engagement section is the real decision point. Give each path its own CTA. |
| Exclusions "published rather than discovered" | Show exclusions on the page. Hiding them contradicts the brand promise. |
| English and Arabic, MSA or Gulf | Bilingual and RTL are first-class from day one, not a later pass. |
| Founder credentials, QFC licence, auditor, TIN, rights | Trust & Authority pattern: credentials displayed openly (a stated anti-pattern is hiding them). |

**Page goal:** get a qualified brand/marketing lead to send a brief or book a call. Secondary goal: let a procurement or legal reader verify the entity in under 30 seconds.

---

## 2. Design direction

The brief already has a fully formed visual language: warm ivory ground, near-black ink, copper accent, a high-contrast serif for statements, monospace for metadata labels, a neutral sans for body, hairline rules, print-style folios. The website should extend that document, not reinterpret it.

The skill's default recommendation for "enterprise service" (teal/blue, Cinzel) was rejected for that reason. Matched styles from the database: **Editorial Grid / Magazine** (structure) + **Exaggerated Minimalism** (typographic scale) + **Trust & Authority** (content pattern). Landing pattern: **Video-First Hero** feeding into **Hero → Problem → Solution → Proof → CTA**.

### Palette (derived from the brief)

| Token | Hex | Use | Contrast on ivory |
|---|---|---|---|
| `ink` | `#1A1A1A` | Headings, body | 15.6:1 |
| `ivory` | `#F6F2EA` | Page ground | — |
| `sand` | `#EFEAE1` | Panels (the "Full Register" block) | — |
| `copper` | `#B4653A` | Rules, large display accents, links ≥ 24px | 3.9:1 — **not** for small text |
| `copper-deep` | `#9A522C` | Mono labels, small links, italic pull-lines | 5.2:1 AA |
| `muted` | `#5C5650` | Captions, secondary body | 6.5:1 |
| `night` | `#141414` | Hero overlay, contact block, footer | ivory on night 16.5:1 |
| `copper-light` | `#C8A27A` | Labels on dark blocks | 7.8:1 on night |

No gradients, no purple/AI colouring, no glass. Copper is the only chromatic colour on the page.

### Typography

| Role | Face | Notes |
|---|---|---|
| Display / statements | Cormorant Garamond 400–500 | `clamp(2.5rem, 6vw, 5.5rem)`, line-height 1.05, letter-spacing −0.01em. Sentence case with terminal full stops, as in the brief. |
| Body | Inter 400/500 | 17–18px desktop, 16px minimum mobile, line-height 1.6, measure 60–70ch. |
| Labels / metadata | JetBrains Mono 500 | 11–12px, uppercase, letter-spacing 0.14em. Used for section numbers, folios, captions like "GENERATED AERIAL · NO AIRCRAFT". |
| Arabic display | Amiri 400 | Pairs with Cormorant's contrast; larger line-height (1.4) and no letter-spacing. |
| Arabic body / labels | IBM Plex Sans Arabic 400/500 | Mono labels in Arabic switch to Plex Sans Arabic at the same size; do not force a Latin mono onto Arabic. |

Load fonts with `font-display: swap`; subset Latin and Arabic separately.

### Spatial system

- 12-column grid, 1280px max content width, 24px gutters (16px mobile).
- Vertical rhythm on an 8px base; section padding 96–128px desktop, 64px mobile.
- Hairline rules (`1px ink` or `1px ink/15`) as the main structural device. No card shadows, no rounded corners above 2px.
- Section numbering in mono ("00 · 01 · 02…") carried from the brief, top-left of every section.

---

## 3. Page structure

### 0. Navigation

- Slim sticky bar, 64px, ivory with a 1px bottom rule. Transparent over the hero; solid once scrolled.
- Left: MAKEENA. wordmark (the period in copper). Centre: Capability · Method · Engagement · Studio. Right: **EN / AR** toggle, then primary CTA **"Send a brief"**.
- On mobile: wordmark, language toggle, CTA visible; menu behind a labelled button (not icon-only).
- Language toggle swaps `dir` and `lang` on `<html>`; the whole layout mirrors via logical properties.

### 1. Hero — "Every real estate developer is now a media company."

- Full-viewport (min 85vh) background: a looping 12–15s **generated aerial** of a Doha development at night. This is the aerial service demonstrating itself.
- 60% night overlay. Mono eyebrow: `00 · COMPANY BRIEF · DOHA` reused as `00 · DOHA · QFC 04998`.
- Two-line display headline as written in the brief. Supporting line, ivory 70%: "Most are not staffed like one."
- CTAs: **Send a brief** (ivory fill, ink text) + text link **See the four gates ↓** (anchor to Method).
- Video rules: muted, no captions needed (no speech), `poster` still frame, `prefers-reduced-motion` → static still, mobile < 768px → static still (data cost). Reserve the box height before load to avoid jumps.

### 2. Position — the problem, stated plainly

- Ivory. Left 7 cols: the three-constraint copy (sell before built / permit-gated aerial / brand-set standard). Right 4 cols: "The studio" sidebar with founder still, exactly as the brief's page 1.
- The italic copper line ("A persistent gap opens…") set as a pull line in `copper-deep`.
- Below, a full-width rule and the positioning statement in display serif:
  *A broadcast studio that works at the speed of a content team. A content partner that finishes to the standard of a broadcast studio.*
  This is the single most important sentence on the page; give it its own band and nothing else.

### 3. Capability — "Two services lead. The rest sit inside a retained engagement."

- Three-up image grid (4/4/4 cols), 4:3 images, mono caption under each, numbered 01–03, serif title, two-line description. Order preserved: Aerial perspective, Standing production, Off-plan visualisation.
- Each image caption states provenance ("GENERATED AERIAL · NO AIRCRAFT · NO FLIGHT WINDOW"). Keep this — it's the proof of method in miniature.
- Beneath: **The full register** as a sand-panel definition list, two columns of four (The Twin, The Velocity, The Launch, The Marquee | The Stage, The Season+, The Pipeline, The Host). Mono key, sans value. On mobile it becomes a single column; no accordion — eight short rows are cheaper to scan than to tap.
- Hover on the three lead items: image darkens 8%, caption turns copper. No scale transforms.

### 4. Method — "Four gates. Nothing reaches a client that has not cleared all of them."

- This is the conversion section for a sceptical enterprise buyer. Full-width, ivory.
- Intro copy on the failure modes of production tooling, verbatim from the brief.
- Four columns, each topped with a 2px copper rule and a mono `GATE 01…04` label, serif title, short description. On mobile: vertical, with the copper rule becoming a left border.
- Optional scroll-reveal: the four rules draw in left-to-right (RTL: right-to-left) over 400ms total. Disabled under reduced motion.
- Footer line of the section in mono: `PROVENANCE METADATA RETAINED ON ALL DELIVERED ASSETS`.

### 5. Engagement — "Two ways in. Both scoped to the client, not to a menu."

- Two equal columns separated by a 1px vertical rule (as in the brief): **Fixed · Event-triggered package** and **Retained · Standing capacity**.
- Each column ends with its own CTA, in the same visual weight (both are valid entries, no favourite):
  - Fixed → **Scope a pre-event package**
  - Retained → **Scope standing capacity**
  Both open the same contact form with the engagement type pre-selected.
- Beneath, full width, the exclusions paragraph, headed in mono: `PUBLISHED EXCLUSIONS`. Do not collapse or footnote it.

### 6. Studio & Corporate — credentials in the open

- Left 6 cols: founder paragraph (Al Jazeera, ABC, twenty years), the runbook / second senior producer line, control-room still.
- Right 6 cols: the corporate register as a definition table — Legal entity, Licence, Tax ID, Address, Auditor, Data, Languages, Rights. This is the section a procurement reader lands on from "Studio" in the nav; keep it above the contact block so it's reached before the ask.

### 7. Contact — the ask

- Night block, full width, mirrors the brief's page 3 footer. Left: `CONTACT` label, founder name in serif, title in mono. Right: phone, email, domain as mono links (`tel:`, `mailto:`), each a 44px tap target.
- Below the direct contacts, a **four-field brief form**: Name, Company, Engagement (Fixed / Retained / Not sure — radio, not dropdown), Message. Labels always visible (no placeholder-as-label), inline error text next to the field, submit button disabled with a spinner during send, success state replaces the form with a mono confirmation line. Direct contacts stay visible so the form is never the only route.
- No newsletter, no chat widget.

### 8. Footer

- Single mono line: `MAKEENA LLC · QFC LICENCE 04998 · TIN T04998` left; language toggle and © right. Ivory, top rule.

---

## 4. Bilingual & RTL specifics

- Every layout uses CSS logical properties (`margin-inline-start`, `text-align: start`); no hardcoded left/right.
- Section numbers and folios stay in Western digits in both languages (they're identifiers, matching the brief).
- Arabic type scale runs ~8% larger at body size for equivalent legibility; display serif line-height rises to 1.3–1.4.
- Directional icons (the "↓" in the hero link, any arrows) flip with `dir`.
- Image captions and mono labels translate; provenance labels may remain English with an Arabic gloss if legal wording requires.
- Test at 375 / 768 / 1024 / 1440 in **both** directions.

---

## 5. Motion

- Page-level: scroll reveals only (opacity 0→1, translateY 12px→0, 300ms, ease-out, staggered 60ms). Nothing loops except the hero film.
- Micro: `transition-colors 200ms` on links and buttons; focus ring 2px `copper-deep` offset 2px, visible on all interactive elements.
- `@media (prefers-reduced-motion: reduce)`: reveals become instant, hero video replaced by poster.

---

## 6. Accessibility & performance checklist

- [ ] All small copper text uses `copper-deep` (#9A522C), never `copper` (#B4653A)
- [ ] Hero text contrast measured against the darkest and lightest frames of the video, not the poster only
- [ ] Alt text on every image states what is shown *and* that it is generated where applicable
- [ ] Form: `<label for>`, `aria-describedby` for errors, `aria-live` on the success message
- [ ] Nav menu button has a visible text label; tab order matches visual order in both directions
- [ ] 44×44px minimum on all tap targets, including the mono contact links
- [ ] Hero video ≤ 2.5 MB, H.264 + WebM, `preload="metadata"`, lazy-load everything below the fold
- [ ] Images: WebP with `srcset`, explicit width/height to prevent layout shift
- [ ] Z-index scale: nav 30, menu overlay 40, form toast 50
- [ ] No emoji, no icon fonts; the only icons are the arrow and menu glyphs as inline SVG

---

## 7. What to leave off the home page

- Client logo carousel — the brief lists no clients; an empty or padded strip would undercut the trust posture. Add only when there are three or more real ones.
- Pricing — the brief says scope and price are stated in the proposal, not on a menu.
- Testimonials — none supplied; do not fabricate.
- Blog / news — nothing in the brief supports it.
- Login — no client portal is described.
