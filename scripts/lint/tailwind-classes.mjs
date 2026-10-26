// Fails when a template uses a Tailwind class the design rules forbid (see class-rules.mjs).
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { checkClass, classTokens } from "./class-rules.mjs";

function* files(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* files(path);
    else if (/\.(astro|tsx?|jsx?|mdx?)$/.test(entry.name)) yield path;
  }
}

let problems = 0;
for (const file of files("src")) {
  for (const { token, line } of classTokens(readFileSync(file, "utf8"))) {
    const reason = checkClass(token);
    if (reason) {
      problems++;
      console.error(`${file}:${line}  ${token}  ${reason}`);
    }
  }
}
if (problems) {
  console.error(`\n${problems} forbidden class(es)`);
  process.exit(1);
}
console.log("Tailwind classes OK");
