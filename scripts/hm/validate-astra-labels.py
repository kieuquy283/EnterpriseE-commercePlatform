"""Validate private AI PDP judgments without treating them as human ground truth."""

import argparse
import json
from collections import Counter
from pathlib import Path

from image_pipeline import read_jsonl


def validate(packet_path, labels_path, data_root):
    packet = list(read_jsonl(packet_path))
    expected = {(row["context_product_id"], row["candidate_product_id"]): row for row in packet}
    if len(expected) != len(packet):
        raise ValueError("Duplicate pairs in packet")
    for row in packet:
        for role in ("context", "candidate"):
            relative = Path(row[role]["image_source_path"])
            if relative.is_absolute() or ".." in relative.parts or not (data_root / relative).is_file():
                raise ValueError("Missing or unsafe image path")
    seen = {}
    distribution = Counter()
    confidence = Counter()
    for row in read_jsonl(labels_path):
        key = (row.get("context_product_id"), row.get("candidate_product_id"))
        grade = row.get("grade")
        if key not in expected or key in seen:
            raise ValueError("Unknown or duplicate label pair")
        if (row.get("reviewer_id") != "astra-codex-20261107" or type(grade) is not int or grade not in (0, 1, 2)
                or row.get("inspected_images") is not True or row.get("confidence") not in ("low", "medium", "high")
                or not isinstance(row.get("reason"), str) or not row["reason"].strip()):
            raise ValueError("Invalid AI label, image inspection, reason or confidence")
        seen[key] = row
        distribution[grade] += 1
        confidence[row["confidence"]] += 1
    return {"status": "COMPLETE" if len(seen) == len(expected) else "PARTIAL",
            "expected_pairs": len(expected), "labeled_pairs": len(seen),
            "unlabeled_pairs": len(expected) - len(seen),
            "grade_distribution": dict(sorted(distribution.items())),
            "confidence_distribution": dict(sorted(confidence.items())),
            "label_source": "ASTRA_AI_PROXY_NOT_HUMAN_GROUND_TRUTH"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", type=Path, required=True)
    parser.add_argument("--labels", type=Path, required=True)
    parser.add_argument("--data-root", type=Path, default=Path("data/hm"))
    args = parser.parse_args()
    print(json.dumps(validate(args.packet, args.labels, args.data_root), sort_keys=True))
