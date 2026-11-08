import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(HERE))
from image_pipeline import write_jsonl

spec = importlib.util.spec_from_file_location("astra_labels", HERE / "validate-astra-labels.py")
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


class AstraLabelValidationTests(unittest.TestCase):
    def test_complete_and_partial_are_distinct(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            (root / "images").mkdir()
            (root / "images" / "one.jpg").write_bytes(b"fixture")
            packet = root / "packet.jsonl"
            labels = root / "labels.jsonl"
            row = {"context_product_id": "prod_a", "candidate_product_id": "prod_b",
                   "context": {"image_source_path": "images/one.jpg"},
                   "candidate": {"image_source_path": "images/one.jpg"}}
            write_jsonl(packet, [row])
            write_jsonl(labels, [])
            self.assertEqual(validator.validate(packet, labels, root)["status"], "PARTIAL")
            label = {"context_product_id": "prod_a", "candidate_product_id": "prod_b",
                     "reviewer_id": "astra-codex-20261107", "grade": 2, "reason": "same silhouette",
                     "confidence": "high", "inspected_images": True}
            write_jsonl(labels, [label])
            self.assertEqual(validator.validate(packet, labels, root)["status"], "COMPLETE")
            write_jsonl(labels, [{**label, "inspected_images": False}])
            with self.assertRaises(ValueError):
                validator.validate(packet, labels, root)


if __name__ == "__main__":
    unittest.main()
