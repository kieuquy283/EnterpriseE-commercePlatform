# Business-first specification consolidation — 15 November 2026

## Sources and authority

The local integration includes upstream `c68b5bb`, `0ca7a55` and `08dc1bf`. The user directed business-first specification priority. No application, database, AWS configuration or deployed resources are changed by this integration. Logical HLD components are responsibilities, not additional deployed microservices.

Primary business sources: [scope](../00-project/scope-and-assumptions.md), [BRD](../01-business/BRD.md), [SRS](../03-requirements/SRS.md), [traceability](../03-requirements/requirements-traceability.md), [quality scenarios](../03-requirements/quality-attribute-scenarios.md), [logical data](../05-data/domain-model.md), [HLD](../06-architecture/logical-architecture.md). Draft status and OPEN policy questions remain honest. Compact `docs/spec/` pages are implementation/engineering mappings; business conflicts defer to these primary documents.

## Requirement crosswalk

| Teacher use case | Primary specification | Existing implementation flow |
| --- | --- | --- |
| Registration/login | P1-UC01; FR-AUTH | FR-01 / FLOW-01 |
| Catalog/search | P1-UC02; FR-CAT | FR-02 / FLOW-02 |
| Cart | P1-UC03; FR-CART | FR-03 / FLOW-03 |
| Checkout/order | P1-UC04; FR-CHK | FR-04 / FLOW-04 |
| Payment | P1-UC05; FR-PAY | FR-05 / FLOW-05 |
| Inventory | P1-UC06; FR-INV | FR-06 / FLOW-06 |
| Order tracking | P1-UC07; FR-ORD | FR-07 / FLOW-07 |
| Notification | P1-UC08; FR-NOT | FR-08 / FLOW-08 |
| Administration/reporting | P1-UC09; FR-ADM | FR-09 / FLOW-09 |

Recommendation FR-REC-01/02 stays optional/COULD. The existing recommendation engine is available implementation, not proof of evaluation or a core release requirement. Generative shopping chat is not selected. Promotions, exchanges/returns and guest-checkout policy remain open per the primary business specification; observed COD/guest implementation is recorded as current behavior, not automatic business approval.

## Separate technical baseline — review material changes

No competing concrete framework, cloud provider or database was selected upstream. Instead, their phase-07 handoff leaves technology choice open. Do not interpret priority for business documents as authorization to replace or decommission the existing stack.

| Decision | Existing DAYMARK approach: benefits / costs | Upstream approach: benefits / costs | Integration status |
| --- | --- | --- | --- |
| Technology selection | Keep Medusa/Next.js/PostgreSQL/Redis: existing code, fixtures and tests; low migration risk. Costs: framework coupling and current database/cache capacity constraints | Reopen technology evaluation, including PostgreSQL vs NoSQL: stronger explicit comparison and independent justification. Costs: evaluation effort and possible rework; no alternative chosen or demonstrated | Keep existing technical baseline in its separate documentation; evaluation may justify it, but replacement needs user review |
| Cloud/deployment | Existing Fargate API/worker/storefront, private RDS, Redis EC2, S3 backend proxy: known IaC and separate runtime sizing. Costs: baseline spend, proxy load, Single-AZ/database/Redis limits | Provider-neutral logical HLD, physical deployment chosen later: clearer separation of requirements and implementation. Costs: no concrete replacement, migration plan, price or operational evidence | Logical diagrams incorporated; no AWS/deployment change |
| Availability measurement | 99.5% external probes during declared demo windows: fits scheduled service and easy independent monitoring. Costs: excludes off-window downtime and samples rather than measures every request | 99.5% successful valid requests over a proposed monthly window: reflects customer outcomes. Costs: needs agreed denominator/instrumentation, maintenance policy and service schedule; greater operating commitment if continuous availability is intended | Both retained as proposals with different meanings; do not claim equivalence or silently replace either |

Current technical mappings remain in [architecture](../spec/03-architecture.md), [testing](../spec/05-testing.md) and [operations](../spec/06-operations.md). Following the user direction to keep technical documents separate, the [technical index](../technical/README.md) retains the existing implementation baseline. User review is required before adopting a materially different technical choice; no replacement is implied by the business-first ordering. A future technology evaluation can document the rationale for keeping the existing stack without rewriting it.

## Historical references

Upstream removed old schema/seed/inventory evidence. Preserve their meaning through Git history rather than advertising missing local files as available. Remaining dated deployment/recommendation evidence is historical, not current acceptance proof. Source registers still contain dated migration observations; read those as observations at their recorded revision, not claims that old paths exist now.
