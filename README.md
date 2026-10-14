# Commerce MVP with Medusa v2

This repository uses Medusa v2.21.2 as the commerce backend, the Medusa Admin at `/app`, and a Next.js storefront built with the Medusa JS SDK. PostgreSQL stores commerce data. Redis supports Medusa's event bus, workflows, locks, and cache. External S3 storage can be configured through Medusa's native file provider when needed. There are no custom Medusa modules, API routes, workflows, payment providers, or subscribers in the current MVP.

## Current scope

- Customer registration and login, catalog, product detail, basic keyword search, cart, address and shipping selection, checkout, order history and order detail use the Medusa Store APIs.
- Checkout offers the built-in `pp_system_default` manual payment provider as **cash on delivery**. The storefront initializes its payment session and calls Medusa's cart completion API. Medusa owns order creation and inventory reservation. This records an order; it does not collect money or simulate payment success/failure.
- Medusa Admin handles products, inventory, orders, fulfillment, users, and built-in operational views. The seed script sets up one Vietnam/VND region, one sales channel, one warehouse, a manual shipping option, and three sample products.

Advanced search, a custom payment simulator and idempotency layer, automated customer notifications, custom reporting, staff-specific RBAC, custom metrics/tracing, and cloud load results are deferred. See the latest scope update at the end of [PLAN.md](PLAN.md). None of those features is required to run the current Medusa MVP.

## Local setup

Requires Node.js >=22.22, npm 11, and Docker Desktop/Engine. Use local example credentials only on your computer. Set long random `JWT_SECRET` and `COOKIE_SECRET` for any shared environment.

On Windows, run `. .\scripts\use-d-drive.ps1` in your PowerShell session before npm commands. This keeps npm cache and temporary files on `D:`.

1. Run `npm ci` at the repository root.
2. Copy `apps/backend/.env.template` to `apps/backend/.env`. Set the database password and secrets.
3. Run `docker compose up -d postgres redis`.
4. In `apps/backend`, run `npx medusa db:migrate` and `npm run seed` against the fresh database. Ensure `apps/backend/.env` has a `DATABASE_URL` matching Compose's `POSTGRES_PASSWORD`; the root `.env` is not loaded by commands run inside `apps/backend`.
5. In `apps/backend`, create an Admin user with `npx medusa user -e <email> -p <password>`.
6. Copy the publishable API key from Admin to `apps/storefront/.env.local` as `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=<key>`. Also set `NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000` and `MEDUSA_BACKEND_URL=http://localhost:9000` there.
7. Run `npm run dev` at the root. Open `http://localhost:8000/vn` for the storefront, `http://localhost:9000/app` for Admin, or `http://localhost:9000/health` for Medusa's built-in health endpoint.

For the containerized application, set the same values in a private root `.env`, migrate and seed with the backend image, then run `docker compose --profile app up --build`. The publishable key is included in the Next.js build, so rebuild the storefront when it changes. The API container runs `WORKER_MODE=server`; the worker container runs `WORKER_MODE=worker`.

`npm run start --workspace=@dtc/backend` starts the production build from `apps/backend/.medusa/server`. Set `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, and `COOKIE_SECRET` as process environment variables for this command; the source `apps/backend/.env` is not loaded from the build directory. Compose supplies these variables to its containers.

## Verification

```powershell
npm run lint --workspace=@dtc/backend
npm run lint --workspace=@dtc/storefront
npm run typecheck --workspace=@dtc/backend
npm run typecheck --workspace=@dtc/storefront
npm run build --workspace=@dtc/backend
$env:NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY="pk_ci_build_placeholder"
$env:NEXT_PUBLIC_MEDUSA_BACKEND_URL="http://localhost:9000"
npm run build --workspace=@dtc/storefront
docker compose config --quiet
```

With the backend running and a publishable key copied from Admin, run a real Store API smoke checkout (this creates a test order):

```powershell
$env:PUBLISHABLE_KEY="<publishable-key-from-admin>"
.\scripts\smoke-checkout.ps1 -RegisterCustomer
docker compose exec -T postgres psql -U commerce -d commerce -Atc 'select ii.sku, il.stocked_quantity, il.reserved_quantity from inventory_item ii join inventory_level il on il.inventory_item_id=ii.id where ii.sku=''TEE-ESSENTIAL-BLK'''
```

The script registers and logs in a test customer, searches for a seeded product, completes one COD order, and confirms that order appears in customer history. It creates real test data each time. Also walk through checkout in the browser and check inventory in Admin. On this Windows host, another Python service currently occupies IPv4 `127.0.0.1:8000`; Next.js is reachable through `http://[::1]:8000/vn` while that service remains. The k6 scripts in `load/` are for staging; their targets are proposals, not measured results.

## Deployment and limitations

`deploy/` contains a single-VM Compose/Caddy example and a runbook. Use TLS, private DB/Redis ports, secure secrets, PostgreSQL backups, and a staging checkout smoke test before exposing it publicly. Medusa's `/health` endpoint is a process health probe; it is not a full dependency-readiness check. Local migration, seed, registration/login, Store API checkout, order history, inventory reservation, duplicate completion retry, insufficient-stock rejection, backend restart, production backend checkout, and storefront product pages were verified on 15 October 2026. Browser checkout, Docker application images, load testing, and cloud deployment remain unverified.
