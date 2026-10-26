"""Subset the Arabic web fonts (PRD §6.2, §13: critical fonts ≤ 120 KB on /ar/).

Downloads pinned upstream TTFs from google/fonts, keeps only the characters and layout features
the site needs, and writes WOFF2 files plus a coverage map to src/assets/fonts/arabic/.
The output is committed; CI never runs this. Run it again only to change the character sets.

    python -m pip install -r scripts/fonts/requirements.txt
    npm run fonts:arabic

IBM Plex Sans Arabic carries the OFL Reserved Font Name "Plex", so the subset (a Modified
Version under the OFL) is renamed "MKN Sans Arabic". Amiri has no Reserved Font Name.
"""

import hashlib
import io
import json
import sys
import urllib.request
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[2]
CACHE = ROOT / ".cache" / "fonts"
OUT = ROOT / "src" / "assets" / "fonts" / "arabic"

# google/fonts commit pinned on 26 Oct 2026.
COMMIT = "e7db6ca603fd4862010383ff17ffd6cc4ffac1c0"
SOURCES = {
    "Amiri-Regular.ttf": (
        "ofl/amiri/Amiri-Regular.ttf",
        "ab391c4147d054c48976e98322ad0eefe1427aa0e0502a12a4c75d80a70cfcd7",
    ),
    "IBMPlexSansArabic-Regular.ttf": (
        "ofl/ibmplexsansarabic/IBMPlexSansArabic-Regular.ttf",
        "6f611412270a132bbac838da9259d4c68569b4175f3b3b8fa3fa36a30b56dab9",
    ),
    "IBMPlexSansArabic-Medium.ttf": (
        "ofl/ibmplexsansarabic/IBMPlexSansArabic-Medium.ttf",
        "b8363ab9f733dfa4f8e96b8b2102c24b5cf4110fb96d1d3d9a9412f6fb49cf74",
    ),
    "Amiri-OFL.txt": (
        "ofl/amiri/OFL.txt",
        "72de68e5954f4fdd24702292ef5a32f003ca960ec9330dc86e5eefb5dffb9b22",
    ),
    "IBMPlexSansArabic-OFL.txt": (
        "ofl/ibmplexsansarabic/OFL.txt",
        "7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da",
    ),
}


def span(first, last):
    return list(range(first, last + 1))


# Modern Standard Arabic letters, Arabic punctuation, tatweel, the four extra letters used to
# transliterate foreign names (پ چ ڤ گ) and the joiner/direction controls.
LETTERS = (
    [0x060C, 0x061B, 0x061C, 0x061F, 0x0640]
    + span(0x0621, 0x063A)
    + span(0x0641, 0x064A)
    + [0x067E, 0x0686, 0x06A4, 0x06AF]
    + span(0x200C, 0x200F)
)
# Space, punctuation and Western digits (identifiers stay Western digits, PRD §7.1). Keeping
# them in the Arabic fonts stops a full stop from pulling in a whole Latin font on /ar/.
PUNCTUATION = (
    [0x20, 0xA0]
    + [ord(c) for c in ".,:;!?()[]«»-–—'\"/·%&*+=@#…‘’“”"]
    + span(0x30, 0x39)
)
ALL_MARKS = span(0x064B, 0x0655) + [0x0670]
# Display headlines: shadda, sukun and fathatan (as in أيضاً) only. Full vowelling costs ~9 KB of
# Amiri's mark positioning (dammatan + kasratan alone ~4 KB), which would break the 120 KB budget.
# tests/e2e/arabic-coverage.spec.ts fails if a headline ever needs another mark.
DISPLAY_MARKS = [0x064B, 0x0651, 0x0652]

# Arabic shaping, mark placement and kerning. Stylistic sets, fractions and the like are dropped.
FEATURES = ["ccmp", "locl", "isol", "init", "medi", "fina", "rlig", "calt", "liga",
            "mark", "mkmk", "curs", "kern"]

OUTPUTS = [
    # (output file, source, codepoints, renamed family or None)
    ("amiri-400.woff2", "Amiri-Regular.ttf", LETTERS + PUNCTUATION + DISPLAY_MARKS, None),
    ("mkn-sans-arabic-400.woff2", "IBMPlexSansArabic-Regular.ttf",
     LETTERS + PUNCTUATION + ALL_MARKS, "MKN Sans Arabic"),
    ("mkn-sans-arabic-500.woff2", "IBMPlexSansArabic-Medium.ttf",
     LETTERS + PUNCTUATION + ALL_MARKS, "MKN Sans Arabic"),
]


def fetch(name):
    path, sha256 = SOURCES[name]
    target = CACHE / name
    if not target.exists():
        CACHE.mkdir(parents=True, exist_ok=True)
        url = f"https://raw.githubusercontent.com/google/fonts/{COMMIT}/{path}"
        print(f"download {url}")
        with urllib.request.urlopen(url) as response:
            target.write_bytes(response.read())
    digest = hashlib.sha256(target.read_bytes()).hexdigest()
    if digest != sha256:
        sys.exit(f"{name}: checksum mismatch ({digest}); delete {target} and check the pin")
    return target


def rename(font, family):
    """Replace the upstream family name in every name record except the copyright notice."""
    postscript = family.replace(" ", "")
    for record in font["name"].names:
        if record.nameID == 0:
            continue
        text = record.toUnicode()
        text = text.replace("IBM Plex Sans Arabic", family).replace("IBMPlexSansArabic", postscript)
        record.string = text
        if record.nameID != 0 and "Plex" in text:
            sys.exit(f"name ID {record.nameID} still contains the Reserved Font Name: {text!r}")


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    coverage = {}
    for filename, source, codepoints, family in OUTPUTS:
        # Keep the upstream timestamp so re-running the script gives byte-identical files.
        font = TTFont(fetch(source), recalcTimestamp=False)
        options = subset.Options()
        options.flavor = "woff2"
        options.layout_features = FEATURES
        options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14]  # names, copyright, licence
        options.notdef_outline = True
        options.hinting = False
        options.drop_tables += ["meta"]
        subsetter = subset.Subsetter(options)
        subsetter.populate(unicodes=sorted(set(codepoints)))
        subsetter.subset(font)
        if family:
            rename(font, family)
        buffer = io.BytesIO()
        font.save(buffer)
        (OUT / filename).write_bytes(buffer.getvalue())
        coverage[filename] = sorted(font.getBestCmap())
        print(f"{filename:28} {len(buffer.getvalue()) / 1024:6.1f} KB  {font['maxp'].numGlyphs} glyphs")

    for name in ("Amiri-OFL.txt", "IBMPlexSansArabic-OFL.txt"):
        (OUT / name).write_bytes(fetch(name).read_bytes())
    coverage_json = json.dumps({k: [f"{c:04X}" for c in v] for k, v in coverage.items()}, indent=1)
    (OUT / "coverage.json").write_bytes((coverage_json + "\n").encode("utf-8"))  # LF on Windows too


if __name__ == "__main__":
    main()
