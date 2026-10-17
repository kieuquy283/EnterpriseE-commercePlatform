# Storefront–Backend Boundary

## Purpose

Keep customer-facing presentation in the Next.js Storefront and authoritative commerce behavior in the Medusa Backend. The Storefront owns presentation and user interaction; Medusa owns commerce state, business rules, security, and persistence.

## Ownership

| Concern | Owner | Storefront responsibility |
| --- | --- | --- |
| UI/navigation | Storefront | Render pages, forms, and navigation. |
| Auth UI | Storefront | Collect credentials and display auth results. |
| Authentication/authorization | Medusa | Call Medusa auth endpoints; retain the issued token. |
| Customer | Medusa | Display and submit customer/profile data through Store API. |
| Catalog | Medusa | Fetch and present products; manage UI filters and sorting. |
| Pricing | Medusa | Display prices returned by Medusa. |
| Cart | Medusa | Collect cart actions and persist the cart ID cookie. |
| Checkout | Medusa | Collect inputs and request cart completion. |
| Shipping | Medusa | Show options and calculated amounts returned by Medusa. |
| Payment | Medusa | Show available methods and initiate a Medusa payment session. |
| Order | Medusa | Display orders and confirmation returned by Medusa. |
| Inventory | Medusa | Display availability supplied by Medusa. |
| Persistence | Medusa/PostgreSQL | No direct database access. |
| Cache/events/workflows | Medusa/Redis | Use Next.js response caching only for presentation. |
| Admin | Medusa Admin | No storefront ownership. |

## Integration Contract and Auth

The Storefront calls the Medusa Store API through the Medusa JS SDK configured in `apps/storefront/src/lib/config.ts`. Data access is concentrated in `apps/storefront/src/lib/data/*`; the current product options picker also calls `/store/product-options` directly through the SDK. A publishable API key is supplied through `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`.

Medusa handles customer registration/login and issues the token. Storefront server actions place it in the HTTP-only `_medusa_jwt` cookie; `getAuthHeaders()` reads that cookie and sends `Authorization: Bearer <token>` to Medusa. The Storefront also stores the cart ID in an HTTP-only cookie. Medusa remains responsible for authorizing each request.

## Runtime Flow

`Browser → Next.js Storefront → Medusa Backend → PostgreSQL/Redis → Medusa Worker`

This is a conceptual flow: the worker is a separate Medusa process in the Compose `app` profile, sharing PostgreSQL/Redis with the API process; it is not invoked by PostgreSQL or Redis as a next HTTP hop. In the documented local `npm run backend:dev` path, Medusa uses its shared worker mode.

## Boundary Rules

- Storefront must not access PostgreSQL or Redis directly.
- Storefront must not create orders independently; it completes a Medusa cart through the Store API.
- Storefront must not calculate authoritative pricing, payment, shipping, or inventory results, or duplicate Medusa business rules.
- New commerce data access should live in `apps/storefront/src/lib/data/*` and use the Medusa SDK/Store API.

## Rationale / Trade-offs

One commerce authority keeps validation, totals, inventory, and order state consistent across Storefront and Admin. The Storefront can evolve its UI independently, but checkout and account flows depend on Medusa availability and its API contract. Next.js caching and cookies improve the web experience without becoming a second commerce store.

Currently implemented: Medusa Store API integration, customer auth, cart/checkout, manual `pp_system_default` payment presented as COD, PostgreSQL, and Redis-backed Medusa services. A separate payment simulator, dedicated search service, and notification service are not implemented. S3 is only an optional file-provider configuration when its environment variables are supplied; it is not part of the local MVP setup.
