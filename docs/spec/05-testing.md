# Acceptance, workload and measurable NFRs

This is the acceptance contract for DAYMARK, not a report of achieved capacity. [Business](01-business.md), [flows](02-flows.md), [architecture](03-architecture.md), [data/API](04-data-api.md) and [operations](06-operations.md) define what the tests exercise. All new targets require evidence before their status becomes accepted.

## 1. Workload assumptions

One Vietnam/VND clothing store, one warehouse, 24–36 launch products with size/color variants, COD and manually operated carrier handoff. Most sessions browse; a small fraction mutate carts or complete orders. No measured real business traffic is available.

Use **request arrival rate** for API capacity and **journeys per second** for checkout. A checkout journey contains several HTTP requests, so three journeys/sec is not three total HTTP requests/sec. VUs are load-generator execution capacity, not an interchangeable business user count.

Baseline: 30 public catalog/product read requests/sec for ten minutes. Transaction test: three checkout journeys/sec for five minutes using dedicated stock and synthetic customers. Campaign model: 90% browsing, 8% cart work, 2% checkout by business action, calibrated so actual endpoint RPS is reported. Define think time and session lengths before translating results into concurrent-user claims. A provisional 100 active-session campaign scenario is a test input, not a supported-user guarantee.

### Fixture sizes and request boundaries

Use three distinct named fixtures: 24–36 products for the business demo; at least 120 matching synthetic products for full-catalog pagination/sort correctness; and a declared 1,000-product synthetic catalog with size/color variants for the initial capacity experiment. Larger-data stress is exploratory. These are target test fixtures, not existing seed counts or claimed real inventory. Version them, use permitted reusable image fixtures and reconcile unique SKUs/stock.

The 30/150 RPS browsing targets count catalog/detail/search/filter API calls, not every HTTP request emitted by a page. Report storefront page requests, image-proxy RPS and transferred bytes separately, with a declared images-per-page and warm/cold cache scenario. Otherwise a read-heavy campaign could pass the catalog test while media saturates the same API tasks. Browser journey timing is a separate measure from API p95.

## 2. NFR targets and how to measure them

| ID | Target / scope | Measurement and pass rule | Initial status |
| --- | --- | --- | --- |
| NFR-PERF-01 | 30 browsing requests/sec, 10 min; p95 API duration <600 ms; failures <1% | k6 arrival-rate suite over catalog, detail, search and filter with declared warm/cold cache state; no dropped iterations; business checks threshold >99% | Target, not verified on current full AWS release |
| NFR-PERF-02 | 3 checkout journeys/sec, 5 min; cart-completion p95 <1,500 ms; unexpected failures <1% | k6 tagged completion metric plus completed-journey count; reconcile orders, payment effects and stock; deliberate out-of-stock responses classified separately | Existing script needs stronger business thresholds and reconciliation |
| NFR-PEAK-01 | Promotion step from 30 to 150 browsing RPS (5x), hold 5 min, then 30 RPS for 5 min | No dropped iterations, unexpected failures <1%, peak p95 <1,200 ms; return to baseline p95 <600 ms within 5 min after load falls. Record task-count change, timestamp, DB connections and any pre-scaling | Target; may require capacity changes and approved cost |
| NFR-REL-01 | One business effect per repeated payment/order operation; no overselling in defined concurrent cases | 20 simultaneous attempts against final five units plus duplicate/retry cases; reconcile exact IDs/reservations/fulfilled counts; zero duplicate effects and zero negative sellable stock | Must be demonstrated; not inferred from framework choice |
| NFR-AVAIL-01 | 99.5% successful availability probes during declared demo service windows | External 1-min probes cover storefront, API and a lightweight catalog dependency read. Numerator/denominator and observation period published; unexpected outages count | Target, not a 24x7 SLA; lease shutdown outside declared windows excluded explicitly |
| NFR-RECOVERY-01 | RPO ≤60 min; RTO ≤120 min | Isolated restore drill with known checkpoint and timestamps, validate catalog/order references and controlled reopening. Snapshot existence alone is insufficient | Proposed, unverified |
| NFR-SEC-01 | No unauthorized customer/order reads, no public DB/Redis or unsigned private S3 reads | Negative HTTP tests plus IaC/network review; credentials excluded from Git/logs; simulator absent in production | Partial historical evidence; revalidate per release |
| NFR-OBS-01 | Detect injected API/dependency failure within 5 min during service window | Probe/dashboard/alarm captures failure and notification reaches confirmed operator; correlate test request/order to logs where implemented | Target; dashboard resources exist, notification receipt unverified |
| NFR-NOTIFY-01 | Normal confirmation delivery within 60 sec for ≥95% of test orders; retry is bounded and observable | Test inbox/provider adapter records delivery and dedupe key; outage/retry test cannot alter committed order | Missing implementation; four-attempt policy defined in data/API contract |
| NFR-COST-01 | Provisional USD100/month planning ceiling | Region-specific scenario model with running hours, stopped storage, ALB, RDS, ECS, Redis, logs, transfer and backup; compare estimate with delayed actual billing | Planning target, not permission to spend or a verified bill |
| NFR-REC-01 | Optional suggestions p95 <800 ms at 30 RPS; failure does not block purchase | Separate k6 suite, fallback/timeout tests and commerce regression; offline quality comparison before activation | Private code/evidence exists; cloud feature remains disabled |

Cost and availability targets apply to an explicitly bounded operating schedule. A full month of the present services may exceed the provisional ceiling. If the model exceeds it, reduce schedule/capacity or obtain an owner-approved budget before running; do not silently weaken acceptance or count free credits as zero cost. Targets are project hypotheses to measure, not external industry benchmarks.

## 3. Functional traceability

| Requirement / flow | Minimum acceptance scenario | Test layer | Evidence required |
| --- | --- | --- | --- |
| FR-01 / FLOW-01 | Register, sign in/out, access own profile; reject another customer's protected data | Backend HTTP + Playwright | Synthetic identities, assertions and trace; verification policy recorded |
| FR-02 / FLOW-02 | Browse collection, search/filter by clothing choices, inspect valid price/size/photo; paginate beyond 100 matches | Contract/integration + Playwright | Whole-catalog count/order checks, unavailable/private-product negatives |
| FR-03 / FLOW-03 | Add/update/remove variants; invalid quantity and unavailable stock handled | Unit/HTTP + Playwright | Cart state and server-calculated totals |
| FR-04 / FLOW-04 | Address → shipping → completion → customer confirmation → same order in Admin | Backend integration + Playwright + staff checklist | One traceable order, variant, reservation and fulfillment reference |
| FR-05 / FLOW-05 | Isolated simulator success/failure; production COD semantics; timeout and concurrent duplicate submit | Integration + controlled k6 | Exact order/payment effects; no real charge; no simulator in production |
| FR-06 / FLOW-06 | Staff receives stock, customer reserves, cancellation releases appropriately, pick/pack/fulfillment updates correctly | Integration + Admin checklist | Before/after levels and reservation reconciliation; test installed lifecycle |
| FR-07 / FLOW-07 | Customer sees permitted order progress; staff records carrier handoff, delivery/COD reconciliation or failed delivery | Playwright + staff acceptance | Actual supported state mapping and handoff records, no invented carrier automation |
| FR-08 / FLOW-08 | Confirmation after commit; duplicate event and email outage; recovery/retry | Unit fake provider + integration + test inbox | Delivery/dedupe records, bounded attempts, committed order unchanged |
| FR-09 / FLOW-09 | Staff edits product/stock/order; Admin creates access and views basic order/stock reporting | Admin checklist + API authorization tests | Demonstrated role policy, report totals reconciled to fixture orders |
| REC-01 | Similar/featured suggestions exclude invisible/unavailable items; no consent for behavioral tracking means no personalized data use | Unit/HTTP + Playwright + offline evaluation | Candidate version, permissioned dataset, quality metrics and fallback behavior |

Built-in Medusa capability is not acceptance evidence by itself. Manual staff tests are legitimate for this MVP when repeatable, witnessed and recorded. Automated admin browser coverage can follow after the stable flow is proven.

## 4. Tool responsibilities

- **Unit/Jest:** deterministic ranking, projection, consent and idempotency policies; no assertions that merely mirror implementation details.
- **Backend HTTP/integration:** installed Medusa workflows, auth boundaries, database constraints, transaction outcomes, provider failures and schema upgrades on disposable PostgreSQL.
- **Playwright:** customer shopping/account journeys and visual action outcomes. Capture trace/screenshots on failure; assert persisted business results, not just page navigation.
- **k6:** throughput, p95 latency, concurrency contention, mixed promotion and overload recovery. Set thresholds on business `checks` and `dropped_iterations`, not only HTTP timing.
- **CloudWatch/ALB/ECS/RDS/Redis metrics:** explain bottleneck and scaling behavior during the same UTC test window.
- **IaC/operations checks:** cfn-lint, Guard, management/shutdown tests, deployment/rollback, alarm receipt and isolated restore drill.

Existing `load/catalog.js`, `load/checkout.js` and `load/recommendations.js` are starting points. The current catalog script reads one endpoint shape. Checkout has an order-created check but no business-check threshold; add that and reconciliation before treating green k6 output as business success. Playwright tests exist, but the inspected main CI does not execute them. These are delivery tasks, not changes made by this documentation stage.

## 5. Execution sequence and fixture safety

1. Record environment, release/image digests, configuration excluding secrets, dataset count, cache state, API task bounds, database/Redis sizes, load-generator location and expected cost/runtime.
2. Use isolated/disposable services for integration and writes. A cloud write test requires explicit designated synthetic data, known starting stock and a bounded run; never silently run load against customer orders.
3. Smoke at one iteration; assert a real authoritative result. Stop if dependencies, key, stock or shipping/payment setup is wrong.
4. Run baseline browsing and transaction suites separately to establish a reproducible reference. Then run mixed campaign, 5x spike and recovery. Do not run a 10x stress experiment until the smaller run is understood and spend/runtime are bounded.
5. For autoscaling, show observed one-to-two API task transition under CPU-bound load. If bottleneck is elsewhere and no transition occurs, report that fact; pre-scaling is not automatic-scale evidence.
6. Reconcile synthetic orders, payment effects, reservations and stock. Delete only test-owned disposable artifacts according to the fixture cleanup procedure; preserve evidence and never drop shared databases.
7. Run explicit failures: email outage, worker restart, API task restart, Redis interruption and isolated DB restore. A failed data dependency may legitimately make checkout unavailable; it must not corrupt commerce state or claim false success.
8. Publish result: PASS/FAIL/NOT RUN per requirement, raw output, observed bottleneck, recovery timeline, cost estimate/actual distinction and follow-up owner.

At 10x (300 browsing RPS), measure the breaking point and recovery; there is no initial promise of serving that traffic successfully. Stop conditions include sustained unexpected error >5% for one minute, database connection exhaustion, data-integrity assertion failure or the approved time/cost limit. Record the stop rather than deleting an inconvenient result.

## 6. Evidence and release gates

Historical 9 November evidence records 65 backend unit tests, 12 HTTP integration tests, migration success, matching running images and 18 public checks. These do not prove present uptime, full browser checkout, staff fulfillment, campaign capacity, restore objectives or new DAYMARK content. Existing private recommendation reports do not authorize public dataset/image use.

A new evidence bundle needs: run ID/date, commit and image digests, linked requirement IDs, setup/fixture manifest, tool/config version, raw metrics, assertions, sanitized traces, inventory/order reconciliation, dashboard capture, cost/runtime and reviewer conclusion. Store dated evidence separately from this specification; never overwrite an old successful or failed run with a new result.

Release acceptance requires FR-01..09 to pass, security negatives, safe duplicate handling, a complete cloud business journey, CI/CD deployment, dashboard/alarm evidence and baseline/peak/recovery results. An unresolved core blocker keeps release acceptance blocked; a clearly labeled partial demonstration is not fulfillment of the required scope. REC-01 is advanced scope: deploy disabled until data rights, quality, safety and latency gates pass. Deterministic offline recommendations have no LLM token cost; if an AI assistant is introduced later, define evaluation, prompt/data security and token-cost budgets first.

## 7. Product-suggestion quality gate

Start with a deterministic baseline (featured/popular eligible items) and compare the selected similar-item strategy on a versioned, permissioned DAYMARK evaluation fixture. Target at least 20 source-product contexts spanning category, size/stock and cold-start cases; keep evaluation contexts separate from tuning where feasible. Report dataset/catalog/run hashes, label provenance and who reviewed it. Synthetic/agent labels must never be called human review.

Acceptance: 100% returned items satisfy channel/region/visibility/price eligibility, zero self/duplicate items for similar-product placement, and zero private/source-metadata leakage. Two team reviewers independently judge top-six clothing relevance with a written rubric (category/use/fit/style compatibility); target at least 80% acceptable suggestions AND no regression against the baseline on the same fixture; publish disagreement and adjudication. Retain the simpler baseline unless a more complex strategy demonstrates a measured benefit. This small review is a demo quality gate, not proof of sales uplift.

Where held-out interaction labels exist, report Recall@6/NDCG@6 and coverage for both baseline and selected algorithm; do not invent offline purchase labels from generated orders. No online conversion improvement is claimed without a controlled experiment. Report recommendation API p95, fallback rate, artifact size/build time and incremental resource cost. For non-LLM recommendations token cost is N/A. Personalization must additionally pass consent withdrawal and stale-profile suppression before activation.
