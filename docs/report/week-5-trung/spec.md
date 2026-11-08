# Đặc tả công việc Tuần 5 của Trung

> Bộ Git chỉ gồm 19 file mã nguồn, tests và tài liệu. Evidence JSON/CSV/snapshots được giữ local để bàn giao riêng.

Ngày lập: 08/11/2026, múi giờ Asia/Saigon. Hạn bàn giao theo phân công: 21:00 ngày 08/11/2026.

Nhánh hiện tại: `week5-hm-concurrency`, tạo từ `origin/main` tại `034ced7`. Các run ban đầu thực thi khi nhánh còn tên `codex/week5-trung-hm-concurrency`; audit cuối `003` thực thi sau khi đổi tên. Metadata evidence giữ đúng tên lúc chạy. Thực hiện trong worktree riêng; giữ nguyên working tree và các thay đổi đang có trên nhánh `seed-sample-data`.

## 1. Nguồn yêu cầu và thứ tự áp dụng

Đọc tài liệu gốc trước khi thay đổi mã. Tài liệu này lưu ngữ cảnh cho Coding Agent; không thay thế tài liệu gốc hoặc tự đổi phạm vi của nhóm.

1. [Kiến trúc cloud](../../architecture/cloud-system-architecture.md): Medusa quản lý commerce; dữ liệu thật, cấu hình và đề xuất phải được phân biệt; kiểm thử thành công/thất bại hiện có chưa chứng minh tranh hàng đồng thời.
2. [01 — Định nghĩa dự án](../../01_Project_Definition.md): OBJ-03 yêu cầu đúng reservation và Cart–Order khi hai khách tranh hàng cuối.
3. [02 — Phạm vi và giả định](../../02_Project_Scope_and_Assumptions.md): M-07, G-2 yêu cầu đọc lại Order/tồn kho; không tăng quy mô H&M trước khi kiểm chất lượng và quyền sử dụng.
4. [03 — Yêu cầu phần mềm](../../03_Software_Requirements_Specification.md): FR-REC-01, FR-INV-01/02; BR-01/02/09/13/14. FR-PAY-03/04 và AT-03 là căn cứ tham khảo khi kiểm tra retry/thất bại liên quan.
5. Phân công Tuần 5 trong `Cloud.xlsx`: Trung kiểm chất lượng dữ liệu H&M đã nhập, mapping article sang product/variant, trùng/thiếu giá/thiếu tồn kho và ca mua đồng thời khi tồn thấp.
6. [Hướng dẫn H&M](../../../scripts/hm/README.md), [prepare.py](../../../scripts/hm/prepare.py), [importer](../../../apps/backend/src/scripts/import-hm-catalog.ts) và evidence Tuần 3/4 đã có: dùng để đối chiếu cách thực hiện, không suy ra dữ liệu hiện tại từ báo cáo cũ.

Các trạng thái hoặc mốc tuần ở tài liệu gốc là baseline lịch sử. Kết luận bàn giao phải dựa vào source hiện tại và kết quả thực chạy, gắn đúng commit, môi trường và thời gian.

## 2. Phạm vi

Hoàn thành hai phần:

- Kiểm tra nguồn H&M, artifact đã chuẩn bị và mapping; kiểm tra dữ liệu commerce đang có trong Medusa để phát hiện thiếu/trùng/sai liên kết trong mẫu được chọn.
- Bổ sung công cụ hoặc bài kiểm thử thực tế cho hai khách checkout đồng thời cùng variant sắp hết hàng; lưu evidence chứng minh không oversell và không giữ hàng thừa.

Sửa lỗi trong phạm vi này nếu có bằng chứng xác định lỗi và có thể sửa qua cơ chế Medusa hỗ trợ. Không triển khai recommendation API/UI, AI/LLM, cá nhân hóa, deploy cloud, taxonomy/ảnh toàn bộ catalog, thanh toán thật hoặc toàn bộ regression thuộc phần việc khác.

## 3. Dữ liệu đầu vào và giới hạn

Nguồn người dùng cung cấp: hm.zip. Chỉ đọc những phần cần cho task; giữ raw data, artifact đầy đủ và dữ liệu cá nhân ngoài Git. Không cần đọc nội dung khách hàng hoặc lịch sử giao dịch để kiểm catalog/mapping của Trung.

- `articles.csv` là nguồn article và thuộc tính sản phẩm. Giữ ID như chuỗi, bảo toàn số 0 ở đầu.
- `processed/catalog.jsonl` là mẫu đã nhóm; `processed/manifest.json` ghi quy tắc, số lượng và hash; `processed/medusa-mapping.jsonl` ghi ID của lần import trước.
- Mapping có ID Medusa không chứng minh các ID ấy còn tồn tại trong database đang chạy. Phải đọc lại đối tượng hiện tại trước khi kết luận mapping live đúng.
- `product_code` đơn lẻ không phải khóa nhóm duy nhất. `prepare.py` dùng tổ hợp product_code, product_type_name, product_group_name, department_name và section_name để sinh product_key.
- Một product có nhiều variant là hợp lệ. Theo importer hiện tại, một article tương ứng một variant với SKU `HM-<article_id>` và metadata `source_article_id`; mapping phải dẫn tới đúng product chứa variant đó.
- Giá VND và tồn kho demo là synthetic; CSV không cung cấp giá VND hiện tại hay stock thật đáng tin cậy. Không import lịch sử H&M thành Order của dự án.
- Chưa có quyền công khai H&M thì chỉ dùng dev/test. Không công khai dữ liệu/ảnh gốc hay đánh dấu quyền sử dụng đã được xác minh nếu chưa có bằng chứng.

## 4. Tiêu chí kiểm chất lượng dữ liệu

| Mã | Điều kiện cần kiểm chứng | Evidence cần có |
| --- | --- | --- |
| DQ-01 | Nhận diện được file nguồn, schema bắt buộc, số dòng/phạm vi mẫu và hash artifact đã kiểm tra. | Manifest kiểm tra, số lượng, tên file, hash và phiên bản công cụ. |
| DQ-02 | Article ID/product key/SKU hợp lệ và đúng quy tắc; phát hiện duplicate, ID thiếu hoặc mapping không thuộc mẫu. | Thống kê lỗi có giới hạn mẫu minh họa; không in raw dataset. |
| DQ-03 | Toàn bộ article của mẫu catalog được mapping đúng một lần; không có mapping mồ côi trong phạm vi; một variant không bị gán sai nhiều article. | Đối chiếu article → SKU → variant → product, phạm vi và mẫu số rõ ràng. |
| DQ-04 | ID trong mapping tồn tại trong Medusa hiện tại và variant thuộc đúng product; metadata nguồn khớp. | Readback qua query/module/API Medusa, không chỉ kiểm format ID. |
| DQ-05 | Variant cần bán có giá VND phù hợp và liên kết inventory item/level/kho/kênh bán đúng. | Số lượng đã đọc, thiếu giá/thiếu link/thiếu level và danh sách lỗi đã lược dữ liệu nhạy cảm. |
| DQ-06 | Phân biệt thiếu dữ liệu với giá trị hợp lệ: tồn bằng 0 là hết hàng, khác với thiếu inventory level; nhiều variant cùng product không phải tự động trùng. | Báo cáo phân loại thiếu/sai/hết hàng và điều kiện giá được áp dụng. |
| DQ-07 | Chỉ kết luận cho mẫu và database đã đọc; không gán lại số 500/1.874 hoặc kết quả cũ thành kết quả hiện tại. | Tên môi trường đã lược bí mật, thời gian, số thực đếm, giới hạn và tình trạng từng phần. |

Nếu công cụ hỗ trợ chạy lại import, kiểm hành vi idempotent bằng fixture phù hợp; không tự chạy import toàn bộ, reset stock hoặc mở rộng dataset để tạo bằng chứng. Tồn 20 của importer là giá trị khởi tạo, không phải trạng thái buộc phải giữ sau các giao dịch.

## 5. Tiêu chí checkout đồng thời

### Fixture và chuẩn bị

- Dùng môi trường local/dev được chỉ định. Tạo dữ liệu test có run ID riêng qua API/workflow Medusa; không sửa tồn của hàng thật hoặc mẫu đã có giao dịch.
- Một variant quản lý inventory, không cho backorder, một đơn vị khả dụng; giá VND, kênh/kho/region và shipping/payment phù hợp.
- Hai khách test phân biệt, mỗi khách một cart; mỗi cart mua một đơn vị cùng variant. Dùng dữ liệu giả; không ghi password/token/email đầy đủ ra evidence.
- T0 chụp sau tạo fixture, trước chuẩn bị cart. T1 chụp sau khi cả hai cart đủ điều kiện complete. Chứng minh việc chuẩn bị không giữ hàng ngoài ý muốn.

### Chạy và đánh giá

| Mã | Điều kiện đạt |
| --- | --- |
| CC-01 | Hai request complete được phát từ cùng điểm đồng bộ, không `await` lần lượt. Lưu thời điểm gửi/nhận và thời gian chạy để kiểm khoảng request chồng nhau. Nếu không chồng nhau, không đánh dấu ca concurrent đạt. |
| CC-02 | Trong fixture hợp lệ này, đúng một bên nhận Order hợp lệ, bên còn lại bị từ chối vì không đủ hàng; không cố định A hay B phải thắng. Hai lỗi hoặc lỗi cấu hình/auth/shipping không được tính là đạt. |
| CC-03 | Order thành công có thể đọc lại, đúng customer/cart/variant/quantity; cart thua không có Order thành công. Không dùng riêng HTTP 200 để kết luận. |
| CC-04 | T2 đọc lại trạng thái ổn định của fixture và cả hai cart; tổng lượng bán/giữ chỗ không vượt một đơn vị khả dụng ban đầu, không âm available, không reservation mồ côi hoặc giữ thừa cho bên thua. |
| CC-05 | So sánh stocked/reserved/available và reservation/order links; không mặc định stocked_quantity giảm ngay khi tạo Order. Các mức/kho ngoài fixture không bị thay đổi bởi công cụ test. |
| CC-06 | Không trộn ca hai cart tranh stock với ca gửi lại cùng cart. Nếu kiểm retry cart thắng, phải xác nhận cùng Order ID và không tăng reservation/Order; ghi phạm vi của ca đó riêng. |
| CC-07 | Mỗi lần chạy dùng fixture mới, có run ID; không reset hoặc tăng stock của lần cũ. Báo rõ fixture/Order/reservation còn giữ và tình trạng cleanup. |

Khoảng request chồng nhau là bằng chứng từ client, không chứng minh thứ tự transaction/SQL hoặc mọi cơ chế khóa nội bộ của Medusa. Một ca local cũng không chứng minh toàn bộ tải production hoặc mọi trường hợp retry/timeout.

## 6. Quy tắc triển khai và bằng chứng

- Package manager: `npm@11.12.1` theo packageManager của root. Không tạo lockfile thứ hai hoặc sửa lockfile bằng tay.
- Tải `building-with-medusa` và reference liên quan trước thay đổi backend. Business mutation đi qua workflow/module Medusa; không sửa core, truy cập DB bằng client riêng hoặc viết raw SQL mới.
- Không sửa build output, migrations cũ hoặc thay đổi sẵn có của người dùng. Ứng dụng/CLI được nạp cấu hình private theo cơ chế runtime; không in hoặc sao chép secret từ `.env` ra log, evidence hay tài liệu.
- Không xóa DB/volume, không chạy seed toàn bộ hoặc reset dữ liệu để khiến test pass. Nếu cần thay đổi schema mới thì dùng migration mới đúng quy trình; task hiện không đòi hỏi đổi schema.
- Evidence phải có source baseline, run ID, timestamp ISO và thời gian hiển thị UTC+07, môi trường đã lược bí mật, fixture IDs, expected/actual, kết quả và lỗi thực tế.
- Chỉ giữ dữ liệu kiểm tra cần thiết. Loại headers/token/password/provider payload và PII khỏi artifact; không commit raw H&M/customer/transaction.
- Khi hạ tầng chặn thực chạy, vẫn hoàn thành công cụ, kiểm tra offline và tài liệu; ghi rõ bước chưa chạy, lỗi cụ thể và lệnh chạy lại. Không điền PASS từ dữ liệu giả hoặc từ source review.

## 7. Sản phẩm bàn giao và nghiệm thu

1. `spec.md`, `phase.md` này được cập nhật theo kết quả cuối.
2. Công cụ kiểm chất lượng/mapping và concurrency có thể chạy lại, cùng kiểm tra phù hợp với phần thay đổi.
3. Báo cáo chất lượng H&M, báo cáo concurrency, run-guide và evidence đã lược bí mật; ghi file thay đổi, lệnh đã chạy, kết quả thật và phần còn thiếu.
4. Chạy lint/typecheck/tests/build phù hợp. Ghi giới hạn môi trường và lỗi còn lại; không kết luận nghiệm thu live DB chỉ từ unit/offline checks.
5. Không commit hoặc push nếu chưa được yêu cầu; chuyển kết quả và đường dẫn để người dùng review.

## 8. Trạng thái bàn giao thực tế

Ngày 08/11/2026, phần việc được giao đã hoàn thành trên môi trường local/development:

- [Báo cáo tuần 5](../week-5-report.md) tổng hợp H&M và concurrency: mẫu 500 product/1.874 variant, mapping development mới được chọn rõ ràng, mapping ZIP gốc và kết quả mismatch được bảo toàn. Bounded reimport hai nhóm giữ nguyên 6/6 ID.
- Bốn fixture concurrency độc lập đạt tổng 60/60 checks; bộ bằng chứng lưu riêng giữ summary của ba lượt đầu và evidence chi tiết của lượt cuối. Dữ liệu và source archives đầy đủ vẫn được giữ local.
- Code validation cuối (bằng chứng lưu riêng) ghi kiểm tra mã sau khi sửa P2; build tắt bundle Admin UI.
- [Run-guide](run-guide.md) mô tả native Windows loader đọc private config theo đường dẫn, selected mapping, output mới và tác động dữ liệu test.

Source baseline là `034ced7`, source hash của từng công cụ nằm trong evidence. Bộ bàn giao không phải một release đã deploy hoặc tuyên bố mọi yêu cầu của đồ án đã nghiệm thu. Quyền công khai H&M/ảnh và các giới hạn kiểm thử được giữ trong báo cáo. Người dùng đã yêu cầu chỉ commit/push các file thiết yếu; dữ liệu gốc, báo cáo trùng và archive đầy đủ không thuộc bộ Git.
