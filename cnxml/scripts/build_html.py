#!/usr/bin/env python3
"""
cnxml-pipeline: Build HTML output (openstax/cnx-transforms)
============================================================
Converts each CNXML module in the book repo to HTML using the OFFICIAL
OpenStax transform (cnx-transforms, cnxml-to-html5.xsl).

  - cnxml_to_html()      → HTML body fragment (MathML→presentation, MathJax-ready)
  - cnxml_to_full_html() → full HTML document (body + metadata)

We output two forms per module:
  *.fragment.html  — body content only (for embedding)
  *.html           — full document (standalone hostable page)

Install:
  git clone https://github.com/openstax/cnx-transforms.git  # archived May 2023; final stable
  pip install -e cnx-transforms   # deps: lxml, etc.

Usage:
  python build_html.py --repo work/book-repo --out work/output/html [--transform-dir cnx-transforms]
"""

import argparse
import sys
from pathlib import Path

# Add cnx-transforms to path if installed via clone (not pip)
def _load_cnxtransforms(transform_dir):
    if transform_dir:
        sys.path.insert(0, str(Path(transform_dir).resolve()))
    try:
        from cnxtransforms import cnxml_to_html, cnxml_to_full_html
        return cnxml_to_html, cnxml_to_full_html
    except ImportError as e:
        sys.exit(
            "Cannot import cnxtransforms. Install via:\n"
            "  git clone https://github.com/openstax/cnx-transforms.git\n"
            "  pip install -e cnx-transforms\n"
            f"  ({e})"
        )


def extract_title(fragment: str, fallback: str) -> str:
    """Pull the first heading text for the page <title>."""
    import re
    m = re.search(r"<h[1-6][^>]*>(.*?)</h[1-6]>", fragment, re.S)
    if m:
        return re.sub(r"<[^>]+>", "", m.group(1)).strip()
    return fallback


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--repo", required=True, help="book-repo path")
    ap.add_argument("--out", required=True, help="output dir for HTML")
    ap.add_argument("--transform-dir", default=None,
                    help="path to cnx-transforms repo (if not pip-installed)")
    args = ap.parse_args()

    cnxml_to_html, cnxml_to_full_html = _load_cnxtransforms(args.transform_dir)

    repo = Path(args.repo)
    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    cnxml_files = sorted(repo.glob("modules/*/index.cnxml"))
    if not cnxml_files:
        sys.exit(f"No CNXML modules found under {repo}/modules/")

    converted = 0
    for cnxml_path in cnxml_files:
        mod_id = cnxml_path.parent.name
        with open(cnxml_path, encoding="utf-8") as f:
            cnxml_text = f.read()

        try:
            # Full HTML document (body + metadata) — standalone page
            full_html = cnxml_to_full_html(cnxml_text)
            # Body-only fragment — for embedding
            fragment = cnxml_to_html(cnxml_text)
        except Exception as e:
            print(f"  !! FAILED {mod_id}: {e}")
            continue

        title = extract_title(fragment, mod_id)

        # Write body fragment
        frag_out = out_dir / f"{mod_id}.fragment.html"
        frag_out.write_text(fragment, encoding="utf-8")

        # Write full standalone page (inject title if full_html lacks one)
        page_out = out_dir / f"{mod_id}.html"
        if "<title>" not in full_html:
            full_html = full_html.replace(
                "<html", f'<html><head><title>{title}</title></head>', 1)
        page_out.write_text(full_html, encoding="utf-8")
        converted += 1

    print(f"✅ HTML built: {converted}/{len(cnxml_files)} modules")
    print(f"   fragments  → {out_dir}/*.fragment.html")
    print(f"   full pages → {out_dir}/*.html")


if __name__ == "__main__":
    main()
