import { langOf } from "../../i18n/config";

export type TransitionType = "nav" | "lang" | "none";

/**
 * The G2 transition for a navigation: `lang` (12 mirror-line) when the locale changes, `nav`
 * (11 section-cut) otherwise, `none` when motion is not allowed.
 */
export function transitionType(from: string, to: string, motionAllowed: boolean): TransitionType {
  if (!motionAllowed) return "none";
  const a = langOf(from);
  const b = langOf(to);
  return a && b && a !== b ? "lang" : "nav";
}
