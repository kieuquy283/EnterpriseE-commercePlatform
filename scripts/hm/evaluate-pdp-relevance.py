"""Build a private, blinded PDP relevance pool and score v1 against v2.

Grades must come from independent human reviewers. The script never infers them
from product metadata or H&M purchases.
"""

import argparse
import hashlib
import json
import math
import random
from collections import defaultdict
from pathlib import Path

from image_pipeline import read_jsonl, sha256, write_jsonl


def catalog_products(catalog_path, mapping_path, image_path=None):
    mapping = {}
    for row in read_jsonl(mapping_path):
        article = row["article_id"]
        if article in mapping:
            raise ValueError("Duplicate article mapping")
        mapping[article] = row["product_id"]
    images = {}
    if image_path and image_path.exists():
        for row in read_jsonl(image_path):
            if row.get("status") == "valid" and row["article_id"] not in images:
                images[row["article_id"]] = row["source_path"]
    products = {}
    for row in read_jsonl(catalog_path):
        article_ids = sorted(variant["article_id"] for variant in row["variants"])
        ids = {mapping[article] for article in article_ids}
        if len(ids) != 1:
            raise ValueError("Catalog Product mapping differs")
        product = ids.pop()
        if product in products:
            raise ValueError("Duplicate Product")
        products[product] = {
            "product_id": product, "title": row["title"], "description": row.get("description", ""),
            "product_type": row.get("product_type", ""), "index_group": row.get("index_group", ""),
            "image_source_path": next((images[article] for article in article_ids if article in images), None),
        }
    return products


def candidate_lists(path, products):
    result = defaultdict(list)
    for row in read_jsonl(path):
        if row.get("placement") != "product_detail":
            raise ValueError("PDP candidates only")
        source = row["context_key"].removeprefix("product:")
        target = row["target_product_id"]
        if row["context_key"] != "product:" + source or source not in products or target not in products or source == target:
            raise ValueError("Unknown/self Product")
        result[source].append(row)
    for rows in result.values():
        if len(rows) > 100 or [row["rank"] for row in rows] != list(range(1, len(rows) + 1)):
            raise ValueError("Invalid candidate rank/count")
        if len({row["target_product_id"] for row in rows}) != len(rows):
            raise ValueError("Duplicate candidate")
    return {source: [row["target_product_id"] for row in rows[:6]] for source, rows in result.items()}


def select_contexts(products, baseline, count, seed):
    """Pre-register contexts from v1 coverage, independently of v2 output."""
    if count < 1 or count > len(products):
        raise ValueError("Invalid sample size")
    buckets = defaultdict(list)
    for product in products:
        coverage = len(baseline.get(product, []))
        band = "zero" if coverage == 0 else "short" if coverage < 6 else "full"
        buckets[band, products[product].get("index_group", "Unknown")].append(product)
    for (band, group), values in buckets.items():
        values.sort(key=lambda product: hashlib.sha256(f"{seed}:{band}:{group}:{product}".encode()).hexdigest())
    targets = {"zero": count // 4, "short": count // 4, "full": count - 2 * (count // 4)}
    selected = []
    for band in ("zero", "short", "full"):
        groups = sorted((group for key_band, group in buckets if key_band == band),
                        key=lambda group: hashlib.sha256(f"{seed}:{band}:{group}".encode()).hexdigest())
        selected_in_band = 0
        while selected_in_band < targets[band]:
            added = False
            for group in groups:
                values = buckets[band, group]
                if values:
                    selected.append(values.pop(0))
                    added = True
                    selected_in_band += 1
                    if selected_in_band == targets[band]:
                        break
            if not added:
                break
    remaining = sorted(set(products) - set(selected),
                       key=lambda product: hashlib.sha256(f"{seed}:extra:{product}".encode()).hexdigest())
    selected.extend(remaining[:count - len(selected)])
    return sorted(selected)


def build_packet(products, baseline, challenger, contexts, seed):
    packet = []
    for source in contexts:
        if source not in products:
            raise ValueError("Unknown sampled Product")
        pool = set(baseline.get(source, [])) | set(challenger.get(source, []))
        for target in sorted(pool, key=lambda item: hashlib.sha256(f"{seed}:{source}:{item}".encode()).hexdigest()):
            packet.append({"context_product_id": source, "candidate_product_id": target,
                           "context": products[source], "candidate": products[target]})
    return packet


def labels_from(path, packet):
    expected = {(row["context_product_id"], row["candidate_product_id"]) for row in packet}
    labels = {}
    reviewer_ids = set()
    for row in read_jsonl(path):
        key = (row["context_product_id"], row["candidate_product_id"])
        grade = row.get("grade")
        reviewer_id = row.get("reviewer_id")
        if (key not in expected or key in labels or type(grade) is not int or grade not in (0, 1, 2)
                or not isinstance(reviewer_id, str) or not reviewer_id.strip()):
            raise ValueError("Missing, duplicate, unknown or invalid human grade")
        labels[key] = grade
        reviewer_ids.add(reviewer_id)
    if set(labels) != expected:
        raise ValueError("Human labels do not cover full candidate pool")
    if len(reviewer_ids) != 1:
        raise ValueError("Each label file must identify one reviewer")
    return labels, reviewer_ids.pop()


def ndcg_at_6(predictions, relevant):
    gains = sorted((2 ** grade - 1 for grade in relevant.values()), reverse=True)[:6]
    ideal = sum(gain / math.log2(rank + 1) for rank, gain in enumerate(gains, 1))
    if not ideal:
        return None
    actual = sum((2 ** relevant.get(target, 0) - 1) / math.log2(rank + 1)
                 for rank, target in enumerate(predictions[:6], 1))
    return actual / ideal


def compare(contexts, baseline, challenger, labels):
    per_context = []
    for source in contexts:
        relevant = {target: grade for (context, target), grade in labels.items() if context == source}
        old = ndcg_at_6(baseline.get(source, []), relevant)
        new = ndcg_at_6(challenger.get(source, []), relevant)
        per_context.append({"context_product_id": source, "v1_ndcg_at_6": old, "v2_ndcg_at_6": new,
                            "v1_count": len(baseline.get(source, [])), "v2_count": len(challenger.get(source, []))})
    judged = [row for row in per_context if row["v1_ndcg_at_6"] is not None]
    deltas = [row["v2_ndcg_at_6"] - row["v1_ndcg_at_6"] for row in judged]
    bootstrap = []
    if deltas:
        rng = random.Random(20261107)
        for _ in range(2000):
            bootstrap.append(sum(rng.choice(deltas) for _ in deltas) / len(deltas))
        bootstrap.sort()
    return {"primary_metric": "paired_macro_ndcg_at_6", "sampled_contexts": len(contexts),
            "judgeable_contexts": len(judged), "unjudgeable_contexts": len(contexts) - len(judged),
            "v1_mean_ndcg_at_6": sum(row["v1_ndcg_at_6"] for row in judged) / len(judged) if judged else None,
            "v2_mean_ndcg_at_6": sum(row["v2_ndcg_at_6"] for row in judged) / len(judged) if judged else None,
            "paired_delta_v2_minus_v1": sum(deltas) / len(deltas) if deltas else None,
            "paired_bootstrap_95pct_ci": [bootstrap[49], bootstrap[1949]] if bootstrap else None,
            "v1_contexts_with_six": sum(row["v1_count"] == 6 for row in per_context),
            "v2_contexts_with_six": sum(row["v2_count"] == 6 for row in per_context),
            "per_context": per_context, "ctr_conversion": "NOT_MEASURABLE_FROM_HM_PURCHASES"}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--processed", type=Path, default=Path("data/hm/processed"))
    parser.add_argument("--v1", type=Path, default=Path("data/hm/processed/candidates-product-detail.jsonl"))
    parser.add_argument("--v2", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--sample-manifest", type=Path)
    parser.add_argument("--reviewer-a", type=Path)
    parser.add_argument("--reviewer-b", type=Path)
    parser.add_argument("--adjudicated", type=Path)
    parser.add_argument("--count", type=int, default=40)
    parser.add_argument("--seed", type=int, default=20261107)
    args = parser.parse_args()
    products = catalog_products(args.processed / "catalog.jsonl", args.processed / "medusa-mapping.jsonl",
                                args.processed / "image-validation.jsonl")
    baseline = candidate_lists(args.v1, products)
    challenger = candidate_lists(args.v2, products) if args.v2 else {}
    catalog_sha = sha256(args.processed / "catalog.jsonl")
    mapping_sha = sha256(args.processed / "medusa-mapping.jsonl")
    if args.sample_manifest:
        sample = json.loads(args.sample_manifest.read_text(encoding="utf-8"))
        if sample["catalog_sha256"] != catalog_sha or sample["mapping_sha256"] != mapping_sha or sample["v1_sha256"] != sha256(args.v1):
            raise ValueError("Frozen sample provenance differs")
        contexts = sample["contexts"]
    else:
        contexts = select_contexts(products, baseline, args.count, args.seed)
        sample = {"contexts": contexts, "seed": args.seed, "catalog_sha256": catalog_sha,
                  "mapping_sha256": mapping_sha, "v1_sha256": sha256(args.v1),
                  "selection": "25% zero, 25% short, 50% full v1 coverage where available; round-robin index groups; v2-blind"}
    packet = build_packet(products, baseline, challenger, contexts, sample["seed"])
    sample["v2_sha256"] = sha256(args.v2) if args.v2 else None
    sample["pool_size"] = len(packet)
    report = {"status": "AWAITING_HUMAN_LABELS", "sampled_contexts": len(contexts), "pool_size": len(packet),
              "v2_present": args.v2 is not None, "primary_metric": "paired_macro_ndcg_at_6"}
    if args.reviewer_a or args.reviewer_b:
        if not args.v2 or not args.reviewer_a or not args.reviewer_b:
            raise ValueError("Scoring needs v2 and two independent reviewer files")
        first, reviewer_a = labels_from(args.reviewer_a, packet)
        second, reviewer_b = labels_from(args.reviewer_b, packet)
        if args.reviewer_a.resolve() == args.reviewer_b.resolve() or reviewer_a == reviewer_b:
            raise ValueError("Two distinct reviewers are required")
        disputed = {key for key in first if first[key] != second[key]}
        if disputed:
            if not args.adjudicated:
                raise ValueError(f"{len(disputed)} grade disagreements require adjudication")
            final, _ = labels_from(args.adjudicated, packet)
            if any(final[key] != first[key] for key in first if key not in disputed):
                raise ValueError("Adjudication changed an agreed grade")
        else:
            final = first
        report.update(compare(contexts, baseline, challenger, final))
        if report["judgeable_contexts"] == 0:
            raise ValueError("No positive judged relevance; nDCG is undefined")
        report["status"] = "HUMAN_LABELS_EVALUATED"
        report["reviewer_disagreements"] = len(disputed)
    if args.output.exists() and any(args.output.iterdir()):
        raise ValueError("Output directory must be empty; preserve frozen evaluation artifacts")
    args.output.mkdir(parents=True, exist_ok=True)
    write_jsonl(args.output / "blind-pairs.jsonl", packet)
    write_jsonl(args.output / "labels-template.jsonl",
                ({"context_product_id": row["context_product_id"], "candidate_product_id": row["candidate_product_id"],
                  "reviewer_id": None, "grade": None} for row in packet))
    (args.output / "sample-manifest.json").write_text(json.dumps(sample, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    (args.output / "report.json").write_text(json.dumps(report, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "per_context"}, sort_keys=True))


if __name__ == "__main__":
    main()
