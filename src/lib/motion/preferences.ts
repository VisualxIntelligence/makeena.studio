// Motion preferences (PRD §8.1): the OS setting and the visitor's footer control.

const KEY = "mkn-motion";
const reducedQuery = "(prefers-reduced-motion: reduce)";

/** The visitor turned motion off with the footer control. */
export function userMotionOff(): boolean {
  try {
    return localStorage.getItem(KEY) === "off";
  } catch {
    return false;
  }
}

export function setUserMotionOff(off: boolean): void {
  try {
    if (off) localStorage.setItem(KEY, "off");
    else localStorage.removeItem(KEY);
  } catch {
    // Storage blocked: the choice lasts until the next full page load.
  }
}

export const osReducedMotion = () => matchMedia(reducedQuery).matches;

/** Save-Data or a 2G connection: never fetch heavy media (CLAUDE.md, PRD §8.1). */
export function saveData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

/**
 * Media queries for gsap.matchMedia(). When the visitor turned motion off, only `reduced`
 * matches, whatever the OS says.
 */
export function motionQueries(): Record<"desktop" | "mobile" | "reduced", string> {
  if (userMotionOff()) return { desktop: "not all", mobile: "not all", reduced: "all" };
  return {
    desktop: "(width >= 64rem) and (prefers-reduced-motion: no-preference)",
    mobile: "(width < 64rem) and (prefers-reduced-motion: no-preference)",
    reduced: reducedQuery,
  };
}
