---
document_id: REGISTER-01
title: Sổ nguồn, giả định và câu hỏi mở
version: 0.1.0
status: Draft
owner: Người phụ trách nghiên cứu (chưa phân công)
reviewer: Trưởng nhóm phân tích nghiệp vụ (chưa phân công)
last_updated: 2026-11-15
source_of_truth: true
related_documents:
  - project-charter.md
  - scope-and-assumptions.md
  - ../01-business/BRD.md
---

# Sổ nguồn, giả định và câu hỏi mở

Quy ước nhãn: **COURSE-MANDATED** là yêu cầu của học phần; **PUBLIC-OBSERVED** là nội dung trang công khai tại ngày truy cập; **PROJECT-ASSUMED** và **PROJECT-PROPOSED** là giả định/đề xuất chờ rà soát; **HISTORICAL-IMPLEMENTATION** mô tả tài liệu hoặc mã nguồn cũ, không phải lựa chọn thiết kế mới. Không mục nào có trạng thái Approved. Các nguồn được kiểm tra ngày **2026-11-15**, trừ khi ghi khác.

## Danh mục nguồn

| Mã / loại | Tên và đường dẫn / phần | Nguồn chứng minh điều gì; dùng ở đâu | Độ tin cậy / giới hạn |
|---|---|---|---|
| SRC-C-001 / Học phần | Local `docs/Cloud Application Development - Project Topics.pdf`, trang 4–5 | Chín use case; tải đọc nhiều, checkout giao dịch, đỉnh tải, object storage cho ảnh, thông báo bất đồng bộ, xử lý lặp thanh toán; dùng trong BRD và phạm vi | Cao; không chứng minh code đã làm được |
| SRC-C-002 / Học phần | Cùng PDF, trang 24–26 | Sản phẩm bàn giao P1–P5, MVP hướng tới vận hành và câu hỏi bảo vệ; dùng trong charter và BRD | Cao; không phải SLA của doanh nghiệp thật |
| SRC-C-003 / Học phần | Local `docs/Presentation 1 - From Business Problem to Cloud Architecture.pdf`, slide 21–28, 52–53 | Trình tự nghiệp vụ → kiến trúc và phương pháp lập tài liệu | Cao; số liệu ở slide chỉ minh họa |
| SRC-C-004 / Học phần | Local `docs/Presentation 2 - Application, Data & Integration Architecture.pdf`, slide 7–14, 66–69 | Phân biệt năng lực với thành phần ứng dụng; phương pháp thiết kế giai đoạn sau | Cao; không bắt buộc công nghệ cụ thể |
| SRC-P-001 / Dự án | Bản cũ `docs/01_Project_Definition.md`, §2–4 | BP-01..06, OBJ-01..08 và giả thuyết về các bên liên quan; dùng trong BRD | Cao đối với ý định cũ của dự án; không xác minh vấn đề tại SOMEHOW |
| SRC-P-002 / Dự án | Bản cũ `docs/02_Project_Scope_and_Assumptions.md`, §3–5, 9–10 | M-01..13, O-01..06, A-01..10; dùng trong phạm vi | Cao với nội dung lịch sử; tình trạng triển khai có thể đã đổi |
| SRC-P-003 / Dự án | Bản cũ `docs/03_Software_Requirements_Specification.md`, §3–4, 7–8 | Mã FR/NFR/BR/UC và hành vi đề xuất; dùng trong quy tắc | Cao với văn bản cũ; câu chứa tên công nghệ không thành quyết định nghiệp vụ |
| SRC-P-004 / Dự án | Kế hoạch cũ `docs/Enterprise_Ecommerce_Revised_Plan_Week_04-13.md` | Lịch giao việc và audit 02/11/2026; dùng trong charter | Cao về kế hoạch lúc viết; không chứng minh tiến độ hôm nay |
| SRC-P-005 / Dự án | Bản kiến trúc cũ `docs/architecture/cloud-system-architecture.md` | Chỉ mô tả bối cảnh triển khai lịch sử | Trung bình; cần kiểm lại hiện trạng |
| SRC-E-001 / Website | [Trang chủ SOMEHOW](https://somehow.vn/), danh mục/điều hướng, truy cập 2026-11-15 | Có danh mục thời trang, tìm kiếm và giỏ hàng công khai; tham chiếu hành trình mua | Cao với nội dung trang; không biết vận hành/traffic nội bộ |
| SRC-E-002 / Website | [Điều kiện giao dịch chung](https://somehow.vn/pages/dieu-kien-giao-dich-chung), §1 và §4, truy cập 2026-11-15 | Công bố luồng chọn hàng → thông tin giao/thu tiền → xác nhận; trang này ghi thời hạn đổi/trả 7 ngày | Cao với văn bản trang; không phải chính sách đồ án |
| SRC-E-003 / Website | [Chính sách đổi hàng](https://somehow.vn/pages/chinh-sach-doi-tra-hang), §1, truy cập 2026-11-15 | Trang này ghi thời hạn đổi hàng 10 ngày | Cao với văn bản trang; khác SRC-E-002 |

Hai trang công khai nêu thời hạn/phạm vi chính sách khác nhau. **OPEN-POLICY-001** chặn việc đưa một số ngày cụ thể vào quy tắc của đồ án. Website tham chiếu không chứng minh quy trình nội bộ, kiến trúc hệ thống, doanh thu, tồn kho hay traffic. [SRC-E-002, SRC-E-003]

## Giả định

| Mã | Nội dung / tác động | Độ tin cậy | Người phụ trách / cách xác minh |
|---|---|---|---|
| ASM-001 | Doanh nghiệp thời trang B2C giả định tại Việt Nam, giá VND; xác định ngôn ngữ sản phẩm và thị trường | Tạm thời | Trưởng nhóm nghiệp vụ; rà với nhóm |
| ASM-002 | Một kênh online và một địa điểm tồn kho mẫu; giới hạn mô hình giao hàng | Tạm thời | Đại diện vận hành; đối chiếu đề bài |
| ASM-003 | Không có số liệu nội bộ doanh nghiệp tham chiếu; mọi mục tiêu tải định lượng đều giả định | Giới hạn đã xác nhận | QA; gắn nhãn mọi chỉ số |
| ASM-004 | COD/mô phỏng trong MVP học thuật, không thu tiền thật | Phù hợp đề bài | Nghiệp vụ và QA; rà nội dung demo |
| ASM-005 | Sản phẩm khác biến thể/SKU bán được; món không có size vẫn có thể cần biến thể riêng | Tạm thời | Chủ catalog; chốt quy ước SKU |

## Câu hỏi và mâu thuẫn cần quyết định

| Mã | Quyết định / tác động | Vai trò phụ trách đề xuất | Bằng chứng hoặc bước tiếp theo |
|---|---|---|---|
| OPEN-POLICY-001 | Đổi/trả là ngoài phạm vi hay tùy chọn, chính sách và thời hạn nào; hai trang tham chiếu mâu thuẫn | Trưởng nhóm nghiệp vụ | Chọn chính sách riêng trước RULE-RET |
| OPEN-PROMO-001 | Có khuyến mại/coupon trong MVP không, thứ tự áp dụng giá thế nào | Trưởng nhóm sản phẩm | Chốt ưu tiên trước đặc tả giá |
| OPEN-FUL-001 | Từ vựng trạng thái đơn/giao hàng tối thiểu | Đại diện vận hành | Thống nhất vòng đời trước SRS |
| OPEN-GUEST-001 | Cho mua không cần tài khoản hay chỉ khách đã đăng ký | Trưởng nhóm sản phẩm | Chốt trước chi tiết use case |
| OPEN-REPORT-001 | Báo cáo cơ bản gồm chỉ số nào và cách định nghĩa | Đại diện vận hành | Chốt phạm vi dashboard tối thiểu |
| OPEN-REVIEW-001 | Ai có thẩm quyền rà/duyệt quy tắc của doanh nghiệp giả định | Trưởng nhóm dự án | Ghi người rà và kết quả thực tế |
| OPEN-SKU-001 | Quy ước SKU, sản phẩm không có size/màu | Chủ catalog | Thử bằng ví dụ sản phẩm |
| OPEN-STOCK-001 | Khi nào giữ/trả hàng; hai người cùng mua món cuối | Đại diện vận hành | Định nghĩa ranh giới sự kiện nghiệp vụ |
| OPEN-PRICE-001 | Đổi giá lúc checkout, làm tròn, thuế và phí giao | Trưởng nhóm sản phẩm | Định nghĩa thời điểm cam kết giá |
| OPEN-RETRY-001 | Phân biệt một ý định mua gửi lại với lần mua mới sau timeout | Trưởng nhóm sản phẩm | Định nghĩa hành động khách quan sát được |
| OPEN-CALENDAR-001 | Đề bài 12 tuần và kế hoạch cũ Tuần 4–13 | Trưởng nhóm dự án | Xác nhận lịch mốc thật |
| OPEN-ASSET-001 | Quyền sử dụng ảnh sản phẩm và dữ liệu H&M | Người phụ trách dữ liệu | Kiểm điều khoản trước khi công bố |

## Câu hỏi mở của giai đoạn Users

Tất cả mục dưới đây được mở ngày **2026-11-15**, trạng thái **Open**, chưa có người duyệt và **chưa có dẫn chiếu quyết định**. Mã OPEN-USR theo dõi tác động lên actor/goal/journey; cột “Liên kết” chỉ câu hỏi nghiệp vụ đã có, không tạo chính sách thứ hai.

| Mã | Vấn đề và tác động | Vai trò cần quyết định; phương án cần rà | Liên kết / cách đóng |
|---|---|---|---|
| OPEN-USR-001 | Guest được đặt hàng không? Ảnh hưởng ACT-CUST, J-02 và xác minh danh tính | Chủ sản phẩm + giảng viên: chỉ khách đăng nhập hoặc cho guest | OPEN-GUEST-001; ghi quyết định phạm vi và điều kiện |
| OPEN-USR-002 | Guest tra đơn thế nào nếu được mua? Ảnh hưởng riêng tư J-03 | Chủ sản phẩm + người rà bảo mật: không cho tra hoặc xác minh quyền sở hữu bằng cách được chốt | OPEN-GUEST-001; không cho khách xem đơn người khác |
| OPEN-USR-003 | Staff được hủy/đổi đơn, chỉnh tồn kho và trạng thái đến đâu? Ảnh hưởng PERM-004, J-03/04 | Chủ vận hành: chỉ báo cáo, thao tác được giao, hoặc xin cấp quyền có điều kiện | OPEN-FUL-001, OPEN-STOCK-001; lập bảng quyền được rà |
| OPEN-USR-004 | Admin quản lý quyền nhân viên hoặc xuất dữ liệu riêng của khách không? | Chủ chính sách + người rà bảo mật: giới hạn theo nhiệm vụ hoặc cho phép có điều kiện | OPEN-REVIEW-001; xác định mục đích và phạm vi dữ liệu |
| OPEN-USR-005 | Đổi size, hủy/hoàn tiền và hỗ trợ khách có thuộc MVP không? | Chủ sản phẩm: OUT, tùy chọn hoặc phạm vi tối thiểu | OPEN-POLICY-001; không lấy thời hạn SOMEHOW làm mặc định |
| OPEN-USR-006 | Trạng thái đơn nào được cho khách thấy, chứng cứ để gọi “đã giao”? | Chủ vận hành: bộ trạng thái tối thiểu và quy tắc công bố | OPEN-FUL-001; rà RULE-FUL-001 trước SRS |
| OPEN-USR-007 | Mô phỏng thanh toán dùng ở môi trường nào và mô tả với khách ra sao? | Chủ sản phẩm + QA: quy tắc demo và từ ngữ “không thu tiền thật” | ASM-004; đối chiếu RULE-PAY-001/002 |
| OPEN-USR-008 | Đổi số lượng sau khi đã xác nhận ý định mua có được không? | Chủ chính sách: từ chối, hoặc quy trình sửa/hủy riêng | OPEN-RETRY-001, OPEN-STOCK-001; không tự thêm vào J-02 |
| OPEN-USR-009 | Thông báo là email, SMS hay kênh khác; cần báo thất bại thế nào? | Chủ sản phẩm + vận hành: chốt kênh và mục tiêu liên lạc | BREQ-NOT-001; chi tiết giao nhận thuộc SRS |
| OPEN-USR-010 | Hướng dẫn chọn size là MUST hay SHOULD? | Chủ sản phẩm: thông tin tối thiểu hoặc tính năng mở rộng | OPEN-SKU-001; rà J-01 và phạm vi |
| OPEN-USR-011 | Báo cáo tối thiểu và quyền xem gồm gì? | Vận hành + quản trị: chốt câu hỏi kinh doanh và nhóm dữ liệu | OPEN-REPORT-001; rà PERM-004 |
| OPEN-USR-012 | Ai đã rà BRD/Business Baseline và có quyết định chưa? | Trưởng nhóm BA: giữ Draft hoặc ghi biên bản thực | OPEN-REVIEW-001; Users chỉ lên Reviewed khi có bằng chứng |

**Cách đóng một mục:** ghi ngày quyết định, người/vai trò có thẩm quyền, phương án đã chọn, lý do, tác động lên BRD/quyền/hành trình/SRS và liên kết biên bản. Khi chưa có các trường này, trạng thái vẫn Open.

## Câu hỏi mở từ Requirements đến Logical Architecture

Các mục sau được ghi ngày **2026-11-15**, trạng thái **Open**, chưa có người phê duyệt. Chúng bổ sung đầu vào cho tài liệu mới; khi đóng cần quyết định và dẫn chiếu theo quy tắc ở trên.

| Mã | Tác động và quyết định cần có | Vai trò phụ trách đề xuất |
|---|---|---|
| OPEN-WL-001 | Số khách hoạt động, phiên, phân bố giờ; ảnh hưởng dự báo RPS | Chủ nghiệp vụ |
| OPEN-WL-002 | Mix catalog/search, dataset, payload, warm/cold cache | QA và chủ sản phẩm |
| OPEN-WL-003 | SKU/batch, ảnh, đơn/ngày và dữ liệu tăng trưởng | Vận hành |
| OPEN-WL-004 | Đỉnh khuyến mại, tỷ lệ phương án thanh toán | Chủ sản phẩm |
| OPEN-WL-005 | Môi trường load test, ramp, mẫu số lỗi, endurance | QA |
| OPEN-DATA-001 | Phạm vi duy nhất SKU, size/màu và sản phẩm không có lựa chọn | Chủ catalog |
| OPEN-DATA-002 | Snapshot tiền, thuế/phí, làm tròn và đơn vị tiền nhỏ nhất | Chủ thương mại |
| OPEN-DATA-003 | Retention/ẩn danh PII, đơn, log và bản sao | Chủ nghiệp vụ và người rà bảo mật |
| OPEN-DATA-004 | Cách xác minh sở hữu đơn của guest nếu cho checkout | Chủ sản phẩm và người rà bảo mật; phụ thuộc OPEN-USR-001/002 |
| OPEN-DATA-005 | Một hay nhiều vị trí tồn/giao trong MVP | Vận hành |
| OPEN-DATA-006 | Độ trễ chấp nhận được, trigger vô hiệu hóa cache/search | Chủ sản phẩm và QA |
| OPEN-ARCH-001 | Kiểu cấu trúc và ranh giới nhất quán logic trong ADR-001..003 | Chủ dự án, kiến trúc và chủ dữ liệu |
| OPEN-ARCH-002 | Bảo đảm kết quả đơn đã nhận tạo việc thông báo bền, retry/dedupe và đối soát event mất; tác động HLD-06 | Kiến trúc, vận hành và QA |
| OPEN-TECH-DB | So sánh PostgreSQL/NoSQL, chọn database và ADR ở phase 07 | Kiến trúc, vận hành và chủ dữ liệu |

## Ranh giới với triển khai hiện tại

Tại HEAD `28c458e67a38d4cd150b19b8598850b0105f0614` trên `main`, repository có tài liệu lịch sử, mã backend và storefront. Đây là quan sát về Git, **không** phải bằng chứng đã triển khai hoặc kiểm thử trên cloud. Các nhận định từ đợt audit 02/11/2026 trong SRC-P-004/005 cần kiểm lại riêng. Không dùng tình trạng code để tự duyệt BREQ.

## Danh sách chuyển đổi tài liệu và kết quả rà soát

Yêu cầu giữ nguồn tại local của người dùng được ưu tiên hơn đề xuất `git mv` trong kế hoạch. Các tài liệu nguồn được giữ tại đường dẫn cũ để đối chiếu; bộ tài liệu nghiệp vụ mới được biên soạn có truy nguyên nguồn. Các file cũ **đã được Git theo dõi chưa bị tự ý bỏ theo dõi**. Liên kết tương đối của tám file Markdown mới được kiểm ngày 2026-11-15.

| Đường dẫn hiện có | Đích / cách xử lý | Tác động và rủi ro |
|---|---|---|
| `docs/01_Project_Definition.md` | `00-project/project-charter.md`: **BIÊN SOẠN**, không đổi tên | BP/OBJ giữ trong BRD; câu về công nghệ cũ chỉ mang tính lịch sử; hai đường dẫn hiện cùng tồn tại |
| `docs/02_Project_Scope_and_Assumptions.md` | `00-project/scope-and-assumptions.md`: **BIÊN SOẠN** | Dẫn mã M/O/A cũ, đối chiếu ưu tiên với đề bài |
| `docs/03_Software_Requirements_Specification.md` | `03-requirements/SRS.md`: **BIÊN SOẠN BẢN NHÁP** | FR/NFR/UC/AT cũ được đối chiếu; file cũ giữ để tra nguồn |
| `docs/architecture/cloud-system-architecture.md` | **THAM CHIẾU / HOÃN** | Ảnh chụp triển khai cũ, không phải kiến trúc logic/vật lý đích đã duyệt |
| `docs/Enterprise_Ecommerce_Revised_Plan_Week_04-13.md` | **THAM CHIẾU** | Kế hoạch lịch sử, không phải nguồn chuẩn của yêu cầu nghiệp vụ |
| `docs/architecture/*`, `docs/erd/*`, `docs/report/*` | **GIỮ / HOÃN** | Bằng chứng triển khai không được viết lại trong giai đoạn Business |
| PDF, ZIP và file kế hoạch ở `docs/` chỉ có tại local | **IGNORE / CHỈ ĐỌC LOCAL** | Quy tắc Git ignore áp dụng cho nguồn chưa được theo dõi; nguồn này không có liên kết dùng để duyệt trực tuyến |

Các tham chiếu tới ba tài liệu Markdown cũ trong kế hoạch lịch sử vẫn dùng được vì chưa di chuyển nguồn. Khi chuyển SRS ở giai đoạn sau cần rà lại liên kết và lịch sử Git. Ba thư mục `.next-pdp-*` có sẵn trong storefront nằm ngoài phạm vi công việc này và không bị sửa.

### Ghi nhận cổng rà soát Business

| Hạng mục | Kết quả | Việc còn lại |
|---|---|---|
| Nguồn và chín use case đề bài | Đạt ở mức nghiệp vụ | SRS và bằng chứng triển khai thuộc giai đoạn sau |
| Truy vết BRD → CAP → PROC → RULE | Đạt cho các tình huống chính | Người phụ trách nghiệp vụ rà chính sách |
| Liên kết Markdown tương đối | Đạt trên local | Kiểm lại nếu nguồn cũ bị bỏ theo dõi hoặc di chuyển |
| Không bịa thông tin nội bộ SOMEHOW, không tự gán Approved | Đạt | Kiểm lại trang ngoài khi phát hành |
| Quyết định về chính sách, tồn kho, giá, gửi lại, guest, báo cáo và người duyệt | Chưa đủ | Giải quyết các mã OPEN |
| Phê duyệt chính thức Business Baseline | Chờ | Ghi người rà, ngày, góp ý và kết quả thật |

## Lịch sử thay đổi

| Ngày | Phiên bản | Thay đổi |
|---|---|---|
| 2026-11-15 | 0.1.0 | Ghi nguồn học phần, dự án, website theo ngày; giả định, mâu thuẫn và danh sách chuyển đổi. |
