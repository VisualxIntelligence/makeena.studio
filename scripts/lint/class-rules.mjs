// Tailwind classes the design rules forbid (PRD §6, §7; CLAUDE.md). Stylelint covers CSS files;
// this covers utility classes in templates.

const rules = [
  {
    reason: "physical direction: use logical utilities (ms-/me-/ps-/pe-/start-/end-/text-start)",
    test: (c) =>
      /^(m|p|scroll-m|scroll-p)[lr]-/.test(c) ||
      /^(left|right)-/.test(c) ||
      /^(text|float|clear)-(left|right)$/.test(c) ||
      /^(rounded|border)-([lr]|tl|tr|bl|br)($|-)/.test(c),
  },
  { reason: "no shadows (PRD §6.1)", test: (c) => /^(inset-|drop-|text-)?shadow(-|$)/.test(c) },
  {
    reason: "no gradients (PRD §6.1)",
    test: (c) => /^bg-(linear|radial|conic|gradient)(-|$)/.test(c) || /^(from|via|to)-/.test(c),
  },
  { reason: "no backdrop-filter (PRD §6.1)", test: (c) => /^backdrop-/.test(c) },
  {
    reason: "radius ≤ 2px: use rounded-xs or rounded-sm (PRD §6.1)",
    test: (c) => /^rounded(-[a-z]+)?-(full|\[.*\])$/.test(c),
  },
];

/** Strip variants (`md:hover:`), the important flag and a negative sign: `md:-ml-4!` → `ml-4`. */
export function baseClass(token) {
  let depth = 0;
  let start = 0;
  for (let i = 0; i < token.length; i++) {
    if (token[i] === "[") depth++;
    else if (token[i] === "]") depth--;
    else if (token[i] === ":" && depth === 0) start = i + 1;
  }
  return token.slice(start).replace(/^!|!$/g, "").replace(/^-/, "");
}

/** Returns why a class is not allowed, or null. */
export function checkClass(token) {
  const c = baseClass(token);
  return rules.find((r) => r.test(c))?.reason ?? null;
}

/** Class tokens from class="…", class='…', class={…} and class:list={…} attributes. */
export function classTokens(source) {
  const out = [];
  const re = /\bclass(?::list)?=(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g;
  for (const m of source.matchAll(re)) {
    const value = m[1] ?? m[2] ?? (m[3] ?? "").replace(/["'`]/g, " ");
    const line = source.slice(0, m.index).split("\n").length;
    for (const token of value.split(/\s+/).filter(Boolean)) out.push({ token, line });
  }
  return out;
}
