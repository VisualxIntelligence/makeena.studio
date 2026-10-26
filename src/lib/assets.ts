import type { ImageMetadata } from "astro";
import { getCollection } from "astro:content";

// Media for ProvenanceFigure (08). Records come from the `assets` collection (npm run
// provenance); image files from design/renders, which Astro turns into AVIF/WebP derivatives.

const images = import.meta.glob<ImageMetadata>("/design/renders/*.{jpg,jpeg,png}", {
  eager: true,
  import: "default",
});

/** The provenance record for an asset ID. An unknown ID fails the build (CLAUDE.md). */
export async function getAsset(id: string) {
  const entry = (await getCollection("assets")).find((a) => a.data.id === id);
  if (!entry) {
    throw new Error(
      `No provenance record for ${id}. Add it to design/renders and run npm run provenance.`,
    );
  }
  return entry.data;
}

/** The source image for a record, as Astro image metadata. */
export function imageFor(record: { id: string; source: { file: string } }): ImageMetadata {
  const image = images[`/${record.source.file}`];
  if (!image) throw new Error(`${record.id}: ${record.source.file} not found`);
  return image;
}

let sheets = 0;

/** A unique, build-stable id for a figure's spec sheet. */
export const nextSheetId = (assetId: string) => `prov-${assetId.toLowerCase()}-${++sheets}`;
