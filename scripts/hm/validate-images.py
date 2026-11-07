"""Validate H&M JPEG assets without altering their original files."""

import argparse
import json
from pathlib import Path

from image_pipeline import coverage, read_jsonl, validate_images, write_jsonl

ROOT = Path(__file__).resolve().parents[2]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--processed", type=Path, default=ROOT / "data/hm/processed")
    parser.add_argument("--data-root", type=Path, default=ROOT / "data/hm")
    args = parser.parse_args()
    rows = validate_images(read_jsonl(args.processed / "image-manifest.jsonl"), args.data_root)
    write_jsonl(args.processed / "image-validation.jsonl", rows)
    report = coverage(rows)
    (args.processed / "image-validation-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    write_jsonl(args.processed / "image-retry.jsonl", (row for row in rows if row["status"] != "valid"))
    print(json.dumps(report))


if __name__ == "__main__":
    main()
