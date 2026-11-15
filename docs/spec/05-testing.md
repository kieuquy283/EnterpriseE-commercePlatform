<a id="acceptance-workload-and-measurable-nfrs"></a>
# Nghiệm thu, tải và NFR đo được

Đây là hợp đồng nghiệm thu DAYMARK, không phải báo cáo năng lực đã đạt. [Nghiệp vụ](01-business.md), [luồng](02-flows.md), [kiến trúc](03-architecture.md), [dữ liệu/API](04-data-api.md) và [vận hành](06-operations.md) xác định nội dung kiểm thử. Mọi mục tiêu mới cần bằng chứng trước khi được chấp nhận.

<a id="1-workload-assumptions"></a>
## 1. Giả định tải

Một cửa hàng quần áo Việt Nam/VND, một kho, 24–36 sản phẩm ra mắt có biến thể kích cỡ/màu, COD và bàn giao vận chuyển thủ công. Đa số phiên duyệt; ít phiên đổi giỏ hoặc hoàn tất đơn. Chưa có số đo lưu lượng nghiệp vụ thật.

Dùng **tốc độ yêu cầu đến** cho năng lực API và **hành trình mỗi giây** cho checkout. Một hành trình có nhiều yêu cầu HTTP nên ba hành trình/giây không phải ba yêu cầu HTTP/giây. VU là năng lực thực thi của bộ tạo tải, không thể thay trực tiếp cho số người dùng nghiệp vụ.

Mức nền: 30 yêu cầu đọc danh mục/sản phẩm công khai mỗi giây trong mười phút. Thử giao dịch: ba hành trình checkout/giây trong năm phút, dùng tồn riêng và khách tổng hợp. Mô hình chiến dịch: 90% duyệt, 8% giỏ, 2% checkout theo hành động nghiệp vụ; hiệu chỉnh để báo RPS endpoint thực. Xác định thời gian suy nghĩ và độ dài phiên trước suy ra số người dùng đồng thời. Kịch bản tạm tính 100 phiên hoạt động là đầu vào kiểm thử, không bảo đảm số người hỗ trợ.

<a id="fixture-sizes-and-request-boundaries"></a>
### Cỡ dữ liệu mẫu và ranh giới yêu cầu

Dùng ba bộ mẫu có tên riêng: 24–36 sản phẩm cho demo nghiệp vụ; ít nhất 120 sản phẩm tổng hợp khớp để thử phân trang/sắp xếp toàn danh mục; danh mục tổng hợp 1.000 sản phẩm có biến thể kích cỡ/màu cho thử năng lực đầu. Stress dữ liệu lớn hơn là thăm dò. Đây là mục tiêu dữ liệu thử, không phải số seed có sẵn hoặc tồn thật. Gắn phiên bản, dùng ảnh mẫu có quyền tái sử dụng và đối soát SKU/tồn duy nhất.

Mục tiêu duyệt 30/150 RPS đếm API danh mục/chi tiết/tìm/lọc, không đếm mọi HTTP trang phát ra. Báo riêng yêu cầu trang storefront, RPS proxy ảnh và byte truyền; công bố số ảnh/trang và kịch bản cache nóng/lạnh. Nếu không, chiến dịch đọc nhiều có thể đạt thử danh mục trong khi ảnh làm nghẽn cùng API task. Thời gian hành trình trình duyệt là số đo khác p95 API.

<a id="2-nfr-targets-and-how-to-measure-them"></a>
## 2. Mục tiêu NFR và cách đo

| ID | Mục tiêu / phạm vi | Cách đo và điều kiện đạt | Trạng thái ban đầu |
| --- | --- | --- | --- |
| NFR-PERF-01 | 30 yêu cầu duyệt/giây, 10 phút; p95 API <600 ms; lỗi <1% | Bộ k6 arrival-rate cho danh mục, chi tiết, tìm và lọc; công bố cache nóng/lạnh; không dropped iterations; ngưỡng kiểm tra nghiệp vụ >99% | Mục tiêu, chưa kiểm chứng bản AWS đầy đủ cần nghiệm thu |
| NFR-PERF-02 | 3 hành trình checkout/giây, 5 phút; p95 hoàn tất giỏ <1.500 ms; lỗi ngoài dự kiến <1% | Chỉ số hoàn tất gắn nhãn k6 và số hành trình hoàn tất; đối soát đơn, hiệu ứng thanh toán, tồn; phân loại riêng hết tồn có chủ đích | Script cần ngưỡng nghiệp vụ và đối soát mạnh hơn |
| NFR-PEAK-01 | Tăng 30 lên 150 RPS duyệt (5x), giữ 5 phút, rồi 30 RPS trong 5 phút | Không dropped iterations, lỗi ngoài dự kiến <1%, p95 đỉnh <1.200 ms; về p95 nền <600 ms trong 5 phút sau giảm tải. Ghi đổi số task, thời gian, kết nối DB và tăng trước nếu có | Mục tiêu; có thể cần đổi năng lực và duyệt chi phí |
| NFR-REL-01 | Một hiệu ứng nghiệp vụ cho thao tác thanh toán/đơn lặp; không bán vượt tồn trong ca đồng thời đã định | 20 lần thử đồng thời với năm đơn vị cuối và ca trùng/thử lại; đối soát ID/giữ chỗ/lượng xuất giao chính xác; không hiệu ứng trùng, không âm tồn bán được | Phải chứng minh, không suy từ framework |
| NFR-AVAIL-01 | 99,5% probe sẵn sàng thành công trong cửa sổ demo công bố | Probe ngoài mỗi phút cho storefront, API và đọc danh mục nhẹ qua phụ thuộc. Công bố tử/mẫu và kỳ quan sát; tính gián đoạn ngoài dự kiến | Mục tiêu, không SLA 24x7; loại tắt lease ngoài cửa sổ một cách rõ ràng |
| NFR-RECOVERY-01 | RPO ≤60 phút; RTO ≤120 phút | Diễn tập khôi phục cô lập có checkpoint và thời gian, kiểm tham chiếu danh mục/đơn, mở lại có kiểm soát. Chỉ có snapshot không đủ | Đề xuất, chưa kiểm chứng |
| NFR-SEC-01 | Không đọc khách/đơn trái quyền, không DB/Redis công khai hoặc đọc S3 riêng không ký | HTTP phủ định cùng rà IaC/mạng; không thông tin xác thực trong Git/log; không mô phỏng production | Có bằng chứng lịch sử một phần; kiểm lại mỗi phát hành |
| NFR-OBS-01 | Phát hiện lỗi API/phụ thuộc được tiêm trong 5 phút thuộc cửa sổ dịch vụ | Probe/dashboard/alarm ghi lỗi và thông báo tới người vận hành xác nhận; liên kết yêu cầu/đơn thử với log nơi đã triển khai | Mục tiêu; có tài nguyên dashboard, chưa kiểm chứng nhận thông báo |
| NFR-NOTIFY-01 | Xác nhận bình thường đến trong 60 giây cho ≥95% đơn thử; thử lại giới hạn, quan sát được | Hộp thư thử/adapter ghi giao và khóa chống trùng; thử gián đoạn/thử lại không đổi đơn đã chốt | Thiếu triển khai; chính sách bốn lần ở hợp đồng dữ liệu/API |
| NFR-COST-01 | Trần lập kế hoạch tạm tính USD100/tháng | Mô hình theo vùng gồm giờ chạy, lưu trữ khi dừng, ALB, RDS, ECS, Redis, log, truyền và sao lưu; so ước tính với hóa đơn thực có độ trễ | Mục tiêu kế hoạch, không quyền chi hoặc hóa đơn xác minh |
| NFR-REC-01 | Gợi ý tùy chọn p95 <800 ms ở 30 RPS; lỗi không chặn mua | Bộ k6 riêng, thử dự phòng/timeout và hồi quy thương mại; so chất lượng ngoại tuyến trước bật | Có mã/bằng chứng riêng; tính năng cloud còn tắt |

Chi phí/độ sẵn sàng áp dụng lịch vận hành giới hạn rõ. Chạy cả tháng các dịch vụ có thể vượt trần tạm tính. Nếu mô hình vượt, giảm lịch/năng lực hoặc có ngân sách chủ sở hữu duyệt trước chạy; không âm thầm giảm nghiệm thu hay coi tín dụng miễn phí là chi phí bằng không. Mục tiêu là giả thuyết dự án cần đo, không là chuẩn ngành bên ngoài.

<a id="3-functional-traceability"></a>
## 3. Truy vết chức năng

| Yêu cầu / luồng | Kịch bản tối thiểu | Lớp kiểm thử | Bằng chứng cần |
| --- | --- | --- | --- |
| FR-01 / FLOW-01 | Đăng ký/nhập/xuất, hồ sơ riêng; từ chối dữ liệu bảo vệ của khách khác | HTTP backend + Playwright | Danh tính tổng hợp, assertion, trace; ghi chính sách xác minh |
| FR-02 / FLOW-02 | Duyệt, tìm/lọc quần áo, giá/kích cỡ/ảnh hợp lệ; phân trang hơn 100 kết quả | Hợp đồng/tích hợp + Playwright | Đếm/thứ tự toàn danh mục, ca phủ định sản phẩm không khả dụng/riêng |
| FR-03 / FLOW-03 | Thêm/đổi/xóa biến thể; xử lý số lượng sai/thiếu tồn | Unit/HTTP + Playwright | Trạng thái giỏ và tổng do server tính |
| FR-04 / FLOW-04 | Địa chỉ → vận chuyển → hoàn tất → xác nhận khách → cùng đơn ở Admin | Tích hợp backend + Playwright + kiểm tra nhân viên | Một đơn, biến thể, giữ chỗ và tham chiếu fulfillment truy vết được |
| FR-05 / FLOW-05 | Mô phỏng cô lập thành công/thất bại; COD production; timeout và gửi trùng đồng thời | Tích hợp + k6 có kiểm soát | Hiệu ứng đơn/thanh toán chính xác; không thu thật; không mô phỏng production |
| FR-06 / FLOW-06 | Nhân viên nhận tồn, khách giữ, hủy giải phóng phù hợp, lấy/đóng/fulfillment đúng | Tích hợp + kiểm tra Admin | Mức tồn trước/sau và đối soát giữ chỗ; thử vòng đời đã cài |
| FR-07 / FLOW-07 | Khách thấy tiến độ được phép; nhân viên ghi bàn giao, giao/COD hoặc giao thất bại | Playwright + nghiệm thu nhân viên | Ánh xạ trạng thái thực hỗ trợ và bản ghi bàn giao; không bịa tự động vận chuyển |
| FR-08 / FLOW-08 | Xác nhận sau nhận đơn và cập nhật trạng thái đủ điều kiện; event trùng/cũ/sai thứ tự; kênh gián đoạn và phục hồi | Unit provider giả + tích hợp + kênh thử đã duyệt | Bản ghi theo từng event/version, không trùng/sai mốc, thử lại hữu hạn, trang đơn và trạng thái nguồn không đổi; mốc/kênh cần chốt |
| FR-09 / FLOW-09 | Nhân viên sửa sản phẩm/tồn/đơn; Admin cấp truy cập, xem báo cáo đơn/tồn | Kiểm tra Admin + thử phân quyền API | Chính sách vai trò chứng minh được, tổng báo cáo đối soát mẫu |
| REC-01 | Gợi ý tương tự/nổi bật loại không thấy/không khả dụng; không dùng dữ liệu cá nhân hóa nếu chưa đồng ý theo dõi | Unit/HTTP + Playwright + đánh giá ngoại tuyến | Phiên bản ứng viên, dữ liệu có quyền, chất lượng và dự phòng |

Năng lực Medusa có sẵn tự nó không là nghiệm thu. Thử nhân viên thủ công hợp lệ nếu lặp lại được, có người chứng kiến và ghi nhận. Tự động hóa trình duyệt Admin có thể bổ sung sau khi luồng ổn định được chứng minh.

<a id="4-tool-responsibilities"></a>
## 4. Trách nhiệm công cụ

- **Unit/Jest:** chính sách xếp hạng, chiếu dữ liệu, đồng ý và idempotency xác định; không assertion chỉ sao chép chi tiết triển khai.
- **HTTP/tích hợp backend:** workflow Medusa đã cài, ranh giới auth, ràng buộc DB, kết quả giao dịch, lỗi provider, nâng schema trên PostgreSQL dùng riêng.
- **Playwright:** hành trình mua/tài khoản và kết quả thao tác trực quan. Giữ trace/ảnh khi lỗi; kiểm kết quả nghiệp vụ đã lưu, không chỉ điều hướng.
- **k6:** thông lượng, p95, cạnh tranh, khuyến mãi hỗn hợp và khôi phục quá tải. Đặt ngưỡng `checks` nghiệp vụ và `dropped_iterations`, không chỉ thời gian HTTP.
- **CloudWatch/ALB/ECS/RDS/Redis:** giải thích nghẽn/tăng giảm trong cùng cửa sổ UTC.
- **IaC/vận hành:** cfn-lint, Guard, thử quản lý/tắt, triển khai/quay lui, nhận cảnh báo và diễn tập khôi phục cô lập.

`load/catalog.js`, `load/checkout.js`, `load/recommendations.js` là điểm bắt đầu. Script danh mục đọc một hình dạng endpoint. Checkout có kiểm tra tạo đơn nhưng thiếu ngưỡng kiểm tra nghiệp vụ; cần bổ sung cùng đối soát trước coi k6 xanh là thành công nghiệp vụ. Có Playwright nhưng CI main được khảo sát chưa chạy chúng. Đây là công việc triển khai, không được thực hiện chỉ bằng cập nhật tài liệu.

<a id="5-execution-sequence-and-fixture-safety"></a>
## 5. Trình tự và an toàn dữ liệu mẫu

1. Ghi môi trường, digest phiên bản/ảnh, cấu hình không bí mật, số dữ liệu mẫu, cache, giới hạn task API, cỡ DB/Redis, vị trí bộ tạo tải và chi phí/thời gian dự kiến.
2. Dùng dịch vụ cô lập/có thể bỏ cho tích hợp và ghi. Thử ghi cloud cần dữ liệu tổng hợp chỉ định rõ, tồn đầu biết trước và lần chạy giới hạn; không âm thầm tải lên đơn khách.
3. Smoke một vòng; kiểm kết quả có thẩm quyền thật. Dừng nếu phụ thuộc, khóa, tồn hoặc cấu hình vận chuyển/thanh toán sai.
4. Chạy bộ duyệt nền và giao dịch riêng để có tham chiếu lặp lại. Sau đó chiến dịch hỗn hợp, đỉnh 5x và khôi phục. Chưa thử 10x khi chưa hiểu lần nhỏ và chưa giới hạn chi phí/thời gian.
5. Với autoscaling, cho thấy API từ một lên hai task khi tải nghẽn CPU. Nếu nghẽn nơi khác và không tăng, báo đúng; tăng trước không chứng minh tự tăng.
6. Đối soát đơn tổng hợp, hiệu ứng thanh toán, giữ chỗ và tồn. Chỉ xóa artifact thử thuộc sở hữu, có thể bỏ theo quy trình mẫu; giữ bằng chứng, không drop DB dùng chung.
7. Tiêm lỗi rõ: email gián đoạn, worker/API khởi động lại, Redis gián đoạn, khôi phục DB cô lập. Phụ thuộc dữ liệu lỗi có thể làm checkout không khả dụng nhưng không được hỏng trạng thái hoặc báo thành công giả.
8. Công bố PASS/FAIL/NOT RUN từng yêu cầu, đầu ra thô, nghẽn quan sát, dòng thời gian phục hồi, phân biệt ước tính/thực chi và người phụ trách tiếp.

Ở 10x (300 RPS duyệt), đo điểm gãy và khôi phục; không hứa phục vụ thành công. Dừng khi lỗi ngoài dự kiến >5% kéo dài một phút, cạn kết nối DB, assertion toàn vẹn thất bại hoặc hết thời gian/chi phí duyệt. Ghi việc dừng, không xóa kết quả bất lợi.

<a id="6-evidence-and-release-gates"></a>
## 6. Bằng chứng và cổng phát hành

Bằng chứng ngày 9 tháng 11 ghi 65 unit backend, 12 tích hợp HTTP, migration đạt, ảnh chạy khớp và 18 kiểm tra công khai. Không chứng minh uptime hiện tại, checkout trình duyệt đầy đủ, nhân viên giao hàng, năng lực chiến dịch, mục tiêu khôi phục hay nội dung DAYMARK mới. Báo cáo gợi ý riêng không cấp quyền dùng dữ liệu/ảnh công khai.

Gói bằng chứng mới cần ID/ngày chạy, commit/digest ảnh, ID yêu cầu, manifest thiết lập/mẫu, phiên bản công cụ/cấu hình, số đo thô, assertion, trace làm sạch, đối soát tồn/đơn, ảnh dashboard, chi phí/thời gian và kết luận người đánh giá. Lưu riêng theo ngày; không ghi đè lần cũ đạt hoặc lỗi bằng kết quả mới.

Nghiệm thu phát hành cần FR-01..09 đạt, ca phủ định bảo mật, xử lý trùng an toàn, hành trình nghiệp vụ cloud đầy đủ, triển khai CI/CD, bằng chứng dashboard/cảnh báo và kết quả nền/đỉnh/khôi phục. Chặn cốt lõi còn mở thì chưa nghiệm thu; demo một phần gắn nhãn rõ không hoàn thành phạm vi. REC-01 nâng cao: triển khai tắt đến khi quyền dữ liệu, chất lượng, an toàn và độ trễ đạt. Gợi ý xác định ngoại tuyến không phí token LLM; nếu thêm trợ lý AI sau này, định nghĩa đánh giá, an toàn prompt/dữ liệu và ngân sách token trước.

<a id="7-product-suggestion-quality-gate"></a>
## 7. Cổng chất lượng gợi ý

Bắt đầu nền xác định (sản phẩm nổi bật/phổ biến hợp lệ), so chiến lược tương tự chọn trên mẫu đánh giá DAYMARK có phiên bản/quyền. Mục tiêu ít nhất 20 ngữ cảnh sản phẩm nguồn, phủ loại hàng, kích cỡ/tồn và cold-start; tách ngữ cảnh đánh giá khỏi tinh chỉnh khi khả thi. Báo hash dữ liệu/danh mục/lượt, nguồn nhãn và người đánh giá. Không gọi nhãn tổng hợp/agent là đánh giá con người.

Nghiệm thu: 100% mục trả thỏa kênh/vùng/hiển thị/giá; không tự gợi ý hoặc trùng tại vị trí sản phẩm tương tự; không lộ metadata riêng/nguồn. Hai người trong nhóm độc lập đánh giá sáu gợi ý đầu theo tiêu chí viết rõ (loại/cách dùng/phom/phong cách); mục tiêu ít nhất 80% chấp nhận được VÀ không giảm so nền trên cùng mẫu; công bố bất đồng và phân xử. Giữ nền đơn giản nếu chiến lược phức tạp chưa chứng minh lợi ích đo được. Đánh giá nhỏ là cổng chất lượng demo, không chứng minh tăng doanh số.

Nếu có nhãn tương tác giữ riêng, báo Recall@6/NDCG@6 và độ phủ cho nền lẫn thuật toán chọn; không bịa nhãn mua ngoại tuyến từ đơn sinh ra. Không tuyên bố tăng chuyển đổi trực tuyến thiếu thử nghiệm có kiểm soát. Báo p95 API, tỷ lệ dự phòng, cỡ artifact/thời gian tạo và chi phí tài nguyên tăng thêm. Gợi ý không LLM có phí token N/A. Cá nhân hóa còn phải đạt thử rút đồng ý và chặn hồ sơ cũ trước bật.
