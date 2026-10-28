// Cloudflare Web Analytics beacon (decision 0018): cookieless, so no consent banner. It loads once
// per visit (this module runs once under the ClientRouter) and follows routed navigations itself
// through the Navigation API or pushState. Production hostnames only (see hosts.ts).
import { beaconToken } from "./hosts";

const token = beaconToken(location.hostname);
if (token) {
  const script = document.createElement("script");
  script.type = "module";
  script.src = "https://static.cloudflareinsights.com/beacon.min.js";
  script.dataset.cfBeacon = JSON.stringify({ token });
  document.head.append(script);
}
