#!/usr/bin/env python3
"""
Restocq static site builder.

Assembles the final HTML pages in the project root from:
  src/partials/head.html, header.html, footer.html
  src/pages/*.html   (each starts with a JSON front-matter comment)

Usage:  python3 tools/build.py
"""
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARTIALS = ROOT / "src" / "partials"
PAGES = ROOT / "src" / "pages"

SITE_URL = "https://restocq.com"
FM_RE = re.compile(r"^\s*<!--\s*(\{.*?\})\s*-->", re.S)


def read(p: Path) -> str:
    return p.read_text(encoding="utf-8")


INCLUDE_RE = re.compile(r"\{\{include:([a-z0-9_-]+)\}\}")


def expand_includes(html: str, depth: int = 0) -> str:
    """Replace {{include:name}} with src/partials/blocks/name.html (recursively)."""
    if depth > 5:
        return html
    def sub(m):
        p = PARTIALS / "blocks" / f"{m.group(1)}.html"
        if not p.exists():
            sys.exit(f"missing block partial: {p}")
        return expand_includes(read(p), depth + 1)
    return INCLUDE_RE.sub(sub, html)


def render(template: str, ctx: dict) -> str:
    out = template
    for k, v in ctx.items():
        out = out.replace("{{" + k + "}}", str(v))
    return expand_includes(out)


def build():
    head = read(PARTIALS / "head.html")
    header = read(PARTIALS / "header.html")
    footer = read(PARTIALS / "footer.html")
    built = []

    for page in sorted(PAGES.glob("*.html")):
        raw = read(page)
        m = FM_RE.match(raw)
        if not m:
            sys.exit(f"{page.name}: missing JSON front-matter comment")
        meta = json.loads(m.group(1))
        body = raw[m.end():].lstrip("\n")
        out_name = meta.get("output", page.name)
        canonical = SITE_URL + ("/" if out_name == "index.html" else "/" + out_name.replace(".html", ""))
        ctx = {
            "title": meta["title"],
            "description": meta["description"],
            "canonical": canonical,
            "og_image": meta.get("og_image", SITE_URL + "/wp-content/uploads/2025/07/Dental-Image-002-1.png"),
            "body_class": meta.get("body_class", ""),
            "content": body,
            "header": header,
            "footer": footer,
            "noindex": '<meta name="robots" content="noindex">' if meta.get("noindex") else "",
        }
        html = render(head, ctx)
        (ROOT / out_name).write_text(html, encoding="utf-8")
        built.append((out_name, canonical, meta.get("priority", "0.7")))

    # sitemap
    urls = "\n".join(
        f"  <url><loc>{c}</loc><priority>{p}</priority></url>" for n, c, p in built if n not in ("404.html", "thank-you.html")
    )
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls + "\n</urlset>\n",
        encoding="utf-8",
    )
    print(f"Built {len(built)} pages + sitemap.xml")


if __name__ == "__main__":
    build()
