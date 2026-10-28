import { describe, expect, it } from "vitest";
import { emailFor, handleBrief, validate, type BriefEnv, type Deps } from "../../worker/brief";
import worker from "../../worker/index";

// /api/brief (PRD §9.6, decision 0018): validation, Turnstile, D1 first, then Resend.
const ORIGIN = "https://makeena-website.makeena.workers.dev";
const SECRET = "real-secret";

const valid = {
  lang: "en",
  name: "Mariam Al-Kuwari",
  company: "Lusail Developments",
  email: "mariam@example.com",
  engagement: "retained",
  message: "A tower launch in Q2: aerials and off-plan stills.",
  "cf-turnstile-response": "token-123",
};

function post(body: Record<string, string>, headers: Record<string, string> = {}) {
  const form = new FormData();
  for (const [k, v] of Object.entries(body)) form.set(k, v);
  return new Request(`${ORIGIN}/api/brief`, {
    method: "POST",
    body: form,
    headers: { origin: ORIGIN, "CF-Connecting-IP": "203.0.113.7", ...headers },
  });
}

interface Call {
  url: string;
  init: RequestInit;
  body: Record<string, unknown>;
}

function setup(
  opts: {
    siteverify?: { success: boolean; hostname?: string };
    resend?: number;
    dbFails?: boolean;
    env?: Partial<BriefEnv>;
  } = {},
) {
  const calls: Call[] = [];
  const rows: { sql: string; values: unknown[] }[] = [];
  const fakeFetch = (async (input: RequestInfo | URL, init: RequestInit = {}) => {
    const url = String(input);
    calls.push({ url, init, body: JSON.parse(String(init.body)) });
    if (url.includes("siteverify")) {
      return Response.json(
        opts.siteverify ?? { success: true, hostname: "makeena-website.makeena.workers.dev" },
      );
    }
    const status = opts.resend ?? 200;
    return status === 200
      ? Response.json({ id: "resend-1" })
      : new Response("rejected", { status });
  }) as typeof fetch;
  const DB = {
    prepare: (sql: string) => ({
      bind: (...values: unknown[]) => ({
        run: async () => {
          if (opts.dbFails) throw new Error("D1 down");
          rows.push({ sql, values });
          return {};
        },
      }),
    }),
  };
  const env: BriefEnv = {
    DB,
    TURNSTILE_SECRET_KEY: SECRET,
    RESEND_API_KEY: "re_test",
    BRIEF_TO_EMAIL: "founder@example.com",
    ENVIRONMENT: "preview",
    ...opts.env,
  };
  let n = 0;
  const deps: Deps = {
    fetch: fakeFetch,
    now: () => new Date("2026-10-27T12:00:00Z"),
    uuid: () => `uuid-${++n}`,
  };
  return { calls, rows, env, deps };
}

describe("validate", () => {
  it("accepts a complete brief and trims it", () => {
    const { brief, errors } = validate({ ...valid, name: "  Mariam  " });
    expect(errors).toEqual({});
    expect(brief?.name).toBe("Mariam");
  });

  it("names every problem, field by field", () => {
    const { brief, errors } = validate({ email: "not-an-email", engagement: "monthly" });
    expect(brief).toBeUndefined();
    expect(errors).toEqual({
      name: "required",
      email: "invalid",
      engagement: "invalid",
      message: "required",
    });
  });

  it("caps lengths; company is optional", () => {
    const { errors } = validate({ ...valid, company: "", message: "x".repeat(5001) });
    expect(errors).toEqual({ message: "too_long" });
  });

  it("keeps names to one line (they go into the email subject)", () => {
    expect(validate({ ...valid, name: "A\r\nBcc: x@y.z" }).brief?.name).toBe("A Bcc: x@y.z");
  });
});

describe("handleBrief", () => {
  it("only accepts POST", async () => {
    const { env, deps } = setup();
    const res = await handleBrief(new Request(`${ORIGIN}/api/brief`), env, deps);
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("POST");
  });

  it("rejects other origins", async () => {
    const { env, deps, calls } = setup();
    const res = await handleBrief(post(valid, { origin: "https://evil.example" }), env, deps);
    expect(res.status).toBe(403);
    expect(calls).toHaveLength(0);
  });

  it("drops a filled honeypot silently", async () => {
    const { env, deps, calls, rows } = setup();
    const res = await handleBrief(post({ ...valid, website: "spam.example" }), env, deps);
    expect(await res.json()).toEqual({ ok: true });
    expect(calls).toHaveLength(0);
    expect(rows).toHaveLength(0);
  });

  it("returns field errors, including a missing Turnstile token", async () => {
    const { env, deps, calls } = setup();
    const res = await handleBrief(
      post({ ...valid, email: "x", "cf-turnstile-response": "" }),
      env,
      deps,
    );
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      ok: false,
      errors: { email: "invalid", turnstile: "required" },
    });
    expect(calls).toHaveLength(0);
  });

  it("is unavailable (503) until its secrets and database are configured", async () => {
    const { env, deps, calls } = setup({ env: { RESEND_API_KEY: undefined } });
    const res = await handleBrief(post(valid), env, deps);
    expect(res.status).toBe(503);
    expect(calls).toHaveLength(0);
  });

  it("refuses a token Siteverify rejects", async () => {
    const { env, deps, rows } = setup({ siteverify: { success: false } });
    const res = await handleBrief(post(valid), env, deps);
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ ok: false, errors: { turnstile: "invalid" } });
    expect(rows).toHaveLength(0);
  });

  it("refuses a real token issued for another hostname", async () => {
    const { env, deps } = setup({ siteverify: { success: true, hostname: "elsewhere.example" } });
    expect((await handleBrief(post(valid), env, deps)).status).toBe(403);
  });

  it("accepts Turnstile's test secret, which reports no real hostname", async () => {
    const { env, deps } = setup({
      siteverify: { success: true, hostname: "example.com" },
      env: { TURNSTILE_SECRET_KEY: "1x0000000000000000000000000000000AA" },
    });
    expect((await handleBrief(post(valid), env, deps)).status).toBe(200);
  });

  it("verifies, stores, then emails with the visitor as Reply-To", async () => {
    const { env, deps, calls, rows } = setup();
    const res = await handleBrief(post(valid), env, deps);
    expect(await res.json()).toEqual({ ok: true, id: "uuid-2" });

    const [verify, send] = calls;
    expect(verify.url).toContain("turnstile/v0/siteverify");
    expect(verify.body).toMatchObject({
      secret: SECRET,
      response: "token-123",
      remoteip: "203.0.113.7",
      idempotency_key: "uuid-1",
    });

    expect(rows[0].sql).toMatch(/^INSERT INTO briefs/);
    expect(rows[0].values).toEqual([
      "uuid-2",
      "2026-10-27T12:00:00.000Z",
      "preview",
      "en",
      "Mariam Al-Kuwari",
      "Lusail Developments",
      "mariam@example.com",
      "retained",
      valid.message,
    ]);

    expect(send.url).toBe("https://api.resend.com/emails");
    const headers = send.init.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer re_test");
    expect(headers["idempotency-key"]).toBe("brief-uuid-2");
    expect(send.body).toMatchObject({
      from: "Makeena briefs <onboarding@resend.dev>",
      to: ["founder@example.com"],
      reply_to: "mariam@example.com",
      subject: "Brief: Mariam Al-Kuwari · Lusail Developments · Retained [preview]",
    });

    expect(rows[1].sql).toMatch(/^UPDATE briefs SET emailed_at/);
    expect(rows[1].values).toEqual(["2026-10-27T12:00:00.000Z", "resend-1", "uuid-2"]);
  });

  it("still succeeds when the email fails but the brief is stored", async () => {
    const { env, deps, rows } = setup({ resend: 500 });
    const res = await handleBrief(post(valid), env, deps);
    expect(res.status).toBe(200);
    expect(rows).toHaveLength(1);
  });

  it("still succeeds when D1 fails but the email is sent", async () => {
    const { env, deps, calls } = setup({ dbFails: true });
    expect((await handleBrief(post(valid), env, deps)).status).toBe(200);
    expect(calls.map((c) => c.url)).toContain("https://api.resend.com/emails");
  });

  it("fails (502) only when the brief could be neither stored nor emailed", async () => {
    const { env, deps } = setup({ dbFails: true, resend: 500 });
    expect((await handleBrief(post(valid), env, deps)).status).toBe(502);
  });
});

describe("emailFor", () => {
  it("leaves out an empty company and the environment tag in production", () => {
    const { subject, text } = emailFor(
      { ...validate(valid).brief!, company: "" },
      "id-1",
      "production",
    );
    expect(subject).toBe("Brief: Mariam Al-Kuwari · Retained");
    expect(text).toContain("Company: -");
    expect(text).toContain("Brief id-1 (production)");
  });
});

describe("worker", () => {
  const env = {
    ...setup().env,
    ASSETS: { fetch: async () => new Response("asset", { status: 200 }) },
  };

  it("hands non-API requests to the static assets", async () => {
    const res = await worker.fetch(new Request(`${ORIGIN}/en/`), env);
    expect(await res.text()).toBe("asset");
  });

  it("answers unknown API routes with a JSON 404", async () => {
    const res = await worker.fetch(new Request(`${ORIGIN}/api/nope`), env);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ ok: false, error: "not_found" });
  });
});
