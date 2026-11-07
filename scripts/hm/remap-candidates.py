"""Rebind a verified catalog's candidates to another private Medusa import."""

import argparse
import hashlib
import json
from pathlib import Path


def remap(source, target, version):
    def mapping(path):
        rows = [json.loads(line) for line in path.read_text().splitlines()]
        result = {row["article_id"]: row["product_id"] for row in rows}
        if len(result) != len(rows):
            raise ValueError("Duplicate article mapping")
        return result
    old = mapping(source / "medusa-mapping.jsonl")
    new = mapping(target / "medusa-mapping.jsonl")
    if old.keys() != new.keys():
        raise ValueError("Catalog articles differ; rebuild offline model")
    replacements = {}
    for article, product in old.items():
        if product in replacements and replacements[product] != new[article]:
            raise ValueError("Product grouping changed")
        replacements[product] = new[article]
    if len(set(replacements.values())) != len(replacements):
        raise ValueError("Product groups merged")
    for name in ("candidates-home.jsonl", "candidates-product-detail.jsonl"):
        groups = {}
        for line in (source / name).read_text().splitlines():
            row = json.loads(line)
            row["version"] = version
            row["target_product_id"] = replacements[row["target_product_id"]]
            if row["context_key"].startswith("product:"):
                row["context_key"] = "product:" + replacements[row["context_key"][8:]]
            groups.setdefault(row["context_key"], []).append(row)
        output = []
        for key in sorted(groups):
            for rank, row in enumerate(sorted(groups[key], key=lambda row: (-row["score"], row["target_product_id"])), 1):
                row["rank"] = rank
                output.append(row)
        (target / name).write_text("".join(json.dumps(row, sort_keys=True) + "\n" for row in output), encoding="utf-8")
    manifest = json.loads((source / "mvp-candidate-manifest.json").read_text())
    manifest["parent_version"] = manifest["version"]
    manifest["version"] = version
    manifest["mapping_rebound"] = True
    manifest["target_mapping_sha256"] = hashlib.sha256((target / "medusa-mapping.jsonl").read_bytes()).hexdigest()
    manifest["remapper_sha256"] = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    (target / "mvp-candidate-manifest.json").write_text(json.dumps(manifest, indent=2, sort_keys=True), encoding="utf-8")
    print(json.dumps({"products_rebound": len(replacements), "articles_verified": len(old)}))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, default=Path("data/hm/processed"))
    parser.add_argument("--target", type=Path, default=Path("data/hm/test-serving/processed"))
    parser.add_argument("--version", default="rec-private-serving-v2")
    args = parser.parse_args()
    remap(args.source, args.target, args.version)
