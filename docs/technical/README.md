# DAYMARK technical documentation

This is the technical reading path for the existing DAYMARK implementation. The [business-first specification](../README.md#primary-business-first-specification) owns requirements and logical design; this layer explains how the current stack implements them, what is proposed and what is verified.

## Read by task

| Area | Maintained source |
| --- | --- |
| Stack, component/code boundaries and implementation decisions | [Architecture](../spec/03-architecture.md) |
| Concrete Medusa ownership, storage and API contracts | [Data and API mapping](../spec/04-data-api.md) |
| Performance, reliability, security and recommendation test plans | [Engineering testing](../spec/05-testing.md) |
| AWS security, release, rollback, recovery, monitoring and cost | [Operations](../spec/06-operations.md), [deployment runbook](../../deploy/RUNBOOK.md) |
| Implementation gaps and delivery sequence | [Delivery backlog](../spec/07-delivery.md) |
| Developer environment | [Setup](../setup.md), [contribution conventions](../../CONTRIBUTING.md) |
| Frontend primitives and design implementation | [Design system](../design-system/README.md) |
| Catalog fixture/import behavior | [Catalog dataset](../catalog/DATASET.md) |
| Historical framework/cloud decision | [AWS ADR](../architecture/adr/0001-aws-cloud-stack.md) |
| Research, evaluation history and dated results | [Evidence index](../reference/README.md) |

Existing files retain their paths to preserve code/runbook links. This index separates navigation and ownership without copying their contents or creating another technical source of truth.

## Branding and requirement boundary

The upstream business specification describes a fictional Vietnamese fashion retailer; it does not approve DAYMARK or any visual identity. DAYMARK is this implementation’s project brand. The project requester approved DAYMARK branding on 15 November 2026; see the [branding decision](../brand/README.md#approval--15-november-2026). This is distinct from a teammate-wide sign-off or approval of open business policies. SOMEHOW is a public reference, not a sponsor or the owner of these requirements.

## Baseline and change boundary

The technical baseline remains Medusa API/admin and worker, Next.js storefront, PostgreSQL, Redis and the existing AWS deployment mapping. Keeping that record separate does not approve a deployment, new spend or capacity claim. The logical components in `06-architecture/` are responsibilities, not a demand for new microservices or independent databases.

When requirements change, update this mapping or record a gap; do not silently weaken the business requirement to match current code. Conversely, a technology-neutral requirement does not invalidate an existing framework/provider choice. Propose any actual stack, database or AWS replacement with benefits, costs, migration/rollback and verification before adopting it.

[Requirement crosswalk and outstanding differences](../reference/spec-consolidation.md) connects the two layers. The two 99.5% availability formulations still differ in denominator and observation window; neither is converted into the other or claimed achieved. Business policies marked OPEN remain open, even where implementation already supports a possible choice.
