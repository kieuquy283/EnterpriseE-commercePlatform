# DAYMARK engineering specification

DAYMARK is a Vietnamese everyday-clothing ecommerce MVP with product suggestions. This is the authoritative reading path for the documentation reset dated 14 November 2026, aligned with the supplied teacher rubric. It describes what to build and how to accept it; historical tests remain dated evidence.

## Read in order

1. [Business, users, scope and requirements](spec/01-business.md)
2. [End-to-end business flows and failure paths](spec/02-flows.md)
3. [Component architecture, patterns and decisions](spec/03-architecture.md)
4. [Data ownership and API contracts](spec/04-data-api.md)
5. [NFRs, workloads, acceptance tests and evaluation](spec/05-testing.md)
6. [Security, operations, CI/CD, health, recovery and cost](spec/06-operations.md)
7. [Delivery gates, implementation order and gaps](spec/07-delivery.md)

[DAYMARK provisional branding and asset provenance](brand/README.md).

[Storefront design system](design-system/README.md): tokens, primitives, accessibility and commerce display rules for the customer frontend.

Supporting material: [teacher acceptance brief](reference/teacher-brief.md), [dated evidence/research index](reference/README.md), [local setup](setup.md), [deployment runbook](../deploy/RUNBOOK.md), [contributing](../CONTRIBUTING.md), [presentation engine](../presentation/README.md).

## Authority and status

- `docs/spec/`: current agreed design baseline. Targets are requirements, not measurements. A material change needs a reason and a decision entry.
- Executable code/templates: actual implementation, which may still have documented gaps from the target design.
- `docs/report/`, `docs/erd/`, recommendation reports/evidence: historical observations, schema/fixture artifacts or restricted research. Preserve their source revision/date and do not treat them as a second roadmap.
- `docs/recommendation/`: specialist implementation/research references, subject to the dataset-rights decision and feature gates. Current scope is defined here, not by old phase plans.
- `deploy/`: operational instructions and infrastructure; full Fargate is primary, EC2/Compose fallback. A runbook is not proof its commands were executed successfully today.

Vocabulary: **target** (chosen acceptance requirement), **implemented** (source exists), **verified** (named test, revision/environment/time and result), **missing** (not implemented), **deferred** (outside current gate). Never collapse these into "done".

The old generic project-definition/SRS/week plans and superseded architecture narratives were removed to eliminate competing baselines. See [consolidation record](reference/documentation-reset.md). No commerce records, migrations, test evidence or research datasets are deleted by this reset.

## Teacher coverage

| Required delivery | Authoritative location |
| --- | --- |
| P1 problem, stakeholders, functional requirements | 01-business, 02-flows |
| P1 numeric NFR/workload/cloud architecture | 03-architecture, 05-testing |
| P2 components, API, ownership, sync/async/integrations | 03-architecture, 04-data-api |
| P3 threat model, IAM, CI/CD, containers/IaC, rollback | 06-operations and deploy runbooks |
| P4 load/failures, dashboard, SLI/SLO, capacity/cost | 05-testing, 06-operations |
| P5 recommendation architecture/evaluation/guardrails/cost | 03-architecture, 05-testing |
| Scale, duplicates, release, dashboard, architecture/ADRs demo | 05-testing and 07-delivery gates |

First implement and demonstrate one complete business journey; then measure and improve it. Do not add microservices, a new search engine or generative AI merely to enlarge the diagram.
