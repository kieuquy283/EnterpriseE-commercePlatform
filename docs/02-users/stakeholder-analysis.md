---
document_id: STK-ANALYSIS-01
title: Phân tích các bên liên quan
version: 0.1.0
status: Draft
owner: Trưởng nhóm phân tích nghiệp vụ (chưa phân công)
reviewer: Trưởng nhóm dự án và đại diện vận hành (chưa xác định)
last_updated: 2026-11-15
source_baseline: BRD-01 v0.1.0 Draft; Course Topics trang 4
source_of_truth: true
related_documents:
  - ../00-project/project-charter.md
  - ../00-project/scope-and-assumptions.md
  - ../00-project/source-and-assumption-register.md
  - ../01-business/BRD.md
  - actors-and-user-goals.md
  - user-journeys.md
---

# Phân tích các bên liên quan

**Trạng thái:** Draft — nền tảng Business chưa được rà soát/phê duyệt. Đề bài đã được kiểm tra; các tài liệu Business hiện là bản nháp. Không có phỏng vấn hay kiểm thử người dùng thực tế. Nhu cầu, ảnh hưởng và mức quan tâm dưới đây là **giả thuyết để nhóm kiểm chứng**, không phải kết quả khảo sát. [SRC-C-001, SRC-P-001]

## 1. Mục đích và ranh giới

*Bên liên quan* là nhóm chịu tác động, có lợi ích, trách nhiệm hoặc thẩm quyền với đồ án. *Actor* là vai trò tương tác với kênh bán hàng để đạt mục tiêu. Một người có thể giữ nhiều vai trò; người quyết định chính sách không tự động là quản trị viên phần mềm. SOMEHOW chỉ là nguồn tham chiếu công khai, không phải bên đặt hàng, tài trợ hoặc phê duyệt. Mô hình cửa hàng thời trang B2C tại Việt Nam là giả định ASM-001/002. [SRC-C-001, SRC-E-001]

Ba actor sản phẩm cốt lõi từ đề bài là Customer, Store/Operations Staff và Administrator. Nhà cung cấp thanh toán/vận chuyển (nếu có), nhóm dự án và giảng viên thuộc loại bên liên quan khác. Tài liệu [Actors và mục tiêu](actors-and-user-goals.md) là nguồn chuẩn cho mã ACT/GOAL; [BRD](../01-business/BRD.md) là nguồn chuẩn cho BP/OBJ/BREQ.

## 2. Danh sách các bên liên quan

Nhãn **COURSE-MANDATED** chỉ chứng minh vai trò xuất hiện trong đề bài. Nhu cầu và rủi ro của vai trò vẫn là **PROJECT-PROPOSED**, trừ khi có nguồn khác. “Tác động/ảnh hưởng” là đánh giá sơ bộ của nhóm, chưa được stakeholder xác nhận.

| Mã | Nhóm / loại | Nhu cầu và kết quả mong muốn; rủi ro nếu thiếu | Tác động / ảnh hưởng dự kiến | Nguồn, nhãn |
|---|---|---|---|---|
| STK-001 | Khách mua hàng / actor cốt lõi | Chọn đúng biến thể size/màu, biết giá và số có thể bán, nhận kết quả mua rõ, xem riêng đơn; rủi ro là chọn sai hoặc tưởng đơn đã nhận khi chưa có | Tác động cao / ảnh hưởng chính sách chưa rõ | SRC-C-001 trang 4: COURSE-MANDATED vai trò; BREQ-CAT-001, BREQ-SALES-001: PROJECT-PROPOSED nhu cầu |
| STK-002 | Nhân viên cửa hàng/vận hành / actor cốt lõi | Biết đơn nào cần xử lý, trạng thái thanh toán và hàng có thể cung ứng, cập nhật tiến độ trong quyền; rủi ro là xử lý đơn sai hoặc vượt quyền | Tác động cao / ảnh hưởng thao tác trung bình, chờ rà | SRC-C-001 trang 4: COURSE-MANDATED; BREQ-INV-001, BREQ-TRACK-001: PROJECT-PROPOSED |
| STK-003 | Quản trị viên / actor cốt lõi | Quản lý danh mục, hàng, quyền vận hành và báo cáo cơ bản; rủi ro là công bố hàng/giá sai hoặc cấp quyền quá rộng | Tác động cao / ảnh hưởng thao tác cao, chờ rà | SRC-C-001 trang 4: COURSE-MANDATED; BREQ-OPS-001, BREQ-SEC-001: PROJECT-PROPOSED |
| STK-004 | Chủ doanh nghiệp/chủ chính sách giả định / người quyết định nghiệp vụ | Chốt phạm vi, chính sách giá, nhận đơn, đổi/trả, chỉ số giá trị và quyền xem dữ liệu; không tự đồng nhất với STK-003 | Tác động cao / thẩm quyền chỉ là vai trò đề xuất | ASM-001, OPEN-REVIEW-001: PROJECT-ASSUMED; chưa có sponsor thật |
| STK-005 | Hỗ trợ khách hàng / bên vận hành tùy chọn | Giải đáp kết quả đơn và yêu cầu hỗ trợ nếu phạm vi được duyệt; chưa mặc định có quyền xem toàn bộ đơn | Tác động trung bình nếu có / ảnh hưởng chưa rõ | OPEN-POLICY-001, OPEN-USR-005: PROJECT-PROPOSED, tùy chọn |
| STK-006 | Đối tác giao/thu tiền bên ngoài / bên tích hợp có điều kiện | Nhận thông tin cần thiết và trả trạng thái nếu dự án tích hợp; MVP có thể chỉ mô phỏng, không giả có hợp đồng | Tác động phụ thuộc lựa chọn / ảnh hưởng chưa rõ | SRC-C-001 trang 4; ASM-004: PROJECT-ASSUMED |
| STK-007 | Trưởng nhóm dự án và BA / bên bàn giao | Giữ phạm vi, nguồn, quyết định, truy vết và lịch rà soát; không tự phê duyệt chính sách thay chủ nghiệp vụ | Tác động cao / ảnh hưởng tiến độ cao | SRC-P-001 §4: LEGACY-DOCUMENTED |
| STK-008 | Nhóm phát triển, QA và vận hành dự án / bên bàn giao | Có yêu cầu rõ, tình huống lỗi kiểm chứng được, bằng chứng triển khai/khôi phục; BP-04/05 chuyển sang NFR/DevOps | Tác động cao / ảnh hưởng thiết kế cao | SRC-P-001 §4, SRC-C-002 trang 24–25: LEGACY-DOCUMENTED / COURSE-MANDATED |
| STK-009 | Giảng viên/hội đồng / bên đánh giá học thuật | Xem đủ chín use case, phạm vi MVP, truy vết, số đo và bằng chứng; không thay vai trò chủ doanh nghiệp | Tác động cao tới nghiệm thu / ảnh hưởng học thuật cao | SRC-C-001/002 trang 4,24–26: COURSE-MANDATED bối cảnh |

### STK-002 — hồ sơ vai trò cần rà

Nhân viên giả định tiếp nhận công việc xử lý đơn online, cần biết đơn nào chờ thao tác, tình trạng hàng và tiến độ giao. Nguy cơ nghiệp vụ là trạng thái mơ hồ hoặc hành động trên đơn ngoài phạm vi. Kết quả mong muốn là hoàn tất công việc được giao và phát hiện ngoại lệ để báo đúng người. Liên quan OBJ-01/03, BREQ-INV-001, BREQ-TRACK-001, PROC-FUL-001. **Chưa** xác định quyền hủy đơn, chỉnh số lượng, đổi trạng thái thanh toán hoặc xem thông tin riêng của khách; xem OPEN-USR-003. [SRC-C-001, SRC-P-001]

## 3. Nhu cầu theo mục tiêu kinh doanh

| BP / OBJ | Bên liên quan chịu tác động | Nhu cầu cấp người dùng và liên kết Business |
|---|---|---|
| BP-01 / OBJ-01,03 | STK-001, STK-002, STK-003 | Khách thấy đúng biến thể/giá; nhân viên kiểm tra nguồn hàng; quản trị viên kiểm soát công bố. BREQ-CAT-001, BREQ-PRICE-001, BREQ-INV-001; CAP-CAT-001, CAP-INV-001 |
| BP-02 / OBJ-01,02 | STK-001, STK-002 | Khách biết chắc một ý định mua được nhận hay không; nhân viên không xử lý đơn trùng. BREQ-SALES-001, BREQ-ORD-001, BREQ-PAY-001; RULE-ORD-001 |
| BP-03 / OBJ-04 | STK-001, STK-002 | Khách có cách biết đơn đã nhận dù thông báo chậm; vận hành biết việc cần liên lạc lại. BREQ-NOT-001; PROC-NOT-001 |
| BP-04,05 / OBJ-07,08 | STK-004, STK-007, STK-008, STK-009 | Phát hiện và phục hồi gián đoạn, chứng minh kết quả; đây là mối quan tâm vận hành dự án, không ép thành hành trình khách. BREQ-REL-001 |
| BP-06 / OBJ-05,06 | STK-001, STK-004, STK-009 | Hành trình xem/mua còn dùng được khi nhu cầu tăng; mục tiêu định lượng xác định sau. BREQ-CAP-001 |

## 4. Quyền quyết định và mức tham gia

| Quyết định | Vai trò nên đề xuất / rà | Thẩm quyền đã được xác nhận? |
|---|---|---|
| Phạm vi và ưu tiên chín use case | Trưởng nhóm dự án, BA, giảng viên đối chiếu đề bài | Chưa có tên người hoặc biên bản |
| Giá, khuyến mại, nhận đơn, đổi/trả | STK-004 cùng đại diện vận hành | Chưa; OPEN-REVIEW-001 |
| Quyền nhân viên, quyền xem dữ liệu khách | STK-004, vận hành và người rà bảo mật | Chưa; OPEN-USR-003/004 |
| Hành trình và từ ngữ khách thấy | BA/product, đại diện khách nếu có nghiên cứu | Chưa có nghiên cứu người dùng |
| Kiểm chứng học phần | STK-009 | Vai trò học thuật, chưa có kết quả rà |

Ma trận mức quan tâm/ảnh hưởng chỉ là **PROJECT-ASSUMED** để lập kế hoạch trao đổi: STK-001..004 và STK-009 cần ưu tiên rà; STK-007/008 phối hợp thường xuyên; STK-005/006 chỉ mời khi phạm vi liên quan được chốt. Không xem đây là kết quả phỏng vấn.

## 5. Kế hoạch xác minh và xung đột

| Cần hỏi ai | Câu hỏi cần xác minh | Bằng chứng mong muốn |
|---|---|---|
| Chủ chính sách giả định / BA | Guest checkout, đổi/trả, khuyến mại và thời điểm cam kết giá? | Quyết định có ngày và người phụ trách; OPEN-GUEST-001, OPEN-POLICY-001, OPEN-PRICE-001 |
| Đại diện vận hành | Ai được xử lý/hủy đơn, chỉnh tồn kho và xem thông tin giao hàng? | Bảng quyền được rà; OPEN-USR-003/004 |
| Đại diện khách nếu tổ chức được | Khách có hiểu size/màu, kết quả timeout, COD và trạng thái đơn không? | Ghi chép phỏng vấn hoặc thử nghiệm có phạm vi; hiện **chưa có** |
| QA/giảng viên | Chín use case và thông báo có được bao phủ đúng mức MVP không? | Biên bản đối chiếu đề bài |

Xung đột cần xử lý: khách muốn mua nhanh nhưng vận hành phải kiểm lại giá/hàng (BP-01/02); nhân viên cần thông tin giao hàng để làm việc nhưng quyền riêng tư giới hạn phạm vi (BREQ-SEC-001); khách cần biết kết quả chắc chắn nhưng phản hồi có thể gián đoạn (OPEN-RETRY-001). Không suy diễn đây là hành vi thực tế của SOMEHOW.

## 6. Nguồn và tình trạng rà soát

Nguồn đã đọc: Topics trang 4–5,24–25; Presentation 1 slide 26–28; Presentation 2 slide 6–8; [tuyên bố dự án](../00-project/project-charter.md), [phạm vi](../00-project/scope-and-assumptions.md), [sổ nguồn](../00-project/source-and-assumption-register.md), [BRD](../01-business/BRD.md), và tài liệu lịch sử `docs/01_Project_Definition.md` §2–4, `docs/02_Project_Scope_and_Assumptions.md` §2–6. Các file lịch sử là đầu vào local, không phải bằng chứng đã duyệt.

**Biên bản rà soát:** chưa có người rà, ngày rà hoặc kết quả phê duyệt. Các mã OPEN-USR và người phụ trách dự kiến được quản lý trong [sổ nguồn](../00-project/source-and-assumption-register.md). Khi có góp ý thật, ghi người, ngày, thay đổi yêu cầu, kết quả và đường dẫn bằng chứng. **Cổng U1: đạt mức bản nháp; chưa có phê duyệt.**

| Ngày | Phiên bản | Thay đổi |
|---|---|---|
| 2026-11-15 | 0.1.0 | Lập danh sách stakeholder, phân quyền quyết định dự kiến và kế hoạch xác minh. |
