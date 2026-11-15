# Đối chiếu yêu cầu nghiệp vụ và triển khai

[Tài liệu nghiệp vụ](../README.md#primary-business-first-specification) định nghĩa người dùng, quy tắc, yêu cầu và tiêu chí chấp nhận. [Tài liệu kỹ thuật](README.md) mô tả cách DAYMARK đáp ứng các yêu cầu đó bằng thành phần, dữ liệu, API, kiểm thử và vận hành.

## Chín nhóm chức năng bắt buộc

| Chức năng | Mã trong đặc tả nghiệp vụ | Luồng triển khai và kiểm thử |
| --- | --- | --- |
| Đăng ký và đăng nhập | P1-UC01; FR-AUTH | FR-01 / FLOW-01 |
| Danh mục và tìm kiếm | P1-UC02; FR-CAT | FR-02 / FLOW-02 |
| Giỏ hàng | P1-UC03; FR-CART | FR-03 / FLOW-03 |
| Checkout và tạo đơn | P1-UC04; FR-CHK | FR-04 / FLOW-04 |
| Thanh toán | P1-UC05; FR-PAY | FR-05 / FLOW-05 |
| Tồn kho | P1-UC06; FR-INV | FR-06 / FLOW-06 |
| Theo dõi đơn | P1-UC07; FR-ORD | FR-07 / FLOW-07 |
| Thông báo | P1-UC08; FR-NOT | FR-08 / FLOW-08 |
| Quản trị và báo cáo | P1-UC09; FR-ADM | FR-09 / FLOW-09 |

Mỗi thay đổi chức năng phải chỉ ra mã yêu cầu, luồng, thành phần chịu trách nhiệm và phép kiểm tra kết quả. Một route hoặc một thành phần có sẵn không tự chứng minh yêu cầu đã được nghiệm thu.

## Ranh giới triển khai

Medusa quản lý nghiệp vụ thương mại dưới dạng ứng dụng mô đun, chạy theo vai trò API/Admin và worker. Next.js phục vụ giao diện khách hàng. PostgreSQL giữ dữ liệu giao dịch, Redis phục vụ điều phối/cache, S3 giữ nội dung media theo [thiết kế kỹ thuật](../spec/03-architecture.md). Thành phần trên sơ đồ logic thể hiện trách nhiệm, không mặc định là dịch vụ triển khai riêng.

Gợi ý sản phẩm là chức năng mở rộng theo `FR-REC-01/02`; cần đánh giá chất lượng, quyền sử dụng dữ liệu, khả năng bán của sản phẩm và cơ chế giảm cấp. Lỗi gợi ý không được chặn mua hàng. Quy tắc khuyến mại, đổi/trả, truy cập đơn của khách vãng lai và quyền nhân viên phải tuân theo đặc tả nghiệp vụ tương ứng.

## Đối chiếu yêu cầu chất lượng

Mỗi chỉ tiêu cần xác định môi trường, tải đầu vào, mẫu số, cửa sổ đo, ngưỡng đạt và phép đối soát nghiệp vụ. [Tình huống chất lượng](../03-requirements/quality-attribute-scenarios.md) nêu ý định nghiệp vụ; [kế hoạch kiểm thử](../spec/05-testing.md) xác định cách thực hiện.

Tỷ lệ yêu cầu hợp lệ được phục vụ thành công trong tháng và tỷ lệ lần dò khả dụng trong cửa sổ demo là hai SLI khác nhau. Không dùng cùng một tỷ lệ 99,5% để khẳng định chúng tương đương. Kế hoạch nghiệm thu phải ghi rõ chỉ tiêu nào được đo và lịch phục vụ áp dụng.

Thay đổi stack, cơ sở dữ liệu hoặc triển khai AWS cần quyết định kỹ thuật với lợi ích, chi phí, ảnh hưởng dữ liệu, cách kiểm chứng và đường quay lại. Không thay đổi yêu cầu nghiệp vụ chỉ để phù hợp với giới hạn của mã nguồn.
