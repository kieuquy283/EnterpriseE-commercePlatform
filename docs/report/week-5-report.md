# Báo cáo công việc tuần 5 — Trung

> Bộ Git chỉ gồm 19 file mã nguồn, tests và tài liệu. Evidence JSON/CSV/snapshots được giữ local để bàn giao riêng.

| Thông tin | Nội dung |
| --- | --- |
| Người phụ trách | Trung |
| Ngày tổng hợp | 08/11/2026, giờ Việt Nam (UTC+07) |
| Dự án | EnterpriseE-commercePlatform — Medusa |
| Nhánh hiện tại | `week5-hm-concurrency` |
| Source baseline | `034ced782078c05da6d86e99ecf03a9523121a20`; mã công cụ được đối chiếu bằng source hash trong evidence |
| Môi trường kiểm chứng | Local/development; Node 24.21.0, npm 11.12.1, Medusa 2.21.2, PostgreSQL và Redis local |
| Trạng thái | Hoàn thành phạm vi tuần 5 của Trung; bộ bàn giao Git chỉ gồm các file cần thiết |

Nhánh đã được đổi tên từ `codex/week5-trung-hm-concurrency` sang `week5-hm-concurrency`. Metadata trong evidence giữ nguyên tên nhánh tại thời điểm thực thi; đường dẫn worktree và các run ID không thay đổi.

## 1. Mục tiêu được giao

Kiểm tra chất lượng dữ liệu H&M đã chuẩn bị và nhập vào Medusa; đối chiếu H&M Article ID với Medusa Product ID/Variant ID; phát hiện dữ liệu trùng, thiếu, giá hoặc cấu hình tồn kho không hợp lệ. Bổ sung kiểm thử hai khách đặt hàng đồng thời khi tồn kho thấp, kèm báo cáo và bằng chứng có thể kiểm tra lại.

Phạm vi không bao gồm xây dựng Recommendation API/UI, huấn luyện mô hình hoặc triển khai AWS.

## 2. Tổng hợp kết quả

| Hạng mục | Kết quả thực tế |
| --- | --- |
| Kiểm tra dữ liệu nguồn | Đã quét 105.542 article, xác định 48.012 nhóm theo quy tắc chuẩn bị dữ liệu |
| Phạm vi catalog được chọn | 500 sản phẩm, 1.874 article/variant |
| Kiểm tra file và mapping offline | PASS; số lượng, schema, định danh, grouping và hash khớp; 0 lỗi được phát hiện trong các phép kiểm đã chạy |
| Import development được cho phép | Tạo 500 sản phẩm; mapping mới gồm 1.874 variant; giữ nguyên mapping gốc |
| Đối chiếu Medusa live | 500 sản phẩm, 1.874 variant và 1.874 inventory item/level được kiểm; 1.874/1.874 dòng mapping đạt; 0 finding |
| Kiểm tra chạy lại import có giới hạn | Hai sản phẩm/sáu variant: tạo thêm 0 sản phẩm, 6/6 ID giữ nguyên |
| Checkout đồng thời | Bốn ca độc lập, 60/60 điều kiện kiểm tra đạt; mỗi ca chỉ có một Order và một reservation hợp lệ |
| Kiểm tra công cụ | 33 Jest tests và 8 Python tests đạt; có regression tests cho hai điểm P2 |
| Kiểm tra mã nguồn | Lint không lỗi/cảnh báo; typecheck và build backend đạt |
| Tài liệu | Có spec, phase, báo cáo dữ liệu, báo cáo concurrency, evidence và hướng dẫn chạy lại |

Kết quả H&M live cuối sử dụng **mapping development mới sau lần import được người dùng cho phép**. Kết quả FAIL khi đối chiếu mapping ZIP gốc với database ban đầu được giữ riêng, không sửa thành PASS.

## 3. Công việc đã thực hiện

### 3.1. Khảo sát yêu cầu và chuẩn bị môi trường làm việc

- Đọc [kiến trúc cloud](../architecture/cloud-system-architecture.md), [định nghĩa dự án](../01_Project_Definition.md), [phạm vi và giả định](../02_Project_Scope_and_Assumptions.md), [đặc tả yêu cầu phần mềm](../03_Software_Requirements_Specification.md).
- Đối chiếu nhiệm vụ với FR-REC-01, FR-INV-01/02 và BR-02/09/13/14; đọc hướng dẫn H&M, importer và bằng chứng inventory tuần trước.
- Tạo branch/worktree riêng từ `main`, bảo toàn các thay đổi sẵn có của người dùng ở thư mục làm việc ban đầu.
- Tạo [spec.md](week-5-trung/spec.md) và [phase.md](week-5-trung/phase.md) trước khi triển khai; cập nhật theo kết quả thực tế.

### 3.2. Kiểm tra dữ liệu H&M offline

Nguồn được cung cấp là `hm.zip`; `C:\hm` cũng chứa các file CSV và artifact đã xử lý, không chứa bản backup PostgreSQL. Chỉ lấy bốn file cần cho task vào thư mục `data/hm/` được Git bỏ qua:

- `articles.csv`.
- `processed/catalog.jsonl`.
- `processed/manifest.json`.
- `processed/medusa-mapping.jsonl`.

Đã viết công cụ tự động kiểm schema bắt buộc, Article ID dạng chuỗi và số 0 đầu, định danh trùng/thiếu, article có trong nguồn, quy tắc nhóm sản phẩm, product key, source hash, số lượng và checksum trong manifest. Công cụ đối chiếu đầy đủ mapping của mẫu catalog để tìm dòng thiếu/dư/trùng hoặc quan hệ article–product–variant không nhất quán.

Quy tắc nhóm sử dụng tổ hợp `product_code`, loại sản phẩm, nhóm sản phẩm, bộ phận và section. Nhiều article thuộc cùng product là hợp lệ; article nguồn chưa được chọn vào batch không bị coi là thiếu mapping.

**Kết quả:** nguồn 105.542 article, catalog 500 sản phẩm/1.874 article và 1.874 mapping đều nhất quán trong các phép kiểm đã chạy. Không đọc bản ghi khách hàng hoặc lịch sử giao dịch; không đưa raw dataset vào báo cáo hay Git.

### 3.3. Xử lý khác biệt giữa mapping gốc và database

Lần đối chiếu đầu tiên phát hiện database development chỉ có bốn sản phẩm/bốn variant mẫu và chưa có H&M. Các ID trong mapping ZIP không tồn tại ở database này. Đã lưu kết quả FAIL và nguyên trạng mapping để truy vết; đây là khác biệt về database/ID với lần import trước.

Sau khi được người dùng cho phép:

- Nhập giới hạn catalog 500 sản phẩm thông qua workflow Medusa; tạo 1.874 variant.
- Ghi mapping development mới tại `data/hm/processed/medusa-mapping.development-20261108.jsonl`.
- Giữ nguyên `medusa-mapping.jsonl` gốc. SHA-256 của file gốc sau thao tác vẫn là `38c1acef5c6732cb89107cd07b31ccc0df2b1031a65e8f6c0aa840e7f4113422`.
- Bổ sung lựa chọn đường dẫn input/output cho importer; output mapping được chỉ định rõ ràng sử dụng cơ chế tạo file độc quyền để từ chối ghi đè file đã có.

Giá VND và tồn kho là dữ liệu mô phỏng phục vụ development. Importer khởi tạo 20 đơn vị mỗi variant; dữ liệu này không đại diện cho giá hoặc tồn kho thật của H&M.

Chạy lại importer trên hai nhóm đã có, gồm sáu variant, cho kết quả 0 sản phẩm mới, hai sản phẩm existing và 6/6 ID mapping giữ nguyên. Phép kiểm này chỉ áp dụng cho mẫu hai nhóm, không khẳng định đã chạy lại toàn bộ catalog 500 sản phẩm.

### 3.4. Đối chiếu mapping, giá và tồn kho trên Medusa

Đọc dữ liệu qua Medusa Product/Inventory module services và `query.graph`, không sử dụng raw SQL hoặc DB client riêng. Công cụ audit chỉ đọc, không tự sửa dữ liệu.

Đã kiểm toàn bộ mẫu theo chuỗi:

`H&M Article ID → SKU HM-<article_id> → Medusa Variant → Medusa Product`.

Các phép kiểm bao gồm:

- Product/Variant ID tồn tại; variant thuộc đúng product, SKU và metadata nguồn khớp article.
- Product published, đúng handle/source hash/product code; có nhãn giá/tồn kho mô phỏng, shipping profile và kênh bán phù hợp.
- Variant có base VND price hợp lệ theo chính sách demo.
- Inventory được quản lý, không backorder; liên kết inventory item, lượng yêu cầu, kho, inventory level và kênh bán đúng.
- Số lượng tồn kho hợp lệ và tổng reservation khớp reserved; phân biệt hết hàng với thiếu cấu hình inventory.

**Kết quả cuối:** 500 product, 1.874 variant, 1.874 inventory item/level và 1.874/1.874 dòng mapping đạt; không thiếu Product ID/Variant ID, 0 finding. Tại thời điểm đọc sau import, mỗi level H&M có stocked 20, reserved 0, available 20. Công cụ không yêu cầu stock phải luôn giữ nguyên 20 sau các giao dịch về sau.

### 3.5. Kiểm thử hai khách checkout đồng thời khi tồn thấp

Viết runner tạo fixture riêng cho từng ca, không thay đổi stock H&M hoặc fixture tuần trước. Mỗi fixture có một variant, một kho, tồn khả dụng bằng 1, `manage_inventory=true`, `allow_backorder=false` và `required_quantity=1`.

Mỗi ca tạo hai khách giả đã xác thực và hai cart độc lập, mỗi cart mua một đơn vị. Chuẩn bị đầy đủ địa chỉ, shipping và payment trước khi phát hai yêu cầu complete từ cùng điểm đồng bộ. Lưu thời gian gửi/nhận từng request và xác nhận khoảng request chồng nhau bằng đồng hồ monotonic.

Sau khi cả hai request kết thúc, đọc lại Order qua Store API và đối chiếu Cart–Order, reservation, inventory; kiểm trạng thái sau phản hồi ổn định. Không chấp nhận HTTP 500, timeout hoặc lỗi cấu hình thay cho lỗi thiếu hàng.

| Run / ca | Khoảng HTTP chồng nhau | Khách A | Khách B | Kết quả |
| --- | ---: | --- | --- | --- |
| `001` / 1 | 513,999 ms | Order thành công | HTTP 400 do thiếu hàng | 15/15 PASS |
| `001` / 2 | 399,313 ms | Order thành công | HTTP 400 do thiếu hàng | 15/15 PASS |
| `001` / 3 | 406,701 ms | Order thành công | HTTP 400 do thiếu hàng | 15/15 PASS |
| `002` / 1 | 382,292 ms | HTTP 400 do thiếu hàng | Order thành công | 15/15 PASS |

Không ấn định khách nào phải thắng. Tổng cộng **bốn ca thực tế, 60/60 điều kiện kiểm tra đạt**; 60 là số điều kiện, không phải số lần checkout thử.

| Mốc đọc của mỗi fixture | Stocked — hàng trong kho | Reserved — hàng giữ cho đơn | Available — hàng còn bán được |
| --- | ---: | ---: | ---: |
| T0: trước chuẩn bị cart | 1 | 0 | 1 |
| T1: hai cart đã sẵn sàng | 1 | 0 | 1 |
| T2: hai request đã kết thúc | 1 | 1 | 0 |

Mỗi ca có đúng một Order, một reservation quantity 1 gắn đúng OrderLineItem; cart thua không có Order thành công hoặc reservation thừa. Stocked chưa giảm vì chưa fulfillment; thay đổi quan sát được là giữ hàng cho đơn. Không phát hiện oversell hoặc available âm trong bốn ca đã chạy.

### 3.6. Kiểm tra mã nguồn và chất lượng công cụ

| Kiểm tra | Kết quả |
| --- | --- |
| Python regression tests cho audit offline | 8/8 PASS |
| Jest: validator audit, provenance, lưu evidence và concurrency | 4 suites, 33/33 tests PASS |
| Medusa lint | PASS, 0 lỗi/0 cảnh báo |
| Backend TypeScript typecheck | PASS |
| Backend build | PASS sau khi sửa P2; `ADMIN_DISABLED=true` |
| Kiểm liên kết Markdown và diff | Các liên kết tài liệu bàn giao hợp lệ; `git diff --check` đạt |
| Kiểm thông tin nhạy cảm khi bàn giao | Rà riêng bộ file được chọn để đưa lên Git; kết quả ghi trong code-validation cuối |

Các regression tests kiểm tra những trường hợp dễ kết luận sai như ID bị ép thành số, mapping thiếu/trùng, hash không đúng, ghi đè output, hai request chạy tuần tự, hai Order cùng thành công, reservation dư và lỗi máy chủ bị nhầm thành lỗi thiếu hàng. Unit tests kiểm logic công cụ; kết luận concurrency dựa trên các ca HTTP thực tế ở mục 3.5.

Trong môi trường Windows, SWC/native CLI từng bị sandbox chặn quyền ghi cache. Đã chạy lại đúng lệnh với quyền được phê duyệt; không tắt lint, sửa lockfile hoặc cài lại dependency để bỏ qua lỗi.

### 3.7. Khắc phục hai điểm P2 trước khi đưa mã lên Git

- **Giá có điều kiện bị nhận nhầm là base price:** truy vấn thêm `rules_count` và `price_rules`; chỉ chấp nhận giá cơ bản VND khi xác nhận không có rule. Các giá chỉ áp dụng cho region/nhóm khách khác hoặc thiếu thông tin rule không được dùng để kết luận có base price.
- **Report PASS có thể được ghi trước khi đủ evidence:** ghi CSV và inventory snapshot trước, hoàn tất report ở file tạm rồi công bố report cuối bằng thao tác tạo liên kết độc quyền. Nếu lỗi ghi/publish xảy ra, lệnh thất bại và không công bố một report PASS mới cho run chưa hoàn tất; marker INCOMPLETE được ghi khi storage còn cho phép.

Đã bổ sung regression tests cho giá có điều kiện, metadata rule thiếu và lỗi ghi/publish artifact. Sau sửa, audit chỉ đọc `003` chạy lúc **18:58:49–18:58:55 ngày 08/11/2026, UTC+07** vẫn xác nhận 500 product/1.874 variant và 1.874 inventory level, 0 finding. Các lần kiểm tra trước và mapping đầu vào được giữ nguyên.

## 4. Công cụ và tài liệu đã bổ sung

| Thành phần | Mục đích |
| --- | --- |
| [audit-catalog.py](../../scripts/hm/audit-catalog.py) | Audit file nguồn/catalog/manifest/mapping; tạo kết quả JSON/CSV |
| [check-hm-data-quality.ts](../../apps/backend/src/scripts/check-hm-data-quality.ts) | Đối chiếu toàn bộ mapping được chọn với Medusa live, giá và inventory |
| [check-inventory-concurrency.ts](../../apps/backend/src/scripts/check-inventory-concurrency.ts) | Tạo fixture riêng, chạy checkout đồng thời và lưu bằng chứng |
| [import-hm-catalog.ts](../../apps/backend/src/scripts/import-hm-catalog.ts) | Bổ sung lựa chọn catalog/mapping output riêng, bảo vệ mapping được chỉ định |
| [spec.md](week-5-trung/spec.md) | Yêu cầu, phạm vi và tiêu chí nghiệm thu |
| [phase.md](week-5-trung/phase.md) | Kế hoạch, trạng thái và các quyết định theo kết quả thực tế |
| Báo cáo tuần này | Tổng hợp kiểm nguồn, import, mapping, giá/tồn kho và checkout đồng thời trong một file |
| [Hướng dẫn chạy lại](week-5-trung/run-guide.md) | Điều kiện môi trường, nạp cấu hình private và các lệnh thực thi |

Đã bổ sung npm aliases để chạy audit H&M và inventory concurrency từ root hoặc backend. Các công cụ ghi command, source baseline/hash, input được chọn, thời điểm và kết quả; những lần audit mới không được ghi đè evidence cũ.

## 5. Bằng chứng chính

| Bằng chứng | Nội dung |
| --- | --- |
| Offline audit cuối (bằng chứng lưu riêng) | Counts, hash và kết quả kiểm file/mapping mới |
| Live audit cuối (bằng chứng lưu riêng) | Đọc lại 500 product/1.874 variant và inventory sau khi sửa các điểm P2 |
| Import summary (bằng chứng lưu riêng) | Số bản ghi được tạo, mapping mới và hash mapping gốc |
| Idempotency summary (bằng chứng lưu riêng) | Chạy lại hai nhóm, không tạo product mới, giữ nguyên sáu ID |
| Tóm tắt mismatch ban đầu (bằng chứng lưu riêng) | Summary suy ra từ report FAIL gốc, kèm hash nguồn; không phải một lần audit mới |
| Tóm tắt concurrency 001 (bằng chứng lưu riêng) | Ba ca lịch sử, 45/45 điều kiện đạt; snapshots chi tiết giữ local |
| Concurrency 002 (bằng chứng lưu riêng) | Một ca trên mã cuối, 15/15 điều kiện đạt |
| Code validation cuối (bằng chứng lưu riêng) | Kết quả lint/typecheck/tests/build và source hash sau khi sửa P2 |

Bộ bằng chứng lưu riêng có evidence chi tiết của concurrency 002: môi trường, request/response đã lọc thông tin nhạy cảm, timestamps, fixture/customer/cart/order IDs, snapshot T0/T1/T2, validation expected/actual và cleanup state. Ba vòng concurrency 001 được đính kèm dưới dạng summary lịch sử; snapshots và source archives đầy đủ của các lần trước tiếp tục được giữ local.

## 6. Phạm vi kết luận và trạng thái bàn giao

- Kết quả áp dụng cho mẫu 500 sản phẩm/1.874 variant trên môi trường local/development. Nguồn 105.542 article được quét phục vụ đối chiếu; chưa import toàn bộ nguồn.
- Giá VND và stock là dữ liệu mô phỏng. Audit xác minh persisted base price và inventory links; chưa kiểm mọi ngữ cảnh calculated pricing hoặc giao diện trình duyệt của toàn bộ mẫu.
- Bốn ca concurrency xác nhận kết quả trong cấu hình đã chạy. Khoảng HTTP chồng nhau không chứng minh thứ tự SQL nội bộ; snapshots là các lần đọc tuần tự xuyên module. Chưa nghiệm thu tải cloud, fulfillment/cancel/refund, nhiều kho, backorder, lỗi Redis hoặc mọi dạng retry/timeout.
- Dataset chỉ dùng dev/test trong phạm vi này; task không xác nhận quyền công khai dữ liệu hoặc ảnh H&M. Không biến lịch sử H&M thành Order của dự án.
- Giữ 500 sản phẩm H&M đã import cùng bốn fixture concurrency: bốn product/variant/level thử, tám customer, tám cart, bốn Order và bốn reservation để review. Không cleanup, reset stock, cancel hoặc fulfillment các đơn này.
- Backend test cổng 9000 đã được dừng sau kiểm thử; PostgreSQL/Redis và dữ liệu được giữ. Khởi động backend theo run-guide trước khi chạy lại phần HTTP.
- Thay đổi sẵn có ở thư mục làm việc ban đầu và mapping ZIP gốc được bảo toàn. Bộ Git gồm mã nguồn/tests, spec, phase, báo cáo tổng hợp, run-guide. Raw dataset, mapping đầu vào đầy đủ, cache, bản báo cáo chi tiết trùng nội dung và source archives giữ local.

Phần việc tuần 5 của Trung đã hoàn thành trong phạm vi nêu trên, với công cụ chạy lại được, kết quả thực tế và bằng chứng truy vết kèm theo.
