"""Offline OpenCLIP inference with locally supplied, rights-reviewed weights.

This command never downloads weights. All outputs stay below ignored data/hm/.
"""

import argparse
import hashlib
import json
from os import replace
from pathlib import Path

from PIL import Image

from hybrid_core import normalize
from image_pipeline import read_jsonl, sha256


def build(validated_path, image_root, weights_path, license_record_path, output, batch_size=8):
    if batch_size < 1 or batch_size > 64:
        raise ValueError("batch_size must be between 1 and 64")
    if not weights_path.is_file():
        raise ValueError("A local model checkpoint is required; this command does not download weights")
    rights = json.loads(license_record_path.read_text(encoding="utf-8"))
    if rights.get("approved_private") is not True or not rights.get("model_id") or not rights.get("license_source"):
        raise ValueError("Model private-use license record is incomplete")
    if (output / "manifest.json").exists():
        raise ValueError("Output version is already complete and immutable")
    try:
        import open_clip
        import torch
    except ImportError as error:
        raise RuntimeError("Install reviewed OpenCLIP/PyTorch dependencies in an isolated ML environment") from error

    model_sha = sha256(weights_path)
    model, _, preprocess = open_clip.create_model_and_transforms("ViT-B-32", pretrained=str(weights_path))
    model.eval()
    selected = []
    for row in read_jsonl(validated_path):
        if row.get("status") != "valid":
            continue
        article = row["article_id"]
        if not isinstance(article, str) or len(article) != 10 or not article.isascii() or not article.isdigit():
            raise ValueError("Invalid article ID")
        path = image_root / row["source_path"]
        if sha256(path) != row["sha256"]:
            raise ValueError("Image changed since validation")
        selected.append(row)
    if not selected:
        raise ValueError("No validated images")

    output.mkdir(parents=True, exist_ok=True)
    run = {"model_sha256": model_sha, "model_license_record_sha256": sha256(license_record_path),
           "image_validation_sha256": sha256(validated_path),
           "model_id": rights["model_id"], "batch_size": batch_size,
           "preprocess": "open_clip:create_model_and_transforms:validation",
           "open_clip_version": getattr(open_clip, "__version__", "UNKNOWN"), "torch_version": torch.__version__}
    run_path = output / "run.json"
    if run_path.exists() and json.loads(run_path.read_text(encoding="utf-8")) != run:
        raise ValueError("Resume inputs changed; use a new version directory")
    if not run_path.exists():
        run_path.write_text(json.dumps(run, sort_keys=True) + "\n", encoding="utf-8")
    partial = output / "partial.jsonl"
    final = output / "article-embeddings.jsonl"
    completed = list(read_jsonl(partial)) if partial.exists() else list(read_jsonl(final)) if final.exists() else []
    for index, row in enumerate(completed):
        if index >= len(selected) or row["article_id"] != selected[index]["article_id"] or row["product_id"] != selected[index]["product_id"] or row["image_sha256"] != selected[index]["sha256"]:
            raise ValueError("Resume artifact does not match selected images")
        normalize(row["vector"])
    dimension = len(completed[0]["vector"]) if completed else None
    with torch.inference_mode():
        for start in range(len(completed), len(selected), batch_size):
            rows = selected[start:start + batch_size]
            tensors = []
            for row in rows:
                with Image.open(image_root / row["source_path"]) as image:
                    image.load()
                    tensors.append(preprocess(image.convert("RGB")))
            encoded = model.encode_image(torch.stack(tensors)).float().cpu().tolist()
            if len(encoded) != len(rows):
                raise ValueError("Encoder output count mismatch")
            encoded_rows = []
            for row, values in zip(rows, encoded):
                vector = list(normalize(values))
                if dimension is None:
                    dimension = len(vector)
                elif dimension != len(vector):
                    raise ValueError("Encoder dimension changed")
                encoded_rows.append({"article_id": row["article_id"], "product_id": row["product_id"],
                                     "image_sha256": row["sha256"], "vector": vector})
            with partial.open("a", encoding="utf-8", newline="\n") as target:
                for row in encoded_rows:
                    target.write(json.dumps(row, sort_keys=True) + "\n")
    if partial.exists():
        replace(partial, final)
    manifest = {
        "model_id": rights["model_id"], "model_license_source": rights["license_source"],
        "model_license_record_sha256": sha256(license_record_path),
        "model_sha256": model_sha, "encoder": "open_clip:ViT-B-32", "device": "cpu",
        "open_clip_version": getattr(open_clip, "__version__", "UNKNOWN"), "torch_version": torch.__version__,
        "preprocess": "open_clip:create_model_and_transforms:validation", "batch_size": batch_size,
        "image_validation_sha256": sha256(validated_path), "article_count": len(selected),
        "embedding_dim": dimension, "embeddings_sha256": sha256(final),
        "generator_sha256": hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        "private_only": True,
    }
    (output / "manifest.json").write_text(json.dumps(manifest, sort_keys=True, indent=2) + "\n", encoding="utf-8")
    return manifest


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--validated", type=Path, default=Path("data/hm/processed/image-validation.jsonl"))
    parser.add_argument("--image-root", type=Path, default=Path("data/hm"))
    parser.add_argument("--weights", type=Path, required=True, help="existing local checkpoint; no network download")
    parser.add_argument("--model-license-record", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True, help="new ignored version directory")
    parser.add_argument("--batch-size", type=int, default=8)
    args = parser.parse_args()
    print(json.dumps(build(args.validated, args.image_root, args.weights, args.model_license_record,
                           args.output, args.batch_size), sort_keys=True))
