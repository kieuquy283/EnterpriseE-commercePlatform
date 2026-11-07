"""Build private offline MVP candidates; never publishes to Medusa."""

import argparse
import csv
import hashlib
import json
import re
import subprocess
from collections import Counter, defaultdict
from pathlib import Path


def ranked(counts, limit=100):
    return sorted(counts, key=lambda product: (-counts[product], product))[:limit]


def similarity(left, right):
    def known(value):
        normalized = (value or "").strip().casefold()
        return normalized if normalized not in ("", "unknown") else None

    if not known(left.get("index_group")) or known(left.get("index_group")) != known(right.get("index_group")):
        return 0.0
    fields = {"product_type": .30, "product_group": .20, "section": .15, "department": .10, "garment_group": .10}
    if not any(known(left.get(key)) and known(left.get(key)) == known(right.get(key)) for key in ("product_type", "product_group")):
        return 0.0
    score = eligible = 0.0
    for key, weight in fields.items():
        a, b = left.get(key, "").strip().casefold(), right.get(key, "").strip().casefold()
        if a and b and a != "unknown" and b != "unknown":
            eligible += weight
            score += weight * (a == b)
    for key, weight in (("colors", .05), ("tokens", .10)):
        a, b = left.get(key, set()), right.get(key, set())
        if a and b:
            eligible += weight
            score += weight * len(a & b) / len(a | b)
    return score / eligible if eligible >= .50 else 0.0


def records(ids, scores, version, placement, context, strategy):
    return [{"version": version, "placement": placement, "context_key": context,
             "target_product_id": product, "score": scores[product], "rank": rank,
             "strategy": strategy} for rank, product in enumerate(ids, 1)]


def main(root, version, min_score=.70):
    out = root / "processed"
    mapping = {}
    for line in (out / "medusa-mapping.jsonl").read_text().splitlines():
        row = json.loads(line)
        if row["article_id"] in mapping:
            raise ValueError("Duplicate mapping")
        mapping[row["article_id"]] = row["product_id"]
    counts = {key: Counter() for key in ("train", "validation", "test", "serving")}
    with (root / "transactions_train.csv").open(encoding="utf-8-sig", newline="") as source:
        for row in csv.DictReader(source):
            product = mapping.get(row["article_id"])
            if not product:
                continue
            date = row["t_dat"]
            split = "train" if date <= "2020-09-08" else "validation" if date <= "2020-09-15" else "test"
            counts[split][product] += 1
            counts["serving"][product] += 1
    universe = sorted(set(mapping.values()))
    train_top = ranked(counts["train"], 12)
    baseline = universe[:12]
    evaluation = {"unit": "held-out purchase-event micro recall at Medusa product level; not customer MAP", "cutoffs": ["2020-09-08", "2020-09-15", "2020-09-22"]}
    for split in ("validation", "test"):
        total = sum(counts[split].values())
        evaluation[split] = {"purchase_events": total, "recall_at_12": sum(counts[split][p] for p in train_top) / total if total else None,
                             "catalog_order_recall_at_12": sum(counts[split][p] for p in baseline) / total if total else None}
    home = records(ranked(counts["serving"]), counts["serving"], version, "home", "home", "hm_purchase_popularity")
    products = {}
    blocks = defaultdict(list)
    for line in (out / "catalog.jsonl").read_text(encoding="utf-8").splitlines():
        row = json.loads(line)
        ids = {mapping[v["article_id"]] for v in row["variants"]}
        if len(ids) != 1:
            raise ValueError("Catalog group mapped to multiple products")
        product = ids.pop()
        row["colors"] = {v["color"].strip().casefold() for v in row["variants"] if v.get("color") and v["color"].casefold() != "unknown"}
        row["tokens"] = set(re.findall(r"[a-z]+", row.get("description", "").casefold())) - {"a", "the", "in", "and", "with", "of", "at"}
        products[product] = row
        blocks[row.get("index_group")].append(product)
    similar = []
    review = []
    for product in sorted(products):
        row = products[product]
        scores = {target: similarity(row, products[target]) for target in blocks[row.get("index_group")] if target != product}
        scores = {target: score for target, score in scores.items() if score >= min_score}
        ids = ranked(scores)
        similar.extend(records(ids, scores, version, "product_detail", "product:" + product, "hm_metadata_similarity"))
        exact = sorted(target for target in blocks[row.get("index_group")] if target != product and products[target].get("product_type") == row.get("product_type"))[:6]
        review.append({"product_id": product, "title": row["title"], "product_type": row.get("product_type"), "top6": [{"product_id": target, "title": products[target]["title"], "score": scores[target]} for target in ids[:6]], "exact_category_baseline": exact, "human_verdict": "NOT_REVIEWED"})
    for name, rows in (("candidates-home.jsonl", home), ("candidates-product-detail.jsonl", similar)):
        (out / name).write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in rows), encoding="utf-8")
    (out / "popularity-evaluation.json").write_text(json.dumps(evaluation, indent=2), encoding="utf-8")
    (out / "similarity-review.json").write_text(json.dumps(review, indent=2, ensure_ascii=False), encoding="utf-8")
    hashes = {}
    for name in ("articles.csv", "transactions_train.csv", "processed/catalog.jsonl", "processed/medusa-mapping.jsonl"):
        digest = hashlib.sha256()
        with (root / name).open("rb") as source:
            for block in iter(lambda: source.read(1024 * 1024), b""):
                digest.update(block)
        hashes[name] = digest.hexdigest()
    manifest = {"version": version, "source_hashes": hashes, "generator_commit": subprocess.check_output(["git", "rev-parse", "HEAD"], text=True).strip(), "generator_source_hash": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(), "training_window": "all source history for serving; train <=2020-09-08 for evaluation", "selection_rule": "existing lexicographic pilot", "min_score": min_score, "status": "private_experiment", "similarity_human_review": "NOT_REVIEWED"}
    (out / "mvp-candidate-manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps({"home_candidates": len(home), "similar_candidates": len(similar), "contexts": len(products), "contexts_with_six": sum(len(row["top6"]) == 6 for row in review), "human_review": "NOT_REVIEWED", "popularity_evaluation": evaluation}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("data/hm"))
    parser.add_argument("--version", default="rec-private-pilot-v1")
    parser.add_argument("--min-score", type=float, default=.70)
    args = parser.parse_args()
    if not 0 <= args.min_score <= 1:
        parser.error("--min-score must be in [0, 1]")
    main(args.root, args.version, args.min_score)
