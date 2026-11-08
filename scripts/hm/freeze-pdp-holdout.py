"""Freeze a private V2.1 holdout outside the 40 Astra development contexts."""

import argparse
import importlib.util
import json
from pathlib import Path

from image_pipeline import sha256


def freeze(processed, dev_manifest, output, count=100, seed=20261108):
    spec = importlib.util.spec_from_file_location("pdp_relevance", Path(__file__).with_name("evaluate-pdp-relevance.py"))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    catalog = processed / "catalog.jsonl"
    mapping = processed / "medusa-mapping.jsonl"
    v1 = processed / "candidates-product-detail.jsonl"
    dev = json.loads(dev_manifest.read_text(encoding="utf-8"))
    if (dev["catalog_sha256"] != sha256(catalog) or dev["mapping_sha256"] != sha256(mapping) or
        dev["v1_sha256"] != sha256(v1)):
        raise ValueError("Development sample provenance changed")
    products = module.catalog_products(catalog, mapping)
    baseline = module.candidate_lists(v1, products)
    remaining = {key: value for key, value in products.items() if key not in set(dev["contexts"])}
    contexts = module.select_contexts(remaining, baseline, count, seed)
    if set(contexts) & set(dev["contexts"]):
        raise ValueError("Holdout overlaps development contexts")
    if output.exists():
        raise ValueError("Holdout is immutable")
    output.parent.mkdir(parents=True, exist_ok=True)
    payload = {"status": "SEALED_UNLABELED_HOLDOUT", "contexts": contexts, "seed": seed,
               "selection": "V1 coverage bands and index-group round robin, before V2.1 tuning",
               "catalog_sha256": sha256(catalog), "mapping_sha256": sha256(mapping),
               "v1_sha256": sha256(v1), "dev_manifest_sha256": sha256(dev_manifest),
               "dev_context_count": len(dev["contexts"]), "holdout_context_count": len(contexts)}
    output.write_text(json.dumps(payload, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    return {key: value for key, value in payload.items() if key != "contexts"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--processed", type=Path, default=Path("data/hm/processed"))
    parser.add_argument("--dev-manifest", type=Path, default=Path("data/hm/processed/evaluation/v1-frozen-balanced-20261107/sample-manifest.json"))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--count", type=int, default=100)
    args = parser.parse_args()
    print(json.dumps(freeze(args.processed, args.dev_manifest, args.output, args.count), sort_keys=True))
