# Kế hoạch Frontend — Enterprise E-commerce Platform

## 1. Đề xuất công nghệ

### Stack chính

- **Next.js 15+** với App Router
- **React 19**
- **TypeScript**
- **Tailwind CSS**
- **TanStack Query** cho server state, caching và loading/error state
- **Zod** cho validate form phía client
- **Lucide React** cho icon

### Vì sao chọn stack này?

- Next.js phù hợp với storefront thương mại điện tử và có routing rõ ràng.
- TypeScript giúp đồng bộ contract với Backend API.
- Tailwind giúp dựng giao diện nhanh, không cần thiết kế phức tạp.
- TanStack Query phù hợp với catalog, cart và order data lấy từ Fastify API.
- Có thể deploy frontend độc lập với backend.

### Không đưa vào MVP

- Redux hoặc state management lớn
- UI component library phức tạp
- SSR/SEO nâng cao cho toàn bộ màn hình
- Thanh toán thật
- Upload ảnh sản phẩm từ frontend
- Dashboard biểu đồ nâng cao

## 2. Phạm vi MVP

Frontend gồm hai khu vực:

```text
Storefront                     Admin
├─ Trang chủ                   ├─ Đăng nhập admin
├─ Danh sách sản phẩm           ├─ Danh sách đơn hàng
├─ Tìm kiếm sản phẩm            └─ Cập nhật trạng thái đơn hàng
├─ Chi tiết sản phẩm
├─ Đăng ký / đăng nhập
├─ Giỏ hàng
├─ Checkout mock payment
└─ Theo dõi đơn hàng
```

Mục tiêu là demo được flow:

```text
Register/Login
→ Browse/Search Product
→ Add to Cart
→ Checkout
→ Order Created
→ View Order Status
```

## 3. Các route cần triển khai

### Storefront

| Route | Mục đích | Auth |
|---|---|---:|
| `/` | Hero, sản phẩm nổi bật, link catalog | Không |
| `/products` | Danh sách, tìm kiếm, lọc category | Không |
| `/products/[id]` | Chi tiết sản phẩm, chọn variant, thêm cart | Không |
| `/login` | Đăng nhập customer | Không |
| `/register` | Đăng ký customer | Không |
| `/cart` | Danh sách cart items và tổng tiền | Có |
| `/checkout` | Xác nhận checkout | Có |
| `/orders` | Danh sách order của customer | Có |
| `/orders/[id]` | Chi tiết order và status history | Có |

### Admin

| Route | Mục đích | Auth |
|---|---|---:|
| `/admin/login` | Đăng nhập staff/admin | Không |
| `/admin/orders` | Xem danh sách order | Staff/Admin |
| `/admin/orders/[id]` | Xem và đổi trạng thái order | Staff/Admin |

## 4. Design đơn giản

### Visual direction

- Nền: `#f8fafc`
- Text chính: `#0f172a`
- Primary: `#2563eb`
- Success: `#16a34a`
- Danger: `#dc2626`
- Border radius: `12px`
- Container tối đa: `1200px`
- Font: Inter hoặc system font

### Component dùng chung

```text
components/
├─ layout/
│  ├─ StoreHeader
│  ├─ AdminSidebar
│  └─ Footer
├─ ui/
│  ├─ Button
│  ├─ Input
│  ├─ Select
│  ├─ Badge
│  ├─ Modal
│  ├─ Spinner
│  └─ EmptyState
├─ product/
│  ├─ ProductCard
│  ├─ ProductGrid
│  └─ ProductPrice
├─ cart/
│  ├─ CartItemRow
│  └─ CartSummary
└─ order/
   ├─ OrderStatusBadge
   └─ OrderTimeline
```

## 5. API integration

Backend mặc định chạy tại `http://localhost:4000`.

Tạo biến môi trường:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### API client

Tạo một API client dùng chung:

```text
lib/api-client.ts
```

Client cần:

- Tự gắn `Authorization: Bearer <token>` cho protected request.
- Parse response dạng `{ data, request_id }`.
- Chuẩn hóa error dạng `{ error: { code, message, request_id } }`.
- Không log password, token hoặc thông tin nhạy cảm.

### Mapping API

| Frontend action | Backend endpoint |
|---|---|
| Register | `POST /store/auth/register` |
| Login | `POST /store/auth/login` |
| Browse products | `GET /store/products` |
| Search products | `GET /store/products?q=` |
| Product detail | `GET /store/products/:id` |
| Create cart | `POST /store/carts` |
| Get cart | `GET /store/carts/:id` |
| Add cart item | `POST /store/carts/:id/items` |
| Checkout | `POST /store/carts/:id/checkout` |
| Customer orders | `GET /store/orders` |
| Order detail | `GET /store/orders/:id` |
| Admin orders | `GET /admin/orders` |
| Update order status | `PATCH /admin/orders/:id/status` |

## 6. Authentication state

MVP dùng JWT trả về từ Backend.

- Lưu token ở client storage cho demo local.
- Tạo `AuthProvider` hoặc `useAuth` hook.
- Khi chưa đăng nhập, redirect `/cart`, `/checkout`, `/orders` về `/login`.
- Khi đăng nhập customer, lưu `user` và `token`.
- Khi logout, xóa token và cart id local.
- Admin route phải kiểm tra role `STAFF` hoặc `ADMIN`.

> Nếu triển khai production, chuyển token sang HttpOnly Secure cookie thay vì localStorage.

## 7. State và data flow

### Server state

TanStack Query quản lý:

- Product list
- Product detail
- Cart detail
- Customer orders
- Admin orders

### Client state

React state hoặc Context cho:

- Auth token/user
- Cart id
- Search input
- Selected product variant
- Checkout form state

### Cache invalidation

Sau khi thêm cart item:

```text
invalidate cart query
```

Sau khi checkout thành công:

```text
invalidate cart query
invalidate orders query
redirect /orders/[id]
```

## 8. Kế hoạch triển khai theo giai đoạn

### Phase 1 — Frontend foundation

- Tạo `apps/storefront` bằng Next.js + TypeScript.
- Cài Tailwind, TanStack Query, Zod, Lucide.
- Tạo layout, theme, API client.
- Thêm `.env.example`.
- Tạo loading, error và empty state dùng chung.

**Kết quả:** app mở được tại `http://localhost:3000`.

### Phase 2 — Catalog

- Trang chủ.
- Product listing.
- Search query.
- Category filter.
- Product card.
- Product detail.
- Hiển thị giá và tồn kho.

**Kết quả:** user có thể xem và tìm sản phẩm.

### Phase 3 — Auth và cart

- Register.
- Login.
- Logout.
- Auth guard.
- Create cart sau login.
- Add item.
- Cart summary.

**Kết quả:** user có thể đăng nhập và quản lý giỏ hàng.

### Phase 4 — Checkout và order tracking

- Checkout page.
- Tạo UUID idempotency key.
- Gọi checkout API.
- Hiển thị success/error.
- Orders list.
- Order detail.
- Status timeline.

**Kết quả:** hoàn thành customer vertical slice.

### Phase 5 — Admin tối giản

- Admin login.
- Orders table.
- Order detail.
- Status select.
- Cập nhật status.
- Success/error feedback.

**Kết quả:** admin có thể xử lý order cơ bản.

### Phase 6 — QA và polish

- Responsive mobile/tablet/desktop.
- Form validation.
- Loading skeleton.
- Error boundary.
- Empty state.
- Accessibility cơ bản.
- E2E test cho happy path.
- Build production.

## 9. Cấu trúc thư mục đề xuất

```text
apps/storefront/
├─ app/
│  ├─ page.tsx
│  ├─ products/
│  │  ├─ page.tsx
│  │  └─ [id]/page.tsx
│  ├─ login/page.tsx
│  ├─ register/page.tsx
│  ├─ cart/page.tsx
│  ├─ checkout/page.tsx
│  ├─ orders/
│  │  ├─ page.tsx
│  │  └─ [id]/page.tsx
│  └─ admin/
│     ├─ login/page.tsx
│     └─ orders/
│        ├─ page.tsx
│        └─ [id]/page.tsx
├─ components/
├─ lib/
│  ├─ api-client.ts
│  ├─ auth.ts
│  └─ types.ts
├─ providers/
├─ public/
├─ .env.example
├─ next.config.ts
├─ package.json
└─ tsconfig.json
```

## 10. Definition of Done

- [ ] Storefront chạy tại port `3000`.
- [ ] Hiển thị danh sách và chi tiết sản phẩm.
- [ ] Search sản phẩm hoạt động.
- [ ] Register/login hoạt động.
- [ ] Add item vào cart hoạt động.
- [ ] Checkout gọi đúng API.
- [ ] Retry checkout không tạo duplicate order.
- [ ] Customer xem được order và status history.
- [ ] Admin xem và đổi status order.
- [ ] Có loading/error/empty state.
- [ ] Responsive trên mobile và desktop.
- [ ] `npm run build` pass.
- [ ] Có ít nhất một E2E test cho flow chính.

## 11. Lệnh chạy dự kiến

Từ root repository:

```powershell
npm install
npm run dev
```

Hoặc chạy riêng frontend:

```powershell
npm run dev --workspace=@commerce/storefront
```

Backend vẫn chạy tại `http://localhost:4000`, frontend tại `http://localhost:3000`.
