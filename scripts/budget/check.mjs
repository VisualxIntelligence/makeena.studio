// Page-weight budgets from PRD §13, measured on the built site (gzip, like the CDN serves it):
// HTML + CSS ≤ 45 KB per page; initial JS ≤ 70 KB, ≤ 85 KB on the aerial page. Fonts are
// checked by tests/e2e/fonts.spec.ts and LCP/CLS by Lighthouse CI.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { gzipSync } from "node:zlib";

const DIST = resolve("dist");
const KB = 1024;
const budgets = (page) => ({
  htmlCss: 45 * KB,
  js: /\/capability\/aerial-perspective\//.test(page) ? 85 * KB : 70 * KB,
});

const gz = (text) => gzipSync(text).length;
const fromDist = (url) => join(DIST, url.replace(/^\//, ""));

function* htmlFiles(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith(".html")) yield path;
  }
}

/** A module and everything it imports statically (Astro's chunks import each other). */
function moduleGraph(file, seen = new Set()) {
  if (seen.has(file)) return seen;
  seen.add(file);
  const code = readFileSync(file, "utf8");
  for (const [, spec] of code.matchAll(/\bimport\s*(?:[^"'()]*?from\s*)?["']([^"']+)["']/g)) {
    if (spec.startsWith(".")) moduleGraph(resolve(dirname(file), spec), seen);
  }
  return seen;
}

const rows = [];
let failed = false;
for (const file of htmlFiles(DIST)) {
  const html = readFileSync(file, "utf8");
  const page =
    "/" +
    relative(DIST, file)
      .split(sep)
      .join("/")
      .replace(/index[.]html$/, "");
  const css = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)]
    .map(([, href]) => gz(readFileSync(fromDist(href))))
    .reduce((a, b) => a + b, 0);
  const modules = new Set();
  for (const [, src] of html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g)) {
    moduleGraph(fromDist(src), modules);
  }
  // Astro inlines small scripts; they count towards JS as well as HTML.
  const inline = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([^]*?)<[/]script>/g)]
    .map(([, code]) => code.trim())
    .filter(Boolean);
  const js =
    [...modules].map((f) => gz(readFileSync(f))).reduce((a, b) => a + b, 0) +
    inline.map(gz).reduce((a, b) => a + b, 0);
  const htmlCss = gz(html) + css;
  const b = budgets(page);
  const ok = htmlCss <= b.htmlCss && js <= b.js;
  failed ||= !ok;
  rows.push({ page, htmlCss, js, ok, b });
}

for (const r of rows.sort((a, b) => a.page.localeCompare(b.page))) {
  const kb = (n) => (n / KB).toFixed(1).padStart(5);
  console.log(
    `${r.ok ? "ok  " : "FAIL"} ${r.page.padEnd(44)} html+css ${kb(r.htmlCss)} / ${r.b.htmlCss / KB} KB` +
      `   js ${kb(r.js)} / ${r.b.js / KB} KB`,
  );
}
if (failed) {
  console.error("\nPage-weight budget exceeded (PRD §13).");
  process.exit(1);
}
