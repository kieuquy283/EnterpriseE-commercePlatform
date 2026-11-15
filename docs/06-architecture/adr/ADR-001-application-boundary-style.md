# ADR-001 — Ranh giới mô đun ứng dụng

- **Ngày:** 2026-11-15. **Trạng thái:** Proposed, chưa được chấp thuận. **Người quyết định:** chủ dự án/kiến trúc (chưa phân công).
- **Bối cảnh:** Một vertical slice thương mại, nhóm 5–7; đúng đơn/tồn quan trọng, tải thật chưa có. [Năng lực](../../01-business/business-capability-map.md), [workload](../../04-workload/workload-analysis.md), [kiến trúc](../logical-architecture.md).
- **Phương án:** (1) Một khối không ranh giới: ít thiết lập nhưng dễ ghi dữ liệu chéo. (2) Khối mô đun có chủ dữ liệu/hợp đồng: đơn giản triển khai ban đầu, ranh giới có thể kiểm; scale/deploy chung. (3) Nhiều dịch vụ: scale/triển khai riêng nhưng tăng lỗi mạng, giao dịch phân tán, observability và cost.
- **Quyết định đề xuất:** Khối mô đun, phân ranh Identity, Catalog/Pricing, Cart/Checkout, Order, Payment, Inventory, Fulfillment, Notification. **Không chọn** framework hoặc số process.
- **Hệ quả:** Dùng hợp đồng nội bộ và kiểm writer theo chủ; không được coi folder/tables là boundary. Một bản phát hành có thể tác động toàn bộ, cần regression và rollback. Mở rộng tách process chỉ khi đo được tải/vòng đời/thay đổi độc lập.
- **Fitness check:** Mỗi dữ liệu có một chủ; IF có test; checkout vẫn giữ INV-ORD-001/INV-INV-001; đo bottleneck trước khi tách.
- **Xem lại khi:** Nhiều nhóm vận hành độc lập, search/media/notification có tải lệch lớn được đo, hoặc ranh giới nhất quán đòi thiết kế khác. Không thay thế ADR chọn database ở phase 07.
