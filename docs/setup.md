# Local development setup

This guide starts a developer environment, not the AWS demo. Read the [specification](README.md) and [contribution rules](../CONTRIBUTING.md). Node >=22.22.0, npm 11 and Docker Compose v2 are required. The root packageManager/lockfile are authoritative. On Windows use equivalent PowerShell commands; the optional `scripts/use-d-drive.ps1` only adjusts developer cache paths.

## 1. Install and configure

From the repository root:

```sh
npm ci
cp .env.example .env
cp apps/backend/.env.template apps/backend/.env
```

Edit the private files locally. Use matching PostgreSQL credentials in root `POSTGRES_PASSWORD` and backend `DATABASE_URL`; for a host-run backend, host is localhost:5432. Set independent JWT/COOKIE secrets. Set backend `REDIS_URL=redis://localhost:6379`, appropriate localhost CORS and the documented local cookie setting. Never print resolved configuration or commit environment files. Changing an environment password does not change the password in an existing database volume.

## 2. Prepare a NEW local database

```sh
docker compose up -d postgres redis
docker compose ps
cd apps/backend
npm exec -- medusa db:migrate
npm run seed
# Create your own local administrator; substitute private values locally:
npm exec -- medusa user -e '<your-local-admin-email>' -p '<your-local-password>'
cd ../..
```

These commands write to the database selected by the backend environment. Verify it is a local disposable/developer database before running. Existing data must not be dropped or reseeded as a troubleshooting shortcut. The seed synchronizes providers and skips catalog creation when Vietnam exists; it is not an idempotent DAYMARK catalog importer. There is no shared default admin login. CLI passwords may appear in local process arguments/history; use an isolated developer credential and keep it out of shared logs. Cloud administrator onboarding needs a separate approved secret-safe operator procedure.

## 3. Start applications

```sh
npm run backend:dev
# In a second terminal:
npm run storefront:dev
```

Before starting storefront, create private `apps/storefront/.env.local` with `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` from the Storefront publishable key in Medusa Admin, `NEXT_PUBLIC_MEDUSA_BACKEND_URL=http://localhost:9000`, `MEDUSA_BACKEND_URL=http://localhost:9000` and `NEXT_PUBLIC_BASE_URL=http://localhost:8000`. This publishable key is browser-visible; an admin/secret API key is not a substitute. Restart storefront after changing build/runtime inputs.

| Surface | Default URL |
| --- | --- |
| Storefront | http://localhost:8000/vn/store |
| Admin | http://localhost:9000/app |
| Backend health | http://localhost:9000/health |

For the complete containerized path use `docker compose --profile app up --build` only after inspecting its migration/seed behavior and environment. The local and AWS databases are separate. Recommendations remain gated unless you deliberately prepare and validate their isolated fixtures; see the [research reference index](reference/README.md).

## 4. Validate changes

```sh
npm run docs:check
npm run todo
npm run lint --workspace=@dtc/backend
npm run typecheck --workspace=@dtc/backend
npm run typecheck --workspace=@dtc/storefront
npm run test:unit --workspace=@dtc/backend
# With isolated test PostgreSQL/Redis and explicit test environment:
npm run test:integration:http --workspace=@dtc/backend
# With isolated backend, frontend and prepared fixtures:
npm run test:e2e --workspace=@dtc/storefront
```

Use the test scripts' expected TEST_TYPE/environment instead of pointing an integration suite at a shared database. See [acceptance strategy](spec/05-testing.md) for k6 and recovery exercises. A source-only docs change does not require cloud deployment.

Presentation commands are documented in [presentation/README.md](../presentation/README.md). Shutdown with Ctrl+C for host apps and `docker compose stop postgres redis` to keep local volumes. AWS lifecycle commands belong to [deploy/RUNBOOK.md](../deploy/RUNBOOK.md), not local Compose.
