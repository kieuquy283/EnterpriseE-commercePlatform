---
document_id: QAS-01
version: 0.1.0
status: Draft — targets proposed, unmeasured
owner: QA và người phụ trách chất lượng (chưa phân công)
reviewer: Chủ nghiệp vụ, bảo mật, vận hành (chưa xác định)
last_updated: 2026-11-15
source_baseline: SRS-01 Draft; SRS lịch sử; Topics trang 5; Presentation 1 trang 30, Presentation 3 trang 24/37/65, Presentation 4 trang 7/9/23
---

# Tình huống thuộc tính chất lượng

Mọi số trong tài liệu là **PROPOSED TARGET** từ SRS cũ, trừ khi ghi `TBD`; không phải số của SOMEHOW, mức dịch vụ đã duyệt hay kết quả đo. Số 500 ms trong slide P1 trang 30, ví dụ $500/tháng trang 35 và ngân sách độ trễ P4 trang 7 là **REFERENCE EXAMPLE**, không áp vào dự án. `APPROVED TARGET` cần người duyệt/ngày; `MEASURED RESULT` cần báo cáo đo và cấu hình môi trường. Hiện chưa có hai loại bằng chứng đó. [SRS](SRS.md), [AT](use-case-specifications.md), [RTM](requirements-traceability.md).

## 1. Ưu tiên theo rủi ro

| Thuộc tính | Tác động kinh doanh | Kịch bản / ưu tiên | Phép kiểm chứng dự kiến |
|---|---|---|---|
| Đúng giao dịch và dữ liệu | Đơn trùng/bán vượt gây mất tin cậy | QAS-REL-001..003 / cao | Tranh chấp và đọc lại đơn, tiền, tồn |
| Riêng tư và phân quyền | Lộ đơn/địa chỉ khách | QAS-SEC-001/002 / cao | Thử quyền phủ định, rà log |
| Hiệu năng | Khách bỏ hành trình xem/mua | QAS-PERF-CAT-001/CHK-001 / cao | Load test với mẫu và ranh giới đo |
| Phục hồi/khả dụng | Gián đoạn bán hàng hoặc mất dữ liệu | QAS-DR-001/AVAIL-001 / cao | Diễn tập lỗi và khôi phục |
| Quan sát/vận hành | Không nhận ra lỗi giao dịch | QAS-OBS-001 / cao | Đối chiếu tín hiệu và sự kiện thử |
| Khả năng thay đổi, chi phí | Chậm thay đổi/khoản chi khó kiểm soát | QAS-MOD-001/COST-001 / trung bình | Review hợp đồng, bảng chi phí |

## 2. Kịch bản chuẩn hóa

Mỗi dòng ghi **nguồn kích thích · kích thích · môi trường · đối tượng · phản ứng · thước đo**. Các ngưỡng chưa có số dùng `TBD`, không ngầm coi là 0. Lỗi dự kiến do dữ liệu sai/quyền sai phải tách khỏi lỗi hệ thống khi tính tỷ lệ lỗi; mẫu và cửa sổ được nêu trong [workload](../04-workload/workload-analysis.md).

| QAS / NFR; nguồn | Kích thích, môi trường, đối tượng | Phản ứng và thước đo đề xuất | Bằng chứng tương lai / mở |
|---|---|---|---|
| QAS-PERF-CAT-001 / NFR-PERF-01; BREQ-CAP-001, FR-CAT-01..03 | Khách mô phỏng gửi yêu cầu danh mục/tìm; môi trường staging tương đương MVP, bộ hàng ghi rõ, 30 RPS ổn định 10 phút; ranh giới phản hồi thao tác đọc | Trả kết quả đúng hoặc lỗi có nghĩa; p95 < 600 ms, lỗi hệ thống < 1% trong cửa sổ đo; media và click-to-interactive đo riêng | AT-07; log phân vị/rate, warm/cold cache, payload và tập dữ liệu còn TBD |
| QAS-PERF-CHK-001 / NFR-PERF-02; BREQ-ORD-001, FR-CHK-03 | 3 yêu cầu hoàn tất/giây trong 5 phút với giỏ/SKU hợp lệ, môi trường và tỷ lệ tranh chấp ghi rõ | p95 bước hoàn tất < 1.500 ms, lỗi hệ thống < 1%; vẫn giữ bất biến đơn/tồn/tiền | AT-07,01; dữ liệu reset và cách đếm kết quả business reject TBD |
| QAS-REL-001 / NFR-REL-01; FR-PAY-03 | Khách gửi cùng ý định đồng thời hoặc gửi lại sau timeout, trong lúc checkout đang hoạt động | Tối đa một đơn/tác dụng thu tiền cho ý định giống nội dung; kết quả cũ hoặc trạng thái chưa rõ có thể tra; khác nội dung cùng mã bị từ chối | AT-03; đọc lại đơn, tiền, tồn; chính sách giữ mã OPEN-RETRY-001 |
| QAS-REL-002 / NFR-REL-01; FR-INV-02 | Hai khách mua SKU còn 1 dưới tranh chấp đồng thời | Tổng lượng cam kết hợp lệ ≤ 1; khách không được chấp nhận thấy từ chối/chưa rõ rõ ràng | AT-15; snapshot trước/sau; OPEN-STOCK-001 |
| QAS-REL-003 / NFR-REL-01/02; FR-PAY-02/04 | Bộ mô phỏng thất bại hoặc đối tác tiền timeout trong checkout | Không ghi đã thu/đơn thành công giả; trạng thái chưa rõ cần đối soát; không lặp thu tiền | AT-02,14; đường hoàn trả giữ hàng chờ chính sách |
| QAS-REL-004 / NFR-REL-02; FR-NOT-01/02 | Nguồn thông báo hỏng sau khi đơn hợp lệ đã nhận | Đơn còn nguyên; việc thông báo lỗi hiển thị cho người có quyền, thử lại có giới hạn và không gửi trùng ngoài quy tắc | AT-05; số lần thử, lag và kênh chờ OPEN-USR-009 |
| QAS-REL-005 / NFR-REL-02/05; FR-CHK-03 | Cache/tìm kiếm hoặc nguồn dữ liệu giao dịch không sẵn sàng | Cache/tìm kiếm chỉ làm giảm trải nghiệm theo phương án đã chốt; nguồn giao dịch lỗi thì không xác nhận đơn giả; kiểm tra sức khỏe phát hiện phụ thuộc thiết yếu | AT-06; fallback cần review, không khẳng định tự phục hồi |
| QAS-SEC-001 / NFR-SEC-01; BREQ-SEC-001 | Customer A yêu cầu đơn B hoặc Staff vượt phạm vi, với phiên hợp lệ | Từ chối trước khi trả PII/chi tiết, không tiết lộ sự tồn tại/định danh nhạy cảm; 100% ca thử phủ định bị chặn | AT-04,10; ma trận quyền chờ OPEN-USR-003/004 |
| QAS-SEC-002 / NFR-SEC-02..05, NFR-DATA-02 | Kẻ không được phép truy cập lưu lượng/dữ liệu/log hoặc dùng mô phỏng ở môi trường thật | Truyền tải riêng được bảo vệ, dữ liệu nhạy cảm không ghi vào Git/log, secrets không lộ, mô phỏng không được bật ở môi trường thật; kiểm tra cấu hình và log | Review P3, thử negative, chính sách lưu giữ dữ liệu TBD |
| QAS-DR-001 / NFR-REL-03, NFR-OPS-02 | Mất nguồn dữ liệu trên staging có bản sao; dữ liệu đơn là đối tượng | Khôi phục và đối chiếu toàn vẹn; **mục tiêu đề xuất** RPO ≤ 60 phút, RTO ≤ 120 phút đo từ mốc sự cố đến dịch vụ dùng được | AT-08; chưa có diễn tập; tần suất/loại backup TBD |
| QAS-AVAIL-001 / NFR-REL-04 | Yêu cầu hợp lệ tới ranh giới xem hàng/mua trong cửa sổ tháng đo đề xuất | SLI = yêu cầu hợp lệ được phục vụ đúng / tổng yêu cầu hợp lệ; SLO **đề xuất** 99,5%; bảo trì/loại trừ chưa chốt | Cần người duyệt ranh giới, nơi đo, cửa sổ và downtime; không phải SLA |
| QAS-OBS-001 / NFR-OBS-01..03, NFR-REL-05 | Checkout thất bại, backlog thông báo, lỗi nguồn dữ liệu hoặc backup | Có traffic, latency p95/p99, lỗi, saturation, đơn lặp/bán vượt, lag, sức khỏe/backup; lần theo tương quan mà không lộ PII | Tạo sự cố thử và kiểm tra tín hiệu/cảnh báo; ngưỡng cảnh báo chờ baseline |
| QAS-MOD-001 / NFR-QUAL-01 | Thay kênh thông báo hoặc nơi lưu media khi hợp đồng người dùng giữ nguyên | Quy tắc đơn/giá không đổi; hợp đồng thay đổi có version; chạy lại AT-01/05/11 | Review ranh giới thành phần và regression; thời gian sửa TBD |
| QAS-SCALE-001 / NFR-PERF-03/04 | Tăng tải từ baseline thử x5/x10, tài nguyên kết nối có giới hạn | Ghi điểm bão hòa; khi vượt ngưỡng phải từ chối an toàn, không phá bất biến; giới hạn kết nối/tài nguyên không cạn kiệt âm thầm | Stress test P4; x5/x10 là biến thể thử, không phải năng lực đã hứa |
| QAS-COST-001 / NFR-COST-01 | Khối lượng và media tăng trong một tháng vận hành | Dự báo chi phí theo môi trường, lưu trữ, truyền dữ liệu, xử lý, quan sát và chi phí/đơn; báo khi gần ngân sách được duyệt | Ngân sách VND/tháng và giá nhà cung cấp TBD; chưa có cost thực đo |

## 3. Định nghĩa phép đo và SLI/SLO

- **p95/p99:** phân vị trên những yêu cầu thuộc cùng loại và cùng cửa sổ; lưu số mẫu, phương pháp tính, trạng thái cache, dữ liệu đầu vào. API latency tính từ nhận yêu cầu đến trả kết quả ở ranh giới dịch vụ; thời gian từ click đến giao diện dùng được là phép đo khác.
- **RPS:** yêu cầu đến mỗi giây theo loại thao tác; không tương đương số phiên hay số người đồng thời. `Concurrent in-flight ≈ arrival rate × response time` chỉ là ước lượng khi ổn định; người dùng đang nghĩ/đọc trang cần mô hình riêng.
- **Lỗi:** từ chối đúng nghiệp vụ (hết hàng, sai quyền) được ghi riêng; lỗi hệ thống là yêu cầu hợp lệ không nhận phản hồi đúng. Báo cả hai mẫu số để không che lỗi.
- **Availability:** nếu SLO 99,5%/tháng được duyệt, error budget lý thuyết = 0,5% tổng yêu cầu hợp lệ trong tháng; chưa tính trước cho lịch bảo trì. SLA đối ngoại chưa có.
- **RPO/RTO:** đo từ bản sao/sự cố và thời điểm dịch vụ dùng đúng; sao lưu tồn tại không chứng minh phục hồi được. Target 60/120 phút vẫn là đề xuất.
- **Độ trễ và chi phí:** chưa phân bổ budget cho từng thành phần vì chưa có số đo phụ thuộc; chủ QA và kiến trúc sẽ đề xuất sau khi có baseline. Không suy diễn số ví dụ trên slide.

## 4. Mã NFR cũ và handoff

Giữ nguyên toàn bộ họ `NFR-PERF-01..04`, `NFR-REL-01..05`, `NFR-SEC-01..05`, `NFR-OBS-01..03`, `NFR-OPS-01..03`, `NFR-DATA-01..02`, `NFR-COST-01`, `NFR-QUAL-01` làm crosswalk. `NFR-DATA-01` nay là yêu cầu **một chủ dữ liệu thương mại**, không khóa framework; `NFR-PERF-04` là giới hạn kết nối/tài nguyên, không khóa engine. `NFR-OPS-*` cần bằng chứng phát hành/rollback ở P3/P4; `NFR-QUAL-01` cần ma trận và kết quả kiểm thử. Các NFR chưa có tình huống riêng được kiểm qua kịch bản tương ứng và kế hoạch P3/P4, không được đánh dấu đã hoàn thành. Quyền mã hóa/lưu giữ, ngưỡng quan sát, môi trường tương đương, SLO và ngân sách còn mở với chủ nghiệp vụ/QA/vận hành. Đầu vào cho [workload](../04-workload/workload-analysis.md) là các target đề xuất và định nghĩa mẫu đo này; cổng N8 **chưa được duyệt**.

| Mã lịch sử | Nơi kiểm chứng/ý nghĩa logic hiện tại |
|---|---|
| NFR-PERF-01; NFR-PERF-02 | QAS-PERF-CAT-001; QAS-PERF-CHK-001, AT-07 |
| NFR-PERF-03; NFR-PERF-04 | QAS-SCALE-001 và WL; số phiên/RPS tách biệt, giới hạn kết nối không khóa engine |
| NFR-REL-01; NFR-REL-02 | QAS-REL-001..005, AT-02/03/05/06/15 |
| NFR-REL-03; NFR-REL-04; NFR-REL-05 | QAS-DR-001; QAS-AVAIL-001; QAS-REL-005/QAS-OBS-001 |
| NFR-SEC-01; NFR-SEC-02 | QAS-SEC-001/002; kiểm quyền theo tài nguyên và truyền tải/an ninh mạng |
| NFR-SEC-03; NFR-SEC-04; NFR-SEC-05 | QAS-SEC-002; secrets/PII/thẻ và simulator chỉ thử nghiệm |
| NFR-OBS-01; NFR-OBS-02; NFR-OBS-03 | QAS-OBS-001; tín hiệu, tương quan và cảnh báo có ngưỡng chờ đo |
| NFR-OPS-01; NFR-OPS-02; NFR-OPS-03 | FR-OPS-01..04, AT-08/19/20; gate phát hành, rollback và dữ liệu còn nguyên |
| NFR-DATA-01; NFR-DATA-02 | [Chủ dữ liệu logic](../05-data/data-ownership-and-consistency.md), QAS-SEC-002; PII retention còn mở |
| NFR-COST-01; NFR-QUAL-01 | QAS-COST-001, [RTM](requirements-traceability.md) và kết quả kiểm thử tương lai |
