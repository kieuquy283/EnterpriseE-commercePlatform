---
document_id: ACT-GOAL-01
title: Vai trò tương tác và mục tiêu người dùng
version: 0.1.0
status: Draft
owner: Người phân tích người dùng (chưa phân công)
reviewer: Trưởng nhóm nghiệp vụ và người rà bảo mật (chưa xác định)
last_updated: 2026-11-15
source_baseline: BRD-01 v0.1.0 Draft; STK-ANALYSIS-01 v0.1.0 Draft
source_of_truth: true
related_documents:
  - stakeholder-analysis.md
  - user-journeys.md
  - ../01-business/BRD.md
  - ../01-business/business-capability-map.md
  - ../01-business/business-processes.md
  - ../01-business/business-rules.md
  - ../00-project/source-and-assumption-register.md
---

# Vai trò tương tác và mục tiêu người dùng

**Trạng thái:** Draft — Business Baseline và hồ sơ stakeholder chưa được người có thẩm quyền rà. Ba actor chính là **COURSE-MANDATED** theo Topics trang 4; mô tả mục tiêu, quyền và trạng thái đăng nhập là **PROJECT-PROPOSED**. Không có persona dựa trên phỏng vấn hay thống kê nhân khẩu. [SRC-C-001, SRC-P-002]

## 1. Cách đọc và phạm vi

Actor là **vai trò tương tác để đạt kết quả**, không phải tài khoản, nhóm quyền kỹ thuật hoặc thành phần phần mềm. Goal là kết quả người dùng muốn đạt; journey trong [tài liệu hành trình](user-journeys.md) cho biết họ đi qua các quyết định và điểm chạm nào. Use case/FR là đặc tả hệ thống ở giai đoạn SRS sau. Một cá nhân có thể giữ nhiều vai trò nhưng phải theo quyền của từng hành động. STK-004 (chủ chính sách giả định) khác ACT-ADMIN (người quản trị tác nghiệp). [SRC-C-001, SRC-C-003]

## 2. Danh mục actor

| Mã / stakeholder | Vai trò, điểm vào và tài nguyên liên quan | Trách nhiệm/ranh giới | Mức ưu tiên và nguồn |
|---|---|---|---|
| ACT-CUST / STK-001 | Khách/khách truy cập kênh bán; quan tâm đề nghị bán công khai, giỏ của mình, đơn và dữ liệu của mình | Tìm/chọn hàng, mua, kiểm tra kết quả và trạng thái; khách chưa đăng nhập vẫn xem hàng, quyền checkout/tra đơn chờ quyết định | Cốt lõi; SRC-C-001 trang 4, BREQ-IDENT-001, BREQ-SEC-001 |
| ACT-STAFF / STK-002 | Nhân viên vận hành được giao việc với đơn, biến thể và thông tin giao cần thiết | Xử lý đơn trong phạm vi giao; không mặc định được đổi giá, hủy đơn, hoàn tiền hoặc đọc mọi thông tin khách | Cốt lõi; SRC-C-001 trang 4, BREQ-INV-001, BREQ-TRACK-001 |
| ACT-ADMIN / STK-003 | Quản trị viên kênh bán với danh mục, tồn kho, trạng thái vận hành và báo cáo | Quản lý dữ liệu/chức năng được giao; không tự động là người duyệt chính sách hoặc có quyền xuất mọi dữ liệu khách | Cốt lõi; SRC-C-001 trang 4, BREQ-OPS-001, BREQ-SEC-001 |
| ACT-SYSTEM / không phải core human user | Bên tham gia tự động sau sự kiện nghiệp vụ | Chuyển thông báo và ghi nhận kết quả theo chính sách; không có goal cá nhân hay tư cách stakeholder người dùng | Hỗ trợ; BREQ-NOT-001, PROC-NOT-001 |
| ACT-SUPPORT / STK-005 | Vai trò hỗ trợ khách nếu được đưa vào phạm vi | Chỉ xử lý yêu cầu được giao; quyền xem đơn/đổi hàng chưa chốt | Tùy chọn; OPEN-POLICY-001, OPEN-USR-005 |

Nhà cung cấp thanh toán/vận chuyển ở STK-006 là **bên ngoài có điều kiện**, chưa là actor chính hay tích hợp thật được xác nhận. Khách vãng lai là trạng thái của ACT-CUST, không tự thêm một nhóm người dùng thứ tư. Không có bằng chứng về tần suất mua, độ tuổi, thu nhập, động lực hay khả năng tiếp cận của người dùng thật.

## 3. Danh mục mục tiêu

Tất cả mục tiêu là **PROJECT-PROPOSED / Draft**. “Giá trị” mô tả lợi ích ở mức người dùng, không cam kết phần mềm đã hoạt động. Một số mục tiêu đi qua nhiều quy trình. Nguồn BREQ/CAP/PROC/RULE là các bản Business Draft có thật.

| Mã / actor | Bối cảnh → kết quả người dùng mong muốn; giá trị | Business liên quan | Hành trình / ưu tiên |
|---|---|---|---|
| GOAL-CUST-001 / ACT-CUST | Có nhu cầu mua → tìm được hàng đang được chào bán phù hợp; đỡ tìm sai | BREQ-DISC-001; CAP-DISC-001; PROC-SALES-001 | J-01 / MUST |
| GOAL-CUST-002 / ACT-CUST | Đang xem mẫu → xác định đúng biến thể size/màu và khả năng mua; tránh đặt sai | BREQ-CAT-001, BREQ-INV-001; CAP-CAT-001, CAP-INV-001; RULE-CAT-001 | J-01, J-02 / MUST |
| GOAL-CUST-003 / ACT-CUST | Đã chọn hàng → chuẩn bị giỏ đúng biến thể/số lượng, hiểu tổng dự kiến; kiểm soát lựa chọn | BREQ-CART-001, BREQ-PRICE-001; CAP-CART-001; PROC-CART-001 | J-02 / MUST |
| GOAL-CUST-004 / ACT-CUST | Sẵn sàng mua → hoàn tất **một** ý định và biết kết quả nhận/từ chối/chưa rõ; tránh đơn ngoài ý muốn | BREQ-SALES-001, BREQ-ORD-001, BREQ-PAY-001; CAP-ORD-001; RULE-ORD-001, RULE-PAY-001 | J-02 / MUST |
| GOAL-CUST-005 / ACT-CUST | Sau đặt hàng → biết mã và trạng thái đơn của mình, kể cả khi thông báo chậm; giảm bất định | BREQ-TRACK-001, BREQ-NOT-001; CAP-FUL-001, CAP-NOT-001; PROC-FUL-001 | J-02, J-03 / MUST |
| GOAL-CUST-006 / ACT-CUST | Khi có hồ sơ/đơn → kiểm soát quyền truy cập và không để người khác xem dữ liệu riêng; tin cậy | BREQ-IDENT-001, BREQ-SEC-001; CAP-IDENT-001; RULE-ACCESS-001 | J-01..J-03 / MUST |
| GOAL-STAFF-001 / ACT-STAFF | Bắt đầu ca xử lý → biết các đơn trong phạm vi được giao và việc tiếp theo; tránh bỏ sót | BREQ-OPS-001, BREQ-TRACK-001; CAP-ORD-001, CAP-FUL-001; PROC-FUL-001 | J-03 / MUST |
| GOAL-STAFF-002 / ACT-STAFF | Đơn đang xử lý → hoàn tất bước được phép và ghi tiến độ đúng; khách có thông tin chính xác | BREQ-TRACK-001; CAP-FUL-001; RULE-FUL-001 | J-03 / MUST |
| GOAL-STAFF-003 / ACT-STAFF | Khi thấy vấn đề hàng → xác định biến thể thiếu/cần kiểm tra và báo đúng người; tránh bán vượt | BREQ-INV-001; CAP-INV-001; PROC-INV-001; RULE-INV-001 | J-04 / MUST, quyền chỉnh còn mở |
| GOAL-ADMIN-001 / ACT-ADMIN | Cần cập nhật chào bán → công bố đúng sản phẩm và biến thể; khách chọn được hàng hợp lệ | BREQ-CAT-001, BREQ-OPS-001; CAP-CAT-001, CAP-ADMIN-001; PROC-CAT-001 | J-04 / MUST |
| GOAL-ADMIN-002 / ACT-ADMIN | Giá hoặc hàng đổi → kiểm soát thay đổi hợp lệ theo quyền; giữ lời hứa với khách | BREQ-PRICE-001, BREQ-INV-001; CAP-PRICE-001, CAP-INV-001; RULE-PRICE-001, RULE-INV-001 | J-04 / MUST, quyền chi tiết còn mở |
| GOAL-ADMIN-003 / ACT-ADMIN | Cần quản trị → giới hạn quyền nhân viên và xem báo cáo cơ bản; biết tình hình bán hàng | BREQ-OPS-001, BREQ-SEC-001; CAP-ADMIN-001, CAP-REPORT-001; RULE-REPORT-001 | J-04 / MUST, chính sách quyền còn mở |

ACT-SYSTEM không có `GOAL-SYSTEM` như một **mục tiêu người dùng**. Để không bỏ sót UC8, bên tham gia này nhận công việc thông báo sau đơn hợp lệ trong J-02/J-03, phục vụ GOAL-CUST-005 và BREQ-NOT-001. Chi tiết hành vi hệ thống thuộc SRS sau.

## 4. Trạng thái và ma trận quyền nghiệp vụ

**Quy ước:** C = có thể theo mục đích nghiệp vụ đề xuất; ĐK = có điều kiện, cần người phụ trách duyệt; K = không được phép; ? = chưa quyết định. Đây là ranh giới **dự thảo**, không khẳng định quyền đã được cấu hình. PERM-001..005 là mã nguyên tắc cấp nghiệp vụ, chưa phải thiết kế kiểm soát truy cập.

| Hành động / loại dữ liệu | Khách chưa đăng nhập | Khách đã đăng nhập, dữ liệu mình | Nhân viên | Quản trị viên | Nguyên tắc / câu hỏi |
|---|:---:|:---:|:---:|:---:|---|
| Xem và tìm hàng công khai | C | C | C | C | PERM-001 |
| Đăng ký/đăng nhập tài khoản khách | C | C | K | K | PERM-002 |
| Sửa giỏ của mình | ĐK | C | K | K | OPEN-USR-001 |
| Đặt hàng | ? | C | K | K | OPEN-USR-001 |
| Xem trạng thái đơn của mình | ? | C | K | K | PERM-003, OPEN-USR-002 |
| Xem đơn riêng của khách khác | K | K | ĐK | ĐK | PERM-003/004; chỉ theo việc được giao |
| Xử lý đơn được giao | K | K | ĐK | ĐK | PERM-004, OPEN-USR-003 |
| Chỉnh tồn kho | K | K | ĐK | ĐK | PERM-004, OPEN-USR-003 |
| Quản lý sản phẩm, giá, khuyến mại | K | K | ĐK | ĐK | PERM-004, OPEN-PROMO-001 |
| Quản lý quyền nhân viên | K | K | K | ĐK | PERM-005, OPEN-USR-004 |
| Xem báo cáo cơ bản | K | K | ĐK | ĐK | OPEN-USR-011 |
| Xem liên hệ/địa chỉ giao của khách | K | Chỉ dữ liệu mình | ĐK, tối thiểu cần cho việc được giao | ĐK, tối thiểu cần cho nhiệm vụ | PERM-003/004 |

**PERM-001:** đề nghị bán công khai được xem/tìm mà không lộ dữ liệu riêng. **PERM-002:** đăng ký/đăng nhập chỉ tạo quyền phù hợp sau xác minh. **PERM-003:** Khách A không thể xem đơn hoặc hồ sơ riêng của khách B; cách xác minh khách vãng lai chờ quyết định. **PERM-004:** Nhân viên và quản trị viên chỉ dùng dữ liệu khách/tồn kho/đơn trong phạm vi công việc được giao, không mặc định toàn quyền. **PERM-005:** Việc phân quyền nhân viên cần chủ chính sách cho phép; quyền xuất dữ liệu riêng chưa được chấp thuận. [BREQ-SEC-001, RULE-ACCESS-001]

Không mặc định Admin đồng nghĩa Chủ doanh nghiệp. Các quyền hủy đơn, hoàn tiền, sửa số lượng sau đặt và xuất dữ liệu khách đều **chưa được cấp** chỉ vì một người là Staff/Admin. Trường hợp cần quyền mà ma trận ghi ĐK hoặc ? phải đưa tới người phụ trách chính sách, không tự chấp thuận.

## 5. Mối quan tâm về khả dụng và khả năng tiếp cận

Đây là **câu hỏi cần kiểm chứng**, không phải kết quả user test: khách có phân biệt được size/màu, hết hàng, thanh toán lỗi và kết quả chưa rõ không; giá/phí/tổng tiền có dễ hiểu không; sửa địa chỉ sai có giữ được giỏ không; thông tin đơn có thể tiếp cận bằng cách phù hợp với người dùng gặp khó khăn đọc/nhìn/thao tác không; nhân viên có nhận ra hành động ngoài quyền và biết nơi xin hỗ trợ không. Tiêu chuẩn và chỉ số đo cụ thể thuộc NFR ở giai đoạn SRS.

## 6. Đối chiếu đầu vào cũ và việc bàn giao

| Nguồn lịch sử | Cách dùng ở Users |
|---|---|
| `docs/02_Project_Scope_and_Assumptions.md` §2, J-01..04 | Giữ nghĩa mã hành trình trong [tài liệu hành trình](user-journeys.md); câu mô tả cũ không phải kết quả khảo sát |
| `docs/03_Software_Requirements_Specification.md` §2–3, §8 | FR-AUTH-01..04, FR-CAT, FR-CART, FR-CHK, FR-PAY, FR-INV, FR-ORD, FR-NOT, FR-ADM chỉ là mã để đối chiếu khi viết SRS mới; không dùng tên công nghệ trong định nghĩa actor |
| [BRD Draft](../01-business/BRD.md) | BP/OBJ/BREQ là nguồn nghĩa nghiệp vụ; chưa được duyệt |

Sang SRS: định nghĩa tiền/hậu điều kiện cho từng mục tiêu, hành vi khi quyền bị từ chối, nhận diện khách vãng lai, trạng thái chưa rõ sau timeout và các phép kiểm chứng riêng tư. Không tạo mã FR mới trong tài liệu này. Các câu hỏi OPEN-USR, tác động và người phụ trách được ghi tại [sổ nguồn](../00-project/source-and-assumption-register.md).

## 7. Ghi nhận rà soát

Chưa có người rà, ngày họp, nhận xét hay chữ ký. **U2 đạt ở mức bản nháp**: đủ ba actor cốt lõi, mỗi actor có mục tiêu, ma trận quyền nêu rõ cô lập dữ liệu khách. Quyền cụ thể của Staff/Admin và guest còn mở, nên chưa thể coi baseline đã được duyệt.

| Ngày | Phiên bản | Thay đổi |
|---|---|---|
| 2026-11-15 | 0.1.0 | Tạo actor, mục tiêu theo kết quả và ma trận quyền dự thảo. |
