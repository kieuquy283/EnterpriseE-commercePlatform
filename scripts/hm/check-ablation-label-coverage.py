"""Check if existing Astra development judgments cover each proposed ranking."""

import argparse
import json
from collections import defaultdict
from pathlib import Path

from image_pipeline import read_jsonl, sha256


def check(processed, candidate_paths):
    evaluation = processed / "evaluation"
    sample = json.loads((evaluation / "v1-frozen-balanced-20261107/sample-manifest.json").read_text(encoding="utf-8"))
    pool_path = evaluation / "weighted-openclip-b32-v1-blind/blind-pairs.jsonl"
    pool = {(row["context_product_id"], row["candidate_product_id"]) for row in read_jsonl(pool_path)}
    result = {}
    for path in candidate_paths:
        manifest = json.loads((path.parent / "manifest.json").read_text(encoding="utf-8"))
        if manifest["candidate_files_sha256"][path.name] != sha256(path):
            raise ValueError("Candidate checksum mismatch")
        rows = defaultdict(list)
        for row in read_jsonl(path):
            rows[row["context_key"].removeprefix("product:")].append(row["target_product_id"])
        missing = [(source, target) for source in sample["contexts"]
                   for target in rows[source][:6] if (source, target) not in pool]
        result[manifest["version"]] = {"missing_judgments": len(missing),
                                       "affected_contexts": len({source for source, _ in missing}),
                                       "fully_judged": not missing, "candidate_sha256": sha256(path)}
    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--processed", type=Path, default=Path("data/hm/processed"))
    parser.add_argument("candidates", type=Path, nargs="+")
    args = parser.parse_args()
    print(json.dumps(check(args.processed, args.candidates), sort_keys=True))
