# Live AWS validation — 2026-11-01

Historical snapshot as of November 1. The CloudFront failure and retained-resource state below were superseded by the [November 8–9 recovery and full-stack verification](../../docs/report/aws-fargate-deployment-2026-11-08.md); the original test results remain unchanged.

Region: ap-southeast-2. Profile: aws-project. Free plan remained active. Tests used a temporary `commerce-smoke-data` stack that reused the retained database, bucket, secrets and encryption key, plus a temporary `commerce-smoke-app` stack from the application template. Redis was disposable for this test, with its root disk deleted on termination. No second database was created.

## Passed

- ACM issued the certificate for both 135791112.xyz and api.135791112.xyz after external Cloudflare DNS validation.
- ECR accepted the backend image, and Fargate pulled its immutable digest.
- RDS start/stop worked. A Fargate task queried PostgreSQL with verified TLS; Medusa migrations and commerce seeding exited 0.
- Redis on ARM EC2 initialized through Docker, registered with SSM, passed an SSM PING, and passed Fargate write/read/delete checks.
- S3 encrypted, versioned upload/download succeeded. Fargate also passed object write/read/delete using its task role, without static AWS keys. Test object versions were removed.
- Encrypted SQS send/receive/delete succeeded. The SNS email subscription was confirmed; no test notification was sent.
- SSM lease reads, direct Lambda invocation and scheduled EventBridge watchdog execution worked. CloudWatch captured application and watchdog logs.
- API and worker ECS services reached steady state with one task each. ALB certificate verification succeeded with TLS 1.3.
- HTTPS API /health returned 200. Unknown hostname routing returned 404. A publishable-key catalog request returned 200 and all three seeded products.
- Expiring the lease and invoking both watchdogs drained ECS services to zero and stopped RDS/Redis.

## Blocked or not exercised

CloudFront creation still returned the project-verification AccessDenied error after renewed login. The normal `commerce-data` stack remains ROLLBACK_FAILED because its retained database prevents deletion of its subnet group. Do not retry creation blindly: recover/import the retained resources first, rather than creating a duplicate database.

The storefront was not deployed. Browser browsing, checkout, CloudFront product-image delivery, load capacity and autoscaling under traffic remain unverified. Scaling configuration, alarms and dashboards were provisioned, but this test does not prove capacity or notification delivery on a real failure.

## Fixes and recovery

Live testing exposed an invalid AWS CLI RDS waiter (`db-instance-stopped`). Management now polls DescribeDBInstances with a bounded timeout instead. Regression tests cover the stopped transition and timeout. The management script also blocks startup while the retained database guard is active. All 24 management/shutdown tests pass.

The user approved `commerce-retained-guard` to keep the retained database stopped while CloudFront is blocked. Its reviewed source is `retained-guard.yaml`, with DatabaseId supplied at deployment. It must be removed after restoring the normal data watchdog and before intentionally restarting the database.

Cleanup verified: both temporary stacks were deleted, the temporary Redis instance is terminated, no ECS clusters or load balancers remain, and the retained database reports stopped. The approved retained guard is UPDATE_COMPLETE and a direct invocation returned `{"state":"stopped"}`. All four templates pass cfn-lint 1.58.0. The retained database now contains the seeded demo dataset; preserve it during recovery. Retained storage, ECR images, three secrets, and the encryption key still incur charges. Billing data is delayed; no exact test bill is claimed.
