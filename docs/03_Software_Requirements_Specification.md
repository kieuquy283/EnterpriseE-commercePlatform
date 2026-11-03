# YÊU CẦU PHẦN MỀM

## 1. Giới thiệu và phạm vi

### 1.1 Mục đích

Tài liệu SRS-03 ghi những việc hệ thống phải làm và cách kiểm tra từng việc. Tài liệu dành cho nhóm phát triển, nhóm kiểm thử, người vận hành và giảng viên. Đây là yêu cầu cho phiên bản đầu tiên của đồ án; một chức năng được nêu ở đây chưa chắc đã hoàn thành.

### 1.2 Mã nguồn được dùng để đối chiếu và tình trạng tài liệu

Mã nguồn đã đối chiếu ngày 02/11/2026: `main` tại `d0bf45a` và nhánh `recommendation` tại `a98457c`. Dự án dùng Medusa 2.21.2, Next.js 15, PostgreSQL 16 và Redis 7. Bài kiểm tra tự động trên `main` đã chạy thành công ngày 01/11/2026. Nhánh `recommendation` có bài kiểm thử trình duyệt và dữ liệu H&M đã chuẩn bị, nhưng chưa chuyển hết sang `main`. [SRC-03..10]

SRS v1.0 là bản thảo để góp ý, chưa được các bên liên quan ký duyệt và chưa có kết quả chứng minh đạt mọi chỉ tiêu về tốc độ, độ ổn định. Nếu đổi quy tắc bán hàng, mức tải cần thử, thời gian hoạt động mong muốn hoặc ngân sách tháng, nhóm phải ghi lại quyết định. “Đã viết mã” và “đã kiểm thử, nghiệm thu” là hai tình trạng khác nhau.

### 1.3 Quy ước yêu cầu và thuật ngữ

| **Mã / thuật ngữ** | **Giải thích** |
| --- | --- |
| M / S / C | Bắt buộc / nên có / có thể làm thêm. |
| CODE / TEST / PARTIAL / GAP | Đã viết mã / đã có kết quả kiểm thử / mới làm một phần / chưa đủ mã nguồn hoặc bằng chứng. |
| Medusa | Phần mềm quản lý việc bán hàng: sản phẩm, giá, giỏ hàng, đơn hàng, tồn kho và thanh toán. |
| Storefront | Website khách hàng nhìn thấy, được xây bằng Next.js. Dữ liệu mua hàng chính nằm ở Medusa. |
| Đơn hàng và tiền đã thu | Có mã đơn hàng không có nghĩa cửa hàng đã nhận tiền, nhất là với thanh toán khi nhận hàng (COD). |
| RPS / p95 | Số yêu cầu hệ thống nhận trong một giây / thời gian mà 95% yêu cầu được xử lý không lâu hơn mức đó. |
| RPO / RTO | Số phút dữ liệu tối đa có thể mất / số phút tối đa dự kiến để khôi phục sau sự cố. |
| Chống xử lý trùng (idempotency) | Nếu cùng một thao tác được gửi lại, hệ thống không tạo thêm đơn hoặc thanh toán ngoài ý muốn. |
| Bằng chứng | Kết quả kiểm thử, nhật ký, ảnh màn hình hoặc bản ghi dữ liệu; cần ghi rõ phiên bản, ngày giờ và môi trường. |

## 2. Bối cảnh, người dùng và trách nhiệm

Sản phẩm mô phỏng một cửa hàng bán lẻ ở Việt Nam. Khách mua hàng dùng website Next.js; nhân viên và quản trị viên dùng giao diện Medusa Admin; nhóm kỹ thuật vận hành hệ thống. Website gửi yêu cầu đến Medusa qua API và kèm mã truy cập phù hợp. Medusa quản lý dữ liệu bán hàng trong PostgreSQL; Redis hỗ trợ tăng tốc và xử lý việc nền. Cấu hình đã có tiến trình xử lý nền riêng, nhưng chức năng thông báo của dự án chưa hoàn chỉnh. [SRC-03]

| **Thành phần** | **Trách nhiệm chính** | **Không chịu trách nhiệm** |
| --- | --- | --- |
| Trình duyệt / Next.js | Hiển thị trang, nhận thông tin khách nhập, giữ cookie đăng nhập/giỏ hàng và gửi yêu cầu đến Medusa. | Không tự quyết định đơn hàng, thanh toán hay tồn kho. |
| Medusa API/Admin | Kiểm tra quyền, quản lý sản phẩm, giá, giỏ, đơn, thanh toán và tồn kho. | Không cho website tự tạo đơn trực tiếp trong cơ sở dữ liệu. |
| Medusa Worker và Redis | Hỗ trợ lưu tạm dữ liệu, chuyển việc cần xử lý sau và khóa chống xung đột. | Không phải một bước HTTP mà khách phải chờ sau mỗi lần truy cập. |
| PostgreSQL | Lưu dữ liệu bán hàng chính và phần mở rộng nếu có. | Không biến lịch sử mua H&M gốc thành đơn hàng của dự án. |
| Nhóm vận hành cloud | Đưa ứng dụng lên máy chủ, dùng HTTPS, theo dõi lỗi, sao lưu và tính chi phí. | Một máy chủ không thể bảo đảm luôn hoạt động nếu chính máy đó hỏng. |

## 3. Các chức năng hệ thống cần có (FR)

Mỗi yêu cầu dưới đây có mã riêng để giao việc và kiểm thử. Bên dưới mã là quy tắc cần tuân theo, cách kiểm tra, tình trạng hiện nay và nguồn tham khảo. Nhóm cập nhật tình trạng sau mỗi lần kiểm thử. Nhãn “TEST” chỉ nói đã có một số kết quả kiểm tra, chưa có nghĩa mọi trường hợp đều đạt.

### 3.1 Tài khoản và quyền truy cập

#### FR-AUTH-01  [M]  Khách có thể đăng ký bằng email, mật khẩu và tạo hồ sơ cá nhân.

Quy tắc cần tuân theo: Email phải đúng dạng và chưa được dùng; Medusa xử lý mật khẩu.

Cách kiểm tra: Đăng ký bằng email mới, email đã dùng và email sai dạng; phản hồi không làm lộ mật khẩu hay khóa bí mật.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 5  |  **Nguồn hoặc việc cần kiểm tra:** Medusa auth/store routes; checkout integration

#### FR-AUTH-02  [M]  Khách có thể đăng nhập, đăng xuất; chỉ được cấp quyền truy cập sau khi đăng nhập đúng.

Quy tắc cần tuân theo: Máy chủ chỉ chấp nhận thông tin đăng nhập đúng và bảo vệ phiên đăng nhập.

Cách kiểm tra: Thử mật khẩu đúng/sai, đăng xuất rồi truy cập lại; không xem được đơn người khác.

**Trạng thái:** Đã có mã nguồn, chưa kiểm thử đầy đủ  |  **Tuần:** 5,11  |  **Nguồn hoặc việc cần kiểm tra:** Storefront auth flow; browser E2E trên recommendation

#### FR-AUTH-03  [M]  Khách chỉ được xem và sửa hồ sơ, địa chỉ, đơn hàng của mình.

Quy tắc cần tuân theo: Medusa kiểm tra quyền trên máy chủ, không chỉ ẩn nút trên website.

Cách kiểm tra: Dùng tài khoản A mở đơn của B; hệ thống phải từ chối và không lộ dữ liệu.

**Trạng thái:** Mới hoàn thành một phần  |  **Tuần:** 5,11  |  **Nguồn hoặc việc cần kiểm tra:** Store API and auth tests, bổ sung authz negative

#### FR-AUTH-04  [M]  Quản trị viên và nhân viên chỉ thao tác trong phạm vi quyền được cấp.

Quy tắc cần tuân theo: Mã đăng nhập của khách không được dùng để gọi chức năng quản trị.

Cách kiểm tra: Chưa đăng nhập không vào được Admin; tài khoản khách không làm được việc của quản trị viên.

**Trạng thái:** Đã có mã nguồn, chưa kiểm thử đầy đủ  |  **Tuần:** 5,11  |  **Nguồn hoặc việc cần kiểm tra:** Medusa Admin, cần RBAC review

### 3.2 Sản phẩm, tìm kiếm và giá bán

#### FR-CAT-01  [M]  Website hiển thị sản phẩm đang bán, chia trang và báo khi không có kết quả.

Quy tắc cần tuân theo: Chỉ bán sản phẩm được bật cho kênh bán và khu vực của khách.

Cách kiểm tra: Trang `/vn/store` chia kết quả thành các trang; hàng đã ngừng hiển thị không được bán.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 5  |  **Nguồn hoặc việc cần kiểm tra:** apps/storefront/src/modules/store/templates/index.tsx

#### FR-CAT-02  [M]  Trang chi tiết hiển thị thông tin, lựa chọn sản phẩm, giá và ảnh hợp lệ.

Quy tắc cần tuân theo: Không tự đoán kích cỡ hoặc số hàng còn lại nếu dữ liệu nguồn không có.

Cách kiểm tra: Trang chi tiết cho chọn phiên bản sản phẩm và hiển thị giá tại Việt Nam.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 5,9  |  **Nguồn hoặc việc cần kiểm tra:** Product UI & Medusa Store Product API

#### FR-CAT-03  [M]  Khách tìm sản phẩm bằng từ khóa và nhận kết quả phù hợp.

Quy tắc cần tuân theo: Giới hạn độ dài từ khóa và chia kết quả thành trang; chưa bắt buộc dùng công cụ tìm kiếm riêng.

Cách kiểm tra: Thử từ khóa có và không có kết quả; kiểm tra chuyển trang và thông báo lỗi.

**Trạng thái:** Đã có mã nguồn, chưa kiểm thử đầy đủ  |  **Tuần:** 5,9  |  **Nguồn hoặc việc cần kiểm tra:** /store/products?q, catalog route

#### FR-CAT-04  [M]  Website hiển thị giá VND do Medusa cung cấp, không tự quyết định giá bán.

Quy tắc cần tuân theo: Medusa quyết định giá và đơn vị tiền tệ.

Cách kiểm tra: Giá ở trang sản phẩm, giỏ và trang đặt hàng khớp Medusa; không nói giá H&M là giá bán VND thật.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 5–7  |  **Nguồn hoặc việc cần kiểm tra:** seed-commerce, storefront price helpers

#### FR-CAT-05  [S]  Danh mục, bộ lọc và cách sắp xếp phản ánh đúng sản phẩm đang có.

Quy tắc cần tuân theo: Không hiển thị danh mục rỗng như thể có hàng để bán.

Cách kiểm tra: Chọn danh mục, bộ lọc hoặc cách sắp xếp và đối chiếu kết quả sản phẩm.

**Trạng thái:** Mới hoàn thành một phần  |  **Tuần:** 5,9  |  **Nguồn hoặc việc cần kiểm tra:** Store templates, category components

### 3.3 Giỏ hàng

#### FR-CART-01  [M]  Khách có thể tạo hoặc tiếp tục giỏ hàng cho đúng khu vực bán hàng.

Quy tắc cần tuân theo: Medusa giữ dữ liệu giỏ; website chỉ giữ mã giỏ trong cookie.

Cách kiểm tra: Tạo giỏ mới, mở lại giỏ cũ và xác nhận hai tài khoản không bị lẫn giỏ.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 6  |  **Nguồn hoặc việc cần kiểm tra:** apps/storefront/src/lib/data/cart.ts

#### FR-CART-02  [M]  Khách có thể thêm hàng, đổi số lượng và xóa hàng khỏi giỏ.

Quy tắc cần tuân theo: Số lượng phải là số nguyên dương; Medusa kiểm tra giá và số hàng còn lại.

Cách kiểm tra: Thêm hàng, tăng lên 2, xóa hàng rồi kiểm tra giỏ rỗng và tổng tiền.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 6  |  **Nguồn hoặc việc cần kiểm tra:** Cart Store API, browser E2E trên recommendation

#### FR-CART-03  [M]  Giỏ hàng hiển thị giá, phí giao hàng, thuế và tổng tiền do Medusa trả về.

Quy tắc cần tuân theo: Website không giữ một bảng giá riêng để tự tính tiền.

Cách kiểm tra: Tổng tiền ở trang đặt hàng khớp số tiền Medusa trả về.

**Trạng thái:** Đã có mã nguồn, chưa kiểm thử đầy đủ  |  **Tuần:** 6  |  **Nguồn hoặc việc cần kiểm tra:** Cart/checkout pages, integration test

#### FR-CART-04  [M]  Hệ thống báo lỗi an toàn khi sản phẩm, số lượng hoặc tồn kho không hợp lệ.

Quy tắc cần tuân theo: Dữ liệu sai không được tạo món hàng lẻ không thuộc giỏ hoặc tạo đơn.

Cách kiểm tra: Gửi yêu cầu sai, kiểm tra thông báo lỗi và xem giỏ vẫn đúng.

**Trạng thái:** Mới hoàn thành một phần  |  **Tuần:** 6,7  |  **Nguồn hoặc việc cần kiểm tra:** Cần negative integration tests

### 3.4 Đặt hàng và tạo đơn

#### FR-CHK-01  [M]  Đặt hàng cần email, địa chỉ giao hàng, địa chỉ thanh toán và cách giao hàng hợp lệ.

Quy tắc cần tuân theo: Khách chỉ chọn được cách giao hàng do Medusa cung cấp.

Cách kiểm tra: Bỏ trống thông tin bắt buộc hoặc chọn cách giao hàng không hợp lệ; không được tạo đơn.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 6  |  **Nguồn hoặc việc cần kiểm tra:** Checkout components; integration test

#### FR-CHK-02  [M]  Hệ thống tạo phiên thanh toán bằng phương thức được Medusa cho phép.

Quy tắc cần tuân theo: Chỉ dùng phương thức thanh toán đã được Medusa bật; công cụ mô phỏng chỉ dùng khi thử nghiệm.

Cách kiểm tra: Thử phương thức thanh toán sai hoặc phiên thanh toán không hợp lệ; hệ thống phải từ chối.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 6,7  |  **Nguồn hoặc việc cần kiểm tra:** Store API /payment-collections

#### FR-CHK-03  [M]  Khi đặt hàng thành công, khách nhận mã đơn và trang xác nhận.

Quy tắc cần tuân theo: Chỉ báo thành công khi Medusa trả về `type=order` và mã đơn.

Cách kiểm tra: Đơn có đúng sản phẩm, số tiền và VND; khách mở lại được chi tiết và lịch sử đơn.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 6  |  **Nguồn hoặc việc cần kiểm tra:** checkout-order.spec.ts, order pages

#### FR-CHK-04  [M]  Khi đặt hàng thất bại, website báo lỗi, không hiện trang xác nhận và giữ giỏ hàng.

Quy tắc cần tuân theo: Lỗi không được biến thành trang xác nhận đơn thành công.

Cách kiểm tra: Tạo lỗi ở bước cuối; website hiện lỗi, không chuyển sang trang xác nhận và giỏ còn dùng được.

**Trạng thái:** Đã có mã nguồn, chưa kiểm thử đầy đủ  |  **Tuần:** 6,7  |  **Nguồn hoặc việc cần kiểm tra:** payment-button, Playwright on recommendation

### 3.5 Thanh toán và chống tạo đơn trùng

#### FR-PAY-01  [M]  Bản demo tại Việt Nam hỗ trợ thanh toán khi nhận hàng (COD).

Quy tắc cần tuân theo: Thanh toán được chấp nhận ở bước xác nhận không có nghĩa tiền đã được thu.

Cách kiểm tra: Chọn COD, đặt đơn thử và kiểm tra giao diện không nói đã thu tiền.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 7  |  **Nguồn hoặc việc cần kiểm tra:** pp_system_default, checkout sequence

#### FR-PAY-02  [M]  Công cụ thanh toán mô phỏng thử được cả thành công lẫn thất bại; không chạy trên môi trường thật.

Quy tắc cần tuân theo: Công cụ mô phỏng chỉ bật ngoài môi trường thật và không xử lý tiền hay thẻ.

Cách kiểm tra: Mô phỏng thành công tạo đơn, thất bại không tạo đơn; cấu hình production không bật công cụ.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 7  |  **Nguồn hoặc việc cần kiểm tra:** payment-simulator/provider.ts; checkout-order.spec.ts

#### FR-PAY-03  [M]  Bấm đặt hàng lại hoặc gửi lại yêu cầu không tạo thêm đơn ngoài ý muốn.

Quy tắc cần tuân theo: Cần xác định cách nhận ra cùng một yêu cầu từ giỏ, người mua và nội dung gửi lên; kiểm tra Medusa có hỗ trợ gì.

Cách kiểm tra: Gửi hai yêu cầu cùng lúc rồi gửi lại sau khi chờ quá lâu; tối đa một đơn được tạo. Nội dung khác nhau không được gắn nhầm đơn cho người khác.

**Trạng thái:** Chưa đáp ứng  |  **Tuần:** 7  |  **Nguồn hoặc việc cần kiểm tra:** Cần tests + ADR + readback

#### FR-PAY-04  [M]  Thanh toán thất bại không tạo đơn thành công hoặc giữ hàng sai.

Quy tắc cần tuân theo: Medusa chịu trách nhiệm xử lý đơn và tồn kho khi thanh toán lỗi; cần kiểm chứng kết quả.

Cách kiểm tra: Mô phỏng thanh toán lỗi; API trả lỗi, không có đơn gắn với giỏ và số tồn kho không đổi.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 7  |  **Nguồn hoặc việc cần kiểm tra:** checkout-order.spec.ts

#### FR-PAY-05  [S]  Phân biệt thanh toán được chấp nhận, đã thu tiền và đã hoàn tiền; nêu ai thu tiền COD.

Quy tắc cần tuân theo: Đơn đang chờ không được hiển thị là đã thu tiền.

Cách kiểm tra: Giao diện/báo cáo phân biệt “đã chấp nhận”, “đã thu”, “đã hoàn tiền” và ghi rõ khi trạng thái đổi.

**Trạng thái:** Mới hoàn thành một phần  |  **Tuần:** 7  |  **Nguồn hoặc việc cần kiểm tra:** Provider + inventory report

### 3.6 Tồn kho

#### FR-INV-01  [M]  Khi có đơn hợp lệ, số hàng còn bán được và số hàng giữ cho đơn thay đổi đúng.

Quy tắc cần tuân theo: Một đơn không được trừ hoặc giữ cùng số hàng hai lần.

Cách kiểm tra: Đọc số hàng trước khi đặt, trước bước cuối và sau khi tạo đơn; phần thay đổi phải khớp số lượng đã mua.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 6,7  |  **Nguồn hoặc việc cần kiểm tra:** inventory-consistency-notes.md 24/24

#### FR-INV-02  [M]  Không bán quá số hàng trong kho khi nhiều khách đặt cùng lúc.

Quy tắc cần tuân theo: Medusa quyết định còn đủ hàng hay không khi nhiều khách đặt cùng lúc.

Cách kiểm tra: Cho ít nhất hai khách cùng đặt khi hàng sắp hết; số hàng bán không vượt tồn kho.

**Trạng thái:** Chưa đáp ứng  |  **Tuần:** 7,12  |  **Nguồn hoặc việc cần kiểm tra:** Cần concurrency/failure test

#### FR-INV-03  [S]  Khi hủy hoặc giao đơn, số hàng giữ cho đơn và tồn kho được cập nhật đúng.

Quy tắc cần tuân theo: Không sửa thẳng bảng tồn kho trong PostgreSQL; dùng chức năng Medusa.

Cách kiểm tra: Hủy/giao đơn thử rồi so sánh số hàng trước và sau.

**Trạng thái:** Chưa đáp ứng  |  **Tuần:** 7,8  |  **Nguồn hoặc việc cần kiểm tra:** Cần order state tests

### 3.7 Đơn hàng và theo dõi đơn

#### FR-ORD-01  [M]  Khách xem danh sách và chi tiết đơn hàng của mình.

Quy tắc cần tuân theo: Khách không được xem đơn của tài khoản khác.

Cách kiểm tra: Tạo đơn, tìm lại trong danh sách và trang chi tiết; thử mở bằng tài khoản khác.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 6,8  |  **Nguồn hoặc việc cần kiểm tra:** checkout-order.spec.ts

#### FR-ORD-02  [M]  Khách xem được trạng thái hiện tại của đơn.

Quy tắc cần tuân theo: Trạng thái hiển thị phải lấy từ Medusa, không tự đặt ra trên website.

Cách kiểm tra: Đổi trạng thái đơn khi demo rồi kiểm tra lịch sử và trang chi tiết cập nhật đúng.

**Trạng thái:** Đã có mã nguồn, chưa kiểm thử đầy đủ  |  **Tuần:** 8  |  **Nguồn hoặc việc cần kiểm tra:** Order pages, cần state change E2E

#### FR-ORD-03  [S]  Nhân viên xử lý đơn và giao hàng trên Medusa Admin theo quyền được cấp.

Quy tắc cần tuân theo: Website không tự tạo trạng thái giao hàng khác với Medusa.

Cách kiểm tra: Nhân viên thử thao tác theo quyền rồi đọc lại đơn để xác nhận kết quả.

**Trạng thái:** Mới hoàn thành một phần  |  **Tuần:** 8,11  |  **Nguồn hoặc việc cần kiểm tra:** Medusa Admin built-in; cần access test

### 3.8 Xử lý nền và thông báo

#### FR-NOT-01  [M]  Sau khi tạo đơn, hệ thống chuyển việc gửi thông báo sang tiến trình nền.

Quy tắc cần tuân theo: Gửi thông báo lỗi không được hủy đơn đã tạo.

Cách kiểm tra: Sau khi tạo đơn, tiến trình nền thử gửi thông báo; làm email lỗi nhưng đơn vẫn còn.

**Trạng thái:** Chưa đáp ứng  |  **Tuần:** 8  |  **Nguồn hoặc việc cần kiểm tra:** Redis event + worker infra, custom subscriber thiếu

#### FR-NOT-02  [M]  Khi gửi thông báo lỗi, hệ thống thử lại có giới hạn và tránh gửi trùng.

Quy tắc cần tuân theo: Ghi mã cho mỗi lần gửi, số lần thử và lỗi để tránh gửi trùng.

Cách kiểm tra: Cho dịch vụ email lỗi rồi hoạt động lại; số lần gửi lại đúng giới hạn và khách không nhận email trùng ngoài dự kiến.

**Trạng thái:** Chưa đáp ứng  |  **Tuần:** 8  |  **Nguồn hoặc việc cần kiểm tra:** Cần subscriber/adapter và test

#### FR-NOT-03  [S]  Khách nhận được email xác nhận đơn qua dịch vụ thử nghiệm.

Quy tắc cần tuân theo: Không gửi email thật tới người chưa đồng ý chỉ vì họ xuất hiện trong dữ liệu demo.

Cách kiểm tra: Xem email trong hộp thư thử nghiệm; thông tin đơn đủ để nhận biết nhưng không thừa dữ liệu cá nhân.

**Trạng thái:** Chưa đáp ứng  |  **Tuần:** 8  |  **Nguồn hoặc việc cần kiểm tra:** Cần email adapter

### 3.9 Quản trị cửa hàng

#### FR-ADM-01  [M]  Quản trị viên quản lý sản phẩm, tồn kho và đơn bằng Medusa Admin.

Quy tắc cần tuân theo: Quản trị viên phải đăng nhập và được kiểm tra quyền.

Cách kiểm tra: Trên môi trường thử nghiệm, xem/sửa sản phẩm và theo dõi đơn bằng tài khoản quản trị.

**Trạng thái:** Đã có mã nguồn, chưa kiểm thử đầy đủ  |  **Tuần:** 5–8  |  **Nguồn hoặc việc cần kiểm tra:** Medusa Admin, manual verification

#### FR-ADM-02  [S]  Có báo cáo cơ bản về đơn, lỗi và sản phẩm sắp hết hàng.

Quy tắc cần tuân theo: Không tính đơn COD mới được chấp nhận là tiền đã thu.

Cách kiểm tra: Báo cáo tách số tiền đã thu khỏi số tiền mới chờ khách trả.

**Trạng thái:** Chưa đáp ứng  |  **Tuần:** 8,11  |  **Nguồn hoặc việc cần kiểm tra:** Cần minimal report

### 3.10 Tăng tốc, tìm kiếm và ảnh sản phẩm

#### FR-INT-01  [M]  Trang sản phẩm tải nhanh nhờ dữ liệu lưu tạm và vẫn cập nhật đúng khi dữ liệu thay đổi.

Quy tắc cần tuân theo: Giá và dữ liệu dùng khi đặt hàng phải lấy theo trạng thái Medusa hợp lệ, không dựa vào bản lưu tạm đã cũ.

Cách kiểm tra: Xem khi dữ liệu có/không có trong bộ nhớ đệm, sửa sản phẩm rồi kiểm tra trang cập nhật đúng; Redis lỗi không được trả đơn sai.

**Trạng thái:** Mới hoàn thành một phần  |  **Tuần:** 9  |  **Nguồn hoặc việc cần kiểm tra:** Redis cache configured, test thiếu

#### FR-INT-02  [M]  Ảnh sản phẩm được lưu ở nơi phù hợp, không nhét tệp ảnh vào cơ sở dữ liệu đơn hàng.

Quy tắc cần tuân theo: Chỉ dùng ảnh có quyền sử dụng và đường dẫn ảnh mở được.

Cách kiểm tra: Tải ảnh thử trên môi trường cloud thử nghiệm và xem ảnh nhỏ hiển thị đúng.

**Trạng thái:** Mới hoàn thành một phần  |  **Tuần:** 9  |  **Nguồn hoặc việc cần kiểm tra:** S3 optional config, chưa có run evidence

#### FR-INT-03  [S]  Tìm kiếm, lọc và sắp xếp đáp ứng việc xem hàng; có kế hoạch nếu sau này dùng công cụ tìm kiếm riêng.

Quy tắc cần tuân theo: Nếu muốn công cụ tìm kiếm riêng, nhóm phải ghi lý do; đó chưa phải yêu cầu bắt buộc.

Cách kiểm tra: Ghi quyết định; nếu dùng công cụ riêng, thử khi sản phẩm thay đổi để kết quả tìm kiếm cập nhật.

**Trạng thái:** Mới hoàn thành một phần  |  **Tuần:** 9  |  **Nguồn hoặc việc cần kiểm tra:** Keyword search, no dedicated search

### 3.11 Triển khai và vận hành

#### FR-OPS-01  [M]  Hệ thống tự kiểm tra mã nguồn trước khi nhập thay đổi hoặc phát hành.

Quy tắc cần tuân theo: Bản kiểm tra thất bại không được nhập vào nhánh chính theo quy định của nhóm.

Cách kiểm tra: Lưu kết quả chạy thành công của quy trình tự động cho đúng bản mã nguồn.

**Trạng thái:** Đã có mã nguồn và một số kết quả kiểm thử  |  **Tuần:** 10  |  **Nguồn hoặc việc cần kiểm tra:** CI & API GitHub Actions runs 01/11

#### FR-OPS-02  [M]  Có thể triển khai lại môi trường thử nghiệm cloud và kiểm tra nó sẵn sàng qua HTTPS.

Quy tắc cần tuân theo: Không đưa mật khẩu/khóa vào Git và phải biết phiên bản nào đã triển khai.

Cách kiểm tra: Đưa một bản đã duyệt lên môi trường thử nghiệm, kiểm tra ứng dụng còn hoạt động và đặt hàng từ đầu đến cuối.

**Trạng thái:** Mới hoàn thành một phần  |  **Tuần:** 10  |  **Nguồn hoặc việc cần kiểm tra:** deploy.yml + RUNBOOK; no cloud evidence

#### FR-OPS-03  [M]  Nhóm diễn tập đưa phiên bản cũ trở lại và sao lưu, khôi phục dữ liệu.

Quy tắc cần tuân theo: Quay lại phiên bản cũ không được làm mất dữ liệu mua hàng.

Cách kiểm tra: Diễn tập khôi phục dữ liệu và đưa bản cũ trở lại; ghi thời gian và nhật ký.

**Trạng thái:** Chưa đáp ứng  |  **Tuần:** 10,12  |  **Nguồn hoặc việc cần kiểm tra:** RUNBOOK target only

#### FR-OPS-04  [M]  Có số liệu, nhật ký và cảnh báo để biết hệ thống chậm hoặc gặp lỗi.

Quy tắc cần tuân theo: Nhật ký không chứa mật khẩu, khóa hoặc dữ liệu riêng của khách.

Cách kiểm tra: Tạo lỗi thử nghiệm, lưu ảnh bảng số liệu và cảnh báo đã xuất hiện.

**Trạng thái:** Chưa đáp ứng  |  **Tuần:** 11  |  **Nguồn hoặc việc cần kiểm tra:** Docker logs configured, metrics gap

### 3.12 Gợi ý sản phẩm (tùy chọn)

#### FR-REC-01  [C]  Dữ liệu H&M được chuẩn bị có thể đối chiếu về nguồn và không tạo đơn hàng giả trong Medusa.

Quy tắc cần tuân theo: Kiểm tra điều khoản sử dụng bộ dữ liệu H&M và quyền dùng ảnh.

Cách kiểm tra: Kiểm tra sản phẩm mẫu liên kết đúng với mã Medusa, không trùng mã hàng và tệp dữ liệu riêng không bị công khai.

**Trạng thái:** Đã có mã nguồn, chưa kiểm thử đầy đủ  |  **Tuần:** 13+  |  **Nguồn hoặc việc cần kiểm tra:** scripts/hm, README ghi pilot 500/1.874

#### FR-REC-02  [C]  Gợi ý sản phẩm đang bán qua API sau khi luồng mua hàng chính ổn định.

Quy tắc cần tuân theo: Chỉ gợi ý sản phẩm đang bán, có giá và đủ hàng tại khu vực của khách; nếu chưa biết sở thích, dùng danh sách phổ biến.

Cách kiểm tra: Kiểm thử API và website; đo chất lượng gợi ý trên dữ liệu chuẩn bị trước và thời gian trả kết quả.

**Trạng thái:** Chưa đáp ứng  |  **Tuần:** 13+  |  **Nguồn hoặc việc cần kiểm tra:** Không có online rec API ở baseline

## 4. Quy tắc bán hàng (BR)

Các quy tắc dưới đây là yêu cầu của đồ án hoặc mục tiêu cần kiểm tra. Quy tắc nào chưa được xây dựng vẫn được giữ trong bảng và đánh dấu để làm tiếp. Nếu đổi quy tắc, nhóm phải cập nhật tài liệu, bài kiểm thử và lý do lựa chọn giải pháp.

| **ID** | **Quy tắc nghiệp vụ** | **Nguồn / hướng xác nhận** |
| --- | --- | --- |
| BR-01 | Chỉ Medusa quyết định giá bán và quản lý giỏ hàng, đơn hàng, thanh toán, tồn kho. | [SRC-03], ranh giới giữa website và Medusa. |
| BR-02 | Chỉ bán sản phẩm đang được hiển thị, thuộc đúng khu vực/kênh bán, có giá và đáp ứng quy tắc tồn kho. | Medusa Product/Inventory. |
| BR-03 | Mỗi món hàng trong đơn phải gắn với sản phẩm có thật hoặc thông tin sản phẩm được Medusa lưu lại lúc đặt hàng. | Quy trình hoàn tất giỏ hàng. |
| BR-04 | Đặt hàng thành công chỉ khi Medusa trả `type=order`, có Order ID và có thể truy vấn lại. | Checkout action & tests. |
| BR-05 | Trạng thái `authorized` chỉ cho biết thanh toán được chấp nhận ở bước xác nhận; chưa chứng minh đã thu tiền. COD là trả tiền khi nhận hàng. | Payment Simulator và báo cáo đơn hàng. |
| BR-06 | Simulator chỉ phục vụ môi trường phi production; không nhận dữ liệu thẻ hay chuyển tiền thật. | payment-simulator provider. |
| BR-07 | Payment failure không được tạo Order thành công hoặc tăng reservation ngoài ý muốn. | Payment fail integration test. |
| BR-08 | Gửi lại cùng một yêu cầu đặt hàng không được tạo thêm đơn; nếu nội dung yêu cầu thay đổi thì phải có cách xử lý đã thống nhất. | Cần ghi quyết định và bổ sung kiểm thử. |
| BR-09 | Khi nhiều khách đặt cùng lúc, tổng số hàng giữ cho các đơn không vượt số hàng có thể bán. | Cần kiểm thử nhiều đơn cùng lúc. |
| BR-10 | Chỉ gửi thông báo sau khi có đơn; lỗi email không được hủy đơn. | Mục tiêu Tuần 8. |
| BR-11 | Customer chỉ xem order của mình; Admin/Staff thao tác theo quyền. | Medusa auth/access boundary. |
| BR-12 | Media lưu qua file/object storage hợp lệ; database lưu metadata/URL, không lưu blob nặng. | Yêu cầu kiến trúc Tuần 9. |
| BR-13 | Raw H&M history không được import thành Order; giá/stock demo ghi synthetic provenance. | scripts/hm/README.md. |
| BR-14 | Secrets/PII không ghi vào git, test artifacts hoặc public logs. | Security/ops plan. |
| BR-15 | Mọi deployment/schema change phải có migration, backup/rollback plan tương ứng. | deploy/RUNBOOK.md. |

## 5. Dữ liệu cần có và bên chịu trách nhiệm

### 5.1 Những loại dữ liệu chính

| **Loại dữ liệu** | **Thông tin chính** | **Nơi quản lý** | **Điều cần bảo vệ/kiểm tra** |
| --- | --- | --- | --- |
| Khách hàng và đăng nhập | Email, hồ sơ, thông tin xác thực. | Medusa Customer/Auth | Không để khách xem dữ liệu của người khác; không đưa mật khẩu vào Git. |
| Sản phẩm và phiên bản | Tên, mã hàng (SKU), các lựa chọn, danh mục và ảnh. | Medusa Product | Mỗi mã phải xác định đúng sản phẩm; chỉ bán hàng được bật cho khu vực/kênh phù hợp. |
| Giá và nơi bán | Giá VND, khu vực bán và kênh bán. | Medusa Pricing/Region/Sales Channel | Website dùng giá Medusa trả về, không tự đặt tổng tiền. |
| Tồn kho | Số hàng có, số hàng giữ cho đơn và kho chứa. | Medusa Inventory | Không giữ cùng một số hàng hai lần; liên kết đúng sản phẩm với tồn kho. |
| Giỏ hàng | Mã giỏ, khách, món hàng, số lượng và địa chỉ. | Medusa Cart | Kiểm tra thay đổi giỏ; website chỉ giữ mã giỏ trong cookie riêng tư. |
| Thanh toán | Cách thanh toán, phiên thanh toán, số tiền và trạng thái. | Medusa Payment | Phân biệt đã chấp nhận với đã thu tiền; demo không nhận tiền thật. |
| Đơn hàng và giao hàng | Mã đơn, trạng thái, sản phẩm đã mua và tiến độ giao. | Medusa Order/Fulfillment | Đơn được tạo từ giỏ hợp lệ; khách chỉ xem đơn của mình. |
| Lần gửi thông báo (dự kiến) | Mã sự kiện/đơn, số lần thử, kết quả, lỗi và thời điểm. | Phần mở rộng Medusa dự kiến | Gửi lại có giới hạn, tránh trùng và không lộ mã đăng nhập. |
| Nhật ký và số liệu vận hành | Mã yêu cầu, thời gian phản hồi, mã lỗi, dịch vụ liên quan. | Công cụ theo dõi dự kiến | Không ghi dữ liệu nhạy cảm; quy định thời gian lưu. |
| Liên kết dữ liệu H&M (tùy chọn) | Mã sản phẩm H&M và mã sản phẩm/phiên bản trong Medusa. | Công cụ chuẩn bị dữ liệu offline | Không trộn lịch sử mua H&M với đơn thật; kiểm tra quyền sử dụng. |

### 5.2 Dữ liệu liên quan với nhau thế nào

- Một sản phẩm có thể có nhiều phiên bản (ví dụ màu khác nhau). Medusa liên kết phiên bản với giá và tồn kho; không được tự đoán các bảng dữ liệu bên trong đều nối trực tiếp với nhau.
- Giỏ chứa các món hàng, khu vực bán và có thể gắn với khách. Khi đặt hàng, Medusa nhận địa chỉ, cách giao và phiên thanh toán; nếu thành công, Medusa trả đơn và giữ mối liên hệ với giỏ.
- Một phiên thanh toán có thể đi qua các trạng thái “được chấp nhận”, “đã thu tiền” và “đã hoàn tiền”. Các trạng thái này không giống nhau, cần đối chiếu riêng.
- Medusa theo dõi số hàng trong kho và số hàng đã giữ cho đơn. Không được suy ra số hàng trong kho giảm ngay lúc tạo đơn nếu chưa có bằng chứng.
- Thông tin sản phẩm trong đơn được lưu tại thời điểm mua và có thể có nhiều phiên bản bản ghi. Khi kiểm tra, phải đọc đúng đơn và phiên bản hiện tại qua API/Medusa.
- Nếu xây chức năng thông báo, mỗi lần gửi cần có mã để chống trùng, số lần thử có giới hạn và thời gian lưu rõ ràng. Không ghi mã đăng nhập hoặc email đầy đủ vào nhật ký công khai.

### 5.3 Quyền riêng tư và thời gian lưu dữ liệu

Email, địa chỉ và số điện thoại của khách là dữ liệu cá nhân. Không đưa dữ liệu thật đầy đủ vào Git hoặc nhật ký kiểm thử. Bài test dùng email giả và tài khoản riêng. Nhóm cần quyết định lưu dữ liệu khách/đơn bao lâu theo mục đích demo và quy định áp dụng; hiện chưa có đủ thông tin để tự đặt một số ngày bắt buộc. Dữ liệu H&M gốc phải giữ riêng, kiểm tra quyền sử dụng, che mã khách H&M bằng khóa bí mật và không biến lịch sử mua của họ thành đơn thật của dự án.

## 6. Giao diện và cách các phần kết nối với nhau

| **Mã** | **Các phần giao tiếp** | **Đường dẫn/cách kết nối** | **Điều cần kiểm tra** |
| --- | --- | --- | --- |
| UI-01 | Khách ↔ website Next.js | `/vn/store`, trang chi tiết, giỏ, đặt hàng, lịch sử đơn | Dùng được trên điện thoại/máy tính; báo rõ khi thiếu dữ liệu, đang tải hoặc có lỗi. |
| API-01 | Website → Medusa | API sản phẩm, khu vực, giỏ và món hàng trong giỏ | Dùng HTTPS và mã truy cập phù hợp; dữ liệu riêng cần đăng nhập. |
| API-02 | Đặt hàng → thanh toán | API tạo phiên thanh toán và hoàn tất giỏ | Chỉ Medusa tạo đơn; không nhận dữ liệu thẻ thật; cần thử chống gửi trùng. |
| API-03 | Khách → đơn của mình | `/store/orders`, `/store/orders/{id}` | Kiểm tra quyền: khách chỉ xem đơn được phép. |
| API-04 | Khách → đăng nhập | `/auth/customer/emailpass`, `/store/auth/login` | Dùng Medusa để xác thực; không tạo kho mật khẩu riêng. |
| API-05 | Nhân viên → quản trị | `/app` và Medusa Admin API | Chỉ tài khoản có quyền mới vào được. |
| INT-01 | Medusa ↔ PostgreSQL 16 | Kết nối qua `DATABASE_URL` | Bảo vệ dữ liệu, kiểm soát thay đổi cấu trúc, sao lưu và số kết nối. |
| INT-02 | Medusa/tiến trình nền ↔ Redis 7 | Kết nối qua `REDIS_URL` | Kiểm tra dữ liệu lưu tạm cập nhật, việc nền thử lại và xử lý khi Redis lỗi. |
| INT-03 | Ảnh ↔ nơi lưu tương thích S3 | Medusa dùng phần lưu tệp nếu được cấu hình | Kiểm tra quyền dùng ảnh, quyền truy cập và HTTPS. |
| INT-04 | Việc gửi thông báo dự kiến | Tiến trình nền → dịch vụ email thử nghiệm | Ghi kết quả gửi, giới hạn gửi lại và tránh gửi trùng. |
| OPS-01 | Quy trình triển khai → cloud thử nghiệm | GitHub Actions → máy chủ chạy Caddy/Compose | Biết phiên bản đã đưa lên, giữ bí mật khóa, kiểm tra ứng dụng và có cách quay lại. |

### 6.1 Cách báo lỗi khi các phần giao tiếp

Khi người dùng nhập sai, API phải trả lỗi phù hợp (thường là HTTP 4xx). Khi hệ thống hoặc dịch vụ hỗ trợ gặp lỗi, API trả lỗi máy chủ (thường là 5xx) và ghi nhật ký để tìm nguyên nhân. Website chỉ báo đặt hàng thành công khi Medusa thực sự trả về đơn hàng; một phản hồi HTTP 2xx khác chưa đủ. Các đường dẫn chứa dữ liệu riêng tư phải kiểm tra quyền tại máy chủ. Ưu tiên dùng API có sẵn của Medusa; nếu tự tạo API mới, cần ghi rõ dữ liệu đầu vào, quyền truy cập, lỗi có thể xảy ra và giới hạn kết quả. Bảng trên gồm cả đường dẫn đang dùng và phần dự kiến, không có nghĩa mọi phần đều đã xây xong.

## 7. Yêu cầu về tốc độ, độ ổn định và bảo mật (NFR)

Các yêu cầu trong phần này cần được đo bằng bài kiểm thử thực tế. Mức 30 yêu cầu xem sản phẩm/giây, 3 yêu cầu đặt hàng/giây và thời gian phản hồi p95 chỉ là mục tiêu ghi trong kịch bản k6; chưa có kết quả chứng minh đã đạt. Mục tiêu hoạt động 99,5% chưa được phê duyệt. Mục tiêu mất dữ liệu/khôi phục sau sự cố cũng chưa được diễn tập.

### 7.1 Tốc độ và khả năng phục vụ nhiều người

#### NFR-PERF-01  [M]  Khi thử xem sản phẩm ở mức 30 yêu cầu/giây trong 10 phút, 95% yêu cầu cần phản hồi dưới 600 ms và dưới 1% bị lỗi.

Cách kiểm tra: Chạy k6 bằng `load/catalog.js`; ghi cấu hình máy, lượng dữ liệu và thời gian phản hồi.

Tình trạng và bằng chứng hiện có: Có kịch bản kiểm thử; chưa có báo cáo kết quả.  |  Tuần dự kiến: 12

#### NFR-PERF-02  [M]  Khi thử đặt hàng ở mức 3 yêu cầu/giây trong 5 phút, 95% bước hoàn tất cần phản hồi dưới 1.500 ms và dưới 1% bị lỗi.

Cách kiểm tra: Chạy `load/checkout.js` trên môi trường thử nghiệm với dữ liệu mẫu riêng; kiểm tra các đơn thử được tạo.

Tình trạng và bằng chứng hiện có: Có kịch bản kiểm thử; chưa có báo cáo kết quả.  |  Tuần dự kiến: 12

#### NFR-PERF-03  [S]  Ghi rõ số yêu cầu mỗi giây, số người dùng cùng lúc, tỷ lệ xem/đặt hàng và cách thử mức tải gấp 5 lần nếu có thể.

Cách kiểm tra: Có báo cáo mức tải bình thường và gấp 5 lần, hoặc giải thích vì sao chưa thể thử.

Tình trạng và bằng chứng hiện có: Mới ở kế hoạch.  |  Tuần dự kiến: 12

#### NFR-PERF-04  [M]  Số kết nối tới PostgreSQL phải dưới giới hạn cho phép; không gặp lỗi hết kết nối khi thử mức tải mục tiêu.

Cách kiểm tra: Ghi số kết nối cao nhất từ PostgreSQL và ứng dụng; số lần lỗi hết kết nối phải bằng 0.

Tình trạng và bằng chứng hiện có: Máy cá nhân từng gặp lỗi PostgreSQL 53300 (hết kết nối); chưa đo tải lại.  |  Tuần dự kiến: 11–12

### 7.2 Hoạt động ổn định và khôi phục khi có sự cố

#### NFR-REL-01  [M]  Gửi yêu cầu đặt hàng lại hoặc cùng lúc không được tạo đơn trùng hay làm sai trạng thái thanh toán.

Cách kiểm tra: Cho hai yêu cầu đặt hàng chạy cùng lúc, thử gửi lại sau khi chờ quá lâu rồi đọc lại đơn và tồn kho.

Tình trạng và bằng chứng hiện có: Chưa đủ bài kiểm thử.  |  Tuần dự kiến: 7,12

#### NFR-REL-02  [M]  Lỗi thông báo, tìm kiếm hoặc dữ liệu lưu tạm không được hủy đơn hợp lệ hay báo thành công khi chưa có đơn.

Cách kiểm tra: Cố ý làm một dịch vụ hỗ trợ ngừng hoạt động, thử đặt hàng và ghi lại kết quả, cách khôi phục.

Tình trạng và bằng chứng hiện có: Mới có một phần hạ tầng.  |  Tuần dự kiến: 8,12

#### NFR-REL-03  [M]  Mục tiêu ban đầu: khi có sự cố, mất tối đa 60 phút dữ liệu và khôi phục hệ thống trong 120 phút.

Cách kiểm tra: Chạy restore từ backup, đo độ cũ bản backup và thời gian khôi phục.

Tình trạng và bằng chứng hiện có: Mới là mục tiêu trong hướng dẫn; chưa diễn tập.  |  Tuần dự kiến: 10,12

#### NFR-REL-04  [S]  Đề xuất hệ thống hoạt động 99,5% thời gian đo trên môi trường thử nghiệm; nhóm phải duyệt cách đo trước.

Cách kiểm tra: Ghi rõ khoảng thời gian đo, thời gian hệ thống hoạt động/ngừng và cách tính thời gian bảo trì đã lên lịch.

Tình trạng và bằng chứng hiện có: Chưa chốt mục tiêu hoặc chứng minh đạt.  |  Tuần dự kiến: 11–12

#### NFR-REL-05  [M]  Có cách kiểm tra ứng dụng và các dịch vụ dữ liệu quan trọng còn hoạt động.

Cách kiểm tra: Kiểm tra PostgreSQL, Redis và Medusa; thử khi một dịch vụ ngừng hoạt động.

Tình trạng và bằng chứng hiện có: Có kiểm tra hoạt động cơ bản; chưa diễn tập đủ các lỗi.  |  Tuần dự kiến: 10–12

### 7.3 Bảo mật và quyền riêng tư

#### NFR-SEC-01  [M]  Máy chủ phải kiểm tra quyền trước khi trả hồ sơ hoặc đơn hàng riêng của khách.

Cách kiểm tra: Dùng tài khoản A thử xem dữ liệu của B; yêu cầu phải bị từ chối và không trả dữ liệu của B.

Tình trạng và bằng chứng hiện có: Mới kiểm một phần; cần rà lại quyền truy cập.  |  Tuần dự kiến: 11

#### NFR-SEC-02  [M]  Truy cập từ Internet phải dùng HTTPS; PostgreSQL và Redis không mở công khai.

Cách kiểm tra: Thử truy cập HTTPS và rà các cổng mở trên máy chủ cloud.

Tình trạng và bằng chứng hiện có: Đã có cấu hình Caddy và cổng nội bộ; chưa kiểm chứng trên cloud.  |  Tuần dự kiến: 10–11

#### NFR-SEC-03  [M]  Không lưu mật khẩu và khóa bí mật trong Git hoặc nhật ký công khai.

Cách kiểm tra: Quét mã nguồn tìm thông tin bí mật và kiểm lại quy trình triển khai, nhật ký.

Tình trạng và bằng chứng hiện có: Có `.gitignore` và cấu hình GitHub Secrets; cần kiểm lại cách dùng.  |  Tuần dự kiến: 10–11

#### NFR-SEC-04  [M]  Không lưu mật khẩu hoặc thông tin thẻ; nhật ký phải che dữ liệu riêng của khách và mã đăng nhập.

Cách kiểm tra: Xem mẫu nhật ký và kiểm tra không có trường dữ liệu nhạy cảm.

Tình trạng và bằng chứng hiện có: Chưa kiểm chứng đầy đủ.  |  Tuần dự kiến: 11

#### NFR-SEC-05  [M]  Công cụ thanh toán mô phỏng không được chạy trên môi trường thật.

Cách kiểm tra: Thử cấu hình môi trường thật và xác nhận Medusa không cho dùng công cụ mô phỏng.

Tình trạng và bằng chứng hiện có: Mã nguồn đã có chặn; cần thử lại đúng chế độ production.  |  Tuần dự kiến: 7,11

### 7.4 Theo dõi hoạt động và phát hiện lỗi

#### NFR-OBS-01  [M]  Đo lượng truy cập, tỷ lệ lỗi, thời gian phản hồi, CPU/RAM và số kết nối cơ sở dữ liệu.

Cách kiểm tra: Lưu bảng số liệu và dữ liệu gốc của ít nhất một giờ thử nghiệm.

Tình trạng và bằng chứng hiện có: Chưa có bảng theo dõi số liệu.  |  Tuần dự kiến: 11–12

#### NFR-OBS-02  [S]  Có thể nối các bản ghi để xem một đơn đã đi qua những bước nào.

Cách kiểm tra: Dùng mã yêu cầu, giỏ và đơn để lần theo nhật ký; không để lộ thông tin cá nhân.

Tình trạng và bằng chứng hiện có: Có một số nhật ký theo cấu trúc; chưa lần theo được toàn bộ hành trình đơn.  |  Tuần dự kiến: 11

#### NFR-OBS-03  [M]  Cảnh báo khi ứng dụng ngừng hoạt động, lỗi máy chủ tăng, cơ sở dữ liệu quá tải hoặc sao lưu thất bại.

Cách kiểm tra: Cố ý tạo lỗi trong môi trường thử nghiệm và lưu bằng chứng cảnh báo xuất hiện.

Tình trạng và bằng chứng hiện có: Chưa có cảnh báo.  |  Tuần dự kiến: 11–12

### 7.5 Đưa phiên bản mới lên hệ thống và bảo trì

#### NFR-OPS-01  [M]  Mỗi bản mới phải qua các bước kiểm tra mã nguồn và xây dựng ứng dụng trước khi triển khai.

Cách kiểm tra: Lưu kết quả GitHub Actions thành công cho đúng bản mã nguồn được triển khai.

Tình trạng và bằng chứng hiện có: Bài kiểm tra CI và API đã chạy thành công.  |  Tuần dự kiến: 10

#### NFR-OPS-02  [M]  Biết chính xác bản nào đang chạy, cập nhật dữ liệu có kiểm soát và đã tập quay lại bản cũ.

Cách kiểm tra: Lưu nhật ký triển khai, mã bản phát hành và kết quả thử quay lại, khôi phục.

Tình trạng và bằng chứng hiện có: Có quy trình và hướng dẫn; chưa diễn tập triển khai.  |  Tuần dự kiến: 10,13

#### NFR-OPS-03  [S]  Triển khai hoặc khởi động lại ứng dụng không được xóa dữ liệu bán hàng.

Cách kiểm tra: Xem hướng dẫn vận hành, khởi động lại ứng dụng rồi kiểm tra dữ liệu còn nguyên.

Tình trạng và bằng chứng hiện có: Compose có nơi lưu dữ liệu lâu dài; chưa có báo cáo khôi phục.  |  Tuần dự kiến: 10–12

### 7.6 Giữ dữ liệu chính xác

#### NFR-DATA-01  [M]  Medusa là nơi quản lý dữ liệu bán hàng chính; phần khác không tự ghi vào các bảng lõi.

Cách kiểm tra: Rà mã nguồn và đối chiếu giỏ hàng, đơn, giá và tồn kho sau khi đặt hàng.

Tình trạng và bằng chứng hiện có: Đã ghi trách nhiệm từng phần; mới có một số bài kiểm thử.  |  Tuần dự kiến: 4–9

#### NFR-DATA-02  [M]  Chỉ dùng dữ liệu riêng của khách cho mục đích demo đã nêu; quy định ai được xem và lưu bao lâu.

Cách kiểm tra: Rà quyền truy cập, dữ liệu mẫu và quy định thời gian lưu.

Tình trạng và bằng chứng hiện có: Mới hoàn thành một phần.  |  Tuần dự kiến: 11

### 7.7 Theo dõi chi phí cloud

#### NFR-COST-01  [M]  Chốt ngân sách cloud mỗi tháng trước khi triển khai; không vượt mức đó nếu chưa được duyệt.

Cách kiểm tra: Ghi chi phí từng dịch vụ và đối chiếu với ngân sách, lượng truy cập.

Tình trạng và bằng chứng hiện có: Chưa chốt ngân sách hoặc có báo cáo chi phí.  |  Tuần dự kiến: 10,12

### 7.8 Kiểm tra chất lượng và đối chiếu yêu cầu

#### NFR-QUAL-01  [M]  Trước khi nộp, mỗi yêu cầu phải đối chiếu được với phần đã làm và kết quả kiểm thử.

Cách kiểm tra: Bảng RTM ghi tình trạng, đường dẫn tới kết quả và các việc còn thiếu đã được nhóm chấp nhận.

Tình trạng và bằng chứng hiện có: Có tài liệu yêu cầu; bảng đối chiếu RTM chưa chốt.  |  Tuần dự kiến: 13

## 8. Tình huống sử dụng và cách kiểm tra

| **Mã** | **Tình huống** | **Điều cần xảy ra** | **Yêu cầu liên quan** |
| --- | --- | --- | --- |
| UC-01 | Đăng ký và đăng nhập | Khách đăng ký bằng email hợp lệ, đăng nhập và giữ phiên đăng nhập; mật khẩu sai bị từ chối. | FR-AUTH-01..03 |
| UC-02 | Tìm và chọn sản phẩm | Khách tìm kiếm, xem danh sách/chi tiết, chọn phiên bản và thêm vào giỏ. | FR-CAT-01..05, FR-CART-01 |
| UC-03 | Mua hàng | Khách có hàng trong giỏ, nhập địa chỉ, chọn giao hàng/thanh toán và nhận mã đơn, trang xác nhận. | FR-CHK-01..03, FR-PAY-01, FR-INV-01 |
| UC-04 | Thanh toán thất bại | Công cụ mô phỏng báo lỗi; không có đơn mới, tồn kho không đổi và khách thấy lỗi. | FR-PAY-02, FR-PAY-04, FR-CHK-04 |
| UC-05 | Bấm đặt hàng lặp | Hai yêu cầu đến cùng lúc và một lần gửi lại sau khi chờ quá lâu; tối đa một đơn được tạo. | FR-PAY-03, NFR-REL-01 |
| UC-06 | Gửi thông báo đơn | Có đơn mới thì tiến trình nền gửi email thử; nếu lỗi, gửi lại có giới hạn. | FR-NOT-01..03 |
| UC-07 | Nhân viên xử lý đơn | Nhân viên xem đơn và tồn kho, chỉ thao tác trong quyền được cấp. | FR-ADM-01, FR-ORD-03 |
| UC-08 | Triển khai và khôi phục | Đưa bản mới lên cloud thử nghiệm, kiểm tra hệ thống, tập khôi phục và quay lại bản cũ. | FR-OPS-01..04, NFR-REL-03 |

### 8.1 Các tình huống kiểm tra quan trọng

#### AT-01 Đặt hàng thành công

Chuẩn bị một sản phẩm đang bán, có giá VND và đủ hàng. Khách chọn giao hàng/thanh toán hợp lệ rồi đặt. Medusa phải trả mã đơn; chi tiết đơn khớp giỏ và số hàng giữ cho đơn được đối chiếu.

#### AT-02 Thanh toán thất bại

Chuẩn bị giỏ hợp lệ và chọn kết quả thanh toán mô phỏng thất bại (`simulated_outcome=false`). Khi đặt hàng, API báo lỗi; không có đơn mới gắn với giỏ và tồn kho không đổi.

#### AT-03 Không tạo đơn trùng

Chuẩn bị giỏ đủ điều kiện. Gửi hai yêu cầu đặt hàng cùng lúc, rồi gửi lại sau khi chờ quá lâu. Tối đa một đơn hợp lệ được tạo và không giữ thừa hàng. Nếu hai yêu cầu có nội dung khác nhau, hệ thống phải xử lý theo quy tắc đã ghi và lưu nhật ký.

#### AT-04 Bảo vệ dữ liệu giữa các khách

Tạo hai tài khoản A và B với đơn khác nhau. A không được xem đơn của B. Người chưa đăng nhập cũng không được làm việc của quản trị viên.

#### AT-05 Dịch vụ email bị lỗi

Tạo một đơn, cho dịch vụ email lỗi nhiều lần rồi hoạt động lại. Đơn vẫn tồn tại; số lần thử gửi có giới hạn và khách không nhận email trùng ngoài quy tắc.

#### AT-06 Redis bị lỗi

Khi khách đang xem sản phẩm hoặc đặt hàng, thử cho Redis ngừng hoạt động. Hệ thống phải báo lỗi hoặc dùng cách dự phòng đã nêu rõ; không được báo đặt hàng thành công giả.

#### AT-07 Tốc độ khi có nhiều yêu cầu

Ghi rõ dữ liệu mẫu và cấu hình máy cloud thử nghiệm. Chạy 30 yêu cầu xem sản phẩm/giây trong 10 phút và 3 yêu cầu đặt hàng/giây trong 5 phút. So sánh thời gian phản hồi, tỷ lệ lỗi với mức đã duyệt và lưu báo cáo gốc.

#### AT-08 Khôi phục dữ liệu

Có bản sao lưu ghi rõ thời điểm. Giả lập mất cơ sở dữ liệu trên môi trường thử nghiệm rồi khôi phục. Kiểm tra dữ liệu còn đúng, đo thời gian và lượng dữ liệu mất để so với mục tiêu 60/120 phút.

## 9. Đối chiếu yêu cầu với kết quả hiện có

Bảng dưới cho biết mỗi nhóm yêu cầu dự kiến làm ở tuần nào, đã có bằng chứng gì và còn thiếu gì. Sau mỗi lần gửi thay đổi mã nguồn để xem xét (PR), nhóm cần cập nhật bảng đối chiếu chi tiết cho từng mã yêu cầu và gắn đúng kết quả kiểm thử. Bảng dưới đây chỉ là bản tóm tắt.

| **Nhóm yêu cầu** | **Tuần** | **Đã có gì** | **Còn cần gì** |
| --- | --- | --- | --- |
| FR-AUTH / FR-CAT | 5 | Đăng nhập, trang sản phẩm và một số bài kiểm thử API. | Thử truy cập sai quyền và kiểm tra lọc/tìm kiếm. |
| FR-CART / FR-CHK | 6 | Giỏ, đặt hàng, xem chi tiết đơn. | Đưa bài thử trên trình duyệt về `main` và thử trên cloud. |
| FR-PAY / FR-INV | 7 | Đã thử mô phỏng thanh toán thành công/thất bại; kiểm tra tồn kho một đơn đạt 24/24 bước. | Thử gửi lại, nhiều khách đặt cùng lúc và xử lý khi lỗi. |
| FR-ORD / FR-NOT | 8 | Có lịch sử/chi tiết đơn, đã cấu hình Redis và tiến trình nền. | Gửi thông báo, thử lại khi lỗi và theo dõi các trạng thái đơn. |
| FR-INT | 9 | Có Redis, tìm kiếm cơ bản và cấu hình S3 tùy chọn. | Thử dữ liệu lưu tạm, chạy nơi lưu ảnh và ghi lý do chọn cách tìm kiếm. |
| FR-OPS / NFR-OPS | 10 | Kiểm tra GitHub đã chạy thành công; có quy trình triển khai. | Địa chỉ cloud, kết quả triển khai và diễn tập quay lại bản cũ. |
| NFR-SEC / NFR-OBS | 11 | Có ranh giới đăng nhập và nhật ký Docker. | Thử quyền truy cập, bảng số liệu và cảnh báo. |
| NFR-PERF / NFR-REL / NFR-COST | 12 | Có kịch bản k6 và mục tiêu khôi phục. | Báo cáo đo tải, thử sự cố/khôi phục và chi phí. |
| NFR-QUAL / FR-REC | 13 | Có tài liệu và báo cáo nhập thử H&M trong README. | Đối chiếu yêu cầu với kết quả; gợi ý sản phẩm vẫn tùy chọn. |

## 10. Việc còn phụ thuộc hoặc chưa quyết định

| **Mã** | **Việc cần quyết định** | **Nếu chưa quyết định** |
| --- | --- | --- |
| OPEN-01 | Thuê cloud ở đâu, cấu hình máy nào, đặt PostgreSQL ở đâu và chi tối đa bao nhiêu. | Chưa thể chốt cách triển khai hoặc mục tiêu tốc độ. |
| OPEN-02 | Dùng dịch vụ email thử nghiệm nào, gửi lại mấy lần và lưu kết quả bao lâu. | Chưa thể nghiệm thu yêu cầu thông báo. |
| OPEN-03 | Quyền sử dụng ảnh, nơi lưu và đường dẫn ảnh. | Chưa thể hoàn thành phần ảnh sản phẩm. |
| OPEN-04 | Cách tránh tạo đơn trùng khi khách gửi lại hoặc mất kết nối. | Chưa thể nghiệm thu độ chính xác của thanh toán/đơn. |
| OPEN-05 | Mức thời gian hoạt động mong muốn, thời gian đo và mục tiêu khôi phục. | Chưa thể chốt hoặc đánh giá các chỉ tiêu ổn định. |
| OPEN-06 | Quyền sử dụng, chất lượng và quy mô dữ liệu H&M cho demo công khai. | Chưa thể mở phần gợi ý sản phẩm. |
| OPEN-07 | Đưa bài kiểm thử trình duyệt từ nhánh `recommendation` về nhánh dựa trên `main`. | Chưa có bài kiểm thử đó chạy tự động trên `main`. |

## 11. Góp ý, phê duyệt và thay đổi yêu cầu

Đề xuất phân công: trưởng nhóm theo dõi phạm vi; người phụ trách backend theo dõi đặt hàng và dữ liệu chính xác; người phụ trách frontend theo dõi trải nghiệm khách; nhóm vận hành theo dõi cloud và chất lượng hệ thống; nhóm kiểm thử giữ kết quả và bảng đối chiếu yêu cầu. Giảng viên hoặc người phản biện góp ý theo tiêu chí học phần. Bản thảo chỉ được coi là bản đã duyệt khi có kết quả xem xét được ghi lại.

Khi đổi một yêu cầu, nhóm cần ghi mã thay đổi, lý do, ảnh hưởng tới người dùng, thiết kế, dữ liệu, kiểm thử, chi phí và lịch, cùng quyết định của người duyệt. Nếu chưa thể làm một yêu cầu, ghi rõ đã hoãn, rủi ro được chấp nhận và cách xử lý thay thế. Không xóa yêu cầu hoặc tự ghi “đạt”.

## Nguồn và căn cứ kiểm chứng

**[SRC-01]** Cloud Application Development – Course Project Topics, Project 1; tệp PDF do nhóm cung cấp. *— Tính năng bắt buộc, workload, cloud ops, architecture và NFR.*

**[SRC-02]** Kế hoạch triển khai Enterprise E-commerce Platform, Tuần 4–13; Pasted markdown do nhóm cung cấp. *— Mốc công việc và deliverables.*

**[SRC-03]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/tree/main (baseline d0bf45a). *— Source thực tế đã đối chiếu 02/11/2026.*

**[SRC-04]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/tree/recommendation (baseline a98457c). *— ETL, H&M importer và browser E2E chưa đồng bộ toàn bộ sang main.*

**[SRC-05]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/docs/report/inventory-consistency-notes.md *— Evidence checkout/inventory một lần chạy, 24/24 checks.*

**[SRC-06]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/apps/backend/integration-tests/http/checkout-order.spec.ts *— HTTP integration tests, payment simulator success/failure.*

**[SRC-07]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/deploy/RUNBOOK.md *— Kiến trúc single-VM và RPO/RTO mục tiêu, chưa có recovery drill.*

**[SRC-08]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/actions/runs/41313753319 *— CI success tại main, 01/11/2026.*

**[SRC-09]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/actions/runs/41313753297 *— API tests success tại main, 01/11/2026.*

**[SRC-10]** https://github.com/kieuquy283/EnterpriseE-commercePlatform/blob/main/scripts/hm/README.md *— Bằng chứng được ghi trong repo về pilot H&M 500 products, 1.874 variants.*

Chú giải độ tin cậy: “đã có code” chỉ thể hiện trong repository; “đã kiểm thử” yêu cầu test/evidence; “đã nghiệm thu” yêu cầu đạt acceptance criteria trên môi trường và dữ liệu được ghi rõ. Các thông tin ở tài liệu nguồn cũ có thể lỗi thời so với commit baseline.
