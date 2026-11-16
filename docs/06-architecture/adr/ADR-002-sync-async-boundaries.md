# ADR-002 — Ranh giới phản hồi và việc nền

- **Ngày:** 2026-11-15. **Trạng thái:** Proposed, chưa được chấp thuận. **Người quyết định:** chủ nghiệp vụ/kiến trúc (chưa phân công).
- **Bối cảnh:** Khách cần biết đơn được nhận và các mốc trạng thái đủ điều kiện; lỗi thông báo không được đổi trạng thái nguồn. [RULE-ORD-002/RULE-NOT-001/002](../../01-business/business-rules.md), [QAS-REL-004](../../03-requirements/quality-attribute-scenarios.md), [integration](../integration-design.md).
- **Phương án:** Đợi provider gửi xong trước khi trả checkout/cập nhật trạng thái (có thể làm chậm luồng thương mại); ghi trạng thái nguồn rồi tạo việc nền có retry/đối soát; phát thông báo trước khi trạng thái nguồn bền vững (có nguy cơ thông tin sai).
- **Quyết định đề xuất:** Checkout chỉ xác nhận theo kết quả đơn bền hoặc `pending` có thể tra; thông báo xác nhận và cập nhật trạng thái xử lý nền sau sự kiện hợp lệ. Search/report có thể dùng bản đọc trễ sau khi chốt độ tươi; price/stock kiểm lại lúc nhận đơn.
- **Hệ quả:** Cần lưu ý định gửi bền, dedupe theo event/version, retry hữu hạn, quan sát lag/lỗi và đối soát event mất/trễ; chưa chọn queue/broker/outbox hoặc kênh. Không hứa gửi exactly-once.
- **Fitness check:** AT-01/03/05/06; kiểm provider down không đổi đơn/trạng thái, event trùng/cũ không gửi thông báo sai; timeout sau nhận tra được kết quả. **Xem lại khi:** chủ nghiệp vụ yêu cầu liên lạc đồng bộ hoặc độ trễ không đáp ứng QAS được duyệt.
