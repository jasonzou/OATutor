#!/usr/bin/env python3
"""
cnxml-pipeline: Evaluation (3 layers)
=====================================
Layer 1: Structure integrity (automated)  — block/section counts match expectations.
Layer 2: Rendering spot-check list        — prints representative sections for human browser review.
Layer 3: Retrieval-loop (objective)       — hybrid dense+BM25 (RRF) retrieval over blocks,
                                            verify it hits correct blocks for textbook queries.

Usage:
  python evaluate.py --corpus work/output/book.json [--queries queries.json]
"""

import argparse
import json
import sys
from pathlib import Path

try:
    import numpy as np
    from rank_bm25 import BM25Okapi
    from sentence_transformers import SentenceTransformer
except ImportError as e:
    sys.exit("Missing deps: pip install numpy rank_bm25 sentence-transformers  (" + str(e) + ")")

# Textbooks-style queries mapping to expected block subtopic (topical check)
DEFAULT_QUERIES = [
    {"q": "What is a business model canvas?", "topic": "business model"},
    {"q": "How do you calculate break-even point?", "topic": "break-even"},
    {"q": "What are the key components of a marketing plan?", "topic": "marketing plan"},
    {"q": "Define the four Ps of marketing", "topic": "four ps / marketing mix"},
    {"q": "What is a lean startup approach?", "topic": "lean startup"},
]


def load_corpus(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def structure_check(corpus):
    """Layer 1: report section/block counts; flag suspicious zero/low counts."""
    n_sec = len(corpus.get("sections", []))
    n_blocks = sum(len(s.get("blocks", [])) for s in corpus.get("sections", []))
    n_media = len(corpus.get("media", [])) if isinstance(corpus.get("media"), (list, dict)) else "n/a"
    print("=== Layer 1: Structure integrity ===")
    print(f"  chapters:  {len(set(s.get('chapter') for s in corpus.get('sections', [])))}")
    print(f"  sections:  {n_sec}")
    print(f"  blocks:    {n_blocks}")
    print(f"  media:     {n_media}")
    if n_sec == 0 or n_blocks == 0:
        print("  ⚠️  WARNING: zero sections/blocks — corpus may be broken!")
    else:
        print("  ✅ structure present")
    return n_blocks


def rendering_spotcheck(corpus, n=5):
    """Layer 2: list representative sections for human browser review."""
    print("\n=== Layer 2: Rendering spot-check (human) ===")
    print(f"  Review these {n} sections in a browser (open work/output/html/*.html):")
    for s in corpus.get("sections", [])[:n]:
        title = s.get("title", "?")
        nblk = len(s.get("blocks", []))
        print(f"    - [{s.get('chapter','?')}.{s.get('number','?')}] {title} ({nblk} blocks)")
    print("  Check: equations, tables, figures, footnotes render correctly.")


def retrieval_loop(corpus, queries):
    """Layer 3: hybrid dense+BM25 (RRF) retrieval; print top hit per query."""
    print("\n=== Layer 3: Retrieval-loop (hybrid dense+BM25, RRF) ===")

    # Flatten blocks with section context
    blocks = []
    for s in corpus.get("sections", []):
        for b in s.get("blocks", []):
            text = b.get("text", "") or b.get("html", "")
            blocks.append({
                "anchor": b.get("anchor", ""),
                "section": s.get("number", ""),
                "chapter": s.get("chapter", ""),
                "title": s.get("title", ""),
                "text": text,
            })
    if not blocks:
        print("  ⚠️  No blocks to retrieve over.")
        return

    # Sparse: BM25 over tokenized block text
    tokenized = [b["text"].lower().split() for b in blocks]
    bm25 = BM25Okapi(tokenized)

    # Dense: sentence-transformers embeddings
    print("  Embedding blocks with all-MiniLM-L6-v2...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    block_vecs = model.encode([b["text"] for b in blocks], normalize_embeddings=True)

    def rrf_rank(dense_sim, bm25_scores, k=60):
        """Reciprocal Rank Fusion of dense cosine + BM25 scores."""
        dense_rank = np.argsort(-dense_sim)
        bm25_rank = np.argsort(-bm25_scores)
        rrf = np.zeros(len(blocks))
        for i, idx in enumerate(dense_rank):
            rrf[idx] += 1.0 / (k + i + 1)
        for i, idx in enumerate(bm25_rank):
            rrf[idx] += 1.0 / (k + i + 1)
        return np.argsort(-rrf)

    print(f"\n  {'Query':<55} → Top hit (section)")
    for item in queries:
        q = item["q"]
        q_vec = model.encode([q], normalize_embeddings=True)[0]
        dense_sim = block_vecs @ q_vec
        bm25_scores = np.array(bm25.get_scores(q.lower().split()))
        order = rrf_rank(dense_sim, bm25_scores)
        top = blocks[order[0]]
        print(f"  '{q[:50]}'")
        print(f"      → [{top['chapter']}.{top['section']}] {top['title']} :: {top['text'][:70]}...")

    print("\n  Human judgment: do the top hits match the query topic? (Layer-3 gate)")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--corpus", required=True, help="book.json path")
    ap.add_argument("--queries", default=None, help="optional queries JSON")
    args = ap.parse_args()

    corpus = load_corpus(args.corpus)
    queries = DEFAULT_QUERIES
    if args.queries:
        queries = json.loads(Path(args.queries).read_text())

    structure_check(corpus)
    rendering_spotcheck(corpus)
    retrieval_loop(corpus, queries)


if __name__ == "__main__":
    main()
