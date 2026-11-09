# Latest-main AWS redeployment — 9 November 2026

The full AWS stack was updated from remote main `389e8556a7421f308f8f3fe9b57566e4b3002a42`, including the preserved local AWS deployment and documentation cleanup. This follows the source-only review recorded in [the Git cleanup report](git-review-2026-11-09.md).

## Source and release

Fetched 21 upstream commits over HTTPS after SSH authentication failed, then fast-forwarded main. Local changes were saved in a retained stash and reapplied. Docker ignore rules and storefront build arguments were reconciled; upstream's deletion of the old recommendation implementation plan was retained. No commit or push was made.

Release tag: `main-389e855-20261109-896fcad1`. Immutable current and previous image references are recorded in [release evidence](evidence/fargate-main389e855-2026-11-09/release.json). The application CloudFormation update did not replace the data or foundation stacks.

## Data and validation

Before deployment, RDS snapshot `commerce-pre-main389e855-20261109-023101` reached available status. No restore drill is claimed. The migration task exited successfully and applied four new recommendation/personalization migrations; see [migration evidence](evidence/fargate-main389e855-2026-11-09/migrations.json). Existing commerce data was not reseeded, and no recommendation dataset or artifact was promoted. Cloud recommendation flags remain disabled.

Dependency installation, backend lint, backend and storefront type checks, both production Docker builds, 65 backend unit tests and 12 HTTP integration tests passed. Integration tests used a disposable local PostgreSQL instance, which was removed afterward.

All 18 public checks passed, covering HTTPS, catalog and product rendering, admin, image byte integrity, blocked private paths, disabled recommendations, authentication and redirects. The temporary image probe was removed. API, storefront and worker each reached steady state with the expected release image digests. Live verification and running container digests are recorded separately in [public checks](evidence/fargate-main389e855-2026-11-09/public-verification.json) and [runtime evidence](evidence/fargate-main389e855-2026-11-09/runtime.json).

The demo stack remains available under the existing bounded lease, expiring at 13:38:40 Vietnam time on 9 November 2026 (06:38:40 UTC). The legacy EC2 deployment remains stopped and unchanged. Storage and the load balancer can continue to incur charges after compute stops.
