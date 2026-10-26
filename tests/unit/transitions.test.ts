import { describe, expect, it } from "vitest";
import { transitionType } from "../../src/lib/transitions/type";

describe("G2 transition type", () => {
  it.each([
    ["/en/", "/en/method/", true, "nav"],
    ["/ar/studio/", "/ar/", true, "nav"],
    ["/en/method/", "/ar/method/", true, "lang"],
    ["/ar/", "/en/", true, "lang"],
    ["/en/", "/ar/", false, "none"],
    ["/en/", "/en/method/", false, "none"],
    ["/", "/ar/", true, "nav"],
  ] as const)("%s → %s (motion %s) is %s", (from, to, allowed, expected) => {
    expect(transitionType(from, to, allowed)).toBe(expected);
  });
});
