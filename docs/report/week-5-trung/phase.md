# Kế hoạch và tiến độ Tuần 5 của Trung

> Bộ Git chỉ gồm 19 file mã nguồn, tests và tài liệu. Evidence JSON/CSV/snapshots được giữ local để bàn giao riêng.

Ngày lập: 08/11/2026, Asia/Saigon. Nhánh hiện tại `week5-hm-concurrency`, baseline `034ced7`. Các run ban đầu thực thi trước khi đổi tên nhánh từ `codex/week5-trung-hm-concurrency`; audit cuối `003` chạy trên tên mới. Giữ nguyên metadata của từng run.

Theo dõi công việc trong [spec.md](spec.md). Chỉ đánh dấu hoàn tất phần thực tế đã kiểm chứng; trạng thái mã nguồn, offline audit, live DB và concurrency là những kết luận riêng.

## Phase 0 — Đọc yêu cầu và giữ an toàn working tree

- [x] Tạo worktree/nhánh riêng từ `origin/main`, giữ nguyên nhánh `seed-sample-data` đang có thay đổi.
- [x] Xác định package manager là `npm@11.12.1` từ root package.json.
- [x] Nạp skill `building-with-medusa` cho phần backend.
- [x] Tạo `spec.md` và `phase.md` trước khi triển khai mã mới.
- [x] Đọc hết bốn tài liệu gốc, H&M README/prepare/importer và tài liệu evidence Tuần 3/4 liên quan; ghi nhận khác biệt giữa baseline và source hiện tại.
- [x] Hoàn thành audit source/infra/data hiện có; chọn đường chạy phù hợp mà không sao chép bí mật hoặc làm mất thay đổi.

Điều kiện qua phase: hiểu đúng FR-REC-01, FR-INV-01/02, BR-09/13; biết công cụ và database cần kiểm tra, giới hạn và phạm vi phụ thuộc.

## Phase 1 — Kiểm tra nguồn và artifact H&M

- [x] Kiểm schema, ID chuỗi, grouping rule, source hash và manifest trong dữ liệu được cấp.
- [x] Kiểm số lượng/phạm vi, trùng/thiếu article/product key/mapping, mapping mồ côi hoặc gán sai.
- [x] Xây công cụ audit offline có kết quả máy đọc được, exit status và lỗi cụ thể; không đọc customer/transaction PII không cần thiết.
- [x] Xác minh bằng dữ liệu thật được cấp và các kiểm tra lỗi có ý nghĩa.

Kết quả Phase 1: **PASS offline**, nguồn 105.542 article/48.012 nhóm, mẫu 500 product/1.874 article và 1.874 dòng mapping, 0 finding; xem [báo cáo tuần 5](../week-5-report.md).

Điều kiện qua phase: mỗi kết luận có mẫu số và nguồn; phân biệt nguồn đầy đủ với mẫu catalog đã chọn. Offline PASS không đồng nghĩa live database PASS.

## Phase 2 — Đối chiếu Medusa đang chạy

- [x] Kiểm PostgreSQL/Redis/backend và cấu hình cần thiết mà không in secrets.
- [x] Đọc product/variant/SKU/metadata bằng API/query/module Medusa; đối chiếu ID mapping với database hiện tại.
- [x] Kiểm giá VND, trạng thái/kênh bán và liên kết inventory item/level/kho; phân biệt hết hàng với thiếu dữ liệu.
- [x] Phân loại mismatch do khác database; import mẫu giới hạn theo cho phép của người dùng qua workflow Medusa và tạo mapping riêng, không ghi DB trực tiếp hoặc reset stock.
- [x] Lưu summary live, counts và phạm vi chưa đọc được; không lấy số của báo cáo cũ làm số hiện tại.

Kết quả Phase 2: **PASS cho mapping development mới của mẫu được cho phép**, 500 product/1.874 variant/inventory item/level, 1.874/1.874 dòng mapping đạt, 0 finding. Source/mapping ZIP gốc được giữ nguyên. Audit 001 mismatch vẫn FAIL đúng phạm vi; audit 002 chọn mapping mới, lúc đọc có tổng 507 product/1.881 variant nhưng chỉ 500/1.874 là H&M. Số tổng này được đo trước khi tạo thêm fixture concurrency cuối. Giá/inventory của toàn mẫu được kiểm trực tiếp. Bounded reimport hai nhóm không tạo product mới và giữ nguyên 6/6 variant ID, không reset stock.

Điều kiện qua phase: đủ DQ-04/05 hoặc ghi cụ thể blocker và bước chạy lại; không đánh dấu đã xác minh nếu chỉ có artifact từ database cũ.

## Phase 3 — Ca hai khách tranh một đơn vị hàng

- [x] Tạo fixture mới được gắn run ID, available=1, manage_inventory=true, không backorder; hai khách và hai cart riêng, quantity=1.
- [x] Chụp T0/T1 qua Medusa, xác nhận đủ shipping/payment và việc chuẩn bị chưa giữ hàng.
- [x] Phát hai request complete tại cùng điểm đồng bộ; lưu request intervals và kiểm overlap thật.
- [x] Đọc lại T2, Order/Cart links và reservations; đúng một Order, bên thua thiếu hàng, không oversell/âm available/giữ thừa.
- [x] Phân biệt với ca retry cùng cart; các vòng hiện tại không kiểm retry, không gán kết luận idempotency ngoài phạm vi.
- [x] Lưu manifest, snapshots, responses đã lược bí mật, validation expected/actual và timeline từ request receipts.
- [x] Ghi dữ liệu test còn lại/cleanup; lần chạy sau tạo fixture mới thay vì reset stock.

Kết quả Phase 3: run `week5-20261108-001` **3/3 vòng PASS, 45/45 checks**, overlap 513,999/399,313/406,701 ms; run `week5-20261108-002` bổ sung trên source cuối **1/1 vòng PASS, 15/15 checks**, overlap 382,292 ms. Tổng **4 vòng, 60/60 checks**, stocked/reserved/available từ 1/0/1 sang 1/1/0 mỗi fixture. Giữ 4 Order/reservation, không cleanup/reset. Xem [báo cáo tuần 5](../week-5-report.md); source archives và snapshots lịch sử đầy đủ giữ local, bộ bằng chứng lưu riêng giữ summary 001 và evidence chi tiết 002.

Điều kiện qua phase: CC-01..07 có evidence thực tế. Request tuần tự, hai lỗi hoặc lỗi auth/shipping không được tính PASS. Không khẳng định về transaction nội bộ chưa quan sát.

## Phase 4 — Xác minh mã và viết báo cáo

- [x] Chạy kiểm tra có ý nghĩa cho công cụ mới và ca lỗi validation: Python 8/8, Jest bốn suites 33/33 (H&M 22, concurrency 11), có regression tests cho hai điểm P2.
- [x] Hoàn tất build và vòng live bổ sung cho source runner cuối; lint 0 lỗi/0 cảnh báo, typecheck và backend build đều đạt.
- [x] Rà evidence để loại secret/PII/raw H&M; kiểm liên kết file và khả năng chạy lại.
- [x] Hoàn thiện báo cáo H&M, báo cáo concurrency, run-guide và cập nhật spec/phase theo kết quả thực tế.
- [x] Rà diff để bảo đảm không sửa phạm vi khác, build output, lockfile bằng tay hoặc thay đổi của người dùng; `git diff --check` đạt.

Điều kiện bàn giao: có bảng đối chiếu yêu cầu → kiểm tra → evidence → kết quả; liệt kê rõ phần hoàn thành, lỗi còn lại, phần chưa chạy và bước tiếp theo. Theo yêu cầu mới, chỉ commit/push bộ file thiết yếu của task.

Kết quả Phase 4: backend build và vòng concurrency cuối đã đạt. Kết quả kiểm tra sau rà soát P2 được ghi riêng trong code-validation cuối (bằng chứng lưu riêng); Admin UI bundle ngoài phạm vi. Người dùng đã yêu cầu đưa bộ file thiết yếu lên nhánh `week5-hm-concurrency`.

Rà soát trước khi đưa lên Git đã sửa việc nhận nhầm giá có điều kiện thành base price và thứ tự công bố report khi ghi artifact thất bại. Audit chỉ đọc 003 xác nhận lại 500 product/1.874 variant với 0 finding; không import thêm hoặc thay đổi dữ liệu checkout. Bộ file được chọn gồm mã/tests, bốn tài liệu; evidence được lưu riêng; raw input và các bản lưu trùng giữ local.

## Nhật ký quyết định và kết quả

| Ngày | Quyết định hoặc kết quả | Căn cứ |
| --- | --- | --- |
| 08/11/2026 | Tạo worktree riêng từ `034ced7`; không thay đổi nhánh gốc đang bẩn. | Quy tắc giữ thay đổi người dùng và audit baseline. |
| 08/11/2026 | Tách audit offline khỏi xác minh live DB; ID mapping từ ZIP cần readback. | FR-REC-01; artifact không chứng minh trạng thái DB hiện tại. |
| 08/11/2026 | Tạo fixture concurrency riêng thay vì chỉnh stock H&M cũ. | FR-INV-01/02, BR-09; giữ evidence cũ và khả năng chạy lại. |
| 08/11/2026 | Báo cáo Tuần 4 ở working tree gốc xác nhận W4-04 chạy theo thứ tự và W4-05 retry tuần tự; không tái sử dụng các PASS đó làm kết quả concurrent Tuần 5. | W4 report/run-guide ngày 05/11/2026; FR-INV-02 cần ca mới có request overlap. |
| 08/11/2026 | Audit offline đạt 0 finding trên input thật; không đọc customer/transaction. | offline audit của mapping được chọn (bằng chứng lưu riêng). |
| 08/11/2026 00:46 UTC+07 | Live audit hoàn tất đọc nhưng FAIL vì database hiện tại thiếu đối tượng H&M; giữ nguyên mapping ZIP. | Summary suy ra từ report gốc (bằng chứng lưu riêng). |
| 08/11/2026 | Người dùng cho phép import giới hạn 500 product vào database development và tạo mapping riêng sau khi xác nhận thư mục cung cấp không có backup DB. | Giữ mapping ZIP gốc và evidence 001; dùng audit 002 cho kết luận môi trường development mới. |
| 08/11/2026 00:51–00:52 UTC+07 | Ba fixture checkout đồng thời đạt 45/45 checks, mỗi fixture một Order/reservation; giữ dữ liệu để review. | Summary lịch sử (bằng chứng lưu riêng). |
| 08/11/2026 00:56–00:57 UTC+07 | Import được phép tạo 500 product/1.874 variant với mapping riêng; audit offline/live 002 đều PASS, 0 finding. | Import summary (bằng chứng lưu riêng); live 002 đầy đủ giữ local, bộ Git dùng lần đọc lại 003. |
| 08/11/2026 00:57 UTC+07 | Chạy lại hai nhóm đã có: 0 product mới, 2 product existing, 6/6 variant ID giữ nguyên. | idempotency summary (bằng chứng lưu riêng); không suy rộng thành full 500-product reimport. |
| 08/11/2026 01:00 UTC+07 | Vòng concurrency cuối PASS 15/15 trên fixture mới, B thắng; tổng hai run 60/60. | summary 002 (bằng chứng lưu riêng). |
| 08/11/2026 | Rà soát trước khi đưa lên Git: kiểm rule của giá và thứ tự công bố report khi ghi file lỗi; chạy kiểm tra lại mã cuối. | Code validation cuối (bằng chứng lưu riêng). |

Các phase đã hoàn thành trong phạm vi được giao. Giới hạn còn lại được ghi trong báo cáo: quyền công khai H&M/ảnh, mọi context pricing, tải cloud, fulfillment/cancel/refund và các dạng retry/sự cố khác chưa được nghiệm thu bởi task này.
