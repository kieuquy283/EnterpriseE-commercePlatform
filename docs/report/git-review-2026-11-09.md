# Working-tree review and cloud documentation cleanup — 2026-11-09

## Scope and disposition

Reviewed modified and new runtime files, Docker/Compose configuration, GitHub workflows, CloudFormation templates and lifecycle helpers, EC2 fallback scripts, tests, and dated deployment evidence. The working tree is intentionally uncommitted: no staging, commit, push, infrastructure operation, DNS change or redeployment was performed in this cleanup.

The primary deployment is ALB/ACM, three Fargate services, private RDS PostgreSQL, Redis on EC2, private S3 through the backend image proxy, CloudWatch and CloudFormation. The [accepted ADR](../architecture/adr/0001-aws-cloud-stack.md) records the decision and supersedes the primary-deployment role of the earlier single-VM ADR. This does not turn the EC2 rehearsal into a Fargate test or erase its original evidence.

## Changes retained and clarified

- Runtime: S3 task-role authentication, ACL-disabled uploads, the public-image prefix/proxy, RDS CA bundle, storefront liveness endpoint and middleware exclusion, publishable-key operator script, and Docker build cache ordering.
- Infrastructure and CI: foundation/data/app templates, optional retained-resource guard, bounded session management, template tests/security rules, scoped OIDC image publishing and historical cost models. GitHub publishing remains configured but not proven by the recorded live deployment.
- EC2 fallback: Compose secret requirements, health checks, restart behavior, bootstrap/deploy scripts and the successful November 6 evidence. These remain separate from the primary RDS dataset and AWS operations.
- Documentation: README, repository map, architecture diagrams and decisions, definition/scope/SRS, course roadmap, recommendation infrastructure plan and deployment guides now consistently identify the primary stack. Older plan sections and dated reports are labeled as historical rather than silently rewritten as new results.

## Findings fixed

1. The image route directory literally named `*` could not be checked out on Windows. It now uses file-based named parameter directories at `product-images/[prefix]/[key]`. Current flat image URLs remain unchanged. Directory-style and encoded directory names are rejected; custom uploads must use flat filenames. Existing live images were not migrated or redeployed by this source cleanup.
2. The fallback SSH workflow still ran migrations from the source directory. It now uses the configured one-off `migrate` service and waits for Compose health. Its name clearly identifies the EC2 fallback. This workflow has not been tested against a live host.
3. Duplicate cache-ignore entries and an unused publishing-workflow variable were removed. Generated deployment Python caches were removed locally. Ignored local settings were preserved.
4. The canonical runbook still described EC2 as the deployment target. It now documents the AWS lifecycle; the former VM procedure is preserved in [the fallback runbook](../../deploy/ec2/RUNBOOK.md).

## Checks

| Check | Result |
| --- | --- |
| Backend lint and TypeScript | Pass |
| Proxy HTTP/security tests | 21 passed |
| Deployment management/template/watchdog tests | 27 passed |
| CloudFormation lint | Pass: four primary/recovery templates plus EC2 fallback template |
| CloudFormation Guard | Pass: all four primary/recovery templates |
| Pinned Guard archive checksum | Matches the CI checksum |
| GitHub workflow YAML and shell syntax | Three workflows parsed; 27 shell steps checked |
| Operator Python, shell and Node entrypoint syntax | Pass |
| Changed Markdown local links and whitespace | Pass |
| High-confidence secret patterns | No matches; not a substitute for a full credential/security audit |
| Changed path compatibility | No Windows-invalid filename characters |

Local `deploy/cloudformation/settings.json` remains ignored and contains no committed operator configuration. Reviewed evidence includes AWS resource identifiers and synthetic test identifiers; these are not secret credentials. No lockfile was hand-edited, and generated application build output was not changed manually.

## Live deployment boundary

The [November 8–9 deployment report](aws-fargate-deployment-2026-11-08.md) and its 14 public checks describe the previously published immutable images. The named-route compatibility fix and fallback workflow cleanup above are source changes only. They need a separately reviewed release before they affect AWS. The running demo and its existing lease were left alone as requested.

Browser checkout, worker business-job completion, load-driven autoscaling, release rollback, backup restore and alert delivery remain distinct unverified items; this cleanup does not promote them to completed requirements.

## Subsequent deployment

After this source review, latest remote main was fetched and deployed with the preserved local changes. See [the 9 November redeployment report](aws-redeployment-main389e855-2026-11-09.md) for release and verification evidence.
