# Backend conventions

Read the repository root AGENTS.md and docs/spec/03-architecture.md and 04-data-api.md first. This is Medusa 2.22.7, not a generic Express application.

- Routes: `src/api/.../route.ts` exports GET/POST/etc. Use file-based routing, framework middleware and runtime validation; inferred TypeScript DTOs alone are insufficient.
- Authentication context supplies customer identity. Never trust a client `customer_id` as authorization. Public responses explicitly project permitted fields.
- Workflows compose application operations. Domain policies and data models belong in modules. Core commerce uses Medusa services/workflows, not custom duplicate order tables.
- Providers adapt external storage/payment/email. Use Medusa extension points before introducing custom interfaces. Keep HTTP/request objects out of reusable domain logic where possible.
- Model changes require generated NEW migrations (`cd apps/backend && npm exec medusa db:generate <module>`). Preserve existing migrations and deployed records.
- Unit: `npm run test:unit`; HTTP: `npm run test:integration:http`; module: `npm run test:integration:modules`, from this directory. Integration suites need an isolated reachable database. Also run lint/typecheck for backend changes.
- Admin extensions use `src/admin`; the default admin is Medusa, not a separately built dashboard. No default admin password in seed/templates.

If available, load Medusa's building-with-medusa skill before implementation, and the Admin skill for admin work. Prefer the Medusa docs MCP for API questions. They are optional tooling; if missing, use installed source/official docs and mention the gap when relevant. Never invent framework signatures.
