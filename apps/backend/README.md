# DAYMARK backend

Medusa 2.21.2 owns catalog, customer, cart, pricing, inventory, order/payment and fulfillment. API/Admin and worker use this application with separate runtime roles; custom recommendation/personalization modules remain separately gated.

Read [the specification](../../docs/README.md), [backend rules](AGENTS.md) and [local setup](../../docs/setup.md). Business logic belongs in workflows and module policies; file-based API routes are transport controllers. Default administration is Medusa Admin, not a custom back office.

From this directory: `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run test:unit` and `npm run test:integration:http`. Integration tests require an isolated database. Use the root npm lockfile; never install a second package manager. Never seed or migrate an unidentified/shared database.
