// Builds provenance records (PRD §10.2) from design/renders/manifest.json (generator facts) and
// design/renders/provenance.json (editorial fields). Pure, so tests/unit/provenance.test.ts can
// check that src/content/assets/ is in sync without running exiftool.

export const DIGITAL_SOURCE_TYPES = [
  "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
  "http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia",
  "http://cv.iptc.org/newscodes/digitalsourcetype/digitalCapture",
];

/** `MKN-{SERIES}-{CAM}-{VARIANT}[_{NNNN}]`, Western digits (CLAUDE.md). */
export const ID_PATTERN = /^MKN-[A-Z]{3}-[A-Z]{3}[0-9]{2}-[A-Z0-9]+(_[0-9]{4})?$/;

/** Drops undefined values so the JSON stays minimal and stable. */
function clean(value) {
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => [k, clean(v)]),
    );
  }
  return value;
}

export function buildRecords(manifest, editorial) {
  const ids = manifest.assets.map((a) => a.id);
  const problems = [];
  for (const id of ids) {
    if (!ID_PATTERN.test(id)) problems.push(`${id}: does not match MKN-{SERIES}-{CAM}-{VARIANT}`);
    if (!editorial.assets[id]) problems.push(`${id}: missing from provenance.json`);
  }
  for (const id of Object.keys(editorial.assets)) {
    if (!ids.includes(id)) problems.push(`${id}: in provenance.json but not in manifest.json`);
  }
  if (problems.length) throw new Error(`Provenance sources disagree:\n  ${problems.join("\n  ")}`);

  const d = editorial.defaults;
  return manifest.assets.map((a) => {
    const e = editorial.assets[a.id];
    if (`${a.id}.${a.file.split(".").pop()}` !== a.file) {
      throw new Error(`${a.id}: file name ${a.file} must equal the asset ID`);
    }
    return clean({
      id: a.id,
      type: e.type ?? d.type,
      status: a.status,
      concepts: a.concepts,
      digitalSourceType: a.digitalSourceType,
      virtualCamera: e.virtualCamera,
      light: e.light,
      aircraft: e.aircraft,
      gatesCleared: e.gatesCleared ?? d.gatesCleared,
      metadataRetained: e.metadataRetained ?? d.metadataRetained,
      rights: e.rights ?? d.rights,
      caption: e.caption,
      alt: e.alt,
      arReviewed: e.arReviewed ?? d.arReviewed,
      generator: a.generator && {
        service: a.generator.service,
        model: a.generator.model,
        jobId: a.generator.jobId,
        derivedFrom: a.generator.derivedFrom,
      },
      source: { file: `design/renders/${a.file}`, width: a.width, height: a.height },
    });
  });
}

/** The exact bytes written for a record (LF, two-space indent, trailing newline). */
export const serialize = (record) => JSON.stringify(record, null, 2) + "\n";
