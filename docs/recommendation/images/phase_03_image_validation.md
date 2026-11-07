# Phase 03 — validation

`scripts/hm/validate-images.py` checks presence, JPEG magic, full Pillow decode, dimensions, byte size and SHA-256. It flags identical content across article paths and writes a retry manifest. It cannot prove visual article identity by checksum alone; final mapping requires source path provenance and human spot review.

Current real manifest: 1,874 missing, zero valid, zero corrupt. Synthetic valid/corrupt fixtures pass unit tests. Run after acquisition and inspect `image-validation-report.json` before optimization.
