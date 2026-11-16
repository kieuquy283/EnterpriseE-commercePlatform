<a id="daymark--business-specification"></a>
# DAYMARK — đặc tả nghiệp vụ trong triển khai

[Đặc tả lấy nghiệp vụ làm gốc](../README.md#primary-business-first-specification) được ưu tiên về phạm vi và chính sách. Tài liệu này ánh xạ ý định đó sang triển khai DAYMARK và giữ các đề xuất chưa được đối chiếu thống nhất. Xem [ánh xạ và quyết định còn mở](../technical/requirements-mapping.md); mã nguồn có sẵn không phê duyệt chính sách còn mở.

Đặc tả xác định MVP dự kiến, không chứng nhận mọi yêu cầu đã triển khai. Bằng chứng nghiệm thu thuộc [kiểm thử](05-testing.md). Dự án là MVP giáo dục hướng đến vận hành thực tế, không phải nhà bán lẻ doanh nghiệp hoàn chỉnh.

<a id="business-problem-and-value"></a>
## Vấn đề nghiệp vụ và giá trị

DAYMARK là thương hiệu quần áo bán trực tiếp tới người tiêu dùng giả định tại Việt Nam, dành cho người trẻ chuyển giữa học tập, công việc và đời sống đô thị. Giá trị đề xuất là quần áo thường ngày linh hoạt, phom nhất quán, thông tin rõ ràng và đặt hàng đáng tin cậy. Khẩu hiệu: **Made for the everyday.** Người yêu cầu dự án đã duyệt thương hiệu DAYMARK, biểu tượng chim én/wordmark, bảng màu ngà/than/ô liu trầm và hướng thiết kế storefront ngày 15 tháng 11 năm 2026. Điều này không phê duyệt chính sách nghiệp vụ chưa giải quyết. Xem [tài sản thương hiệu](../brand/README.md). Tên và tài sản là nhận diện dự án, không khẳng định đã kiểm tra quyền nhãn hiệu hoặc tên miền.

Khách hàng cần tìm quần áo đúng phong cách/kích cỡ, hiểu giá cuối và khả năng cung ứng, đặt hàng một lần và biết diễn biến sau đó. Nhân viên cần danh mục, tồn kho và đơn hàng có một nguồn thẩm quyền. Quản trị viên cần truy cập có kiểm soát, phát hành lặp lại được và bằng chứng dịch vụ vẫn đúng khi có tải khuyến mãi hoặc lỗi phụ thuộc.

Kết quả chính là hành trình hoàn chỉnh, quan sát được: **nhập kho → công bố sản phẩm → khám phá → checkout → đơn hàng → xử lý giao hàng → đối soát giao nhận/COD**. Gợi ý hỗ trợ khám phá, không phải điều kiện mua hàng.

<a id="scope-and-operating-assumptions"></a>
## Phạm vi và giả định vận hành

| Quyết định | Ranh giới MVP |
| --- | --- |
| Thị trường | Việt Nam, VND; một người bán giả định và một kênh trực tuyến |
| Khách hàng | Người lớn mua quần áo thường ngày; khám phá không cần đăng nhập và hành trình tài khoản có xác thực |
| Danh mục | Mục tiêu 24–36 sản phẩm áo thun, sơ mi, quần và áo khoác nhẹ, có biến thể kích cỡ/màu; túi/mũ tùy chọn |
| Bộ sưu tập | Daily Essentials, Workday và Off Hours |
| Kho | Một địa điểm kho; nhân viên ghi nhập/điều chỉnh; không mua hàng nhà cung cấp hay tự động hóa kho |
| Giao hàng | Nhân viên xử lý và bàn giao đơn vị vận chuyển bên ngoài thủ công; ghi mã theo dõi khi có; không tích hợp đặt vận chuyển trực tiếp |
| Thanh toán | COD cho demo công khai; bộ mô phỏng chỉ dùng trong nghiệm thu cô lập ngoài production; không thu thẻ thật |
| Gợi ý | Tùy chọn/COULD theo FR-REC-01/02; mã similar/popular và cá nhân hóa vẫn có cổng bật. Phát hành cần đánh giá và chấp nhận phạm vi rõ ràng |
| Khuyến mãi | SHOULD/chờ chính sách; đề xuất chiến dịch giới hạn có sẵn không phải cam kết nghiệm thu bắt buộc |
| Đổi trả | Tùy chọn, chính sách còn mở; quy trình ngoại lệ của nhân viên là đề xuất, chưa phải lời hứa được duyệt |

Mục tiêu tải, độ sẵn sàng, khôi phục và ngân sách nằm ở [kiểm thử](05-testing.md), [vận hành](06-operations.md); không suy từ số sản phẩm. Danh mục mục tiêu là yêu cầu dữ liệu mẫu, không mô tả dữ liệu seed hiện tại. Seed thương mại tạo ba sản phẩm chung không ảnh và không tạo quản trị viên đầu tiên.

<a id="users-stakeholders-and-permissions"></a>
## Người dùng, bên liên quan và quyền

| Tác nhân | Trách nhiệm nghiệp vụ | Ranh giới truy cập |
| --- | --- | --- |
| Khách hàng | Khám phá, quản lý giỏ/tài khoản, đặt hàng và xem trạng thái riêng | Danh mục công khai; bản ghi cá nhân có xác thực; không truy cập dữ liệu khách khác |
| Nhân viên cửa hàng/vận hành | Duy trì danh mục/giá, nhận kho, rà đơn, đóng/giao kiện và đối soát giao nhận/COD | Medusa Admin có xác thực; chỉ chức năng và dữ liệu khách cần thiết |
| Quản trị viên | Cấp quyền nhân viên, cấu hình provider, duyệt phát hành, giám sát và khôi phục | Danh tính nhân viên riêng với khách; đặc quyền hạ tầng khác phiên khách/Admin |
| Đơn vị vận chuyển | Vận chuyển vật lý, trả bằng chứng giao hàng/COD | Bàn giao nghiệp vụ thủ công trong MVP; không có thông tin đăng nhập ứng dụng |
| Nhóm dự án/người đánh giá | Triển khai, đo và bảo vệ yêu cầu | Dữ liệu tổng hợp và bằng chứng làm sạch; không bí mật production hoặc xuất dữ liệu khách |

Vai trò mô tả trách nhiệm cần có. Phân quyền nhân viên chi tiết là mục nghiệm thu: có màn hình đăng nhập Medusa không chứng minh mô hình quyền đã cấu hình. Nếu Admin đã cài không thực thi được phân tách cần thiết, ghi giới hạn đã kiểm chứng và giới hạn demo cho người vận hành được duyệt; không tự đặt vai trò không được hỗ trợ.

<a id="business-requirements"></a>
## Yêu cầu nghiệp vụ

| ID | Kết quả bắt buộc | Bằng chứng thành công |
| --- | --- | --- |
| BR-01 | Khách chọn biến thể quần áo bán được với thông tin tin cậy | Đối chiếu ảnh, kích cỡ/màu, giá và khả năng cung ứng với dữ liệu mẫu |
| BR-02 | Mua hàng tạo một kết quả đơn, thanh toán và tồn kho nhất quán | Checkout xuyên suốt, đối soát thử lại và cạnh tranh |
| BR-03 | Nhân viên đưa đơn từ tiếp nhận đến giao và giải thích trạng thái giao/thanh toán | Hành trình Admin được ghi nhận và bàn giao vận chuyển/COD thủ công |
| BR-04 | Khách xem tiến độ và nhận xác nhận/cập nhật trạng thái đủ điều kiện một cách bất đồng bộ | Trang đơn là nguồn chuẩn; lỗi provider không đổi đơn/trạng thái; thông báo không khẳng định trạng thái chưa có chứng cứ |
| BR-05 | Khuyến mãi dùng được trong tải đã đo và lỗi có thể dự đoán ngoài mức đó | Bằng chứng tải, tăng đột biến và khôi phục cùng bất biến nghiệp vụ |
| BR-06 | Vận hành triển khai, bảo vệ, quan sát và khôi phục trong giới hạn công bố | CI/CD, kiểm tra truy cập, dashboard, quay lui/khôi phục và chi phí |
| BR-07 | Gợi ý cải thiện khám phá, giữ tính đúng thương mại và riêng tư | Ứng viên được phép, kiểm tra hợp lệ, dự phòng và đánh giá |

<a id="functional-requirements-and-flow-ownership"></a>
## Yêu cầu chức năng và luồng phụ trách

| ID | Yêu cầu | Liên kết nghiệp vụ | Luồng và ranh giới nghiệm thu |
| --- | --- | --- | --- |
| FR-01 | Đăng ký, đăng nhập/xuất và truy cập tài khoản sở hữu | BR-02, BR-06 | [FLOW-01](02-flows.md#flow-01--registration-and-login): thông tin đúng/sai, phiên và truy cập chéo khách |
| FR-02 | Duyệt bộ sưu tập, tìm sản phẩm và chọn biến thể | BR-01, BR-07 | [FLOW-02](02-flows.md#flow-02--catalog-search-and-suggestions): lọc/phân trang toàn kết quả đúng, ảnh và loại sản phẩm không hợp lệ |
| FR-03 | Tạo/duy trì giỏ đúng số lượng biến thể và tổng tiền có thẩm quyền | BR-02 | [FLOW-03](02-flows.md#flow-03--shopping-cart): đổi số lượng/xóa, thiếu tồn và cập nhật giá |
| FR-04 | Kiểm tra checkout và tạo một kết quả đơn có thể phục hồi | BR-02 | [FLOW-04](02-flows.md#flow-04--checkout-and-order-creation): địa chỉ/vận chuyển, timeout/thử lại và hoàn tất đồng thời |
| FR-05 | Biểu diễn COD và thanh toán thử thành công/thất bại không lặp hiệu ứng | BR-02 | [FLOW-05](02-flows.md#flow-05--payment-and-duplicate-handling): cô lập bộ mô phỏng khỏi production, phát lại và đối soát |
| FR-06 | Nhập, điều chỉnh, giữ chỗ, xuất giao và giải phóng tồn tại một kho | BR-01, BR-02, BR-03 | [FLOW-06](02-flows.md#flow-06--warehouse-and-inventory): cạnh tranh tồn, hủy và truy vết điều chỉnh |
| FR-07 | Hiển thị đúng tiến độ đơn/giao/thanh toán và theo dõi vận chuyển thủ công | BR-03, BR-04 | [FLOW-07](02-flows.md#flow-07--fulfillment-and-order-status): xử lý Admin và quyền sở hữu khách |
| FR-08 | Gửi xác nhận đơn và cập nhật trạng thái đơn/giao đủ điều kiện bất đồng bộ, thử lại giới hạn và chống trùng | BR-04, BR-06 | [FLOW-08](02-flows.md#flow-08--customer-notification): đúng sự kiện/trạng thái, provider gián đoạn, sự kiện lặp/trễ |
| FR-09 | Quản trị danh mục/đơn/tồn và báo cáo vận hành cơ bản | BR-03, BR-05, BR-06 | [FLOW-09](02-flows.md#flow-09--administration-and-reporting): truy cập, đối soát tổng và thao tác vận hành |

Cả chín ca sử dụng thuộc phạm vi nghiệm thu cốt lõi. Gợi ý là phạm vi nâng cao tùy chọn theo SRS ưu tiên; lựa chọn triển khai không biến nó thành cổng phát hành cốt lõi. Không cam kết trợ lý mua sắm AI. Gợi ý có thể xác định bằng quy tắc; phiên bản đầu không cần AI sinh nội dung hoặc tuyên bố chi phí token.

<a id="business-rules"></a>
## Quy tắc nghiệp vụ

| ID | Quy tắc |
| --- | --- |
| RULE-01 | Đơn vị mua được là biến thể/SKU xác định, không chỉ tên sản phẩm. Tồn kích cỡ/màu phải đối soát với kho đã chọn. |
| RULE-02 | Medusa có thẩm quyền về giá, khuyến mãi, vận chuyển, đơn và tồn. Tổng trên trình duyệt là tạm tính. Số tiền VND theo quy ước Medusa đã cài và được kiểm thử. |
| RULE-03 | Kiểm tra lại giá/khuyến mãi/khả năng cung ứng trước hoàn tất. Giảm giá hết hạn hoặc giá đổi không được âm thầm tạo giao dịch khác; hiển thị kết quả đối soát và yêu cầu khách xác nhận phù hợp. |
| RULE-04 | Tắt bán vượt tồn cho dữ liệu quần áo nghiệm thu. Mua thành công không vượt tồn bán được. Xác định và kiểm thử thời điểm giữ/trừ/giải phóng thực tế của workflow Medusa. |
| RULE-05 | Thử hoàn tất lại cùng giao dịch logic phải về kết quả cũ hoặc xung đột rõ có thể phục hồi; không tạo thu tiền/đơn thứ hai. Giỏ mới là giao dịch khác. |
| RULE-06 | Đặt COD không phải thu tiền. Trạng thái thanh toán, đơn, xử lý giao và giao vật lý riêng biệt. Chỉ ghi thu khi nhân viên có quyền xác minh bằng chứng. |
| RULE-07 | Hủy trước giao giải phóng giữ chỗ phù hợp qua thao tác thương mại được hỗ trợ. Đơn đã giao đi theo quy trình ngoại lệ/đổi trả; không sửa hàng cơ sở dữ liệu trực tiếp để giả hủy. |
| RULE-08 | Chỉ nhập lại hàng trả sau khi nhân viên kiểm tra/chấp nhận tình trạng. Hoàn tiền/đối soát riêng với điều chỉnh kho; ghi cách xử lý và lý do. |
| RULE-09 | Thông báo và gợi ý không phải điều kiện chốt đơn hợp lệ. Lỗi thông báo phải thử lại được và hiển thị cho vận hành. |
| RULE-10 | Gợi ý chỉ chứa sản phẩm được phép, hiển thị được, có giá và hiện hợp lệ. Artifact gợi ý không ghi đè kiểm tra thương mại gốc. |
| RULE-11 | Danh tính khách từ xác thực server đã kiểm chứng. Danh tính nhân viên riêng; không đăng ký admin công khai, mật khẩu mặc định dùng chung hoặc bí mật trong mã. |
| RULE-12 | Ảnh phải có quyền sở hữu/giấy phép hoặc được tạo có chủ đích. Không tải tài liệu riêng lên tiền tố ảnh công khai. Artifact nghiên cứu H&M phải qua cổng phát hành/riêng tư trước dùng công khai. |

<a id="boundaries-deliberately-excluded"></a>
## Ngoài phạm vi có chủ đích

Sàn đa người bán, phân bổ đa kho, mua hàng/ERP, đồng bộ POS, tích hợp vận chuyển tự động, thẻ thật, khách hàng thân thiết, đổi trả tự phục vụ, thuế quốc tế và chat mua sắm sinh nội dung nằm ngoài MVP. Không được trì hoãn luồng cốt lõi chỉ vì khó thực hiện.

<a id="implementation-versus-acceptance"></a>
## Triển khai và nghiệm thu

| Lĩnh vực | Nền tảng đã khảo sát | Điều phải chứng minh |
| --- | --- | --- |
| Thương mại | Next.js gọi Medusa cho tài khoản, danh mục, giỏ và checkout | Dữ liệu DAYMARK đầy đủ và hành trình trình duyệt đến Admin trên phiên bản cần nghiệm thu |
| Admin/kho | Có Medusa core và địa điểm/tồn seed | Cấp admin đầu, thao tác nhân viên hợp lệ và đối soát giao/COD |
| Thanh toán | Có nhãn COD và bộ mô phỏng ngoài production | Bất biến thử lại/trùng và thất bại trong môi trường chọn |
| Gợi ý | Có module/API tùy chỉnh và công cụ ngoại tuyến; cờ triển khai từng tắt | Đầu vào DAYMARK an toàn, đánh giá và cổng bật rõ |
| Thông báo | Đặc tả chưa chốt kênh/provider; cấu hình gửi thực tế chưa được xác minh | Triển khai xác nhận/cập nhật trạng thái đủ điều kiện bất đồng bộ và chứng minh lỗi provider |
| Cloud | Có bằng chứng triển khai đủ nền tảng theo ngày | Kiểm tra phiên bản/trạng thái triển khai; lịch sử thành công không chứng minh uptime/năng lực |

Trình tự triển khai và định nghĩa hoàn thành ở mục lục tài liệu. Trách nhiệm thành phần ở [kiến trúc](03-architecture.md); lưu trữ/hợp đồng ở [dữ liệu/API](04-data-api.md). Đổi các ranh giới nghiệp vụ cần cập nhật đặc tả được đánh giá và kiểm thử nghiệm thu tương ứng.

<a id="basic-operational-reports"></a>
## Báo cáo vận hành cơ bản

FR-09 phải có số lượng/giá trị đơn theo trạng thái trong khoảng ngày, khối lượng chờ xử lý và biến thể tồn thấp so ngưỡng công bố. Dùng múi giờ nghiệp vụ Việt Nam, ghi rõ khoảng thời gian. Đối soát tổng với đơn tổng hợp, kể cả hủy/trả. Giá trị đơn COD không phải doanh thu đã thu: chỉ báo số đã thu riêng khi có bằng chứng xác minh. Màn hình Medusa Admin hoặc bản xuất nhỏ có thể đáp ứng MVP; không yêu cầu kho phân tích hoặc dịch vụ BI riêng.
