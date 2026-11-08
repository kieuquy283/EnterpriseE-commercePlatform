"""Aggregate H&M purchase sparsity for the imported catalog; export no customer IDs."""

import argparse
import csv
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path


def sha256(path):
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def profile(transactions, mapping_path):
    mapping = {}
    with mapping_path.open(encoding="utf-8") as source:
        for line in source:
            row = json.loads(line)
            article = row["article_id"]
            if article in mapping:
                raise ValueError("Duplicate article mapping")
            mapping[article] = row["product_id"]
    split_counts = Counter()
    histories = defaultdict(set)
    buyers = {"train": set(), "validation": set(), "test": set()}
    total_rows = 0
    accepted = 0
    orphan = 0
    with transactions.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        required = {"t_dat", "customer_id", "article_id"}
        if not required.issubset(reader.fieldnames or []):
            raise ValueError("Missing transaction columns")
        for row in reader:
            total_rows += 1
            product = mapping.get(row["article_id"])
            if not product:
                orphan += 1
                continue
            date = row["t_dat"]
            if len(date) != 10 or date[4] != "-" or date[7] != "-":
                raise ValueError("Invalid transaction date")
            split = "train" if date <= "2020-09-08" else "validation" if date <= "2020-09-15" else "test"
            split_counts[split] += 1
            buyer = row["customer_id"]
            if not buyer:
                raise ValueError("Empty customer identifier")
            buyers[split].add(buyer)
            if split == "train":
                histories[buyer].add(product)
            accepted += 1
    bins = Counter("1" if len(products) == 1 else "2-4" if len(products) <= 4 else "5+"
                   for products in histories.values())
    return {"source": "hm_historical_purchase_events", "raw_rows": total_rows,
            "mapped_rows": accepted, "outside_selected_catalog_rows": orphan,
            "selected_articles": len(mapping), "selected_products": len(set(mapping.values())),
            "events_by_temporal_split": dict(split_counts),
            "unique_buyers_by_split": {split: len(values) for split, values in buyers.items()},
            "validation_buyers_seen_in_train": len(buyers["validation"] & buyers["train"]),
            "test_buyers_seen_in_train": len(buyers["test"] & buyers["train"]),
            "train_buyers_distinct_product_bins": dict(bins),
            "train_buyers_with_two_or_more_products": sum(len(products) >= 2 for products in histories.values()),
            "all_temporal_split_buyers": len(set.union(*buyers.values())),
            "privacy": "Aggregate counts only; raw customer IDs used transiently in memory and never written",
            "mapping_sha256": sha256(mapping_path), "transactions_sha256": sha256(transactions)}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--transactions", type=Path, default=Path("data/hm/transactions_train.csv"))
    parser.add_argument("--mapping", type=Path, default=Path("data/hm/processed/medusa-mapping.jsonl"))
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if args.output.exists():
        raise ValueError("Profile artifact is immutable")
    result = profile(args.transactions, args.mapping)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in result.items() if not key.endswith("sha256")}, sort_keys=True))
