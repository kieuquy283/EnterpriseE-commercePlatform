<a id="ci-verification"></a>
# Hợp đồng kiểm chứng CI

CI thực hiện CI-01 và phần kiểm chứng kỹ thuật OPS-02/03/04 của [kế hoạch checkpoint](../DAYMARK_Ke_Hoach_Tuan_1_Checkpoints_18_20_22_11_2026_v1.3_PhanBoCheckpoint.md), theo [yêu cầu kiểm thử](../spec/05-testing.md). Cấu hình workflow không chứng minh một lần chạy đã đạt hoặc đủ điều kiện phát hành.

## Các gate và bằng chứng

| Check | Nội dung | Artifact |
| --- | --- | --- |
| `documentation` | Kiểm liên kết/tài liệu, test và build presentation | `documentation-<SHA>-<attempt>` |
| `cloudformation` | cfn-lint, Guard, unit test IaC và cú pháp entrypoint; không gọi AWS | `iac-<SHA>-<attempt>` |
| `verify` | Format, unit, HTTP qua `npm test`, lint/typecheck/build hai app, kiểm Compose, test fixture ngoại tuyến ; audit được thu thập riêng | `gates-<SHA>-<attempt>` |
| `integration-tests` trong API tests | Toàn bộ HTTP suite hiện hữu trên PostgreSQL dùng riêng | `api-tests-<SHA>-<attempt>`, gồm JSON kết quả Jest |
| `security-audit-evidence` | npm 11.12.1 audit JSON, kiểm collection/schema và phân loại release BLOCKED/UNKNOWN/REVIEW_REQUIRED | `security-audit-<SHA>-<attempt>` |
| `browser-container` | Build hai image, migration, fixture, API/UI/media/worker smoke và toàn bộ Playwright Chromium hiện hữu | `browser-container-<SHA>-<attempt>`, gồm JUnit, HTML, trace/ảnh/video khi cấu hình suite yêu cầu |

Lệnh bị lỗi giữ exit code khác 0. Audit evidence ghi rõ verdict phát hành; findings không được đổi thành security PASS. Chính sách required merge/release gate còn chờ Quý/owner CI duyệt theo [triage dependency](dependency-security.md). Các gate độc lập được ghi log khi bước trước lỗi; bước cần dependency vẫn có thể không chạy khi chuẩn bị thất bại. Trạng thái bước/job và metadata từng lệnh mới là kết quả; artifact tồn tại không có nghĩa PASS. Bảo vệ nhánh và danh sách required checks do chủ kho cấu hình riêng; workflow không tự cấp quyền hoặc tự chặn nút merge ngoài policy GitHub.

CI ghim npm 11.12.1 trước khi cài workspace, không thay package/lock của repo. Job audit chỉ cần lockfile, không cài ứng dụng. `scripts/ci-audit.mjs --enforce` có thể được owner nối vào policy được duyệt để chặn critical/high và lỗi thu thập; chưa được cấu hình làm required merge check. `REVIEW_REQUIRED` không cấp quyền phát hành: còn cần rà moderate/call path và scan toàn bộ image vì Dockerfile giữ dev dependencies. Không có ngoại lệ baseline được áp dụng.

`scripts/ci-run.mjs` ghi lệnh, SHA checkout, run/attempt, thời gian UTC, Node và exit code trong JSON cùng log đã che URI PostgreSQL, bearer/JWT và các trường thông tin xác thực phổ biến. Không truyền secret qua argv. Không tải `.env`, Docker inspect toàn bộ, fixture context hoặc dump DB lên artifact. Browser chỉ dùng tài khoản/dữ liệu tổng hợp trong runner; trace vẫn có thể chứa phiên đăng nhập thử và phải được coi là artifact hạn chế truy cập, giữ bảy ngày. Bộ lọc log không bảo đảm loại bỏ mọi loại bí mật; không đưa dữ liệu thật vào môi trường này.

## Môi trường browser và container

Job chỉ dùng GitHub-hosted Linux runner mới với PostgreSQL/Redis services riêng. `scripts/ci-browser-stack.sh` từ chối chạy ngoài runner này. Không dùng Compose mặc định, volume dữ liệu cục bộ hoặc endpoint cloud; không đọc cấu hình `.env` của người phát triển. Các cổng localhost 5432/6379/9000/8000 thuộc runner dùng một lần.

Trình tự bắt buộc:

1. Build image backend từ SHA checkout; migration thành công trước khi chạy API/worker.
2. Chạy `seed-recommendation-test` hiện hữu trên DB `recommendation_test`: tạo shipping profile, bootstrap commerce và khóa publishable thử. Gợi ý trên storefront vẫn OFF. Context khóa nằm tạm, không xuất artifact.
3. Apply catalog DAYMARK hiện hữu với guard `local-disposable`, `NODE_ENV=test`, ảnh demo local có kiểm checksum. Không nhập H&M hoặc dữ liệu thật. Ghi nhận fixture bằng mã nguồn/checksum tại SHA; không reset DB/tồn dùng chung.
4. API chạy mode `server`, worker chạy mode `worker` với Admin disabled, cùng image content ID. Runtime test được chỉ định trực tiếp qua CLI để script start production không ghi đè chế độ fixture.
5. Chờ `/health` HTTP 200; build storefront bằng khóa publishable thật của fixture và URL backend localhost. Build dùng host network của runner để đọc backend khi prerender.
6. Chờ `/vn`; smoke đọc sản phẩm `dm-tee-core`, thumbnail cùng origin và byte ảnh, trang chủ/PDP HTTP 200. Worker phải còn chạy và trả `/health` 200 nhưng `/store/products`, `/admin/users`, `/app` đều 404 trong namespace riêng của nó.
7. Chạy suite Chromium, một worker theo cấu hình hiện hữu. Không đổi nội dung/expected của tests; ca thiếu fixture chuyên biệt có thể SKIP và phải được QA phân loại, không tính là nghiệm thu đạt. Lưu content ID hai image và report/log theo SHA.
8. EXIT trap lấy log giới hạn rồi xóa đúng container có tên thuộc run/attempt và thư mục tạm do script tạo. GitHub hủy runner khi kết thúc job kể cả khi hủy cứng khiến trap không chạy. Services không được dùng lại giữa các job.

Smoke worker chỉ chứng minh tiến trình và ranh giới route API/Admin, không chứng minh subscriber nhận event, retry/dedupe hoặc thông báo đến hộp thư. Smoke trang không thay thế assertions nghiệp vụ Playwright. Runtime fixture test không chứng minh cấu hình production đã được nghiệm thu. Khi được phép phát hành riêng, dùng registry digest bất biến của image đã kiểm và migration trước traffic; CI này không push image hoặc triển khai.

## Phụ thuộc nghiệm thu

- TODO(test): Tích hợp suite direct-API Staff/Admin allow/deny do QA/BE cung cấp — AT-10/BE-08 chưa được chứng minh bởi HTTP hiện hữu; OPS-02 vẫn BLOCKED ở phần RBAC. Không tạo tên test giả hoặc suy PASS từ 401 của khách chưa đăng nhập.
- QA sở hữu test semantics, selectors và fixture chuyên biệt cho fault/H&M; log rõ SKIP/BLOCKED, không mở quyền dữ liệu nghiên cứu để làm CI xanh.
- Xem thêm [readiness vận hành](operations-readiness.md): importer/media cloud và runner bootstrap Admin an toàn chưa được cung cấp; không được dùng fixture CI để vượt guard production.
- Lỗi cài npm, thiếu package trong lockfile, lỗi app build/lint/test hoặc tải binary ngoài mạng phải làm job đỏ và được owner xử lý; không sửa package/lock hay vô hiệu gate trong workflow này.
- Kết quả thực thi có ngày, môi trường, SHA và blocker nằm trong CI hoặc báo cáo kiểm chứng riêng; tài liệu này chỉ mô tả hợp đồng ổn định.
