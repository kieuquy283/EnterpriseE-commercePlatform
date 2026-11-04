"""Read-only PDP audit and repeatable similarity generation; no customer or purchase input."""

import argparse
import csv
import hashlib
import importlib.util
import json
import math
import re
from collections import Counter, defaultdict
from pathlib import Path

spec = importlib.util.spec_from_file_location("mvp", Path(__file__).with_name("build-mvp-candidates.py"))
mvp = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mvp)


def verify(root, output, version, articles_path=None):
    def read(name):
        return [json.loads(line) for line in (root / name).read_text(encoding="utf-8").splitlines() if line]

    mapping = read("medusa-mapping.jsonl")
    catalog = read("catalog.jsonl")
    articles = {row["article_id"]: row for row in mapping}
    if len(articles) != len(mapping) or len({r["variant_id"] for r in mapping}) != len(mapping):
        raise ValueError("Duplicate article or variant mapping")
    if any(not re.fullmatch(r"\d{10}", article) for article in articles):
        raise ValueError("Article identity must preserve ten digits")
    products = {}
    missing = Counter()
    catalog_articles = set()
    fields = ("product_type", "product_group", "section", "department", "garment_group", "index_group", "description")
    for row in catalog:
        ids = {articles[v["article_id"]]["product_id"] for v in row["variants"]}
        if len(ids) != 1:
            raise ValueError("Catalog group split across products")
        product = ids.pop()
        if product in products:
            raise ValueError("Multiple catalog groups merged into one product")
        for variant in row["variants"]:
            if variant["article_id"] in catalog_articles:
                raise ValueError("Duplicate catalog article")
            catalog_articles.add(variant["article_id"])
        for field in fields:
            missing[field] += not row.get(field) or row[field].strip().casefold() == "unknown"
        row["colors"] = {v["color"].strip().casefold() for v in row["variants"] if v.get("color") and v["color"].strip().casefold() != "unknown"}
        row["tokens"] = set(re.findall(r"[a-z]+", row.get("description", "").casefold())) - {"a", "the", "in", "and", "with", "of", "at"}
        products[product] = row
    if catalog_articles != articles.keys():
        raise ValueError("Catalog and mapping article universes differ")
    source_count = None
    if articles_path:
        selected = {v["article_id"]: row for row in catalog for v in row["variants"]}
        found = set()
        source_count = 0
        with articles_path.open(encoding="utf-8-sig", newline="") as source:
            for row in csv.DictReader(source):
                source_count += 1
                article = row["article_id"]
                if article in selected:
                    if article in found or row["product_code"] != selected[article]["product_code"]:
                        raise ValueError("Duplicate raw article or incorrect product-code grouping")
                    found.add(article)
        if found != catalog_articles:
            raise ValueError("Selected article missing from raw source")
    rows = read("candidates-product-detail.jsonl")
    groups = defaultdict(list)
    for row in rows:
        if row.get("placement") != "product_detail" or row.get("strategy") != "hm_metadata_similarity" or not row.get("version") or not row.get("context_key", "").startswith("product:") or not isinstance(row.get("score"), (int, float)) or not math.isfinite(row["score"]) or not .70 <= row["score"] <= 1:
            raise ValueError("Invalid similarity candidate schema or score")
        source = row["context_key"].removeprefix("product:")
        if source not in products or row["target_product_id"] not in products or source == row["target_product_id"]:
            raise ValueError("Stale or self candidate")
        groups[source].append(row)
    for group in groups.values():
        ordered = sorted(group, key=lambda r: (-r["score"], r["target_product_id"]))
        if len(group) > 100 or len({r["target_product_id"] for r in group}) != len(group):
            raise ValueError("Duplicate target or oversized pool")
        if [r["rank"] for r in ordered] != list(range(1, len(group) + 1)):
            raise ValueError("Invalid candidate ranking")
    generated = []
    counts = []
    baseline_counts = []
    categories = Counter()
    for source in sorted(products):
        item = products[source]
        scores = {target: mvp.similarity(item, other) for target, other in products.items() if target != source}
        scores = {target: score for target, score in scores.items() if score >= .70}
        ranked = mvp.ranked(scores)
        generated.extend(mvp.records(ranked, scores, version, "product_detail", "product:" + source, "hm_metadata_similarity"))
        counts.append(len(ranked))
        baseline_counts.append(sum(target != source and other.get("index_group") == item.get("index_group") and other.get("product_type") == item.get("product_type") for target, other in products.items()))
        categories[item.get("index_group") or "Unknown"] += 1
    output.mkdir(parents=True, exist_ok=True)
    payload = "".join(json.dumps(row, sort_keys=True) + "\n" for row in generated).encode()
    (output / "candidates-product-detail.jsonl").write_bytes(payload)
    def coverage(values):
        return {"zero": sum(n == 0 for n in values), **{f"at_least_{k}": sum(n >= k for n in values) for k in (1, 3, 6)}}
    report = {"products": len(products), "articles": len(mapping), "existing_rows_validated": len(rows), "generated_rows": len(generated), "coverage": coverage(counts), "exact_category_baseline": coverage(baseline_counts), "index_group_distribution": dict(categories), "missing_fields": dict(missing), "candidate_sha256": hashlib.sha256(payload).hexdigest(), "version": version, "threshold": .70, "human_review": "NOT_RUN", "source_hashes": {name: hashlib.sha256((root / name).read_bytes()).hexdigest() for name in ("catalog.jsonl", "medusa-mapping.jsonl")}, "scorer_sha256": hashlib.sha256(Path(mvp.__file__).read_bytes()).hexdigest()}
    report["raw_article_rows"] = source_count
    config = {"threshold": .70, "pool_limit": 100, "scorer_sha256": report["scorer_sha256"]}
    report["config_sha256"] = hashlib.sha256(json.dumps(config, sort_keys=True).encode()).hexdigest()
    if articles_path:
        report["raw_articles_sha256"] = hashlib.sha256(articles_path.read_bytes()).hexdigest()
    (output / "verification.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report))
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=Path("data/hm/test-serving/processed"))
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--version", default="pdp-private-v3")
    parser.add_argument("--articles", type=Path, default=Path("data/hm/articles.csv"))
    args = parser.parse_args()
    verify(args.root, args.output, args.version, args.articles)
