import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("pdp", Path(__file__).parents[1] / "verify-pdp-candidates.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class PdpVerificationTests(unittest.TestCase):
    def test_verified_catalog_replay_and_rejects_stale_or_duplicate_mapping(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            mappings = [{"article_id": f"{i:010}", "product_id": f"prod_{i}", "variant_id": f"variant_{i}"} for i in (1, 2)]
            catalog = [{"title": "Fixture", "index_group": "Ladies", "product_type": "Dress", "product_group": "Full body", "variants": [{"article_id": r["article_id"], "color": "Black"}]} for r in mappings]
            candidate = {"placement": "product_detail", "strategy": "hm_metadata_similarity", "version": "fixture", "context_key": "product:prod_1", "target_product_id": "prod_2", "score": 1, "rank": 1}
            def write(name, rows):
                (root / name).write_text("".join(json.dumps(r) + "\n" for r in rows), encoding="utf-8")
            write("medusa-mapping.jsonl", mappings)
            write("catalog.jsonl", catalog)
            write("candidates-product-detail.jsonl", [candidate])
            a = module.verify(root, root / "a", "fixture")
            b = module.verify(root, root / "b", "fixture")
            self.assertEqual(a["candidate_sha256"], b["candidate_sha256"])
            self.assertEqual(a["generated_rows"], 2)
            write("candidates-product-detail.jsonl", [{**candidate, "target_product_id": "prod_missing"}])
            with self.assertRaisesRegex(ValueError, "Stale"):
                module.verify(root, root / "bad", "fixture")
            write("medusa-mapping.jsonl", mappings + [mappings[0]])
            with self.assertRaisesRegex(ValueError, "Duplicate"):
                module.verify(root, root / "bad", "fixture")
