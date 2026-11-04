# Phase 01 — Implementation & Verification Report

- Date/time + timezone: 2026-11-04, Asia/Saigon
- Branch / commit SHA / working tree: recommendation / de9b437f613d9cff300428f5e6e6161ed441ad62 + uncommitted changes.
- Environment: Windows, Python 3.10.11, Docker Compose local PostgreSQL 16, DB commerce; no credentials recorded.
- Phase verdict: PASS
- Scope & inputs: local CSV/catalog/mapping; read-only local DB reconciliation.

## Implemented changes

| File | Change | Reason |
| --- | --- | --- |
| scripts/hm/profile-interactions.py | Streaming profile, SHA256, mapping validation, no customer retention | Measure real coverage |
| scripts/hm/tests/test_profile_interactions.py | Boundary, duplicate, coverage/privacy tests | Verify profiling correctness |

## Acceptance criteria & evidence

| Criterion | Expected | Actual | Status | Evidence path |
| --- | --- | --- | --- | --- |
| Source profile | Stream and checksum | 105542 articles; 31788324 transactions; dates 2018-09-20 to 2020-09-22; zero orphan transactions | PASS | data/hm/processed/interaction-coverage.json (gitignored) |
| Mapping | Exact variant/product/SKU readback | 1874 mappings, zero missing variants, zero wrong product relations, zero wrong HM SKU | PASS | data/hm/processed/db-variants.json + reconciliation command |
| Coverage | Products with/without history | 500/500 products have history; 979342 matching transactions; zero zero-history products | PASS | interaction-coverage.json |
| Commerce | Published/channel/VND/inventory | 503 local products published and channel-linked; 1874 distinct HM variants joined to VND price and inventory level | PASS | read-only SQL below |
| Selection | Justified pilot decision | Keep 500; 11 named groups plus Unknown; no need to expand for MVP proof; lexicographic selection remains biased | PASS | coverage summary |
| Privacy | No customer data retained | Only aggregate counts/dates and source checksums emitted | PASS | script + tests |

## Commands actually executed

| Command (sanitized) | Exit code | Result summary | Log/evidence |
| --- | --- | --- | --- |
| python scripts/hm/profile-interactions.py | 0 | Full local CSV scan completed | interaction-coverage.json |
| python -m unittest discover -s scripts/hm/tests -v | 0 | 2 tests passed | Tool output |
| docker compose exec -T postgres psql … SELECT id,product_id,sku FROM product_variant | 0 with mandatory elevation | Exported read-only local rows, kept gitignored | db-variants.json |
| Python comparison of mapping against exported rows | 0 | 1874 exact matches | Tool output |
| Read-only SQL joins variant → price set → VND price and variant → inventory item → inventory level | 0 with mandatory elevation | 1874 distinct HM variants | Tool output |

## Tests & review

2 unit tests PASS; no API/UI implementation yet. Read-only SQL was used as audit tooling, not introduced into backend business code. No imports/migrations performed. Review caught phase document assuming nine-digit article IDs: actual IDs are ten-digit strings. New profiler validates ten digits and preserves leading zeros.

## Risks, deviations & blockers

Private-only rights decision applies. Inventory presence does not assert every variant currently purchasable; serving must follow actual Medusa inventory/backorder/channel/region rules. Existing `interaction-coverage.json` intentionally keeps db_reconciled=false because the offline script alone cannot attest DB state; this report records separate readback, not a fabricated script assertion.

Evaluation protocol: fixed historical cutoffs train <=2020-09-08, validation 2020-09-09..15, test 2020-09-16..22. Selection remains pre-existing lexicographic pilot (not optimized using held-out purchases). No metrics claimed yet. Keep full selected-product universe and explicitly report sampling limitations.

## Rollback / handoff

Remove newly generated profile artifacts if desired; source CSV and commerce tables unchanged. Phase 02/03 may use verified 500-product mapping, with revalidation mandatory before publishing.
