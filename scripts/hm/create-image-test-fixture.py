"""Create an obviously synthetic image for a single mapped Product in a test DB."""

import hashlib
import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
TEST = ROOT / "data/hm/test-serving"


def main():
    mapping_path = TEST / "processed/medusa-mapping.jsonl"
    with mapping_path.open(encoding="utf-8") as source:
        mapping = json.loads(source.readline())
    article_id = str(mapping["article_id"])
    output = TEST / "image-fixtures"
    output.mkdir(parents=True, exist_ok=True)
    derivatives = {}
    for kind, dimensions in (("thumbnail", (400, 500)), ("detail", (1000, 1250))):
        relative = Path(kind) / article_id[:3] / f"{article_id}.jpg"
        target = TEST / "images-optimized" / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        image = Image.new("RGB", dimensions, "#f6d3d0")
        draw = ImageDraw.Draw(image)
        draw.text((20, 20), "SYNTHETIC TEST IMAGE", fill="#222222")
        image.save(target, "JPEG", quality=82)
        derivatives[kind] = {"path": relative.as_posix(),
                             "sha256": hashlib.sha256(target.read_bytes()).hexdigest(),
                             "bytes": target.stat().st_size,
                             "width": dimensions[0], "height": dimensions[1]}
    row = {"article_id": article_id, "product_id": mapping["product_id"],
           "variant_id": mapping["variant_id"], "representative": True,
           "status": "valid", "derivatives": derivatives}
    (output / "image-optimized.jsonl").write_text(json.dumps(row) + "\n", encoding="utf-8")
    print(json.dumps({"fixture_products": 1, "fixture_articles": 1, "fixture_derivatives": 2}))


if __name__ == "__main__":
    main()
