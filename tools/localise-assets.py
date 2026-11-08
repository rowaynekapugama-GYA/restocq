#!/usr/bin/env python3
"""
Download every image currently referenced from restocq.com/wp-content into
assets/img/ and rewrite the references in src/ and the built HTML to the local
copies. Run this once from a machine that can reach restocq.com, before go-live,
so the new site does not depend on the old WordPress host.

Usage:
    python3 tools/localise-assets.py          # download + rewrite
    python3 tools/localise-assets.py --dry    # just list what would be fetched

Afterwards run  python3 tools/build.py  to regenerate the pages.
"""
import re
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
IMG_DIR = ROOT / "assets" / "img"
URL_RE = re.compile(r"https://restocq\.com/wp-content/uploads/[^\s\"')]+")
DRY = "--dry" in sys.argv

files = list((ROOT / "src").rglob("*.html")) + list(ROOT.glob("*.html"))
urls = set()
for f in files:
    urls.update(URL_RE.findall(f.read_text(encoding="utf-8")))

print(f"{len(urls)} remote assets referenced")
mapping = {}
for url in sorted(urls):
    name = url.rsplit("/", 1)[-1]
    local = IMG_DIR / name
    mapping[url] = "assets/img/" + name
    if DRY:
        print("  ", url, "->", mapping[url])
        continue
    if not local.exists():
        print("  downloading", name)
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Restocq site build)"})
        with urllib.request.urlopen(req, timeout=60) as r, open(local, "wb") as out:
            out.write(r.read())

if DRY:
    sys.exit(0)

for f in files:
    txt = f.read_text(encoding="utf-8")
    new = txt
    for url, loc in mapping.items():
        new = new.replace(url, loc)
    if new != txt:
        f.write_text(new, encoding="utf-8")
        print("  rewrote", f.relative_to(ROOT))

print("Done. Now run: python3 tools/build.py")
