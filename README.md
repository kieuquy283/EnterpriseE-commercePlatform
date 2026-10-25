# Commerce MVP với Medusa v2

Ứng dụng thương mại điện tử MVP gồm **Medusa v2.21.2** (API và Admin), **Next.js** (storefront), **PostgreSQL** và **Redis**. Medusa quản lý sản phẩm, khách hàng, giỏ hàng, đơn hàng, thanh toán thủ công, vận chuyển và tồn kho. Redis phục vụ cache, event bus, workflow và khóa của Medusa. Mã nguồn dùng TypeScript trong cả backend và storefront.

## Chức năng hiện có

- Khách đăng ký/đăng nhập, xem và tìm sản phẩm theo từ khóa, xem chi tiết, thêm vào giỏ, nhập địa chỉ, chọn vận chuyển, đặt hàng và xem lịch sử/chi tiết đơn.
- Thanh toán dùng provider có sẵn `pp_system_default`, được hiển thị như **thanh toán khi nhận hàng (COD)**. Đặt hàng thành công không đồng nghĩa đã thu tiền.
- Medusa Admin quản lý sản phẩm, tồn kho, đơn hàng và fulfillment. Seed tạo vùng Vietnam/VND, kho, kênh bán, phương thức giao hàng và ba sản phẩm mẫu.

MVP hiện **chưa có** cổng thanh toán thật, payment simulator, thông báo tự động, search engine riêng, báo cáo tùy chỉnh hoặc custom Medusa module. Tìm kiếm hiện dùng Store API của Medusa. Xem [PLAN.md](PLAN.md) để biết các hạng mục mở rộng.

## Yêu cầu

- Node.js **>= 22.22.0** và npm **11** (repo dùng `package-lock.json`).
- Docker Desktop/Engine với Docker daemon đang chạy; Docker Compose v2.
- Các cổng mặc định còn trống: `5432` (PostgreSQL), `6379` (Redis), `9000` (Medusa), `8000` (storefront).
- PowerShell cho các lệnh dưới đây. Trên Windows, nên chạy `. .\scripts\use-d-drive.ps1` ở **mỗi cửa sổ PowerShell** trước lệnh npm để cache và tệp tạm nằm trên ổ `D:` của workspace này.

Mọi lệnh dưới đây bắt đầu tại thư mục gốc của repo, trừ khi có `Set-Location`.

## Cài đặt và chạy lần đầu

### 1. Cài dependency và cấu hình môi trường

```powershell
. .\scripts\use-d-drive.ps1
npm ci
Copy-Item .env.example .env
Copy-Item apps/backend/.env.template apps/backend/.env
```

Sửa hai file vừa tạo trước khi tiếp tục:

- `.env`: `POSTGRES_PASSWORD` là mật khẩu PostgreSQL mà Compose sẽ dùng.
- `apps/backend/.env`: `DATABASE_URL` phải dùng **đúng mật khẩu trên**, với host `localhost:5432`; `REDIS_URL=redis://localhost:6379`. Đặt `JWT_SECRET` và `COOKIE_SECRET` thành hai chuỗi ngẫu nhiên dài. Giữ `STORE_CORS=http://localhost:8000` và `AUTH_CORS` chứa `http://localhost:8000` nếu dùng cổng mặc định.

Ví dụ cho môi trường **chỉ chạy trên máy cá nhân**: mật khẩu trong hai file đều là `commerce-local-only`, và `DATABASE_URL=postgresql://commerce:commerce-local-only@localhost:5432/commerce`. Nếu đổi `POSTGRES_PASSWORD` sau khi PostgreSQL đã tạo volume, biến môi trường mới không tự đổi mật khẩu trong database cũ; hãy dùng mật khẩu hiện có hoặc đổi mật khẩu trong PostgreSQL. Không commit `.env` và `.env.local`.

### 2. Khởi động PostgreSQL và Redis

```powershell
docker info
docker compose up -d postgres redis
docker compose ps
```

Chờ cả hai service báo `healthy`. Compose mặc định chỉ khởi động hạ tầng; các service ứng dụng nằm trong profile `app`.

### 3. Tạo schema, dữ liệu mẫu và tài khoản Admin

```powershell
Set-Location apps/backend
npx medusa db:migrate
npm run seed
npx medusa user -e admin@example.com -p 'MatKhauAdminManh!'
Set-Location ../..
```

Đổi email và mật khẩu Admin trước khi chạy. Seed tạo publishable API key tên **Storefront** và liên kết nó với sales channel. Seed bỏ qua nếu vùng `Vietnam` đã tồn tại; bước này dành cho database mới.

### 4. Chạy Medusa và lấy publishable API key

Trong **PowerShell thứ nhất**, tại gốc repo:

```powershell
. .\scripts\use-d-drive.ps1
npm run backend:dev
```

Chờ Medusa sẵn sàng tại `http://localhost:9000`. Mở `http://localhost:9000/app`, đăng nhập Admin vừa tạo và sao chép publishable API key **Storefront** trong phần Settings/API Keys.

### 5. Cấu hình và chạy storefront

Tạo `apps/storefront/.env.local` với nội dung sau, thay `<publishable-key>` bằng key vừa lấy:

```dotenv
NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<publishable-key>
NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000
MEDUSA_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_BASE_URL=http://localhost:8000
```

Trong **PowerShell thứ hai**, tại gốc repo:

```powershell
. .\scripts\use-d-drive.ps1
npm run storefront:dev
```

Mở:

| Thành phần | Địa chỉ |
| --- | --- |
| Storefront | `http://localhost:8000/vn/store` |
| Medusa Admin | `http://localhost:9000/app` |
| Health endpoint | `http://localhost:9000/health` |

Các lần chạy tiếp theo chỉ cần `docker compose up -d postgres redis`, sau đó chạy `npm run dev` tại gốc repo nếu các file môi trường và database đã được thiết lập. Không cần chạy lại migration/seed trừ khi schema hoặc dữ liệu khởi tạo thay đổi.

Để dừng ứng dụng, nhấn `Ctrl+C` trong các terminal Node.js. Khi không dùng database/Redis nữa, chạy `docker compose stop postgres redis`; lệnh này giữ nguyên dữ liệu trong Docker volumes.

## Kiểm tra luồng đặt hàng

Trên storefront: mở một sản phẩm → thêm vào giỏ → checkout → nhập địa chỉ Việt Nam → chọn **Standard delivery** → chọn COD → đặt hàng. Đăng nhập để xem đơn trong tài khoản. Trong Admin, kiểm tra đơn và tồn kho đã được Medusa cập nhật.

Có thể chạy smoke test Store API bằng PowerShell. Lệnh này **tạo một khách hàng và một đơn hàng thử thật** trong database hiện tại:

```powershell
$env:PUBLISHABLE_KEY="<publishable-key-Storefront>"
.\scripts\smoke-checkout.ps1 -RegisterCustomer
```

Script kiểm tra đăng ký, đăng nhập, giỏ hàng, vận chuyển, COD, tạo đơn và lịch sử đơn. Chỉ dùng với Medusa chạy ở `localhost` hoặc `127.0.0.1`.

Các lệnh kiểm tra mã nguồn:

```powershell
npm run test:integration:http --workspace=@dtc/backend -- integration-tests/http/checkout-order.spec.ts
npm run lint --workspace=@dtc/backend
npm run lint --workspace=@dtc/storefront
npm run typecheck --workspace=@dtc/backend
npm run typecheck --workspace=@dtc/storefront
npm run build --workspace=@dtc/backend
npm run build --workspace=@dtc/storefront
docker compose config --quiet
```

HTTP integration test checkout/order khởi tạo database riêng cho test, chạy dữ liệu seed trong database đó rồi xóa database khi hoàn tất. Tài khoản PostgreSQL trong `apps/backend/.env` cần quyền tạo database; test không dùng database commerce hiện tại. Redis được tắt riêng trong runner này, không thay đổi cấu hình môi trường của backend.

Khi build storefront, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` phải được đặt thành key hợp lệ; Next.js nhúng biến `NEXT_PUBLIC_*` lúc build. Nếu đổi key sau đó, build lại storefront.

## Chạy ở cổng khác hoặc xử lý lỗi thường gặp

- **Docker chưa chạy:** mở Docker Desktop/khởi động daemon, rồi kiểm tra `docker info` trước khi chạy Compose.
- **Không kết nối PostgreSQL:** kiểm tra `docker compose ps`; đối chiếu `POSTGRES_PASSWORD` trong `.env` với mật khẩu trong `DATABASE_URL` của `apps/backend/.env`.
- **Store API báo thiếu publishable key:** kiểm tra `apps/storefront/.env.local`, key **Storefront** và khởi động lại Next.js sau khi sửa file.
- **Cổng 8000 đã bị chiếm:** thêm `http://127.0.0.1:8001` vào `STORE_CORS` và `AUTH_CORS` trong `apps/backend/.env`, khởi động lại Medusa; đổi `NEXT_PUBLIC_BASE_URL=http://127.0.0.1:8001` trong `apps/storefront/.env.local`. Sau đó, từ `apps/storefront` chạy `npx next dev -p 8001 -H 127.0.0.1` và mở `http://127.0.0.1:8001/vn/store`.
- **Trang báo hydration error sau khi cập nhật code/dev server:** tải lại bằng `Ctrl+Shift+R`. Nếu lỗi vẫn còn, dừng storefront, xóa cache build `apps/storefront/.next`, rồi chạy lại Next.js.
- **`/health` trả 200:** endpoint này xác nhận tiến trình Medusa hoạt động; vẫn cần kiểm tra database, Redis và đặt hàng thực để xác nhận luồng end-to-end.

## Cấu trúc và triển khai

```text
apps/backend/       Medusa config, seed và API/Admin của Medusa
apps/storefront/    Next.js storefront dùng Medusa JS SDK
scripts/            Tiện ích PowerShell và smoke checkout
load/               Kịch bản k6 cho môi trường staging
deploy/             Ví dụ triển khai một VM với Compose/Caddy và runbook
```

`docker-compose.yml` chạy PostgreSQL/Redis tại máy local và có profile `app` cho backend, worker, storefront và migration. Compose tự chạy migration trước backend/worker; seed và publishable key cần thiết lập lần đầu theo hướng dẫn bên dưới. Backend Docker, migration, PostgreSQL/Redis và health check đã được kiểm tra local. Xem [deploy/RUNBOOK.md](deploy/RUNBOOK.md) cho triển khai cloud. S3 chỉ là tùy chọn qua file provider có sẵn của Medusa; MVP local không cần object storage hay search engine riêng.

## Chạy toàn bộ bằng Docker Compose

Từ thư mục gốc (Bash hoặc PowerShell), sao chép `.env.example` thành `.env`, đặt mật khẩu và hai secret riêng. Mật khẩu PostgreSQL trong URL phải được URL-encode nếu chứa ký tự đặc biệt. Không dùng các giá trị mặc định cho môi trường public.

```sh
docker compose build backend worker migrate
docker compose up -d postgres redis
docker compose run --rm migrate
docker compose run --rm -w /app/apps/backend backend npm run seed
# Tạo tài khoản quản trị bằng lệnh medusa user trong container backend.
```

Lấy publishable key Storefront từ Admin sau khi khởi động API:

```sh
docker compose up -d backend worker
```

Đặt `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` vào `.env`, rồi chạy:

```sh
docker compose --profile app up -d --build
docker compose ps
docker compose logs --tail=100 -f backend worker
curl --fail http://localhost:9000/health
```

URL PostgreSQL nội bộ dùng `sslmode=disable` vì container database này không cấu hình TLS. Backend và worker chỉ khởi động sau khi PostgreSQL/Redis healthy và service `migrate` hoàn tất. Migration cũng được chạy khi khởi động stack; seed và tạo admin là thao tác chủ động cho database mới. Container dùng cấu hình production, không có hot reload. Dùng `npm run backend:dev` nếu cần phát triển trực tiếp trên máy.

Log Medusa đi ra stdout/stderr; `LOG_LEVEL` trong `.env` được truyền vào tiến trình container (mặc định `info`). Docker lưu log JSON, xoay vòng tối đa 3 file × 10 MB cho mỗi service lâu dài. `/health` là liveness của API; healthcheck riêng của PostgreSQL và Redis kiểm tra hạ tầng, không thay thế giám sát workflow của worker. `docker compose stop` giữ dữ liệu; `docker compose down` cũng giữ named volumes nếu không thêm `-v`.

CI chạy lint, typecheck, build hai ứng dụng và HTTP integration test với PostgreSQL/Redis riêng. `npm test` tại root thực thi test backend qua Turbo. Để chạy test local, cung cấp `DB_HOST=localhost` (test runner dùng SSL với hostname khác), `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD` cho PostgreSQL test có quyền tạo database, cùng `REDIS_URL` trỏ tới Redis dành riêng cho test; không dùng database/Redis production.
