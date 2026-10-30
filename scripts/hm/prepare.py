"""Prepare a deterministic H&M catalog and optional offline interactions.

Reads data/hm/*.csv and writes only to data/hm/processed (gitignored).
No Medusa data is modified by this script.
"""

import argparse
import csv
import hashlib
import hmac
import json
import os
from collections import Counter, defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
RAW = ROOT / "data" / "hm"
OUT = RAW / "processed"
ARTICLE_COLUMNS = {
    "article_id", "product_code", "prod_name", "product_type_name",
    "product_group_name", "colour_group_name", "department_name",
    "index_group_name", "section_name", "garment_group_name", "detail_desc",
}
TRANSACTION_COLUMNS = {"t_dat", "customer_id", "article_id", "price", "sales_channel_id"}


def require_columns(reader, expected, path):
    missing = expected - set(reader.fieldnames or [])
    if missing:
        raise ValueError(f"{path.name}: missing columns {sorted(missing)}")


def digest(path):
    value = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def prepare(max_products, with_interactions):
    articles_path = RAW / "articles.csv"
    if not articles_path.is_file():
        raise FileNotFoundError(articles_path)
    groups = defaultdict(list)
    grouping_fields = ("product_type_name", "product_group_name", "department_name", "section_name")
    seen = set()
    with articles_path.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        require_columns(reader, ARTICLE_COLUMNS, articles_path)
        for row in reader:
            article_id = row["article_id"].strip()
            product_code = row["product_code"].strip()
            if not article_id or not product_code or article_id in seen:
                raise ValueError(f"Invalid or duplicate article_id: {article_id}")
            seen.add(article_id)
            group_key = (product_code, *(row[field].strip() for field in grouping_fields))
            groups[group_key].append({key: row[key].strip() for key in ARTICLE_COLUMNS})

    selected = sorted(groups)[:max_products] if max_products else sorted(groups)
    selected_ids = set()
    OUT.mkdir(parents=True, exist_ok=True)
    catalog_path = OUT / "catalog.jsonl"
    with catalog_path.open("w", encoding="utf-8", newline="\n") as target:
        for group_key in selected:
            variants = sorted(groups[group_key], key=lambda row: row["article_id"])
            selected_ids.update(row["article_id"] for row in variants)
            first = variants[0]
            code = group_key[0]
            suffix = hashlib.sha1("|".join(group_key).encode()).hexdigest()[:8]
            title = Counter(row["prod_name"] for row in variants if row["prod_name"]).most_common(1)
            target.write(json.dumps({
                "product_key": f"{code}-{suffix}",
                "source_hash": hashlib.sha256(json.dumps(variants, sort_keys=True).encode()).hexdigest(),
                "product_code": code,
                "title": title[0][0] if title else f"H&M {code}",
                "description": first["detail_desc"],
                "product_group": first["product_group_name"],
                "product_type": first["product_type_name"],
                "department": first["department_name"],
                "section": first["section_name"],
                "index_group": first["index_group_name"],
                "garment_group": first["garment_group_name"],
                "variants": [{"article_id": row["article_id"], "color": row["colour_group_name"] or "Unknown"}
                             for row in variants],
            }, ensure_ascii=False) + "\n")

    report = {
        "source": "H&M Personalized Fashion Recommendations",
        "articles_sha256": digest(articles_path),
        "article_rows": len(seen),
        "product_groups_total": len(groups),
        "product_groups_selected": len(selected),
        "article_ids_selected": len(selected_ids),
        "grouping_rule": "product_code+product_type_name+product_group_name+department_name+section_name",
        "images_available": (RAW / "images").is_dir(),
        "catalog_sha256": digest(catalog_path),
        "synthetic_commerce_data": True,
    }
    if with_interactions:
        salt = os.environ.get("HM_CUSTOMER_HASH_KEY")
        if not salt or len(salt) < 32:
            raise ValueError("HM_CUSTOMER_HASH_KEY must contain at least 32 characters")
        transactions_path = RAW / "transactions_train.csv"
        if not transactions_path.is_file():
            raise FileNotFoundError(transactions_path)
        counts = Counter()
        accepted = 0
        interactions_path = OUT / "interactions.csv"
        with transactions_path.open(encoding="utf-8-sig", newline="") as source, interactions_path.open(
            "w", encoding="utf-8", newline=""
        ) as target:
            reader = csv.DictReader(source)
            require_columns(reader, TRANSACTION_COLUMNS, transactions_path)
            writer = csv.writer(target)
            writer.writerow(["t_dat", "customer_hash", "article_id", "sales_channel_id", "source"])
            for row in reader:
                article_id = row["article_id"].strip()
                if article_id not in selected_ids:
                    continue
                customer_hash = hmac.new(salt.encode(), row["customer_id"].encode(), hashlib.sha256).hexdigest()
                writer.writerow([row["t_dat"], customer_hash, article_id, row["sales_channel_id"], "hm_historical"])
                counts[article_id] += 1
                accepted += 1
        report.update({
            "transactions_sha256": digest(transactions_path),
            "interactions_selected": accepted,
            "interactions_sha256": digest(interactions_path),
        })
        with (OUT / "popularity.json").open("w", encoding="utf-8") as target:
            json.dump(sorted(counts.items(), key=lambda item: (-item[1], item[0])), target)
    (OUT / "manifest.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-products", type=int, default=500, help="0 selects all product groups")
    parser.add_argument("--with-interactions", action="store_true")
    args = parser.parse_args()
    if args.max_products < 0:
        parser.error("--max-products must be nonnegative")
    prepare(args.max_products, args.with_interactions)
