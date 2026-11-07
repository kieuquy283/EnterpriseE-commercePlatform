"""Bounded Kaggle CLI image acquisition; never download the full competition implicitly."""

import argparse
import json
import os
import shutil
import subprocess
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from image_pipeline import read_jsonl

ROOT = Path(__file__).resolve().parents[2]
COMPETITION = "h-and-m-personalized-fashion-recommendations"


def extract_requested(archive, target, relative, partial):
    with zipfile.ZipFile(archive) as source:
        matches = [name for name in source.namelist()
                   if name.replace("\\", "/") in (relative.as_posix(), target.name)]
        if len(matches) != 1:
            raise ValueError("Archive does not contain the requested image exactly once")
        if source.getinfo(matches[0]).file_size > 20 * 1024 * 1024:
            raise ValueError("Image archive member exceeds 20 MB")
        with source.open(matches[0]) as stream, partial.open("wb") as destination:
            shutil.copyfileobj(stream, destination)
    os.replace(partial, target)


def download(rows, data_root, limit, retries=2, pause=0.5, runner=subprocess.run):
    data_root = Path(data_root)
    selected = sorted(rows, key=lambda row: (not row["representative"], row["product_id"],
                                            row["article_id"]))[:limit]
    results = []
    for row in selected:
        started = time.monotonic()
        relative = Path(row["source_path"])
        if relative.parts != ("images", row["article_id"][:3], f"{row['article_id']}.jpg"):
            raise ValueError("Manifest contains an unexpected path")
        target = data_root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        partial = target.with_suffix(".jpg.partial")
        if target.is_file() and zipfile.is_zipfile(target):
            try:
                extract_requested(target, target, relative, partial)
            except (OSError, ValueError, zipfile.BadZipFile) as error:
                partial.unlink(missing_ok=True)
                results.append({"article_id": row["article_id"], "status": "failed",
                                "bytes": 0, "attempts": 0, "elapsed_ms": 0,
                                "error_code": type(error).__name__})
                continue
        if target.is_file():
            results.append({"article_id": row["article_id"], "status": "existing",
                            "bytes": target.stat().st_size, "attempts": 0, "elapsed_ms": 0})
            continue
        status = "failed"
        error_code = None
        attempts = 0
        for attempt in range(retries + 1):
            attempts += 1
            command = ["kaggle", "competitions", "download", COMPETITION,
                       "--file", relative.as_posix(), "--path", str(data_root), "--quiet"]
            try:
                process = runner(command, capture_output=True, text=True, timeout=120)
                if process.returncode != 0:
                    error_code = f"kaggle_exit_{process.returncode}"
                    raise RuntimeError(error_code)
                # Kaggle CLI may flatten a nested competition path into --path.
                # Only accept the basename derived from the validated manifest.
                flattened = data_root / target.name
                if not target.is_file() and flattened.is_file():
                    os.replace(flattened, target)
                archive = target.with_suffix(".jpg.zip")
                if not archive.is_file():
                    archive = data_root / f"{target.name}.zip"
                if not target.is_file() and archive.is_file():
                    extract_requested(archive, target, relative, partial)
                if target.is_file() and zipfile.is_zipfile(target):
                    extract_requested(target, target, relative, partial)
                if not target.is_file():
                    raise FileNotFoundError("Kaggle CLI did not produce the requested image")
                status = "downloaded"
                break
            except (OSError, RuntimeError, ValueError, subprocess.TimeoutExpired, zipfile.BadZipFile) as error:
                error_code = error_code or type(error).__name__
                partial.unlink(missing_ok=True)
                if attempt < retries:
                    time.sleep(pause * (2 ** attempt))
        results.append({"article_id": row["article_id"], "status": status,
                        "bytes": target.stat().st_size if target.is_file() else 0,
                        "attempts": attempts, "elapsed_ms": round((time.monotonic() - started) * 1000),
                        **({"error_code": error_code} if status == "failed" else {})})
        time.sleep(pause)
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--processed", type=Path, default=ROOT / "data/hm/processed")
    parser.add_argument("--data-root", type=Path, default=ROOT / "data/hm")
    parser.add_argument("--limit", type=int, default=20, help="Explicit upper bound; defaults to a pilot of 20")
    parser.add_argument("--workers", type=int, default=4, help="Concurrent Kaggle requests (1-8)")
    parser.add_argument("--article-id", action="append", default=[], help="Request a mapped article ID; repeat for multiple IDs")
    args = parser.parse_args()
    if args.limit < 1 or args.limit > 100000:
        parser.error("limit must be between 1 and 100000")
    if args.workers < 1 or args.workers > 8:
        parser.error("workers must be between 1 and 8")
    all_rows = read_jsonl(args.processed / "image-manifest.jsonl")
    if args.article_id:
        ids = set(args.article_id)
        rows = [row for row in all_rows if row["article_id"] in ids]
        if len(rows) != len(ids) or len(rows) > args.limit:
            parser.error("Every requested article ID must occur exactly once in the manifest and fit within --limit")
    else:
        rows = sorted(all_rows, key=lambda row: (not row["representative"], row["product_id"],
                                              row["article_id"]))[:args.limit]
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        results = list(pool.map(lambda row: download([row], args.data_root, 1)[0], rows))
    report = {"requested": len(results), "downloaded": sum(r["status"] == "downloaded" for r in results),
              "existing": sum(r["status"] == "existing" for r in results),
              "failed": sum(r["status"] == "failed" for r in results),
              "bytes": sum(r["bytes"] for r in results), "results": results}
    (args.processed / "image-download-report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in report.items() if key != "results"}))
    if report["failed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
