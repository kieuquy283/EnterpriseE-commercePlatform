# Working on DAYMARK

DAYMARK is a shared, production-oriented clothing-commerce MVP with product suggestions. It is not a complete enterprise platform. The authoritative specification starts at [docs/README.md](docs/README.md); [README.md](README.md) explains the repository and [CONTRIBUTING.md](CONTRIBUTING.md) explains collaboration.

## Working agreement

1. Read the relevant specification, nearby TODOs and recent file history before changing a feature. Use `git status` first; preserve collaborators' work.
2. Trace work to a requirement and flow. Describe any proposed scope or architecture change before implementing it; an explicitly authorized task is sufficient approval within its scope. Record accepted architecture changes in the specification's decision log.
3. Keep business intent, implementation and evidence distinct. A route, test file or AWS resource does not prove a complete business flow. Report exactly what ran, passed, failed and remains unverified.
4. Use a topic branch and focused PR. Do not merge, push, deploy, change cloud capacity or delete data unless the task authorizes it. Never rewrite published main history.
5. Leave unfinished work visible with actionable typed TODOs. Do not hide broken behavior behind a success response, disable framework lint rules, or call a placeholder production-ready.

## Architecture rules

- Commerce is a Medusa modular monolith deployed as API/admin and worker, with a separate Next.js storefront. Separate containers are not independent microservices.
- Custom routes are HTTP controllers: authentication, runtime request validation, use-case invocation and explicit response DTOs. Business orchestration belongs in workflows; module services/policies own domain behavior. Lower layers never import routes.
- Medusa owns core commerce data. Use supported module services, workflows and links; no application raw SQL or direct database clients. Do not wrap built-in APIs in duplicate controllers/repositories without a documented need.
- Storefront accesses commerce through `src/lib/data` and the SDK/API; it must not persist authoritative prices, stock, payments or orders, or connect directly to PostgreSQL/Redis.
- External capabilities use providers/adapters. Background consumers must define retries, idempotency and failure visibility. Do not assume exactly-once event delivery.
- Existing inconsistencies are implementation backlog, not permission for an unrequested wholesale rewrite.

## Repository and commands

Node 24.22.1 LTS; root `packageManager` currently selects npm 11.12.1. Check it before installing. Use npm and the root lockfile; never introduce another manager/lockfile. Applications are in `apps/backend` and `apps/storefront`; report tooling lives in `presentation`. Read the applicable scoped AGENTS.md below before working in an area, including when starting from the repository root.

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm run build
npm run test:unit --workspace=@dtc/backend
npm run test:integration:http --workspace=@dtc/backend
npm run test:e2e --workspace=@dtc/storefront
npm run docs:check
npm run todo
```

Tests requiring PostgreSQL/Redis must use isolated test services. These commands are not all mandatory for a prose-only change: run checks relevant to what changed. Never run a checkout/load/seed command on a shared database without identifying its writes and authorization. Turbo tasks need explicit outputs.

## Scoped instructions and optional workflows

Before editing an area, read its scoped instructions explicitly; a session started at the repository root may not automatically load descendant files:

- [Backend and Admin](apps/backend/AGENTS.md)
- [Storefront](apps/storefront/AGENTS.md)
- [Reports and presentation engine](presentation/AGENTS.md)

For AWS deployment, infrastructure, access, cost or recovery work, load [daymark-aws](.agents/skills/daymark-aws/SKILL.md), including operations launched outside deploy/. That skill is task-specific and does not grant deployment, spending or destructive-action permission.

## TODO and Git conventions

Use `TODO(kind): action — reason/context; requirement or issue reference` near incomplete behavior. Kinds: `impl`, `refactor`, `dup`, `shared`, `design`, `test`, `perf`, `security`, `ops`. Keep larger work in the delivery backlog or an issue; do not scatter vague TODOs through untouched files. Remove a TODO when resolved. `npm run todo` lists annotations without reading ignored secrets or generated directories.

Commit subjects: `type(scope): imperative description`, <=72 characters. Types: feat, fix, refactor, docs, test, perf, chore, ci. Scopes name the area, for example backend, storefront, infra, docs, presentation. Split by logical change; include the generated lockfile change with its dependency change.

Nontrivial commit bodies record **What**, **Why/decisions**, **Follow-ups** and **Validated** (including unrun checks). Commits are the team's decision memory, not just file snapshots. Do not commit automatically unless the user/task asks for commits or PR preparation.

## Protection and style

- Never commit, print or copy secret values from `.env*`, private deployment settings, tokens or credentials. Document names in templates. Public identifiers are not credentials, but evidence must minimize personal/customer data.
- Do not hand-edit/delete lockfiles or generated `.medusa`, `.next`, dist or Turbo output.
- Never rewrite an existing migration that may have run. Generate a new migration for model changes. No destructive database operation without explicit authorization and a preservation plan.
- Follow Medusa recommended lint; never disable its rules to pass. TypeScript uses double quotes, no semicolons, two spaces; kebab-case files, camelCase functions, PascalCase types, snake_case columns. No emojis in code/comments/commits.
- AWS work must also follow [AWS skill](.agents/skills/daymark-aws/SKILL.md). All regional resources belong in ap-southeast-2. Preserve existing data/resources and respect the demo lease.
