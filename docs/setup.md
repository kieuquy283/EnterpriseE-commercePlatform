# Thiết lập và vận hành cục bộ

Hướng dẫn dành cho môi trường phát triển, không phải lệnh triển khai AWS. Đọc [đặc tả](README.md) và [quy tắc cộng tác](../CONTRIBUTING.md). Dùng Node 24.22.1, npm 11.12.1 theo `packageManager` tại gốc, root lockfile và Docker Compose v2. Dùng `nvm install && nvm use` hoặc công cụ quản lý phiên bản tương đương trước khi cài đặt.

## Cài đặt và cấu hình

Tại thư mục gốc:

```sh
npm exec --yes --package=npm@11.12.1 -- npm ci
cp .env.example .env
cp apps/backend/.env.template apps/backend/.env
```

Chỉnh tệp riêng trên máy, không in cấu hình đã nội suy hay đưa tệp môi trường vào Git. Khớp thông tin PostgreSQL giữa Compose và `DATABASE_URL`; backend chạy trên máy dùng `localhost:5432`. Đặt `REDIS_URL=redis://localhost:6379`, JWT/COOKIE secret độc lập và CORS phù hợp. Đổi mật khẩu trong tệp môi trường không đổi mật khẩu của volume đã tồn tại.

## Kiểm tra cô lập, không dùng cấu hình riêng của checkout

OPS-01 kiểm tra khả năng dựng môi trường phục vụ các luồng catalog/cart/checkout trong [kế hoạch checkpoint](DAYMARK_Ke_Hoach_Tuan_1_Checkpoints_18_20_22_11_2026_v1.3_PhanBoCheckpoint.md). Đây là smoke cục bộ, không phải nghiệm thu nghiệp vụ hoặc mức sẵn sàng cloud. Dùng Linux hoặc WSL2 với Bash, GNU tar, `setsid`, curl, Node/npm đã ghim và Docker Compose hỗ trợ `up --wait`. Docker phải là daemon cục bộ qua Unix socket; harness từ chối `DOCKER_HOST` từ xa.

Sau khi cài dependency ở gốc bằng lệnh trên, chọn npm đã ghim vào PATH của terminal rồi chạy Bash trực tiếp. Không bọc tiến trình `serve` bằng `npm exec`: wrapper có thể chặn xử lý Ctrl+C. Không cần sao chép hay sửa `.env` để chạy:

```sh
test_npm_bin=$(npm exec --yes --package=npm@11.12.1 -c 'command -v npm')
export PATH="$(dirname "$test_npm_bin"):$PATH"
node --version # v24.22.1
npm --version  # 11.12.1

# Tự dừng và xóa đúng dịch vụ test khi smoke kết thúc hoặc lỗi.
bash scripts/test-environment-run.sh smoke

# Giữ môi trường để kiểm tra thủ công; Ctrl+C kết thúc và dọn dịch vụ test.
bash scripts/test-environment-run.sh serve

# Kiểm catalog/media demo, bảo toàn stock khi nhập lại và CLI first-admin invite.
bash scripts/test-environment-run.sh catalog

# Lượt riêng: chạy HTTP integration trên PostgreSQL mới, không seed smoke.
bash scripts/test-environment-run.sh http
```

[Compose test](../compose.test.yaml) chỉ chứa PostgreSQL 16 và Redis 7, không kế thừa Compose phát triển. Mỗi lượt dùng project `daymark-test-<ngẫu nhiên>`, cổng loopback do Docker cấp, DB `daymark_test` trong PostgreSQL mới và dữ liệu tmpfs; không dùng volume có tên, external network hoặc container cũ. PostgreSQL dùng `trust` chỉ cho fixture disposable: tiến trình khác trên máy vẫn có thể truy cập cổng loopback trong lúc chạy. Không dùng cấu hình này cho dữ liệu thật hoặc máy nhiều người dùng không tin cậy. Dừng container làm mất dữ liệu test.

[Harness](../scripts/test-environment-run.sh) lọc môi trường tiến trình, chỉ giữ PATH, locale và socket Docker cục bộ; tạo JWT/COOKIE secret mới trong bộ nhớ. Nó sao chép ứng dụng vào thư mục riêng dưới `/tmp/daymark-test-*`, bỏ `.env*`, output và upload cũ, liên kết dependency đã cài, chạy build tại bản sao rồi dùng CLI Medusa hiện có. Không đọc `.env` của checkout, không tạo tài khoản mặc định, không gọi AWS/provider bên ngoài. Tránh sửa nguồn trong lúc harness đang sao chép; bản sao phản ánh checkout hiện tại, gồm cả thay đổi chưa commit.

### Thao tác ghi và fixture tối thiểu

| Bước | Đích ghi và điều kiện |
| --- | --- |
| Build backend/Admin | `.medusa` và cache trong bản sao riêng; không sửa output của checkout |
| `medusa db:migrate` | Schema, migration và dữ liệu framework khởi tạo trong DB mới của lượt chạy |
| `npm run seed` | `seed-commerce.ts`: store/currency, sales channel + publishable key và link, Vietnam/VND + provider system/simulator test, tax region, stock location, fulfillment/service zone, shipping profile/option và link, ba product/variant/price + inventory level (25/18/12) |
| Mode `catalog` | Sau bootstrap: importer dry-run/apply với `--images demo`, thêm 30 sản phẩm/biến thể/giá/tồn và ảnh minh họa qua local file provider trong bản sao gói; giảm một mức tồn qua workflow Medusa, apply lại và so sánh toàn bộ product/variant/price/image + inventory snapshot. CLI `user --invite` tạo một lời mời cho địa chỉ giả `example.invalid`, không tạo mật khẩu; log token riêng bị xóa khi cleanup |
| API/worker/storefront | Cache, event/workflow/lock trong Redis riêng; session/runtime/cache của app trong bản sao |
| HTTP integration | Test-utils tạo/migrate/ghi/xóa DB và template DB trong cùng PostgreSQL disposable; fixture theo từng test có thể ghi customer/auth/cart/order/payment/stock và dữ liệu module |
| Cleanup | Gửi TERM tới nhóm tiến trình do lượt này tạo; `compose down --volumes --remove-orphans` với đúng project + tệp test; không đụng container/volume dự án khác |

Smoke yêu cầu API `/health`, HTML Admin `/app` và asset JavaScript đóng gói, worker `/health`, Store API trả Vietnam/VND và ba sản phẩm đã publish (33 trong mode `catalog`) và storefront `/vn/store` trả thành công. URL/cổng thực in cuối lượt `serve`. API chạy `WORKER_MODE=server`; worker chạy `WORKER_MODE=worker`, `ADMIN_DISABLED=true`; cùng DB/Redis riêng. Worker health chỉ chứng minh tiến trình nạp được cấu hình, không chứng minh subscriber xử lý hay giao thông báo. Admin HTML không chứng minh invite/login/RBAC; storefront HTTP không thay cho Playwright. Storefront dùng `next dev`, chưa phải production build.

Seed khởi tạo có một áo và hai sản phẩm kế thừa; không thay cho bộ catalog DAYMARK, fixture nhiều khách/role hay last-unit contention. Không chạy `seed:sample`, importer hoặc checkout để chữa lỗi môi trường. Các fixture đó cần DATA/QA xác định phiên bản và expected state riêng theo [hướng dẫn catalog](catalog/DATASET.md). Không có staff/customer mặc định trong smoke. Mode `catalog` là lệnh chuẩn bị/kiểm chứng tường minh, không chạy từ startup ứng dụng. Media demo chỉ dùng `NODE_ENV=test` và URL loopback, không cấu hình S3; ảnh đại diện không chứng minh ảnh đúng từng sản phẩm hay quyền công bố cloud. Invite CLI thành công và bản ghi pending không chứng minh nhận lời mời, đặt mật khẩu, đăng nhập hoặc RBAC; hoàn tất thủ công theo mục quản trị viên bên dưới trên DB phát triển riêng được phép giữ dữ liệu. Môi trường disposable xóa DB nên lời mời không dùng lại sau khi lượt kết thúc. Chế độ `local-disposable` từ chối production và DB ngoài loopback. Preview AWS dùng chế độ `cloud-demo` riêng có target/hash và quyền ghi rõ theo runbook; không đổi nhãn môi trường để vượt guard. Media đúng sản phẩm vẫn cần owner dữ liệu duyệt.

### Dừng, nhật ký và xử lý lỗi

Mỗi lượt in đường dẫn artifact riêng, tên project và mã thoát; log không tự in ra terminal. Lỗi bất kỳ làm harness trả mã khác 0 và vẫn dọn dịch vụ. Ctrl+C áp dụng cho lượt `serve`; không dùng `docker compose down` không chỉ rõ tệp/project, `docker system prune`, `pkill node` hay khởi động lại container preview cũ. Cổng ứng dụng được chọn động; xung đột bind làm kiểm tra thất bại, không dừng tiến trình đang chiếm cổng.

Thư mục artifact giữ bản sao/cache/log để xem lỗi; quyền thư mục chỉ cho người chạy. Kiểm tra và làm sạch log trước khi chia sẻ, không công bố JWT/cookie/token/customer record. Sau khi xác nhận dòng cleanup thành công, có thể xóa **đúng đường dẫn `/tmp/daymark-test-…` vừa được in**. Nếu cleanup báo lỗi, dùng đúng project đã in để xử lý:

```sh
# Thay duy nhất bằng project của chính lượt thất bại; kiểm tra trước khi xóa.
docker compose --env-file /dev/null -f compose.test.yaml -p 'daymark-test-THAY_RUN_ID' ps -a
docker compose --env-file /dev/null -f compose.test.yaml -p 'daymark-test-THAY_RUN_ID' down --volumes --remove-orphans
```

Không dùng `docker compose config` để thu bằng chứng khi có cấu hình riêng. Ghi SHA, trạng thái checkout, phiên bản Node/npm/Compose và image ID/digest thực tế, mode, mã thoát, các bước PASS/FAIL và cleanup vào báo cáo có ngày; không đưa kết quả từng lượt vào hướng dẫn này. Compose test ghim image bằng digest; chỉ đổi digest có chủ đích sau kiểm chứng. Ghi cả digest và kiến trúc máy để đối chiếu các lượt chạy. `npm ci` cần registry truy cập được; harness không cài, sửa hay bỏ qua dependency lỗi.

## Chuẩn bị cơ sở dữ liệu phát triển riêng (giữ dữ liệu)

Các lệnh sau ghi dữ liệu. Chỉ chạy sau khi xác nhận đích là cơ sở dữ liệu phát triển riêng; không trỏ vào dữ liệu dùng chung và không xóa/reseed để chữa lỗi.

```sh
docker compose up -d postgres redis
cd apps/backend
npm exec -- medusa db:migrate
npm run seed
cd ../..
```

Bootstrap tạo region/channel/provider và dữ liệu mẫu kế thừa; không tạo quản trị viên. Bộ nhập catalog riêng được hướng dẫn tại [catalog](catalog/DATASET.md). Không tự động seed hay tạo tài khoản khi khởi động.

## Khởi động phát triển

```sh
npm run backend:dev
# Terminal thứ hai:
npm run storefront:dev
```

Tạo riêng `apps/storefront/.env.local` với `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` lấy từ Admin, `NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000`, `MEDUSA_BACKEND_URL=http://localhost:9000` và `NEXT_PUBLIC_BASE_URL=http://localhost:8000`. Publishable key là dữ liệu công khai; không thay bằng khóa Admin/secret. Khởi động lại storefront khi thay đầu vào cấu hình.

| Bề mặt | URL mặc định |
| --- | --- |
| Storefront | http://localhost:8000/vn/store |
| Medusa Admin | http://localhost:9000/app |
| Health | http://localhost:9000/health |

## Build và chạy gói backend/Admin

```sh
npm run build --workspace=@dtc/backend
npm run start --workspace=@dtc/backend
```

`medusa build` sinh backend và Admin tại `apps/backend/.medusa/server`, với HTML/asset trong `public/admin`. Script `start` đổi thư mục vào gói này trước khi chạy CLI; Docker dùng chính script đó. Medusa production phục vụ `public/admin` tương đối với thư mục gói. Không chạy production CLI tại thư mục nguồn, không thêm symlink `apps/backend/public/admin`, không dùng wrapper preview và không sửa đầu ra sinh tự động. `medusa develop` là đường chạy phát triển với bundler của framework.

`start` đọc tệp cấu hình riêng `apps/backend/.env` nếu có; các biến đã cung cấp bởi môi trường tiến trình được giữ. Kiểm tra đích DB/Redis trước mọi lệnh migration hoặc onboarding. Migration là thao tác riêng, không nằm trong startup.

Vai trò API dùng `WORKER_MODE=server`, `ADMIN_DISABLED=false`; worker dùng `WORKER_MODE=worker`, `ADMIN_DISABLED=true`. Cả hai dùng cùng mã ứng dụng, module, PostgreSQL và Redis. Không cấu hình thì `shared` phục vụ phát triển. Worker không phục vụ commerce/Admin routes; cổng health của tiến trình không chứng minh worker xử lý nghiệp vụ thành công. Không bật payment simulator trong production.

## Quản trị viên đầu tiên, không có mật khẩu mặc định

Dùng CLI `medusa user --invite` của phiên bản đã cài. Lệnh tạo lời mời staff và ghi **token bí mật** ra stdout. Không chạy trong terminal chia sẻ, CI hay bản ghi demo. Chỉ chạy với quyền operator trên đúng DB đã được cho phép. Ví dụ Bash dưới đây chuyển toàn bộ đầu ra vào thư mục riêng ngoài repository; nhập email tương tác để không ghi giá trị vào lịch sử lệnh:

```sh
umask 077
private_admin_dir=$(mktemp -d)
read -r -p 'Email quản trị viên: ' admin_email
cd apps/backend/.medusa/server
node ../../../../node_modules/@medusajs/cli/cli.js user --invite -e "$admin_email" \
  > "$private_admin_dir/invite.log" 2>&1
unset admin_email
```

CLI tại thư mục gói cần biến DB/Redis/JWT/COOKIE giống tiến trình API; dùng cơ chế nạp bí mật riêng đã được phê duyệt trước khi chạy. Lệnh trên không tự nạp tệp `.env` tại thư mục nguồn. Không dùng `--password` vì mật khẩu có thể xuất hiện trong lịch sử/process arguments.

Mở `invite.log` bằng trình soạn thảo riêng trên máy operator, không `cat`/dán vào chat hoặc log. Kiểm tra CLI thành công rồi dùng liên kết `/app/invite?token=…` trên đúng host Admin tin cậy. Đặt mật khẩu trong biểu mẫu Admin qua HTTPS (HTTP chỉ cho loopback cục bộ), nhận lời mời rồi đăng nhập lại. Token lời mời là bí mật có thời hạn, chỉ dùng một lần; xóa tệp/thư mục tạm sau khi hoàn tất. Nếu lệnh thất bại, kiểm tra riêng và xử lý nguyên nhân trước khi tạo lời mời mới. Không chia sẻ tài khoản/mật khẩu hay seed sẵn staff.

Medusa phân biệt actor `user` (staff/Admin) và `customer` (Store API). Đăng ký auth identity không tự tạo staff có quyền; việc nhận lời mời mới liên kết user. Quy trình customer của storefront vẫn dùng `/auth/customer/emailpass` và `/store/customers`. Không dùng token customer cho Admin hay token staff cho hồ sơ customer. Không tuyên bố quyền staff chi tiết theo tên vai trò nghiệp vụ: Medusa có RBAC theo feature flag; chỉ dựa trên cấu hình và quyền đã kiểm chứng, không suy ra phân quyền từ nhãn giao diện.

## Kiểm tra và dừng

```sh
npm run docs:check
npm run lint --workspace=@dtc/backend
npm run typecheck --workspace=@dtc/backend
npm run test:unit --workspace=@dtc/backend
npm run lint --workspace=@dtc/storefront
npm run typecheck --workspace=@dtc/storefront
# Chỉ với DB test riêng và cấu hình đích tường minh:
npm run test:integration:http --workspace=@dtc/backend
```

Integration runner tạo/migrate/xóa DB test; dùng dịch vụ disposable riêng. Với PostgreSQL cục bộ không SSL, dùng `DB_HOST=localhost`: test-utils của phiên bản này tự yêu cầu SSL cho host không chứa `localhost`. HTTP runner dùng Redis giả lập; kiểm tra runtime Redis thật là bằng chứng khác. E2E cần backend/storefront và fixture riêng đã chuẩn bị; build thành công không chứng minh hành trình trình duyệt hoàn chỉnh.

Dừng ứng dụng bằng Ctrl+C, dùng `docker compose stop postgres redis` để giữ volume phát triển. Chỉ dọn container/volume test do lượt kiểm tra tạo ra. Lệnh AWS thuộc [runbook](../deploy/RUNBOOK.md) và cần phạm vi cho phép riêng. Công cụ báo cáo nằm tại [presentation](../presentation/README.md).
