<a id="operations-security-and-delivery"></a>
# Vận hành, bảo mật và phát hành

Đây là hợp đồng vận hành mục tiêu. Kết quả AWS lịch sử chỉ là bằng chứng cho phiên bản/thời điểm đã ghi. Xem [kiến trúc](03-architecture.md), [nghiệm thu](05-testing.md) và [hướng dẫn triển khai thực thi](../../deploy/RUNBOOK.md).

<a id="owners-and-environment-boundary"></a>
## Trách nhiệm và ranh giới môi trường

| Vai trò | Trách nhiệm | Ranh giới truy cập |
| --- | --- | --- |
| Khách hàng | Duyệt, mua, theo dõi đơn riêng | Store API với bối cảnh khách; không Admin API |
| Nhân viên vận hành | Danh mục, tồn, đơn/xử lý giao | Medusa Admin có xác thực; chứng minh quyền thực trước tuyên bố RBAC chi tiết |
| Quản trị viên | Cấp tài khoản nhân viên, cấu hình, báo cáo vận hành | Danh tính nhân viên rõ; không mật khẩu seed dùng chung |
| Người phát hành | Đánh giá artifact, triển khai, kiểm chứng, quay lui | GitHub environment được duyệt và quyền vận hành AWS giới hạn |
| Người duy trì dữ liệu/gợi ý | Chuẩn bị artifact có quyền, kiểm tra và công bố | Không tự chuyển dữ liệu nghiên cứu hạn chế sang công khai |

Chỉ định người/luân phiên theo issue phát hành, không gắn vĩnh viễn vào đặc tả. Một sinh viên có thể giữ nhiều vai trò nhưng thao tác/bằng chứng riêng. Phải xác định DB cục bộ, thử dùng riêng và demo AWS trước lệnh tạo khách, giỏ, đơn hoặc đổi tồn.

<a id="threat-model-and-controls"></a>
## Mô hình đe dọa và kiểm soát

| Đe dọa | Ranh giới/kiểm soát | Bằng chứng nghiệm thu |
| --- | --- | --- |
| Khách đọc đơn khách khác | Phân quyền tác nhân server; thử truy cập đối tượng phủ định | HTTP khách A/B, kể cả sửa ID |
| Giả giá, giảm giá, khách hoặc tồn | Workflow Medusa có thẩm quyền, danh sách DTO cho phép đã kiểm tra, danh tính từ auth | Thử sửa dữ liệu và thiếu tồn |
| Trùng checkout/callback thanh toán | Định danh thao tác ổn định; kết quả idempotent bền; xác minh ngữ nghĩa provider | Thử đồng thời/timeout; một hiệu ứng đơn/thanh toán |
| Lạm dụng đăng nhập/tìm/gợi ý | Đầu vào giới hạn, giới hạn tốc độ/đồng thời đề xuất và timeout phụ thuộc | Ca phủ định và hành vi lỗi tải đỉnh; chưa triển khai đủ kiểm soát |
| Lộ bí mật/tài sản riêng | Secrets Manager/IAM task role; bucket riêng; allowlist tiền tố ảnh công khai; log làm sạch | Kiểm IAM/lưu trữ; từ chối S3 trực tiếp/đường dẫn riêng |
| Cache cũ hoặc chéo khách | Khóa theo bối cảnh, phản hồi riêng no-store, chính sách độ mới rõ | Thử hai danh tính/vùng và vô hiệu hóa |
| Công bố dữ liệu nghiên cứu/ảnh độc hại | Cổng quyền/nguồn gốc; giới hạn định dạng; không tải H&M hàng loạt công khai | Rà quyền và thử mẫu/tệp sai |
| Triển khai/migration hỏng dữ liệu | Change set được rà, sao lưu, migration tương thích về trước, diễn tập khôi phục cô lập | Tham chiếu artifact và kết quả diễn tập |

DAYMARK không lưu dữ liệu thẻ. Ban đầu COD; tạo đơn không nghĩa đã thu tiền. Bộ mô phỏng ngoài production phải hỗ trợ thành công/thất bại/thử lại. Đặt vận chuyển và đối soát COD ban đầu thủ công, ghi tác nhân/thời gian/tham chiếu; không trình bày cập nhật mô phỏng như xác nhận chuyển phát thật.

<a id="iam-and-network-responsibilities"></a>
## Trách nhiệm IAM và mạng

ECS execution role lấy ảnh, ghi log và đọc ba bí mật ứng dụng được inject. Task role API/worker chỉ truy cập bucket ảnh cấu hình cho thao tác S3 ứng dụng; chính sách hiện phủ đối tượng bucket nên giới hạn tiền tố công khai là ranh giới công bố HTTP ứng dụng, không là ranh giới IAM riêng. Không đặt tài liệu riêng trong bucket/provider đó. Task role storefront không có quyền API S3/Secrets Manager.

Role công bố GitHub OIDC gắn environment aws-demo của kho mã và các ECR repository; có thể công bố ảnh/đọc đầu ra foundation, không triển khai hạ tầng hoặc đọc bí mật ứng dụng. Tự động triển khai cần release role và chính sách environment được đánh giá riêng; không âm thầm mở quyền role công bố. Role watchdog vận hành riêng, được rà phạm vi stop/describe. Truy cập AWS của con người theo trải nghiệm dự án quản lý, không tự tạo IAM user nhân viên thủ công.

ALB nhận HTTPS/chuyển hướng HTTP công khai; inbound ứng dụng chỉ từ security group ALB. Inbound DB/Redis chỉ từ nhóm ứng dụng; RDS không công khai. Danh tính nghiệp vụ storefront/Admin khác IAM role AWS. Fargate task hiện có kết nối ra công khai: đánh đổi demo giới hạn, không khẳng định mọi compute ở subnet riêng. Rà egress/phụ thuộc trước phát hành thương mại công khai.

<a id="cicd-target-and-current-gap"></a>
## Mục tiêu CI/CD và khoảng trống

CI kiểm thử/lint/kiểu/build ứng dụng và CloudFormation. Workflow OIDC công bố ảnh; thực thi phát hành đủ nền tảng do người vận hành điều khiển. Chưa chứng minh pipeline phát hành tự động đầy đủ.

Pipeline mục tiêu:

1. PR: tài liệu/hợp đồng, lint, unit/tích hợp, đường đi trình duyệt cốt lõi cô lập, build container và kiểm hạ tầng.
2. Main/tag được bảo vệ: build ảnh bất biến, công bố digest ECR bằng OIDC giới hạn hẹp.
3. Môi trường demo được duyệt: kiểm cấu hình/lease, rà thay đổi hạ tầng/trạng thái sao lưu, migration, phát hành đúng digest.
4. Cổng kiểm: API/storefront sẵn sàng, đơn xuyên suốt cô lập và kiểm thông báo worker; ghi phiên bản, digest, môi trường, UTC và kết quả.
5. Nếu lỗi: ngừng đưa tiếp; phục hồi digest ứng dụng tương thích hoặc theo quy trình dữ liệu. Không drop/seed lại production để quay lui.

Duyệt environment là ranh giới phát hành có chủ đích; chính thực thi đã duyệt phải tự động và lặp lại được. Helper hiện rút task trước migration/khởi động nên bảo trì có kế hoạch ngắt lưu lượng. Không hứa không gián đoạn. Triển khai pipeline và thực thi thành công là hai cổng riêng.

<a id="observability-and-slo"></a>
## Khả năng quan sát và SLO

| Tín hiệu | Diễn giải và phản ứng |
| --- | --- |
| Probe sẵn sàng theo lịch thành công / tổng probe theo lịch | SLI theo NFR-AVAIL-01; tỷ lệ yêu cầu thành công là tín hiệu riêng |
| p95, lỗi và RPS đạt được | Đo tại ranh giới có tên; số đo API không xác lập LCP trình duyệt |
| Đối soát đơn/hiệu ứng thanh toán/giữ tồn | SLI đúng đắn; HTTP 200 không đủ |
| Target ALB lỗi/5xx, số task/CPU/bộ nhớ ECS | Phát hiện bão hòa, phát hành lỗi và tăng giảm thực |
| Kết nối/CPU/bộ nhớ trống/độ trễ lưu trữ RDS | Tìm trần DB trước tăng bản sao ứng dụng |
| Sức khỏe/bộ nhớ Redis và lỗi worker | Nhận diện lỗi phụ thuộc điều phối/nền |
| Lượt thông báo, thử lại, lỗi cuối, tuổi hàng đợi | Chứng minh việc nền hoàn tất; còn cần telemetry nghiệp vụ tùy chỉnh |
| Tỷ lệ dự phòng/lỗi, hợp lệ và độ trễ gợi ý | Không để gợi ý tùy chọn che lỗi thương mại |

Mục tiêu sẵn sàng 99,5% trong cửa sổ dịch vụ được lên lịch rõ. Công bố trước từng cửa sổ; tính cả gián đoạn bất ngờ và bảo trì trong đó. Tắt lease ngoài cửa sổ bị loại nhưng không được giấu người dùng. Không là SLA production 24/7 đã đo. Mỗi kế hoạch thử xác định chu kỳ lấy mẫu hộp đen, xử lý không lưu lượng và làm tròn cửa sổ ngắn; probe sức khỏe/hành trình tổng hợp bổ sung số đo yêu cầu.

Mỗi luồng ghi nên mang correlation ID vào log ứng dụng/worker làm sạch. Phản hồi công khai không chứa thông tin xác thực, địa chỉ, token hoặc lỗi provider thô. Có dashboard/alarm trong IaC; telemetry nghiệp vụ và chứng minh nhận cảnh báo còn cần nghiệm thu. Đăng ký email SNS đang chờ không là kênh cảnh báo vận hành.

<a id="failure-and-recovery-playbook"></a>
## Quy trình lỗi và khôi phục

| Lỗi | Hành vi nghiệp vụ mong đợi | Diễn tập |
| --- | --- | --- |
| Email không khả dụng | Giữ đơn xác nhận; thử lại giới hạn và lỗi cuối nhìn thấy | Tiêm lỗi provider, đối soát lần gửi |
| Gợi ý không khả dụng | Ẩn/dự phòng danh mục xác minh; giỏ/checkout độc lập | Tắt phụ thuộc khi mua |
| PostgreSQL không khả dụng | Không báo đơn thành công giả; lỗi có hướng xử lý, đối soát thử lại chưa rõ | Ngắt cô lập, khôi phục, thử lại cùng thao tác |
| Redis không khả dụng | Không giả mọi workflow vẫn chạy; xác định ghi/khóa/sự kiện lỗi, giữ tính đúng | Lỗi cô lập với probe danh mục/checkout/worker |
| Task API chết | ALB chuyển target khỏe nếu còn task khác; nền một task có thể gián đoạn | Dừng task cô lập, đo phục hồi |
| Hết tồn trong chiến dịch | Từ chối/đối soát mua không khả dụng, không âm tồn bán được | Cạnh tranh đơn vị cuối |
| Phát hành lỗi | Quay digest ứng dụng tương thích, giữ dữ liệu và dấu vết | Diễn tập bản trước với tương thích schema |
| Mất/hỏng DB | Khôi phục sao lưu sang DB cô lập MỚI, kiểm tra rồi lập chuyển đổi có kiểm soát | Đo mục tiêu RPO <=60 phút, RTO <=120 phút |

Mục tiêu khôi phục chỉ là mục tiêu đến khi diễn tập đạt. Sao lưu DB không sao lưu ảnh S3; giữ versioning bucket và thử khôi phục đúng đối tượng riêng. RDS Single-AZ và một máy Redis là điểm lỗi MVP chấp nhận được, không khẳng định sẵn sàng cao.

<a id="capacity-and-cost-contract"></a>
## Hợp đồng năng lực và chi phí

Trần thiết kế tạm tính USD100/tháng cho demo theo lịch, chờ nhóm/chủ dự án duyệt ngân sách. Không là quyền chi hoặc dự báo xác minh. Theo dõi tổng chi, không chỉ tín dụng khuyến mãi còn lại. Ghi giờ dịch vụ, lưu trữ giữ lại, uptime ALB, IPv4 công khai, yêu cầu/truyền, log, snapshot và chồng lấn triển khai.

[Mô hình chi phí lịch sử](../../deploy/cloudformation/cost-estimate.json) ước khoảng USD168/tháng nếu luôn chạy, chưa gồm biến phí, theo giá tháng 10. Mô hình đã cũ, không giải thích hóa đơn tháng hiện tại. Lập lịch compute chỉ có thể vừa ngân sách thấp hơn khi kiểm chứng vòng đời/chi phí thực. Cập nhật giá/hóa đơn vùng chọn trước cấp tài nguyên; nếu vượt trần, giảm giờ hoặc yêu cầu quyết định ngân sách giới hạn. Không âm thầm thu nhỏ nghiệm thu hoặc khẳng định sẵn sàng 24/7.

API giới hạn hai task; storefront/worker cố định. Ở tải 5x đo mọi tầng trước nâng giới hạn. Ở 10x tìm điểm bão hòa và từ chối/khôi phục có kiểm soát. Cache/ảnh, connection pool DB và bản sao storefront là điểm quyết định rõ; không mặc định thêm Redis read replica/CDN/tìm kiếm riêng. Ưu tiên nhất quán lõi thương mại.

<a id="runbook-and-evidence-discipline"></a>
## Kỷ luật hướng dẫn vận hành và bằng chứng

Dùng [deploy/RUNBOOK.md](../../deploy/RUNBOOK.md), [hướng dẫn CloudFormation](../../deploy/cloudformation/README.md) cho lệnh chính xác. Tài nguyên vùng ở ap-southeast-2, profile aws-project. Tôn trọng cấu hình riêng, tài nguyên có sẵn và lease demo hữu hạn. Pause giữ ALB tính phí; hibernate bỏ app stack, không bỏ lưu trữ giữ lại. Không xóa foundation/dữ liệu như dọn dẹp thường lệ.

Lưu lần chạy làm sạch ở `docs/report/evidence/<run-id>/`: phiên bản nguồn, môi trường/cấu hình không bí mật, phiên bản dữ liệu, lệnh, kết quả thô, ngưỡng, đối soát, chi phí và kết luận. Giữ bằng chứng theo ngày bất biến; đặc tả mới không biến thử cũ thành nghiệm thu mới. Không gọi hệ thống khỏe chỉ từ endpoint liveness.
