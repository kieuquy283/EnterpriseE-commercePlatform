<a id="daymark-storefront-design"></a>
# Hệ thống thiết kế storefront DAYMARK

Người yêu cầu dự án đã phê duyệt hình ảnh ngày 15 tháng 11 năm 2026 trong [nhận diện DAYMARK](../brand/README.md#approval--15-november-2026). Phê duyệt này không bao gồm chính sách nghiệp vụ hoặc triển khai hệ thống.

Storefront theo hướng biên tập thời trang tràn chiều ngang đã được duyệt. Bố cục hero trang chủ và điều hướng sử dụng biểu tượng chim én SVG. Thiết kế phục vụ duyệt/khám phá (FR-02, REC-01), giỏ hàng/mua hàng (FR-03–FR-05) và tài khoản/lịch sử riêng (FR-01, FR-07). Medusa sở hữu dữ liệu thương mại; Next.js sở hữu ứng dụng khách hàng.

<a id="composition"></a>
## Bố cục

Trang chủ gồm hero chia vùng, lời giới thiệu thương hiệu ngắn hai cột, ba ảnh bộ sưu tập liền nhau tràn khung, một nhóm sản phẩm tuyển chọn và lời mời kết thúc màu ô liu trầm. Không lặp dải sản phẩm bộ sưu tập hoặc số thứ tự trang trí. Gợi ý cá nhân chỉ hiển thị khi có sự đồng ý và có kết quả.

Trang bộ sưu tập ghép chữ in hoa lớn, giản dị với ảnh quần áo tràn khung. Trang cửa hàng/tìm kiếm/danh mục có tiêu đề thoáng, điều khiển khám phá/sắp xếp nằm ngang và lưới sản phẩm toàn chiều rộng: hai cột trên di động, bốn cột trên máy tính. Chi tiết sản phẩm dùng cột ảnh lớn không khung, cột mua riêng và thông tin chi tiết căn dưới cột mua. Gợi ý liên quan dùng cùng kiểu chữ và lưới sản phẩm.

Giỏ hàng và checkout dùng mặt phẳng tóm tắt màu ngà cạnh luồng chính. Điều hướng tài khoản có đường kẻ phân cách; đăng nhập ghép lời giới thiệu thoáng với biểu mẫu, hồ sơ và đơn gần đây dùng các hàng. Xác nhận có tiêu đề lớn và vùng tổng tiền riêng. Kết quả rỗng dùng khoảng trống và đường kẻ; lỗi dùng thông báo rõ cùng đường kẻ đầu đậm; khung chờ đứng yên.

<a id="primitives"></a>
## Thành phần cơ bản

`src/styles/globals.css` định nghĩa vai trò ngữ nghĩa cho màu ngà, than và ô liu trầm. Inter là phông dùng chung; tiêu đề lớn in hoa giản dị, nội dung viết kiểu câu. Đường kẻ mảnh tạo phân cấp, không dùng bóng. Nhãn phụ dễ đọc, viết kiểu câu thay vì chữ trang trí nhỏ giãn cách.

- `.dm-btn-*`: góc vuông, cao tối thiểu 48px; nút chính màu than, nút phụ viền và nút ghost tiết chế. CTA hero dùng cùng thành phần. Thuộc tính kích cỡ tương thích nhưng không tạo kiểu chữ hay khoảng đệm riêng theo trang.
- `.dm-link` và `.dm-action-link`: chữ gạch chân với vòng focus bàn phím rõ; hành động nội tuyến có vùng tương tác 48px. Mũi tên điều hướng dùng biểu tượng 16px giản dị, không bong bóng hay xoay.
- `.dm-field`, `.dm-label`, `.dm-hint`: trường góc vuông, nhãn cố định phía trên, liên kết trợ giúp/lỗi rõ ràng. Điều khiển hiện mật khẩu có tên truy cập. Select gốc và điều khiển số lượng dùng cùng hình học trường. `.dm-choice` mở rộng nút viền cho biến thể/bộ lọc/phân trang với một trạng thái pressed/current. `.dm-btn-icon` mở rộng nút ghost với vùng vuông 48px cho modal/menu/accordion. Giữ ngữ nghĩa gốc và trạng thái nhấn.
- `.dm-card`, `.dm-panel`: bề mặt trong suốt có đường kẻ cấu trúc. Vùng tóm tắt dùng vai trò bề mặt tường minh, không bọc mọi khối trong thẻ.
- `.dm-alert-*`: chữ và đường kẻ đầu; vai trò và lời thông báo truyền đạt kết quả mà không phụ thuộc màu. Nhãn trạng thái gọn, vuông và tiết chế.
- `.dm-skeleton`: khung chờ trung tính đứng yên. Vùng ảnh sản phẩm góc vuông, không viền trang trí.

Điều hướng, hành động, biểu mẫu và phản hồi dùng tiếng Việt; tên bộ sưu tập/sản phẩm có thể bằng tiếng Anh. Giữ nhãn, chỉ báo focus, tiêu đề ngữ nghĩa, cấu trúc danh sách, selector kiểm thử và xử lý Escape/khôi phục focus của menu di động.

<a id="motion"></a>
## Chuyển động

Không dùng hiệu ứng xuất hiện toàn trang hoặc phát lại theo pathname. Điều khiển giỏ hàng, checkout, tài khoản, đơn hàng, tìm kiếm và mua sản phẩm đứng yên.

Motion 14.14.0 chỉ dùng cho hai bố cục trang chủ trong `editorial-motion`:

- Tiêu đề phần giới thiệu dịch ngang 18px về vị trí; nội dung phụ dịch từ hướng đối diện 12px, thời lượng độc lập 650/800ms.
- Ảnh bộ sưu tập thu tỷ lệ từ 1.045 về 1 trong khung trong 1,1 giây, lệch nhau 90ms. Liên kết và chú thích đứng yên.

Cả hai chỉ tăng cường khi xuất hiện một lần mỗi lần mount, không ẩn bằng opacity, chiếm cuộn hoặc trì hoãn mua hàng. Người chọn giảm chuyển động bỏ qua cả hai. Nội dung server trang chủ hiển thị được khi không có JavaScript; `skeleton-page` là mẫu khung chờ tái sử dụng. Giữ fallback tải sản phẩm theo vùng. Trang chủ mount mới có thể chạy lại hiệu ứng; cuộn ngược trong cùng lần mount không phát lại.

<a id="commerce-and-limits"></a>
## Ranh giới thương mại và nội dung

Truy cập thương mại đi qua `src/lib/data` và SDK. Medusa sở hữu giá, giảm giá, tiền tệ, vận chuyển, tồn kho, thanh toán và kết quả đơn. Chọn biến thể qua URL dùng native history.

Ảnh quần áo minh họa tinh thần bộ sưu tập. Ảnh đại diện trong danh mục xem thử cục bộ đi qua Medusa local file provider; không chứng minh sản phẩm hoặc màu biến thể chính xác. Nội dung production đi qua provider Medusa được cấu hình và proxy S3 riêng. Số đo kích cỡ thực tế còn thiếu. Truy vấn danh mục công khai dùng thời hạn kiểm tra lại 60 giây và sắp xếp giá trên toàn bộ kết quả khớp. Thao tác email/mật khẩu chưa khả dụng phải phản hồi đúng thực tế. Vận hành production, xử lý giao hàng của nhân viên, thu COD và gửi thông báo cần nghiệm thu riêng.
