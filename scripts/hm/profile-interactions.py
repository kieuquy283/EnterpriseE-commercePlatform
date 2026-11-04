"""Stream H&M purchase coverage without retaining customer identifiers."""

import argparse
import csv
import hashlib
import json
from collections import Counter
from pathlib import Path


def checksum(path):
    value = hashlib.sha256()
    with Path(path).open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def profile(articles_path, transactions_path, mapping_path):
    mapping = {}
    variants = set()
    for line in Path(mapping_path).read_text(encoding="utf-8").splitlines():
        row = json.loads(line)
        article = row["article_id"]
        if not isinstance(article, str) or not article.isdigit() or len(article) != 10:
            raise ValueError("Article IDs must be ten-digit strings")
        if article in mapping or row["variant_id"] in variants:
            raise ValueError("Duplicate article or variant mapping")
        mapping[article] = row["product_id"]
        variants.add(row["variant_id"])
    articles = set()
    groups = Counter()
    with Path(articles_path).open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        if not {"article_id", "product_group_name"}.issubset(reader.fieldnames or []):
            raise ValueError("Missing article columns")
        for row in reader:
            article = row["article_id"]
            if article in articles:
                raise ValueError("Duplicate source article")
            articles.add(article)
            if article in mapping:
                groups[row["product_group_name"]] += 1
    if set(mapping) - articles:
        raise ValueError("Mapping contains unknown source articles")
    dates = Counter()
    counts = Counter()
    rows = orphans = matched = 0
    with Path(transactions_path).open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        if not {"article_id", "t_dat"}.issubset(reader.fieldnames or []):
            raise ValueError("Missing transaction columns")
        for row in reader:
            rows += 1
            article = row["article_id"]
            dates[row["t_dat"]] += 1
            orphans += article not in articles
            if article in mapping:
                matched += 1
                counts[mapping[article]] += 1
    products = set(mapping.values())
    return {
        "source_hashes": {"articles": checksum(articles_path), "transactions": checksum(transactions_path), "mapping": checksum(mapping_path)},
        "source_articles": len(articles), "selected_articles": len(mapping),
        "selected_products": len(products), "transaction_rows": rows,
        "orphan_transaction_rows": orphans, "matched_transaction_rows": matched,
        "products_with_history": len(counts), "zero_history_products": len(products - set(counts)),
        "selected_article_groups": dict(sorted(groups.items())),
        "date_counts": dict(sorted(dates.items())), "db_reconciled": False,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("data/hm"))
    args = parser.parse_args()
    result = profile(args.root / "articles.csv", args.root / "transactions_train.csv", args.root / "processed/medusa-mapping.jsonl")
    output = args.root / "processed/interaction-coverage.json"
    output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in result.items() if key not in {"date_counts", "selected_article_groups", "source_hashes"}}))
