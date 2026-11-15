# Delivery gates and implementation order

Authority update — 15 November 2026: the [business-first specification](../README.md#primary-business-first-specification) takes precedence for business scope and policy. This file maps that intent to DAYMARK implementation and retains earlier proposals where not yet reconciled. See the [crosswalk and held decisions](../reference/spec-consolidation.md); open policies are not approved merely because code exists.

This is the shared backlog for the DAYMARK reset, not a claim that missing features are complete. Align each task/PR with a requirement from [business](01-business.md), a [flow](02-flows.md), and [acceptance evidence](05-testing.md). Named owners/dates belong in the team's issue tracker; no individual owns the whole codebase.

## Teacher lifecycle and deliverables

| Gate | Required artifact | Exit condition |
| --- | --- | --- |
| P1 Business & architecture | Business/problem, users, FRs, numeric NFRs, workload, cloud context | Team can explain business boundaries and identify targets versus evidence |
| P2 App, data & integration | Components, API contracts, data ownership, sync/async, integrations | One complete customer/staff business flow plus versioned contracts and failure cases |
| P3 Security & DevOps | Threat model, access matrix, containers, IaC, CI/CD, deploy/rollback | Approved automated cloud release and successful rollback/security demonstrations |
| P4 Production engineering | Load/failure tests, dashboard, SLI/SLO, capacity and gross cost | Measured results for baseline/peak, duplicate handling, recovery and budget |
| P5 Recommendation engineering | Algorithm/data architecture, rights, evaluation, guardrails, latency/cost | Measured useful suggestions without compromising commerce; no unsupported AI claims |

P1-P5 are acceptance categories, not a rule that all security waits until P3. Controls and tests accompany each vertical slice.

## Build sequence

### Stage 0 — specification and presentation (this change)

- Establish canonical docs, requirements/flow identifiers, architecture decisions, measurable target definitions and status vocabulary.
- Replace generic starter guidance with shared AGENTS/CONTRIBUTING and typed TODO/commit conventions.
- Publish a reusable report engine and initial scope-revamp deck as a build artifact, not a live commerce release.
- Delete superseded planning narratives; preserve dated evidence, schema fixtures and restricted research references that remain useful.
- Exit: links/coverage validated; team reviews business assumptions, budget and implementation priorities. No cloud, schema or commerce behavior changed.

### Stage 1 — demonstrate the store's core transaction and staff operation

- Implement a repeatable, non-destructive DAYMARK fixture: target 24-36 clothing products, size/color SKUs, licensed/original images, stock by location, VND prices and collection/category mapping. Current seed has three products without images; do not mislabel it complete.
- Separate fresh bootstrap from catalog upsert; dry-run/report conflicts, fail on unknown environment, never delete existing orders/customer data. Store asset provenance and verify proxy URLs.
- Add a safe first-admin onboarding procedure; no default password. Verify real Admin access and the effective staff permissions available in the installed Medusa version.
- Walk stock receipt -> publish -> find variant -> COD checkout -> inventory reconciliation -> staff fulfillment -> manual carrier/tracking handoff -> customer order status -> COD reconciliation. Define supported manual evidence fields before implementing them.
- Verify simulator success/failure and safe duplicate checkout/payment effects in isolated non-production tests.
- Implement async notification provider/subscriber with idempotency, retry policy, failure visibility and tests. Choose provider through an ADR after compatibility/Region/cost review; no invented SES configuration.
- Exit: one browser and staff acceptance walkthrough plus negative/retry/stock tests; all nine FR groups have evidence or explicit blocking gaps.

### Stage 2 — simplify boundaries and make releases reproducible

- Inventory duplicate custom Store APIs and their consumers. Select supported contracts; deprecate safely after checking team dependencies.
- Move recommendation orchestration/projection/cache ownership below routes. Keep domain/service layers independent of HTTP modules.
- Consolidate runtime DTO validation, identity rules and error contracts; audit public projections and object authorization.
- Replace the storefront's first-100-product sort assumption with full matching-catalog query behavior; define cache context/TTL/invalidation across tasks.
- Wire isolated browser acceptance into CI and implement the approved automated deployment workflow. Drill compatible application rollback.
- Exit: tests exercise the actual supported interfaces; the deployment gate is executed, not merely a YAML file.

### Stage 3 — measure production behavior

- Run k6 baseline, campaign ramp, abrupt 5x peak and exploratory 10x stress with bounded cost and isolated test stock.
- Reconcile duplicate orders/payment effects/inventory, not only request status.
- Demonstrate actual task scaling, dashboard diagnosis, notification/dependency failure handling and database/media recovery.
- Refresh capacity/cost estimate and compare gross spend with approved budget. Record bottlenecks and evidence before adding services.
- Exit: measured P4 report with failures/limits, including any unmet targets. Do not rename failed targets as achieved capacity.

### Stage 4 — useful product suggestions

- Start with catalog-based similar items/popularity; no generative assistant required.
- Prepare permitted evaluation data, compare baseline to selected strategy, inspect relevance and require visible/sellable products in the current region/channel.
- Keep personalization opt-in and separately gated. Demonstrate consent withdrawal/deletion if included; no public promotion of H&M research by default.
- Exit: P5 quality/latency/resource-cost evidence and a degraded-mode shopping demo. Token cost is N/A for non-LLM algorithms, not an omitted requirement.

## Current implementation baseline

Source inspected at the reset: Next.js storefront, Medusa core commerce/Admin, custom recommendation/personalization code, S3 proxy and full-stack CloudFormation. Dated 9 November 2026 evidence shows 18 public checks and successful migrations with three services; it does not establish current service availability, browser/staff acceptance, peak capacity or restore success. See [evidence index](../reference/README.md).

Known gaps: minimal catalog/images; admin onboarding not part of bootstrap; no configured customer notification provider; no demonstrated manual fulfillment/COD operating procedure; inconsistent route/workflow/cache boundaries; no demonstrated automated full-stack GitHub release or peak/restore exercise. The code includes k6 and Playwright scripts; their existence is not a passing result.

## Decision and change control

The DAYMARK direction and documentation reset are authorized. This baseline guides the next implementation; it does not authorize new cloud spend, data deletion, research-data publication or provider purchase. Budget, final email provider, asset rights, precise staff permissions and unsupported carrier/COD record extensions need recorded decisions with a responsible reviewer.

A task is done when its requirement/flow, implementation, relevant tests and evidence agree. PRs state remaining TODOs and unrun checks. One logical change per commit; architecture changes update the decision log. Shared main remains reviewable and deployable; no uncontrolled mass reformatting or generated-output commits.

## Presentation defense

Present in this order: business problem -> actors -> complete buying/fulfillment flow -> requirements/workload -> architecture/data -> sync/async/idempotency -> security/release -> load/failure/health/cost -> recommendation evaluation -> measured gaps/next gate.

Every answer should point to either a decision, a target, installed code or dated evidence. "AWS supports it" and "Medusa has it" are not acceptance evidence. Initial deck: [presentation workspace](../../presentation/README.md).
