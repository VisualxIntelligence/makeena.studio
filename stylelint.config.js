// Design rules from PRD §6 and §11.1 that a linter can enforce. Disable a rule inline only with
// a comment saying why (e.g. a physical direction that must not mirror, PRD §7.2).
/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard", "stylelint-config-html/astro"],
  ignoreFiles: ["dist/**", ".astro/**", "public/**", "node_modules/**"],
  rules: {
    // Scoped styles plus :global() make source order a poor proxy for specificity.
    "no-descending-specificity": null,
    // Astro scoped-style escape hatch. Ignoring it also sidesteps a Stylelint 17.16 crash on
    // `[attr] :global(x)` in this rule.
    "selector-pseudo-class-no-unknown": [true, { ignorePseudoClasses: ["global"] }],
    // BEM-style elements and modifiers (`aerial__filmstrip`, `cut--b`) are allowed.
    "selector-class-pattern": [
      "^[a-z][a-z0-9]*((-{1,2}|__)[a-z0-9]+)*$",
      { message: "Use kebab-case class names (BEM `__element` and `--modifier` allowed)" },
    ],
    "function-disallowed-list": [
      ["linear-gradient", "radial-gradient", "conic-gradient", "/^repeating-/"],
      { message: "No gradients (PRD §6)" },
    ],
    "property-disallowed-list": [
      [
        "backdrop-filter",
        "-webkit-backdrop-filter",
        "box-shadow",
        // Physical directions: use logical properties (PRD §7, CLAUDE.md).
        "/^(left|right)$/",
        "/^(?!--).*-(left|right)(-|$)/", // not custom properties
      ],
      {
        message:
          "Not allowed: backdrop-filter and shadows (PRD §6); physical left/right (use logical properties)",
      },
    ],
    "declaration-property-value-disallowed-list": [
      {
        "/^(float|clear|text-align|caption-side)$/": ["left", "right"],
        // Radius ≤ 2px: flags pixel values above 2 and percentages.
        "/radius$/": [String.raw`/\b([3-9]|[1-9]\d+)(\.\d+)?px\b/`, "/%/"],
      },
      { message: "Use start/end, not left/right; border radius must be ≤ 2px (PRD §6)" },
    ],
  },
};
