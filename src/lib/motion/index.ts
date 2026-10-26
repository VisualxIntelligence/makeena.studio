// G1 · motion controller (PRD §8.1). Every effect on the site goes through here:
// - GSAP and ScrollTrigger are loaded once, on demand: only pages with an effect fetch them,
//   and only on the visitor's first interaction, so they never compete with fonts and CSS for
//   first paint (decision 0008). Effects must therefore leave the markup in
//   its final, visible state until they run;
// - each effect runs inside gsap.matchMedia() with three conditions (desktop, mobile, reduced),
//   so switching OS reduced motion or the footer control reverts it and re-runs it in its
//   fallback state, with no reload;
// - effects set up on `astro:page-load` and are reverted on `astro:before-swap`, so nothing
//   leaks across ClientRouter navigations;
// - ScrollTrigger is refreshed once fonts are ready (pins mis-measure on /ar/ otherwise).
import type { gsap as Gsap } from "gsap";
import type { ScrollTrigger as ScrollTriggerType } from "gsap/ScrollTrigger";
import {
  motionQueries,
  osReducedMotion,
  saveData,
  setUserMotionOff,
  userMotionOff,
} from "./preferences";

type Engine = { gsap: typeof Gsap; ScrollTrigger: typeof ScrollTriggerType };
let engine: Engine | undefined;
let loading: Promise<Engine> | undefined;

function loadEngine(): Promise<Engine> {
  loading ??= Promise.all([import("gsap"), import("gsap/ScrollTrigger")]).then(([g, st]) => {
    g.gsap.registerPlugin(st.ScrollTrigger);
    // Mobile address-bar resizes must not re-measure pinned sections mid-scroll.
    st.ScrollTrigger.config({ ignoreMobileResize: true });
    engine = { gsap: g.gsap, ScrollTrigger: st.ScrollTrigger };
    return engine;
  });
  return loading;
}

let wanted: Promise<void> | undefined;

/**
 * Resolves on the first scroll, touch, pointer or key event. Effects only change content below
 * the fold, so a visitor who never interacts never needs GSAP, and it never competes with the
 * first paint. Content already on screen when an effect starts is never hidden.
 */
function whenWanted(): Promise<void> {
  wanted ??= new Promise<void>((resolve) => {
    const controller = new AbortController();
    for (const type of ["scroll", "wheel", "touchstart", "pointerdown", "keydown"]) {
      addEventListener(
        type,
        () => {
          controller.abort();
          resolve();
        },
        { once: true, passive: true, signal: controller.signal },
      );
    }
  });
  return wanted;
}

export interface Conditions {
  desktop: boolean;
  mobile: boolean;
  reduced: boolean;
}

export interface EffectContext {
  conditions: Conditions;
  /** Aborts when the effect is reverted (navigation or a motion-preference change). */
  signal: AbortSignal;
  gsap: typeof Gsap;
  ScrollTrigger: typeof ScrollTriggerType;
}

export interface Effect {
  name: string;
  /** The effect runs only on pages that contain this selector. */
  selector: string;
  /**
   * Builds the effect. With `conditions.reduced`, set the final state without tweens (or do
   * nothing when the markup already is the final state). May return a cleanup function.
   */
  setup: (ctx: EffectContext) => void | (() => void);
}

const effects: Effect[] = [];
const listeners = new Set<(allowed: boolean) => void>();
let media: ReturnType<typeof Gsap.matchMedia> | undefined;
/** Bumped on every stop(), so a start() still waiting for GSAP knows it is stale. */
let generation = 0;
let pageLoaded = false;
let navigating = false;

export const motion = {
  /** False under OS reduced motion or when the visitor turned motion off. */
  get allowed(): boolean {
    return !osReducedMotion() && !userMotionOff();
  },

  /** The footer control. Re-runs every effect in its new state. */
  setUserMotionOff(off: boolean): void {
    setUserMotionOff(off);
    restart();
    notify();
  },

  userMotionOff,

  /** Heavy media (sequences, video) only when motion is allowed and Save-Data is off. */
  get canLoadHeavyMedia(): boolean {
    return this.allowed && !saveData();
  },

  /** Called with `allowed` whenever the OS setting or the footer control changes. */
  onChange(listener: (allowed: boolean) => void, signal?: AbortSignal): void {
    listeners.add(listener);
    signal?.addEventListener("abort", () => listeners.delete(listener));
  },

  /**
   * Resolves once no page transition is running. Effects that would collide with a view
   * transition (13 after hours) wait for this.
   */
  async idle(): Promise<void> {
    const active = (document as Document & { activeViewTransition?: ViewTransition })
      .activeViewTransition;
    if (active) await active.finished.catch(() => undefined);
    while (navigating)
      await new Promise((r) => document.addEventListener("astro:page-load", r, { once: true }));
  },

  /** Runs `listener(hidden)` when the tab is hidden or shown; scrubbers pause on hidden. */
  onVisibility(listener: (hidden: boolean) => void, signal: AbortSignal): void {
    document.addEventListener("visibilitychange", () => listener(document.hidden), { signal });
  },

  /** Number of live ScrollTriggers; read by the e2e tests to catch leaks across navigations. */
  get activeTriggers(): number {
    return engine?.ScrollTrigger.getAll().length ?? 0;
  },
};

/** Registers an effect. Effects registered after the page loaded start immediately. */
export function registerEffect(effect: Effect): void {
  effects.push(effect);
  if (pageLoaded) restart();
}

async function start(): Promise<void> {
  const token = generation;
  const active = effects.filter((effect) => document.querySelector(effect.selector));
  if (active.length === 0) return;
  await whenWanted();
  const { gsap, ScrollTrigger } = await loadEngine();
  if (token !== generation) return;
  media = gsap.matchMedia();
  for (const effect of active) {
    media.add(motionQueries(), (context: { conditions?: Record<string, boolean> }) => {
      const controller = new AbortController();
      const cleanup = effect.setup({
        conditions: context.conditions as unknown as Conditions,
        signal: controller.signal,
        gsap,
        ScrollTrigger,
      });
      return () => {
        controller.abort();
        cleanup?.();
      };
    });
  }
  // Arabic and display faces change line heights; measure again once they are in.
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

function stop(): void {
  generation++;
  media?.revert();
  media = undefined;
}

function restart(): void {
  stop();
  void start();
}

function notify(): void {
  for (const listener of listeners) listener(motion.allowed);
}

matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", notify);

document.addEventListener("astro:before-preparation", () => {
  navigating = true;
});
document.addEventListener("astro:before-swap", stop);
document.addEventListener("astro:page-load", () => {
  navigating = false;
  pageLoaded = true;
  restart();
});

// Read-only hook for the e2e tests (tests/e2e/motion.spec.ts).
(window as Window & { __mknMotion?: typeof motion }).__mknMotion = motion;
