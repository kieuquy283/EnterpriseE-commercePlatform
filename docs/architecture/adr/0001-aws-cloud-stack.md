# ADR: AWS cloud deployment for the course

- Status: accepted on November 8, 2026; publicly verified on November 9.
- Supersedes: the primary-deployment role of ADR-05 (single VM and Caddy). The EC2 rehearsal remains valid historical evidence and a fallback.
- Scope: cloud deployment, image delivery and operations. Medusa remains one modular commerce application, with API and worker as separate processes.

## Decision

Use AWS CloudFormation in `ap-southeast-2` for three layers:

| Layer | Responsibility |
| --- | --- |
| Foundation | VPC/subnets/security groups, ECR image repositories, ACM certificate and optional scoped GitHub publishing role |
| Data | Private Single-AZ RDS PostgreSQL, Redis on a dedicated EC2 host, private encrypted/versioned S3, secrets, lease, watchdog and alerts |
| Application | Internet-facing ALB with ACM HTTPS and hostname routing, separate Fargate storefront/API/worker services, API scaling capped at two tasks, CloudWatch and app watchdog |

Product images are delivered from private S3 through the backend's public `/product-images/public-images/<key>` proxy using the ECS task role. CloudFront was removed from the implementation because AWS project verification denied distribution creation. New image uploads use a dedicated public-image prefix; private customer documents must use a separate storage boundary. No edge CDN is currently deployed.

## Rationale and limits

The course needs a concrete demonstration of cloud networking, managed data services, independent process deployment, declarative infrastructure, health routing, scaling configuration and operational controls. This is the chosen baseline even though the tested single-EC2 Compose setup is simpler and cheaper.

This design is not fully highly available: RDS is Single-AZ and Redis is one host. Configured API scaling is not evidence of capacity or measured scaling performance. Redis transport is not TLS-encrypted inside its restricted security-group boundary. Image traffic consumes API/ALB capacity. Backups, restore drills, worker business jobs, browser checkout, release rollback and load tests need their own evidence.

Demo compute uses a bounded lease with best-effort scheduled shutdown. ALB and retained storage/secrets remain billable after a pause. Hibernation removes only the app stack; retained data must not be deleted as routine cleanup.

## Evidence and chronology

The [November 6 EC2 report](../../report/aws-ec2-deployment-2026-11-06.md) records 12 smoke checks, nine external checks and one COD API order on the former single-VM path. It is not evidence of a Fargate checkout.

The [November 8–9 AWS report](../../report/aws-fargate-deployment-2026-11-08.md) records retained-resource import without replacements, three ECS services, healthy ALB targets and 14 public checks including private-S3 proxy delivery. Deployment used local Docker builds and AWS CLI operations. GitHub publishing and the fallback SSH workflow are configured but were not exercised by that report.

## Operational references

- [Canonical runbook](../../../deploy/RUNBOOK.md)
- [Detailed CloudFormation guide](../../../deploy/cloudformation/README.md)
- [System architecture](../cloud-system-architecture.md)
- [EC2 fallback runbook](../../../deploy/ec2/RUNBOOK.md)
