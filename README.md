# Medusa-inspired Commerce MVP

MVP thương mại điện tử theo kế hoạch `ke-hoach-clone-medusa.md`: modular monolith, Store API/Admin API, PostgreSQL transaction boundary, Redis/Search hạ tầng sẵn sàng, checkout idempotency, inventory locking và transactional outbox.

## Chạy local

```powershell
Copy-Item .env.example .env
npm install
docker compose up -d
npm run db:generate
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

API chạy tại `http://localhost:4000`. Health check: `GET /health`.

## Vertical slice API

1. `POST /store/auth/register` hoặc `/store/auth/login` nhận JWT.
2. `GET /store/products` lấy catalog; chọn `variants[0].id`.
3. `POST /store/carts` tạo cart.
4. `POST /store/carts/:id/items` thêm `{ variantId, quantity }`.
5. `POST /store/carts/:id/checkout` với `{ idempotencyKey: UUID }`.
6. `GET /store/orders` xem order; admin cập nhật bằng `/admin/orders/:id/status`.

Header cho protected endpoint: `Authorization: Bearer <token>`.

## Quyết định vòng đầu

- PostgreSQL là source of truth; giá/tên được snapshot vào order item.
- Checkout dùng transaction + `SELECT ... FOR UPDATE` cho inventory.
- Payment mock có unique `(provider, idempotencyKey)` để retry không tạo duplicate.
- `OutboxEvent` được ghi cùng transaction order; worker hiện là dispatcher tối giản và là điểm nối để thêm BullMQ/email provider.
- Search/Redis được đưa vào Compose để tích hợp ở vòng catalog tiếp theo; browse hiện fallback PostgreSQL.

## Roadmap tiếp theo

- apps/storefront và apps/admin bằng Next.js.
- Redis cache-aside, Meilisearch index worker, BullMQ/DLQ.
- OpenAPI, metrics/traces, Docker image, CI/CD, Terraform và k6.
