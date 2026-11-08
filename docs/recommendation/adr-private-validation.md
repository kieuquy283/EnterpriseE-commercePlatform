# ADR — Private validation, Medusa adapter và request coalescing

Ngày: 2026-11-04. Trạng thái: áp dụng cho private MVP; public NO-GO.

## 1. Gate đánh giá Similarity

Người dùng yêu cầu tiếp tục triển khai tự chủ toàn bộ phần còn thiếu. Để có thể kiểm thử hệ thống private, gate kỹ thuật dùng agent metadata spot-check trên 20 contexts khác loại, unit tests, cấu trúc artifacts và Exact Category baseline. **Không chuyển nhãn agent thành human review**. Human relevance study và quyền công khai dữ liệu vẫn chưa đạt; không đưa kết quả này vào tuyên bố chất lượng với người dùng thật.

Thử ngưỡng 0.50 cho thấy một số neighbor yếu/cross-type; ngưỡng private được chọn 0.70. Đây là lựa chọn trên mẫu metadata, không tối ưu theo held-out purchases, không có ảnh và không chứng minh tốt hơn baseline về cảm nhận. Evidence: [agent review](evidence/agent-similarity-review.json), [determinism](evidence/offline-verification-v2.json). Phạm vi thay đổi contract là private technical gate, không tự cấp quyền dataset hoặc public release.

## 2. Read model và activation

Lưu runs/candidates trong Medusa custom module, dùng một row `recommendation_active` để chọn ready run. Không dựng service ML hoặc sửa commerce tables. Run đã ready là immutable; batch import staging không hiển thị, pointer chỉ đổi sau validation/count. Chọn lại ready run để rollback. Trade-off: failed version cần version mới khi sửa/retry; không có automatic garbage collection. Mất ACK sau activation phải kiểm tra pointer, không giả định lệnh lỗi đồng nghĩa rollback.

## 3. Native Store Product pipeline

Loopback HTTP ban đầu có nhiều overhead và không đạt bài tải. Adapter gọi exports middleware/GET của Store Product ở Medusa 2.21.2 trong cùng process, với request context riêng và field projection nhỏ. Vì vậy pricing, channel và inventory vẫn dùng Medusa. Trade-off là phụ thuộc version: upgrade phải chạy lại integration tests, gồm unpublished, out-of-stock, wrong channel và missing price.

## 4. Coalescing thay vì giữ giá/tồn kho đã tính

Các requests ẩn danh trùng key, region, locale và query chỉ chia sẻ **công việc đang chạy**. Promise bị xóa khi hoàn tất hoặc lỗi; không có TTL cho kết quả giá/stock. Authorization/cookie/identity tách riêng. Candidate ranking/version vẫn được đọc riêng ở mỗi request. Arrays được copy trước khi filter/sort để tránh mutation chéo.

Đây là bảo vệ cache stampede trong một replica; dữ liệu commerce và candidates không nằm trong bộ nhớ process. Redis tiếp tục do modules Medusa quản lý. Chưa có custom candidate cache hay distributed per-client rate limiter. API có admission control và deadline; Caddy giới hạn cả phần middleware trước route.
