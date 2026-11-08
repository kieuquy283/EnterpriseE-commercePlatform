"""Private, deterministic pair-level diagnosis of metadata V1 versus weighted Hybrid V2."""

import argparse
import csv
import json
import math
import runpy
from collections import Counter, defaultdict
from pathlib import Path

from hybrid_core import aggregate_articles, cosine, scaled_popularity
from image_pipeline import read_jsonl, sha256


def analyze(processed, evaluation_dir, output):
    v1_path = processed / "candidates-product-detail.jsonl"
    v2_dir = processed / "hybrid/weighted-openclip-b32-v1"
    v2_path = v2_dir / "candidates-product-detail.jsonl"
    embeddings_path = processed / "hybrid/embeddings-openclip-b32-v1/article-embeddings.jsonl"
    sample = json.loads((evaluation_dir / "sample-manifest.json").read_text(encoding="utf-8"))
    manifest = json.loads((v2_dir / "manifest.json").read_text(encoding="utf-8"))
    if (sample["v1_sha256"] != sha256(v1_path) or sample["v2_sha256"] != sha256(v2_path) or
        manifest["candidate_files_sha256"]["candidates-product-detail.jsonl"] != sha256(v2_path) or
        manifest["embeddings_sha256"] != sha256(embeddings_path)):
        raise ValueError("Frozen V1/V2/embedding provenance mismatch")
    mapping = {row["article_id"]: row["product_id"] for row in read_jsonl(processed / "medusa-mapping.jsonl")}
    products = {}
    for row in read_jsonl(processed / "catalog.jsonl"):
        product_ids = {mapping[v["article_id"]] for v in row["variants"]}
        if len(product_ids) != 1:
            raise ValueError("Broken Product mapping")
        row["colors"] = {v["color"].strip().casefold() for v in row["variants"] if v.get("color")}
        import re
        row["tokens"] = set(re.findall(r"[a-z]+", row.get("description", "").casefold())) - {"a", "the", "in", "and", "with", "of", "at"}
        products[product_ids.pop()] = row
    vectors = aggregate_articles(read_jsonl(embeddings_path))
    popularity = {row["target_product_id"]: row["score"] for row in read_jsonl(processed / "candidates-home.jsonl")}
    similarity = runpy.run_path(str(Path(__file__).with_name("build-mvp-candidates.py")))["similarity"]
    def by_context(path):
        result = defaultdict(list)
        for row in read_jsonl(path):
            result[row["context_key"].removeprefix("product:")].append(row)
        return result
    old, new = by_context(v1_path), by_context(v2_path)
    all_products = sorted(products)
    candidate_set_changes = sum({r["target_product_id"] for r in old[p]} !=
                                {r["target_product_id"] for r in new[p]} for p in all_products)
    score_report = json.loads((evaluation_dir / "ai-proxy-report.json").read_text(encoding="utf-8"))
    if score_report["v1_sha256"] != sha256(v1_path) or score_report["v2_sha256"] != sha256(v2_path):
        raise ValueError("Scored report differs from frozen candidates")
    labels = {}
    for path in (evaluation_dir.parent / "v1-frozen-balanced-20261107/astra-labels.jsonl",
                 evaluation_dir / "astra-new-labels.jsonl"):
        for row in read_jsonl(path):
            key = row["context_product_id"], row["candidate_product_id"]
            if key in labels:
                raise ValueError("Duplicate judgment")
            labels[key] = row["grade"]
    if len(labels) != score_report["pool_size"]:
        raise ValueError("Incomplete judged pool")
    contexts = {row["context_product_id"]: row for row in score_report["per_context"]}
    pair_rows = []
    for source in sample["contexts"]:
        old_rows = {r["target_product_id"]: r for r in old[source]}
        new_rows = {r["target_product_id"]: r for r in new[source]}
        target_universe = sorted(set(old_rows) | set(new_rows))
        prior = scaled_popularity(popularity, target_universe)
        old_top = {r["target_product_id"] for r in old[source][:6]}
        new_top = {r["target_product_id"] for r in new[source][:6]}
        for target in sorted(old_top | new_top):
            metadata = similarity(products[source], products[target])
            both_images = source in vectors and target in vectors
            image_score = (cosine(vectors[source], vectors[target]) + 1) / 2 if both_images else None
            expected = ((0.40 * metadata + 0.45 * image_score + 0.15 * prior[target]) if both_images else metadata)
            actual = new_rows[target]["score"]
            if not math.isclose(expected, actual, rel_tol=1e-8, abs_tol=1e-8):
                raise ValueError("V2 score decomposition disagrees with candidate artifact")
            pair_rows.append({"context_product_id": source, "candidate_product_id": target,
                              "v1_rank": old_rows.get(target, {}).get("rank"),
                              "v2_rank": new_rows.get(target, {}).get("rank"),
                              "astra_relevance": labels[source, target],
                              "v1_raw_score": old_rows.get(target, {}).get("score"),
                              "v2_raw_score": actual, "metadata_similarity": metadata,
                              "image_cosine": 2 * image_score - 1 if both_images else None,
                              "popularity_raw": popularity.get(target, 0),
                              "popularity_normalized": prior[target], "image_present": both_images,
                              "same_product_type": products[source].get("product_type") == products[target].get("product_type"),
                              "same_product_group": products[source].get("product_group") == products[target].get("product_group"),
                              "changed_membership": (target in old_top) != (target in new_top),
                              "source_index_group": products[source].get("index_group"),
                              "source_product_type": products[source].get("product_type")})
    context_rows = []
    for source in sample["contexts"]:
        row = contexts[source]
        delta = None if row["v1_ndcg_at_6"] is None else row["v2_ndcg_at_6"] - row["v1_ndcg_at_6"]
        context_rows.append({"context_product_id": source, "product_type": products[source].get("product_type"),
                             "index_group": products[source].get("index_group"), "source_image_present": source in vectors,
                             "v1_count": row["v1_count"], "v2_count": row["v2_count"],
                             "v1_ndcg_at_6": row["v1_ndcg_at_6"], "v2_ndcg_at_6": row["v2_ndcg_at_6"],
                             "delta": delta,
                             "v1_only_top6": sorted({r["target_product_id"] for r in old[source][:6]} - {r["target_product_id"] for r in new[source][:6]}),
                             "v2_only_top6": sorted({r["target_product_id"] for r in new[source][:6]} - {r["target_product_id"] for r in old[source][:6]})})
    judged = [r for r in context_rows if r["delta"] is not None]
    summary = {"status": "ASTRA_PROXY_DIAGNOSTIC", "v1_sha256": sha256(v1_path),
               "v2_sha256": sha256(v2_path), "embedding_sha256": sha256(embeddings_path),
               "label_pool_sha256": score_report["pool_sha256"],
               "candidate_set_changed_contexts_all_500": candidate_set_changes,
               "contexts": len(context_rows), "judgeable": len(judged),
               "v1_wins": sum(r["delta"] < -1e-12 for r in judged),
               "v2_wins": sum(r["delta"] > 1e-12 for r in judged),
               "ties": sum(abs(r["delta"]) <= 1e-12 for r in judged),
               "unjudgeable": len(context_rows) - len(judged),
               "top_losses": sorted((r for r in judged if r["delta"] < 0), key=lambda r: r["delta"])[:10],
               "top_wins": sorted((r for r in judged if r["delta"] > 0), key=lambda r: -r["delta"])[:10]}
    if output.exists() and any(output.iterdir()):
        raise ValueError("Analysis directory must be empty")
    output.mkdir(parents=True, exist_ok=True)
    with (output / "pairs.csv").open("w", encoding="utf-8", newline="") as file:
        writer = csv.DictWriter(file, fieldnames=list(pair_rows[0]))
        writer.writeheader()
        writer.writerows(pair_rows)
    (output / "contexts.json").write_text(json.dumps(context_rows, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    (output / "summary.json").write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--processed", type=Path, default=Path("data/hm/processed"))
    parser.add_argument("--evaluation-dir", type=Path, default=Path("data/hm/processed/evaluation/weighted-openclip-b32-v1-blind"))
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(analyze(args.processed, args.evaluation_dir, args.output), sort_keys=True))
