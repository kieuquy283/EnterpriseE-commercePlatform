# Evidence and specialist references

These references support the [current specification](../README.md); they are not parallel product roadmaps. Their dates, environments and research permissions remain in force. Nothing here establishes current AWS uptime.

## Historical engineering evidence

- [9 November latest-main AWS release](../report/aws-redeployment-main389e855-2026-11-09.md): migrations, image digests and 18 public checks; no claimed campaign/restore/staff acceptance.
- [Initial Fargate deployment](../report/aws-fargate-deployment-2026-11-08.md) and [EC2 rehearsal](../report/aws-ec2-deployment-2026-11-06.md): retain their dated limits, including API checkout versus browser acceptance.
- [Evidence directory](../report/evidence/): sanitized immutable run outputs, including inventory snapshots.
- Historical schema survey, seed fixtures and inventory-order evidence were removed from the tracked tree by upstream commits `0ca7a55`/`08dc1bf`. They remain retrievable in Git history before those commits; no current acceptance claim should depend on a removed artifact.
- [Prior AWS decision](../architecture/adr/0001-aws-cloud-stack.md): full stack primary and EC2 fallback; current patterns/decisions live in 03-architecture.

## Product-suggestion research

- [Dataset-rights decision](../recommendation/dataset-rights-decision.md): preserve private/public use boundaries.
- [Recommendation technical reference](../recommendation/spec.md), [personalization reference](../recommendation/personalization/spec.md), [hybrid reference](../recommendation/hybrid/spec.md) and [image reference](../recommendation/images/spec.md): installed feature behavior, research/evaluation history and specialist procedures.
- Their reports/evidence are retained for provenance. Old phase plans have been removed as competing roadmaps; relevant future work must be adopted explicitly into the canonical delivery backlog.
- Offline files under ignored `data/hm/` remain local research data. They are not seeded orders and are not a public DAYMARK image/catalog source by default.

## Reference policy

Do not rewrite a historical PASS as acceptance for a new revision. Add a new dated run. Do not delete fixtures/evidence consumed by scripts merely to simplify navigation. Revisit data/IP/privacy permissions before publishing artifacts or presentation screenshots. The [consolidation record](documentation-reset.md) explains removals and replacement destinations.
