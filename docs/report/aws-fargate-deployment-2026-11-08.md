# AWS Fargate deployment — 2026-11-08–09

## Status

Deployment completed and publicly verified on November 9. The storefront, API and worker each have one running ECS task; both ALB target groups are healthy. Foundation is `CREATE_COMPLETE`; data and application stacks are `UPDATE_COMPLETE`. RDS is available, Redis is running, and the separate EC2 Compose demo is stopped. [Runtime inventory](evidence/fargate-2026-11-08/runtime.json).

The compute lease expires at **2026-11-09 05:48:55 UTC**, or **12:48:55 Vietnam time**. Both normal watchdogs returned `leased`. The alert email subscription is still `PendingConfirmation`; confirm the AWS email before relying on notifications.

- Storefront: https://135791112.xyz/vn/store
- API health: https://api.135791112.xyz/health
- Admin frontend: https://api.135791112.xyz/app/

Region: `ap-southeast-2`. Profile: `aws-project`. Deployment source: `main` at `f4845ba6e240288c2ed7dbe8d3156ac5cbfc7f12` plus local deployment changes; those changes have not been committed or pushed by this deployment.

## Retained-resource recovery

The original `commerce-data` stack was in `ROLLBACK_FAILED` after AWS denied CloudFront creation. Its retained PostgreSQL database, image bucket, three secrets, KMS key and database subnet group were preserved. An available RDS backup dated November 8 was confirmed before recovery; no restore test was performed.

The failed stack metadata was removed while retaining the subnet group. The first resource import failed because CloudFormation cannot modify a stopped RDS instance. The independent recovery guard was updated with a four-hour `RecoveryDeadline`, verified to return `recovery-window`, and RDS was started. A second change set imported all seven resources, with no resource replacements or deletions. Post-import drift detection reported `IN_SYNC`, with zero drifted resources. [Retained resource identifiers](evidence/fargate-2026-11-08/retained-resources.json).

The normal data template was then applied without replacements or deletions. It restored Redis, the shared session lease, shutdown watchdog, alerts and budget. The lease was armed for four hours; the normal watchdog returned `leased`. Only then was `commerce-retained-guard` removed. Redis startup and PING were verified through SSM. The separate EC2 Compose demo remains stopped and was not modified.

## Image delivery validation

The backend image is `695496430984.dkr.ecr.ap-southeast-2.amazonaws.com/commerce-foundation-backendrepository-5whzaxxdofo6@sha256:ed6f80dcbad1b94d1653bdc850e4a787eda9e98f3a4391d5363bf57e0623e55f`.

A one-off Fargate task used the actual Medusa file module to upload a 68-byte PNG and read it back. It used the task IAM role, the configured private bucket, ACL-disabled uploads and the `public-images/` prefix. The returned URL used the backend proxy. No static S3 keys were supplied.

Checks used the normal API hostname and verified TLS through a curl connection override to the ALB, because public DNS had not yet been changed. These checks therefore prove ALB/backend behavior, not public DNS cutover.

| Check | Result |
| --- | --- |
| HTTPS API health | 200 |
| Existing product catalog with its existing publishable key | 200 |
| Image download without an API-key header | 200; exact SHA-256 and byte count |
| Image response headers | `image/png`, `nosniff`, one-hour public caching |
| Private prefix | 404 |
| SVG file | 404 |
| Missing public image | 404 |
| Direct unsigned S3 access to the uploaded image | 403 |

[Image proxy evidence](evidence/fargate-2026-11-08/image-proxy.json). Only the probe object's exact versions were removed afterward; the evidence URL now refers to a deleted test fixture.

## Final public verification — November 9

After the initial lease expired overnight, RDS and Redis were observed stopped. They were started under a new four-hour lease. Migrations passed without reseeding the existing database, and all three ECS services reached steady state. The storefront image is `695496430984.dkr.ecr.ap-southeast-2.amazonaws.com/commerce-foundation-storefrontrepository-tvt82ngmbqnk@sha256:47d9ad93d8102e0cee50af8cc2130391723a868f7ecb7f1add515a08bf9acb95`.

The operator updated Cloudflare DNS. Public DNS now resolves both domains to the ALB. A fresh Fargate file-module upload/read test passed, followed by **14/14 public checks**: API health, existing catalog, exact image bytes without a key, private-prefix/SVG/missing-image rejection, unsigned S3 denial, storefront health, homepage, rendered catalog containing the seeded product, product details, admin frontend, and HTTP-to-HTTPS redirects for both domains.

These checks used public domain names and certificate verification, with Cloudflare DNS-over-HTTPS to avoid stale local Tailscale DNS caching; no ALB IP override was used. The test image's exact object versions were removed. No one-off tasks remain running. [Public verification evidence](evidence/fargate-2026-11-08/public-verification.json).

## DNS cutover

The operator replaced the old A records with these DNS-only Cloudflare CNAME records. Certificate-validation records remain unchanged. Cloudflare flattens the apex CNAME into ALB addresses.

| Type | Name | Target | Proxy | TTL |
| --- | --- | --- | --- | --- |
| CNAME | `@` | `commer-LoadB-LHsjuX6kf2rT-784109190.ap-southeast-2.elb.amazonaws.com` | DNS only | Auto |
| CNAME | `api` | `commer-LoadB-LHsjuX6kf2rT-784109190.ap-southeast-2.elb.amazonaws.com` | DNS only | Auto |

## Validation and limits

Backend lint and type checks passed. The 18 proxy tests and 27 deployment tests passed. CloudFormation lint and project security rules passed for the changed templates. Both Docker builds passed; the storefront build reported existing lint warnings.

The existing database was not reseeded. This deployment has not exercised browser checkout, a background business job, load-driven autoscaling, failover or backup restore. Single-AZ RDS and the single Redis host remain failure points. The image proxy consumes API/ALB capacity and has no edge CDN cache. Private documents must not be stored in the public image prefix.

The session watchdog stops compute after lease expiry; it is not a spending cap. The ALB and retained storage/secrets/key remain billable after compute stops. Use the documented pause/hibernate workflow after the demo, and verify resource states.

After the successful public checks and runtime capture, an optional task-definition audit encountered `ExpiredTokenException` in the operator's local AWS session. Renew that login before further management commands. No infrastructure changes were attempted after that error; the running services use their own ECS IAM roles and the verified watchdogs remain active.

## Subsequent release

The 9 November latest-main deployment is recorded in [a separate report](aws-redeployment-main389e855-2026-11-09.md); the evidence above describes the original deployment.
