// /api/brief (PRD §9.6, decision 0018): the brief form's back end.
// 1. Same-origin POST only; a filled honeypot is accepted and dropped silently.
// 2. Validate the fields (the same rules as the form; never trust the client).
// 3. Verify the Turnstile token with Siteverify (tokens are single-use; without this the widget
//    protects nothing).
// 4. Store the brief in D1 first, so none is lost if email fails; then email it through Resend
//    with the visitor as Reply-To, and mark the row as emailed.
// The visitor gets success once the brief is safe in at least one place.

export const ENGAGEMENTS = ["fixed", "retained", "unsure"] as const;
export type Engagement = (typeof ENGAGEMENTS)[number];
export type Field = "name" | "company" | "email" | "engagement" | "message" | "turnstile";
export type FieldError = "required" | "invalid" | "too_long";

export interface Brief {
  lang: "en" | "ar";
  name: string;
  company: string;
  email: string;
  engagement: Engagement;
  message: string;
}

/** The parts of D1's binding the handler uses (so tests can pass a fake). */
export interface D1Like {
  prepare(sql: string): { bind(...values: unknown[]): { run(): Promise<unknown> } };
}

export interface BriefEnv {
  DB?: D1Like;
  TURNSTILE_SECRET_KEY?: string;
  RESEND_API_KEY?: string;
  BRIEF_TO_EMAIL?: string;
  BRIEF_FROM_EMAIL?: string;
  ENVIRONMENT?: string;
}

export interface Deps {
  fetch: typeof fetch;
  now: () => Date;
  uuid: () => string;
}

export const LIMITS = { name: 120, company: 160, email: 254, message: 5000 } as const;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BREAKS = /[\r\n\t]+/g;
const MAX_BODY = 32 * 1024;

/** One line, trimmed: names and companies end up in an email subject. */
const line = (value: unknown) =>
  String(value ?? "")
    .replace(BREAKS, " ")
    .trim();

export function validate(input: Record<string, unknown>): {
  brief?: Brief;
  errors: Partial<Record<Field, FieldError>>;
} {
  const errors: Partial<Record<Field, FieldError>> = {};
  const name = line(input.name);
  const company = line(input.company);
  const email = line(input.email);
  const engagement = line(input.engagement) as Engagement;
  const message = String(input.message ?? "").trim();

  if (!name) errors.name = "required";
  else if (name.length > LIMITS.name) errors.name = "too_long";
  if (company.length > LIMITS.company) errors.company = "too_long";
  if (!email) errors.email = "required";
  else if (email.length > LIMITS.email) errors.email = "too_long";
  else if (!EMAIL.test(email)) errors.email = "invalid";
  if (!engagement) errors.engagement = "required";
  else if (!ENGAGEMENTS.includes(engagement)) errors.engagement = "invalid";
  if (!message) errors.message = "required";
  else if (message.length > LIMITS.message) errors.message = "too_long";

  if (Object.keys(errors).length > 0) return { errors };
  const lang = input.lang === "ar" ? "ar" : "en";
  return { brief: { lang, name, company, email, engagement, message }, errors };
}

const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...headers,
    },
  });

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) return (await request.json()) as Record<string, unknown>;
  const form = await request.formData();
  const fields: Record<string, unknown> = {};
  for (const [key, value] of form.entries()) fields[key] = typeof value === "string" ? value : "";
  return fields;
}

/** Turnstile's documented test secrets accept only the dummy token and name no real hostname. */
const isTestSecret = (secret: string) => /^[123]x0{30,}AA$/.test(secret);

async function verifyTurnstile(
  token: string,
  request: Request,
  secret: string,
  deps: Deps,
): Promise<boolean> {
  const res = await deps.fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      secret,
      response: token,
      remoteip: request.headers.get("CF-Connecting-IP") ?? undefined,
      idempotency_key: deps.uuid(),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  const result = (await res.json()) as { success?: boolean; hostname?: string };
  if (!result.success) return false;
  // A real token must come from a widget on this site's own hostname.
  if (!isTestSecret(secret) && result.hostname) {
    return result.hostname === new URL(request.url).hostname;
  }
  return true;
}

const ENGAGEMENT_LABEL: Record<Engagement, string> = {
  fixed: "Fixed",
  retained: "Retained",
  unsure: "Not sure",
};

export function emailFor(brief: Brief, id: string, environment: string) {
  const subject = [
    `Brief: ${brief.name}`,
    brief.company && `· ${brief.company}`,
    `· ${ENGAGEMENT_LABEL[brief.engagement]}`,
    environment !== "production" && `[${environment}]`,
  ]
    .filter(Boolean)
    .join(" ");
  const text = [
    `Name: ${brief.name}`,
    `Company: ${brief.company || "-"}`,
    `Email: ${brief.email}`,
    `Engagement: ${ENGAGEMENT_LABEL[brief.engagement]}`,
    `Page language: ${brief.lang}`,
    "",
    brief.message,
    "",
    `-- Brief ${id} (${environment}), sent from makeena.studio. Reply to answer the visitor.`,
  ].join("\n");
  return { subject: subject.slice(0, 200), text };
}

export async function handleBrief(
  request: Request,
  env: BriefEnv,
  // `fetch` is wrapped: called as `deps.fetch()` it would get `deps` as `this`, which the Workers
  // runtime rejects ("Illegal invocation").
  deps: Deps = {
    fetch: (input, init) => fetch(input, init),
    now: () => new Date(),
    uuid: () => crypto.randomUUID(),
  },
): Promise<Response> {
  if (request.method !== "POST") {
    return json({ ok: false, error: "method" }, 405, { allow: "POST" });
  }
  const url = new URL(request.url);
  const origin = request.headers.get("origin");
  if (origin && origin !== url.origin) return json({ ok: false, error: "origin" }, 403);
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) {
    return json({ ok: false, error: "too_large" }, 413);
  }

  let input: Record<string, unknown>;
  try {
    input = await readBody(request);
  } catch {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  // Honeypot: people never see this field; bots fill it. Pretend it worked.
  if (line(input.website)) return json({ ok: true });

  const { brief, errors } = validate(input);
  const token = line(input["cf-turnstile-response"]);
  if (!token) errors.turnstile = "required";
  if (!brief || errors.turnstile) return json({ ok: false, errors }, 400);

  const { TURNSTILE_SECRET_KEY, RESEND_API_KEY, BRIEF_TO_EMAIL, DB } = env;
  if (!TURNSTILE_SECRET_KEY || !RESEND_API_KEY || !BRIEF_TO_EMAIL || !DB) {
    console.error("brief: not configured", {
      turnstile: !!TURNSTILE_SECRET_KEY,
      resend: !!RESEND_API_KEY,
      to: !!BRIEF_TO_EMAIL,
      db: !!DB,
    });
    return json({ ok: false, error: "unavailable" }, 503);
  }

  try {
    if (!(await verifyTurnstile(token, request, TURNSTILE_SECRET_KEY, deps))) {
      return json({ ok: false, errors: { turnstile: "invalid" } }, 403);
    }
  } catch (error) {
    console.error("brief: siteverify failed", error);
    return json({ ok: false, error: "unavailable" }, 503);
  }

  const id = deps.uuid();
  const environment = env.ENVIRONMENT ?? "local";
  let stored = false;
  try {
    await DB.prepare(
      "INSERT INTO briefs (id, created_at, environment, lang, name, company, email, engagement, message) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        id,
        deps.now().toISOString(),
        environment,
        brief.lang,
        brief.name,
        brief.company || null,
        brief.email,
        brief.engagement,
        brief.message,
      )
      .run();
    stored = true;
  } catch (error) {
    console.error("brief: D1 insert failed", id, error);
  }

  let emailed = false;
  try {
    const { subject, text } = emailFor(brief, id, environment);
    const res = await deps.fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${RESEND_API_KEY}`,
        "content-type": "application/json",
        "idempotency-key": `brief-${id}`,
      },
      body: JSON.stringify({
        from: env.BRIEF_FROM_EMAIL ?? "Makeena briefs <onboarding@resend.dev>",
        to: [BRIEF_TO_EMAIL],
        reply_to: brief.email,
        subject,
        text,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (res.ok) {
      emailed = true;
      const { id: resendId } = (await res.json()) as { id?: string };
      if (stored) {
        try {
          await DB.prepare("UPDATE briefs SET emailed_at = ?, resend_id = ? WHERE id = ?")
            .bind(deps.now().toISOString(), resendId ?? null, id)
            .run();
        } catch (error) {
          console.error("brief: D1 update failed", id, error);
        }
      }
    } else {
      console.error("brief: Resend rejected", id, res.status, await res.text());
    }
  } catch (error) {
    console.error("brief: Resend failed", id, error);
  }

  if (!stored && !emailed) return json({ ok: false, error: "unavailable" }, 502);
  return json({ ok: true, id });
}
