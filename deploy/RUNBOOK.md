# Single-VM demo deployment

Use one cloud VM with Docker Engine, DNS A records for `STORE_DOMAIN`, `API_DOMAIN`, and `MEDIA_DOMAIN`, and firewall ingress 80/443 only. Set long random `POSTGRES_PASSWORD`, `JWT_SECRET`, `COOKIE_SECRET`, `MINIO_ROOT_USER`, and `MINIO_ROOT_PASSWORD` in a private root `.env`. Set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` after seeding. This layout fits a university demo budget but the VM is a single point of failure; it is not a multi-zone availability design.

Run from the repository root on the VM:

```sh
docker compose -f docker-compose.yml -f deploy/compose.prod.yml up -d postgres redis minio minio-init
docker compose -f docker-compose.yml -f deploy/compose.prod.yml build backend
docker compose -f docker-compose.yml -f deploy/compose.prod.yml run --rm -w /app/apps/backend backend npx medusa db:migrate
docker compose -f docker-compose.yml -f deploy/compose.prod.yml run --rm -w /app/apps/backend backend npm run seed
docker compose -f docker-compose.yml -f deploy/compose.prod.yml --profile app up -d --build
```

Create the admin user with `npx medusa user` in the backend container, record the publishable key in the private `.env`, and rebuild storefront. Check Medusa's `https://<API_DOMAIN>/health` endpoint, the storefront, and a test checkout using cash on delivery. The container configuration and workflow have not yet passed a live deployment; rehearse in staging before production.

Before each release, back up PostgreSQL to encrypted offsite storage and test restoring into staging. Target hourly recovery points and a two-hour restore. Retain image digests and prior configuration so the app can roll back without rolling back a compatible database migration. Monitor HTTP 5xx, checkout errors, Redis/DB readiness, worker processing, and backup results. Do not expose MinIO admin console, PostgreSQL, or Redis publicly; the base Compose file binds their host ports to loopback only.

For GitHub Actions deployment, prepare a clean clone at `/srv/commerce`, configure the private `.env` on the VM, and add environment secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, and `API_DOMAIN`. Protect the `production` environment with required reviewers. The manually triggered workflow checks out the reviewed commit, builds images, runs migrations, starts containers, and checks readiness. Rehearse rollback with a previous commit in staging; schema changes must be backward-compatible. This workflow has not been exercised against a cloud host yet.
