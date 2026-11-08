import csv
import hashlib
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "audit-catalog.py"
SPEC = importlib.util.spec_from_file_location("audit_catalog", MODULE_PATH)
AUDIT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(AUDIT)


class CatalogAuditTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.root = Path(self.directory.name)
        (self.root / "processed").mkdir()
        self.rows = []
        for aid, kind in (("00123", "Shirt"), ("00124", "Dress"), ("00125", "Unused")):
            row = {key: "" for key in AUDIT.ARTICLE_COLUMNS}
            row.update(article_id=aid, product_code="0100", prod_name="Demo",
                       product_type_name=kind, product_group_name="Garment", colour_group_name="Blue",
                       department_name="Demo department", section_name="Demo section")
            self.rows.append(row)
        with (self.root / "articles.csv").open("w", encoding="utf-8", newline="") as output:
            writer = csv.DictWriter(output, fieldnames=sorted(AUDIT.ARTICLE_COLUMNS))
            writer.writeheader()
            writer.writerows(self.rows)
        self.catalog = []
        self.mapping = []
        for index, row in enumerate(self.rows[:2]):
            group = AUDIT.source_group(row)
            key = "0100-" + hashlib.sha1("|".join(group).encode()).hexdigest()[:8]
            self.catalog.append({
                "product_key": key, "source_hash": hashlib.sha256(json.dumps([row], sort_keys=True).encode()).hexdigest(),
                "product_code": "0100", "title": "Demo", "description": "", "product_group": "Garment",
                "product_type": row["product_type_name"], "department": row["department_name"],
                "section": row["section_name"], "index_group": "", "garment_group": "",
                "variants": [{"article_id": row["article_id"], "color": "Blue"}],
            })
            self.mapping.append({"source": "hm", "article_id": row["article_id"], "product_code": "0100",
                                 "product_id": f"prod_{index}", "variant_id": f"variant_{index}"})
        self.write_batch()

    def write_batch(self):
        catalog_path = self.root / "processed" / "catalog.jsonl"
        catalog_path.write_text("".join(json.dumps(row) + "\n" for row in self.catalog), encoding="utf-8")
        (self.root / "processed" / "medusa-mapping.jsonl").write_text("".join(json.dumps(row) + "\n" for row in self.mapping), encoding="utf-8")
        manifest = {"articles_sha256": AUDIT.digest(self.root / "articles.csv"), "catalog_sha256": AUDIT.digest(catalog_path),
                    "article_rows": 3, "product_groups_total": 3, "product_groups_selected": 2, "article_ids_selected": 2,
                    "grouping_rule": "product_code+product_type_name+product_group_name+department_name+section_name",
                    "synthetic_commerce_data": True}
        (self.root / "processed" / "manifest.json").write_text(json.dumps(manifest), encoding="utf-8")

    def codes(self):
        return {finding["code"] for finding in AUDIT.audit(self.root)["findings"]}

    def test_leading_zeros_composite_groups_and_unselected_articles_are_valid(self):
        report = AUDIT.audit(self.root)
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(report["counts"]["source_article_rows"], 3)
        self.assertEqual(report["counts"]["catalog_articles"], 2)

    def test_duplicate_mapping_and_missing_article_are_both_reported(self):
        self.mapping[1] = self.mapping[0].copy()
        self.write_batch()
        self.assertIn("duplicate_mapping_article", self.codes())
        self.assertIn("duplicate_mapping_variant", self.codes())
        self.assertIn("missing_mapping", self.codes())

    def test_numeric_article_id_is_not_coerced_to_a_different_identifier(self):
        self.mapping[0]["article_id"] = 123
        self.write_batch()
        self.assertIn("invalid_mapping_field", self.codes())
        self.assertIn("missing_mapping", self.codes())

    def test_wrong_composite_group_and_modified_source_hash_are_detected(self):
        self.catalog[0]["product_type"] = "Dress"
        self.write_batch()
        codes = self.codes()
        self.assertIn("catalog_article_missing_or_wrong_source_group", codes)
        self.assertIn("product_group_key_mismatch", codes)
        self.assertIn("product_source_hash_mismatch", codes)

    def test_manifest_tampering_is_not_treated_as_a_pass(self):
        path = self.root / "processed" / "manifest.json"
        manifest = json.loads(path.read_text(encoding="utf-8"))
        manifest["catalog_sha256"] = "wrong"
        path.write_text(json.dumps(manifest), encoding="utf-8")
        self.assertIn("manifest_mismatch", self.codes())

    def test_explicit_mapping_can_be_audited_without_changing_original(self):
        original = self.root / "processed" / "medusa-mapping.jsonl"
        original_hash = AUDIT.digest(original)
        alternative = self.root / "processed" / "new-mapping.jsonl"
        rows = [dict(row, product_id="new_" + row["product_id"], variant_id="new_" + row["variant_id"]) for row in self.mapping]
        alternative.write_text("".join(json.dumps(row) + "\n" for row in rows), encoding="utf-8")
        report = AUDIT.audit(self.root, alternative)
        self.assertEqual(report["status"], "PASS")
        self.assertEqual(report["mapping_input"], str(alternative.resolve()))
        self.assertEqual(AUDIT.digest(original), original_hash)

    def test_output_guard_preserves_existing_report_and_partial_attempt(self):
        report = self.root / "offline-audit.json"
        report.write_text("original evidence", encoding="utf-8")
        with self.assertRaises(FileExistsError):
            AUDIT.claim_output(self.root, {"started_at": "new"})
        self.assertEqual(report.read_text(encoding="utf-8"), "original evidence")
        self.assertFalse((self.root / "offline-run.json").exists())
        partial = self.root / "partial"
        partial.mkdir()
        AUDIT.claim_output(partial, {"started_at": "first"})
        with self.assertRaises(FileExistsError):
            AUDIT.claim_output(partial, {"started_at": "second"})
        self.assertEqual(json.loads((partial / "offline-run.json").read_text())["started_at"], "first")

    def test_offline_output_can_share_directory_with_existing_live_evidence(self):
        (self.root / "live-audit.json").write_text("live evidence", encoding="utf-8")
        AUDIT.claim_output(self.root, {"started_at": "offline"})
        self.assertTrue((self.root / "offline-run.json").exists())
        self.assertEqual((self.root / "live-audit.json").read_text(), "live evidence")


if __name__ == "__main__":
    unittest.main()
