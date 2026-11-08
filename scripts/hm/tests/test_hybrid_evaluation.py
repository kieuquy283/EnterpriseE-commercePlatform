"""Structural evaluation guards: no self/duplicates or invented CTR."""

import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
from image_pipeline import write_jsonl

spec = importlib.util.spec_from_file_location("evaluate_hybrid", HERE / "evaluate-hybrid.py")
evaluator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluator)


class EvaluationTests(unittest.TestCase):
    def test_coverage_and_no_ctr_claim(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            write_jsonl(root / "catalog.jsonl", [{"variants": [{"article_id": "0000000001"}], "product_type": "Shirt"},
                                                {"variants": [{"article_id": "0000000002"}], "product_type": "Skirt"}])
            write_jsonl(root / "mapping.jsonl", [{"article_id": "0000000001", "product_id": "prod_A"},
                                                {"article_id": "0000000002", "product_id": "prod_B"}])
            rows = [{"placement": "product_detail", "context_key": "product:prod_A", "target_product_id": "prod_B", "rank": 1}]
            write_jsonl(root / "candidates.jsonl", rows)
            result = evaluator.evaluate(root / "catalog.jsonl", root / "mapping.jsonl", root / "candidates.jsonl")
            self.assertEqual(result["contexts_with_zero"], 1)
            self.assertEqual(result["catalog_coverage"], .5)
            self.assertEqual(result["human_relevance"], "NOT_RUN")
            self.assertEqual(result["ctr_conversion"], "NOT_MEASURABLE_FROM_HM_PURCHASES")
            write_jsonl(root / "candidates.jsonl", rows + rows)
            with self.assertRaises(ValueError):
                evaluator.evaluate(root / "catalog.jsonl", root / "mapping.jsonl", root / "candidates.jsonl")


if __name__ == "__main__":
    unittest.main()
