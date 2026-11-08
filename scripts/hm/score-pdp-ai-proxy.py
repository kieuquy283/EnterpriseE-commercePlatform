"""Compare frozen PDP v1 and real v2 with complete private Astra proxy labels."""

import argparse
import importlib.util
import json
from collections import Counter
from pathlib import Path

from image_pipeline import read_jsonl, sha256


def load_evaluator():
    path = Path(__file__).with_name("evaluate-pdp-relevance.py")
    spec = importlib.util.spec_from_file_location("pdp_relevance", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def score(sample_dir, v1_path, v2_path, new_labels_path):
    evaluator = load_evaluator()
    sample = json.loads((sample_dir / "sample-manifest.json").read_text(encoding="utf-8"))
    if sample["v1_sha256"] != sha256(v1_path) or sample["v2_sha256"] != sha256(v2_path):
        raise ValueError("Candidate artifact differs from frozen evaluation pool")
    packet = list(read_jsonl(sample_dir / "blind-pairs.jsonl"))
    old_path = sample_dir.parent / "v1-frozen-balanced-20261107" / "astra-labels.jsonl"
    old = list(read_jsonl(old_path))
    new = list(read_jsonl(new_labels_path))
    keys = lambda rows: {(row["context_product_id"], row["candidate_product_id"]) for row in rows}
    if len(keys(old)) != len(old) or len(keys(new)) != len(new) or keys(old) & keys(new):
        raise ValueError("Duplicate or overlapping labels")
    expected = keys(packet)
    if keys(old) | keys(new) != expected:
        raise ValueError("Astra labels do not cover the full v1/v2 pool")
    labels = {}
    for row in old + new:
        if (row.get("reviewer_id") != "astra-codex-20261107" or row.get("inspected_images") is not True or
            type(row.get("grade")) is not int or row["grade"] not in (0, 1, 2)):
            raise ValueError("Invalid Astra proxy label")
        labels[row["context_product_id"], row["candidate_product_id"]] = row["grade"]
    products = evaluator.catalog_products(Path("data/hm/processed/catalog.jsonl"),
                                           Path("data/hm/processed/medusa-mapping.jsonl"))
    baseline = evaluator.candidate_lists(v1_path, products)
    challenger = evaluator.candidate_lists(v2_path, products)
    result = evaluator.compare(sample["contexts"], baseline, challenger, labels)
    result.update({"label_source": "ASTRA_AI_PROXY_NOT_HUMAN_GROUND_TRUTH", "pool_size": len(packet),
                   "old_labels": len(old), "new_labels": len(new),
                   "grade_distribution": dict(sorted(Counter(labels.values()).items())),
                   "v1_sha256": sha256(v1_path), "v2_sha256": sha256(v2_path),
                   "old_labels_sha256": sha256(old_path), "new_labels_sha256": sha256(new_labels_path),
                   "pool_sha256": sha256(sample_dir / "blind-pairs.jsonl")})
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--sample-dir", type=Path, required=True)
    parser.add_argument("--v1", type=Path, default=Path("data/hm/processed/candidates-product-detail.jsonl"))
    parser.add_argument("--v2", type=Path, required=True)
    parser.add_argument("--new-labels", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = score(args.sample_dir, args.v1, args.v2, args.new_labels)
    if args.output.exists():
        raise ValueError("Evaluation report is immutable; use a new output path")
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in result.items() if key != "per_context"}, sort_keys=True))
