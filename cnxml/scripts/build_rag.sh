#!/usr/bin/env bash
# ============================================================
# cnxml-pipeline: Build RAG corpus (openstax-convert)
# ============================================================
# Runs kalendar/openstax-convert to produce book.json (block-segmented)
# and copies referenced media.
#
# Usage: ./build_rag.sh [WORKDIR] [OUTDIR]
set -euo pipefail

WORKDIR="${1:-work}"
OUTDIR="${2:-$WORKDIR/output}"

echo "=== Build RAG corpus via openstax-convert ==="
python3 "$WORKDIR/openstax-convert/scripts/convert.py" \
  --repo "$WORKDIR/book-repo" \
  --out "$OUTDIR"

echo ""
echo "✅ RAG corpus built:"
echo "   blocks   → $OUTDIR/book.json"
echo "   media    → $OUTDIR/media/"

echo ""
echo "Next: python3 evaluate.py --corpus $OUTDIR/book.json"
