"""Contract tests for offline Hybrid ranking without model downloads."""

import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))

from hybrid_core import aggregate_articles, normalize, rrf_rank, weighted_rank
from image_pipeline import sha256, write_jsonl

spec = importlib.util.spec_from_file_location("build_hybrid_candidates", HERE / "build-hybrid-candidates.py")
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class HybridCoreTests(unittest.TestCase):
    def test_vector_validation_and_article_aggregation(self):
        rows = [
            {"article_id": "0000000002", "product_id": "prod_A", "vector": [0, 1]},
            {"article_id": "0000000001", "product_id": "prod_A", "vector": [1, 0]},
            {"article_id": "0000000003", "product_id": "prod_B", "vector": [0, 1]},
        ]
        self.assertEqual(aggregate_articles(rows)["prod_A"], (1, 0))
        self.assertAlmostEqual(aggregate_articles(rows, "mean")["prod_A"][0], 2 ** -.5)
        with self.assertRaises(ValueError):
            normalize([float("nan"), 1])
        with self.assertRaises(ValueError):
            aggregate_articles(rows + [rows[0]])
        with self.assertRaises(ValueError):
            aggregate_articles([{**rows[0], "article_id": 2}])

    def test_weighted_and_rrf_no_self_deterministic_missing_image(self):
        metadata = {"prod_B": .8, "prod_C": .8, "prod_D": .6}
        vectors = {"prod_A": (1, 0), "prod_B": (1, 0)}
        targets = ["prod_D", "prod_C", "prod_B", "prod_A"]
        weighted = weighted_rank("prod_A", targets, metadata, vectors, {"prod_C": 2}, minimum_metadata=.7)
        self.assertEqual([item for item, _ in weighted], ["prod_C", "prod_B"])
        self.assertEqual(weighted, weighted_rank("prod_A", reversed(targets), metadata, vectors, {"prod_C": 2}, minimum_metadata=.7))
        self.assertTrue(all(0 <= score <= 1 for _, score in weighted))
        self.assertEqual(dict(weighted)["prod_C"], metadata["prod_C"])
        self.assertEqual([item for item, _ in rrf_rank("prod_A", targets, metadata, vectors, {}, minimum_metadata=.7)], ["prod_B", "prod_C"])
        without_images = weighted_rank("prod_A", targets, metadata, {}, {}, minimum_metadata=.7)
        self.assertEqual([item for item, _ in without_images], ["prod_B", "prod_C"])

    def test_invalid_weights_and_score(self):
        with self.assertRaises(ValueError):
            weighted_rank("prod_A", ["prod_B"], {"prod_B": .8}, {}, {}, weights=(0, 0, 0))
        with self.assertRaises(ValueError):
            rrf_rank("prod_A", ["prod_B"], {"prod_B": .8}, {}, {}, k=0)


class ArtifactTests(unittest.TestCase):
    def fixture(self, root):
        processed = root / "processed"
        processed.mkdir()
        catalog = [
            {"product_key": "A", "product_code": "1", "title": "A", "description": "shirt blue", "product_type": "Shirt", "product_group": "Garments", "section": "Women", "department": "Women", "garment_group": "Top", "index_group": "Ladies", "variants": [{"article_id": "0000000001", "color": "Blue"}]},
            {"product_key": "B", "product_code": "2", "title": "B", "description": "shirt red", "product_type": "Shirt", "product_group": "Garments", "section": "Women", "department": "Women", "garment_group": "Top", "index_group": "Ladies", "variants": [{"article_id": "0000000002", "color": "Red"}]},
        ]
        write_jsonl(processed / "catalog.jsonl", catalog)
        write_jsonl(processed / "medusa-mapping.jsonl", [{"article_id": f"000000000{i}", "product_id": f"prod_{name}", "variant_id": f"variant_{name}", "product_code": str(i)} for i, name in ((1, "A"), (2, "B"))])
        write_jsonl(processed / "image-validation.jsonl", [{"article_id": f"000000000{i}", "product_id": f"prod_{name}", "variant_id": f"variant_{name}", "status": "valid", "sha256": "a" * 64} for i, name in ((1, "A"), (2, "B"))])
        write_jsonl(processed / "candidates-home.jsonl", [{"version": "old", "placement": "home", "context_key": "home", "target_product_id": "prod_A", "score": 2, "rank": 1, "strategy": "hm_purchase_popularity"}])
        vectors = root / "vectors.jsonl"
        write_jsonl(vectors, [{"article_id": f"000000000{i}", "product_id": f"prod_{name}", "image_sha256": "a" * 64, "vector": [1, 0]} for i, name in ((1, "A"), (2, "B"))])
        (root / "manifest.json").write_text(json.dumps({"embeddings_sha256": sha256(vectors), "article_count": 2, "embedding_dim": 2,
            "image_validation_sha256": sha256(processed / "image-validation.jsonl"),
            "model_sha256": "b" * 64, "model_license_source": "fixture", "private_only": True}))
        return processed, vectors

    def test_build_and_reproducibility(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            processed, vectors = self.fixture(root)
            first = builder.build(processed, vectors, root / "out1", "hyb_test")
            second = builder.build(processed, vectors, root / "out2", "hyb_test")
            self.assertEqual(first["candidate_files_sha256"], second["candidate_files_sha256"])
            self.assertEqual(first["product_vectors"], 2)
            rows = list(builder.read_jsonl(root / "out1/candidates-product-detail.jsonl"))
            self.assertEqual(len(rows), 2)
            self.assertEqual(rows[0]["target_product_id"], "prod_B")
            self.assertEqual(rows[0]["strategy"], "hm_hybrid_similarity")
            self.assertEqual(json.loads((root / "out1/manifest.json").read_text())["human_review"], "NOT_RUN")
            rrf = builder.build(processed, vectors, root / "rrf", "hyb_rrf", method="rrf")
            self.assertEqual(rrf["candidate_count"], 2)
            self.assertEqual(rrf["method"], "rrf")
            with self.assertRaises(ValueError):
                builder.build(processed, vectors, root / "out1", "hyb_test")

    def test_stale_embedding_rejected(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            processed, vectors = self.fixture(root)
            write_jsonl(vectors, [{"article_id": "0000000001", "product_id": "prod_B", "image_sha256": "a" * 64, "vector": [1, 0]}])
            manifest = json.loads((root / "manifest.json").read_text())
            manifest["embeddings_sha256"] = sha256(vectors)
            manifest["article_count"] = 1
            (root / "manifest.json").write_text(json.dumps(manifest))
            with self.assertRaises(ValueError):
                builder.build(processed, vectors, root / "out", "hyb_test")

    def test_missing_image_uses_metadata_strategy(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            processed, vectors = self.fixture(root)
            write_jsonl(vectors, [{"article_id": "0000000001", "product_id": "prod_A", "image_sha256": "a" * 64, "vector": [1, 0]}])
            manifest = json.loads((root / "manifest.json").read_text())
            manifest["embeddings_sha256"] = sha256(vectors)
            manifest["article_count"] = 1
            (root / "manifest.json").write_text(json.dumps(manifest))
            builder.build(processed, vectors, root / "out", "hyb_test")
            rows = list(builder.read_jsonl(root / "out/candidates-product-detail.jsonl"))
            self.assertEqual({row["strategy"] for row in rows}, {"hm_metadata_similarity"})


if __name__ == "__main__":
    unittest.main()
