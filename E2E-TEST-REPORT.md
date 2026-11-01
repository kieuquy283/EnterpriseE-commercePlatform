# Storefront E2E Test Report

**Date:** 2026-11-01  
**Environment:** Local Windows development environment  
**Result:** Passed, with notes below

## Scope

Validated that the local Medusa backend and Next.js storefront work together for the product browsing and checkout flows.

## Environment checks

- PostgreSQL and Redis Docker Compose services were running and healthy.
- Medusa health endpoint `http://localhost:9000/health` returned HTTP 200.
- Storefront `http://localhost:8000/vn/store` returned HTTP 200.
- The storefront initially showed no products because its configured publishable API key was associated with the default sales channel, while the seeded products belonged to the `Online Store` sales channel.
- For this local test, the configured key was linked to the `Online Store` channel and the Next.js fetch cache was cleared. The storefront then displayed all three seeded products.

## Test cases

| Test | Result | Evidence |
| --- | --- | --- |
| Load storefront product listing | Passed | `/vn/store` displayed 3 seeded products. |
| Open product detail | Passed | Opened the `Ao thun Essential` product detail page. |
| Add product to cart | Passed | Cart count changed to 1. |
| Open checkout | Passed | Checkout address step loaded and showed the selected product. |
| Registered customer checkout API smoke test | Passed | `scripts/smoke-checkout.ps1 -BaseUrl http://localhost:9000 -RegisterCustomer` completed registration, login, cart, shipping, COD payment, order completion, and order-history verification. |

## Automated smoke test result

```text
PASS health=200 product=ao-thun-essential cart=cart_01M6BSAAFGSA5H6YBP2BY4RF6M order=order_01M6BSABYD47S84NZ0B3D0M3WK registered=True history=True email=smoke-1793544497072@example.test
```

The test created a real test order in the local database. The checkout page opened in the browser still contained a cart item; it was not submitted as a second order.

## Notes and limitations

- Two earlier smoke-test attempts failed before order creation while resolving storefront key/channel setup. They may have left two test customer accounts using the `example.test` domain; no orders were created by those failed attempts.
- The browser-based verification reached the checkout address step but did not submit that browser cart.
- The local publishable key was temporarily linked to `Online Store` to make the configured storefront work. For a stable setup, use the intended `Storefront` publishable key and associate it with the `Online Store` sales channel.
- This report reflects a local development test and is not production certification.
