"""Verify a synthetic fixture Product image through Store and Similar Products APIs."""

import json
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TEST = ROOT / "data/hm/test-serving"
BASE = "http://127.0.0.1:9002"


def request_json(path, key):
    request = urllib.request.Request(BASE + path, headers={"x-publishable-api-key": key})
    with urllib.request.urlopen(request, timeout=15) as response:
        if response.status != 200:
            raise ValueError(f"Store API HTTP {response.status}")
        return json.load(response)


def main():
    fixture = json.loads((TEST / "image-fixtures/image-optimized.jsonl").read_text(encoding="utf-8"))
    context = json.loads((ROOT / "data/hm/processed/recommendation-test-context.json").read_text(encoding="utf-8"))
    target_id = fixture["product_id"]
    rows = [json.loads(line) for line in (TEST / "processed/candidates-product-detail.jsonl").read_text(encoding="utf-8").splitlines() if line]
    matches = sorted((row for row in rows if row["target_product_id"] == target_id and row["rank"] <= 6),
                     key=lambda row: row["rank"])
    if not matches:
        raise ValueError("Fixture Product is absent from offline top-6 candidates")
    source_id = matches[0]["context_key"].removeprefix("product:")
    region_id = context["region_id"]
    source_product = request_json(f"/store/products/{source_id}?" + urllib.parse.urlencode({"region_id": region_id}),
                                  context["publishable_key"])["product"]
    product = request_json(f"/store/products/{target_id}?" + urllib.parse.urlencode({"region_id": region_id}),
                           context["publishable_key"])["product"]
    if not product.get("thumbnail") or len(product.get("images") or []) != 1:
        raise ValueError("Fixture Product media missing from Store API")
    with urllib.request.urlopen(product["thumbnail"], timeout=15) as response:
        if response.status != 200 or response.headers.get_content_type() != "image/jpeg" or response.read(3) != b"\xff\xd8\xff":
            raise ValueError("Fixture thumbnail URL does not serve JPEG")
    params = urllib.parse.urlencode({"placement": "product_detail", "product_id": source_id,
                                     "region_id": region_id, "limit": 6})
    recommendations = request_json("/store/recommendations?" + params, context["publishable_key"])
    targets = [item for item in recommendations.get("products", []) if item["id"] == target_id]
    if len(targets) != 1 or targets[0].get("thumbnail") != product["thumbnail"]:
        raise ValueError("Similar Products did not return the fixture Product's own thumbnail")
    print(json.dumps({"store_product_media": True, "similar_product_thumbnail_matches": True,
                      "recommendation_count": len(recommendations["products"]),
                      "context_handle": source_product["handle"], "target_handle": product["handle"]}))


if __name__ == "__main__":
    main()
