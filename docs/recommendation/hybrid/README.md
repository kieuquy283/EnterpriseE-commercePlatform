# Hybrid Recommendation v2 — bộ kế hoạch

**Cập nhật 07/11/2026:** Đã triển khai code offline và compatibility API/UI, nhưng **chưa có Hybrid run thật hoặc release**. Xem [báo cáo hệ thống](reports/system_test_report.md) để biết gate nào còn thiếu. Bắt đầu từ [đặc tả có ID nghiệm thu](spec.md), rồi [kế hoạch tổng thể](plan.md). [Báo cáo audit](reports/planning_audit_report.md) ghi source và giới hạn bằng chứng. Mỗi phase là một task có thể giao Codex riêng; chỉ thực hiện phase sau khi exit gate của phụ thuộc đã đạt.

| Phase | Tài liệu | Gate chính |
|---|---|---|
| 00 | [Repository baseline](phase_00_repository_baseline.md) | Git, rights, DB/test isolation |
| 01 | [Simple baseline evaluation](phase_01_simple_baseline_evaluation.md) | Baseline và metric protocol |
| 02 | [Image data readiness](phase_02_image_data_readiness.md) | Mapping/ảnh hợp lệ |
| 03 | [Visual embeddings](phase_03_visual_embeddings.md) | Feature reproducible, resource/license |
| 04 | [Hybrid ranking](phase_04_hybrid_ranking_evaluation.md) | So sánh có human evidence |
| 05 | [Medusa publishing/API](phase_05_medusa_publishing_api.md) | Saleability, version/rollback |
| 06 | [PDP integration](phase_06_pdp_integration.md) | UI 0–6, fallback |
| 07 | [System testing/release](phase_07_system_testing_release.md) | P0 tests/NFR/rights |
| 08 | [Session tracking](phase_08_session_tracking_optional.md) | OPTIONAL, sau v2 |

Các [phase reports](reports/) ghi công việc của lượt triển khai này; `PARTIAL/BLOCKED` không phải PASS. Source pilot hiện có trên `recommendation-pdp`, chưa xác nhận đã merge `main`. Không đưa H&M raw data/ảnh/embeddings vào Git.
