# Phase 01 — deterministic manifest

`scripts/hm/build-image-manifest.py` joins prepared catalog Variants to `medusa-mapping.jsonl` by string `article_id`. It rejects missing, duplicate, orphan or cross-Product mappings and writes one request per article. Representative is the lowest article ID per Product. Real local prepared input yielded 500 Product groups, 1,874 articles and 500 representatives. This is file reconciliation, not current Medusa DB readback; test DB reconciliation remains pending.

Run: `python scripts/hm/build-image-manifest.py`. Output under gitignored `data/hm/processed/`. Validate the DB identity before any media writes.
