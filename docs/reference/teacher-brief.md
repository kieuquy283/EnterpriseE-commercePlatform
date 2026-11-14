# Teacher acceptance brief — Project 1

Source: teacher expectations supplied directly by the project team on 14 November 2026. This is the acceptance input, not a report of achieved results. The [specification](../README.md) maps it to implementation/testing gates.

## Common expectations

Production-oriented MVP; clear architecture and defensible trade-offs; real cloud deployment with CI/CD, security, observability and cost awareness; justified cloud/provider/technology choices. A complete enterprise product, dozens of microservices, every possible feature, unevaluated complex AI and copied large-company architecture are not expected.

## Business and functional scope

Cloud commerce supporting the full customer buying journey. Core users: Customer, Store/Operations Staff and Administrator. Advanced feature: product recommendations OR AI shopping assistant; DAYMARK selects product recommendations.

Required use cases:

1. Registration/login.
2. Product catalog and search.
3. Shopping cart.
4. Checkout and order creation.
5. Payment simulation/integration.
6. Inventory update.
7. Order status tracking.
8. Customer notification.
9. Basic administration/reporting.

## Engineering requirements

Workload: read-heavy product browsing, transactional checkout, promotion traffic peaks.

Architecture: transactional order database, product search, hot-data cache, object storage for media, asynchronous notification and payment idempotency.

Define numeric targets: peak RPS/concurrent users, p95 API latency, availability, recovery objectives and monthly cloud budget. The teacher supplies categories, not actual numbers; DAYMARK's numbers are explicitly project targets to test.

Required demonstrations: simulated peak scaling, safe duplicate payment/order handling, CI/CD deployment, monitoring dashboard, architecture and ADRs.

## Shared lifecycle deliverables

| Phase | Deliverables |
| --- | --- |
| P1 Business & Architecture | Problem statement, stakeholders, functional requirements, numeric NFRs, workload analysis, initial cloud architecture |
| P2 App, Data & Integration | Component architecture, API design, data model/ownership, sync vs async and integration architecture |
| P3 Security & DevOps | Threat model, IAM/access control, CI/CD, containers, IaC and deploy/rollback strategy |
| P4 Production Engineering | Load/performance, reliability/failure scenarios, dashboard, SLI/SLO, capacity and cost analysis |
| P5 AI Engineering, if any | AI architecture, evaluation dataset/metrics, security/guardrails, latency and token-cost analysis |

For non-LLM recommendations: describe algorithm/data architecture, quality/eligibility evaluation and latency/resource cost; token cost is explicitly N/A. Introducing a generative assistant would require new safety/evaluation/cost requirements.

## Architecture-defense questions

1. What business problem is solved?
2. What workload assumptions are made?
3. What measurable NFRs apply?
4. Why this architecture?
5. Why this database/storage model?
6. What happens at 5x or 10x load?
7. What happens when a dependency fails?
8. How are deployment and rollback performed?
9. How are data/access protected?
10. How is health known?
11. What does it cost?
12. If AI is used, what are quality, safety and cost?

One complete end-to-end flow, real cloud, meaningful decisions, measurable requirements, failure handling, security, automated deployment, observability and cost awareness are required. Build less; design, implement, measure and defend it well.
