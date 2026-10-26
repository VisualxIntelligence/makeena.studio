// G2 · navigation transitions on Astro's ClientRouter (PRD §8.2, decisions 0002 and 0008).
// The router runs a same-document view transition for every navigation, in every browser that
// supports them (Firefox included). This module picks the transition type; the animations live
// in src/styles/view-transitions.css:
// - `lang` (12 mirror-line) when the locale changes, i.e. the language switch;
// - `nav` (11 section-cut) for every other navigation; its direction follows the new page's dir;
// - `none` under OS reduced motion or the footer control: the transition is skipped.
import { motion } from "../motion";
import { transitionType, type TransitionType } from "./type";

let type: TransitionType = "nav";

document.addEventListener("astro:before-preparation", (event) => {
  type = transitionType(event.from.pathname, event.to.pathname, motion.allowed);
});

document.addEventListener("astro:before-swap", (event) => {
  const transition = event.viewTransition as ViewTransition & { types?: Set<string> };
  if (type === "none") {
    transition.skipTransition();
    return;
  }
  // The router replaces <html>'s attributes with the incoming page's, so the flag goes on the
  // new document. CSS keys off html[data-vt] (it works where view-transition types don't).
  event.newDocument.documentElement.dataset.vt = type;
  transition.types?.add(type);
  transition.finished.finally(() => {
    delete document.documentElement.dataset.vt;
  });
});
