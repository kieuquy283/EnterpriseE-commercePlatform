# PHẠM VI DỰ ÁN VÀ CÁC GIẢ ĐỊNH


## 1. Mục đích và cách đọc tài liệu

Tài liệu PS-02 nêu rõ những gì phiên bản đầu tiên của đồ án cần làm, những phần có thể làm thêm và những phần không thực hiện. Phạm vi này dựa trên đề tài của giảng viên, kế hoạch Tuần 4–13 và mã nguồn đã kiểm tra. Một việc được ghi là “bắt buộc” không có nghĩa việc đó đã hoàn thành. [SRC-01, SRC-02, SRC-03]

**Mức ưu tiên:** MUST = phải có để nghiệm thu; SHOULD = nên có sau khi hoàn thành phần bắt buộc; COULD = có thể làm thêm; OUT = không làm trong đồ án. Tình trạng đã làm đến đâu được ghi riêng. **ADR** là ghi chép lý do chọn một giải pháp kỹ thuật.

## 2. Người dùng và các việc họ cần làm

Đồ án giả định một cửa hàng bán lẻ ở Việt Nam, bán bằng VND qua một kênh và một kho mẫu. Có ba nhóm người dùng: khách mua hàng, nhân viên vận hành và quản trị viên. Khách dùng website Next.js; Medusa quản lý tài khoản, sản phẩm, giỏ hàng, thanh toán, đơn hàng và tồn kho. Đồ án không xây hệ thống quản trị doanh nghiệp hay phục vụ nhiều doanh nghiệp trên cùng nền tảng.

| **Việc người dùng làm** | **Kết quả cần có** | **Giới hạn** |
| --- | --- | --- |
| J-01 Xem và chọn hàng | Xem sản phẩm, tìm theo từ khóa, chọn phiên bản và thấy giá/tình trạng bán tại Việt Nam. | Chưa cần công cụ tìm kiếm riêng nếu chức năng hiện tại đáp ứng nhu cầu. |
| J-02 Đặt hàng | Thêm, sửa, xóa hàng trong giỏ; nhập địa chỉ, chọn giao hàng, chọn COD hoặc thanh toán mô phỏng và tạo đơn. | Không nhận hoặc chuyển tiền thật. |
| J-03 Sau khi đặt hàng | Khách xem đơn và trạng thái; nhân viên xử lý đơn theo quyền được cấp. | Không theo dõi vị trí giao hàng của hãng vận chuyển. |
| J-04 Vận hành cửa hàng | Quản trị viên quản lý sản phẩm, tồn kho, đơn; bổ sung thông báo và số liệu vận hành. | Không xây lại toàn bộ giao diện quản trị Medusa. |

## 3. Những phần bắt buộc cho phiên bản đầu tiên

| **Mã** | **Chức năng** | **Cách biết đã đạt** | **Tình trạng hiện tại** |
| --- | --- | --- | --- |
| M-01 | Tài khoản và quyền truy cập | Khách đăng ký, đăng nhập, đăng xuất; không xem được đơn của người khác. Quản trị viên có quyền riêng. | Có mã nguồn; mới kiểm thử một phần. |
| M-02 | Sản phẩm | Chỉ hiển thị hàng đang bán, đúng giá cho Việt Nam và cho chọn phiên bản sản phẩm. | Có mã nguồn và kiểm thử. |
| M-03 | Tìm kiếm cơ bản | Tìm theo từ khóa, xem từng trang kết quả và thông báo khi không tìm thấy. | Có mã nguồn; chưa có công cụ tìm kiếm riêng. |
| M-04 | Giỏ hàng | Thêm, đổi số lượng, xóa hàng; Medusa tính tổng tiền. | Có mã nguồn và kiểm thử. |
| M-05 | Đặt hàng | Nhập địa chỉ, chọn giao hàng và cách thanh toán, tạo đơn và xem xác nhận. | Có mã nguồn và kiểm thử. |
| M-06 | Thanh toán an toàn | Có COD và công cụ mô phỏng thành công/thất bại ở môi trường thử nghiệm; kiểm tra bấm đặt hàng lặp không tạo đơn sai. | Đã thử thành công/thất bại; chưa đủ kiểm thử chống đơn trùng. |
| M-07 | Tồn kho chính xác | Số hàng còn và số hàng đã giữ cho đơn phải đúng khi đặt hoặc hủy đơn. | Có kết quả thử trên máy cá nhân; chưa thử nhiều đơn cùng lúc. |
| M-08 | Theo dõi đơn | Khách xem danh sách, chi tiết và trạng thái đơn; nhân viên xử lý đơn theo quyền. | Đã có danh sách/chi tiết; cần kiểm tra đầy đủ các trạng thái. |
| M-09 | Thông báo | Gửi email sau khi tạo đơn; lỗi email không làm hỏng đơn; có giới hạn số lần gửi lại. | Đã có hạ tầng xử lý nền, chưa có chức năng thông báo của dự án. |
| M-10 | Tốc độ tìm/xem hàng và ảnh | Có cách lưu tạm dữ liệu để tải nhanh, tìm sản phẩm và lưu ảnh hợp pháp; cập nhật dữ liệu kịp thời. | Redis đã cấu hình, S3 là tùy chọn; chưa đủ bằng chứng kiểm thử. |
| M-11 | Triển khai cloud | Môi trường thử nghiệm dùng HTTPS; tự động kiểm tra mã nguồn, có cách cập nhật và quay lại phiên bản trước. | Kiểm tra mã nguồn đã chạy; triển khai cloud chưa xác minh. |
| M-12 | Bảo mật và vận hành | Kiểm tra quyền, bảo vệ thông tin bí mật, ghi lỗi và cảnh báo khi có sự cố. | Mới hoàn thành một phần. |
| M-13 | Đo tốc độ và khôi phục | Kiểm thử lượng truy cập, sao lưu và khôi phục dữ liệu, ghi chi phí. | Có kịch bản và hướng dẫn; chưa có báo cáo kết quả đầy đủ. |

## 4. Phần có thể làm thêm khi đủ điều kiện

| **ID** | **Hạng mục** | **Điều kiện được phép triển khai** |
| --- | --- | --- |
| O-01 | Mở rộng danh sách sản phẩm bằng dữ liệu H&M | Xác nhận quyền dùng dữ liệu và ảnh; không làm hỏng luồng mua hàng hoặc quá tải cơ sở dữ liệu. |
| O-02 | Gợi ý sản phẩm theo nhiều cách | Hoàn thành phần bắt buộc trước; đo chất lượng gợi ý bằng dữ liệu đã chuẩn bị và chỉ gợi ý hàng có thể bán. |
| O-03 | Công cụ tìm kiếm riêng, như Meilisearch | Chỉ bổ sung nếu có số liệu cho thấy tìm kiếm hiện tại không đáp ứng yêu cầu. |
| O-04 | Báo cáo nâng cao và gợi ý theo từng người | Có mục đích và cách đo rõ ràng; không vượt giới hạn chi phí hoặc quyền riêng tư. |
| O-05 | Dịch vụ lưu dữ liệu/ảnh do nhà cung cấp quản lý | Có quyết định bằng văn bản về chi phí, bảo mật và vận hành; không coi là đã triển khai. |
| O-06 | Tự tăng số máy chủ khi đông khách | Chỉ cân nhắc sau khi đo tải và thấy nhu cầu thực tế. |

## 5. Những việc không làm trong đồ án

- Nhận tiền thật, lưu thông tin thẻ, xin chứng nhận thanh toán; không dùng Payment Simulator ở môi trường production.
- Phục vụ nhiều người bán hoặc nhiều doanh nghiệp trên cùng hệ thống; không xây đầy đủ hệ thống kế toán, kho hay quản lý khách hàng của doanh nghiệp.
- Theo dõi tài xế, vận chuyển ngoài đời thật hoặc đối soát tiền COD thực tế.
- Chia hệ thống thành nhiều dịch vụ độc lập quy mô lớn, chạy ở nhiều vùng địa lý hoặc cam kết hoạt động liên tục 24/7.
- Biến lịch sử mua của H&M thành đơn hàng thật của dự án hoặc công khai ảnh/dữ liệu chưa được cấp quyền.
- Xin chứng nhận tuân thủ hoặc thực hiện kiểm thử xâm nhập chuyên sâu.

## 6. Ai chịu trách nhiệm về từng phần

| **Phần việc** | **Dự án chịu trách nhiệm** | **Giới hạn** |
| --- | --- | --- |
| Giao diện | Next.js hiển thị trang, nhận thông tin khách nhập và lưu cookie cần thiết. | Không sửa trực tiếp cơ sở dữ liệu mua hàng. |
| Bán hàng | Medusa quản lý sản phẩm, giá, giỏ, đơn, thanh toán và tồn kho. | Không sửa lõi Medusa hoặc ghi thẳng vào bảng dữ liệu chính. |
| Vận hành | GitHub Actions và Compose hỗ trợ kiểm tra, triển khai, theo dõi lỗi, sao lưu/khôi phục. | Nhà cung cấp cloud vẫn quản lý phần hạ tầng thuộc trách nhiệm của họ. |
| Thông báo | Dự kiến xử lý việc gửi email sau khi tạo đơn. | Dịch vụ gửi email bên ngoài có thể gặp sự cố. |
| Ảnh sản phẩm | Medusa giữ thông tin và đường dẫn ảnh; ảnh được lưu ở nơi phù hợp. | Không công khai ảnh khi chưa có quyền sử dụng. |
| Gợi ý sản phẩm (tùy chọn) | Chuẩn bị dữ liệu H&M và liên kết mã sản phẩm H&M với Medusa. | Không gán lịch sử mua H&M cho khách thật của dự án. |

## 7. Sản phẩm bàn giao và cách nghiệm thu

| **Sản phẩm bàn giao** | **Nhóm phụ trách đề xuất** | **Cần có để nghiệm thu** |
| --- | --- | --- |
| Định nghĩa dự án, phạm vi và yêu cầu | Trưởng nhóm / người viết yêu cầu | Đã rà các mã yêu cầu, phạm vi và quyết định còn mở. |
| Sơ đồ hệ thống và lý do chọn thiết kế | Nhóm thiết kế / backend / vận hành | Sơ đồ đúng mã nguồn, giải thích dữ liệu đi đâu và điểm mạnh/yếu của lựa chọn. |
| Phiên bản bán hàng đầu tiên | Backend + frontend | Khách mua hàng từ đầu đến cuối trên môi trường thử nghiệm; có kết quả thử khi lỗi. |
| Báo cáo thanh toán và tồn kho | Backend + kiểm thử | Thử bấm đặt hàng lặp, thanh toán lỗi và nhiều khách mua cùng lúc; đọc lại dữ liệu để đối chiếu. |
| Gửi thông báo sau khi đặt hàng | Backend + vận hành | Tiến trình nền gửi/thử lại; lỗi email không làm mất đơn. |
| Quyết định về dữ liệu tạm, tìm kiếm, ảnh | Backend + vận hành | Ghi lý do chọn cách làm, kiểm tra dữ liệu cập nhật và ảnh hiển thị hợp lệ. |
| Triển khai lên cloud | Nhóm vận hành | Có địa chỉ HTTPS, nhật ký triển khai và kết quả diễn tập cập nhật/quay lại. |
| Bảo mật và theo dõi sự cố | Kiểm thử + vận hành | Thử truy cập sai quyền, lưu ảnh màn hình số liệu và cảnh báo. |
| Báo cáo tốc độ, khôi phục, chi phí | Kiểm thử + vận hành | Có kết quả k6, thời gian phản hồi/lỗi, diễn tập khôi phục và chi phí. |
| Bộ tài liệu/demo cuối | Cả nhóm | Bảng đối chiếu yêu cầu, nhật ký, ảnh, kịch bản demo và danh sách cần nộp. |

## 8. Lịch thực hiện từ Tuần 4 đến Tuần 13

| **Tuần** | **Việc cần làm** | **Cần có để hoàn thành tuần** |
| --- | --- | --- |
| 4 | Chốt thiết kế, nguồn dữ liệu chính, danh sách việc và yêu cầu | Nhóm xem lại trách nhiệm từng phần và lý do chọn thiết kế. |
| 5 | Đăng nhập, sản phẩm, lựa chọn sản phẩm và tìm kiếm | Kiểm tra các yêu cầu liên quan và sơ đồ dữ liệu. |
| 6 | Giỏ hàng, đặt hàng và xem đơn | Thử một đơn thành công và ghi lại từng bước. |
| 7 | Thanh toán, bấm đặt hàng lặp, tồn kho | Có kết quả thử thành công, thất bại, gửi lại và đặt cùng lúc. |
| 8 | Xử lý nền, thông báo, theo dõi đơn | Thử email lỗi nhưng đơn vẫn tồn tại. |
| 9 | Tốc độ tải trang, tìm kiếm và ảnh | Dữ liệu cập nhật đúng; ảnh có quyền sử dụng và hiển thị được. |
| 10 | Triển khai cloud thử nghiệm và quay lại bản cũ | Đặt hàng từ đầu đến cuối trên cloud, có nhật ký triển khai. |
| 11 | Bảo mật, nhật ký và số liệu | Có bảng theo dõi và kết quả rà quyền truy cập. |
| 12 | Đo tải, thử sự cố/khôi phục và chi phí | Có báo cáo tốc độ và kết quả khôi phục dữ liệu. |
| 13 | Dừng thêm tính năng, xử lý phần còn thiếu, demo | Đối chiếu đủ yêu cầu hoặc ghi rõ lý do hoãn. |

## 9. Các giả định và cách kiểm tra

| **ID** | **Giả định / tình trạng** | **Cách xác minh & owner** |
| --- | --- | --- |
| A-01 | Cửa hàng và lượng đơn chỉ là tình huống học tập, không có số bán hàng thực tế. | Trưởng nhóm ghi rõ giả định trong báo cáo. |
| A-02 | Bán tại Việt Nam, dùng VND và một kho là đủ cho phần bắt buộc. | Nhóm phụ trách sản phẩm hỏi ý kiến giảng viên. |
| A-03 | Một máy chủ đủ cho bản demo ban đầu, chưa có hệ thống dự phòng ở nhiều nơi. | Nhóm vận hành đo CPU, RAM, tốc độ ổ đĩa và chi phí. |
| A-04 | 30 yêu cầu xem sản phẩm/giây và 3 yêu cầu đặt hàng/giây là mức thử nghiệm, không phải dự báo nhu cầu. | Nhóm kiểm thử chốt điều kiện và cách chạy bài đo. |
| A-05 | COD và công cụ mô phỏng không chứng minh đã thu tiền. | Nhóm backend/kiểm thử đối chiếu mã nguồn và tài liệu. |
| A-06 | Redis và worker là nền tảng để bổ sung việc gửi thông báo sau. | Nhóm backend xây phần thông báo rồi thử khi dịch vụ hỗ trợ gặp lỗi. |
| A-07 | Mục tiêu là mất tối đa 60 phút dữ liệu và khôi phục trong 120 phút; hiện chưa đo thực tế. | Nhóm vận hành diễn tập sao lưu, khôi phục. |
| A-08 | Chưa chốt ngân sách cloud mỗi tháng. | Trưởng nhóm và nhóm vận hành duyệt ngân sách trước khi triển khai. |
| A-09 | Chỉ dùng dữ liệu và ảnh H&M trong phạm vi được cho phép. | Người phụ trách dữ liệu kiểm tra điều khoản Kaggle và quyền dùng ảnh. |
| A-10 | Bài kiểm thử trình duyệt trên nhánh `recommendation` chưa có trên `main`; dữ liệu mẫu chưa được kiểm đếm lại ở cơ sở dữ liệu hiện tại. | Nhóm kiểm thử chuyển bài test, chạy lại và lưu kết quả. |

## 10. Giới hạn và những việc còn phải quyết định

| **Mã** | **Ràng buộc / quyết định** | **Hệ quả** |
| --- | --- | --- |
| C-01 | Hạn cuối Tuần 13, nhóm khoảng 5–7 người và thời gian có hạn. | Ưu tiên hoàn thành luồng mua hàng; việc thêm không được làm trễ phần chính. |
| C-02 | Dự án dùng Medusa 2.21.2 và Node/npm; không sửa lõi Medusa. | Dùng các API/quy trình Medusa hỗ trợ và kiểm thử đúng phiên bản. |
| C-03 | PostgreSQL từng hết số kết nối cho phép trên máy cá nhân. | Nhập dữ liệu theo đợt, hạn chế nhiều việc chạy cùng lúc và đo số kết nối. |
| D-01 | Chọn nhà cung cấp cloud và nơi chạy PostgreSQL. | Trưởng nhóm và nhóm vận hành phải so sánh chi phí, ghi lý do chọn. |
| D-02 | Chọn dịch vụ email thử nghiệm. | Cần gửi thử, kiểm tra gửi lại khi lỗi và lưu kết quả. |
| D-03 | Chọn nơi lưu ảnh sản phẩm. | Cần xác nhận quyền dùng ảnh và cách giới hạn quyền truy cập. |
| D-04 | Chọn mục tiêu thời gian hệ thống hoạt động và khoảng thời gian đo. | Một máy chủ không có dự phòng khi chính máy đó hỏng. |

## 11. Khi nào một mốc được xem là hoàn thành

Chỉ đánh dấu một mốc là **đã nghiệm thu** khi có: (1) tài liệu hoặc mã nguồn gắn với một bản lưu Git cụ thể; (2) kết quả kiểm thử hoặc demo ghi rõ ngày giờ, môi trường và dữ liệu; (3) kết quả đáp ứng tiêu chí đã đặt ra; và (4) người phụ trách đã xem lại. Trạng thái nên ghi rõ là: chưa bắt đầu, đang làm, đã viết nhưng chưa thử, đã thử trên máy cá nhân, đã thử trên môi trường cloud, đã nghiệm thu hoặc hoãn/không làm.

| **Gate** | **Chấp nhận khi** | **Không được tính là đạt chỉ vì** |
| --- | --- | --- |
| G-1 Mua hàng | Đăng nhập, xem hàng, thêm giỏ, đặt và xem đơn trên môi trường cloud thử nghiệm. | Chỉ có đường dẫn API nhưng chưa thử cả hành trình. |
| G-2 Dữ liệu chính xác | Đã thử lỗi, gửi lại, nhiều yêu cầu cùng lúc và đọc lại đơn/tồn kho. | Chỉ có một bài thử thành công. |
| G-3 Cloud | Có địa chỉ HTTPS, nhật ký triển khai và kết quả tập quay lại bản cũ. | Chỉ có tệp cấu hình hoặc hướng dẫn. |
| G-4 Chất lượng hệ thống | Có báo cáo k6, thời gian phản hồi/lỗi, tài nguyên, khôi phục và chi phí. | Chỉ ghi mức mục tiêu trong mã nguồn. |
| G-5 Bàn giao | Có bảng đối chiếu yêu cầu, kết quả bảo mật, kịch bản demo và phần còn thiếu đã được duyệt. | Slide tự nói “sẵn sàng dùng thật” mà không có bằng chứng. |

## 12. Cách quản lý thay đổi và quay lại phiên bản trước

Mỗi đề nghị thay đổi cần ghi mã, yêu cầu liên quan, việc muốn thêm/sửa/hoãn, lý do, ảnh hưởng tới người dùng, dữ liệu, tốc độ, bảo mật và chi phí, mức ưu tiên, thời gian cần làm, người duyệt, cách kiểm thử và cách quay lại nếu có lỗi. Không được tự chuyển việc bắt buộc thành việc tùy chọn nếu chưa có quyết định được ghi lại.

Khi bản mới gặp lỗi, nhóm cần có cách đưa mã nguồn và cấu hình về bản ổn định. Việc thay đổi cấu trúc cơ sở dữ liệu phải được thiết kế để không làm mất dữ liệu khi quay lại. Với sản phẩm hoặc đơn thử, dùng dữ liệu mẫu riêng hoặc ngừng hiển thị sản phẩm theo quy trình; không xóa cả cơ sở dữ liệu để “làm sạch”. Không chạy `docker compose down -v` với dữ liệu cần giữ.

## 13. Việc đã xác nhận và việc còn lại

| **Đã xác nhận qua source/evidence** | **Cần làm tiếp** |
| --- | --- |
| Có Medusa, website và Docker Compose; các bài kiểm tra CI/API gần nhất đã chạy thành công. | Cần triển khai cloud thử nghiệm, theo dõi số liệu và thử khôi phục. |
| Công cụ mô phỏng thanh toán thành công/thất bại đã có trên `main`, cùng bài kiểm thử đặt hàng cơ bản. | Cần thử bấm đặt hàng lặp và nhiều khách mua hàng cuối cùng cùng lúc. |
| Redis và tiến trình nền đã được cấu hình. | Cần viết chức năng gửi thông báo và kiểm tra gửi lại khi lỗi. |
| README ghi nhận đã nhập thử 500 sản phẩm H&M với 1.874 phiên bản. | Chưa nhập nhiều hơn trước khi kiểm chất lượng, quyền sử dụng và tài nguyên máy. |
| Có bài kiểm thử trình duyệt Playwright trên nhánh `recommendation`. | Cần đưa về nhánh dựa trên `main`, chạy tự động và lưu kết quả. |

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
