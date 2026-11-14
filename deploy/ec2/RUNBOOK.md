# EC2 / Compose fallback runbook

Historical/recovery fallback only: use one cloud VM with Docker Engine, DNS A records for `STORE_DOMAIN` and `API_DOMAIN`, and firewall ingress 80/443 only. Set long random `POSTGRES_PASSWORD`, `JWT_SECRET`, and `COOKIE_SECRET` in a private root `.env`. Set `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` after seeding. This layout fits a university demo budget but the VM is a single point of failure; it is not a multi-zone availability design. Configure an external S3 bucket through Medusa's native file provider only if image uploads are needed.

The live domains now target the Fargate ALB. Use separate fallback hostnames or a separately planned DNS cutover; do not replace the current CNAMEs with an EC2 address as part of routine operation.

Run from the repository root on the VM:

```sh
cp deploy/ec2.env.template .env
chmod 600 .env
# Edit .env privately: fill independent random secrets and confirmed hostnames.
# Validate without printing the resolved configuration (which contains secrets).
docker compose -f docker-compose.yml -f deploy/compose.prod.yml config --quiet
docker compose -f docker-compose.yml -f deploy/compose.prod.yml up -d postgres redis
docker compose -f docker-compose.yml -f deploy/compose.prod.yml build backend
docker compose -f docker-compose.yml -f deploy/compose.prod.yml run --rm migrate
docker compose -f docker-compose.yml -f deploy/compose.prod.yml run --rm --no-deps -w /app/apps/backend/.medusa/server backend node ../../../../node_modules/@medusajs/cli/cli.js exec ./src/scripts/seed-commerce.js
docker compose -f docker-compose.yml -f deploy/compose.prod.yml run --rm --no-deps -w /app/apps/backend/.medusa/server backend node ../../../../node_modules/@medusajs/cli/cli.js exec ./src/scripts/print-storefront-key.js
# Replace pk_bootstrap in private .env with the printed browser-visible key.
docker compose -f docker-compose.yml -f deploy/compose.prod.yml --profile app up -d --build
```

Keep existing `.env` files: the copy command is for a new host only. Changing `POSTGRES_PASSWORD` does not rotate the password in an existing PostgreSQL volume. Generate URL-safe hexadecimal passwords to avoid reserved URL characters. The production override rejects empty secrets and restarts long-running services after Docker restarts. Migrations remain one-off operations.

This fallback deploys to EC2 in `ap-southeast-2`. The primary deployment is Fargate/RDS under `deploy/cloudformation`; see [the canonical runbook](../RUNBOOK.md). Check the selected Region in AWS Settings > View all projects > Overview > Additional Info > Region, and check plan/credit/spend status in AWS Settings > Billing before provisioning. PostgreSQL and Redis for this path run in Docker volumes on EC2; the retained RDS database is separate and must not be deleted or started as part of this bootstrap.

Before Caddy starts, point both public DNS names at the EC2 public IPv4 address, permit inbound TCP 80/443, and permit outbound certificate issuance and image pulls. Use an SSM-enabled instance for administration or restrict SSH to the operator's IP. Do not expose 8000/9000/5432/6379 in the security group. An EC2 stop/start can change its public address: recheck DNS or separately budget for an Elastic IP. Caddy obtains and renews certificates automatically; its data volume preserves certificate state. Keep Cloudflare DNS unproxied during initial certificate verification. Check for stale AAAA records if HTTPS fails over IPv6.

### Smoke test and evidence

Run on EC2 from the repository root, exporting only the public storefront key:

```sh
export NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_REPLACE_WITH_SEEDED_KEY
python3 scripts/smoke-ec2.py \
  --api https://api.135791112.xyz \
  --store https://135791112.xyz \
  --compose --output docs/report/evidence/ec2-smoke.json
docker compose -f docker-compose.yml -f deploy/compose.prod.yml ps
```

The script verifies certificate trust, HTTPS API/storefront health, non-empty regions/catalog, rendered `/vn`, PostgreSQL `SELECT 1`, Redis PING, backend/worker TCP access to both data services, and storefront-to-backend catalog access. Failed checks return a nonzero exit code. TCP checks prove reachability, not backend database authentication or worker job completion. The script creates no orders. Complete one manual COD checkout separately and record its order ID, browser result and relevant redacted error logs. Production disables the demo payment simulator.

To exercise the guest COD API flow on the approved seeded demo, run:

```sh
python3 scripts/smoke-checkout.py --api https://api.135791112.xyz \
  --create-demo-order --output docs/report/evidence/ec2-checkout.json
```

This creates one order and consumes one unit of demo inventory. It does not test browser interaction or charge money. The successful EC2 rehearsal on 2026-11-06, including JSON evidence and deployment fixes, is documented in [the weekly report](../../docs/report/aws-ec2-deployment-2026-11-06.md).

Record the commit, instance type, UTC start/stop times, each check result and any fixes in a dated report. Record EC2 runtime, EBS, public IPv4, transfer and other applicable costs separately. Cost Explorer totals are delayed and project-wide totals can include retained RDS/ECR/secrets/KMS from prior experiments; do not label those as this Compose test's cost. Include both estimates and later billed amounts with their time ranges. After testing, stop the instance if no longer needed; EBS, snapshots and any retained public addresses can continue to incur charges. Never use `docker compose down -v` as routine shutdown.

Create the admin user with `npx medusa user` in the backend container, record the publishable key in the private `.env`, and rebuild storefront. Check Medusa's `https://<API_DOMAIN>/health` endpoint, the storefront, and a test checkout using cash on delivery. The November 6 EC2 rehearsal verified HTTPS and one API COD order. The SSH GitHub Actions workflow and browser checkout remain unverified.

Before each release, back up PostgreSQL to encrypted offsite storage and test restoring into staging. Target hourly recovery points and a two-hour restore. Retain image digests and prior configuration so the app can roll back without rolling back a compatible database migration. Monitor HTTP 5xx, checkout errors, Redis/DB readiness, worker processing, and backup results. Do not expose PostgreSQL or Redis publicly; the base Compose file binds their host ports to loopback only.

For GitHub Actions deployment, prepare a clean clone at `/srv/commerce`, configure the private `.env` on the VM, and add environment secrets `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_KNOWN_HOSTS`, and `API_DOMAIN`. Protect the `production` environment with required reviewers. The manually triggered workflow checks out the reviewed commit, builds images, runs migrations, starts containers, and checks readiness. Rehearse rollback with a previous commit in staging; schema changes must be backward-compatible. This workflow has not been exercised against a cloud host yet.
