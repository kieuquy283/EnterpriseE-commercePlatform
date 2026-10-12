# Enterprise E-commerce Platform

Medusa-inspired commerce MVP theo kiến trúc modular monolith và event-driven worker.

## Công nghệ

- Node.js 20+ và TypeScript
- Fastify 5, Prisma ORM
- PostgreSQL 16, Redis 7, Meilisearch
- Docker Compose, JWT, Argon2

## Yêu cầu

Cài đặt Git, Node.js 20+, npm và Docker Desktop.

```powershell
node --version
npm --version
docker --version
```

## Clone project

```powershell
git clone https://github.com/kieuquy283/EnterpriseE-commercePlatform.git
cd EnterpriseE-commercePlatform
git checkout master
```

## Cài đặt

```powershell
npm install
Copy-Item .env.example .env
Copy-Item apps/api/.env.example apps/api/.env
```

File `.env` local mặc định:

```env
DATABASE_URL=postgresql://commerce:commerce@localhost:5432/commerce?schema=public
REDIS_URL=redis://localhost:6379
PORT=4000
JWT_SECRET=change-me-in-development
COOKIE_SECRET=change-me-too
```

Không commit `.env` hoặc secret thật lên repository.

## Khởi động Docker

```powershell
docker compose up -d
docker ps
```

Nếu Windows báo lỗi quyền với `dockerDesktopLinuxEngine`, dùng:

```powershell
$env:DOCKER_HOST="npipe:////./pipe/docker_engine"
docker compose up -d
```

Services:

- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- Meilisearch: `http://localhost:7700`

## Khởi tạo database

```powershell
npm run db:generate --workspace=@commerce/api
npm run db:migrate --workspace=@commerce/api -- --name init
npm run db:seed --workspace=@commerce/api
```

Seed tạo 3 sản phẩm mẫu: áo thun, túi canvas và bình giữ nhiệt.

## Chạy app

```powershell
npm run dev
```

API chạy tại `http://localhost:4000`.

```powershell
Invoke-RestMethod http://localhost:4000/health
Invoke-RestMethod http://localhost:4000/store/products
```

Build production:

```powershell
npm run build
node apps/api/dist/main.js
```

## API chính

Public:

```text
POST /store/auth/register
POST /store/auth/login
GET  /store/products
GET  /store/products/:id
```

Customer API yêu cầu header `Authorization: Bearer <JWT_TOKEN>`:

```text
POST /store/carts
GET  /store/carts/:id
POST /store/carts/:id/items
POST /store/carts/:id/checkout
GET  /store/orders
GET  /store/orders/:id
```

Admin API:

```text
GET   /admin/orders
PATCH /admin/orders/:id/status
```

## Test nhanh vertical slice

1. Đăng ký hoặc đăng nhập để lấy JWT.
2. Gọi `GET /store/products`, lấy `variants[0].id`.
3. Gọi `POST /store/carts` để tạo cart.
4. Gọi `POST /store/carts/:id/items` với:

```json
{"variantId":"<VARIANT_ID>","quantity":1}
```

5. Gọi `POST /store/carts/:id/checkout` với:

```json
{"idempotencyKey":"<UUID>"}
```

Retry cùng idempotency key sẽ không tạo duplicate payment/order.

## Scripts

```powershell
npm run dev          # Development server
npm run build        # Build TypeScript
npm run typecheck    # Type checking
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Run migration
npm run db:seed      # Seed sample data
```

## Troubleshooting

Kiểm tra PostgreSQL:

```powershell
docker compose ps
docker compose logs postgres
```

Nếu port `4000` bị chiếm, đổi `PORT` trong `.env`.

Reset database local, dữ liệu volume sẽ bị xóa:

```powershell
docker compose down -v
docker compose up -d
npm run db:migrate --workspace=@commerce/api -- --name init
npm run db:seed --workspace=@commerce/api
```

## Cấu trúc

```text
apps/api/
├─ prisma/schema.prisma
├─ prisma/seed.ts
└─ src/main.ts
docker-compose.yml
ke-hoach-clone-medusa.md
```

Đã triển khai authentication, catalog, cart, checkout transaction, mock payment, idempotency, inventory reservation, order status history, outbox dispatcher và Docker services. Storefront UI/Admin UI, cache, search worker, CI/CD, Terraform và load test là các bước tiếp theo.
