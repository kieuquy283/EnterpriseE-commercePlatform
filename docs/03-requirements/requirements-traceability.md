---
document_id: RTM-01
version: 0.1.0
status: Draft — review pending
owner: Phân tích yêu cầu (chưa phân công)
reviewer: QA, chủ nghiệp vụ (chưa xác định)
last_updated: 2026-11-15
---

# Ma trận truy vết yêu cầu

Nguồn nghĩa: [BRD](../01-business/BRD.md) → [actor/goal](../02-users/actors-and-user-goals.md) → [journey](../02-users/user-journeys.md) → [SRS](SRS.md) / [use case và AT](use-case-specifications.md). Cột NFR, tải, dữ liệu, thành phần được cập nhật sau từng giai đoạn; đây là liên kết **đề xuất**, không chứng minh phần mềm đã đạt. Mỗi mã UC của Topics trang 4 được ghi đúng một hàng; nhiều FR/AT có thể phục vụ một UC. Các phép kiểm thử chưa chạy.

| UC Topics | BP/OBJ → BREQ; CAP/PROC/RULE | Actor/goal/journey | FR | AT | NFR/QAS | WL → ENT/INV → CMP |
|---|---|---|---|---|---|---|
| P1-UC01 Đăng ký/đăng nhập | BP-02/OBJ-01 → BREQ-IDENT-001, BREQ-SEC-001; CAP-IDENT-001; RULE-ACCESS-001 | ACT-CUST/GOAL-CUST-006/J-01..03 | FR-AUTH-01..04 | AT-04,09,10 | NFR-SEC-01..04; QAS-SEC-001 | WL-ADMIN-001 → ENT-CUSTOMER/INV-ACCESS-001 → CMP-ACCESS-001 |
| P1-UC02 Danh mục/tìm kiếm | BP-01,06/OBJ-03,05 → BREQ-CAT-001, BREQ-DISC-001, BREQ-PRICE-001; CAP-CAT-001/CAP-DISC-001; PROC-SALES-001; RULE-CAT-001 | ACT-CUST/GOAL-CUST-001/002/J-01 | FR-CAT-01..05 | AT-11 | NFR-PERF-01; QAS-PERF-CAT-001 | WL-CAT-001/WL-SEARCH-001/WL-MEDIA-001 → ENT-PRODUCT/VARIANT/PRICE → CMP-CAT-001 |
| P1-UC03 Giỏ hàng | BP-02/OBJ-02 → BREQ-CART-001; CAP-CART-001; PROC-CART-001; RULE-PRICE-001 | ACT-CUST/GOAL-CUST-003/J-02 | FR-CART-01..04 | AT-12 | NFR-REL-02; QAS-REL-001 | WL-CART-001 → ENT-CART/CART-LINE → CMP-CART-001 |
| P1-UC04 Checkout/tạo đơn | BP-02/OBJ-01,02 → BREQ-SALES-001, BREQ-ORD-001; CAP-ORD-001; PROC-ORD-001; RULE-ORD-001/002 | ACT-CUST/GOAL-CUST-004/J-02 | FR-CHK-01..04, FR-PAY-03, FR-INV-01/02 | AT-01,03,13,15 | NFR-PERF-02, NFR-REL-01; QAS-PERF-CHK-001/QAS-REL-001/002 | WL-CHK-001/WL-INV-001 → ENT-CHECKOUT-ATTEMPT/ORDER, INV-ORD-001/INV-INV-001 → CMP-CHK-001/CMP-ORD-001 |
| P1-UC05 Thanh toán | BP-02/OBJ-01 → BREQ-PAY-001; CAP-PAY-001; PROC-PAY-001; RULE-PAY-001/002 | ACT-CUST/GOAL-CUST-004/J-02 | FR-CHK-02, FR-PAY-01..05 | AT-02,03,14 | NFR-REL-01; QAS-REL-003 | WL-PAY-001 → ENT-PAYMENT-ATTEMPT/INV-PAY-001 → CMP-PAY-001 |
| P1-UC06 Tồn kho | BP-01/OBJ-03 → BREQ-INV-001; CAP-INV-001; PROC-INV-001; RULE-INV-001 | ACT-STAFF/GOAL-STAFF-003, ACT-ADMIN/GOAL-ADMIN-002/J-04; ACT-CUST/J-02 | FR-INV-01..03 | AT-01,15,16 | NFR-REL-01; QAS-REL-002 | WL-INV-001 → ENT-STOCK-POSITION/INV-INV-001 → CMP-INV-001 |
| P1-UC07 Theo dõi đơn | BP-02/OBJ-01 → BREQ-TRACK-001, BREQ-SEC-001; CAP-FUL-001; PROC-FUL-001; RULE-ACCESS-001/FUL-001 | ACT-CUST/GOAL-CUST-005, ACT-STAFF/GOAL-STAFF-002/J-03 | FR-ORD-01..03, FR-AUTH-03 | AT-04,17 | NFR-SEC-01; QAS-SEC-001 | WL-ADMIN-001 → ENT-ORDER/FULFILLMENT → CMP-FUL-001 |
| P1-UC08 Thông báo | BP-03/OBJ-04 → BREQ-NOT-001; CAP-NOT-001; PROC-NOT-001; RULE-NOT-001 | ACT-SYSTEM phục vụ ACT-CUST/GOAL-CUST-005/J-02/03 | FR-NOT-01..03 | AT-05 | NFR-REL-02; QAS-REL-004 | WL-NOT-001 → ENT-NOTIFICATION-INTENT → CMP-NOT-001 |
| P1-UC09 Quản trị/báo cáo | BP-04/OBJ-07 → BREQ-OPS-001; CAP-ADMIN-001/CAP-REPORT-001; PROC-REPORT-001; RULE-REPORT-001 | ACT-ADMIN/GOAL-ADMIN-001/003, ACT-STAFF/GOAL-STAFF-001/J-04 | FR-ADM-01/02, FR-AUTH-04 | AT-10,18 | NFR-OBS-01..03; QAS-OBS-001 | WL-ADMIN-001/WL-IMPORT-001 → ENT-PRODUCT/ORDER → CMP-ADMIN-001/CMP-REPORT-001 |

Các `BP-05/OBJ-08/BREQ-REL-001` liên kết yêu cầu vận hành `FR-OPS-01..04`, `NFR-OPS-*`, `NFR-REL-03`, QAS-DR-001 và AT-08/19/20, không được gán ép vào journey Customer. `BP-06/BREQ-CAP-001` nối `NFR-PERF-01/02`, `WL-CAT-001/WL-CHK-001`, AT-07. `FR-INT-01..03` là năng lực cache/media/tìm kiếm qua AT-06/07/11/18; `FR-REC-01/02` tùy chọn và chưa có AT vì chưa được chọn. Chúng được giữ mã lịch sử và phân loại trong SRS.

## Crosswalk UC lịch sử

| UC trong SRS cũ | Liên kết mới | Lý do |
|---|---|---|
| UC-01 | P1-UC01 | Cùng đăng ký/đăng nhập |
| UC-02 | P1-UC02/03 | Chọn hàng cũ gồm thêm giỏ |
| UC-03 | P1-UC04/05/06 | Mua hàng cũ gồm thanh toán và giữ tồn |
| UC-04 | P1-UC05, nhánh lỗi P1-UC04 | Thanh toán thất bại là biến thể |
| UC-05 | P1-UC04/05, AT-03 | Gửi lặp là biến thể độ tin cậy |
| UC-06 | P1-UC08 | Thông báo |
| UC-07 | P1-UC06/07/09 | Staff xử lý đơn và tồn |
| UC-08 | Yêu cầu vận hành P3/P4, AT-08 | Triển khai/khôi phục không phải một trong 9 UC sản phẩm |

**Kiểm tra độ phủ:** 9/9 UC học phần có actor, goal/journey, FR và AT đề xuất; chưa có kết quả thử hoặc phê duyệt. Quyền, khách vãng lai, tồn khi hủy, giá đổi và báo cáo còn OPEN tại [sổ nguồn](../00-project/source-and-assumption-register.md). Cổng R8 chỉ hoàn thành ở mức bản nháp; QA và chủ nghiệp vụ phải rà nội dung trước khi khóa baseline.
