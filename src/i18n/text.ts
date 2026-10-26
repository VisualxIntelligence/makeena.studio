// Helpers for mixing Latin identifiers and placeholders into Arabic text (PRD §7.1).

/** Arabic script: base block, supplement, extended-A and both presentation-form blocks. */
export const ARABIC_RANGES = [
  [0x0600, 0x06ff],
  [0x0750, 0x077f],
  [0x08a0, 0x08ff],
  [0xfb50, 0xfdff],
  [0xfe70, 0xfeff],
] as const;

/** Character class source matching one Arabic-script character. */
export const ARABIC_CLASS = `[${ARABIC_RANGES.map(
  ([a, b]) => `${String.fromCodePoint(a)}-${String.fromCodePoint(b)}`,
).join("")}]`;

const ARABIC = new RegExp(ARABIC_CLASS);

/** True when the text contains no Arabic letters (identifiers, English names, placeholders). */
export const isLatinOnly = (text: string) => !ARABIC.test(text);

export interface LabelPart {
  text: string;
  /** Identifier run (digits, Latin letters) that stays LTR and keeps the mono style in Arabic. */
  ltr: boolean;
}

/**
 * Splits a section label such as `00 · الدوحة · QFC 04998` on its `·` separators so Latin and
 * digit runs can be marked `dir="ltr"`. Separators are kept as their own parts.
 */
export function labelParts(label: string): LabelPart[] {
  return label
    .split(/( · )/)
    .filter(Boolean)
    .map((text) => ({ text, ltr: text !== " · " && isLatinOnly(text) }));
}
