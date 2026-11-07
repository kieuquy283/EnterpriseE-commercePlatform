# Phase 04 — optimization

`scripts/hm/optimize-images.py` leaves originals intact and creates 400×500 maximum thumbnail and 1000×1250 maximum detail JPEGs without upscaling. It applies EXIF orientation, strips metadata in the derivative, checks decode and records hashes/bytes. Rerun compares deterministic bytes and repairs stale derivatives.

Current real result: zero optimized because no originals exist. Synthetic large and damaged image cases pass; live visual quality and storage cost remain unmeasured.
