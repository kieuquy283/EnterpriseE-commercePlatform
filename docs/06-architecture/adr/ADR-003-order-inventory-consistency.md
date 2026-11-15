# ADR-003 — Ranh giới nhất quán đơn và tồn

- **Ngày:** 2026-11-15. **Trạng thái:** Proposed, chưa được chấp thuận. **Người quyết định:** chủ nghiệp vụ/dữ liệu/kiến trúc (chưa phân công).
- **Bối cảnh:** Hai khách có thể cùng mua SKU cuối; gửi lại một ý định không tạo đơn thừa. [INV-ORD-001/INV-INV-001](../../05-data/domain-model.md), [RULE-INV-001](../../01-business/business-rules.md), [WL-CHK-001](../../04-workload/workload-analysis.md).
- **Phương án:** (1) Kiểm stock từ bản đọc trễ rồi nhận đơn: đơn giản nhưng bán vượt. (2) Cho Inventory quyết định cam kết tại thời điểm nhận, Ordering lưu kết quả có định danh intent và có đường đối soát: bảo vệ bất biến nhưng cần định nghĩa failure/compensation. (3) Nhận đơn trước rồi bù trừ nếu thiếu: có nguy cơ xác nhận đơn không thể đáp ứng, cần chính sách rõ.
- **Quyết định đề xuất:** Inventory là chủ quyết định khả năng bán, Ordering là chủ kết quả đơn; một ý định có tối đa một đơn được nhận. Không xác nhận trước khi các quyết định thiết yếu bền vững; nếu timeout/chưa rõ, tra intent và đối soát. Thứ tự giữ/trả hàng, hủy và payment ngoài còn OPEN-STOCK-001/OPEN-RETRY-001.
- **Hệ quả:** Cần kiểm stock=1/2 khách, rollback/compensation có chứng cứ, không giả atomic xuyên provider. Chọn transaction/lock/outbox vật lý sau Database Selection.
- **Fitness check:** AT-03/15 và so sánh đơn–stock–payment sau lỗi. **Xem lại khi:** nhiều kho, giữ hàng trước thanh toán, payment thật hoặc chính sách hủy được chốt.
