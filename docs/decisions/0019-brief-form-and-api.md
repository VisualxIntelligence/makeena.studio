# 0019 — The brief form and `/api/brief` (14)

**Date:** 27 October 2026 · **Phase:** 4 · **Status:** proposed (founder review; goes live once the keys below are set)

## Founder decisions (27 Oct)

| # | Decision | Consequence |
|---|---|---|
| 1 | **The form asks for an email, required** | The PRD's fields (Name, Company, Engagement, Message) had no way to reply. The email is the Reply-To of the brief, so the founder answers with Reply. Company is optional. |
| 2 | **Claude creates the D1 database** | `makeena-briefs` (ID `52029875-02a2-4b9b-bbd0-421722002dab`, Eastern Europe, free tier) in the Worker's account (`56ac37aa…`). Created 28 Oct with `wrangler d1 create`, with the schema in `migrations/0001_briefs.sql` applied remotely and recorded in `d1_migrations`. |

**Correction (28 Oct).** The first `makeena-briefs` (`682ee55c…`, 27 Oct) was created through the claude.ai Cloudflare connector, which is signed in to a different Cloudflare account with no Workers. Workers Builds then failed on #24 with `D1 binding 'DB' references database … which was not found [code: 10181]`. `wrangler deploy --dry-run` doesn't catch this, because it never checks that the database exists. Create Cloudflare resources for this project with Wrangler (`wrangler whoami` shows account `56ac37aa…`), not the connector. The stray copy holds only the empty schema.

## How it works

- **A small Worker** (`worker/index.ts`, `main` in `wrangler.jsonc`) runs first only for `/api/*` (`run_worker_first`). Every page and asset is still served statically without invoking it. Unknown paths fall back to the assets' localised 404s. The bundle is 2.7 KB gzip.
- **`/api/brief`** (`worker/brief.ts`) handles a request in this order:
  1. same-origin POST only (32 KB max);
  2. a hidden honeypot field (filled → accepted and dropped);
  3. the same field rules as the form;
  4. Turnstile Siteverify (with `remoteip` and an idempotency key; a real token must name this hostname);
  5. **an `INSERT` into D1 first**;
  6. the Resend email (Reply-To the visitor, `Idempotency-Key: brief-{id}`);
  7. `emailed_at` set on the row.
- **What the visitor sees:**
  - success if the brief is in D1 or in the inbox;
  - 502 only if it reached neither;
  - 503 while the Worker's secrets aren't set.
- Failures are logged in Workers Logs (`observability` on) and never shown in detail.
- **Previews inherit no bindings, vars or secrets** (current Workers Previews). The `previews` block repeats the D1 binding and vars. Previews share `makeena-briefs`, with rows tagged `environment = 'preview'`, and their email subjects say `[preview]`.
- **The form** (`src/components/brief/`):
  - Name, Company (optional), Email (`dir="ltr"`), Engagement (native radios, Not sure checked; `#brief-fixed` / `#brief-retained` preselect, including on a hash change), Message.
  - Labels are always visible. Errors sit under their fields (`aria-describedby`, `aria-invalid`), focus moves to the first one, and an error clears as soon as the field is corrected.
  - While sending, the button is disabled with a square spinner. On success the form gives way to `BRIEF RECEIVED · REF ABCDEF12`, in focus and announced.
  - If sending fails, the founder's email is offered.
- **Turnstile** loads only when the form is within 200 px of the viewport or gets focus. It is the managed widget, in the page's language.
- **The ON AIR tally** shows text (ON AIR / OFF AIR) and a copper lamp. It is on while the form is on screen or a field has focus, and pulses only when motion is allowed (G1).
- **Without JS** the form is hidden (Turnstile needs JS) and the founder's email is offered; the contact block above stays.

## Verified locally (`wrangler dev`, the real Worker)

- Both locales, with the real Turnstile widget on its test key and Cloudflare's actual Siteverify:
  - briefs land in local D1, and Arabic text is stored intact;
  - Resend's API is reached; it rejected the deliberately invalid local key with a 401, which was logged and left `emailed_at` empty;
  - the visitor sees the confirmation.
- **A bug the unit tests missed:** calling `deps.fetch(...)` passed `deps` as `this`, and the Workers runtime refuses that ("Illegal invocation"). Fixed by wrapping `fetch`.

## For the founder: switching it on

1. **Turnstile** (dashboard → Turnstile → Add widget):
   - Managed mode.
   - Hostnames `makeena.workers.dev` (covers production and every preview) and `makeena.studio`.
   - Send the **site key** (it's public and goes in the code); keep the secret.
   - **Done 28 Oct:** widget "Makeena brief form", site key `0x4AAAAAAFpMouwQJ_FUQM41` (default in `BriefForm.astro`). On `localhost` the form uses Turnstile's test key instead (`brief.ts`), so `npm run dev` and `npm run preview` work with the test secret in `.dev.vars`.
2. **Resend**: create an API key with sending access.
3. **Worker `makeena-website` → Settings → Variables and secrets**: add `TURNSTILE_SECRET_KEY` and `RESEND_API_KEY` as secrets, and `BRIEF_TO_EMAIL` (the address on the Resend account; the test sender delivers only there). Add the same three again under **Previews Base**. Base secrets reach only previews created afterwards, so an existing preview needs them set on it directly (`wrangler preview secret put … --name <branch>`).
   - **Done 28 Oct** with Wrangler from a gitignored `*.env` file, so the values never entered the chat: `wrangler secret bulk` (production), `wrangler preview base-config secret bulk` (Previews Base) and `wrangler preview secret bulk --name phase-4-brief-form` (the existing preview). A probe with a fake Turnstile token now returns 403 (Siteverify reached with the real secret) instead of 503.

Exit test (PRD §17): a brief sent from the preview arrives in that inbox.
