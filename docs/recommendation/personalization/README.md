# Personalized Recommendation Engine — tài liệu triển khai

> **Trạng thái:** Kế hoạch chính thức; P0 đã có code thử nghiệm, chưa kích hoạt trên DB commerce. **Ngày lập:** 2026-11-07.
> **Phạm vi:** Enterprise E-commerce Platform, Medusa v2 + Next.js + PostgreSQL + Redis.
> **Tài liệu:** [Master plan](plan.md) · [Technical spec](spec.md) · [Evaluation protocol](evaluation_protocol.md).

## Đọc theo thứ tự

1. [plan.md](plan.md): mục tiêu, chiến lược MVP/ML, kiến trúc, dependencies và release gates.
2. [spec.md](spec.md): identity/consent, event schema, profile, scoring, API, security, NFR.
3. [evaluation_protocol.md](evaluation_protocol.md): thực nghiệm H&M, Medusa và online metrics — ba thứ **không được trộn lẫn**.
4. Phase 00 → 04 → 06 → 07 → 08 cho MVP dựa trên hành vi; Phase 05 là nhánh CF nghiên cứu độc lập, có thể thực hiện song song sau Phase 00–02.

## Phases

| Phase | Tài liệu | Mục đích một câu |
|---|---|---|
| 00 | [Baseline & Feasibility](phase_00_baseline_feasibility.md) | Kiểm tra source, dữ liệu, rights và khả năng thực hiện. |
| 01 | [Identity, Consent & Privacy](phase_01_identity_consent_privacy.md) | Biết đúng khách nào được cá nhân hóa, và cho phép từ chối/xóa dữ liệu. |
| 02 | [Interaction Events](phase_02_interaction_events.md) | Thu thập view/click và đơn hàng thật theo schema rõ ràng, có chống lặp. |
| 03 | [Customer & Session Profiles](phase_03_customer_session_profiles.md) | Tạo hồ sơ sở thích tối thiểu từ sự kiện hợp lệ. |
| 04 | [Behavioral MVP Ranker](phase_04_behavioral_mvp_ranker.md) | Xếp hạng sản phẩm theo lịch sử khách mà không cần ML phức tạp. |
| 05 | [Collaborative Filtering Research](phase_05_collaborative_filtering_research.md) | Thử Item-KNN/ALS/BPR trên H&M offline, không gắn H&M customers sang Medusa. |
| 06 | [API & Storefront](phase_06_serving_api_storefront.md) | Hiển thị “Dành cho bạn” an toàn, không lộ khách khác. |
| 07 | [Evaluation & Quality Gates](phase_07_evaluation_quality_gates.md) | Kiểm chứng chất lượng offline, online và quy trình chọn model. |
| 08 | [Reliability, Security & Release](phase_08_reliability_release.md) | Kiểm thử hệ thống, chịu tải, xóa dữ liệu và quyết định private/public. |

**Tài liệu Markdown mới:** luôn nằm trong `docs/recommendation/personalization/` (có thể tạo `reports/` và `evidence/` bên dưới). Mã nguồn/script/tests có thể ở thư mục chuẩn của repo. Không ghi đè `docs/recommendation/plan.md`, các tài liệu `pdp/` hoặc `hybrid/`.

**Báo cáo khi triển khai:** `reports/phase_00_report.md` … `reports/phase_08_report.md`, `reports/system_test_report.md`, `reports/final_implementation_report.md`. Báo cáo chứa lệnh/test/exit code và kết quả thực tế, không giả PASS.

## Tình trạng hiện tại

Đây là kế hoạch chính thức hợp nhất từ ZIP và kiểm tra repository. Xem [số liệu dữ liệu](data-readiness.md), [quyết định đóng băng V2](v2-freeze.md), [runbook thử nghiệm riêng tư](runbook.md) và các báo cáo trong `reports/` để biết phần nào đã chạy thật. Kế hoạch không tự chứng minh tính năng đã sẵn sàng phát hành.
