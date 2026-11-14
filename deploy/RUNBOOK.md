# AWS Fargate deployment and operations

The primary course deployment is **ALB/ACM → ECS Fargate storefront, Medusa API/admin and worker → private RDS PostgreSQL and Redis on EC2**, with private S3 product images streamed through the backend proxy. CloudFormation owns the infrastructure. All regional resources use `ap-southeast-2`; the local AWS profile is `aws-project`.

The full stack passed 14 public checks on November 9, 2026. That is dated verification evidence, not a promise that a timed demo is currently running. See the [architecture decision](../docs/architecture/adr/0001-aws-cloud-stack.md), [architecture](../docs/architecture/cloud-system-architecture.md), and [deployment report](../docs/report/aws-fargate-deployment-2026-11-08.md).

## Before operating

Run commands from the repository root. Confirm the selected Region in AWS Settings > View all projects > Overview > Additional Info > Region, and check plan, credit and spend status in AWS Settings > Billing. Renew the operator login with `aws login --profile aws-project` if credentials have expired.

Keep deployment inputs in ignored `deploy/cloudformation/settings.json`, based on [settings.example.json](cloudformation/settings.example.json). It holds hostnames, image digests and the browser-visible publishable key, never passwords or AWS keys. Preserve the existing stack prefix, database, bucket and secrets. Do not copy example placeholders over existing settings.

```sh
python3 deploy/cloudformation/manage.py status
```

## Start or extend a demo

```sh
python3 deploy/cloudformation/manage.py start --hours 4
python3 deploy/cloudformation/manage.py status
python3 deploy/cloudformation/manage.py renew --hours 4
```

`start` renews the bounded lease, starts/checks RDS and Redis, drains application tasks, runs a migration task and then starts the enabled ECS services. It deliberately interrupts application traffic; it is not a zero-downtime release command. It refuses startup while a retained-database recovery guard exists. `renew` extends an existing session; it does not start stopped services. Supported session duration is greater than zero and at most twelve hours for startup.

Both watchdogs check the lease every five minutes and request compute shutdown after expiry. Verify the stopped states afterward. A lease is best-effort automation, not a hard spending cap. Confirm the SNS alert email subscription before relying on failure notifications.

## Publish and release

The [AWS image workflow](../.github/workflows/aws-images.yml) builds immutable ECR images using the scoped GitHub OIDC publishing role. It does not deploy infrastructure or read application secrets. This workflow is configured; the recorded deployment used local Docker builds and AWS CLI operations, so GitHub Actions publishing is not yet proven by the live report.

Update `BackendImage` / `StorefrontImage` in local settings with immutable digests. The storefront build must use the real publishable key and `https://api.135791112.xyz`. Review the changes before executing them:

```sh
python3 deploy/cloudformation/manage.py pause
python3 deploy/cloudformation/manage.py plan app
python3 deploy/cloudformation/manage.py apply '<reviewed-change-set-ARN>'
python3 deploy/cloudformation/manage.py start --hours 4
```

App plans stage services at zero; `start` performs migrations before traffic. Keep prior image digests for application rollback and use backward-compatible migrations. Do not automatically roll back database migrations, reseed an existing dataset, replace retained resources or delete volumes to resolve a deployment failure. The [detailed AWS guide](cloudformation/README.md) covers first-time foundation/data bootstrap, seeding a new database, image publishing, backup requirements and retained-resource recovery.

## DNS and verification

Cloudflare `@` and `api` are DNS-only CNAMEs targeting the app stack's `LoadBalancerDns` output; Cloudflare flattens the apex record. ACM terminates HTTPS at the ALB. Preserve ACM validation records. The ALB hostname changes if the app stack is recreated after hibernation; update both CNAME targets from the new output, rather than hardcoding an EC2 IP or an old ALB address.

Check API and storefront HTTPS health, rendered catalog/product pages and admin assets. Verify an uploaded raster image through `/product-images/public-images/<key>` without API-key headers, while direct unsigned S3 access remains denied. Public/private-prefix, missing-image and non-image cases need separate checks. RDS and Redis ingress must remain restricted to the application security group. Health endpoints alone do not verify checkout, background jobs, restore or capacity.

Record the revision plus local changes, immutable images, UTC verification time and sanitized results in `docs/report/`. The [November 8–9 evidence](../docs/report/evidence/fargate-2026-11-08/) records public checks, runtime and retained-resource recovery. Never store secret values or connection strings in evidence.

## Pause and hibernate

```sh
python3 deploy/cloudformation/manage.py pause
python3 deploy/cloudformation/manage.py status
# Remove app infrastructure only when the demo no longer needs to stay available:
python3 deploy/cloudformation/manage.py hibernate
```

`pause` drains ECS and requests RDS/Redis stops; the ALB remains provisioned and billable. `hibernate` pauses, then deletes only the app stack, including the ALB. Data, S3, ECR, secrets, encryption key and the persistent data watchdog remain. Storage and other retained services still incur charges. Verify states and check actual billing separately from historical cost models. Never delete foundation/data stacks as a routine shutdown.

## Local development and EC2 fallback

[Docker Compose](../docker-compose.yml) remains the local development layout. The [EC2 fallback runbook](ec2/RUNBOOK.md), [bootstrap](ec2/README.md), and [November 6 report](../docs/report/aws-ec2-deployment-2026-11-06.md) preserve the successful single-VM rehearsal. Its PostgreSQL data is separate from RDS. Caddy and the [fallback SSH workflow](../.github/workflows/deploy.yml) belong to that path, not the primary Fargate deployment. Do not restart, remove or repoint the fallback resources merely to operate the primary stack.
