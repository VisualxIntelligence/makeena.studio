import { getPosition } from "suncalc";

// 04 sun study (PRD §9.3): sun positions for Doha, precomputed at build time for every slider
// step, on one stated date (decision 0013).
export const DOHA = { lat: 25.29, lon: 51.53 } as const;
/** The day the readout is computed for, and its UTC offset (Arabia Standard Time, no DST). */
export const SUN_DATE = { year: 2026, month: 6, day: 21, utcOffsetHours: 3 } as const;

export interface SunStep {
  /** Minutes after local midnight. */
  minute: number;
  /** HH:MM, Western digits. */
  time: string;
  /** Degrees clockwise from north, rounded. */
  azimuth: number;
  /** Degrees above the horizon, rounded (negative = below). */
  altitude: number;
}

export const clockTime = (minute: number) =>
  `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;

/** Positions from `from` to `to` minutes, every `step` minutes, for Doha on SUN_DATE. */
export function sunSteps(from: number, to: number, step: number): SunStep[] {
  const { year, month, day, utcOffsetHours } = SUN_DATE;
  const steps: SunStep[] = [];
  for (let minute = from; minute <= to; minute += step) {
    const utc = new Date(Date.UTC(year, month - 1, day, 0, minute) - utcOffsetHours * 3600_000);
    const { azimuth, altitude } = getPosition(utc, DOHA.lat, DOHA.lon);
    steps.push({
      minute,
      time: clockTime(minute),
      azimuth: Math.round(azimuth),
      altitude: Math.round(altitude),
    });
  }
  return steps;
}
