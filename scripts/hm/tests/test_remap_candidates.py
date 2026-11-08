import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("remap", Path(__file__).parents[1] / "remap-candidates.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class RemapTests(unittest.TestCase):
    def test_preserves_group_identity_and_rejects_changed_group(self):
        with tempfile.TemporaryDirectory() as directory:
            source, target = Path(directory) / "source", Path(directory) / "target"
            source.mkdir()
            target.mkdir()
            old = [{"article_id": "0000000001", "product_id": "prod_oldA"}, {"article_id": "0000000002", "product_id": "prod_oldA"}, {"article_id": "0000000003", "product_id": "prod_oldB"}]
            new = [{**row, "product_id": "prod_newA" if row["product_id"] == "prod_oldA" else "prod_newB"} for row in old]
            def write_mapping(folder, rows):
                (folder / "medusa-mapping.jsonl").write_text("\n".join(map(json.dumps, rows)))
            write_mapping(source, old)
            write_mapping(target, new)
            (source / "mvp-candidate-manifest.json").write_text(json.dumps({"version": "old"}))
            for name, context in (("candidates-home.jsonl", "home"), ("candidates-product-detail.jsonl", "product:prod_oldA")):
                (source / name).write_text(json.dumps({"version": "old", "context_key": context, "target_product_id": "prod_oldB", "score": .8, "rank": 1}) + "\n")
            module.remap(source, target, "new")
            row = json.loads((target / "candidates-product-detail.jsonl").read_text())
            self.assertEqual(row["context_key"], "product:prod_newA")
            self.assertEqual(row["target_product_id"], "prod_newB")
            new[1]["product_id"] = "prod_split"
            write_mapping(target, new)
            with self.assertRaises(ValueError):
                module.remap(source, target, "invalid")
