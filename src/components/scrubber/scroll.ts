// MatchedFrameScrubber, scroll mode (03, PRD §9.2). A G1 effect, so it starts on the visitor's
// first interaction like every effect; until then the stage is sticky (decision 0015):
// - ScrollTrigger pins the stage (`pin`, no spacing: the track reserves the distance in CSS) and
//   scrubs the canvas sequence, the timecode, the rail and the chapter (aria-current, the
//   canvas's aria-label);
// - frames are fetched only after that first interaction and within one viewport of the section,
//   and decoded in a small window around the target (sequence-player.ts). A visitor who never
//   scrolls never downloads the sequence, and nothing competes with the LCP poster;
// - under reduced motion, Save-Data, low device memory or without an AVIF decoder the effect
//   shows the stills instead, and switches live when the motion preference changes;
// - 13 after hours: the night sequence plays while html[data-hours="night"], and the frames swap
//   when it changes (the night sequence is fetched only once after hours is on).
import { motion, registerEffect } from "../../lib/motion";
import { SequencePlayer } from "./sequence-player";

interface Variant {
  width: number;
  height: number;
  count: number;
  path: string;
}

interface Frames {
  desktop: Variant;
  mobile: Variant;
  alts: string[];
}

interface Config extends Frames {
  virtualFrames: number;
  night?: Frames;
}

// A 2 × 2 AVIF: decoding it tells whether the browser can play the sequence, with no request.
// Browsers that can't (e.g. Playwright's Windows WebKit) get the stills (decision 0003).
const PROBE =
  "AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAANZtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAACJpbG9jAAAAAERAAAEAAQAAAAAA+gABAAAAAAAAACMAAAAjaWluZgAAAAAAAQAAABVpbmZlAgAAAAABAABhdjAxAAAAAA5waXRtAAAAAAABAAAAVmlwcnAAAAA4aXBjbwAAAAxhdjFDgQAMAAAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAABZpcG1hAAAAAAAAAAEAAQOBAgMAAAArbWRhdBIACggYADaICGg0IDIVGUeHhiGAAGgAAJBAyRwe0yXk8JII";

let avif: Promise<boolean> | undefined;
function decodesAvif(): Promise<boolean> {
  avif ??= (async () => {
    try {
      const bytes = Uint8Array.from(atob(PROBE), (c) => c.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/avif" }));
      bitmap.close();
      return true;
    } catch {
      return false;
    }
  })();
  return avif;
}

/** Resolves once the page has fired `load` (PRD §9.2: frames only after load). */
const loaded = (): Promise<void> =>
  document.readyState === "complete"
    ? Promise.resolve()
    : new Promise((resolve) => addEventListener("load", () => resolve(), { once: true }));

/** Heavy media is allowed (PRD §9.2 fallbacks): Save-Data off and at least 4 GB of memory. */
function heavyMediaAllowed(): boolean {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  return motion.canLoadHeavyMedia && memory >= 4;
}

/** Shows the stills. Their lazy images were display:none, which WebKit never fetches once shown
 *  unless they are made eager (decision 0012). */
function showStills(root: HTMLElement): void {
  delete root.dataset.flight;
  for (const img of root.querySelectorAll<HTMLImageElement>(".flight__stills img")) {
    img.loading = "eager";
  }
}

function setup(
  root: HTMLElement,
  ScrollTrigger: typeof import("gsap/ScrollTrigger").ScrollTrigger,
  signal: AbortSignal,
): () => void {
  const config: Config = JSON.parse(
    root.querySelector("[data-flight-config]")?.textContent ?? "{}",
  );
  const track = root.querySelector<HTMLElement>(".flight__track")!;
  const stage = root.querySelector<HTMLElement>(".flight__stage")!;
  const canvas = root.querySelector<HTMLCanvasElement>(".flight__canvas")!;
  const timecode = root.querySelector<HTMLElement>("[data-flight-timecode]")!;
  const rail = root.querySelector<HTMLElement>("[data-flight-rail]")!;
  const chapters = [...root.querySelectorAll<HTMLLIElement>(".flight__filmstrip li")];
  root.dataset.flight = "sequence";

  const mobile = matchMedia("(width < 48rem)").matches;
  const html = document.documentElement;
  const frames = (): Frames => (html.dataset.hours === "night" && config.night) || config;
  const urls = (f: Frames) => {
    const variant = mobile ? f.mobile : f.desktop;
    return Array.from({ length: variant.count }, (_, i) =>
      variant.path.replace("{NNNN}", String(i + 1).padStart(4, "0")),
    );
  };
  const variant = mobile ? config.mobile : config.desktop;
  let current = frames();
  const player = new SequencePlayer(canvas, urls(current), variant.width, variant.height);
  canvas.setAttribute("aria-label", current.alts[0]);
  // Read by the e2e tests (decoded-window bound).
  (root as HTMLElement & { flightPlayer?: SequencePlayer }).flightPlayer = player;
  const resize = new ResizeObserver(() => player.resize());
  resize.observe(canvas);

  // The stage pins under the sticky header.
  const top = () => document.querySelector<HTMLElement>(".site-header")?.offsetHeight ?? 0;
  let chapter = 0;
  const trigger = ScrollTrigger.create({
    trigger: track,
    pin: stage,
    pinSpacing: false,
    anticipatePin: 1,
    start: () => `top ${top()}px`,
    end: "bottom bottom",
    scrub: 0.4,
    invalidateOnRefresh: true,
    onUpdate(self) {
      const p = self.progress;
      player.setProgress(p);
      timecode.textContent = String(Math.round(p * config.virtualFrames)).padStart(4, "0");
      rail.style.setProperty("--p", p.toFixed(4));
      const next = Math.min(chapters.length - 1, Math.floor(p * chapters.length));
      if (next !== chapter) {
        chapters[chapter].removeAttribute("aria-current");
        chapters[next].setAttribute("aria-current", "step");
        canvas.setAttribute("aria-label", current.alts[next]);
        chapter = next;
      }
    },
  });

  // Fetch frames only within one viewport of the section (the effect itself starts on the first
  // interaction, always after load).
  const near = new IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      near.disconnect();
      void Promise.all([decodesAvif(), loaded()]).then(([ok]) => {
        if (signal.aborted) return;
        if (ok) player.start();
        else {
          root.dataset.avif = "no";
          trigger.kill(true);
          showStills(root);
        }
      });
    },
    { rootMargin: "100% 0px" },
  );
  near.observe(root);

  // 13: swap the frames when after hours changes (same frame count and size).
  const hours = new MutationObserver(() => {
    const next = frames();
    if (next === current) return;
    current = next;
    player.setSource(urls(current));
    canvas.setAttribute("aria-label", current.alts[chapter]);
  });
  hours.observe(html, { attributes: true, attributeFilter: ["data-hours"] });

  return () => {
    hours.disconnect();
    near.disconnect();
    resize.disconnect();
    trigger.kill(true);
    player.destroy();
    delete canvas.dataset.ready;
  };
}

registerEffect({
  name: "flight",
  selector: '[data-scrubber][data-mode="scroll"]',
  setup({ conditions, signal, ScrollTrigger }) {
    const roots = [
      ...document.querySelectorAll<HTMLElement>('[data-scrubber][data-mode="scroll"]'),
    ];
    if (conditions.reduced || !heavyMediaAllowed()) {
      roots.forEach(showStills);
      return;
    }
    const cleanups = roots
      .filter((root) => root.dataset.avif !== "no")
      .map((root) => setup(root, ScrollTrigger, signal));
    return () => cleanups.forEach((cleanup) => cleanup());
  },
});
