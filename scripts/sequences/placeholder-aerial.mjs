// Phase 0 placeholder for concept 03 (PRD §12.3): there is no real flight yet,
// so fake one from the three AER-FLT01 keyframes with a slow push-in on each
// and a crossfade between them. Output is labelled PLACEHOLDER everywhere.
//
//   node scripts/sequences/placeholder-aerial.mjs
//
// Needs ffmpeg on PATH. Writes public/sequences/MKN-AER-FLT01-PLACEHOLDER/.

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";

const ID = "MKN-AER-FLT01-PLACEHOLDER";
const RENDERS = "design/renders";
const OUT = join("public/sequences", ID);
const FPS = 24;
const FRAMES_PER_KEY = 58; // 3 × 58 − 2 × 12 crossfade frames = 150
const XFADE = 12;
// q50 4:4:4 (the PRD starting point) gave 20 MB desktop; see docs/decisions/0003.
const AVIF = { quality: 34, chromaSubsampling: "4:2:0", effort: 6 };

const variants = [
  { name: "desktop", width: 1600, height: 900, step: 1 }, // 150 frames
  { name: "mobile", width: 828, height: 466, step: 2 }, //    75 frames
];

const tmp = mkdtempSync(join(tmpdir(), "mkn-aer-"));
try {
  // Render at the desktop size once; mobile is downscaled from the same PNGs.
  const seg = FRAMES_PER_KEY / FPS;
  const fade = XFADE / FPS;
  const push = (i) =>
    `[${i}:v]scale=3200:-2,zoompan=z='min(zoom+0.0011,1.12)':d=${FRAMES_PER_KEY}` +
    `:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1600x900:fps=${FPS},setsar=1[k${i}]`;
  const filter = [
    push(0),
    push(1),
    push(2),
    `[k0][k1]xfade=transition=fade:duration=${fade}:offset=${seg - fade}[ab]`,
    `[ab][k2]xfade=transition=fade:duration=${fade}:offset=${2 * seg - 2 * fade}[out]`,
  ].join(";");

  execFileSync(
    "ffmpeg",
    [
      "-v", "error",
      "-i", join(RENDERS, "MKN-AER-FLT01-A.jpg"),
      "-i", join(RENDERS, "MKN-AER-FLT01-B.jpg"),
      "-i", join(RENDERS, "MKN-AER-FLT01-C.jpg"),
      "-filter_complex", filter,
      "-map", "[out]",
      "-frames:v", "150",
      join(tmp, "f_%04d.png"),
    ],
    { stdio: "inherit" },
  );

  const pngs = readdirSync(tmp).filter((f) => f.endsWith(".png")).sort();
  console.log(`ffmpeg wrote ${pngs.length} frames`);

  const manifest = { id: ID, placeholder: true, fps: FPS, virtualFrames: 960, variants: {} };
  for (const v of variants) {
    const dir = join(OUT, v.name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const picked = pngs.filter((_, i) => i % v.step === 0);
    let bytes = 0;
    await Promise.all(
      picked.map(async (png, i) => {
        const file = join(dir, `${ID}_${String(i + 1).padStart(4, "0")}.avif`);
        await sharp(join(tmp, png))
          .resize(v.width, v.height, { fit: "cover" })
          .avif(AVIF)
          .toFile(file);
        bytes += statSync(file).size;
      }),
    );
    manifest.variants[v.name] = {
      width: v.width,
      height: v.height,
      count: picked.length,
      bytes,
      path: `/sequences/${ID}/${v.name}/${ID}_{NNNN}.avif`,
    };
    console.log(`${v.name}: ${picked.length} frames, ${(bytes / 1e6).toFixed(2)} MB`);
  }
  writeFileSync(join(OUT, "sequence.json"), JSON.stringify(manifest, null, 2) + "\n");
} finally {
  rmSync(tmp, { recursive: true, force: true });
}
