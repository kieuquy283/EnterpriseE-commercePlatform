"""Compare offline structural coverage; never reports CTR or human relevance."""

import argparse
import json
from collections import defaultdict
from pathlib import Path

from image_pipeline import read_jsonl


def evaluate(catalog_path, mapping_path, candidate_path):
    mapping = {row["article_id"]: row["product_id"] for row in read_jsonl(mapping_path)}
    if not mapping:
        raise ValueError("Empty mapping")
    groups = {}
    for row in read_jsonl(catalog_path):
        ids = {mapping[item["article_id"]] for item in row["variants"]}
        if len(ids) != 1:
            raise ValueError("Broken Product mapping")
        groups[ids.pop()] = row.get("product_type") or "Unknown"
    contexts = defaultdict(list)
    for row in read_jsonl(candidate_path):
        if row.get("placement") != "product_detail":
            raise ValueError("Only PDP candidates are supported")
        context = row["context_key"]
        source = context.removeprefix("product:")
        target = row["target_product_id"]
        if source not in groups or target not in groups or source == target:
            raise ValueError("Unknown or self Product")
        contexts[source].append(row)
    if not contexts:
        raise ValueError("No PDP candidate contexts")
    for rows in contexts.values():
        ranks = [row["rank"] for row in rows]
        targets = [row["target_product_id"] for row in rows]
        if ranks != list(range(1, len(rows) + 1)) or len(rows) > 100 or len(set(targets)) != len(targets):
            raise ValueError("Invalid candidate rank, cap or duplicate")
    counts = [len(contexts[product]) for product in groups]
    top = [row["target_product_id"] for product in groups for row in contexts[product][:6]]
    diversity = [len({groups[row["target_product_id"]] for row in contexts[product][:6]})
                 for product in groups if contexts[product]]
    return {
        "eligible_products_from_mapping": len(groups), "contexts_with_six": sum(value >= 6 for value in counts),
        "contexts_with_zero": sum(value == 0 for value in counts),
        "catalog_coverage": len(set(top)) / len(groups),
        "mean_distinct_product_types_top6": sum(diversity) / len(diversity) if diversity else 0,
        "human_relevance": "NOT_RUN", "ctr_conversion": "NOT_MEASURABLE_FROM_HM_PURCHASES",
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--processed", type=Path, default=Path("data/hm/processed"))
    parser.add_argument("--candidates", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    result = evaluate(args.processed / "catalog.jsonl", args.processed / "medusa-mapping.jsonl", args.candidates)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result, sort_keys=True))
