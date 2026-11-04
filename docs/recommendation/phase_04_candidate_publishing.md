# Phase 04 — Medusa Candidate Store, Versioned Publishing & Rollback

> **Status:** PASS private — module/migration/publish/retry/rollback đã kiểm thử. [Report](reports/phase_04_report.md).
> **Depends on:** [Phase 02](phase_02_popularity_offline.md) **AND** [Phase 03](phase_03_similarity_offline.md), Phase 01 mapping verified.
> **Reference:** [Spec](spec.md) (`REC-API-04`, storage/publishing contract).

## 1. Mô tả đơn giản

Lưu các danh sách Popular và Similar đã tính trước vào **database thuộc hệ thống Medusa**. Mỗi lần cập nhật tạo **một phiên bản mới**; chỉ chuyển website sang phiên bản mới khi nhập đủ và kiểm tra xong. Nếu cập nhật lỗi, người dùng vẫn dùng bản cũ.

## 2. Inputs

- `candidates-home.jsonl` và `candidates-product-detail.jsonl` chung version, có checksum, selected catalog version, mapping verified.
- Medusa 2.21.2 module/data-model/migration conventions của repo; PostgreSQL dev/test, bản backup trước migration.
- Phase 01/02/03 GO evidence.

## 3. Tasks

- [ ] **04.1 Data models:** custom `recommendation_run` (`version`, status, hashes, timestamps) và `recommendation_candidate` (`run_id`, `placement`, `context_key`, `target_product_id`, `score`, `rank`, `strategy`). Không sửa table core Medusa.
- [ ] **04.2 Constraints/indexes:** unique run version; unique `(run_id,placement,context_key,target_product_id)` và `(run_id,placement,context_key,rank)`; index `(run_id,placement,context_key,rank)`.
- [ ] **04.3 Preflight:** verify every product ID exists in target DB, validate context/product self exclusion, uniqueness, rank, total counts, schema version/source hashes; check DB pool constraints.
- [ ] **04.4 Safe import:** write to `staging` run, small bounded batches, concurrency=1 initially, checkpoint/log progress; repeated run same version/checksum must be idempotent.
- [ ] **04.5 Atomic activation:** implement/test an active pointer or database transaction guarantee that requests see **one complete run ID**. Do not assume merely setting `status=active` for two records is atomic.
- [ ] **04.6 Failure handling:** failed import leaves old run active; activation failure rolls back; rollback explicitly selects previous version; never deletes Medusa Products or DB volumes.
- [ ] **04.7 Cache strategy:** Redis optional cache keyed by active run + context/region/channel/filter version, invalidate on activation; only cached candidate IDs, revalidate Medusa saleability in Phase 05.
- [ ] **04.8 Test:** migration up/down on disposable test DB, rerun same manifest, partial failure mid-import, activation concurrent reads, rollback, duplicate keys, mismatched checksum.

## 4. Planned files

```text
apps/backend/src/modules/recommendation/         # module, models, service, migrations
apps/backend/src/workflows/recommendation/        # only if needed for safe orchestration
apps/backend/src/scripts/publish-hm-recommendations.ts
apps/backend/integration-tests/http/             # or project integration module tests
```

**Docs/evidence:** `docs/recommendation/evidence/phase_04_publish_report.md`, migration/rollback notes **under `docs/recommendation/` only**.

## 5. Acceptance / stop gate

- [ ] Import runs are unique/idempotent; no duplicate rows or conflicting ranks.
- [ ] Partially imported run **never** becomes visible as active.
- [ ] New active run contains expected Home and PDP placements, with verified IDs and manifest hashes.
- [ ] Rollback previous run works, leaves core product/order/inventory unchanged.
- [ ] DB pool remains within observed safe range, no `53300` in controlled import test.
- [ ] Queries fetch bounded ranked IDs by context efficiently; no raw H&M IDs/customer IDs in public DB outputs.

**GO Phase 05:** module + schema + tests + verified staging-to-active + rollback. **NO-GO:** unsafe atomicity, orphan IDs or DB connection exhaustion.

## 6. Risks & handoff

- **Migration risk:** backup and isolated dev/test DB, no `down -v`. **Concurrent publish:** lock/unique constraint, one active pointer. **Missing mappings:** quarantine invalid row, do not silently activate incomplete run.
- **Owner:** Backend with Data lead. **Handoff:** model schema, active run service, importer CLI, fixtures and failure tests for API phase.
