"""Map offline H&M popularity to the actual Medusa product IDs.

Run only after prepare.py --with-interactions and the Medusa catalog import.
Outputs an offline candidate artifact, not a live recommendation endpoint.
"""

import json
from collections import Counter
from pathlib import Path


PROCESSED = Path(__file__).resolve().parents[2] / "data" / "hm" / "processed"


def main():
    article_to_product = {}
    with (PROCESSED / "medusa-mapping.jsonl").open(encoding="utf-8") as source:
        for line in source:
            row = json.loads(line)
            article_to_product[row["article_id"]] = row["product_id"]

    counts = Counter()
    with (PROCESSED / "popularity.json").open(encoding="utf-8") as source:
        for article_id, count in json.load(source):
            product_id = article_to_product.get(article_id)
            if product_id:
                counts[product_id] += count

    candidates = [
        {"product_id": product_id, "score": count, "strategy": "hm_purchase_popularity", "source": "hm_historical"}
        for product_id, count in sorted(counts.items(), key=lambda pair: (-pair[1], pair[0]))
    ]
    (PROCESSED / "popularity-medusa-products.json").write_text(
        json.dumps(candidates, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Mapped {len(candidates)} Medusa products to offline popularity candidates")


if __name__ == "__main__":
    main()
