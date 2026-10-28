// Cloudflare Web Analytics (decision 0018): which hostnames report, and with which site token.
// A site matches hostnames by suffix, so the token for makeena-website.makeena.workers.dev would
// also accept every branch preview (<branch>-makeena-website.makeena.workers.dev). Only the exact
// production hostname loads the beacon, which keeps founder reviews and localhost (CI, Lighthouse)
// out of the numbers. makeena.studio needs its own site and token at launch.
const SITES: Record<string, string> = {
  "makeena-website.makeena.workers.dev": "235b801561f34a64a448d37ae3875a7a",
};

/** The Web Analytics site token for this hostname, or undefined if it shouldn't report. */
export function beaconToken(hostname: string): string | undefined {
  return Object.hasOwn(SITES, hostname) ? SITES[hostname] : undefined;
}
