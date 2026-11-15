# DAYMARK engineering specification

DAYMARK is a Vietnamese everyday-clothing ecommerce MVP with product suggestions. Business requirements are now governed by the business-first documents listed below, following the team consolidation decision of 15 November 2026. The earlier compact specification remains an implementation mapping and engineering reference. It describes what to build and how to accept it; historical tests remain dated evidence.

## Engineering implementation mapping

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

- `00-project/` through `05-data/`: primary business scope, actors, requirements, traceability and logical data definitions. Their Draft/Open labels remain; prioritizing these documents does not invent policy approval.
- `06-architecture/`: primary logical architecture proposal. Its technology-neutral boundaries do not replace the current runtime automatically.
- `docs/spec/`: existing DAYMARK implementation mapping and engineering targets. Business conflicts defer to the business-first specification. Technical decisions and availability measurement conflicts remain held for explicit review in [consolidation](reference/spec-consolidation.md). Targets are not measured results.
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

## Primary business-first specification

Read these documents first for business scope and acceptance intent. They take precedence over conflicting business statements in `docs/spec/`. Draft policies remain open; implemented behavior is recorded separately. Framework, AWS and database changes require the explicit review described in [consolidation](reference/spec-consolidation.md).

| Giai đoạn | Tài liệu hiện có | Trạng thái |
|---|---|---|
| 00 Dự án | [Tuyên bố dự án](00-project/project-charter.md), [Phạm vi và giả định](00-project/scope-and-assumptions.md), [Sổ nguồn và giả định](00-project/source-and-assumption-register.md) | Bản nháp |
| 01 Nghiệp vụ | [BRD](01-business/BRD.md), [Bản đồ năng lực](01-business/business-capability-map.md), [Quy trình](01-business/business-processes.md), [Quy tắc](01-business/business-rules.md) | Bản nháp; chờ nhóm rà soát |
| 02 Người dùng | [Các bên liên quan](02-users/stakeholder-analysis.md), [vai trò và mục tiêu](02-users/actors-and-user-goals.md), [hành trình](02-users/user-journeys.md) | Bản nháp; chờ rà Business và quyền/chính sách |
| 03 Yêu cầu | [SRS](03-requirements/SRS.md), [use case và AT](03-requirements/use-case-specifications.md), [tình huống chất lượng](03-requirements/quality-attribute-scenarios.md), [truy vết](03-requirements/requirements-traceability.md) | Bản nháp; mục tiêu chất lượng chưa đo/chưa duyệt |
| 04 Tải công việc | [Phân tích tải](04-workload/workload-analysis.md) | Bản nháp; giả định và mục tiêu thử |
| 05 Dữ liệu | [Mô hình miền](05-data/domain-model.md), [từ điển](05-data/data-dictionary.md), [quyền sở hữu và nhất quán](05-data/data-ownership-and-consistency.md) | Bản nháp logic; chính sách dữ liệu còn mở |
| 06 Kiến trúc | [10 sơ đồ HLD và kiến trúc logic](06-architecture/logical-architecture.md), [hợp đồng giao diện](06-architecture/api-and-interface-contracts.md), [tích hợp](06-architecture/integration-design.md), [ADR](06-architecture/adr/ADR-001-application-boundary-style.md) | Provisional; 10/10 hình đã render, chờ review và 3 ADR chưa phê duyệt |
| 07 Đánh giá công nghệ | So sánh công nghệ và kiến trúc vật lý | Dự kiến |


Consult the [source and assumption register](00-project/source-and-assumption-register.md) for their evidence and open assumptions. Local source plans and PDFs remain ignored.
