import type { DeckSlide } from "../../engine/types.ts"
import { OwnershipDiagram, SystemDiagram } from "./diagrams.tsx"

const evidence = "docs/report/aws-redeployment-main389e855-2026-11-09.md"

export const slides: DeckSlide[] = [
  {
    id: "cover",
    kicker: "DAYMARK · Scope revamp",
    title: "One brand. One warehouse. One money path.",
    lede:
      "A production-oriented MVP for a label that sells a daily uniform: nine use cases, COD only, manual fulfilment, and evidence before claims.",
    tone: "dark",
    layout: "cover",
    blocks: [
      {
        type: "stats",
        items: [
          {
            value: "09",
            label: "Use cases",
            note: "End to end, admin included",
          },
          {
            value: "01",
            label: "Warehouse",
            note: "Single location, manual carrier",
          },
          {
            value: "COD",
            label: "Money path",
            note: "No card data; cash reconciled daily",
          },
          {
            value: "USD 100",
            unit: "/mo",
            label: "Provisional ceiling",
            note: "A design ceiling, not a quote",
          },
        ],
      },
    ],
    notes: {
      say: [
        "Open with the rescope: this is not a rebuild, it is a narrower promise with evidence behind each part.",
        "The brand sells certainty; the system has to make certainty operational.",
      ],
      prove: [
        "Only the 9 November public check snapshot is live evidence. Everything else on this deck is labelled.",
      ],
      watch: [
        "Do not imply production traffic, 24×7 availability or a validated monthly cost.",
      ],
    },
    sources: ["docs/spec/01-business.md"],
  },
  {
    id: "brand-problem",
    kicker: "01 · Brand & problem",
    title: "A daily uniform promises certainty. The demo cannot keep it.",
    lede:
      "DAYMARK is for everyday movement between study, work and city life. Behind the page, stock, cash and support still depend on people remembering.",
    blocks: [
      {
        type: "split",
        ratio: "1:1",
        left: [
          {
            type: "points",
            items: [
              {
                term: "The brand",
                text:
                  "Clothing for the ordinary day: fewer pieces, better fits, a palette that survives seasons. The promise is not novelty; it is that the piece is there, in the right size, when it is needed.",
              },
              {
                term: "The customer",
                text:
                  "Buys on a phone, often pays cash on delivery, and expects a delivery window and a tracking link that resolves.",
              },
              {
                term: "The commercial test",
                text:
                  "Does the operation keep the promise at a cost the owner can defend?",
              },
            ],
          },
        ],
        right: [
          {
            type: "cards",
            items: [
              {
                eyebrow: "Failure 01",
                title: "Stock is a guess",
                body:
                  "Availability is derived from data nobody reconciles. Oversell is discovered at pick time, after the customer has paid.",
                badge: { label: "Gap", tone: "gap" },
              },
              {
                eyebrow: "Failure 02",
                title: "Cash is invisible",
                body:
                  "COD collected by the carrier is not matched to orders. Variance appears at month end, if at all.",
                badge: { label: "Gap", tone: "gap" },
              },
              {
                eyebrow: "Failure 03",
                title: "Support is the integration",
                body:
                  "Tracking and notifications are manual, so every exception becomes a ticket.",
                badge: { label: "Gap", tone: "gap" },
              },
            ],
          },
        ],
      },
    ],
    notes: {
      say: [
        "Frame the problem commercially, not as missing features: stock truth, cash truth, support load.",
        "The demo is convincing because it shows the happy path. The brand is damaged on the exception path.",
      ],
      prove: [
        "No claim that stock is currently accurate or that COD is reconciled. These are the gaps that justify the rescope.",
      ],
      watch: ["Avoid inventing conversion or revenue numbers."],
    },
    sources: [
      "docs/spec/01-business.md",
      "docs/spec/01-business.md",
    ],
  },
  {
    id: "evidence-baseline",
    kicker: "02 · Evidence baseline",
    title: "What is running — and what is still a claim.",
    lede:
      "The 9 November deployment is the starting line. It is a historical snapshot, not an availability promise.",
    blocks: [
      {
        type: "table",
        compact: true,
        head: ["Layer", "As deployed", "What it does and does not prove"],
        rows: [
          [
            "Storefront",
            "Next.js, 1 Fargate task, 1 vCPU",
            "Renders the journey; no headroom measured",
          ],
          [
            "API",
            "Medusa, 1 vCPU/task; scales from 1 to 2 at a 60% CPU target",
            "Release checks passed; baseline and peak untested",
          ],
          [
            "Worker",
            "1 Fargate task on the same image",
            "Process starts; no completed background job recorded",
          ],
          [
            "Data",
            "RDS PostgreSQL Single-AZ; Redis on one EC2 instance",
            "Durable for demo; no failover or restore drill",
          ],
          [
            "Media",
            "Private S3 through the backend proxy, no CDN",
            "Access control works; cache cost and latency unmeasured",
          ],
          [
            "Evidence",
            "18/18 public checks on 9 Nov 2026",
            "Point-in-time check; the demo lease may be off",
          ],
        ],
      },
      {
        type: "note",
        tone: "warn",
        title: "Not claimed",
        text:
          "Fresh load test, rollback drill, restore drill, 99.5% availability, RPO 60 min, RTO 120 min, or a USD 100/month actual cost.",
      },
    ],
    notes: {
      say: [
        "Separate what ran from what we hope: one API task at demo CPU, single-instance data services, media through the backend.",
        "The 18/18 check is a point-in-time verification, not a service-level commitment.",
      ],
      prove: [
        "Every number on this slide comes from the deployment record; none is a forecast.",
      ],
      watch: [
        "Do not upgrade the snapshot into a current status. The demo may already be shut down.",
      ],
    },
    sources: [
      evidence,
      "docs/report/aws-fargate-deployment-2026-11-08.md",
      "docs/spec/03-architecture.md",
    ],
  },
  {
    id: "personas",
    kicker: "03 · Users & jobs",
    title: "Four people decide whether the MVP works.",
    lede:
      "Each persona owns a required use case and a measurable operational outcome.",
    tone: "accent",
    blocks: [
      {
        type: "cards",
        columns: 4,
        items: [
          {
            eyebrow: "Customer",
            title: "Linh, 29",
            body:
              "Buys a capsule piece on a phone, pays cash on delivery. Needs true size availability, a clear delivery window, and a tracking link that resolves.",
            meta: "UC-2 – UC-5, UC-8",
          },
          {
            eyebrow: "Warehouse",
            title: "Minh",
            body:
              "Receives cartons, picks, packs and hands parcels to the carrier. Needs one queue and no double entry; scans become fulfilment truth.",
            meta: "UC-1, UC-6, UC-7",
          },
          {
            eyebrow: "Owner",
            title: "Hạnh",
            body:
              "Owns margin and cash. Needs stock accuracy, daily COD remittance matching, and cost per order inside a validated ceiling.",
            meta: "UC-9 · cost ceiling",
          },
          {
            eyebrow: "Support",
            title: "Trang",
            body:
              "Answers “where is my order?” from one timeline, resends a notification, and escalates a lost parcel without editing the database.",
            meta: "UC-8, UC-9",
          },
        ],
      },
    ],
    notes: {
      say: [
        "Walk the four people, not the feature list: customer, warehouse, owner, support.",
        "Every use case on the next slides has one of these people as its beneficiary.",
      ],
      prove: [
        "Persona jobs map directly to the nine required use cases and the COD reconciliation outcome.",
      ],
      watch: ["These are representative roles, not user-research findings."],
    },
    sources: ["docs/spec/01-business.md", "docs/spec/02-flows.md"],
  },
  {
    id: "scope-boundary",
    kicker: "04 · Scope boundary",
    title: "Draw the boundary where the evidence can reach.",
    lede:
      "Production-oriented, not enterprise-complete. Every exclusion has a named next step.",
    blocks: [
      {
        type: "split",
        ratio: "1:1",
        left: [
          {
            type: "points",
            items: [
              { term: "Brand & market", text: "One brand, one sales region, VND pricing." },
              {
                term: "Journeys",
                text: "Nine use cases end to end, including admin operations.",
              },
              {
                term: "Money",
                text: "COD only; no card data enters the system.",
              },
              {
                term: "Fulfilment",
                text: "Manual carrier handover; operator-entered tracking.",
              },
              {
                term: "Async",
                text: "Email notification through an outbox with retry and a DLQ.",
              },
              {
                term: "Shape",
                text: "Modular monolith: Next.js storefront, Medusa API, one worker.",
              },
            ],
          },
        ],
        right: [
          {
            type: "points",
            items: [
              {
                term: "Scale",
                text: "Multi-warehouse, multi-currency, tax engine.",
              },
              {
                term: "Payments",
                text: "Card acquiring, automated refunds, fraud scoring.",
              },
              {
                term: "Integrations",
                text: "Carrier APIs and live rate shopping.",
              },
              {
                term: "Architecture",
                text: "Microservices, a second broker, multi-region.",
              },
              {
                term: "Intelligence",
                text: "LLM-generated copy or recommendations in the request path.",
              },
              {
                term: "Claims",
                text: "24×7 availability; we measure scheduled service windows.",
              },
              {
                term: "Returns",
                text: "Manual exception in MVP; automated return flow is P5.",
              },
            ],
          },
        ],
      },
      {
        type: "note",
        tone: "info",
        title: "Five decisions",
        text:
          "Modular monolith · Medusa owns commerce truth · COD only · manual carrier · evidence-gated NFRs.",
      },
    ],
    notes: {
      say: [
        "Read the boundary as a set of decisions, not as missing ambition.",
        "The right column prevents accidental scope: no microservices, no card payments, no carrier integration.",
      ],
      prove: [
        "Every exclusion has a later phase or an explicit non-goal in the roadmap.",
      ],
      watch: [
        "Do not let 'out of scope' sound like the MVP is unfinished; it is the reason it can be verified.",
      ],
    },
    sources: [
      "docs/spec/01-business.md",
      "docs/spec/02-flows.md",
      "docs/spec/07-delivery.md",
    ],
  },
  {
    id: "system-shape",
    kicker: "05 · System shape",
    title: "Three deployable units. One system of record.",
    lede:
      "Next.js presents. Medusa owns commerce. One worker owns asynchronous work. Modules inside Medusa are code boundaries, not services.",
    blocks: [
      {
        type: "figure",
        render: () => <SystemDiagram />,
        caption:
          "Storefront, API and worker are separate Fargate services from one codebase. PostgreSQL is the only system of record; carrier handover and tracking entry are manual.",
      },
    ],
    notes: {
      say: [
        "Point at the boundary first: three deployable units, not a service map.",
        "Then point at the worker: asynchronous work is separate so a slow email never blocks checkout.",
      ],
      prove: [
        "Each API task has 1 vCPU; the service scales from one to two tasks at a 60% average CPU target. This is configuration, not a capacity result.",
      ],
      watch: [
        "Do not describe Medusa modules as microservices. They share one application and one database.",
      ],
    },
    sources: [
      "docs/spec/03-architecture.md",
      "docs/spec/03-architecture.md",
    ],
  },
  {
    id: "use-cases",
    kicker: "06 · Required functionality",
    title: "Nine use cases. Nothing decorative.",
    lede:
      "Grouped by actor. These IDs are reused by tests, evidence and the roadmap.",
    blocks: [
      {
        type: "cards",
        columns: 3,
        dense: true,
        items: [
          {
            eyebrow: "UC-1 · Admin",
            title: "Receive stock",
            body:
              "Admin records a supplier receipt; stock becomes sellable only after validation.",
            meta: "Inventory",
          },
          {
            eyebrow: "UC-2 · Customer",
            title: "Browse catalog",
            body:
              "Customer sees only sellable variants with server-calculated prices.",
            meta: "Catalog",
          },
          {
            eyebrow: "UC-3 · Customer",
            title: "Choose variant",
            body:
              "Size and colour availability is truthful at add-to-cart.",
            meta: "Product",
          },
          {
            eyebrow: "UC-4 · Customer",
            title: "Build cart",
            body:
              "Quantities, delivery method and COD total are server-owned.",
            meta: "Cart",
          },
          {
            eyebrow: "UC-5 · Customer",
            title: "Place COD order",
            body:
              "One idempotent confirmation creates one order and one reservation.",
            meta: "Checkout",
          },
          {
            eyebrow: "UC-6 · System",
            title: "Protect inventory",
            body:
              "Reservation is atomic; oversell returns a typed conflict, never a partial order.",
            meta: "Inventory",
          },
          {
            eyebrow: "UC-7 · Ops",
            title: "Fulfil manually",
            body:
              "Operator picks, packs and records carrier plus tracking.",
            meta: "Fulfilment",
          },
          {
            eyebrow: "UC-8 · Customer",
            title: "Track order",
            body:
              "Customer sees a timeline projected from order and fulfilment events.",
            meta: "Tracking",
          },
          {
            eyebrow: "UC-9 · Worker",
            title: "Notify & reconcile",
            body:
              "Confirmation and shipped mail retry; COD remittance is matched to orders.",
            meta: "Finance",
          },
        ],
      },
    ],
    notes: {
      say: [
        "Do not read all nine. Point out that stock receipt, checkout, fulfilment and COD reconciliation are all covered.",
        "The IDs are the vocabulary for tests and evidence; keep using them.",
      ],
      prove: [
        "Each use case has an owner, a data boundary and a test path in the spec.",
      ],
      watch: [
        "Nine use cases is the committed scope, not a backlog count. Adding one requires removing one.",
      ],
    },
    sources: ["docs/spec/02-flows.md", "docs/spec/01-business.md"],
  },
  {
    id: "flow-stock",
    kicker: "07 · Flow A · Stock to shelf",
    title: "Stock becomes sellable through one workflow.",
    lede:
      "Manual receipt, validated once, projected into availability. No spreadsheet is authoritative.",
    blocks: [
      {
        type: "flow",
        steps: [
          {
            label: "Admin",
            title: "Create receipt",
            detail: "Supplier, SKU, quantity, cost; client receipt key.",
          },
          {
            label: "API",
            title: "Validate",
            detail: "Variant exists, quantity > 0, key not reused.",
          },
          {
            label: "Workflow",
            title: "receiveStockWorkflow",
            detail: "One transaction across stock and audit.",
          },
          {
            label: "Inventory",
            title: "Increase stocked",
            detail: "Available = stocked − reserved at the warehouse.",
          },
          {
            label: "Catalog",
            title: "Project availability",
            detail: "Storefront reads sellable variants.",
          },
        ],
      },
      {
        type: "split",
        ratio: "1:1",
        left: [
          {
            type: "points",
            items: [
              {
                term: "Idempotent",
                text: "Replaying the receipt key returns the same receipt.",
              },
              {
                term: "Non-negative",
                text: "Corrections are new adjustments, never edits.",
              },
              {
                term: "Auditable",
                text: "Actor, timestamp and reason on every change.",
              },
            ],
          },
        ],
        right: [
          {
            type: "note",
            tone: "fact",
            title: "Failure path",
            text:
              "Validation fails before any write. One transaction means there is nothing to compensate.",
          },
          {
            type: "note",
            tone: "info",
            title: "Why this matters",
            text:
              "Catalog availability is derived from inventory truth, not copied into a second table that can drift.",
          },
        ],
      },
    ],
    notes: {
      say: [
        "Stock receipt is the front of the whole chain; if this is wrong, every later slide is theatre.",
        "The workflow is the only path to a stock change. Admin UI and imports both call it.",
      ],
      prove: [
        "Receipt idempotency, non-negative stock and audit fields are the three invariants to test.",
      ],
      watch: [
        "Manual receipt does not mean unvalidated receipt. The operator enters data; the workflow validates it.",
      ],
    },
    sources: ["docs/spec/02-flows.md", "docs/spec/04-data-api.md"],
  },
  {
    id: "flow-order",
    kicker: "08 · Flow B · Browse to COD order",
    title: "The browser proposes. The backend decides.",
    lede:
      "Prices, totals and availability are computed server-side; confirmation is one transaction with a compensation path.",
    blocks: [
      {
        type: "flow",
        dense: true,
        steps: [
          {
            label: "Browse",
            title: "Cached read",
            detail: "Catalog projected from sellable variants.",
          },
          {
            label: "Product",
            title: "Choose variant",
            detail: "Size availability checked at add-to-cart.",
          },
          {
            label: "Cart",
            title: "Server totals",
            detail: "Delivery and COD total computed, never trusted.",
          },
          {
            label: "Confirm",
            title: "Idempotency",
            detail: "Key plus payload hash, bound to customer and cart.",
          },
          {
            label: "COD",
            title: "Authorize",
            detail: "Pending capture; no gateway call.",
          },
          {
            label: "Order",
            title: "Create + reserve",
            detail: "One order, one reservation; release on failure.",
          },
        ],
      },
      {
        type: "split",
        ratio: "1:1",
        left: [
          {
            type: "points",
            items: [
              {
                term: "Price drift",
                text: "Client totals are ignored; mismatch returns 409 with a recomputed cart.",
              },
              {
                term: "Replay",
                text: "Same key and payload return the same order.",
              },
              {
                term: "Conflict",
                text: "Different payload returns 409; no second order.",
              },
              {
                term: "Out of stock",
                text: "No order, reservation released, typed error.",
              },
            ],
          },
        ],
        right: [
          {
            type: "table",
            compact: true,
            head: ["Failure", "Result"],
            rows: [
              ["Payment declined", "No order, no reservation"],
              ["Timeout after authorize", "Reconcile by provider reference"],
              ["Duplicate submit", "One order, one replay"],
              ["Notification fails", "Order stands; outbox retries"],
            ],
          },
        ],
      },
    ],
    notes: {
      say: [
        "The confirmation step is the only place an order is created. Everything before it is reversible.",
        "The failure table is the demo script: run the duplicate submit and the out-of-stock case.",
      ],
      prove: [
        "Idempotency and reservation are enforced in PostgreSQL, not by disabling a button in the UI.",
      ],
      watch: [
        "COD authorization is a local state transition, not a real payment. Say that plainly.",
      ],
    },
    sources: ["docs/spec/02-flows.md", "docs/spec/05-testing.md"],
  },
  {
    id: "flow-post-purchase",
    kicker: "09 · Flow C · After the order",
    title: "Fulfilment, tracking and cash close the loop.",
    lede:
      "The operational tail is where the demo leaked value. Every step now has an owner and an event.",
    blocks: [
      {
        type: "flow",
        steps: [
          {
            label: "Ops",
            title: "Pick & pack",
            detail: "Fulfilment per order line; duplicate scans are idempotent.",
          },
          {
            label: "Carrier",
            title: "Manual handover",
            detail: "Tracking code entered by the operator.",
          },
          {
            label: "Customer",
            title: "Track",
            detail: "Timeline projected from order and fulfilment events.",
          },
          {
            label: "Worker",
            title: "Notify",
            detail: "Outbox to email; retry with backoff; DLQ on exhaustion.",
          },
          {
            label: "Owner",
            title: "Reconcile COD",
            detail: "Daily remittance matched to delivered orders.",
          },
        ],
      },
      {
        type: "split",
        ratio: "1:1",
        left: [
          {
            type: "points",
            items: [
              {
                term: "Expected",
                text: "Sum of delivered, unremitted COD orders.",
              },
              {
                term: "Remitted",
                text: "Carrier statement lines with a unique reference.",
              },
              {
                term: "Variance",
                text: "Expected minus remitted; an exception, not an adjustment.",
              },
            ],
          },
        ],
        right: [
          {
            type: "note",
            tone: "warn",
            title: "MVP boundary",
            text:
              "No carrier API. Ops enters tracking events; support handles lost parcels manually. Automated returns are P5.",
          },
          {
            type: "note",
            tone: "fact",
            title: "Stock truth",
            text:
              "Reservation converts to a deduction at fulfilment. Cancellation releases it; nothing edits stock directly.",
          },
        ],
      },
    ],
    notes: {
      say: [
        "The order is not done at checkout. The loop closes when the parcel is delivered and the cash is matched.",
        "Tracking is a projection; there is no second status database to drift.",
      ],
      prove: [
        "The reconciliation view compares expected COD to remitted lines and flags variance for the owner.",
      ],
      watch: [
        "Do not claim carrier integration. This is deliberately manual for the MVP.",
      ],
    },
    sources: [
      "docs/spec/02-flows.md",
      "docs/spec/04-data-api.md",
      "docs/spec/07-delivery.md",
    ],
  },
  {
    id: "ownership",
    kicker: "10 · Ownership",
    title: "One system of record. Everyone else projects.",
    lede:
      "A module that writes another module's tables is a defect, even when the screen looks right.",
    blocks: [
      {
        type: "figure",
        render: () => <OwnershipDiagram />,
        caption:
          "Medusa core owns product, price, cart, order, payment, inventory and fulfilment. Custom modules own idempotency keys, COD remittances and delivery evidence. Next.js owns only UI state.",
      },
    ],
    notes: {
      say: [
        "Ownership is the architecture: follow the tables, not the folders.",
        "The storefront reads and acts through the Store API; it never becomes a second source of commerce truth.",
      ],
      prove: [
        "Custom modules extend Medusa through services and workflows. Redis is coordination, S3 is media, and neither is durable business truth.",
      ],
      watch: [
        "A shortcut that writes an order table directly is a schema dependency that will break on upgrade.",
      ],
    },
    sources: [
      "docs/spec/04-data-api.md",
      "docs/spec/03-architecture.md",
    ],
  },
  {
    id: "contracts",
    kicker: "11 · Contracts",
    title: "Four seams, four reviewable types.",
    lede: "If a boundary cannot be typed and tested, it is not a boundary.",
    blocks: [
      {
        type: "grid",
        columns: 2,
        blocks: [
          {
            type: "code",
            title: "DTO · confirmation",
            lines: [
              "type ConfirmOrderRequest = {",
              "  cartId: string",
              "  idempotencyKey: string",
              "  shippingMethodId: string",
              "  address: AddressInput",
              "}",
              "",
              "type ConfirmOrderResult =",
              '  | { type: "order"; orderId: string }',
              '  | { type: "conflict"; code: ConflictCode }',
            ],
          },
          {
            type: "code",
            title: "Workflow · order + reserve",
            lines: [
              "confirmCodOrderWorkflow",
              "  .step(validateCart)",
              "  .step(authorizeCod)",
              "  .step(createOrder)",
              "  .step(reserveInventory)",
              "",
              "// compensation on failure",
              "// releaseInventory",
              "// cancelPayment",
            ],
          },
          {
            type: "code",
            title: "Module · reconciliation",
            lines: [
              "CodReconciliationService",
              "  recordRemittance(input)",
              "  matchOrder(orderId): MatchResult",
              "  listVariance(day): Variance[]",
              "",
              "// unique remittance reference",
              "// variance is reported, never patched",
            ],
          },
          {
            type: "code",
            title: "Provider · COD",
            lines: [
              "class CodPaymentProvider",
              "  implements PaymentProvider {",
              "  async authorizePayment(input) {",
              '    return { status: "pending",',
              "      reference: input.sessionId }",
              "  }",
              "}",
            ],
          },
        ],
      },
    ],
    notes: {
      say: [
        "Four seams: what the client sends, how the workflow composes, what the custom module owns, and how COD plugs into payment.",
        "The provider looks almost empty on purpose: COD has no gateway call.",
      ],
      prove: [
        "Each seam has a typed shape, a failure result and a test path. The DTO's conflict union is not an exception string.",
      ],
      watch: [
        "Do not let the typed DTO imply the client is trusted. The backend recalculates every amount.",
      ],
    },
    sources: ["docs/spec/04-data-api.md", "docs/spec/03-architecture.md"],
  },
  {
    id: "reliability",
    kicker: "12 · Reliability",
    title: "Duplicate money is a data-model problem.",
    lede:
      "The async path may retry; the sync path may be double-clicked. Both are normal traffic.",
    blocks: [
      {
        type: "split",
        ratio: "1:1",
        left: [
          {
            type: "points",
            items: [
              {
                term: "Scoped keys",
                text: "Idempotency keys bind customer, cart, amount and payload hash; unique in PostgreSQL.",
              },
              {
                term: "One order",
                text: "Concurrent duplicates resolve by unique constraint, not lock timing.",
              },
              {
                term: "Timeout",
                text: "Authorization and order creation are separate; reconcile, never blindly retry.",
              },
              {
                term: "Outbox",
                text: "Rows are written in the order transaction; delivery is at-least-once with dedupe.",
              },
              {
                term: "Compensation",
                text: "Inventory is released by a compensating step, never by editing stock.",
              },
            ],
          },
        ],
        right: [
          {
            type: "table",
            compact: true,
            head: ["Duplicate scenario", "Expected result"],
            rows: [
              ["Same key, same payload", "Replay; one order, one reservation"],
              ["Same key, different payload", "409; no new order"],
              ["Two concurrent confirms", "One order, one replay"],
              ["Authorize ok, complete times out", "Reconcile by provider ref"],
              ["Notification retry", "One delivered mail, one dedupe record"],
              ["Duplicate fulfilment scan", "One shipment, idempotent event"],
              ["Duplicate remittance", "Rejected by unique reference"],
            ],
          },
        ],
      },
      {
        type: "note",
        tone: "info",
        text:
          "Async is at-least-once. Every consumer is idempotent; the DLQ is an alert, not storage.",
      },
    ],
    notes: {
      say: [
        "Retries are expected. The system must make the second attempt harmless.",
        "Walk the duplicate table quickly; the point is that each row has a deterministic result.",
      ],
      prove: [
        "Uniqueness lives in PostgreSQL, so two processes cannot both win a race.",
      ],
      watch: [
        "Do not claim exactly-once delivery. The design is at-least-once plus dedupe.",
      ],
    },
    sources: ["docs/spec/05-testing.md", "docs/spec/04-data-api.md"],
  },
  {
    id: "nfr-workload",
    kicker: "13 · Workload & NFRs",
    title: "A target needs a test, a window and an owner.",
    lede:
      "Everything here is a design target unless marked verified. Demo traffic is not used to infer capacity or availability.",
    blocks: [
      {
        type: "table",
        compact: true,
        head: ["Measure", "Target", "Window", "Status"],
        rows: [
          [
            "Baseline browsing",
            "30 RPS, p95 < 600 ms",
            "10 min sustained",
            {
              text: "Target — not measured",
              badge: { label: "Target", tone: "target" },
            },
          ],
          [
            "Checkout completion",
            "3 journeys/s, p95 < 1,500 ms, errors < 1%",
            "5 min sustained",
            {
              text: "Target — not measured",
              badge: { label: "Target", tone: "target" },
            },
          ],
          [
            "Peak browsing",
            "150 RPS (5×), p95 <1,200 ms, failures <1%",
            "5 min peak + 5 min recovery",
            {
              text: "Not achieved; proposed",
              badge: { label: "Proposed", tone: "proposed" },
            },
          ],
          [
            "Availability",
            "99.5% over scheduled service windows",
            "Monthly",
            {
              text: "Target — not 24×7",
              badge: { label: "Target", tone: "target" },
            },
          ],
          [
            "Recovery",
            "RPO ≤ 60 min · RTO ≤ 120 min",
            "Drill",
            {
              text: "Target — unverified",
              badge: { label: "Gap", tone: "gap" },
            },
          ],
          [
            "Cost",
            "≤ USD 100/month",
            "Monthly run rate",
            {
              text: "Provisional ceiling",
              badge: { label: "Provisional", tone: "proposed" },
            },
          ],
        ],
      },
      {
        type: "note",
        tone: "warn",
        text:
          "No load, failover or restore test has run in this cycle. Peak capacity, availability and recovery are not inferred from the 9 November snapshot.",
      },
    ],
    notes: {
      say: [
        "Read the table as commitments under test, not results.",
        "Peak is a proposed test at 150 browsing RPS; nobody has achieved it.",
        "Availability is measured over scheduled service windows, not presented as 24×7.",
        "The business demo uses 24–36 products; pagination correctness uses at least 120 synthetic matches; the initial capacity experiment uses a separate 1,000-product catalog. None is the current seed count.",
      ],
      prove: [
        "Each row names the window and the status. RPO and RTO are targets until a restore drill is timed.",
      ],
      watch: [
        "If asked for current throughput, say it has not been measured in this cycle. Do not extrapolate.",
      ],
    },
    sources: [
      "docs/spec/05-testing.md",
      "docs/report/aws-redeployment-main389e855-2026-11-09.md",
    ],
  },
  {
    id: "test-security",
    kicker: "14 · Quality & security",
    title: "Tests that can fail. Controls that can be shown.",
    lede:
      "The acceptance plan pairs each required use case with success, failure and authorization checks.",
    blocks: [
      {
        type: "split",
        ratio: "1:1",
        left: [
          {
            type: "table",
            compact: true,
            head: ["Layer", "Evidence produced"],
            rows: [
              ["Unit (Node)", "Routing, keyboard map, state guards"],
              ["Workflow", "Replay, compensation, stock invariants"],
              ["HTTP", "Nine UCs, 409 paths, auth matrix"],
              ["E2E browser", "Three checkout journeys incl. duplicate submit"],
              ["Load (k6)", "30 RPS baseline, 3 checkout/s, 150 proposed"],
              ["Recovery", "Restore and image rollback, timed"],
            ],
          },
        ],
        right: [
          {
            type: "points",
            items: [
              {
                term: "Authorization",
                text: "Admin and support permissions enforced server-side, not in the UI.",
              },
              {
                term: "Scope",
                text: "COD only, so no card data and no PCI surface.",
              },
              {
                term: "Secrets",
                text: "Platform secret store; no fallback JWT or cookie secrets.",
              },
              {
                term: "Edge",
                text: "CORS allowlist, rate limits on auth and confirmation, signed media access.",
              },
              {
                term: "Logs",
                text: "PII minimised; request IDs instead of payloads.",
              },
              {
                term: "Supply chain",
                text: "Dependency and image scanning; immutable digests.",
              },
            ],
          },
        ],
      },
      {
        type: "note",
        tone: "warn",
        text:
          "Exit criterion: a failed gate blocks deploy. A skipped drill is reported as a gap, not as a pass.",
      },
    ],
    notes: {
      say: [
        "The test ladder runs from pure helpers to HTTP and browser journeys; each layer produces evidence.",
        "Security controls are listed because they can be inspected, not because a checklist was completed.",
      ],
      prove: [
        "Three checkout journeys are the minimum browser proof: success, failure with retry, duplicate submit.",
      ],
      watch: [
        "No penetration test has been run. Do not present the control list as an audit result.",
      ],
    },
    sources: [
      "docs/spec/05-testing.md",
      "docs/spec/06-operations.md",
    ],
  },
  {
    id: "operate",
    kicker: "15 · Operate",
    title: "Ship, see, roll back, and know the bill.",
    lede:
      "The path back is part of the design. Rollback and cost are not afterthoughts.",
    blocks: [
      {
        type: "flow",
        dense: true,
        steps: [
          {
            label: "CI",
            title: "Lint, typecheck, tests",
            detail: "Gates fail closed.",
          },
          {
            label: "Build",
            title: "Immutable digest",
            detail: "Image published to ECR by digest.",
          },
          {
            label: "Staging",
            title: "Smoke the nine UCs",
            detail: "Automated HTTP and browser checks.",
          },
          {
            label: "Approve",
            title: "Human gate",
            detail: "Change set and evidence reviewed.",
          },
          {
            label: "Deploy",
            title: "Rolling + breaker",
            detail: "Verify health, then shift traffic.",
          },
        ],
      },
      {
        type: "split",
        ratio: "1:1",
        left: [
          {
            type: "points",
            items: [
              {
                term: "Logs",
                text: "Structured, request_id, no payloads.",
              },
              {
                term: "Metrics",
                text: "RED per route and per workflow.",
              },
              {
                term: "Alarms",
                text: "5xx, p95, outbox age, DLQ depth, stock mismatch, reconciliation variance.",
              },
              {
                term: "Rollback",
                text: "Re-point the service to the previous digest; migrations are forward-only.",
              },
              {
                term: "Target",
                text: "Rollback in under 15 minutes, measured. Currently unverified.",
              },
            ],
          },
        ],
        right: [
          {
            type: "points",
            items: [
              {
                term: "Drivers",
                text: "Three Fargate services, ALB, RDS Single-AZ, Redis EC2, S3, logs.",
              },
              {
                term: "Ceiling",
                text: "USD 100/month is a design ceiling, not a quote.",
              },
              {
                term: "Validation",
                text: "Thirty-day actuals plus owner sign-off.",
              },
              {
                term: "Levers",
                text: "Scheduled windows, API right-sizing after load test, log retention, S3 lifecycle.",
              },
              {
                term: "Excluded",
                text: "Peak headroom, CDN, multi-AZ.",
              },
            ],
          },
        ],
      },
      {
        type: "note",
        tone: "info",
        text:
          "Availability is measured in scheduled windows; outside them the demo is intentionally off.",
      },
    ],
    notes: {
      say: [
        "The pipeline is deliberately boring: gated, immutable, observable, reversible.",
        "Rollback and restore are design requirements; neither has been drilled yet.",
      ],
      prove: [
        "Image digests make rollback a re-point operation, not a rebuild. Forward-only migrations keep replay safe.",
      ],
      watch: [
        "Do not present the USD 100 ceiling as a validated bill. It is pending actuals and owner sign-off.",
      ],
    },
    sources: [
      "docs/spec/06-operations.md",
      "docs/spec/06-operations.md",
      "docs/spec/05-testing.md",
    ],
  },
  {
    id: "recommendations",
    kicker: "16 · Recommendations",
    title: "Recommend, but do not generate.",
    lede:
      "Recommendations stay deterministic and evaluable. An LLM adds latency, cost and unverifiable output to a path that needs none.",
    blocks: [
      {
        type: "split",
        ratio: "1:1",
        left: [
          {
            type: "points",
            items: [
              {
                term: "Signals",
                text: "Availability, margin guardrail, popularity, recency — all explainable.",
              },
              {
                term: "Eligibility",
                text: "Exclude out-of-stock and restricted items before ranking.",
              },
              {
                term: "Fallback",
                text: "Popular in category when history is thin; no cold-start silence.",
              },
              {
                term: "Flag",
                text: "Ship behind a flag; A/B is a later decision with traffic we do not have.",
              },
            ],
          },
        ],
        right: [
          {
            type: "table",
            compact: true,
            head: ["Evaluation", "Signal"],
            rows: [
              ["Offline replay", "precision@k, recall@k"],
              ["Coverage", "share of catalog recommended"],
              ["Cold start", "fallback rate for new SKUs"],
              ["Guardrail", "missed-stock rate"],
              ["Online later", "CTR, add-to-cart, return rate"],
            ],
          },
        ],
      },
      {
        type: "note",
        tone: "warn",
        text:
          "Activation gate: 100% eligible items, zero self/duplicates or metadata leakage, and at least 80% reviewer-acceptable top-six suggestions with no baseline regression. Token cost is N/A for non-LLM ranking. No LLM copywriting or generative descriptions in this MVP.",
      },
    ],
    notes: {
      say: [
        "Recommendations are a ranking problem before they are a model problem.",
        "Deterministic scoring is explainable, cheap and testable; an LLM is none of those by default.",
      ],
      prove: [
        "The evaluation plan exists even before the feature is enabled: offline replay, coverage, cold start, guardrail.",
      ],
      watch: [
        "Do not promise personalisation. This is a P5 decision contingent on traffic and cost evidence.",
      ],
    },
    sources: [
      "docs/spec/05-testing.md",
      "docs/recommendation/spec.md",
    ],
  },
  {
    id: "roadmap",
    kicker: "17 · Roadmap & next demo",
    title: "Prove the operating model before adding surface.",
    lede:
      "Five phases, each with an exit condition. The next demo is the whole loop with evidence attached.",
    tone: "dark",
    blocks: [
      {
        type: "roadmap",
        phases: [
          {
            phase: "P1",
            title: "Truth & guardrails",
            body:
              "Idempotency ledger, inventory invariants, state-machine tests, evidence register.",
            exit: "Exit: duplicate and oversell tests fail closed.",
          },
          {
            phase: "P2",
            title: "Post-purchase",
            body:
              "Fulfilment handover, tracking projection, notification outbox, COD reconciliation.",
            exit: "Exit: one order closes end to end.",
          },
          {
            phase: "P3",
            title: "Performance proof",
            body:
              "k6 baseline 30 RPS, checkout 3/s, proposed peak 150; right-size the API.",
            exit: "Exit: targets measured or waived by owner.",
          },
          {
            phase: "P4",
            title: "Operate",
            body:
              "CI gates, alarms, rollback and restore drills, thirty-day cost actuals.",
            exit: "Exit: rollback and restore timed.",
          },
          {
            phase: "P5",
            title: "Experience & recommendations",
            body:
              "Editorial polish, deterministic recommendations, offline evaluation.",
            exit: "Exit: evaluation report, flag decision.",
          },
        ],
      },
      {
        type: "note",
        tone: "warn",
        title: "Gaps & next demo",
        text:
          "Gaps: no fresh load test, no rollback or restore drill, no carrier API, cost unvalidated. Next demo: stock receipt → COD order → fulfilment → tracking → notification → reconciliation, with load and rollback evidence attached.",
      },
    ],
    notes: {
      say: [
        "Close on order, not on a feature list: truth, post-purchase, performance proof, operate, then experience.",
        "The next demo must show the whole loop and attach the evidence that is still missing.",
      ],
      prove: [
        "Each phase has an exit condition; none is declared done because code exists.",
      ],
      watch: [
        "Do not imply the P3 peak test has passed, or that the demo is always available.",
      ],
    },
    sources: [
      "docs/spec/07-delivery.md",
      "docs/spec/05-testing.md",
      "docs/report/aws-redeployment-main389e855-2026-11-09.md",
    ],
  },
]
