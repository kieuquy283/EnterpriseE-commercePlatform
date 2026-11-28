<a id="ci-verification"></a>
# Hợp đồng kiểm chứng CI

CI thực hiện CI-01 và phần kiểm chứng kỹ thuật OPS-02/03/04 của [kế hoạch checkpoint](../DAYMARK_Ke_Hoach_Tuan_1_Checkpoints_18_20_22_11_2026_v1.3_PhanBoCheckpoint.md), theo [yêu cầu kiểm thử](../spec/05-testing.md). Cấu hình workflow không chứng minh một lần chạy đã đạt hoặc đủ điều kiện phát hành.

## Các gate và bằng chứng

| Check | Nội dung | Artifact |
| --- | --- | --- |
| `documentation` | Kiểm liên kết/tài liệu, test và build presentation | `documentation-<SHA>-<attempt>` |
| `cloudformation` | cfn-lint, Guard, unit test IaC và cú pháp entrypoint; không gọi AWS | `iac-<SHA>-<attempt>` |
| `verify` | Format, unit, HTTP qua `npm test`, lint/typecheck/build hai app, kiểm Compose, test fixture ngoại tuyến ; audit được thu thập riêng | `gates-<SHA>-<attempt>` |
| `load-failure-smoke` trong API tests | k6 smoke có đối soát order/tồn, pause/unpause DB disposable của chính job, recovery và invalid-key | `load-failure-<SHA>-<attempt>` |
| `integration-tests` trong API tests | Toàn bộ HTTP suite hiện hữu trên PostgreSQL dùng riêng | `api-tests-<SHA>-<attempt>`, gồm JSON kết quả Jest |
| `security-policy` | npm 11.12.1 audit JSON, kiểm collection/schema và chặn policy blocker với `--enforce` | `security-audit-<SHA>-<attempt>` |
| `browser-container` | Build hai image, migration, fixture, API/UI/media/worker smoke và toàn bộ Playwright Chromium hiện hữu | `browser-container-<SHA>-<attempt>`, gồm JUnit, HTML, trace/ảnh/video khi cấu hình suite yêu cầu |

Lệnh bị lỗi giữ exit code khác 0. Audit evidence ghi rõ verdict phát hành; findings không được đổi thành security PASS. Chính sách required merge/release gate còn chờ Quý/owner CI duyệt theo [triage dependency](dependency-security.md). Các gate độc lập được ghi log khi bước trước lỗi; bước cần dependency vẫn có thể không chạy khi chuẩn bị thất bại. Trạng thái bước/job và metadata từng lệnh mới là kết quả; artifact tồn tại không có nghĩa PASS. Bảo vệ nhánh và danh sách required checks do chủ kho cấu hình riêng; workflow không tự cấp quyền hoặc tự chặn nút merge ngoài policy GitHub.

CI ghim npm 11.12.1 trước khi cài workspace, không thay package/lock của repo. Job audit chỉ cần lockfile, không cài ứng dụng. `scripts/ci-audit.mjs --enforce` được gọi trong job `security-policy` và workflow xuất ảnh AWS trước khi lấy credentials. Job thất bại khi có policy blocker hoặc không thu được kết quả; không cấp ngoại lệ baseline ngầm. Repository owner phải bật required checks theo cấu hình bên dưới. `REVIEW_REQUIRED` không cấp quyền phát hành: còn cần rà moderate/call path và scan toàn bộ image vì Dockerfile giữ dev dependencies. Không có ngoại lệ baseline được áp dụng.

`scripts/ci-run.mjs` ghi lệnh, SHA checkout, run/attempt, thời gian UTC, Node và exit code trong JSON cùng log đã che URI PostgreSQL, bearer/JWT và các trường thông tin xác thực phổ biến. Không truyền secret qua argv. Không tải `.env`, Docker inspect toàn bộ, fixture context hoặc dump DB lên artifact. Browser chỉ dùng tài khoản/dữ liệu tổng hợp trong runner; trace vẫn có thể chứa phiên đăng nhập thử và phải được coi là artifact hạn chế truy cập, giữ bảy ngày. Bộ lọc log không bảo đảm loại bỏ mọi loại bí mật; không đưa dữ liệu thật vào môi trường này.

## Môi trường browser và container

Job chỉ dùng GitHub-hosted Linux runner mới với PostgreSQL/Redis services riêng. `scripts/ci-browser-stack.sh` từ chối chạy ngoài runner này. Không dùng Compose mặc định, volume dữ liệu cục bộ hoặc endpoint cloud; không đọc cấu hình `.env` của người phát triển. Các cổng localhost 5432/6379/9000/8000 thuộc runner dùng một lần.

Trình tự bắt buộc:

1. Tạo Docker network riêng theo run/attempt; PostgreSQL/Redis không publish cổng, Mailpit inbox và API/storefront chỉ bind loopback. Container có label ownership cho cleanup. Build image backend từ SHA checkout; migration thành công trước API/worker.
2. Chạy `seed-recommendation-test` hiện hữu trên DB `recommendation_test`: tạo shipping profile, bootstrap commerce và khóa publishable thử. Gợi ý trên storefront vẫn OFF. Context khóa nằm tạm, không xuất artifact.
3. Apply catalog DAYMARK hiện hữu với guard `local-disposable`, `NODE_ENV=test`, ảnh demo local có kiểm checksum. Không nhập H&M hoặc dữ liệu thật. Ghi nhận fixture bằng mã nguồn/checksum tại SHA; không reset DB/tồn dùng chung.
4. API chạy mode `server`, worker chạy mode `worker` với Admin disabled, cùng image content ID. Runtime test được chỉ định trực tiếp qua CLI để script start production không ghi đè chế độ fixture.
5. Chờ `/health`; kiểm Admin login/language. Build storefront với khóa publishable của fixture, public URL localhost và `MEDUSA_BACKEND_URL` nội bộ riêng cho prerender. Runtime server dùng network alias backend; trình duyệt dùng public URL.
6. Chờ `/vn`; smoke đọc sản phẩm `dm-tee-core`, thumbnail cùng origin và byte ảnh, trang chủ/PDP HTTP 200. Worker phải còn chạy và trả `/health` 200 nhưng `/store/products`, `/admin/users`, `/app` đều 404 trong namespace riêng của nó.
7. Chạy `ci-operations-e2e.mjs` cho Staff allow/deny/reassignment/revoke và API → Redis → worker → SMTP inbox, outage/retry, restart/expired lease và competing processors. Sau đó chạy suite Chromium storefront, một browser worker theo cấu hình hiện hữu. Không đổi nội dung/expected của tests; ca thiếu fixture chuyên biệt có thể SKIP và phải được QA phân loại, không tính là nghiệm thu đạt. Lưu content ID hai image và report/log theo SHA.
8. EXIT trap lấy log giới hạn rồi xóa đúng container theo label run/attempt, network, inbox volume và thư mục tạm do script tạo. GitHub hủy runner khi kết thúc job kể cả khi hủy cứng khiến trap không chạy. Services không được dùng lại giữa các job.

Smoke worker cơ bản chỉ chứng minh tiến trình và ranh giới route; proof gửi/retry/restart nằm riêng trong `operations-e2e.json`, có verdict của từng kịch bản. Receipt Mailpit là inbox test thật, không phải delivery receipt bên ngoài; SMTP không bảo đảm exactly-once khi chết giữa send/persist. Smoke trang không thay thế assertions nghiệp vụ Playwright. Runtime fixture test không chứng minh cấu hình production đã được nghiệm thu. Khi được phép phát hành riêng, dùng registry digest bất biến của image đã kiểm và migration trước traffic; CI này không push image hoặc triển khai.

### Tương thích Medusa Admin

Job container tạo một Admin riêng trong PostgreSQL disposable bằng workflow bootstrap hiện hữu. Password ngẫu nhiên chỉ nằm trong file tạm quyền `0600`, không truyền qua command arguments hoặc artifact; EXIT trap xóa cùng fixture. Không dùng account hay credential của AWS/development.

`scripts/ci-admin-smoke.mjs` đăng nhập Admin, đổi ngôn ngữ English → Français → English qua trang profile, kiểm heading Orders/Commandes sau navigation và reload, rồi kiểm không có JavaScript exception. Check này chạy trên bundle trong image backend, trước storefront build; lỗi phải chặn job. `admin-compatibility.json` chỉ lưu tên check, verdict và số lỗi, không lưu auth response, cookie, password, screenshot hoặc trace của phiên Admin. Đây là regression cho i18next override, không phải nghiệm thu Staff assignment hay toàn bộ nghiệp vụ Admin.

## Phụ thuộc nghiệm thu

- Suite `staff-authorization.spec.ts` chạy trong HTTP CI: Admin thực được phép, persisted Staff bị chặn full Admin API, Customer/tampered/unregistered bị từ chối; bearer và cookie session đều được thử. Đây là ranh giới fail-closed, không phải Staff lifecycle/assignment RBAC đầy đủ; xem [bằng chứng](../report/staff-admin-authorization-2026-11-19.md).
- QA sở hữu test semantics, selectors và fixture chuyên biệt cho fault/H&M; log rõ SKIP/BLOCKED, không mở quyền dữ liệu nghiên cứu để làm CI xanh.
- Importer/media preview và bootstrap Admin qua secret injection đã có [bằng chứng AWS](../report/aws-preview-2026-11-18.md). Không dùng fixture CI để vượt guard production; commercial media và Staff operations vẫn là cổng riêng.
- Lỗi cài npm, thiếu package trong lockfile, lỗi app build/lint/test hoặc tải binary ngoài mạng phải làm job đỏ và được owner xử lý; không sửa package/lock hay vô hiệu gate trong workflow này.
- Kết quả thực thi có ngày, môi trường, SHA và blocker nằm trong CI hoặc báo cáo kiểm chứng riêng; tài liệu này chỉ mô tả hợp đồng ổn định.

## Bật bảo vệ nhánh bằng tính năng GitHub

Cấu hình native API ở [main.json](../../.github/branch-protection/main.json) yêu cầu bảy job kỹ thuật, một reviewer, giải quyết conversation và cấm force-push/xóa main. Không cần script quản trị tùy chỉnh. Tài khoản thực thi hiện có quyền push nhưng không có admin/maintain, nên chưa thể áp dụng protection.

Repository owner rà nội dung rồi chạy lệnh với danh tính có quyền admin:

```sh
gh api --method PUT repos/kieuquy283/EnterpriseE-commercePlatform/branches/main/protection \
  --input .github/branch-protection/main.json
```

Đọc lại protection và kiểm thử PR cố tình làm một gate đỏ trên branch dùng thử trước khi đánh dấu phần enforcement của OPS-02 hoàn tất. Không tạo bypass token, hạ quyền kiểm tra hoặc suy protection đã bật từ việc JSON tồn tại.

Job `load-failure-smoke` bật fixture workload riêng bằng `RUN_LOCAL_K6=true`; HTTP suite thông thường không tự chạy fault injection. PostgreSQL mang tên theo run/attempt, chỉ bind loopback, không volume giữ lại và được unpause/remove trong bước `always()`. k6 chạy container transient được ghim trong test, không thêm dependency dự án. Lượt smoke ngắn xác minh check/threshold và khả năng hồi, không đo NFR tải dài hay cloud capacity.

### Staff và SMTP qua nhiều tiến trình

Fixture tạo hai Staff ngẫu nhiên qua workflow tin cậy; Admin phân công bằng User API chuẩn. Driver kiểm DTO tối thiểu, Staff ngoài assignment, anonymous, mutation và Admin API bị chặn; browser kiểm cookie riêng, đổi assignment và persisted revocation. Không lưu credential, cookie hoặc browser trace của Staff vào artifact. Chi tiết phạm vi chỉ đọc ở [ADR-013](../06-architecture/adr/ADR-013-staff-read-and-smtp-verification.md).

SMTP dùng Mailpit được pin digest, trên network riêng không relay ra ngoài. Driver tạo đơn synthetic, đợi inbox receipt, phát event trùng, dừng/khởi động inbox, dừng/khởi động worker, thiết lập expired lease bằng fixture tin cậy và cho hai CLI process tranh cùng record với Redis locking. Fixture chỉ cho `NODE_ENV=test`, database `recommendation_test` qua localhost trong namespace PostgreSQL và order có email synthetic. Không expose fixture runner qua HTTP. Cuối driver hủy đúng đơn đã tạo và đối chiếu stock; EXIT trap xóa tài nguyên của run. Full CI phải xanh trên commit thực trước khi gọi đây là release acceptance.
