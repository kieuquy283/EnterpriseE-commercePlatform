# Thiết lập và vận hành cục bộ

Hướng dẫn dành cho môi trường phát triển, không phải lệnh triển khai AWS. Đọc [đặc tả](README.md) và [quy tắc cộng tác](../CONTRIBUTING.md). Dùng Node 24.22.1, npm 11.12.1 theo `packageManager` tại gốc, root lockfile và Docker Compose v2. Dùng `nvm install && nvm use` hoặc công cụ quản lý phiên bản tương đương trước khi cài đặt.

## Cài đặt và cấu hình

Tại thư mục gốc:

```sh
corepack npm ci
cp .env.example .env
cp apps/backend/.env.template apps/backend/.env
```

Chỉnh tệp riêng trên máy, không in cấu hình đã nội suy hay đưa tệp môi trường vào Git. Khớp thông tin PostgreSQL giữa Compose và `DATABASE_URL`; backend chạy trên máy dùng `localhost:5432`. Đặt `REDIS_URL=redis://localhost:6379`, JWT/COOKIE secret độc lập và CORS phù hợp. Đổi mật khẩu trong tệp môi trường không đổi mật khẩu của volume đã tồn tại.

## Chuẩn bị cơ sở dữ liệu mới

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
