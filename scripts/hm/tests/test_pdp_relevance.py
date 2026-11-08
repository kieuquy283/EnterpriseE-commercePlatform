"""PDP relevance evaluation uses independent human labels, not metadata as truth."""

import importlib.util
import math
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
from image_pipeline import write_jsonl

spec = importlib.util.spec_from_file_location("pdp_relevance", HERE / "evaluate-pdp-relevance.py")
evaluation = importlib.util.module_from_spec(spec)
spec.loader.exec_module(evaluation)


class PdpRelevanceTests(unittest.TestCase):
    def setUp(self):
        self.products = {f"prod_{i}": {"product_id": f"prod_{i}", "index_group": "Ladieswear"} for i in range(1, 9)}

    def test_ndcg_rewards_ordered_graded_relevance(self):
        grades = {"prod_2": 2, "prod_3": 1, "prod_4": 0}
        self.assertAlmostEqual(evaluation.ndcg_at_6(["prod_2", "prod_3"], grades), 1.0)
        self.assertLess(evaluation.ndcg_at_6(["prod_3", "prod_2"], grades), 1.0)
        self.assertEqual(evaluation.ndcg_at_6([], grades), 0.0)
        self.assertIsNone(evaluation.ndcg_at_6(["prod_2"], {"prod_2": 0}))

    def test_paired_macro_excludes_unjudgeable_but_counts_coverage(self):
        contexts = ["prod_1", "prod_5"]
        old = {"prod_1": ["prod_3", "prod_2"]}
        new = {"prod_1": ["prod_2", "prod_3"], "prod_5": ["prod_6"]}
        labels = {("prod_1", "prod_2"): 2, ("prod_1", "prod_3"): 1,
                  ("prod_5", "prod_6"): 0}
        result = evaluation.compare(contexts, old, new, labels)
        self.assertEqual(result["judgeable_contexts"], 1)
        self.assertEqual(result["unjudgeable_contexts"], 1)
        self.assertGreater(result["paired_delta_v2_minus_v1"], 0)
        self.assertTrue(all(math.isfinite(value) for value in result["paired_bootstrap_95pct_ci"]))
        self.assertEqual(result["ctr_conversion"], "NOT_MEASURABLE_FROM_HM_PURCHASES")

    def test_blind_packet_union_and_frozen_sample(self):
        old = {"prod_1": ["prod_2", "prod_3"]}
        new = {"prod_1": ["prod_3", "prod_4"]}
        first = evaluation.build_packet(self.products, old, new, ["prod_1"], 17)
        second = evaluation.build_packet(self.products, old, new, ["prod_1"], 17)
        self.assertEqual(first, second)
        self.assertEqual({row["candidate_product_id"] for row in first}, {"prod_2", "prod_3", "prod_4"})
        self.assertTrue(all("strategy" not in row and "rank" not in row for row in first))
        self.assertEqual(evaluation.select_contexts(self.products, old, 4, 17),
                         evaluation.select_contexts(self.products, old, 4, 17))

    def test_labels_must_be_complete_and_human_graded(self):
        packet = evaluation.build_packet(self.products, {"prod_1": ["prod_2"]}, {}, ["prod_1"], 1)
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "labels.jsonl"
            write_jsonl(path, [{"context_product_id": "prod_1", "candidate_product_id": "prod_2", "reviewer_id": "r1", "grade": None}])
            with self.assertRaises(ValueError):
                evaluation.labels_from(path, packet)
            write_jsonl(path, [{"context_product_id": "prod_1", "candidate_product_id": "prod_2", "reviewer_id": "r1", "grade": 2}])
            labels, reviewer_id = evaluation.labels_from(path, packet)
            self.assertEqual(labels[("prod_1", "prod_2")], 2)
            self.assertEqual(reviewer_id, "r1")
            write_jsonl(path, [])
            with self.assertRaises(ValueError):
                evaluation.labels_from(path, packet)

    def test_candidate_integrity(self):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "rows.jsonl"
            row = {"placement": "product_detail", "context_key": "product:prod_1",
                   "target_product_id": "prod_2", "rank": 1}
            write_jsonl(path, [row])
            self.assertEqual(evaluation.candidate_lists(path, self.products), {"prod_1": ["prod_2"]})
            write_jsonl(path, [row, row])
            with self.assertRaises(ValueError):
                evaluation.candidate_lists(path, self.products)


if __name__ == "__main__":
    unittest.main()
