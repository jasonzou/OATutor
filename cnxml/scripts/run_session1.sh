#!/usr/bin/env bash
# ============================================================
# cnxml-pipeline: Session 1 - Full pipeline runner
# ============================================================
# Runs fetch → HTML → RAG → evaluate in one go.
#
# Usage: ./run_session1.sh [BOOK_REPO]
set -euo pipefail

BOOK_REPO="${1:-https://github.com/openstax/osbooks-entrepreneurship.git}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "======================================"
echo " cnxml-pipeline — Session 1 pipeline"
echo "======================================"

TRANSFORM_DIR="${2:-work/cnx-transforms}"

"$DIR/fetch_sources.sh" "$BOOK_REPO" work
"$DIR/build_html.py" --repo work/book-repo --out work/output/html --transform-dir "$TRANSFORM_DIR"
"$DIR/build_rag.sh" work work/output
"$DIR/evaluate.py" --corpus work/output/book.json

echo ""
echo "======================================"
echo "✅ Session 1 pipeline complete."
echo "   HTML pages: work/output/html/*.html"
echo "   RAG corpus: work/output/book.json"
echo "   Review: rendering spot-check + retrieval top-hits"
echo "======================================"
