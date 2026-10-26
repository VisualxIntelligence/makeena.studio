// Same-document crossfades (13 after hours, 07's stops): a 300 ms view-transition fade of the page,
// styled by html[data-vt="fade"] in view-transitions.css; instant when motion is not allowed.
// - A fade waits for a page transition to end, but not for another fade: a new fade replaces the
//   running one at once (the browser skips the old transition).
// - Calls are tagged when made, so the last call always wins: a call superseded while waiting is
//   dropped (each update applies the latest state), and only the last fade clears the flag. A
//   skipped fade therefore never leaves a newer one without its styles (it would fall back to the
//   11 section-cut).
import { motion } from "./motion";

let latest = 0;

export async function crossfade(update: () => void): Promise<void> {
  if (!motion.allowed || !document.startViewTransition) {
    update();
    return;
  }
  const token = ++latest;
  const root = document.documentElement;
  const active = (document as Document & { activeViewTransition?: ViewTransition })
    .activeViewTransition;
  const ownFade = root.dataset.vt === "fade";
  if (!ownFade && (active || root.dataset.astroTransition)) await motion.idle();
  if (token !== latest) return;

  root.dataset.vt = "fade";
  const transition = document.startViewTransition(update);
  // A newer fade skips this one: expected, not an error.
  transition.ready.catch(() => undefined);
  transition.finished
    .catch(() => undefined)
    .finally(() => {
      if (token === latest) delete root.dataset.vt;
    });
}
