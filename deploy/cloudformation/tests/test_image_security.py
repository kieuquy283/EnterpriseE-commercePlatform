"""Exercise the actual release workflow's fail-closed ECR gate without AWS."""
import copy
import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

import yaml

ROOT = Path(__file__).resolve().parents[3]
STEPS = yaml.safe_load((ROOT / '.github/workflows/aws-images.yml').read_text())['jobs']['publish']['steps']
GATE = next(s for s in STEPS if s.get('name') == 'Enforce ECR image findings before approving release references')
CODE = GATE['run'].split("python3 - <<'PY'\n", 1)[1].rsplit('\nPY', 1)[0]
CLEAN = {'imageScanStatus': {'status': 'COMPLETE'}, 'imageScanFindings': {'findingSeverityCounts': {}}}


class ImageSecurityTests(unittest.TestCase):
    def execute_gate(self, report, digests=True, wait_error=False):
        environment = {
            role + suffix: value
            for role in ['BACKEND', 'STOREFRONT']
            for suffix, value in [('_REPO', 'registry.example/repository'), ('_DIGEST', 'sha256:fixture' if digests else '')]
        }
        with tempfile.TemporaryDirectory() as directory:
            previous = os.getcwd()
            try:
                os.chdir(directory)
                with patch.dict(os.environ, environment), patch('subprocess.run') as wait, patch('subprocess.check_output', return_value=json.dumps(report).encode()):
                    if wait_error:
                        wait.side_effect = subprocess.CalledProcessError(1, ['aws', 'ecr', 'wait'])
                    exec(compile(CODE, '<release-image-gate>', 'exec'), {})
                return len(list(Path('ci-evidence').glob('*-ecr-scan.json')))
            finally:
                os.chdir(previous)

    def test_clean_images_both_produce_evidence(self):
        self.assertEqual(self.execute_gate(CLEAN), 2)

    def test_high_and_critical_block_even_without_fix_metadata(self):
        for severity in ['HIGH', 'CRITICAL']:
            report = copy.deepcopy(CLEAN)
            report['imageScanFindings']['findingSeverityCounts'][severity] = 1
            with self.subTest(severity=severity), self.assertRaises(SystemExit):
                self.execute_gate(report)

    def test_missing_counts_fail_closed(self):
        with self.assertRaises(SystemExit):
            self.execute_gate({'imageScanStatus': {'status': 'COMPLETE'}, 'imageScanFindings': {}})

    def test_invalid_counts_fail_closed(self):
        for counts in [{'HIGH': '0'}, {'HIGH': -1}, {'HIGH': False}, []]:
            report = copy.deepcopy(CLEAN)
            report['imageScanFindings']['findingSeverityCounts'] = counts
            with self.subTest(counts=counts), self.assertRaises(SystemExit):
                self.execute_gate(report)

    def test_incomplete_or_unsupported_scan_fails_closed(self):
        for status in ['IN_PROGRESS', 'UNSUPPORTED_IMAGE', 'FAILED']:
            report = copy.deepcopy(CLEAN)
            report['imageScanStatus']['status'] = status
            with self.subTest(status=status), self.assertRaises(SystemExit):
                self.execute_gate(report)

    def test_wait_failure_blocks(self):
        with self.assertRaises(subprocess.CalledProcessError):
            self.execute_gate(CLEAN, wait_error=True)

    def test_no_scans_cannot_approve_release(self):
        with self.assertRaises(SystemExit):
            self.execute_gate(CLEAN, digests=False)

    def test_gate_precedes_release_reference_publication(self):
        publication = next(s for s in STEPS if s.get('name') == 'Record immutable release references')
        self.assertLess(STEPS.index(GATE), STEPS.index(publication))


if __name__ == '__main__':
    unittest.main()
