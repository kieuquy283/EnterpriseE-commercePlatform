# Phase 04 — Implementation & Verification Report

- Date/time + timezone: 2026-11-04, Asia/Saigon.
- Branch/SHA/working tree: recommendation / de9b437f613d9cff300428f5e6e6161ed441ad62 + local changes.
- Environment: Medusa2.21.2, Node22.22.0 Linux, isolated PostgreSQL16.
- Phase verdict: PASS private.
- Scope & inputs: versioned candidates/manifest, verified target catalog.

## Implemented changes

| File | Change | Reason |
| --- | --- | --- |
| apps/backend/src/modules/recommendation/ | Run/candidate/singleton pointer models, service, generated migration/snapshot | Medusa-owned read model |
| apps/backend/src/workflows/recommendation/publish.ts | Schema/count/ID preflight, batches100, staging→ready→pointer | Partial runs remain invisible |
| apps/backend/src/scripts/publish-hm-recommendations.ts | Idempotent publish and env rollback | Operator recovery |
| scripts/hm/remap-candidates.py | Same-article bijection across dev/test IDs | Preserve product relations |
| apps/backend/src/scripts/check-hm-mapping.ts | Exact readback using Product module | Verify mapping after import/re-import |

## Acceptance criteria & evidence

| Criterion | Expected | Actual | Status | Evidence path |
| --- | --- | --- | --- | --- |
| Constraints | Unique version/target/rank | Generated Migration20261103195231 | PASS | Module migrations |
| Migration roundtrip | Disposable runner DB only | Guarded DB-name assertion; down/up; empty recreated module verified | PASS | recommendations.spec.ts |
| Idempotency | Same version/checksum no duplicate | Fixture stays2 rows; real serving version3298 rows | PASS | HTTP/CLI |
| Partial failure | Old active unchanged | Injected failure after staging batch; failed run, unchanged pointer | PASS | HTTP test |
| Activation/rollback | Complete ready run | One pointer-row update; real CLI rollback/restore | PASS | Publisher/HTTP |
| Catalog mapping | Exact variant/product/SKU | 1874 matches/500 products; second import0 created/500 existing | PASS | ../evidence/test-catalog-reconciliation.json |

## Commands actually executed

| Command (sanitized) | Exit code | Result summary | Log/evidence |
| --- | --- | --- | --- |
| Medusa db:generate recommendation in Linux test env | 0 after environment fixes | Migration/snapshot generated | Source |
| Medusa db:migrate on recommendation_test | 0 | Isolated schema migrated | Tool output |
| Medusa exec import-hm-catalog.ts twice | 0,0 | First500 created, second0 created;1874 mapped | Tool output |
| python scripts/hm/remap-candidates.py | 0 | 500 products/1874 articles rebound | Local artifacts |
| Medusa exec publish-hm-recommendations.ts twice | 0,0 | Ready version reused | Tool output |
| Same exec with RECOMMENDATION_ACTIVATE_VERSION | 0 twice | Fixture rollback then real version restore | Tool output |
| Medusa exec check-hm-mapping.ts | 0 | Exact module-service readback | Reconciliation evidence |

## Tests & review

No commerce table edits or direct DB client in application code. Ready runs immutable through publisher; status is staging/ready/failed, active identity separate. Count/schema checks precede activation; batches concurrency1. Workflow execution errors/results are checked explicitly because SDK errors can be returned without Promise rejection.

## Risks, deviations & blockers

Early Windows SWC/cache and original local DB53300 were observed. Stopped task-created CLIs and moved tests to isolated DB(max_connections200); no existing volume reset. Test-utils2.21.2 hostname/SSL assumption handled by reusable local TCP proxy. Failed version needs a new version; no automatic retention cleanup. Lost ACK after activation requires inspecting pointer, not assuming rollback.

## Rollback / handoff

Select a ready version using RECOMMENDATION_ACTIVATE_VERSION; disable flags. Keep products/orders/volumes. [Runbook](../runbook.md).
