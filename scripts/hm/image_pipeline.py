"""Deterministic, local-only preparation of H&M product image assets."""

import hashlib
import io
import json
from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image, ImageOps, UnidentifiedImageError


def read_jsonl(path):
    with Path(path).open(encoding="utf-8") as source:
        for number, line in enumerate(source, 1):
            if line.strip():
                try:
                    yield json.loads(line)
                except json.JSONDecodeError as error:
                    raise ValueError(f"{path}:{number}: invalid JSON") from error


def write_jsonl(path, rows):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as target:
        for row in rows:
            target.write(json.dumps(row, sort_keys=True) + "\n")


def sha256(path):
    digest = hashlib.sha256()
    with Path(path).open("rb") as source:
        for chunk in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def build_manifest(catalog_path, mapping_path):
    mappings = {}
    for row in read_jsonl(mapping_path):
        article_id = str(row["article_id"])
        if article_id in mappings:
            raise ValueError(f"Duplicate mapping for {article_id}")
        if not row.get("product_id") or not row.get("variant_id"):
            raise ValueError(f"Incomplete mapping for {article_id}")
        mappings[article_id] = row

    seen = set()
    products = set()
    manifest = []
    for product in read_jsonl(catalog_path):
        variants = sorted(product["variants"], key=lambda item: str(item["article_id"]))
        if not variants:
            raise ValueError(f"Product {product['product_key']} has no variants")
        product_ids = set()
        for variant in variants:
            article_id = str(variant["article_id"])
            if len(article_id) != 10 or not article_id.isascii() or not article_id.isdigit():
                raise ValueError(f"Invalid article ID {article_id}")
            if article_id in seen:
                raise ValueError(f"Duplicate catalog article {article_id}")
            seen.add(article_id)
            mapping = mappings.get(article_id)
            if not mapping or mapping.get("product_code") != product["product_code"]:
                raise ValueError(f"Missing or mismatched mapping for {article_id}")
            product_ids.add(mapping["product_id"])
            manifest.append({
                "article_id": article_id,
                "product_id": mapping["product_id"],
                "variant_id": mapping["variant_id"],
                "product_key": product["product_key"],
                "source_path": f"images/{article_id[:3]}/{article_id}.jpg",
                "representative": article_id == str(variants[0]["article_id"]),
            })
        if len(product_ids) != 1 or next(iter(product_ids)) in products:
            raise ValueError(f"Product mapping is inconsistent for {product['product_key']}")
        products.update(product_ids)
    if set(mappings) != seen:
        raise ValueError(f"Mapping contains {len(set(mappings) - seen)} orphan articles")
    return sorted(manifest, key=lambda item: (item["product_id"], item["article_id"]))


def validate_images(manifest, image_root):
    image_root = Path(image_root)
    results = []
    hashes = defaultdict(list)
    for item in manifest:
        path = image_root / item["source_path"]
        result = {**item, "status": "missing"}
        if path.is_file():
            try:
                with path.open("rb") as source:
                    if source.read(3) != b"\xff\xd8\xff":
                        raise ValueError("not a JPEG")
                with Image.open(path) as image:
                    image.load()
                    if image.format != "JPEG":
                        raise ValueError("not a JPEG")
                    result.update(status="valid", width=image.width, height=image.height,
                                  bytes=path.stat().st_size, sha256=sha256(path))
                    hashes[result["sha256"]].append(item["article_id"])
            except (OSError, ValueError, UnidentifiedImageError):
                result["status"] = "corrupt"
        results.append(result)
    for result in results:
        if result["status"] == "valid" and len(hashes[result["sha256"]]) > 1:
            result["duplicate_content_articles"] = hashes[result["sha256"]]
    return results


def optimize_images(validated, image_root, output_root, sizes=None, quality=82):
    sizes = sizes or {"thumbnail": (400, 500), "detail": (1000, 1250)}
    image_root, output_root = Path(image_root), Path(output_root)
    results = []
    for item in validated:
        if item["status"] != "valid":
            continue
        source = image_root / item["source_path"]
        if sha256(source) != item["sha256"]:
            raise ValueError(f"Source changed after validation: {item['article_id']}")
        with Image.open(source) as opened:
            image = ImageOps.exif_transpose(opened).convert("RGB")
            derivatives = {}
            for name, size in sizes.items():
                relative = Path(name) / item["article_id"][:3] / f"{item['article_id']}.jpg"
                destination = output_root / relative
                destination.parent.mkdir(parents=True, exist_ok=True)
                resized = image.copy()
                resized.thumbnail(size, Image.Resampling.LANCZOS)
                buffer = io.BytesIO()
                resized.save(buffer, "JPEG", quality=quality, optimize=True)
                expected_bytes = buffer.getvalue()
                if not destination.is_file() or destination.read_bytes() != expected_bytes:
                    destination.write_bytes(expected_bytes)
                with Image.open(destination) as check:
                    check.load()
                    if check.size != resized.size:
                        raise ValueError(f"Stale derivative: {destination}")
                derivatives[name] = {"path": relative.as_posix(), "sha256": sha256(destination),
                                     "bytes": destination.stat().st_size,
                                     "width": resized.width, "height": resized.height}
            results.append({**item, "derivatives": derivatives})
    return results


def coverage(rows):
    counts = Counter(row["status"] for row in rows)
    product_states = defaultdict(list)
    for row in rows:
        product_states[row["product_id"]].append(row)
    return {"articles": len(rows), "products": len(product_states), "statuses": dict(counts),
            "products_with_valid_representative": sum(any(row["representative"] and row["status"] == "valid"
                                                          for row in group) for group in product_states.values()),
            "products_with_any_valid_image": sum(any(row["status"] == "valid" for row in group)
                                                 for group in product_states.values())}
