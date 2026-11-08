"""Build private, versioned Hybrid PDP candidates from verified local embeddings."""

import argparse
import hashlib
import json
import re
import runpy
from collections import defaultdict
from pathlib import Path

from hybrid_core import aggregate_articles, rrf_rank, weighted_rank
from image_pipeline import read_jsonl, sha256, write_jsonl


def load_inputs(processed, embeddings_path):
    embedding_manifest_path = embeddings_path.parent / "manifest.json"
    embedding_manifest = json.loads(embedding_manifest_path.read_text(encoding="utf-8"))
    if (embedding_manifest.get("embeddings_sha256") != sha256(embeddings_path) or
        embedding_manifest.get("image_validation_sha256") != sha256(processed / "image-validation.jsonl") or
        not embedding_manifest.get("model_sha256") or not embedding_manifest.get("model_license_source") or
        embedding_manifest.get("private_only") is not True):
        raise ValueError("Embedding provenance is incomplete or stale")
    mappings = {}
    for row in read_jsonl(processed / "medusa-mapping.jsonl"):
        article = row["article_id"]
        if article in mappings or not isinstance(article, str) or not re.fullmatch(r"[0-9]{10}", article):
            raise ValueError("Duplicate or invalid mapping article")
        mappings[article] = row
    products = {}
    article_product = {}
    for row in read_jsonl(processed / "catalog.jsonl"):
        if any(mappings[v["article_id"]].get("product_code") != row["product_code"] for v in row["variants"]):
            raise ValueError("Catalog and mapping product codes differ")
        ids = {mappings[v["article_id"]]["product_id"] for v in row["variants"]}
        if len(ids) != 1:
            raise ValueError("Catalog group mapped to multiple Products")
        product = ids.pop()
        if product in products:
            raise ValueError("Duplicate Product group")
        row["colors"] = {v["color"].strip().casefold() for v in row["variants"] if v.get("color")}
        row["tokens"] = set(re.findall(r"[a-z]+", row.get("description", "").casefold())) - {"a", "the", "in", "and", "with", "of", "at"}
        products[product] = row
        for variant in row["variants"]:
            article = variant["article_id"]
            if article in article_product:
                raise ValueError("Duplicate catalog article")
            article_product[article] = product
    if set(article_product) != set(mappings):
        raise ValueError("Catalog and mapping article universes differ")
    validated = {}
    for row in read_jsonl(processed / "image-validation.jsonl"):
        if row["article_id"] in validated:
            raise ValueError("Duplicate image validation article")
        validated[row["article_id"]] = row
    embeddings = []
    for row in read_jsonl(embeddings_path):
        article = row["article_id"]
        if article not in article_product or row.get("product_id") != article_product[article]:
            raise ValueError("Embedding has stale or wrong Product mapping")
        image = validated.get(article)
        if (not image or image.get("status") != "valid" or image.get("sha256") != row.get("image_sha256") or
            image.get("product_id") != row["product_id"] or image.get("variant_id") != mappings[article]["variant_id"]):
            raise ValueError("Embedding image checksum does not match validation")
        embeddings.append(row)
    if not embeddings:
        raise ValueError("No verified image embeddings; keep metadata run active")
    if embedding_manifest.get("article_count") != len(embeddings) or embedding_manifest.get("embedding_dim") != len(embeddings[0]["vector"]):
        raise ValueError("Embedding manifest count or dimension mismatch")
    home = list(read_jsonl(processed / "candidates-home.jsonl"))
    if not home or any(row["placement"] != "home" or row["context_key"] != "home" or
                       row["target_product_id"] not in products for row in home):
        raise ValueError("Invalid Home popularity candidates")
    return products, embeddings, home


def build(processed, embeddings_path, output, version, method="weighted", aggregation="representative",
          min_metadata=0.70, weights=(0.40, 0.45, 0.15)):
    if not re.fullmatch(r"[A-Za-z0-9_-]{1,100}", version):
        raise ValueError("Invalid version")
    if not 0 <= min_metadata <= 1 or method not in ("weighted", "rrf"):
        raise ValueError("Invalid scoring configuration")
    products, article_vectors, home = load_inputs(processed, embeddings_path)
    vectors = aggregate_articles(article_vectors, aggregation)
    similarity = runpy.run_path(str(Path(__file__).with_name("build-mvp-candidates.py")))["similarity"]
    popularity = {row["target_product_id"]: row["score"] for row in home}
    blocks = defaultdict(list)
    for product, row in products.items():
        blocks[row.get("index_group")].append(product)
    candidates = []
    review = []
    for product in sorted(products):
        targets = [target for target in blocks[products[product].get("index_group")] if target != product]
        metadata = {target: similarity(products[product], products[target]) for target in targets}
        if method == "weighted":
            ranking = weighted_rank(product, targets, metadata, vectors, popularity, weights, min_metadata)
        else:
            ranking = rrf_rank(product, targets, metadata, vectors, popularity, minimum_metadata=min_metadata)
        context_strategy = "hm_hybrid_similarity" if product in vectors and any(target in vectors for target, _ in ranking[:100]) else "hm_metadata_similarity"
        for rank, (target, score) in enumerate(ranking[:100], 1):
            candidates.append({"version": version, "placement": "product_detail", "context_key": "product:" + product,
                               "target_product_id": target, "score": score, "rank": rank,
                               "strategy": context_strategy})
        review.append({"product_id": product, "candidate_count": min(len(ranking), 100),
                       "visual_candidates": sum(product in vectors and target in vectors for target, _ in ranking[:100])})
    if output.exists() and any(output.iterdir()):
        raise ValueError("Output directory must be empty; run version is immutable")
    output.mkdir(parents=True, exist_ok=True)
    home_rows = [{**row, "version": version} for row in home]
    write_jsonl(output / "candidates-home.jsonl", home_rows)
    write_jsonl(output / "candidates-product-detail.jsonl", candidates)
    manifest = {
        "version": version, "method": method, "aggregation": aggregation, "min_metadata": min_metadata,
        "weights": list(weights) if method == "weighted" else None, "status": "private_evaluation_only",
        "human_review": "NOT_RUN", "private_rights": "NOT_VERIFIED", "public_rights": "NOT_VERIFIED",
        "product_count": len(products), "product_vectors": len(vectors), "article_vectors": len(article_vectors),
        "candidate_count": len(candidates), "contexts_with_six": sum(row["candidate_count"] >= 6 for row in review),
        "contexts_with_zero": sum(row["candidate_count"] == 0 for row in review),
        "inputs_sha256": {name: sha256(processed / name) for name in ("catalog.jsonl", "medusa-mapping.jsonl", "image-validation.jsonl", "candidates-home.jsonl")},
        "embeddings_sha256": sha256(embeddings_path),
        "embedding_manifest_sha256": sha256(embeddings_path.parent / "manifest.json"),
        "generator_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "scorer_sha256": sha256(Path(__file__).with_name("hybrid_core.py")),
        "metadata_scorer_sha256": sha256(Path(__file__).with_name("build-mvp-candidates.py")),
        "candidate_files_sha256": {name: sha256(output / name) for name in ("candidates-home.jsonl", "candidates-product-detail.jsonl")},
    }
    (output / "manifest.json").write_text(json.dumps(manifest, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--processed", type=Path, default=Path("data/hm/processed"))
    parser.add_argument("--embeddings", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--version", required=True)
    parser.add_argument("--method", choices=("weighted", "rrf"), default="weighted")
    parser.add_argument("--aggregation", choices=("representative", "mean"), default="representative")
    parser.add_argument("--min-metadata", type=float, default=0.70)
    parser.add_argument("--weights", type=float, nargs=3, metavar=("META", "IMAGE", "POPULARITY"),
                        default=(0.40, 0.45, 0.15), help="weighted method coefficients; record exact values in manifest")
    args = parser.parse_args()
    print(json.dumps(build(args.processed, args.embeddings, args.output, args.version,
                           args.method, args.aggregation, args.min_metadata, tuple(args.weights)), sort_keys=True))
