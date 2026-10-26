import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { contrast, forbidden, pairs, type Token } from "./contrast";

// Read the tokens from the stylesheet itself, so the test follows any change to @theme.
const css = readFileSync(new URL("./global.css", import.meta.url), "utf8");
const tokens = Object.fromEntries(
  [...css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})/gi)].map(([, name, hex]) => [name, hex]),
) as Record<Token, string>;

describe("design tokens", () => {
  it("match PRD §6.1", () => {
    expect(tokens).toEqual({
      ivory: "#f6f2ea",
      sand: "#efeae1",
      ink: "#1a1a1a",
      copper: "#b4653a",
      "copper-deep": "#9a522c",
      muted: "#5c5650",
      night: "#141414",
      "copper-light": "#c8a27a",
    });
  });
});

describe("contrast: allowed pairs meet WCAG 2.2 AA", () => {
  for (const { fg, bg, min, use } of pairs) {
    it(`${fg} on ${bg} ≥ ${min}:1 (${use})`, () => {
      expect(contrast(tokens[fg], tokens[bg])).toBeGreaterThanOrEqual(min);
    });
  }
});

describe("contrast: forbidden pairs really fail", () => {
  for (const { fg, bg, min, use } of forbidden) {
    it(`${fg} on ${bg} < ${min}:1 (${use})`, () => {
      expect(contrast(tokens[fg], tokens[bg])).toBeLessThan(min);
    });
  }
});

it("contrast() matches known WCAG values", () => {
  expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
  expect(contrast("#777777", "#ffffff")).toBeCloseTo(4.48, 2);
});
