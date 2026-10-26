// Every text/background pair the design may use, with its WCAG 2.2 minimum (PRD §6.1).
// A component that needs a new pair adds it here first; contrast.test.ts checks them all.

export type Token =
  "ivory" | "sand" | "ink" | "copper" | "copper-deep" | "muted" | "night" | "copper-light";

export interface Pair {
  fg: Token;
  bg: Token;
  /** 4.5 body text, 3 large text (≥ 24px) or non-text UI such as focus rings (WCAG 1.4.11). */
  min: 4.5 | 3;
  use: string;
}

export const pairs: Pair[] = [
  { fg: "ink", bg: "ivory", min: 4.5, use: "text" },
  { fg: "ink", bg: "sand", min: 4.5, use: "text on panels" },
  { fg: "muted", bg: "ivory", min: 4.5, use: "secondary text" },
  { fg: "muted", bg: "sand", min: 4.5, use: "secondary text on panels" },
  { fg: "copper-deep", bg: "ivory", min: 4.5, use: "labels, links, focus ring" },
  { fg: "copper-deep", bg: "sand", min: 4.5, use: "labels and links on panels" },
  { fg: "copper", bg: "ivory", min: 3, use: "display accents ≥ 24px only" },
  { fg: "copper", bg: "sand", min: 3, use: "display accents ≥ 24px on panels" },
  { fg: "ivory", bg: "night", min: 4.5, use: "text on night blocks and after hours" },
  { fg: "ivory", bg: "ink", min: 4.5, use: "skip link, solid buttons" },
  { fg: "ivory", bg: "copper-deep", min: 4.5, use: "solid button hover" },
  { fg: "copper-light", bg: "night", min: 4.5, use: "labels and focus ring on night" },
];

/** Pairs that must never be used: listed so the test proves they really fail. */
export const forbidden: Pair[] = [
  { fg: "copper", bg: "ivory", min: 4.5, use: "copper is not for small text" },
  { fg: "muted", bg: "night", min: 4.5, use: "muted text does not work on night" },
];

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
