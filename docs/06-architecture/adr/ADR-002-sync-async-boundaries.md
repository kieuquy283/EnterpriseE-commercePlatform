# ADR-002 — Ranh giới phản hồi và việc nền

- **Ngày:** 2026-11-15. **Trạng thái:** Proposed, chưa được chấp thuận. **Người quyết định:** chủ nghiệp vụ/kiến trúc (chưa phân công).
- **Bối cảnh:** Khách cần biết đơn được nhận hay chưa; lỗi thông báo không được làm hủy đơn. [RULE-ORD-002/RULE-NOT-001](../../01-business/business-rules.md), [QAS-REL-004](../../03-requirements/quality-attribute-scenarios.md), [integration](../integration-design.md).
- **Phương án:** Đợi cả email trước khi trả checkout (dễ hiểu trạng thái nhưng provider chậm/lỗi gây ảnh hưởng đơn); trả kết quả đơn rồi gửi thông báo nền (cần trạng thái job và đối soát); trả trước khi có kết quả đơn bền (có nguy cơ thành công giả).
- **Quyết định đề xuất:** Checkout trả `accepted/rejected/pending` dựa trên kết quả đơn bền hoặc trạng thái chưa rõ có thể tra; việc thông báo xử lý nền sau nhận đơn. Search/report có thể dùng bản đọc trễ sau khi chốt độ tươi; price/stock kiểm lại lúc nhận đơn.
- **Hệ quả:** Cần lưu ý định thông báo bền, dedupe, retry hữu hạn, quan sát lag/lỗi và đối soát event mất; chưa chọn queue/broker/outbox. Không hứa gửi exactly-once.
- **Fitness check:** AT-01/03/05/06, kiểm provider down không đổi đơn; timeout sau nhận tra được kết quả. **Xem lại khi:** chủ nghiệp vụ yêu cầu xác nhận liên lạc đồng bộ hoặc độ trễ không đáp ứng QAS được duyệt.
