"""Build an image request manifest from the bounded catalog and Medusa mapping."""

import argparse
import json
from pathlib import Path

from image_pipeline import build_manifest, write_jsonl

ROOT = Path(__file__).resolve().parents[2]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--processed", type=Path, default=ROOT / "data/hm/processed")
    args = parser.parse_args()
    rows = build_manifest(args.processed / "catalog.jsonl", args.processed / "medusa-mapping.jsonl")
    write_jsonl(args.processed / "image-manifest.jsonl", rows)
    summary = {"products": len({row["product_id"] for row in rows}), "variants": len(rows),
               "representatives": sum(row["representative"] for row in rows),
               "source": "catalog.jsonl + medusa-mapping.jsonl"}
    (args.processed / "image-manifest-summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary))


if __name__ == "__main__":
    main()
