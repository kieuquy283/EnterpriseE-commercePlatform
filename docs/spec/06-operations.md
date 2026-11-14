# Operations, security and delivery

Status: target operating contract, 14 November 2026. Historical AWS results are evidence for their recorded revision/time only. This stage changes documentation/presentation, not live infrastructure. See [architecture](03-architecture.md), [acceptance tests](05-testing.md), and the executable [deployment runbook](../../deploy/RUNBOOK.md).

## Owners and environment boundary

| Role | Responsibility | Access boundary |
| --- | --- | --- |
| Customer | Browse, purchase, track own orders | Store API with customer context; never Admin API |
| Operations staff | Catalog, stock, order/fulfillment handling | Authenticated Medusa Admin; demonstrate effective permissions before claiming fine-grained RBAC |
| Administrator | Staff onboarding, configuration, operational reporting | Explicit staff identity; no shared seeded password |
| Release operator | Review artifacts, deploy, verify, roll back | Approved GitHub environment and scoped AWS operator access |
| Data/recommendation maintainer | Prepare permitted artifacts, validate and publish | No automatic public promotion of restricted research data |

Named team members/rotation are assigned per release issue, not permanently embedded in this spec. A student may hold multiple roles but the actions and evidence stay separate. Local, disposable test and AWS demo databases must be identified before commands that create customers, carts, orders or inventory changes.

## Threat model and controls

| Threat | Boundary/control | Acceptance evidence |
| --- | --- | --- |
| Customer reads another customer's order | Server-side actor authorization; negative object-access tests | Customer A/B HTTP tests, including modified IDs |
| Forged discount, price, customer or stock value | Authoritative Medusa workflows, validated DTO allowlists, identity from auth context | Tampering and insufficient-stock tests |
| Duplicate checkout/payment callback | Stable operation identity; durable idempotent outcome; verify installed provider semantics | Concurrent retry and timeout tests; one order/payment effect |
| Abusive login/search/recommendation traffic | Bounded inputs, proposed rate/concurrency limits and dependency timeouts | Negative tests and peak failure behavior; controls not all implemented |
| Public exposure of secrets or private assets | Secrets Manager/task IAM roles; private bucket; public-image prefix allowlist; sanitized logs | IAM/storage checks; denied direct S3/private paths |
| Stale or cross-customer cache response | Context-specific keys, private no-store responses, explicit freshness policy | Two identities/regions and invalidation tests |
| Research data or malicious image publication | Permission/provenance gate; image format boundary; no H&M bulk public upload | Rights review and fixture/invalid-file checks |
| Deployment or migration corrupts data | Reviewed change sets, backups, forward-compatible migrations, isolated restore drill | Artifact references and drill results |

No card data is stored by DAYMARK. The initial payment mode is COD; order creation does not mean cash has been collected. A non-production simulator must support success/failure/retry demonstrations. Carrier booking and COD reconciliation are manual business procedures initially, with actor/time/reference recorded; no simulated update is presented as a real courier confirmation.


## IAM and network responsibilities

The current ECS execution role pulls images/writes logs and retrieves three injected application secrets. API/worker task roles access only the configured image bucket for application S3 operations; the current policy covers the bucket objects, so the public-prefix restriction is an HTTP application publication boundary, not a separate IAM isolation boundary. Never place private documents in that bucket/provider. Storefront task role has no S3 or Secrets Manager API grants.

The GitHub OIDC publishing role is bound to the repository's aws-demo environment and ECR repositories; it can publish images/read foundation outputs, not deploy infrastructure or read application secrets. Automated deployment needs a separately reviewed release role and environment policy; do not silently broaden the publishing role. Operational watchdog roles are separate and reviewed for their stop/describe scopes. Human AWS project access follows the managed project experience, not manually created staff IAM users.

ALB accepts HTTPS/public HTTP redirect; application inbound is limited to the ALB security group. Database and Redis inbound are limited to the application group; RDS is not public. Storefront/Admin business identities are distinct from AWS IAM roles. The existing Fargate tasks have public outbound connectivity: this is a scoped demo trade-off, not a claim that all compute is in private subnets. Review egress and dependency access before a public commercial launch.

## CI/CD target and current gap

Existing CI checks application tests/lint/types/builds and CloudFormation. Existing OIDC workflow publishes images; existing full-stack release execution is operator-driven. This is not yet a demonstrated fully automated release pipeline.

Target pipeline:

1. PR: docs/contracts, lint, unit/integration tests, isolated browser critical path, container build and infrastructure validation.
2. Protected main/tag: build immutable images and publish ECR digests using narrowly scoped OIDC credentials.
3. Approved demo environment: validate settings and lease, review infrastructure changes/backup status, migrate, release exact image digests.
4. Gate: API/storefront readiness plus an isolated end-to-end order and worker notification check; record revision, digest, environment, UTC time and result.
5. On failure: stop promotion; restore compatible application digests or follow the data recovery procedure. Never drop/reseed production data as rollback.

Environment approval is an intentional release boundary; the approved execution itself must be automated and reproducible. The current helper drains tasks before migration/start, so planned maintenance interrupts traffic. Do not promise zero downtime. A pipeline implementation and successful execution are separate delivery gates.

## Observability and SLO

| Signal | Interpretation and response |
| --- | --- |
| Successful scheduled availability probes / total scheduled probes | Availability SLI per NFR-AVAIL-01; request success rate is a separate signal |
| p95 response time, errors and achieved RPS | Measure at named boundary; API metrics cannot establish browser LCP |
| Orders/payment effects/reservations reconciliation | Correctness SLI; an HTTP 200 is insufficient |
| ALB unhealthy targets/5xx, ECS task count/CPU/memory | Detect saturation, failed releases and actual scaling |
| RDS connections/CPU/free memory/storage latency | Find database ceiling before increasing application replicas |
| Redis health/memory and worker failures | Identify coordination/background dependency failures |
| Notification attempts, retries, terminal failures, queue age | Prove async work finishes; custom business telemetry remains to implement |
| Recommendation fallback/error rate, eligibility and latency | Keep optional suggestions from obscuring commerce failures |

Target availability is 99.5% within explicitly scheduled service windows. Declare each window beforehand; include unplanned outages and maintenance within it. Lease shutdown outside windows is excluded but must not be hidden from users. This is not a measured 24/7 production SLA. Define black-box sampling interval, treatment of no traffic and short-window rounding in each test plan; synthetic health and business journey probes complement request metrics.

Every write flow should carry a correlation identifier into sanitized application/worker logs. No credentials, addresses, tokens or raw provider errors in public responses. Dashboards/alarms exist in IaC; business telemetry and proven alert delivery remain acceptance work. A pending SNS email subscription is not an operational alert channel.

## Failure and recovery playbook

| Failure | Expected business behavior | Exercise |
| --- | --- | --- |
| Email unavailable | Confirmed order remains; bounded retry and visible terminal failure | Inject provider failure and reconcile delivery attempts |
| Recommendation unavailable | Hide suggestions/use verified catalog fallback; cart/checkout independent | Disable dependency while purchasing |
| PostgreSQL unavailable | No false order success; actionable failure, reconcile ambiguous retries | Isolated interruption, recover and retry same operation |
| Redis unavailable | Do not assume every workflow still works; determine which writes/locks/events fail and preserve correctness | Isolated failure with catalog/checkout/worker probes |
| API task dies | ALB routes to healthy targets if another exists; one-task baseline may interrupt service | Kill isolated task, measure recovery |
| Stock depleted during campaign | Reject/reconcile unavailable purchase, no negative sellable stock | Last-unit contention test |
| Bad release | Roll back compatible application digest, retain data and audit trail | Rehearse previous release with schema compatibility |
| Database loss/corruption | Restore backup to a NEW isolated database, validate then plan controlled cutover | Measure RPO <=60 min and RTO <=120 min targets |

Recovery objectives remain targets until the restore drill succeeds. Database backups do not back up S3 media; preserve bucket versioning and test exact-object recovery separately. Single-AZ RDS and one Redis host are accepted MVP failure points, not high availability claims.

## Capacity and cost contract

Provisional design ceiling: USD100 per month for scheduled demo operation, pending team/project-owner budget approval. It is not authorization to spend or a verified forecast. Track gross cost, not just remaining promotional credits. Record service-hours, retained storage, ALB uptime, public IPv4, requests/transfer, logs, snapshots and deployment overlap.

The [historical cost model](../../deploy/cloudformation/cost-estimate.json) estimates about USD168/month for always-on operation before variable extras using October rates. It is explicitly stale and cannot justify a current monthly bill. Scheduled compute can fit a smaller budget only with actual lifecycle/cost validation. Refresh rates and billing in the selected Region before provisioning; if the forecast exceeds the ceiling, reduce scheduled hours or request a scoped budget decision. Do not silently shrink acceptance tests or claim 24/7 availability.

The API currently caps at two tasks; storefront/worker have fixed capacity. At 5x load measure all tiers before raising limits. At 10x load find the saturation point and controlled rejection/recovery behavior. Cache/media delivery, database pool capacity and storefront replication are explicit decision points; no new Redis read replicas/CDN/search service by default. Core commerce consistency remains the priority.

## Runbook and evidence discipline

Use [deploy/RUNBOOK.md](../../deploy/RUNBOOK.md) and [CloudFormation guide](../../deploy/cloudformation/README.md) for exact commands. Regional resources stay in ap-southeast-2, profile aws-project. Respect private settings, existing resources and finite demo leases. Pause retains a billable ALB; hibernate removes the app stack, not retained storage. Never delete foundation/data as ordinary cleanup.

Store sanitized runs under `docs/report/evidence/<run-id>/`: source revision, environment/configuration (no secrets), dataset version, script command, raw results, thresholds, reconciliation, costs and conclusions. Keep dated evidence immutable; new spec does not turn previous tests into new acceptance. Do not call the system healthy from liveness endpoints alone.
