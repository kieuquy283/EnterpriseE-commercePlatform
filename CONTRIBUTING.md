# Contributing

## Chạy local

Cần Node.js >= 22.22.0, npm 11, Docker Engine/Desktop và Docker Compose v2. Chạy từ thư mục gốc repo (PowerShell):

```powershell
. .\scripts\use-d-drive.ps1 # Windows: đặt cache/tệp tạm trên ổ D
npm ci
Copy-Item .env.example .env
Copy-Item apps/backend/.env.template apps/backend/.env
```

Đặt cùng mật khẩu PostgreSQL trong `.env` và `DATABASE_URL` của `apps/backend/.env`; cấu hình `JWT_SECRET`, `COOKIE_SECRET` và CORS theo môi trường local. Sau đó chạy `docker compose up -d postgres redis`. Khi PostgreSQL/Redis đã healthy, khởi tạo database mới:

```powershell
Set-Location apps/backend
npx medusa db:migrate
npm run seed
npx medusa user -e admin@example.com -p '<mat-khau-manh>'
Set-Location ../..
```

Chạy `npm run backend:dev` và `npm run storefront:dev` ở hai terminal. Lấy publishable key **Storefront** tại `http://localhost:9000/app`, rồi tạo `apps/storefront/.env.local` với `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, `NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000`, `MEDUSA_BACKEND_URL=http://localhost:9000` và `NEXT_PUBLIC_BASE_URL=http://localhost:8000`. Khởi động lại storefront sau khi đặt key; truy cập `http://localhost:8000/vn/store`. Xem [README.md](README.md) nếu cần hướng dẫn chi tiết.

## Branch, commit và PR

- Đặt tên branch theo `feat/`, `fix/`, `chore/`, `docs/` hoặc `test/`, kèm mô tả ngắn bằng kebab-case; ví dụ `fix/checkout-address`.
- Dùng commit dạng `type(scope): mô tả ngắn`, với `type` tương ứng các tiền tố trên; ví dụ `fix(storefront): validate checkout address`.
- PR nên tập trung vào một thay đổi, nêu lý do, phạm vi ảnh hưởng, cách kiểm tra và cập nhật tài liệu/mẫu env khi cần. Dùng [PR template](.github/PULL_REQUEST_TEMPLATE.md). Giữ `main` luôn buildable.
- Không commit `.env`, `.env.local` hoặc secret. Không sửa trực tiếp `package-lock.json`; để npm cập nhật lockfile khi đổi dependency.

## Checklist trước merge

```powershell
npm run lint
npm run typecheck
npm run build
docker compose config --quiet
```

Build storefront cần `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` hợp lệ (CI dùng key placeholder cho bước build). Nếu thay đổi flow commerce, chạy thử luồng trên storefront hoặc đặt `$env:PUBLISHABLE_KEY="<publishable-key-Storefront>"` rồi chạy `.\scripts\smoke-checkout.ps1 -RegisterCustomer` với backend local. Script tạo khách hàng/đơn hàng thật trong database đang kết nối. Kiểm tra tương thích giữa storefront, backend và dữ liệu khi sửa API, schema hoặc cấu hình.
