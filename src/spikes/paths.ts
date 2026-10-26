// Phase 0 spike pages are not part of the site (decision 0005). They are built only when
// MKN_SPIKES=1, which `npm run test:spikes` sets, so the spike measurements keep working until
// Phase 3 folds the spike code into the real components.
export const spikesEnabled = process.env.MKN_SPIKES === "1";

export function spikePaths() {
  return spikesEnabled ? [{ params: { lang: "en" } }, { params: { lang: "ar" } }] : [];
}
