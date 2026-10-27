// Provenance records (PRD §10.2, §12.1 step 6). Run locally; the output is committed, so CI
// never needs exiftool (decision 0005).
//
//   npm run provenance              merge manifest.json + provenance.json, verify every render
//                                   with exiftool, write src/content/assets/{id}.json
//   npm run provenance -- --no-exif skip the exiftool check (records only)
//   npm run provenance:tag -- <dir> embed IPTC metadata into the MASTER files in <dir>
//                                   ({id}.png|.jpg|.tif). Never the web derivatives in this repo:
//                                   the site says "retained on master file" (CLAUDE.md).
//
// exiftool: on PATH, or set EXIFTOOL to its path.
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve } from "node:path";
import { buildRecords, serialize } from "./records.mjs";

const ROOT = resolve(import.meta.dirname, "../..");
const RENDERS = join(ROOT, "design/renders");
const OUT = join(ROOT, "src/content/assets");

const read = (path) => JSON.parse(readFileSync(path, "utf8"));
const manifest = read(join(RENDERS, "manifest.json"));
const editorial = read(join(RENDERS, "provenance.json"));
const records = buildRecords(manifest, editorial);

function exiftoolPath() {
  if (process.env.EXIFTOOL) return process.env.EXIFTOOL;
  const windowsDefault = join(process.env.LOCALAPPDATA ?? "", "Programs/ExifTool/ExifTool.exe");
  return existsSync(windowsDefault) ? windowsDefault : "exiftool";
}

function exiftool(args) {
  try {
    return execFileSync(exiftoolPath(), args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    if (error.code === "ENOENT") {
      console.error(
        "exiftool not found. Install it (winget install OliverBetz.ExifTool) or set EXIFTOOL.",
      );
      process.exit(1);
    }
    throw error;
  }
}

/** A sequence's sequence.json names it, matches the manifest's size, and every frame exists. */
function verifySequence(record) {
  const file = join(ROOT, record.source.file);
  if (!existsSync(file)) return [`${record.id}: ${record.source.file} not found`];
  const seq = read(file);
  const problems = [];
  if (seq.id !== record.id) problems.push(`${record.id}: sequence.json says id ${seq.id}`);
  const desktop = seq.variants?.desktop;
  if (desktop?.width !== record.source.width || desktop?.height !== record.source.height) {
    problems.push(
      `${record.id}: desktop frames are ${desktop?.width}×${desktop?.height}, manifest says ${record.source.width}×${record.source.height}`,
    );
  }
  for (const [name, variant] of Object.entries(seq.variants ?? {})) {
    for (let n = 1; n <= variant.count; n++) {
      const frame = join(
        ROOT,
        "public",
        variant.path.replace("{NNNN}", String(n).padStart(4, "0")),
      );
      if (!existsSync(frame)) {
        problems.push(`${record.id}: ${name} frame ${n} missing`);
        break;
      }
    }
  }
  return problems;
}

/** Files exist, dimensions match the manifest, and any embedded source type agrees. */
function verify() {
  const renders = records.filter((r) => r.type !== "sequence");
  const sequences = records.filter((r) => r.type === "sequence");
  const files = renders.map((r) => join(ROOT, r.source.file));
  const tags = JSON.parse(
    exiftool([
      "-json",
      "-n",
      "-ImageWidth",
      "-ImageHeight",
      "-XMP-iptcExt:DigitalSourceType",
      ...files,
    ]),
  );
  const problems = sequences.flatMap(verifySequence);
  for (const record of renders) {
    const tag = tags.find((t) => resolve(t.SourceFile) === resolve(ROOT, record.source.file));
    if (!tag) {
      problems.push(`${record.id}: ${record.source.file} not found`);
      continue;
    }
    if (tag.ImageWidth !== record.source.width || tag.ImageHeight !== record.source.height) {
      problems.push(
        `${record.id}: file is ${tag.ImageWidth}×${tag.ImageHeight}, manifest says ${record.source.width}×${record.source.height}`,
      );
    }
    if (tag.DigitalSourceType && tag.DigitalSourceType !== record.digitalSourceType) {
      problems.push(
        `${record.id}: embedded DigitalSourceType ${tag.DigitalSourceType} disagrees with the manifest`,
      );
    }
  }
  if (problems.length) {
    console.error(`exiftool check failed:\n  ${problems.join("\n  ")}`);
    process.exit(1);
  }
  console.log(
    `exiftool: ${renders.length} renders verified; ${sequences.length} sequence(s) checked`,
  );
}

function write() {
  mkdirSync(OUT, { recursive: true });
  const keep = new Set(records.map((r) => `${r.id}.json`));
  for (const file of readdirSync(OUT)) {
    if (file.endsWith(".json") && !keep.has(file)) rmSync(join(OUT, file));
  }
  for (const record of records) writeFileSync(join(OUT, `${record.id}.json`), serialize(record));
  console.log(`wrote ${records.length} records to ${relative(ROOT, OUT)}`);
}

/** IPTC Digital Source Type, creator, caption (EN + AR) and alt text into master files. */
function tag(dir) {
  const target = resolve(dir);
  const fromRoot = relative(ROOT, target);
  // relative() returns an absolute path when the folder is on another drive (Windows).
  const insideRepo = fromRoot === "" || (!fromRoot.startsWith("..") && !isAbsolute(fromRoot));
  if (insideRepo) {
    console.error(
      "Refusing to tag files inside the repo: tag the masters, not the web derivatives.",
    );
    process.exit(1);
  }
  let tagged = 0;
  for (const record of records.filter((r) => r.type !== "sequence")) {
    const file = ["png", "jpg", "jpeg", "tif", "tiff"]
      .map((ext) => join(target, `${record.id}.${ext}`))
      .find(existsSync);
    if (!file) continue;
    const args = [
      "-overwrite_original",
      `-XMP-iptcExt:DigitalSourceType=${record.digitalSourceType}`,
      "-XMP-dc:Creator=Makeena LLC",
      `-XMP-dc:Description-x-default=${record.caption.en}`,
      `-XMP-dc:Description-en=${record.caption.en}`,
      `-XMP-dc:Description-ar=${record.caption.ar}`,
      `-XMP-iptcCore:AltTextAccessibility-en=${record.alt.en}`,
      `-XMP-iptcCore:AltTextAccessibility-ar=${record.alt.ar}`,
      `-XMP-dc:Identifier=${record.id}`,
    ];
    if (!record.rights.en.startsWith("[PLACEHOLDER"))
      args.push(`-XMP-dc:Rights=${record.rights.en}`);
    // Values go through a UTF-8 argument file: on Windows, non-ASCII command-line arguments
    // reach exiftool in the ANSI code page and Arabic arrives as "????".
    const newline = String.fromCharCode(10);
    const argfile = join(tmpdir(), `mkn-exiftool-${process.pid}.args`);
    writeFileSync(argfile, [...args, file].join(newline) + newline, "utf8");
    try {
      exiftool(["-charset", "UTF8", "-@", argfile]);
    } finally {
      rmSync(argfile, { force: true });
    }
    tagged++;
    console.log(`tagged ${relative(target, file)}`);
  }
  console.log(
    `${tagged} master file(s) tagged. Set metadataRetained.iptc to true for them in design/renders/provenance.json, then run npm run provenance.`,
  );
}

const args = process.argv.slice(2);
if (args[0] === "--tag") {
  if (!args[1]) {
    console.error("Usage: npm run provenance:tag -- <folder with master files>");
    process.exit(1);
  }
  tag(args[1]);
} else {
  if (!args.includes("--no-exif")) verify();
  write();
}
