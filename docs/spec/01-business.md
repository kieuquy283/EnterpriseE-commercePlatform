# DAYMARK — business specification

Status: chosen product direction for the next implementation stage, dated 14 November 2026. This specification defines the intended MVP; it does not certify that every requirement is implemented. Acceptance evidence belongs in [testing](05-testing.md). The project is an educational production-oriented MVP, not a complete enterprise retailer.

## Business problem and value

DAYMARK is a fictional Vietnamese direct-to-consumer clothing brand for young adults moving between study, work and everyday city life. Its proposition is versatile everyday clothing with consistent fit, clear product information and dependable ordering. Brand line: **Made for the everyday.** The confirmed emblem is a swallow representing everyday movement; see [brand assets](../brand/README.md). The brand name and assets are project identity, not a claim of trademark or domain clearance.

Customers need to find clothing that fits their style and size, understand the final price and availability, place an order once, and know what happens afterward. Store staff need one authoritative catalog, stock and order record. Administrators need controlled access, repeatable releases and evidence that the service remains correct under promotion traffic and dependency failures.

The primary business outcome is one complete, observable journey: **stock receipt → product publication → discovery → checkout → order → fulfillment → delivery/COD reconciliation**. Product suggestions support discovery; they never become a prerequisite for buying.

## Scope and operating assumptions

| Decision | MVP boundary |
| --- | --- |
| Market | Vietnam, VND; one fictional seller and one online sales channel |
| Customer | Adults buying everyday clothing; guest discovery and authenticated account journeys |
| Assortment | Target 24–36 clothing products across tees, shirts, trousers and light layers, with size/color variants; bags/caps optional |
| Collections | Daily Essentials, Workday and Off Hours |
| Inventory | One warehouse stock location; staff record receipts and adjustments; no supplier procurement or warehouse automation |
| Delivery | Staff-operated fulfillment and manual external-carrier handoff; tracking information recorded when available; no live carrier booking integration |
| Payment | COD for the public demo; existing simulator only in isolated non-production acceptance tests; no real card collection |
| Suggestions | Non-personalized similar/popular sellable products first; consent-based personalization remains gated until separately accepted |
| Promotions | One bounded campaign scenario with explicit validity and inventory rules; no marketplace, loyalty or flash-sale platform |
| Returns | Staff-assisted cancellation and a documented return/refund exception procedure; no self-service exchange portal |

Workload, availability, recovery and budget targets are defined in [testing](05-testing.md) and [operations](06-operations.md), not inferred from product count. The target assortment is a fixture requirement, not current seed content. The inspected seed creates three generic products without product images. It does not create the first administrator.

## Users, stakeholders and permissions

| Actor | Business responsibility | Access boundary |
| --- | --- | --- |
| Customer | Discover products, manage own cart/account, place orders and view own status | Public catalog; authenticated personal records; never another customer's data |
| Store / Operations Staff | Maintain catalog/prices, receive stock, review orders, fulfill parcels and reconcile manual delivery/COD evidence | Authenticated Medusa Admin; only required functions and customer data |
| Administrator | Provision staff access, configure providers, approve releases, monitor service and manage recovery | Separate staff identity from customer identity; infrastructure privileges are not customer/Admin session privileges |
| External carrier | Physically transport parcels and return delivery/COD evidence | Manual business handoff in MVP; no application credentials |
| Project team / reviewer | Implement, measure and defend requirements | Synthetic test fixtures and scrubbed evidence; no production secrets or customer exports |

Roles describe required responsibilities. Fine-grained staff authorization is an acceptance item: the presence of a Medusa login screen does not prove a configured permission model. If the installed Admin cannot enforce a required separation, document the verified limitation and restrict the demo to approved operators rather than inventing unsupported roles.

## Business requirements

| ID | Required outcome | Success evidence |
| --- | --- | --- |
| BR-01 | Customers can choose a specific sellable clothing variant with trustworthy information | Catalog images, size/color, price and availability verified against the chosen fixtures |
| BR-02 | A purchase produces one consistent order, payment record and inventory outcome | End-to-end checkout plus retry and contention reconciliation |
| BR-03 | Staff can move an order from receipt through fulfillment and explain delivery/payment status | Recorded Admin journey and manual carrier/COD handoff |
| BR-04 | Customers can see their order progress and receive an asynchronous confirmation | Account status and delivered test notification; provider failure does not remove the order |
| BR-05 | A promotion remains usable within a measured workload and fails predictably beyond it | Load, spike and recovery evidence with business invariants |
| BR-06 | Operators can deploy, secure, observe and recover the cloud service within declared limits | CI/CD, access tests, dashboard, rollback/restore and cost records |
| BR-07 | Suggestions improve product discovery without compromising commerce correctness or privacy | Relevant permitted candidates, eligibility checks, fallback and evaluation results |

## Functional requirements and flow ownership

| ID | Requirement | Business link | Flow and acceptance boundary |
| --- | --- | --- | --- |
| FR-01 | Register, sign in/out and access an owned customer account | BR-02, BR-06 | [FLOW-01](02-flows.md#flow-01--registration-and-login): valid/invalid credentials, session and cross-customer access |
| FR-02 | Browse collections, search products and select variants | BR-01, BR-07 | [FLOW-02](02-flows.md#flow-02--catalog-search-and-suggestions): correct full-result filtering/pagination, media and unavailable-product exclusion |
| FR-03 | Create and maintain a cart with correct variant quantities and authoritative totals | BR-02 | [FLOW-03](02-flows.md#flow-03--shopping-cart): quantity/update/remove, unavailable stock and price refresh |
| FR-04 | Validate checkout and create one recoverable order outcome | BR-02 | [FLOW-04](02-flows.md#flow-04--checkout-and-order-creation): address/shipping validation, timeout/retry and concurrent completion |
| FR-05 | Represent COD and test payment success/failure without duplicate payment/order effects | BR-02 | [FLOW-05](02-flows.md#flow-05--payment-and-duplicate-handling): simulator isolated from production, replay and reconciliation |
| FR-06 | Receive, adjust, reserve, fulfill and release stock at the single warehouse | BR-01, BR-02, BR-03 | [FLOW-06](02-flows.md#flow-06--warehouse-and-inventory): stock contention, cancellation and adjustment audit |
| FR-07 | Expose accurate order/fulfillment/payment progress and operate manual shipment tracking | BR-03, BR-04 | [FLOW-07](02-flows.md#flow-07--fulfillment-and-order-status): Admin processing and customer ownership checks |
| FR-08 | Send customer confirmation asynchronously with bounded retry and duplicate protection | BR-04, BR-06 | [FLOW-08](02-flows.md#flow-08--customer-notification): success, provider outage and repeated event |
| FR-09 | Administer catalog/orders/stock and produce basic operational reports | BR-03, BR-05, BR-06 | [FLOW-09](02-flows.md#flow-09--administration-and-reporting): access control, totals reconciliation and operator actions |

All nine use cases are core acceptance scope. Suggestions are the chosen advanced feature, not an AI shopping assistant. Suggested items can be deterministic; no generative AI dependency or token-cost claim is required for the initial version.

## Business rules

| ID | Rule |
| --- | --- |
| RULE-01 | A purchasable unit is an identified variant/SKU, not only a product title. Size/color stock must reconcile to the chosen warehouse. |
| RULE-02 | Medusa is authoritative for price, promotion eligibility, shipping, order and inventory decisions. Browser totals are provisional. VND amounts use the installed Medusa convention, verified by tests. |
| RULE-03 | Price/promotion/availability are revalidated before order completion. An expired discount or changed price must not silently create a different purchase; show the reconciled result and require the appropriate customer confirmation. |
| RULE-04 | Backorders are disabled for the acceptance clothing fixtures. Successful purchases may not exceed sellable stock. Define and test the actual reservation/decrement/release timing of the installed Medusa workflows. |
| RULE-05 | A completion retry for the same logical purchase must resolve to its existing outcome or an explicit recoverable conflict; it must not create a second charge/order. A fresh cart is a different purchase. |
| RULE-06 | COD order placement is not cash collection. Payment, order, fulfillment and physical-delivery states are distinct. Mark collection only after authorized staff verify collection evidence. |
| RULE-07 | Cancellation before shipment releases applicable reservations through supported commerce operations. Shipped orders use the documented exception/return procedure; do not manufacture a cancellation by directly changing database rows. |
| RULE-08 | Returned items are restocked only after staff inspect and accept their condition. Any refund/reconciliation is distinct from stock adjustment; record the disposition and reason. |
| RULE-09 | Notifications and suggestions must not be required to commit a valid order. A notification failure must remain retryable and visible to operations. |
| RULE-10 | Suggestions show only permitted, visible, priced and currently eligible products. The recommendation artifact never overrides native commerce validation. |
| RULE-11 | Customer identity comes from verified server authentication. Staff identities are separate; no public admin registration, shared default password or secret in source. |
| RULE-12 | Images must be owned/licensed or purpose-created. Private customer documents are never uploaded to the public image prefix. H&M research artifacts require their existing release/privacy gates before public use. |

## Boundaries deliberately excluded

Multi-vendor marketplace, multi-warehouse allocation, procurement/ERP, POS synchronization, automated courier integration, real-card processing, loyalty, self-service exchanges, international tax and generative shopping chat are outside this MVP. These are conscious boundaries; required core flows above cannot be deferred merely because they are inconvenient.

## Implementation versus acceptance

| Area | Inspected baseline | What the next stage must establish |
| --- | --- | --- |
| Commerce | Next.js calls Medusa for account, catalog, cart and checkout | Complete DAYMARK fixtures and a current browser-to-Admin journey |
| Admin/warehouse | Medusa core and seeded location/stock are present | First admin provisioning, permitted staff operations and fulfillment/COD reconciliation evidence |
| Payment | COD label and non-production simulator exist | Duplicate/retry and failure invariants in the selected environment |
| Suggestions | Custom modules/APIs and offline tooling exist; deployed flags previously disabled | Safe DAYMARK candidate input, evaluation and explicit activation gate |
| Notifications | No configured customer-email provider established by this specification | Asynchronous confirmation implementation and provider-failure demonstration |
| Cloud | Dated full-stack deployment evidence exists | Current release/deployment state must be checked; historical success is not uptime or capacity proof |

The implementation order and definition of done are linked from the documentation index. Component responsibilities live in [architecture](03-architecture.md); storage and contracts live in [data/API](04-data-api.md). Changes to these business boundaries require a reviewed specification update and corresponding acceptance tests.

## Basic operational reports

FR-09 must show a date-bounded order count/value by status, pending fulfillment workload and low-stock variants against a declared threshold. Use Vietnam business timezone and label the interval. Reconcile totals to synthetic fixture orders, including cancellations/returns. COD order value is not collected revenue: report collected amounts separately only when verified collection evidence exists. Medusa Admin screens or a small export can satisfy the MVP; no analytics warehouse or custom BI service is required.
