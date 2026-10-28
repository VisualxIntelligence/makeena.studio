// The site's Worker (PRD §11.3, decision 0005): only /api/* reaches it first (wrangler.jsonc
// `run_worker_first`); every other request is served from the static assets, and anything the
// assets don't have falls through to here and is handed back to them (their 404 handling).
import { handleBrief, type BriefEnv } from "./brief";

interface Env extends BriefEnv {
  ASSETS: { fetch(request: Request): Promise<Response> };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === "/api/brief") return handleBrief(request, env);
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ ok: false, error: "not_found" }), {
        status: 404,
        headers: { "content-type": "application/json; charset=utf-8" },
      });
    }
    return env.ASSETS.fetch(request);
  },
};
