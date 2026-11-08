import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "profile-personalization-readiness.py"
SPEC = importlib.util.spec_from_file_location("profile_personalization_readiness", SCRIPT)
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ProfilePersonalizationReadinessTest(unittest.TestCase):
    def test_temporal_split_and_product_history_are_aggregated(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            mapping = root / "mapping.jsonl"
            transactions = root / "transactions.csv"
            mapping.write_text("\n".join(json.dumps(row) for row in [
                {"article_id": "001", "product_id": "prod_a"},
                {"article_id": "002", "product_id": "prod_a"},
                {"article_id": "003", "product_id": "prod_b"},
            ]) + "\n", encoding="utf-8")
            transactions.write_text(
                "t_dat,customer_id,article_id\n"
                "2020-09-01,private_a,001\n"
                "2020-09-02,private_a,002\n"
                "2020-09-03,private_a,003\n"
                "2020-09-10,private_a,001\n"
                "2020-09-20,private_a,003\n"
                "2020-09-20,private_b,999\n",
                encoding="utf-8",
            )
            result = MODULE.profile(transactions, mapping)
            self.assertEqual(result["mapped_rows"], 5)
            self.assertEqual(result["outside_selected_catalog_rows"], 1)
            self.assertEqual(result["events_by_temporal_split"], {"train": 3, "validation": 1, "test": 1})
            self.assertEqual(result["train_buyers_with_two_or_more_products"], 1)
            self.assertEqual(result["all_temporal_split_buyers"], 1)
            self.assertNotIn("private_a", json.dumps(result))

    def test_duplicate_article_mapping_is_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            mapping = root / "mapping.jsonl"
            transactions = root / "transactions.csv"
            mapping.write_text(
                '{"article_id":"001","product_id":"prod_a"}\n'
                '{"article_id":"001","product_id":"prod_b"}\n', encoding="utf-8"
            )
            transactions.write_text("t_dat,customer_id,article_id\n", encoding="utf-8")
            with self.assertRaisesRegex(ValueError, "Duplicate article mapping"):
                MODULE.profile(transactions, mapping)


if __name__ == "__main__":
    unittest.main()
