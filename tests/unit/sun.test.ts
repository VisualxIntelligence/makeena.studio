import { describe, expect, it } from "vitest";
import { clockTime, sunSteps } from "../../src/lib/sun";

describe("04 sun positions for Doha, 21 June 2026", () => {
  const steps = sunSteps(330, 1230, 15);

  it("covers 05:30–20:30 in 15-minute steps", () => {
    expect(steps).toHaveLength(61);
    expect(steps[0].time).toBe("05:30");
    expect(steps.at(-1)!.time).toBe("20:30");
  });

  it("puts the sun east in the morning, high at midday, west at golden hour, below at night", () => {
    const at = (t: string) => steps.find((s) => s.time === t)!;
    expect(at("06:00").azimuth).toBeGreaterThan(45);
    expect(at("06:00").azimuth).toBeLessThan(110);
    expect(at("11:30").altitude).toBeGreaterThan(80);
    expect(at("17:30").azimuth).toBeGreaterThan(270);
    expect(at("17:30").altitude).toBeGreaterThan(0);
    expect(at("20:30").altitude).toBeLessThan(0);
  });

  it("formats clock times with Western digits", () => {
    expect(clockTime(330)).toBe("05:30");
    expect(clockTime(1050)).toBe("17:30");
  });
});
