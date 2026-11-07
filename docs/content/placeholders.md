# Placeholders (for the founder to fill in)

Every piece of copy or fact still marked `[PLACEHOLDER: …]` on the site, grouped by page. Each item says where it appears and what it should cover. Fill in the **English** line (write as many lines as you need underneath it).

**Arabic:** write it yourself, or write **draft it** and I'll draft the Arabic from your English. My drafts are marked for native review, like the rest of the Arabic copy, until you or a native editor checks them.

Leave anything you don't have yet empty; it stays a placeholder and I'll ask again later. When you're done with some or all of it, tell me and I'll put it on the site and open a pull request.

Don't write anything that isn't true yet (a client, a figure, a legal claim): the site states facts.

## 1. Company facts (corporate register, `/studio/#register`)

**1.1 Full address**
Where: register row "Address" (`/studio/`). Also goes into the search-engine data once supplied.
English:
Arabic:

**1.2 Auditor**
Where: register row "Auditor". The audit firm's name as it should appear.
English:
Arabic:

**1.3 Rights terms**
Where: register row "Rights", and the "Rights" line on every image's provenance sheet (30 images). One short line, e.g. who owns delivered assets and what the client may do with them.
English:
Arabic:

**1.4 Data statement**
Where: register row "Data". One or two lines; the privacy page (2.1) carries the detail.
What the site actually does today, so the statement can be accurate:
- The brief form stores each brief (name, company, email, engagement type, message, language, time) in a Cloudflare D1 database, then emails it to you through Resend. Nothing is deleted automatically yet: **the retention period is yours to set** (e.g. 12 months), and I'll build the deletion to match.
- Cloudflare Turnstile checks the form isn't a bot; the visitor's IP address is sent to Cloudflare for that check and not stored by the site.
- Cloudflare Web Analytics counts visits: no cookies, no personal data.
- No other tracking, no ads, no third-party fonts.
Retention period for briefs:
English:
Arabic:

## 2. Privacy (`/privacy/`)

**2.1 Privacy text**
Where: the whole privacy page. Covers the facts in 1.4: who the controller is (Makeena LLC, QFC licence 04998), what's collected and why, retention, who processes it (Cloudflare, Resend), and how to ask for deletion. The PRD says Qatari counsel should confirm it before launch.
Reviewed by counsel (yes / not yet):
English:
Arabic:

## 3. Home (`/`)

**3.1 Three-constraint copy**
Where: section 01 Position, under "A broadcast studio that works at the speed of a content team…". The UX reference describes three constraints from your brief: selling before it's built, aerials gated by permits, and a standard set by the brand. One short paragraph, or three short lines.
English:
Arabic:

## 4. Service summaries (capability pages, home teasers, `/capability/`)

One or two sentences each.

**4.1 Aerial perspective**
English:
Arabic:

**4.2 Standing production**
English:
Arabic:

**4.3 Off-plan visualisation**
English:
Arabic:

The eight register services (`/capability/`, under each name):

**4.4 The Twin (التوأم)**
English:
Arabic:

**4.5 The Velocity (السرعة)**
English:
Arabic:

**4.6 The Launch (الإطلاق)**
English:
Arabic:

**4.7 The Marquee (اللوحة الإعلانية)**
English:
Arabic:

**4.8 The Stage (المسرح)**
English:
Arabic:

**4.9 The Season+ (الموسم+)**
English:
Arabic:

**4.10 The Pipeline (خط الفرص)**
English:
Arabic:

**4.11 The Host (المضيف)**
English:
Arabic:

## 5. Aerial perspective (`/capability/aerial-perspective/`)

**5.1 The "no aircraft, no flight window" argument**
Where: section 02 No aircraft, after the flight. Why generated aerials beat a shoot: no aircraft, no permits or flight windows, any time of day. A short paragraph.
English:
Arabic:

## 6. Standing production (`/capability/standing-production/`)

**6.1–6.4 What standing capacity delivers at each month**
Where: under the time-lapse (07), one note per month. The pictures show the site at each stage; the note says what the retained client has received by then. One or two sentences each.

Month 00 (empty plot):
English:
Arabic:

Month 06 (piling and core):
English:
Arabic:

Month 14 (frame at level 20):
English:
Arabic:

Month 24 (handover):
English:
Arabic:

## 7. Method (`/method/`)

**7.1 Method intro**
Where: section 01 The gates, above the four gates (Match, Brand, Rights, Label). A short paragraph on why the gates exist.
English:
Arabic:

**7.2 What the provenance metadata contains**
Where: section 02 Provenance, "Provenance metadata retained on all delivered assets."
Drafted by Claude (7 Nov), on the site in both languages; Arabic marked for native review. Based on the fields `npm run provenance:tag` writes into master files (asset ID, Digital Source Type, creator, caption and alt text in both languages, rights). Correct it here or on the preview.

**7.3 How to verify a file**
Where: section 03 Verify a file.
Drafted by Claude (7 Nov), on the site in both languages; Arabic marked for native review. Names ExifTool and the three fields to check (Identifier, Digital Source Type, Creator). Doesn't mention C2PA / Content Credentials: master files aren't signed yet (PRD §12.1, decision later).

## 8. Engagement (`/engagement/`)

**8.1 Fixed: event-triggered package**
Where: section 01 Fixed. What a fixed package covers and when it fits (a launch, an event). A short paragraph.
English:
Arabic:

**8.2 Retained: standing capacity**
Where: section 02 Retained. What a retainer covers over the life of a project. A short paragraph.
English:
Arabic:

**8.3 Published exclusions**
Where: section 03 Published exclusions. What the studio doesn't do, stated openly ("published rather than discovered"). A short paragraph or a short list.
English:
Arabic:

## Not copy (for the record)

- **03 aerial flight:** the scroll-flown sequence on `/capability/aerial-perspective/` is still the Phase 0 placeholder (`MKN-AER-FLT01-PLACEHOLDER`, caption "PLACEHOLDER FLIGHT"). Replacing it needs a real generated sequence, not text.
- **06 axonometric:** ships as a static image until layers rendered from one fixed camera exist (decision 0017).
