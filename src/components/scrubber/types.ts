import type { Lang } from "../../i18n/config";

export interface ScrubberFrame {
  assetId: string;
  /** Position on the control (minutes after midnight for 04, month for 07, chapter for 03). */
  value: number;
  label: { en: string; ar: string };
}

interface Common {
  lang: Lang;
  frames: ScrubberFrame[];
  /** Accessible name of the control. */
  label: string;
  priority?: boolean;
  sizes?: string;
}

/** 04: a range input crossfades between the two nearest frames. */
export interface ContinuousProps extends Common {
  mode: "continuous";
  /** Initial value; also what the no-JS state is built around. */
  value: number;
  min: number;
  max: number;
  step: number;
  /** Per-step text for the readout and aria-valuetext, keyed by value. */
  readout: Record<number, string>;
  /** Shown under the control, e.g. the date the sun positions are computed for. */
  note?: string;
  /** `ltr` keeps the control left-to-right in both locales (04's real east–west sun path). */
  directionLock?: "ltr" | "inherit";
}

/** 07: stops as a radio group, an optional before/after wipe, a polite live region. */
export interface DiscreteProps extends Common {
  mode: "discrete";
  /** Initial value; also what the no-JS state is built around. */
  value: number;
  /** Announced on change, e.g. "Month 14 of 24", keyed by value. */
  announce: Record<number, string>;
  /** Copy under the frame for each stop, keyed by value. */
  notes: Record<number, string>;
  /** Accessible name of the wipe control for a stop, keyed by value ("Compare with month 00"). */
  compare: Record<number, string>;
}

/**
 * 03: scrolling flies a canvas frame sequence, pinned; `frames` are the chapter stills shown in
 * the filmstrip, and as a stepped figure under reduced motion, Save-Data, low memory, no AVIF
 * decoder and without JS.
 */
export interface ScrollProps extends Common {
  mode: "scroll";
  /** Provenance ID of the sequence in public/sequences/{id}/ (its sequence.json). */
  sequence: string;
  /** PRD §9.1: 03 falls back to stepped stills. */
  reducedMotion: "stills";
  /** The "Skip the flight" link before the pinned section. */
  skip: string;
  /** Accessible name of the stills list. */
  stillsLabel: string;
}
