import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("profile_interactions", Path(__file__).parents[1] / "profile-interactions.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class ProfileTests(unittest.TestCase):
    def test_coverage_and_no_customer_output(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            articles = root / "articles.csv"
            transactions = root / "transactions.csv"
            mapping = root / "mapping.jsonl"
            articles.write_text("article_id,product_group_name\n0000000001,A\n0000000002,B\n", encoding="utf-8")
            transactions.write_text("t_dat,article_id,customer_id\n2020-01-01,0000000001,private\n2020-01-02,0000000009,private\n", encoding="utf-8")
            rows = [{"article_id": "0000000001", "product_id": "p1", "variant_id": "v1"}, {"article_id": "0000000002", "product_id": "p2", "variant_id": "v2"}]
            mapping.write_text("\n".join(map(json.dumps, rows)), encoding="utf-8")
            result = module.profile(articles, transactions, mapping)
            self.assertEqual(result["zero_history_products"], 1)
            self.assertEqual(result["orphan_transaction_rows"], 1)
            self.assertNotIn("private", json.dumps(result))
            mapping.write_text(json.dumps(rows[0]) + "\n" + json.dumps(rows[0]), encoding="utf-8")
            with self.assertRaises(ValueError):
                module.profile(articles, transactions, mapping)

    def test_invalid_id(self):
        with tempfile.TemporaryDirectory() as directory:
            mapping = Path(directory) / "mapping.jsonl"
            mapping.write_text(json.dumps({"article_id": "123", "variant_id": "v", "product_id": "p"}), encoding="utf-8")
            with self.assertRaises(ValueError):
                module.profile("unused", "unused", mapping)


if __name__ == "__main__":
    unittest.main()
