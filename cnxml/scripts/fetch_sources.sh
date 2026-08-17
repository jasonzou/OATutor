#!/usr/bin/env bash
# ============================================================
# cnxml-pipeline: Session 1 - Fetch sources
# ============================================================
# Clones the OpenStax book (full, with media) + the converter tools.
#
#   BOOK_REPO: OpenStax osbooks repo (default: osbooks-entrepreneurship)
#   WORKDIR:   where book-repo + tools live (default: ./work)
#
# Usage: ./fetch_sources.sh [BOOK_REPO] [WORKDIR]
set -euo pipefail

BOOK_REPO="${1:-https://github.com/openstax/osbooks-entrepreneurship.git}"
WORKDIR="${2:-work}"

mkdir -p "$WORKDIR"
cd "$WORKDIR"

echo "=== [1/3] Clone OpenStax book (full, with media): $BOOK_REPO ==="
if [ ! -d book-repo/.git ]; then
  git clone --depth 1 "$BOOK_REPO" book-repo
else
  echo "  book-repo already exists, skipping clone"
fi

echo "=== [2/3] Fetch openstax-convert (RAG corpus tool) ==="
if [ ! -d openstax-convert/.git ]; then
  git clone --depth 1 https://github.com/kalendar/openstax-convert.git
else
  echo "  openstax-convert already exists"
fi

echo "=== [3/4] Fetch openstax/cnx-transforms (official CNXML→HTML transform) ==="
if [ ! -d cnx-transforms/.git ]; then
  git clone --depth 1 https://github.com/openstax/cnx-transforms.git
else
  echo "  cnx-transforms already exists"
fi
pip install -e cnx-transforms 2>/dev/null || echo "  (pip install -e cnx-transforms — run manually if needed)"

echo "=== [4/4] Verify book structure ==="
echo "  collections: $(ls book-repo/collections/ 2>/dev/null | tr '\n' ' ')"
echo "  modules:     $(find book-repo/modules -name index.cnxml 2>/dev/null | wc -l) sections"
echo "  media:       $(find book-repo/media -type f 2>/dev/null | wc -l) files"

echo ""
echo "✅ Sources fetched. Next: ./build_html.py --transform-dir work/cnx-transforms && ./build_rag.sh"
