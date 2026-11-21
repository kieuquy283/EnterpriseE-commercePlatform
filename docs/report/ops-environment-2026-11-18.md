# OPS-01 — Bằng chứng môi trường cục bộ, 18/11/2026

- Yêu cầu: OPS-01 trong kế hoạch checkpoint 18/20/22; môi trường kiểm thử cho FR-01/02/03/04/05/06/09, không phải nghiệm thu các FR.
- Baseline HEAD: `1b6a668`, nhánh checkout chung `feat/daymark-storefront-catalog`. Source app tại baseline; thay đổi workflow/tài liệu của agent khác tồn tại đồng thời và không thuộc phạm vi này. Không commit/push/deploy.
- Máy Linux x86_64; Node `24.22.1`; npm chạy harness `11.12.1` qua `npm exec --yes --package=npm@11.12.1`. npm mặc định máy là `11.19.1`: harness từ chối bằng exit 2 trước khi tạo dịch vụ.
- Docker Engine `29.9.2`, Compose `5.4.0`; daemon rootless qua Unix socket. Không bật lại container cũ.
- PostgreSQL `16.13`, digest `sha256:20edbde7749f822887a1a022ad526fde0a47d6b2be9a8364433605cf65099416`; Redis `7.4.8`, digest `sha256:8b81dd37ff027bec4e516d41acfbe9fe2460070dc6d4a4570a2ac5b9d59df065`. Hai digest được ghim trong `compose.test.yaml`.
- DB/Redis mới cho từng lượt; dữ liệu tmpfs, cổng loopback động; không đọc `.env*`, không dùng DB/S3/AWS chung. Credential tạm không đưa vào bằng chứng. Phạm vi ghi được liệt kê trong `docs/setup.md`.

## Lệnh và kết quả

Các lượt smoke/http/catalog dưới đây đã chạy qua npm exec và kết thúc bình thường. Với `serve`, dùng PATH npm đã ghim và Bash trực tiếp theo `docs/setup.md` (xem lỗi Ctrl+C bên dưới):

```sh
npm exec --yes --package=npm@11.12.1 -c 'bash scripts/test-environment-run.sh smoke'
npm exec --yes --package=npm@11.12.1 -c 'bash scripts/test-environment-run.sh http'
npm exec --yes --package=npm@11.12.1 -c 'bash scripts/test-environment-run.sh catalog'
```

| Lượt / thời điểm UTC | Kết quả thực tế | Artifact riêng trên máy |
| --- | --- | --- |
| `daymark-test-08kpobqr3w`, khoảng 15:49–15:50 | PASS exit 0: build backend/Admin (gồm lint mặc định), migration, bootstrap seed, publishable key, API `/health`, Admin `/app`, worker `/health`, ba sản phẩm qua Store API, storefront `/vn/store`; cleanup thành công | `/tmp/daymark-test-08kpobqr3W/logs/` |
| `daymark-test-clpv9mclrn`, khoảng 15:51–15:52 | PASS exit 0: HTTP integration **5 suites, 29 tests**, không skip; DB được tạo/migrate/ghi/xóa bởi test-utils; cleanup thành công | `/tmp/daymark-test-cLpV9McLRn/logs/http.log` |
| `daymark-test-n9zhrnprlq`, khoảng 15:54–15:55 | PASS exit 0: build/migrate/bootstrap; catalog dry-run, apply ảnh demo, giảm một mức tồn đi 1 qua workflow, apply lại, so sánh snapshot; first-admin invite CLI + readback pending; API/Admin JS/worker/region/products/media/storefront; cleanup thành công | `/tmp/daymark-test-n9ZHRnpRlQ/logs/` |

Chi tiết catalog `DAYMARK_CATALOG_FIXTURE` version 1: importer thêm 30 sản phẩm; Store API dùng publishable key của channel bootstrap trả tổng 33 sản phẩm. Snapshot xác nhận 30 sản phẩm `dm-*` published với 30 URL ảnh local demo. Sau lần apply thứ nhất, probe chọn một mức tồn `DM-*`, giảm `stocked_quantity` đi 1 bằng `updateInventoryLevelsWorkflow`, lưu snapshot; lần apply thứ hai không tạo/update product hoặc inventory. So sánh snapshot sau rerun xác nhận cùng product/variant/price/image ID và inventory quantity, gồm mức tồn đã giảm. Importer tự kiểm manifest/checksum trước ghi. Đây không phải test cạnh tranh last-unit/checkout.

Store API trả region có `currency_code=vnd`, country `vn`, dùng key đã link sales channel. Media HTTP tải một JPEG local từ URL đã ghi trên sản phẩm; snapshot kiểm 30 URL nhưng không tải từng ảnh. Các ảnh manifest có `matchConfidence=representative`: đây là ảnh minh họa, không phải chứng nhận ảnh đúng sản phẩm/quyền công bố cloud.

Admin chạy từ `.medusa/server`, API mode `server`; `/app` và JavaScript bundle trả thành công. Worker mode `worker`, Admin disabled, cùng DB/Redis test. Worker health chưa chứng minh giao nhận job/email. Storefront dùng `next dev`, HTTP trang store thành công, chưa chạy trình duyệt hoặc production build trong nhiệm vụ này.

Lệnh first-admin được chạy từ gói đã build với môi trường DB/Redis/JWT/COOKIE của lượt này:

```sh
node /absolute/path/to/node_modules/@medusajs/cli/cli.js user --invite -e ops-bootstrap@example.invalid
```

Toàn bộ stdout/stderr lời mời được redirect sang log private; kiểm tra graph chỉ đọc `id`, `accepted` theo email giả, xác nhận một pending invite. File chứa token bị xóa khi cleanup. Không đặt mật khẩu, không seed staff. HTTP test `accepts a staff invite and keeps customer authentication separate` trong 29 test đã PASS: tạo invite bằng workflow, đăng ký user auth, accept, login, `/admin/users/me` 200, customer surface 401 và accept lại 401. Test này không dùng lời mời từ CLI và không thay thế acceptance qua giao diện Admin hay permission matrix Staff/Admin.

## Các lần thất bại khi phát triển harness

- Lượt đầu: môi trường lọc bỏ socket rootless nên không kết nối được Docker, chưa tạo container; sửa để chỉ giữ `DOCKER_HOST=unix://…`, vẫn từ chối daemon từ xa.
- Lượt kế: export biến cùng dòng với biến phụ thuộc gây `unbound variable`; đã sửa, dịch vụ của lượt lỗi được dọn.
- Readback catalog lần đầu: so sánh object có `dataset: undefined` với JSON bỏ field này; sửa chuẩn hóa JSON ở hai phía. Import/rerun/invite đã chạy, lượt không được coi PASS; DB đã dọn, file token đã xóa.
- Một lượt đang build bị gián đoạn do chỉnh nội dung script Bash trong lúc shell còn đọc; chạy lại từ script ổn định, cleanup thành công. Không coi là lỗi ứng dụng.
- Một phần kiểm region bị chèn lặp trong lúc mở rộng harness; đã bỏ đoạn lặp và giữ expected count 3/33 theo mode. Lượt catalog trên vẫn kiểm đúng 33 sản phẩm; baseline cuối được kiểm lại riêng.

## Cài sạch và kiểm tra dừng tương tác

Cài dependency vào bản sao source tracked riêng `/tmp/daymark-test-install-3lFG1GMI/work`, loại `.env*`, không có node_modules hoặc cấu hình máy; HOME mới, `CI=true`, Node 24.22.1 và npm 11.12.1. `npm ci` PASS exit 0: 2.039 package được thêm, 2.043 được audit trong 60 giây. SHA-256 lockfile bản sao và gốc cùng `e06987ac5de1a74d62b4cc55fa03302206c47e4e2d6976ebdeb1389df3181103`. Không thay manifest/lock. Log private: `/tmp/daymark-test-install-3lFG1GMI/install.log`.

Audit tích hợp của npm ci báo 150 findings (68 moderate, 82 high), không có verdict security PASS. Không chạy npm audit fix; giao audit agent triage, không suy reachability từ số đếm này.

Lượt `daymark-test-d8stzusjxm` dùng dependency cài sạch đã PASS build/migrate/seed/API/Admin JS/worker/region/3 sản phẩm/storefront. **FAIL dừng qua npm exec**: Ctrl+C làm wrapper thoát trước trap, còn ba process group app và hai container riêng. Đã xác định PID/PGID và project đúng lượt, gửi TERM riêng ba group rồi Compose down đúng project; không chạm process/container khác. Hướng dẫn đổi sang chọn binary npm vào PATH rồi gọi Bash trực tiếp. Không coi lượt này là PASS start/stop.

Lượt kiểm lại `daymark-test-ivfj2ikzrf` khoảng 15:59–16:00 UTC dùng Bash trực tiếp và PATH npm đã ghim, cùng dependency cài sạch: PASS build/migrate/seed/API/Admin JS/worker/Vietnam-VND/3 products/storefront. Gửi Ctrl+C sau khi sẵn sàng: harness trả **exit 130 theo thiết kế**, in cleanup thành công; hai container và network riêng được xóa. Artifact private: `/tmp/daymark-test-ivFj2IKZRf/logs/`. Đây là PASS kịch bản dừng chủ động, không phải test ứng dụng lỗi.

Kiểm tra công cụ: `bash -n scripts/test-environment-run.sh`, `docker compose --env-file /dev/null -f compose.test.yaml config --quiet`, typecheck riêng helper qua TypeScript `--noEmit --skipLibCheck --esModuleInterop --module Node16 --moduleResolution Node16 --target ES2021 --experimentalDecorators --emitDecoratorMetadata`, `npm run docs:check` và `git diff --check` đều PASS. Docs checker kiểm liên kết/requirement, không render sơ đồ hay duyệt fragment. Không có thay đổi dependency/package/lock do OPS-01.

## Giới hạn và phụ thuộc bàn giao

- Chưa xác nhận browser Admin invite/login, Staff/Admin deny matrix, notification delivery/retry, production storefront, AWS runtime hoặc cloud readiness. Không tự cho OPS-01 DONE cần reviewer chấp thuận.
- Importer catalog hiện từ chối production và host DB ngoài loopback; không thể dùng nguyên lệnh disposable làm quy trình seed AWS. Backend/data owner cần thiết kế và phê duyệt đường nhập cloud; không vượt guard bằng đổi nhãn môi trường.
- Media hiện là minh họa. DATA owner cần manifest đúng sản phẩm, nguồn/quyền sử dụng và quy trình provider cloud được phép; không upload S3 trong lượt này.
- Không cần thay package/lock/dependency để thêm harness; các cảnh báo dependency từ cài sạch thuộc agent audit/CI triage. CI agent sở hữu workflow và `scripts/ci-*`.
- Logs/bản sao tạm private không phải artifact bền hoặc đã làm sạch để công bố. Hướng dẫn ổn định ở `docs/setup.md`; báo cáo này chỉ đúng với phiên bản/lượt đã ghi.
