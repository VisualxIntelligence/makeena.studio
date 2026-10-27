# 0018 — Phase 4 founder decisions and the studio page (14)

**Date:** 27 October 2026 · **Phase:** 4 · **Status:** accepted (decisions); studio page in review

## Founder decisions (27 Oct)

| # | Decision | Consequence |
|---|---|---|
| 1 | **Brief emails go through Resend's test sender** (`onboarding@resend.dev`) until launch | No DNS work now. Resend's test sender only delivers to the address on the Resend account, so `BRIEF_TO_EMAIL` is that address. The sender switches to a verified `makeena.studio` address at launch. |
| 2 | **Analytics: Cloudflare Web Analytics** | Free and cookieless, in the same Cloudflare account; no consent banner. One beacon script with a site token from the dashboard. Its own PR, `phase-4/analytics`. |
| 3 | **Briefs are emailed and also logged to D1** | Nothing is lost if email delivery fails. The data statement in the register must cover what is stored and for how long. Retention is a founder decision before launch. |

## Studio page (PRD §9.6), this PR

- **Studio section.** The credentials line, drafted from the PRD's facts (twenty years in broadcast at Al Jazeera and ABC; a written runbook; a second senior producer on call). The PRD's final credential copy is still the founder's to supply. The Arabic is a draft.
- **Studio photography: six images** (PRD: 4–6, no faces). The founder asked for the rest to be generated, so four stills were added: `STU-CAM03-KIT` (camera), `CAM04-GRADE` (colour grading), `CAM05-AUDIO` (voice-over) and `CAM06-MASTERS` (master storage).
  - Each is a GPT Image 2.5 generation with the control room as the style reference, so all six share the studio's night light. They cost 11 credits.
  - Checked at full size: no people, no logos, no legible text.
  - All lazy except the first. As served AVIF, the six weigh 175 KB on phones (828 w) and 301 KB on desktop (1200 w), well under the PRD's "about 1 MB".
- **Corporate register.** Now a real `<table>` with `<th scope="row">`, as the PRD specifies. It was a `<dl>`. Languages reads "English · Arabic (MSA or Gulf)". The home page's studio summary shows the entity, licence and tax ID rows (PRD §9.7).
- **Contact block (night).**
  - A new 03 · CONTACT section on `/studio/`; the brief becomes 04. It is also on the home page's 06 · CONTACT.
  - It shows the founder's name and title in text (never a photo), and phone, email and web as mono, selectable text. Supplied by the founder on 27 Oct: Ahmed Albadri, Founder, +974 66905704, ahmed@makeena.studio. The name stays in Latin letters on `/ar/` until the founder gives an Arabic spelling; "المؤسس" is a draft.
  - Phone and email are `tel:`/`mailto:` links with 44 px targets. Placeholders are never linked.
  - Identifiers sit in LTR isolates, so they align with the Arabic text.
- **Structured data.** JSON-LD `Organization` + `ProfessionalService` on `/studio/` and the home page: legal name, QFC licence 04998 as `identifier`, tax ID, Doha / QA, areas served QA / AE / SA, languages en / ar. With the founder (as `founder`), telephone and email. Fields still marked `[PLACEHOLDER]` (the street address) are left out, never published as placeholders.
- **Contact data lives in `src/content/site.json`** (`contact`), next to the legal line.
- **The contact block uses `content-visibility: auto`.** On `/ar/` the founder-name placeholder is Latin, so it is set in Cormorant. That made the Arabic home page fetch a sixth font (23 KB) before its LCP, and Lighthouse's lab LCP went from 2.93 to 3.08 s, over the 3.0 s limit. With the block skipped while off-screen, the face loads only when the visitor reaches it: 2.93 s again, and no layout shift on scroll (measured on phone and desktop).

## Still to come in Phase 4

- `phase-4/brief-form`: the form (Name, Company, Engagement, Message), the ON AIR tally light, and `/api/brief` on a small Worker entry (Turnstile Siteverify → Resend → D1). The founder creates the Turnstile widget, a Resend API key and the D1 database; secrets go in the Worker settings.
- `phase-4/analytics`: the Web Analytics beacon.
