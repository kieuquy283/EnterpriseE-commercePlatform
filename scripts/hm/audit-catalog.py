"""Read-only audit of one prepared H&M catalog batch and its import mapping.

No customer or transaction records are read. Source files stay in data/hm.
"""

import argparse
import csv
import hashlib
import json
import subprocess
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ARTICLE_COLUMNS = {
    "article_id", "product_code", "prod_name", "product_type_name",
    "product_group_name", "colour_group_name", "department_name",
    "index_group_name", "section_name", "garment_group_name", "detail_desc",
}
CATALOG_FIELDS = {
    "product_key", "source_hash", "product_code", "title", "description",
    "product_group", "product_type", "department", "section", "index_group",
    "garment_group", "variants",
}
MAPPING_FIELDS = {"source", "article_id", "product_code", "product_id", "variant_id"}
GROUP_FIELDS = ("product_type_name", "product_group_name", "department_name", "section_name")


def digest(path):
    value = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            value.update(block)
    return value.hexdigest()


def is_identifier(value):
    return isinstance(value, str) and bool(value.strip()) and value == value.strip()


def source_group(row):
    return (row["product_code"], *(row[field] for field in GROUP_FIELDS))


def product_group(product):
    return tuple(product.get(field, "") for field in (
        "product_code", "product_type", "product_group", "department", "section",
    ))


def source_provenance():
    def git_value(arguments):
        try:
            result = subprocess.run(["git", "-C", str(ROOT), *arguments], capture_output=True,
                                    encoding="utf-8", timeout=10, check=False)
            return result.stdout.strip() if result.returncode == 0 else None
        except (OSError, subprocess.TimeoutExpired):
            return None

    dirty = git_value(["status", "--porcelain", "--untracked-files=normal"])
    return {"baseline_commit": git_value(["rev-parse", "HEAD"]),
            "branch": git_value(["branch", "--show-current"]),
            "worktree_dirty": bool(dirty) if dirty is not None else None,
            "source_sha256": {"scripts/hm/audit-catalog.py": digest(Path(__file__))}}


def claim_output(output_dir, run):
    for name in ("offline-run.json", "offline-audit.json", "offline-findings.csv"):
        if (output_dir / name).exists():
            raise FileExistsError("Offline audit output already exists; choose a new run directory")
    with (output_dir / "offline-run.json").open("x", encoding="utf-8") as output:
        json.dump(run, output, ensure_ascii=False, indent=2)
        output.write("\n")


def audit(data_dir, mapping_file=None):
    findings = []

    def issue(code, identifier, expected, actual, severity="error"):
        findings.append({"code": code, "severity": severity, "identifier": identifier,
                         "expected": expected, "actual": actual})

    def json_lines(path):
        rows = []
        with path.open(encoding="utf-8-sig") as source:
            for number, line in enumerate(source, 1):
                if not line.strip():
                    continue
                try:
                    row = json.loads(line)
                    if not isinstance(row, dict):
                        raise ValueError("Expected object")
                    rows.append(row)
                except (ValueError, json.JSONDecodeError):
                    issue("invalid_jsonl_record", f"{path.name}:{number}", "JSON object", "invalid")
        return rows

    catalog_path = data_dir / "processed" / "catalog.jsonl"
    mapping_path = Path(mapping_file) if mapping_file is not None else data_dir / "processed" / "medusa-mapping.jsonl"
    articles_path = data_dir / "articles.csv"
    manifest_path = data_dir / "processed" / "manifest.json"
    catalog = json_lines(catalog_path)
    mapping = json_lines(mapping_path)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8-sig"))
    if not catalog:
        issue("empty_catalog", "catalog", "nonempty selected batch", 0)

    selected_ids = []
    wanted_groups = set()
    product_keys = []
    for index, product in enumerate(catalog):
        key = product.get("product_key", f"record:{index + 1}")
        for field in sorted(CATALOG_FIELDS - product.keys()):
            issue("missing_catalog_field", str(key), field, "missing")
        for field in ("product_key", "product_code", "source_hash", "title"):
            if not is_identifier(product.get(field)):
                issue("invalid_catalog_field", str(key), f"nonempty string {field}", product.get(field))
        if all(isinstance(product.get(field), str) for field in (
            "product_code", "product_type", "product_group", "department", "section",
        )):
            wanted_groups.add(product_group(product))
        product_keys.append(str(key))
        variants = product.get("variants")
        if not isinstance(variants, list) or not variants:
            issue("invalid_catalog_variants", str(key), "nonempty array", "missing/empty/invalid")
            continue
        for variant in variants:
            if not isinstance(variant, dict) or not is_identifier(variant.get("article_id")):
                issue("invalid_article_identifier", str(key), "article_id string preserving leading zeros", variant)
                continue
            selected_ids.append(variant["article_id"])
            if not is_identifier(variant.get("color")):
                issue("invalid_variant_color", variant["article_id"], "nonempty color or Unknown", variant.get("color"))
    for key, count in Counter(product_keys).items():
        if count > 1:
            issue("duplicate_product_key", key, 1, count)
    for aid, count in Counter(selected_ids).items():
        if count > 1:
            issue("duplicate_catalog_article", aid, 1, count)

    selected_set = set(selected_ids)
    raw_ids = set()
    source_groups = defaultdict(list)
    all_groups = set()
    raw_rows = 0
    with articles_path.open(encoding="utf-8-sig", newline="") as source:
        reader = csv.DictReader(source)
        missing_columns = ARTICLE_COLUMNS - set(reader.fieldnames or [])
        for column in sorted(missing_columns):
            issue("missing_source_column", "articles.csv", column, "missing")
        for row in reader:
            raw_rows += 1
            row = {key: (row.get(key) or "").strip() for key in ARTICLE_COLUMNS}
            aid = row["article_id"]
            if not aid or not row["product_code"]:
                issue("missing_source_identifier", f"articles.csv:{raw_rows + 1}", "article_id and product_code", aid)
            if aid in raw_ids:
                issue("duplicate_source_article", aid, 1, "multiple")
            raw_ids.add(aid)
            group = source_group(row)
            all_groups.add(group)
            if group in wanted_groups or aid in selected_set:
                source_groups[group].append(row)

    expected_articles = {}
    for product in catalog:
        if not isinstance(product.get("variants"), list):
            continue
        key = str(product.get("product_key"))
        group = product_group(product)
        source_rows = sorted(source_groups.get(group, []), key=lambda row: row["article_id"])
        ids = {v.get("article_id") for v in product["variants"] if isinstance(v, dict) and is_identifier(v.get("article_id"))}
        source_ids = {row["article_id"] for row in source_rows}
        for aid in sorted(ids - source_ids):
            issue("catalog_article_missing_or_wrong_source_group", aid, list(group), "not in source group")
        for aid in sorted(source_ids - ids):
            issue("source_group_article_missing_from_catalog", aid, key, "absent")
        suffix = hashlib.sha1("|".join(str(value) for value in group).encode()).hexdigest()[:8]
        expected_key = f"{product.get('product_code')}-{suffix}"
        if product.get("product_key") != expected_key:
            issue("product_group_key_mismatch", key, expected_key, product.get("product_key"))
        if source_rows:
            expected_hash = hashlib.sha256(json.dumps(source_rows, sort_keys=True).encode()).hexdigest()
            if product.get("source_hash") != expected_hash:
                issue("product_source_hash_mismatch", key, expected_hash, product.get("source_hash"))
        source_by_id = {row["article_id"]: row for row in source_rows}
        for variant in product["variants"]:
            if not isinstance(variant, dict) or not is_identifier(variant.get("article_id")):
                continue
            aid = variant["article_id"]
            expected_articles[aid] = product
            if aid in source_by_id:
                color = source_by_id[aid]["colour_group_name"] or "Unknown"
                if variant.get("color") != color:
                    issue("variant_color_mismatch", aid, color, variant.get("color"))

    mapping_articles = []
    mapping_variants = []
    mapping_products = set()
    ids_per_group = defaultdict(set)
    groups_per_id = defaultdict(set)
    for index, row in enumerate(mapping):
        identifier = row.get("article_id", f"mapping:{index + 1}")
        for field in sorted(MAPPING_FIELDS):
            if not is_identifier(row.get(field)):
                issue("invalid_mapping_field", str(identifier), f"nonempty string {field}", row.get(field))
        aid = row.get("article_id")
        if not is_identifier(aid):
            continue
        mapping_articles.append(aid)
        if is_identifier(row.get("variant_id")):
            mapping_variants.append(row["variant_id"])
        if is_identifier(row.get("product_id")):
            mapping_products.add(row["product_id"])
        if row.get("source") != "hm":
            issue("mapping_source_mismatch", aid, "hm", row.get("source"))
        expected = expected_articles.get(aid)
        if expected:
            if row.get("product_code") != expected.get("product_code"):
                issue("mapping_product_code_mismatch", aid, expected.get("product_code"), row.get("product_code"))
            if is_identifier(row.get("product_id")):
                ids_per_group[expected["product_key"]].add(row["product_id"])
                groups_per_id[row["product_id"]].add(expected["product_key"])
    for aid, count in Counter(mapping_articles).items():
        if count > 1:
            issue("duplicate_mapping_article", aid, 1, count)
    for variant_id, count in Counter(mapping_variants).items():
        if count > 1:
            issue("duplicate_mapping_variant", variant_id, 1, count)
    for aid in sorted(selected_set - set(mapping_articles)):
        issue("missing_mapping", aid, "one mapping row", "absent")
    for aid in sorted(set(mapping_articles) - selected_set):
        issue("mapping_outside_selected_catalog", aid, "article in selected batch", "absent")
    for group, values in ids_per_group.items():
        if len(values) != 1:
            issue("group_maps_to_multiple_products", group, 1, len(values))
    for product_id, groups in groups_per_id.items():
        if len(groups) != 1:
            issue("product_maps_to_multiple_groups", product_id, 1, len(groups))

    checksums = {"articles_sha256": digest(articles_path), "catalog_sha256": digest(catalog_path)}
    manifest_expected = dict(checksums, article_rows=raw_rows, product_groups_total=len(all_groups),
                             product_groups_selected=len(catalog), article_ids_selected=len(selected_set),
                             grouping_rule="product_code+product_type_name+product_group_name+department_name+section_name",
                             synthetic_commerce_data=True)
    for key, value in manifest_expected.items():
        if manifest.get(key) != value:
            issue("manifest_mismatch", key, value, manifest.get(key))

    return {
        "schema_version": 1,
        "captured_at": datetime.now(timezone.utc).isoformat(),
        "status": "FAIL" if any(f["severity"] == "error" for f in findings) else "PASS",
        "scope": "Read-only source/catalog/mapping audit; no live database reads or checkout",
        "counts": {"source_article_rows": raw_rows, "unique_source_articles": len(raw_ids),
                   "source_groups": len(all_groups), "catalog_products": len(catalog),
                   "catalog_articles": len(selected_ids), "mapping_rows": len(mapping),
                   "mapped_product_ids": len(mapping_products), "mapped_variant_ids": len(set(mapping_variants))},
        "mapping_input": str(mapping_path.resolve()),
        "files": {"articles.csv": checksums["articles_sha256"],
                  "processed/catalog.jsonl": checksums["catalog_sha256"],
                  "mapping_input": digest(mapping_path),
                  "processed/manifest.json": digest(manifest_path)},
        "finding_counts": dict(Counter(f["code"] for f in findings)),
        "findings": findings,
        "limits": ["Prepared batch only; unselected source articles do not require mapping.",
                   "Product/variant existence, prices, inventory and concurrency require live Medusa verification.",
                   "No customer or transaction records were processed; source data remains private."],
    }


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data-dir", type=Path, default=ROOT / "data" / "hm")
    parser.add_argument("--mapping-file", type=Path, help="Audit a new import mapping without replacing the original ZIP artifact")
    parser.add_argument("--output-dir", type=Path, required=True)
    args = parser.parse_args(argv)
    args.output_dir.mkdir(parents=True, exist_ok=True)
    run = {"started_at": datetime.now(timezone.utc).isoformat(),
           "command": ["python", "scripts/hm/audit-catalog.py", "--data-dir", str(args.data_dir.resolve()),
                       "--output-dir", str(args.output_dir.resolve())],
           "working_directory": str(Path.cwd()), **source_provenance()}
    if args.mapping_file is not None:
        run["command"].extend(["--mapping-file", str(args.mapping_file.resolve())])
    try:
        claim_output(args.output_dir, run)
    except FileExistsError:
        parser.exit(2, "Offline audit output already exists; choose a new run directory. Existing evidence was preserved.\n")
    try:
        report = audit(args.data_dir, args.mapping_file)
    except (OSError, ValueError, TypeError, KeyError) as error:
        report = {"schema_version": 1, "status": "INCOMPLETE", "error_type": type(error).__name__,
                  "message": "Could not complete input parsing. Verify required files and their schemas."}
    report["run"] = run
    report["finished_at"] = datetime.now(timezone.utc).isoformat()
    with (args.output_dir / "offline-audit.json").open("x", encoding="utf-8") as output:
        output.write(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    with (args.output_dir / "offline-findings.csv").open("x", encoding="utf-8", newline="") as output:
        writer = csv.DictWriter(output, fieldnames=["code", "severity", "identifier", "expected", "actual"])
        writer.writeheader()
        writer.writerows(report.get("findings", []))
    print(json.dumps({"status": report["status"], "counts": report.get("counts"),
                      "finding_counts": report.get("finding_counts"), "output_dir": str(args.output_dir)}, ensure_ascii=False))
    return 0 if report["status"] == "PASS" else 1


if __name__ == "__main__":
    raise SystemExit(main())
