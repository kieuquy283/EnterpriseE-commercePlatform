# DATA-02 — Kiểm chứng danh mục DAYMARK

**Ngày chạy** 18/11/2026, giờ Việt Nam. **Kết quả** PASS cho nhập danh mục và nhập lại trên môi trường test dùng riêng. Baseline mã là `1b6a668d06a5956da0692c268a93b9e5124bf1c3`. Danh mục dùng fixture v1 và manifest ảnh v2.

DATA-02 cung cấp đầu vào cho FR-02/FLOW-02 và tồn đầu kỳ cho FR-06. Quý và Quân có thể dùng bộ dữ liệu này cho kiểm thử danh mục, giỏ và checkout. DATA-03 dùng số liệu tồn trước/sau làm điểm đối chiếu giao dịch. [Kế hoạch DATA-02](../DAYMARK_Ke_Hoach_Tuan_1_Checkpoints_18_20_22_11_2026_v1.3_PhanBoCheckpoint.md) · [Truy vết yêu cầu](../03-requirements/requirements-traceability.md)

- [Manifest fixture đã đối chiếu](evidence/daymark-catalog-validation-2026-11-18/fixture-manifest.json) ghi handle, SKU, giá VND, tồn mở đầu, mapping ảnh, SHA-256 và mã HTTP quan sát.
- [Log chạy đã làm sạch](evidence/daymark-catalog-validation-2026-11-18/run-log.txt) ghi mã thoát của 12 bước, trích đoạn kết quả importer, các kiểm tra đọc lại và lý do từ chối.

## Môi trường và trình tự

Medusa `2.21.2` trên Windows, Node `24.21.0` và npm `11.12.1`. PostgreSQL `17.10` và Redis `7.4.11` chạy trong hai container Docker tạm chỉ mở cổng loopback. Medusa chạy với `NODE_ENV=test` và file provider cục bộ. Cả hai container được dừng sau lượt kiểm tra.

1. `medusa db:migrate` hoàn tất, log ghi **187 migration đã áp dụng** và kết thúc các migration script. `seed-commerce` tạo vùng **Vietnam** dùng VND, kênh **Online Store**, kho **Vietnam Warehouse** và phương thức thủ công **Standard delivery**. Đọc lại được ba sản phẩm bootstrap và chưa có dữ liệu DAYMARK.
2. Chạy các ca từ chối trên bộ dữ liệu thử trước lần import đầu. Xóa các sản phẩm draft dùng làm đầu dò qua workflow Medusa và kiểm tra trạng thái catalog hoạt động khớp baseline.
3. Chạy `--dry-run --images demo`. So sánh hai snapshot xác nhận không đổi danh mục, giá, tồn, ảnh hoặc liên kết. Chạy `--apply --images demo` và đối chiếu từng SKU, ảnh và liên kết qua Medusa.
4. Dùng `updateInventoryLevelsWorkflow` tăng tồn `DM-TEE-CORE-IVR-S` thêm 3 đơn vị tại kho mặc định, rồi chạy lại `--apply --images demo`. Đọc lại và so sánh fingerprint sau điều chỉnh với fingerprint sau rerun.
5. Khởi động Media/Store API Medusa ở loopback và GET 30 ảnh sản phẩm. So sánh mã HTTP, MIME, kích thước và SHA-256 với manifest.

## Kỳ vọng so với thực tế

Chỉ đếm các bản ghi thuộc dataset DAYMARK trong bảng này. Tồn ghi nhận là tồn vật lý `stocked_quantity` tại kho mặc định.

| Chỉ số | Kỳ vọng | Sau apply đầu | Sau chỉnh tồn và apply lại |
| --- | --- | --- | --- |
| Sản phẩm published | 30 | 30 | 30 |
| SKU và mức tồn duy nhất | 230 SKU, 230 mức tồn | 230 SKU, 230 mức tồn | 230 SKU, 230 mức tồn |
| Bộ sưu tập và danh mục | 3 và 6 | 3 và 6 | 3 và 6 |
| Giá nguyên đồng | Khớp fixture cho 230 SKU | 230/230 khớp VND | 230/230 khớp VND |
| Tồn toàn bộ | 2.554, tăng thành 2.557 sau chỉnh thử | 2.554 | 2.557 |
| Tồn `DM-TEE-CORE-IVR-S` | 24 lúc đầu, giữ 27 sau chỉnh thử | 24 | 27 |
| Ảnh sản phẩm | 30 liên kết, 30 tệp đúng hash | 30 liên kết, 30/30 tệp khớp | 30 liên kết, 30/30 tệp khớp, 30/30 HTTP 200 |
| Ảnh biên tập | 4 tệp nguồn khớp manifest | 4/4 khớp | 4/4 khớp |

Lần apply đầu tải 30 ảnh. Lần apply lại có **0 insert, 0 update, 0 conflict và 0 upload** trong các nhóm importer báo cáo. Hai snapshot sau chỉnh tồn và sau rerun trùng fingerprint cho các ID, giá, tồn, ảnh và liên kết đã đọc. Ba sản phẩm bootstrap và snapshot tồn ngoài fixture giữ nguyên. Database thử có 0 khách và 0 đơn trong cả hai snapshot.

## Ca từ chối và cách tái hiện

| Ca kiểm | Cách tái hiện trong môi trường dùng riêng | Kết quả quan sát |
| --- | --- | --- |
| SKU trùng trong fixture | Tạo một bản fixture thử với tiền tố SKU, màu và kích cỡ trùng giữa hai sản phẩm. Gọi `validateFixture`. | Validator báo SKU trùng. |
| SKU đã thuộc sản phẩm khác | Trước lần apply đầu, tạo sản phẩm draft ngoài dataset mang SKU `DM-TEE-CORE-IVR-S` qua Medusa workflow. | Importer từ chối apply và báo SKU đã được sử dụng. |
| Handle thiếu quyền sở hữu | Tạo sản phẩm draft có handle `dm-tee-heavy` với metadata thiếu `daymark_dataset=daymark-catalog`. | Importer từ chối apply và báo xung đột metadata. |
| Ảnh thiếu | Sao chép manifest và tài sản sang thư mục test, bỏ `dm-product-001.jpg` khỏi bản sao và trỏ `DAYMARK_CATALOG_ASSET_DIR` tới bản sao. | Importer từ chối apply do tệp ảnh bị thiếu. |
| Ảnh sai checksum | Trên bản sao, đổi một byte của `dm-product-001.jpg` và giữ nguyên kích thước. | Importer từ chối apply do checksum SHA-256 sai. |

Các lượt apply bị từ chối giữ nguyên snapshot catalog. Sau khi dọn đầu dò bằng workflow xóa sản phẩm, trạng thái catalog hoạt động khớp snapshot trước thử. Khi gặp blocker thật, đối chiếu SKU/handle và metadata sở hữu trước khi sửa bản ghi. Với lỗi ảnh, khôi phục tệp đúng từ manifest rồi chạy lại dry-run. [Quy tắc chủ sở hữu và chạy lặp](../catalog/DATASET.md#ownership-repeatability-and-stock-preservation)

## Tái lập và giới hạn

Dùng worktree mới tại baseline trên, dịch vụ PostgreSQL/Redis riêng và các cờ test ghi trong [runbook](../catalog/DATASET.md#separate-bootstrap-and-import). Từ `apps/backend`, lần lượt dùng các lệnh dưới đây. Đọc lại bằng Query Graph hoặc module service được hỗ trợ. Chạy điều chỉnh tồn và đối soát giữa hai lệnh apply. Chạy các ca từ chối trên một database mới seed hoặc trước khi apply lần đầu.

```sh
npm exec -- medusa db:migrate
npm run seed
npm run seed:daymark-catalog -- --dry-run --images demo
npm run seed:daymark-catalog -- --apply --images demo
npm run seed:daymark-catalog -- --apply --images demo
```

Không phát hiện sai lệch dữ liệu. Lượt chuẩn bị đầu dừng vì PowerShell tìm thấy nhiều bản Node, và lượt kế tiếp dừng trước migration vì worktree thiếu đường phân giải plugin `@medusajs/draft-order`. Lượt đạt chọn một Node rõ ràng và dùng dependency backend đã cài. Driver `pg` báo deprecation khi dùng client đồng thời ở một số bước. Mã thoát và các phép đối soát của lượt cuối đều đạt. Repo ghim Node `24.22.1`, nên cần chạy lại trên bản ghim khi dùng kết quả cho cổng phát hành.

Bốn ảnh editorial được kiểm tra ở lớp tệp nguồn. Phạm vi HTTP của lượt này là 30 ảnh đại diện sản phẩm qua Medusa cục bộ. Checkout, trạng thái tồn sau giao dịch và browser E2E thuộc các lượt nghiệm thu riêng.
