import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("mvp", Path(__file__).parents[1] / "build-mvp-candidates.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class CandidateTests(unittest.TestCase):
    def test_train_only_and_reproducible_artifacts(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            out = root / "processed"
            out.mkdir()
            (root / "articles.csv").write_text("article_id\n0000000001\n0000000002\n0000000003\n", encoding="utf-8")
            (root / "transactions_train.csv").write_text("t_dat,article_id\n2020-09-01,0000000001\n2020-09-01,0000000003\n2020-09-20,0000000002\n2020-09-20,0000000002\n", encoding="utf-8")
            mappings = [{"article_id": "0000000001", "product_id": "a", "variant_id": "v1"}, {"article_id": "0000000002", "product_id": "b", "variant_id": "v2"}, {"article_id": "0000000003", "product_id": "a", "variant_id": "v3"}]
            (out / "medusa-mapping.jsonl").write_text("\n".join(map(json.dumps, mappings)), encoding="utf-8")
            catalog = [{"title": p, "index_group": "Ladies", "product_type": "Dress", "product_group": "Full body", "variants": [{"article_id": article, "color": "Black"}]} for p, article in (("a", "0000000001"), ("b", "0000000002"))]
            catalog[0]["variants"].append({"article_id": "0000000003", "color": "Blue"})
            (out / "catalog.jsonl").write_text("\n".join(map(json.dumps, catalog)), encoding="utf-8")
            module.main(root, "fixture")
            evaluation = json.loads((out / "popularity-evaluation.json").read_text())
            self.assertEqual(evaluation["test"]["recall_at_12"], 0)
            previous = (out / "candidates-home.jsonl").read_bytes()
            home = [json.loads(line) for line in previous.decode().splitlines()]
            self.assertEqual(home[0]["target_product_id"], "a")
            self.assertEqual(home[0]["score"], 2)
            module.main(root, "fixture")
            self.assertEqual(previous, (out / "candidates-home.jsonl").read_bytes())
            similar = [json.loads(line) for line in (out / "candidates-product-detail.jsonl").read_text().splitlines()]
            self.assertTrue(all(row["context_key"] != "product:" + row["target_product_id"] for row in similar))

    def test_ranking_and_cap(self):
        self.assertEqual(module.ranked({"b": 2, "a": 2, "c": 1}, 2), ["a", "b"])

    def test_taxonomy_and_missing(self):
        a = {"index_group": "Ladies", "product_type": "Dress", "product_group": "Full body"}
        self.assertEqual(module.similarity(a, a), 1)
        self.assertEqual(module.similarity(a, {**a, "index_group": "Children"}), 0)
        self.assertEqual(module.similarity({"index_group": "Ladies"}, a), 0)
        self.assertEqual(module.similarity({"index_group": "Ladies", "product_type": "Dress"}, a), 0)

    def test_response_artifact_rank(self):
        rows = module.records(["a", "b"], {"a": 3, "b": 2}, "v", "home", "home", "pop")
        self.assertEqual([row["rank"] for row in rows], [1, 2])
        self.assertEqual(rows[0]["target_product_id"], "a")


if __name__ == "__main__":
    unittest.main()
