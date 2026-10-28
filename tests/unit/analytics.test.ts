import { describe, expect, it } from "vitest";
import { beaconToken } from "../../src/lib/analytics/hosts";

describe("Web Analytics hostnames", () => {
  it("reports from production", () => {
    expect(beaconToken("makeena-website.makeena.workers.dev")).toBe(
      "235b801561f34a64a448d37ae3875a7a",
    );
  });

  it.each([
    "phase-4-analytics-makeena-website.makeena.workers.dev",
    "fde5e4b9-makeena-website.makeena.workers.dev",
    "localhost",
    "127.0.0.1",
    "makeena.studio",
    "constructor",
  ])("stays silent on %s", (hostname) => {
    expect(beaconToken(hostname)).toBeUndefined();
  });
});
