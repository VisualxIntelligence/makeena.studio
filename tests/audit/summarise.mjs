// Prints the a11y audit findings grouped by check, with the pages each one appears on.
import { readdirSync, readFileSync } from "node:fs";

const dir = "test-results/a11y-audit";
const byCheck = new Map();
for (const file of readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const { path, findings } = JSON.parse(readFileSync(`${dir}/${file}`, "utf8"));
  for (const { check, detail } of findings) {
    if (check === "info") continue;
    const key = `${check} — ${detail}`;
    if (!byCheck.has(key)) byCheck.set(key, []);
    byCheck.get(key).push(path);
  }
}
const rows = [...byCheck].sort(([a], [b]) => a.localeCompare(b));
for (const [key, paths] of rows) {
  console.log(
    `${key}\n    ${paths.length} page(s): ${paths.slice(0, 6).join(" ")}${paths.length > 6 ? " …" : ""}`,
  );
}
console.log(`\n${rows.length} distinct findings`);
