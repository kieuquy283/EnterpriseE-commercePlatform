<a id="daymark-catalog-fixture-and-importer"></a>
# Dữ liệu mẫu danh mục DAYMARK và công cụ nhập

Bộ dữ liệu thực hiện phần đầu vào danh mục của FR-02/FLOW-02 và tồn đầu kỳ cho FR-06. Đây là danh mục giả định phục vụ học tập/minh họa, không chứng minh hàng đã sản xuất hoặc luồng nhân viên xử lý giao hàng hoàn chỉnh.

| Hạng mục | Nội dung |
| --- | --- |
| Nguồn | `apps/backend/src/scripts/daymark-catalog/fixture.ts` |
| Sản phẩm / biến thể | 30 / 230 SKU kích cỡ–màu duy nhất |
| Bộ sưu tập | Daily Essentials, Workday, Off Hours |
| Danh mục | Áo thun, Áo sơ mi, Quần, Áo khoác, Đồ dệt kim, Túi xách |
| Thị trường | Việt Nam / VND; số tiền nguyên đồng ghi qua Medusa |
| Tồn đầu kỳ | 2.554 đơn vị trên 230 biến thể tại kho mặc định đã khởi tạo |
| Định danh | Handle `dm-*`, SKU `DM-*` ổn định và metadata sở hữu `daymark_dataset=daymark-catalog` |
| Nội dung | Tên sản phẩm/bộ sưu tập tiếng Anh; mô tả sản phẩm, nhãn danh mục/màu tiếng Việt |
| Ảnh sản phẩm | 30 ảnh quần áo đại diện ánh xạ đến 30 handle; là ảnh minh họa, không phải ảnh SKU do DAYMARK sản xuất |

Ba mươi ảnh sản phẩm và bốn ảnh biên tập nằm trong `apps/backend/assets/daymark-catalog`. Storefront dùng bốn ảnh danh mục được chọn cho hai ảnh hero và bìa Workday, Daily Essentials; các phần thương hiệu khác dùng ảnh biên tập. Mỗi ảnh sản phẩm gắn với một handle, minh họa loại trang phục và bảng màu DAYMARK, không xác thực SKU vật lý hoặc mọi tùy chọn kích cỡ/màu. Không dùng tài sản H&M/nghiên cứu.

<a id="separate-bootstrap-and-import"></a>
## Tách khởi tạo thương mại và nhập danh mục

`seed-commerce.ts` khởi tạo vùng, kênh/khóa, kho, vận chuyển và ba sản phẩm cũ. Script này độc lập với công cụ nhập và không tự chạy. Không tạo tài khoản quản trị/mật khẩu mặc định. Công cụ nhập đọc vùng Việt Nam, kênh bán/địa điểm mặc định và hồ sơ vận chuyển mặc định; từ chối nếu thiếu điều kiện. Chỉ đọc được các mục này không chứng nhận cấu hình vận chuyển/provider/nhân viên.

Không chạy hai script trên AWS hoặc cơ sở dữ liệu dùng chung. Dùng dịch vụ cục bộ có thể bỏ đi. Các sản phẩm cũ của bước khởi tạo được giữ nguyên.

```sh
# From the repository root; DATABASE_URL must already target a disposable local database.
npm run seed:daymark-catalog --workspace=@dtc/backend
npm run seed:daymark-catalog --workspace=@dtc/backend -- --dry-run

DAYMARK_CATALOG_WRITE=1 DAYMARK_CATALOG_ENVIRONMENT=local-disposable \
  npm run seed:daymark-catalog --workspace=@dtc/backend -- --apply
```

Script package cung cấp dấu phân cách `--` của Medusa. Công cụ nhập nhận các đối số bên dưới, mặc định dry-run; chế độ local từ chối production, cờ chế độ không rõ/không hợp lệ, URL kết nối thiếu/sai/không phải PostgreSQL và máy chủ từ xa. Apply cần cả hai biến cho phép ở trên. Biến ghi đè từ xa cũ không có hiệu lực. Báo cáo không chứa thông tin xác thực cơ sở dữ liệu.

Tùy chọn `--images none|manifest|demo|preview` mặc định `none`. `manifest` nhận ánh xạ ảnh đúng sản phẩm. `demo` chỉ gắn ảnh đại diện khi `NODE_ENV=test`, `DAYMARK_LOCAL_IMAGE_BACKEND_URL` là URL loopback và không cấu hình S3 provider. `DAYMARK_CATALOG_ASSET_DIR` có thể trỏ đến thư mục dữ liệu mẫu cục bộ. Kiểm tra kích thước tệp, checksum và ánh xạ sản phẩm trước khi ghi. Không coi ảnh đại diện là ảnh hàng hóa chính xác.

<a id="ownership-repeatability-and-stock-preservation"></a>
## Quyền sở hữu, chạy lặp và bảo toàn tồn kho

Bộ lập kế hoạch thuần in số lượng thêm/cập nhật/bỏ qua/xung đột và thay đổi. Apply từ chối điều kiện chặn, rồi dùng workflow Medusa được hỗ trợ và query.graph; không dùng SQL hoặc client cơ sở dữ liệu trực tiếp.

Handle đã có nhưng thiếu metadata sở hữu DAYMARK là xung đột. SKU trùng giữa sản phẩm hoặc SKU tồn kho mồ côi chặn ghi. Bộ tùy chọn không khớp cần đối soát thủ công. Không xóa sản phẩm, đơn, khách hàng, biến thể hoặc liên kết danh mục không liên quan. Giữ biến thể bổ sung, danh mục, tiền tệ khác, giá theo bậc/quy tắc và nội dung đa phương tiện hiện có.

Chỉ khởi tạo tồn đầu kỳ khi chưa có mức tồn; **không đặt lại mức tồn đã có**, kể cả số lượng đã đổi do mua hàng, giữ chỗ hoặc điều chỉnh của nhân viên. Nhập lại danh mục không phải nhập thêm hàng. Apply đọc lại tồn hiện tại trước khi tạo mức còn thiếu và kiểm tra việc còn lại từ ảnh chụp dữ liệu mới. Apply chưa hoàn tất phải báo lỗi rõ, có thể phục hồi bằng lần chạy lại được đánh giá; không khẳng định toàn bộ chuỗi workflow là một giao dịch nguyên tử hoặc an toàn khi nhiều tiến trình nhập chạy đồng thời.

<a id="media-delivery"></a>
## Phân phối nội dung đa phương tiện

Nội dung đi qua file provider Medusa được cấu hình. Chế độ demo cục bộ tường minh chỉ dùng local file provider và URL loopback. Trong chế độ proxy S3, `S3_FILE_URL` phải trỏ `https://<backend>/product-images`, còn provider thêm tiền tố khóa `public-images/`. Công cụ nhập kiểm tra URL trả về theo ranh giới provider đã cấu hình và từ chối URL bucket trực tiếp/khóa lồng. Chế độ `cloud-demo` dành riêng cho preview được duyệt: target Sydney RDS và DB phải khớp chính xác, fixture/manifest có SHA-256 được rà, apply cần cờ ghi rõ. `--images preview` yêu cầu xác nhận ảnh minh họa và S3 proxy; không đổi nhãn ảnh thành chính xác. Xem [runbook AWS](../../deploy/RUNBOOK.md) cho asset directory trong artifact, dry-run/apply và xác minh. Không chạy seed từ startup.

## Kiểm chứng quy trình nhập

Kiểm thử trên PostgreSQL/Redis dùng riêng: chạy kiểm tra trước, áp dụng bộ dữ liệu, rồi áp dụng lại. Lần chạy lại không được tạo sản phẩm, biến thể hoặc ảnh trùng. Đối chiếu số lượng tồn, khách hàng và đơn hàng trước/sau để xác nhận dữ liệu có sẵn được giữ nguyên. Thử thêm trường hợp trùng SKU, sai quyền sở hữu, thiếu điều kiện khởi tạo và tệp ảnh sai checksum.

Ảnh minh họa không thay cho ảnh chính xác của từng sản phẩm hoặc biến thể. Kiểm thử nhập dữ liệu không chứng minh quy trình thông báo, xử lý đơn của nhân viên hoặc vận hành cloud. Kết quả từng lần chạy thuộc CI hoặc báo cáo nghiệm thu tương ứng.
