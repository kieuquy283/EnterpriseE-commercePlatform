# Week 4 — Payment Success/Failure Design and Checkout Integration

**Status:** Proposed design / UI integration scaffold. **Not** an assertion that
the Medusa backend simulator exists or has passed payment tests. The current
baseline on `main` supports COD with `pp_system_default` only.

## Scope and boundaries

- Storefront: Next.js checkout components, Server Actions, Medusa JS SDK.
- Medusa Store API: payment-provider listing, payment-session initialization,
  `POST /store/carts/:id/complete`, and order retrieval.
- Proposed extension owned by backend: a custom Medusa **Payment Module Provider**
  that simulates authorization success/failure **without charging real money**.
- The Storefront does not create Order rows, modify Inventory, or set payment
  status directly. Medusa is the commerce authority.
- The COD provider stays available and unchanged. The simulator is **opt-in**,
  limited to development/staging/demo; the backend must enforce this restriction
  independently of any UI environment flag.

## Payment Success Sequence Diagram — target design

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant UI as Next.js Checkout UI
    participant Action as Next.js Server Actions
    participant Store as Medusa Store API
    participant Simulator as Medusa Payment Simulator Provider
    Note over UI,Store: Existing address + shipping flow completes before payment
    Customer->>UI: Select "Simulated payment"
    Customer->>UI: Select demo outcome = success
    UI->>Action: initiatePaymentSession(cart, provider_id, data)
    Action->>Store: Initialize payment collection/session (SDK)
    Store->>Simulator: Initialize provider session
    Note over Store,Simulator: Provider stores/retains test outcome for authorization
    Simulator-->>Store: Pending session
    Store-->>Action: Payment collection/session response
    Action-->>UI: Continue to review
    Customer->>UI: Place order
    UI->>Action: placeOrder()
    Action->>Store: Complete cart
    Store->>Simulator: Authorize payment session
    Simulator-->>Store: Authorized (test only)
    Note over Store: Medusa handles order/inventory internally; ordering not claimed
    Store-->>Action: type=order, order.id
    Action->>Action: Revalidate cache + delete cart cookie
    Action-->>UI: Redirect to /order/:id/confirmed
    UI->>Store: Retrieve order detail (via server)
    Store-->>UI: Order confirmation data
    UI-->>Customer: Show Order Confirmation
```

## Payment Failure Sequence Diagram — target design

```mermaid
sequenceDiagram
    autonumber
    actor Customer
    participant UI as Next.js Checkout UI
    participant Action as Next.js Server Actions
    participant Store as Medusa Store API
    participant Simulator as Medusa Payment Simulator Provider
    Customer->>UI: Select simulator + outcome = failure
    UI->>Action: initiatePaymentSession(cart, provider_id, data)
    Action->>Store: Initialize payment session
    Store->>Simulator: Initialize provider session
    Simulator-->>Store: Pending session
    Store-->>Action: Payment session response
    Action-->>UI: Continue to review
    Customer->>UI: Place order
    UI->>Action: placeOrder()
    Action->>Store: Complete cart
    Store->>Simulator: Authorize session
    Simulator--xStore: Simulated authorization failure
    Note over Store: Backend failure/compensation is Medusa-owned and requires tests
    alt Medusa returns API error
        Store-->>Action: Error
    else Medusa returns non-order completion
        Store-->>Action: type=cart + error
    end
    Action-->>UI: Throw/display error without success redirect
    UI-->>Customer: Payment failed; review or retry
    Note over UI,Store: No successful order should exist; verify inventory in tests
```

**Do not assume** that all provider failures occur at authorization. The
backend may reject initialization instead; the UI already catches errors from
`initiatePaymentSession` and remains on the payment step in that case.

## Frontend/backend integration contract (Hoàng + Quý to confirm)

| Field | Proposed contract | Responsibility |
| --- | --- | --- |
| Provider ID | Full Medusa ID, e.g. `pp_simulator_simulator` **only if registered with this ID** | Hoàng confirms exact ID after registering provider |
| Discovery | `GET /store/payment-providers?region_id=...` returns provider | Hoàng enables provider for Vietnam region in dev/test |
| Session init | `initiatePaymentSession(cart, { provider_id, data: { simulated_outcome: "success" | "failure" } })` | Quý sends demo choice; Hoàng persists/validates for authorization |
| Authorization | `success` authorizes, `failure` rejects without a successful Order | Hoàng implements/tests via Medusa provider interface |
| Completion | `placeOrder()` calls Medusa complete-cart; only `type === "order"` is success | Existing Next.js Server Action |
| Demo safety | Backend blocks simulator in production; no real money/card data; validate session/customer/cart/amount | Hoàng, not just frontend gating |
| COD regression | `pp_system_default` always remains supported | Quý + Quân test |

**Provider IDs are not guessed at runtime.** The UI shows the simulator only
when both of these build-time settings are present and the provider is listed
for the cart's region:

```dotenv
# apps/storefront/.env.local — DEMO ONLY
NEXT_PUBLIC_PAYMENT_SIMULATOR_ENABLED=true
NEXT_PUBLIC_PAYMENT_SIMULATOR_PROVIDER_ID=pp_simulator_simulator
```

Replace the sample ID above with the **actual** registered provider ID from
Hoàng; never use this placeholder blindly. Next.js inlines `NEXT_PUBLIC_*`
values at build time, so restart/rebuild Storefront after changing them.
Neither variable is a secret. The backend must separately reject/disable
simulator operations in production.

Without these variables the checkout behaves as before (COD only). If a
simulator is configured but not enabled for the region, it is also hidden.

### UI behavior

1. Select COD → existing `pp_system_default` flow; no outcome selector.
2. Select simulator → show a clearly labeled **demo outcome** selector.
3. Continue → send `data.simulated_outcome` to payment session
   initialization; reinitialize on every simulator Continue to reflect changes.
4. Review → enable Place Order only for a pending, supported provider session,
   with addresses, email, and shipping method completed.
5. Place Order → reuse the existing `placeOrder()` redirect/error handling;
   no frontend-side creation of payment or Order records.
6. Failure → display inline error; **never** redirect to confirmation unless
   Medusa returns `type: "order"`. The backend must guarantee this behavior.

### Verification and handoff

- [ ] Hoàng confirms provider ID, the `simulated_outcome` data field, and when
      authorization failure is triggered; updates this document if different.
- [ ] Hoàng implements custom provider, registers it for the test region,
      validates the demo-only flag on the server, and tests success/failure.
- [ ] Quý verifies payment methods appear only under correct configuration,
      outcome selection is passed through the session initialization, and COD
      remains selectable.
- [ ] Quân validates success, failure, edited outcome, and error displays in
      the browser, with screenshot/video evidence.
- [ ] Trung compares order existence and reservation/available stock before
      and after failure, rather than assuming a particular SQL update order.
- [ ] Tests cover invalid provider IDs, simulator disabled, repeated clicks,
      and unauthorized attempts to force a test outcome.
- [ ] Review this contract against Medusa **2.21.2** in the pinned repo; the
      later **2.22.1+** client-data update API is not assumed available.

**Reference implementation files:**
`apps/storefront/src/modules/checkout/components/payment/index.tsx`,
`payment-button/index.tsx`, `review/index.tsx`,
`apps/storefront/src/lib/util/checkout-payment.ts`,
`apps/storefront/src/lib/data/cart.ts`.

**Medusa docs:**
[Payment Module Provider](https://docs.medusajs.com/resources/commerce-modules/payment/payment-provider),
[Checkout payment step](https://docs.medusajs.com/resources/storefront-development/checkout/payment).
