# ĐỊNH NGHĨA DỰ ÁN

> Cập nhật cloud ngày 09/11/2026: baseline đã chọn là ALB/ACM + ECS Fargate (storefront/API/worker), private RDS, Redis trên EC2 và private S3 qua backend proxy. Single-EC2/Compose là rehearsal/fallback, không còn là đích cloud chính. Xem [ADR](architecture/adr/0001-aws-cloud-stack.md), [runbook](../deploy/RUNBOOK.md) và [14 public checks](report/aws-fargate-deployment-2026-11-08.md). Các mục tiêu chưa có bằng chứng vẫn giữ trạng thái chưa nghiệm thu.

## 1. Tóm tắt điều hành

Enterprise E-commerce Platform là website bán hàng cho một cửa hàng bán lẻ giả định ở Việt Nam. Khách có thể tìm sản phẩm, thêm vào giỏ, chọn cách giao hàng, đặt hàng và xem lại đơn. Dự án tập trung vào việc đặt hàng chính xác, không bán vượt số hàng có sẵn, xử lý an toàn khi khách bấm đặt hàng nhiều lần, bảo vệ tài khoản và vận hành hệ thống với chi phí phù hợp.

Hệ thống dùng Medusa v2 để quản lý sản phẩm, giỏ hàng và đơn hàng; Next.js hiển thị website cho khách; PostgreSQL lưu dữ liệu và Redis hỗ trợ xử lý nhanh, xử lý công việc nền. Luồng mua hàng và một số bài kiểm thử đã có. Việc gửi thông báo, chống tạo đơn trùng trong mọi tình huống, kiểm thử trên máy chủ cloud, theo dõi sự cố và khôi phục dữ liệu vẫn cần hoàn thiện. Dữ liệu H&M và chức năng gợi ý sản phẩm là phần mở rộng; cần kiểm tra quyền sử dụng dữ liệu trước khi đưa vào bản demo công khai.


## 2. Bối cảnh và vấn đề cần giải quyết

### 2.1 Bối cảnh và khách hàng mục tiêu

Một nhà bán lẻ quy mô vừa cần vận hành kênh bán hàng trực tuyến liên tục, cho phép khách duyệt sản phẩm và đặt hàng, đồng thời bảo đảm các hoạt động quản lý sản phẩm, tồn kho, đơn hàng và chăm sóc khách hàng có thể kiểm soát. Trong phạm vi đồ án, doanh nghiệp là giả định; chưa có doanh nghiệp tài trợ, số liệu traffic/sales thực tế hay hợp đồng SLA.

### 2.2 Vấn đề kinh doanh

Để bán hàng trực tuyến ổn định, cửa hàng cần giải quyết những vấn đề sau:

| **Mã** | **Vấn đề** | **Hệ quả nếu không xử lý** |
| --- | --- | --- |
| BP-01 | Thông tin sản phẩm, giá bán và số lượng còn trong kho không khớp nhau. | Khách có thể đặt hàng đã hết hoặc thấy giá sai; cửa hàng phải hủy đơn và mất uy tín. |
| BP-02 | Quá trình đặt hàng có nhiều bước; khách có thể gặp lỗi hoặc bấm gửi lại. | Một lần mua có thể tạo nhiều đơn, ghi nhận thanh toán sai hoặc giữ sai số lượng hàng trong kho. |
| BP-03 | Việc gửi email và các việc phụ khác làm chậm bước đặt hàng. | Khách phải chờ lâu; nếu gửi email lỗi, việc đặt hàng cũng có thể bị ảnh hưởng. |
| BP-04 | Cửa hàng khó biết khi nào hệ thống lỗi hoặc chạy chậm. | Sự cố kéo dài mà không được phát hiện và xử lý kịp thời. |
| BP-05 | Việc đưa phiên bản mới lên hệ thống phụ thuộc nhiều vào thao tác thủ công. | Dễ sai cấu hình hoặc dữ liệu; khó quay lại phiên bản ổn định khi có sự cố. |
| BP-06 | Nhiều khách cùng xem và tìm sản phẩm, nhất là khi có khuyến mại. | Trang sản phẩm và tìm kiếm có thể chậm hoặc không truy cập được, khiến cửa hàng mất cơ hội bán hàng. |

### 2.3 Tóm tắt vấn đề cần giải quyết

Một cửa hàng bán lẻ trực tuyến giả định cần hệ thống đặt hàng đáng tin cậy. Dù khách bấm gửi lại, dịch vụ hỗ trợ gặp lỗi hoặc nhiều người truy cập cùng lúc, giỏ hàng, thanh toán, đơn hàng và số lượng hàng trong kho vẫn phải khớp nhau. Người dùng gồm khách mua hàng, nhân viên vận hành và quản trị viên. Mục tiêu là khách mua được hàng từ đầu đến cuối; nhóm có thể kiểm tra lại từng bước và đo được mức an toàn, tốc độ, khả năng khôi phục và chi phí trên môi trường thử nghiệm cloud.

## 3. Tầm nhìn, giá trị và mục tiêu

### 3.1 Tầm nhìn

Xây dựng phiên bản bán hàng đầu tiên có thể trình diễn và kiểm chứng: đủ gọn để nhóm sinh viên vận hành, nhưng vẫn có quy tắc rõ ràng cho việc đặt hàng, kiểm thử, đưa phiên bản mới lên máy chủ và lưu bằng chứng kết quả.

### 3.2 Kết quả mong muốn (giả định để thiết kế)

- Khách có thể tìm sản phẩm, mua hàng và xem đơn trong cùng một website; hệ thống không báo đặt hàng thành công khi thực tế chưa có đơn.
- Nhân viên xem và quản lý sản phẩm, giá, giỏ hàng, đơn hàng, tồn kho và trạng thái thanh toán từ dữ liệu do Medusa quản lý.
- Nếu gửi thông báo, tìm kiếm hoặc bộ nhớ đệm gặp lỗi, hệ thống không được tạo đơn sai. Cách xử lý khi các dịch vụ này hỏng cần được quy định và kiểm thử.
- Nhóm có thể tự động kiểm tra mã nguồn, triển khai, khôi phục dữ liệu và đo tốc độ trên môi trường thử nghiệm trước khi trình diễn.

### 3.3 Mục tiêu có thể kiểm tra

| **ID** | **Mục tiêu và tiêu chí xác nhận** | **Hiện trạng ở baseline** |
| --- | --- | --- |
| OBJ-01 | Trình diễn đầy đủ: tìm sản phẩm → xem chi tiết → thêm giỏ → đặt hàng → xem lại đơn; lặp lại bài thử trên môi trường cloud thử nghiệm. | Luồng mua hàng và bài kiểm thử backend đã có; chưa xác minh toàn bộ trên cloud. |
| OBJ-02 | Thanh toán lỗi không tạo đơn; bấm đặt hàng lại không tạo nhiều đơn; thử khi hai yêu cầu đến cùng lúc. | Đã thử thanh toán lỗi; chưa thử đủ trường hợp gửi lặp và cùng lúc. |
| OBJ-03 | Số hàng giữ cho đơn và liên kết giỏ–đơn phải đúng; thử khi hai khách cùng đặt lúc sắp hết hàng. | Có kết quả local 24/24 bước kiểm tra cho một đơn; chưa thử nhiều đơn cùng lúc. |
| OBJ-04 | Gửi thông báo sau khi đã tạo đơn; lỗi email không hủy đơn và số lần gửi lại có giới hạn. | Redis/tiến trình nền đã cấu hình; chưa có chức năng thông báo hoàn chỉnh. |
| OBJ-05 | Khi thử 30 yêu cầu xem sản phẩm mỗi giây trong 10 phút, 95% phản hồi dưới 600 ms và dưới 1% bị lỗi. | Có kịch bản và mức mục tiêu; chưa có báo cáo đo thực tế. |
| OBJ-06 | Khi thử 3 yêu cầu đặt hàng mỗi giây trong 5 phút, 95% bước cuối phản hồi dưới 1.500 ms và dưới 1% bị lỗi. | Có kịch bản và mức mục tiêu; chưa có kết quả đo tải. |
| OBJ-07 | Môi trường cloud thử nghiệm dùng HTTPS; có kết quả triển khai, theo dõi lỗi và diễn tập quay lại bản cũ. | AWS Fargate đã qua 14 public checks ngày 09/11; restore, rollback và đo tải vẫn chưa được nghiệm thu. |
| OBJ-08 | Thử sao lưu/khôi phục: mục tiêu mất không quá 60 phút dữ liệu và khôi phục trong 120 phút. | Mới có mục tiêu trong hướng dẫn; chưa diễn tập. |

Lưu ý: Nhóm phải chốt mức thời gian hoạt động mong muốn và ngân sách sau khi đo thử và chọn nơi thuê máy chủ. Với một máy chủ, không thể hứa hệ thống luôn hoạt động khi máy hỏng. Mục tiêu thời gian hoạt động chỉ áp dụng cho môi trường demo/thử nghiệm và phải ghi rõ cách đo.

## 4. Những người liên quan và điều họ cần

| **Nhóm người** | **Vai trò** | **Điều họ cần** | **Ai xem lại kết quả** |
| --- | --- | --- | --- |
| Khách mua hàng | Dùng website và sở hữu dữ liệu giỏ, đơn của mình. | Tìm hàng, thấy đúng giá, đặt và xem đơn, được bảo vệ thông tin. | Nhóm kiểm thử kiểm tra hành trình mua hàng giả định. |
| Nhân viên cửa hàng | Xử lý đơn, tồn kho và giao hàng. | Xem trạng thái đơn, số hàng còn và thao tác đúng quyền. | Xem lại quy trình xử lý, giao hàng. |
| Quản trị viên | Quản lý cửa hàng và tài khoản nhân viên. | Quản lý sản phẩm, giá, kho và đơn. | Duyệt quy tắc bán hàng giả định. |
| Trưởng nhóm | Quyết định việc cần làm trước, tiến độ và thay đổi phạm vi. | Biết mốc bàn giao và khi nào chức năng được nghiệm thu. | Giữ tài liệu và các quyết định của nhóm. |
| Nhóm backend | Xây phần Medusa, thanh toán, tồn kho và việc nền. | Xử lý đơn chính xác, mã nguồn dễ bảo trì. | Rà yêu cầu bán hàng và cách dữ liệu được quản lý. |
| Nhóm frontend | Xây website Next.js cho khách. | Giao diện dễ dùng, báo lỗi rõ, kết nối đúng API. | Rà hành trình mua hàng trên website. |
| Nhóm cloud/vận hành | Quản lý máy chủ, triển khai, nhật ký và sao lưu. | Theo dõi sự cố, chi phí và an toàn khi đưa bản mới lên hệ thống. | Rà chỉ tiêu chất lượng và quy trình vận hành. |
| Nhóm kiểm thử | Thiết kế bài thử và lưu kết quả. | Có thể chạy lại bài thử và đối chiếu với từng yêu cầu. | Xác nhận kết quả kiểm thử. |
| Giảng viên / hội đồng | Đánh giá đồ án theo học phần. | Hiểu vấn đề, yêu cầu, thiết kế và bằng chứng kết quả. | Góp ý và nghiệm thu sản phẩm bàn giao. |

Các nhóm trên là vai trò dự kiến, chưa gán tên người cụ thể. Dự án không có doanh nghiệp khách hàng xác nhận chính thức; các quy tắc bán hàng cần được nhóm và giảng viên xem lại trước khi chốt.

## 5. Hệ thống cần làm gì

| **Công việc** | **Kết quả mong muốn** | **Nơi quản lý dữ liệu** |
| --- | --- | --- |
| Tài khoản và quyền truy cập | Khách và nhân viên đăng nhập, chỉ xem và sửa dữ liệu được phép. | Medusa Auth / Customer / Admin |
| Sản phẩm | Quản lý sản phẩm, lựa chọn của sản phẩm, giá VND và việc sản phẩm có được bán hay không. | Medusa Product / Pricing / Sales Channel |
| Mua hàng | Khách tạo giỏ, chọn giao hàng và thanh toán, rồi nhận đơn hợp lệ. | Medusa Cart / Payment / Order |
| Tồn kho và giao hàng | Theo dõi số hàng còn lại, số hàng đã giữ cho đơn và tiến độ xử lý đơn. | Medusa Inventory / Fulfillment |
| Liên lạc với khách | Gửi thông báo sau khi đặt hàng, không bắt khách chờ email gửi xong. | Phần mở rộng thông báo của Medusa (dự kiến) |
| Vận hành | Kiểm tra mã nguồn, theo dõi lỗi, sao lưu và khôi phục dữ liệu, kiểm soát chi phí. | GitHub Actions / Compose / công cụ cloud (mục tiêu) |

Hành trình mua hàng: đăng ký/đăng nhập (hoặc mua không cần tài khoản) → tìm sản phẩm → chọn sản phẩm và phiên bản → thêm vào giỏ → nhập địa chỉ, chọn giao hàng → chọn COD hoặc thanh toán mô phỏng khi được bật → đặt hàng → nhận mã đơn → xem lại đơn. Medusa quyết định tổng tiền, quyền truy cập và số hàng còn lại; Next.js chỉ hiển thị và chuyển yêu cầu của khách. [SRC-03, SRC-06]

## 6. Yêu cầu về chất lượng và giới hạn thiết kế

| **Đặc tính** | **Diễn giải cho MVP** | **Giới hạn có chủ đích** |
| --- | --- | --- |
| Dữ liệu chính xác | Kiểm tra rằng thanh toán lỗi không tạo đơn hoặc làm sai tồn kho; Medusa chịu trách nhiệm về giao dịch mua hàng. | Không tự xây hệ thống xử lý giao dịch thay Medusa. |
| Chịu tải | Đo tốc độ xem sản phẩm và đặt hàng khi nhiều người truy cập; tìm bước gây chậm. | Một máy chủ không đủ cơ sở để hứa tự mở rộng hoặc luôn sẵn sàng. |
| Chịu sự cố | Gửi thông báo ở bước xử lý nền; có cách khởi động lại, sao lưu và khôi phục dữ liệu. | Không hứa hệ thống không bao giờ gián đoạn hoặc không mất phút dữ liệu nào. |
| Bảo mật | Kiểm tra quyền ở máy chủ, giữ bí mật thông tin đăng nhập và dùng HTTPS. | Không tuyên bố đã có chứng nhận bảo mật chuyên ngành. |
| Kiểm tra lại được | Lưu nhật ký, kết quả kiểm thử và quyết định quan trọng để truy nguyên sự cố. | Chỉ giữ dữ liệu cần thiết trong thời gian phù hợp. |
| Chi phí phù hợp | Chọn máy chủ và dịch vụ dựa trên ngân sách cùng lượng truy cập đo được. | Không dùng dịch vụ đắt tiền khi chưa có nhu cầu. |

## 7. Phạm vi dự án nhìn từ tổng thể

| **Phải có trong phiên bản đầu** | **Có thể làm thêm** | **Không làm trong đồ án** |
| --- | --- | --- |
| Đăng nhập, danh sách sản phẩm, tìm kiếm từ khóa, trang chi tiết và lựa chọn sản phẩm | Công cụ tìm kiếm nâng cao nếu kết quả đo cho thấy cần | Chợ bán hàng cho nhiều người bán hoặc nhiều doanh nghiệp |
| Giỏ hàng, đặt hàng, xem đơn | Gợi ý sản phẩm từ H&M sau khi luồng mua hàng ổn định | Nhận tiền thật qua ngân hàng/thẻ |
| COD và thanh toán mô phỏng an toàn ở môi trường thử nghiệm | Báo cáo kinh doanh nâng cao | Hệ thống quản trị doanh nghiệp, kho và khách hàng đầy đủ |
| Quản lý tồn kho; thử thanh toán lỗi và bấm đặt hàng lặp | Nhiều kho hoặc cách phân phối ảnh nhanh hơn nếu được duyệt | Hoạt động ở nhiều vùng địa lý cùng lúc |
| Gửi thông báo sau khi tạo đơn; thiết kế cách lưu tạm và lưu ảnh | Công cụ gợi ý nâng cao sau khi có dữ liệu phù hợp | Cam kết hệ thống hoạt động liên tục 24/7 |
| Triển khai cloud thử nghiệm, tự kiểm mã nguồn, theo dõi lỗi, sao lưu/khôi phục | Tự tăng máy chủ hoặc thuê dịch vụ dữ liệu theo ngân sách | Công khai ảnh hoặc dữ liệu H&M chưa có quyền sử dụng |

Bảng trên là phạm vi nhóm dự định thực hiện theo học phần, không có nghĩa mọi chức năng đã hoàn thành. Quy tắc, lịch và giả định được trình bày trong tài liệu Phạm vi dự án và các giả định (PS-02).

## 8. Lượng truy cập dự kiến để thử nghiệm và các giả định

| **Khía cạnh** | **Định nghĩa tạm thời / ràng buộc** |
| --- | --- |
| Khu vực bán hàng | Chỉ Việt Nam, giá bằng VND, một kênh bán và một kho mẫu; chưa cần bán ở nhiều quốc gia. |
| Lượng truy cập thử nghiệm | Mục tiêu thử 30 yêu cầu xem sản phẩm/giây và 3 yêu cầu đặt hàng/giây bằng k6. Đây là mức để kiểm thử, không phải dự báo khách thật. |
| Nơi chạy hệ thống | ALB/ACM và ba ECS Fargate service; RDS PostgreSQL Single-AZ, Redis EC2, private S3 proxy, CloudWatch và CloudFormation. EC2/Compose/Caddy là fallback đã thử ngày 06/11. |
| Thanh toán | COD là trả tiền khi nhận hàng; công cụ mô phỏng chỉ dùng ngoài môi trường thật và không thu tiền. |
| Dữ liệu và ảnh | PostgreSQL lưu dữ liệu mua hàng; Redis hỗ trợ tăng tốc và xử lý nền. Ảnh sản phẩm dùng private S3 và backend proxy; quyền sử dụng ảnh/dữ liệu H&M vẫn cần xác nhận riêng. |
| Quyền riêng tư | Không đưa mật khẩu bí mật, mã đăng nhập, dữ liệu cá nhân hay dữ liệu H&M gốc lên Git. |
| Nhân lực | Nhóm dự kiến 5–7 sinh viên; cần phân công theo thời gian thực tế của từng người. |

## 9. Rủi ro và việc cần quyết định

| **Risk ID** | **Rủi ro / ảnh hưởng** | **Ứng phó & owner đề xuất** |
| --- | --- | --- |
| R-01 | Khách bấm đặt hàng lặp hoặc nhiều người mua cùng món hàng cuối cùng (cao). | Nhóm backend và kiểm thử thử các yêu cầu đến cùng lúc, đối chiếu đơn và số hàng còn. |
| R-02 | PostgreSQL từng hết chỗ cho các kết nối trên máy cá nhân (cao). | Theo dõi số kết nối, giới hạn công việc nhập dữ liệu chạy cùng lúc. |
| R-03 | Dịch vụ gửi thông báo lỗi (trung bình). | Gửi lại có giới hạn ở bước xử lý nền; lỗi email không hủy đơn. |
| R-04 | Một máy chủ hỏng có thể làm hệ thống ngừng hoặc mất dữ liệu (cao). | Sao lưu, diễn tập khôi phục và ghi rõ thời gian, lượng dữ liệu có thể mất. |
| R-05 | Đã có smoke cloud, nhưng chưa có kết quả tải, scaling và restore để trình bày (cao). | Chạy thử trên cloud, lưu báo cáo k6, ảnh màn hình và nhật ký. |
| R-06 | Làm gợi ý/tìm kiếm nâng cao quá sớm khiến phần mua hàng chính chậm tiến độ (trung bình). | Chỉ mở rộng sau khi hoàn thành việc bắt buộc. |
| R-07 | Chưa xác nhận quyền công khai dữ liệu và ảnh H&M (cao). | Kiểm tra điều khoản; dùng ảnh thay thế có quyền sử dụng. |

Trước khi chốt phiên bản tài liệu 1.0, nhóm cần quyết định ngân sách cloud mỗi tháng, nơi chạy bản thử, mức thời gian hoạt động mong muốn, cách mô tả việc thu tiền trong demo, dịch vụ gửi thông báo, nơi lưu ảnh, việc dùng một kho có đủ hay không và có làm phần gợi ý sản phẩm không.

## 10. Các mốc công việc từ Tuần 4 đến Tuần 13

| **Mốc** | **Kết quả cần có** |
| --- | --- |
| Tuần 4–6 | Chốt thiết kế và yêu cầu bản đầu; hoàn thành đăng nhập, sản phẩm, đặt hàng và các bài kiểm thử liên quan. |
| Tuần 7 | Thử thanh toán thành công/thất bại, bấm đặt hàng lặp và kiểm tra tồn kho. |
| Tuần 8 | Gửi thông báo sau khi tạo đơn, thử gửi lại khi lỗi và theo dõi trạng thái đơn. |
| Tuần 9 | Kiểm tra tốc độ tải sản phẩm, tìm kiếm, nơi lưu ảnh và việc dữ liệu cập nhật đúng. |
| Tuần 10 | Triển khai lên cloud thử nghiệm, chạy kiểm tra tự động và diễn tập quay lại bản cũ. |
| Tuần 11 | Rà quyền truy cập, nhật ký, số liệu và cảnh báo. |
| Tuần 12 | Đo tải cao, thử sự cố/khôi phục, ghi thời gian mất dữ liệu và chi phí. |
| Tuần 13 | Ngừng thêm tính năng, đối chiếu yêu cầu với kết quả, hoàn thiện báo cáo và demo. |

## 11. Khi nào dự án đạt mục tiêu và cách quản lý thay đổi

Dự án chỉ được xem là đạt phiên bản đầu tiên của học phần khi: (a) khách đặt được hàng từ đầu đến cuối trên môi trường cloud thử nghiệm; (b) có kết quả kiểm tra thanh toán lỗi, đơn trùng và tồn kho; (c) thông báo, cách lưu tạm dữ liệu/ảnh và việc triển khai cloud được xác minh; (d) bảo mật và theo dõi lỗi cơ bản hoạt động; (e) có số đo k6 và kết quả diễn tập khôi phục; (f) mọi phần khác kế hoạch được ghi rõ. Đây là mục tiêu cần đạt, chưa phải kết luận dự án đã đạt.

Mỗi thay đổi phạm vi cần ghi mã, lý do, ảnh hưởng tới người dùng, yêu cầu, rủi ro, thời gian làm, hạn cuối, cách thử, người phụ trách và người duyệt. Nếu muốn đổi một việc bắt buộc, nhóm phải xem ảnh hưởng tới hạn Tuần 13. Yêu cầu chưa đạt cần ghi vào danh sách việc còn thiếu, không xóa khỏi tài liệu.

## Nguồn và căn cứ kiểm chứng

**[SRC-01]** Cloud Application Development – Course Project Topics, Project 1; tệp PDF do nhóm cung cấp. *— Tính năng bắt buộc, workload, cloud ops, architecture và NFR.*

**[SRC-02]** Kế hoạch triển khai Enterprise E-commerce Platform, Tuần 4–13; Pasted markdown do nhóm cung cấp. *— Mốc công việc và deliverables.*

**[SRC-03]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/tree/main (baseline d0bf45a). *— Source thực tế đã đối chiếu 02/11/2026.*

**[SRC-04]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/tree/recommendation (baseline a98457c). *— ETL, H&M importer và browser E2E chưa đồng bộ toàn bộ sang main.*

**[SRC-05]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/report/inventory-consistency-notes.md *— Evidence checkout/inventory một lần chạy, 24/24 checks.*

**[SRC-06]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/backend/integration-tests/http/checkout-order.spec.ts *— HTTP integration tests, payment simulator success/failure.*

**[SRC-07]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/deploy/RUNBOOK.md *— Runbook AWS Fargate; fallback EC2 riêng; RPO/RTO và restore drill chưa được chứng minh.*

**[SRC-08]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/actions/runs/41313753319 *— CI success tại main, 01/11/2026.*

**[SRC-09]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/actions/runs/41313753297 *— API tests success tại main, 01/11/2026.*

**[SRC-10]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/scripts/hm/README.md *— Bằng chứng được ghi trong repo về pilot H&M 500 products, 1.874 variants.*

Chú giải độ tin cậy: “đã có code” chỉ thể hiện trong repository; “đã kiểm thử” yêu cầu test/evidence; “đã nghiệm thu” yêu cầu đạt acceptance criteria trên môi trường và dữ liệu được ghi rõ. Các thông tin ở tài liệu nguồn cũ có thể lỗi thời so với commit baseline.
