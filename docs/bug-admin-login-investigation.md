# Kế Hoạch & Hướng Dẫn Điều Tra Lỗi: Đăng Nhập Medusa Admin Thất Bại Trên Web UI

Xem [báo cáo xử lý](bug-admin-login-resolution-report.md) để biết thay đổi đã áp dụng và kết quả xác minh. Tài liệu này ghi lại các giả thuyết ban đầu; chưa có trace Admin UI trước sửa để kết luận một nguyên nhân duy nhất.

## 1. Tổng Quan Lỗi (Bug Summary)

- **Mã lỗi:** `BUG-ADMIN-AUTH-001`
- **Mô tả:** Tài khoản Admin xác thực thành công qua API trực tiếp (`POST /auth/user/emailpass` trả về HTTP 200 kèm JWT token), nhưng khi đăng nhập trên giao diện web Medusa Admin Dashboard (`http://localhost:9000/app/login`) thì thất bại (không vào được Dashboard hoặc bị văng/reload lại trang login).
- **Môi trường bị ảnh hưởng:**
  - Medusa Backend: `v2.21.2` (@dtc/backend) chạy qua Docker Compose (`e-commerce-backend-1`).
  - Medusa Admin: `@medusajs/dashboard` phục vụ tại `http://localhost:9000/app`.
  - Database: PostgreSQL 16 (`commerce`), Redis 7.
- **Tài khoản kiểm thử:** Admin user hiện có trong database local; không ghi email và user ID thật vào tài liệu công khai.

---

## 2. Kết Quả Xác Nhận Hiện Tại (Facts & Findings)

### 2.1. Xác thực trực tiếp qua API: THÀNH CÔNG
Gọi trực tiếp endpoint xác thực bằng PowerShell hoặc cURL:
```powershell
Invoke-RestMethod -Method POST `
  -Uri "http://localhost:9000/auth/user/emailpass" `
  -ContentType "application/json" `
  -Body '{"email":"<admin-email>","password":"<password>"}'
```
- **Kết quả:** Trả về HTTP 200 kèm JWT token hợp lệ.
- **Kết luận:** Tài khoản tồn tại trong bảng `public."user"` và bảng `auth_identity`, mật khẩu khớp với hash trong `provider_identity`.

### 2.2. Đăng nhập qua Web UI: THẤT BẠI
Khi người dùng truy cập `http://localhost:9000/app/login`, nhập đúng email và password:
- Không chuyển hướng thành công vào trang quản trị (`/app`).
- Hoặc form reload lại trang đăng nhập mà không duy trì phiên làm việc.

---

## 3. Luồng Xác Thực Của Medusa Admin Web UI (Architecture Flow)

Khác với việc gọi API trực tiếp (chỉ nhận token), giao diện Web Admin hoạt động theo chu trình phiên (Session-based flow):

1. **Bước 1 - Lấy JWT Token:** Web UI gửi `POST /auth/user/emailpass` với `{ email, password }`. Backend trả về `{ token: "..." }`.
2. **Bước 2 - Tạo Phiên (Session):** JS SDK của Dashboard gọi `POST /auth/session` kèm header `Authorization: Bearer <token>`.
3. **Bước 3 - Ghi Cookie:** Endpoint `/auth/session` khởi tạo `req.session.auth_context` thông qua `express-session`, và trả về header `Set-Cookie: connect.sid=...`.
4. **Bước 4 - Tải Thông Tin Admin:** Web UI điều hướng vào `/app` và gọi `GET /admin/users/me` kèm cookie `connect.sid`.

---

## 4. Các Giả Thuyết Nguyên Nhân Gốc (Root Cause Hypotheses)

### Giả thuyết 1: Cookie có cờ `Secure: true` trên kết nối HTTP không bảo mật (Khả năng cao nhất)
- Trong `docker-compose.yml`, service `backend` được cấu hình:
  ```yaml
  environment:
    NODE_ENV: production
  ```
- Trong mã nguồn framework (`@medusajs/framework/dist/http/express-loader.js` dòng 30-34):
  ```javascript
  function resolveSessionCookieSecurity({ isProduction, isStaging }) {
    if (isProduction || isStaging) {
      return { sameSite: "lax", secure: true };
    }
    return { sameSite: false, secure: false };
  }
  ```
- **Hệ quả có thể xảy ra:** Vì `isProduction = true`, session cookie mặc định có thuộc tính `Secure`. Trên HTTP local, `express-session` có thể không phát cookie hoặc trình duyệt không gửi lại cookie; cần kiểm tra response thực tế để kết luận.
- Khi Web UI chuyển hướng sang `/app` hoặc gọi `/admin/users/me`, request không có cookie session -> Trả về 401 Unauthorized -> Bị đẩy ngược về `/app/login`.

### Giả thuyết 2: Lỗi CORS do khác biệt Hostname (`127.0.0.1` vs `localhost`)
- Biến môi trường trong `docker-compose.yml`:
  ```yaml
  ADMIN_CORS: http://localhost:9000
  AUTH_CORS: http://localhost:8000,http://localhost:9000
  ```
- Nếu người dùng mở trình duyệt bằng `http://127.0.0.1:9000/app/login`, trình duyệt gửi header `Origin: http://127.0.0.1:9000`.
- Backend từ chối chia sẻ credentials/cookies vì `127.0.0.1` không nằm trong danh sách CORS được phép.

### Giả thuyết 3: Xung đột Cookie hoặc LocalStorage cũ trong trình duyệt
- Phiên làm việc cũ trước khi restart backend/docker lưu lại cookie hoặc state rác trong localStorage.

---

## 5. Quy Trình Agent Thực Hiện Kiểm Tra & Tái Hiện (Investigation Steps)

Agent cần thực hiện tuần tự các bước sau để xác định chính xác nguyên nhân:

### Bước 1: Kiểm tra Header trả về từ `/auth/session`
Chạy script kiểm tra xem backend có gửi header `Set-Cookie` khi hoàn tất xác thực hay không, và xem cờ `Secure` có được kích hoạt không:

```powershell
# Chạy từ repo root
$email = "<admin-email>"
$password = "MậtKhẩuAdminCủaBạn"

# 1. Lấy token
$authRes = Invoke-WebRequest -Method POST `
  -Uri "http://localhost:9000/auth/user/emailpass" `
  -ContentType "application/json" `
  -Body (@{ email = $email; password = $password } | ConvertTo-Json)

$token = ($authRes.Content | ConvertFrom-Json).token

# 2. Gọi /auth/session với token
$sessionRes = Invoke-WebRequest -Method POST `
  -Uri "http://localhost:9000/auth/session" `
  -Headers @{ "Authorization" = "Bearer $token" }

Write-Host "Session Status:" $sessionRes.StatusCode
$cookieHeader = [string]$sessionRes.Headers["Set-Cookie"]
Write-Host "Cookie present:" (-not [string]::IsNullOrEmpty($cookieHeader))
Write-Host "Secure flag:" ($cookieHeader -match '(?i)(^|;)\s*Secure(?:;|$)')
```

**Tiêu chí đánh giá:**
- Nếu không có `Set-Cookie`, hoặc cookie không được trình duyệt gửi lại trên HTTP, kiểm tra tiếp cấu hình `Secure` và trace network. Không in token hoặc giá trị cookie vào log.

### Bước 2: Tái hiện bằng Playwright / Headless Browser
Sử dụng Playwright (đã có sẵn trong repo) để chạy một kịch bản browser thật, bắt toàn bộ console log và network request:

```typescript
// apps/storefront/e2e/debug-admin-login.spec.ts (tạm thời)
import { test, expect } from "@playwright/test"

test("debug admin login flow", async ({ page }) => {
  page.on("console", msg => console.log("PAGE LOG:", msg.type(), msg.text()))
  page.on("requestfailed", req => console.log("REQ FAILED:", req.url(), req.failure()?.errorText))
  page.on("response", res => {
    if (res.status() >= 400) {
      console.log("ERR RES:", res.status(), res.url())
    }
  })

  await page.goto("http://localhost:9000/app/login")
  await page.locator('input[type="email"]').fill(process.env.E2E_ADMIN_EMAIL!)
  await page.locator('input[type="password"]').fill(process.env.E2E_ADMIN_PASSWORD!)
  await page.locator('button[type="submit"]').click()

  // Chờ chuyển hướng hoặc kiểm tra URL
  await page.waitForTimeout(5000)
  console.log("Final URL:", page.url())
})
```

### Bước 3: Kiểm tra log của backend container
Xem log trực tiếp của service `backend` khi browser thực hiện login:
```powershell
docker compose logs backend --tail 50
```
Tìm các thông báo lỗi: `Invalid email or password`, `CORS error`, `Unauthorized`, hoặc `Cannot set headers`.

---

## 6. Phương Án Xử Lý & Khắc Phục (Remediation Plan)

### Giải pháp A: Sửa cấu hình Cookie cho môi trường Local Docker (Khuyên dùng)
Nếu xác nhận do cờ `Secure: true`:
1. Trong `docker-compose.yml`, cập nhật service `backend`:
   - Cấu hình `cookieOptions` trong `apps/backend/medusa-config.ts` để tắt `secure` chỉ khi chạy HTTP local. Lệnh `start` của backend ép `NODE_ENV=production`, nên đổi riêng biến này trong Compose không đủ.
   - Bổ sung cả `http://127.0.0.1:9000` vào `ADMIN_CORS` và `AUTH_CORS`:
     ```yaml
     ADMIN_CORS: ${ADMIN_CORS:-http://localhost:9000,http://127.0.0.1:9000}
     AUTH_CORS: ${AUTH_CORS:-http://localhost:8000,http://localhost:9000,http://127.0.0.1:9000,http://127.0.0.1:8000}
     ```
2. Khởi động lại backend:
   ```powershell
   docker compose up -d --force-recreate backend
   ```

### Giải pháp B: Đặt lại mật khẩu Admin qua CLI nếu có sai sót định dạng
Nếu mật khẩu chứa ký tự bị mã hóa sai giữa shell và web:
```powershell
docker compose exec backend npx medusa user -e "<admin-email>" -p "<new-random-password>"
```
Thử đăng nhập lại bằng mật khẩu mới này.

---

## 7. Tiêu Chí Nghiệm Thu (Acceptance Criteria)

- [ ] Truy cập `http://localhost:9000/app/login` trên trình duyệt (Chrome/Edge/Firefox).
- [ ] Nhập email và mật khẩu của Admin user.
- [ ] Bấm đăng nhập: Hệ thống chuyển hướng thành công vào `http://localhost:9000/app`.
- [ ] Không bị văng trở lại trang `/app/login`.
- [ ] Trang Dashboard hiển thị đầy đủ thông tin cửa hàng, danh mục sản phẩm và đơn hàng.
