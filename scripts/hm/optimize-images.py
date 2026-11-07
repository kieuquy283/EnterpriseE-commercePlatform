"""Generate resumable thumbnail and detail JPEG derivatives."""

import argparse
import json
from pathlib import Path

from image_pipeline import optimize_images, read_jsonl, write_jsonl

ROOT = Path(__file__).resolve().parents[2]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--processed", type=Path, default=ROOT / "data/hm/processed")
    parser.add_argument("--data-root", type=Path, default=ROOT / "data/hm")
    args = parser.parse_args()
    rows = optimize_images(read_jsonl(args.processed / "image-validation.jsonl"),
                           args.data_root, args.data_root / "images-optimized")
    write_jsonl(args.processed / "image-optimized.jsonl", rows)
    report = {"optimized_articles": len(rows),
              "derivative_bytes": sum(value["bytes"] for row in rows for value in row["derivatives"].values())}
    (args.processed / "image-optimization-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report))


if __name__ == "__main__":
    main()
