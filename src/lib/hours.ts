// 13 · after hours (PRD §8.4). `data-hours="night"` on <html> switches figures that have a night
// variant (the hero) to it; the site is not recoloured. Triggers: the footer toggle, N, or typing
// "doha". The swap is a same-document view-transition crossfade (instant under reduced motion)
// and never runs during a page transition. The state is set before first paint by the inline
// script in BaseLayout and survives navigation and the language switch.
import { crossfade } from "./crossfade";
import { onPage } from "./lifecycle";

const HOURS = "mkn-hours";
const SHORTCUTS = "mkn-shortcuts";
const root = document.documentElement;

const read = (key: string) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string, value: string | null) => {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Storage blocked: the setting lasts until the next full page load.
  }
};

export const isNight = () => root.dataset.hours === "night";
export const shortcutsOn = () => read(SHORTCUTS) !== "off";

let toastTimer: ReturnType<typeof setTimeout> | undefined;

function toast(show: boolean): void {
  const box = document.querySelector<HTMLElement>("[data-toast]");
  const text = box?.querySelector<HTMLElement>("[data-toast-text]");
  const close = box?.querySelector<HTMLButtonElement>("[data-toast-close]");
  if (!box || !text || !close) return;
  clearTimeout(toastTimer);
  text.textContent = show ? (box.dataset.afterHours ?? "") : "";
  close.hidden = !show;
  if (show) toastTimer = setTimeout(() => toast(false), 4000);
}

function sync(): void {
  document.querySelector("[data-hours-toggle]")?.setAttribute("aria-pressed", String(isNight()));
  document
    .querySelector("[data-shortcuts-toggle]")
    ?.setAttribute("aria-pressed", String(shortcutsOn()));
}

/**
 * Night variants are lazy and hidden until after hours, so browsers don't fetch them. WebKit never
 * fetches a lazy image that was display:none at load once it is shown, so make them eager on
 * activation: every engine then starts the download.
 */
function wakeNightImages(): void {
  for (const img of document.querySelectorAll<HTMLImageElement>('[data-variant="night"] img')) {
    img.loading = "eager";
  }
}

/** Switches after hours on or off, with a crossfade when motion is allowed. */
export async function setNight(night: boolean): Promise<void> {
  if (night === isNight()) return;
  write(HOURS, night ? "night" : null);
  if (night) wakeNightImages();
  const apply = () => {
    if (night) root.dataset.hours = "night";
    else delete root.dataset.hours;
    sync();
  };
  await crossfade(apply);
  toast(night);
}

/** Keys pressed in a field, or with any modifier, never trigger shortcuts (WCAG 2.1.4). */
function ignored(event: KeyboardEvent): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || event.repeat) return true;
  const target = event.target as HTMLElement | null;
  return !!target?.closest(
    "input, textarea, select, [contenteditable]:not([contenteditable='false'])",
  );
}

// Physical keys (event.code), so N and "doha" also work on an Arabic keyboard layout.
const LETTERS: Record<string, string> = { KeyD: "d", KeyO: "o", KeyH: "h", KeyA: "a" };
let typed = "";
let typedAt = 0;

document.addEventListener("keydown", (event) => {
  if (!shortcutsOn() || ignored(event)) {
    typed = "";
    return;
  }
  if (event.code === "KeyN") {
    typed = "";
    void setNight(!isNight());
    return;
  }
  const letter = LETTERS[event.code];
  if (!letter || event.timeStamp - typedAt > 1500) typed = "";
  typedAt = event.timeStamp;
  if (!letter) return;
  typed = (typed + letter).slice(-4);
  if (typed === "doha") {
    typed = "";
    void setNight(!isNight());
  }
});

onPage((signal) => {
  sync();
  if (isNight()) wakeNightImages();
  const hours = document.querySelector<HTMLButtonElement>("[data-hours-toggle]");
  const shortcuts = document.querySelector<HTMLButtonElement>("[data-shortcuts-toggle]");
  const close = document.querySelector<HTMLButtonElement>("[data-toast-close]");
  if (hours) {
    hours.hidden = false;
    hours.addEventListener("click", () => void setNight(!isNight()), { signal });
  }
  if (shortcuts) {
    shortcuts.hidden = false;
    shortcuts.addEventListener(
      "click",
      () => {
        write(SHORTCUTS, shortcutsOn() ? "off" : null);
        sync();
      },
      { signal },
    );
  }
  close?.addEventListener("click", () => toast(false), { signal });
});
