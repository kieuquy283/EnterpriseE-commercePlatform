import importlib.util
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

from PIL import Image

import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from image_pipeline import build_manifest, coverage, optimize_images, validate_images, write_jsonl


def load_download_module():
    path = Path(__file__).resolve().parents[1] / "download-images.py"
    spec = importlib.util.spec_from_file_location("hm_image_download", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class ImagePipelineTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.catalog = self.root / "catalog.jsonl"
        self.mapping = self.root / "mapping.jsonl"
        self.article_ids = ["0123456789", "0123456790"]
        write_jsonl(self.catalog, [{"product_key": "123-test", "product_code": "123",
                                     "variants": [{"article_id": article_id} for article_id in self.article_ids]}])
        write_jsonl(self.mapping, [{"article_id": article_id, "product_id": "prod_1",
                                     "variant_id": f"variant_{index}", "product_code": "123"}
                                    for index, article_id in enumerate(self.article_ids)])

    def tearDown(self):
        self.temp.cleanup()

    def test_manifest_preserves_leading_zero_and_representative(self):
        rows = build_manifest(self.catalog, self.mapping)
        self.assertEqual(len(rows), 2)
        self.assertEqual(rows[0]["source_path"], "images/012/0123456789.jpg")
        self.assertEqual(sum(row["representative"] for row in rows), 1)
        self.assertEqual(rows, build_manifest(self.catalog, self.mapping))

    def test_manifest_rejects_duplicate_or_inconsistent_mapping(self):
        original = list(build_manifest(self.catalog, self.mapping))
        write_jsonl(self.mapping, [{"article_id": original[0]["article_id"],
                                    "product_id": "prod_1", "variant_id": "v", "product_code": "123"}] * 2)
        with self.assertRaisesRegex(ValueError, "Duplicate mapping"):
            build_manifest(self.catalog, self.mapping)

    def test_manifest_rejects_cross_product_article(self):
        write_jsonl(self.mapping, [{"article_id": article_id,
                                    "product_id": f"prod_{index}", "variant_id": f"v_{index}",
                                    "product_code": "123"}
                                   for index, article_id in enumerate(self.article_ids)])
        with self.assertRaisesRegex(ValueError, "inconsistent"):
            build_manifest(self.catalog, self.mapping)

    def test_validate_and_optimize_real_and_corrupt_jpegs(self):
        rows = build_manifest(self.catalog, self.mapping)
        valid = self.root / rows[0]["source_path"]
        valid.parent.mkdir(parents=True)
        Image.new("RGB", (1600, 2000), "red").save(valid, "JPEG")
        bad = self.root / rows[1]["source_path"]
        bad.write_bytes(b"not-a-jpeg")
        checked = validate_images(rows, self.root)
        self.assertEqual([row["status"] for row in checked], ["valid", "corrupt"])
        self.assertEqual(coverage(checked)["products_with_valid_representative"], 1)
        outputs = optimize_images(checked, self.root, self.root / "optimized")
        self.assertEqual(len(outputs), 1)
        self.assertEqual(outputs[0]["derivatives"]["thumbnail"]["width"], 400)
        self.assertEqual(outputs[0]["derivatives"]["detail"]["height"], 1250)
        self.assertEqual(outputs, optimize_images(checked, self.root, self.root / "optimized"))
        self.assertTrue(valid.exists())

    def test_download_resume_does_not_call_kaggle(self):
        rows = build_manifest(self.catalog, self.mapping)
        target = self.root / rows[0]["source_path"]
        target.parent.mkdir(parents=True)
        target.write_bytes(b"already present")
        def never_call(*args, **kwargs):
            raise AssertionError("Kaggle must not be called")
        results = load_download_module().download(rows, self.root, limit=1, pause=0, runner=never_call)
        self.assertEqual(results[0]["status"], "existing")

    def test_download_reports_failure_without_fake_asset(self):
        rows = build_manifest(self.catalog, self.mapping)
        class Failed:
            returncode = 1
        results = load_download_module().download(rows, self.root, limit=1, retries=0, pause=0,
                                                   runner=lambda *args, **kwargs: Failed())
        self.assertEqual(results[0]["status"], "failed")
        self.assertFalse((self.root / rows[0]["source_path"]).exists())

    def test_download_extracts_only_requested_zip_member(self):
        rows = build_manifest(self.catalog, self.mapping)
        target = self.root / rows[0]["source_path"]
        def fake_kaggle(*args, **kwargs):
            target.parent.mkdir(parents=True, exist_ok=True)
            with zipfile.ZipFile(target.with_suffix(".jpg.zip"), "w") as archive:
                archive.writestr(rows[0]["source_path"], b"image bytes")
            class Done:
                returncode = 0
            return Done()
        result = load_download_module().download(rows, self.root, limit=1, retries=0, pause=0,
                                                 runner=fake_kaggle)
        self.assertEqual(result[0]["status"], "downloaded")
        self.assertEqual(target.read_bytes(), b"image bytes")

    def test_download_accepts_flattened_kaggle_file(self):
        rows = build_manifest(self.catalog, self.mapping)
        target = self.root / rows[0]["source_path"]
        def fake_kaggle(*args, **kwargs):
            (self.root / target.name).write_bytes(b"downloaded image")
            class Done:
                returncode = 0
            return Done()
        result = load_download_module().download(rows, self.root, limit=1, retries=0, pause=0,
                                                 runner=fake_kaggle)
        self.assertEqual(result[0]["status"], "downloaded")
        self.assertEqual(target.read_bytes(), b"downloaded image")
        self.assertFalse((self.root / target.name).exists())

    def test_download_normalizes_existing_zip_wrapped_jpg(self):
        rows = build_manifest(self.catalog, self.mapping)
        target = self.root / rows[0]["source_path"]
        target.parent.mkdir(parents=True)
        with zipfile.ZipFile(target, "w") as archive:
            archive.writestr(target.name, b"image bytes")
        def never_call(*args, **kwargs):
            raise AssertionError("Kaggle must not be called")
        result = load_download_module().download(rows, self.root, limit=1, pause=0,
                                                 runner=never_call)
        self.assertEqual(result[0]["status"], "existing")
        self.assertEqual(target.read_bytes(), b"image bytes")

    def test_small_image_is_not_upscaled(self):
        rows = build_manifest(self.catalog, self.mapping)
        target = self.root / rows[0]["source_path"]
        target.parent.mkdir(parents=True)
        Image.new("RGB", (90, 40), "blue").save(target, "JPEG")
        validated = validate_images(rows, self.root)
        outputs = optimize_images(validated, self.root, self.root / "optimized")
        for derivative in outputs[0]["derivatives"].values():
            self.assertEqual((derivative["width"], derivative["height"]), (90, 40))


if __name__ == "__main__":
    unittest.main()
