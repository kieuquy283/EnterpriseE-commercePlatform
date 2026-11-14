# Contributing to DAYMARK

This is a shared codebase. Start with [the canonical spec](docs/README.md), [local setup](docs/setup.md) and [AGENTS.md](AGENTS.md). Requirements and workflows apply to humans and coding agents; branch protection/CI must enforce selected checks separately—AGENTS alone cannot enforce team behavior.

## A small, traceable change

1. Read the requirement/flow, related code/TODOs and relevant `git log` bodies. Check for concurrent work and preserve unrelated edits.
2. Identify one outcome and its acceptance test. For a new boundary/provider/schema, document the decision and ask the responsible reviewer before implementing an unapproved structural change.
3. Work on `feat/`, `fix/`, `refactor/`, `docs/`, `test/` or `chore/` topic branch; prefer a vertical business slice over disconnected infrastructure changes.
4. Update the contract/spec when behavior changes. Add focused tests and record what could not be tested. Do not represent planned features as implemented.
5. Open a focused PR with requirement/flow IDs, before/after behavior, validation, risks and unresolved TODOs. A reviewer can request a smaller PR or a clarified decision.
6. Merge only with task/user authorization and required checks/reviews. Do not force-push shared main. Preserve published migration/data compatibility unless an explicitly reviewed migration plan says otherwise.

## TODOs

Use `TODO(kind): specific action — context; requirement/issue` for unfinished work near the relevant code. Kinds: impl, refactor, dup, shared, design, test, perf, security, ops. Example:

```ts
// TODO(test): Reconcile final-size stock under concurrent checkout — FR-06.
```

Use `npm run todo`. Keep multi-step work in [the delivery backlog](docs/spec/07-delivery.md) or an issue; do not flood files with vague annotations. Remove resolved TODOs and mention them in the commit body.

## Commits

Conventional subject, imperative and <=72 characters: `type(scope): description`. Types: feat, fix, refactor, docs, test, perf, chore, ci. Scopes should identify the affected area. One logical change per commit; the generated root lockfile travels with the dependency change that caused it.

Nontrivial bodies explain:

```text
What: visible behavior and main implementation changes.
Why: requirement/flow, decision and alternatives that mattered.
Follow-ups: remaining TODOs, compatibility or operating limits.
Validated: exact checks/results, plus anything not run.
```

Do not fabricate testing or reviewer approval. An automated code agent commits/pushes only when its task authorizes that action.

## Validation by scope

| Change                           | Required evidence                                                                                                |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Docs/report content              | `npm run docs:check`; inspect target/implemented/verified language and teacher coverage                          |
| Presentation engine/content      | Build/type check, route/navigation tests and print/overflow review where available                               |
| Backend policy/workflow          | Backend lint/types plus relevant unit/HTTP/integration assertions                                                |
| Storefront journey               | Storefront lint/types/build plus relevant Playwright journey                                                     |
| Schema                           | Generated new migration, disposable fresh/upgrade checks; never rewrite applied migrations                       |
| Infra/release                    | CloudFormation lint/Guard and lifecycle tests; reviewed change set, budget and explicit deployment authorization |
| Commerce correctness/performance | Isolated fixtures, repeat/contended operations, reconciled records and named metrics                             |

Use npm/root lockfile only. No generated output, credentials, private `.env`, deployment settings or raw customer records in Git. Do not run write/load tests against shared data merely to satisfy a checklist. App changes follow scoped AGENTS. Read [operations](docs/spec/06-operations.md) before live work.

## Ownership and review

Record a responsible reviewer/operator per issue or release, not one permanent sole owner. Customer-facing business changes require business-flow review; architecture/integration changes require boundary/contract review; data/cloud actions require migration/cost/recovery review. Existing Medusa functionality must be verified in the chosen configuration before it is marked accepted. Suggested future CI enforcement: docs/contracts, isolated business E2E and required infrastructure checks; this document does not claim repository protection settings have been changed.

## Review by business flow

Choose a responsible reviewer and acceptance operator in each issue/PR. These are review responsibilities, not invented GitHub usernames or exclusive directory ownership. A flow can cross both applications; its reviewer follows the complete journey.

| Flow / requirement                          | Change and review focus                                                             | Typical implementation boundary                                               |
| ------------------------------------------- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Account and private history / FR-01, FR-07  | Customer identity, authorization and private responses                              | Storefront data/auth actions, backend auth/customer/order APIs                |
| Browse and discover / FR-02                 | Whole-catalog query semantics, region/channel visibility, variant and price display | Storefront product data and catalog UI, Medusa product/pricing APIs           |
| Cart through purchase / FR-03–FR-05         | Authoritative totals, retry outcomes, payment and order reconciliation              | Storefront checkout/data, Medusa cart/payment/order workflows                 |
| Stock and fulfillment / FR-06, FR-07, FR-09 | Staff permissions, stock accounting, physical handoff and COD collection            | Medusa Admin, inventory/fulfillment workflows and providers                   |
| Notifications / FR-08                       | Durable intent, duplicate delivery, retries and recovery                            | Planned notification workflow/module/provider; not yet accepted               |
| Suggestions / REC-01                        | Eligibility, public projection, consent, fallback and cache expiry                  | Recommendation/personalization modules, workflows, routes and storefront data |
| Release and recovery / NFRs                 | Capacity, cost, migration safety, rollback and measured evidence                    | Deployment tooling and operations; separate authorization for live actions    |

For cross-flow work, name the affected flow reviewers explicitly. Use [the flow contract](docs/spec/02-flows.md) for acceptance, not a passing file-level test alone.

## Formatting, lint and commit verification

Use Node 24.22.1 and the root npm lockfile; `packageManager` selects npm 11.12.1. pnpm migration is parked. Oxfmt 0.78.0 replaces our direct Prettier dependencies and storefront configuration. Prettier may remain transitively installed by framework tooling or Oxfmt; it is no longer a project command.

Run `npm run format -- path/to/file` to format selected files, or `npm run format` for an explicit repository-wide rewrite. Formatting uses double quotes, two spaces, no semicolons and no import/package sorting. Existing source has a legacy formatting baseline: this change deliberately avoids a bulk rewrite. `npm run format:check` checks the adopted formatter configuration and staged-check configuration in CI; the pre-commit hook checks every staged supported source/configuration file. Run `npm run format:check -- path/to/file` for an additional explicit check. Generated builds, lockfiles, docs/evidence and datasets are excluded by `.oxfmtrc.json`.

ESLint remains the single linter: Medusa's custom architecture checks and Next's framework/TypeScript rules have no verified complete Oxlint replacement here. Oxlint is therefore not installed or run. TypeScript and application tests remain separate checks. See the official [Oxfmt CLI](https://oxc.rs/docs/guide/usage/formatter/cli).

Husky 9.1.7 manages `.husky/pre-commit`; lint-staged 16.4.0 selects checks using `lint-staged.config.mjs`. `npm ci` installs the local hook through `prepare`; installation skips production, CI and contexts without `.git` (including Docker dependency layers). After an install with scripts disabled, run `npm run hooks:install` manually. Check `git config --get core.hooksPath` first if you use a personal hook path: Husky replaces that local setting.

The hook runs `npm run hooks:verify`, using lint-staged's backup/restore handling and `--hide-unstaged` to hide tracked unstaged edits, including partially staged files. Commands are check-only; fix formatting explicitly and stage the result yourself. Nonignored untracked dependencies remain visible. See the official [lint-staged guide](https://github.com/lint-staged/lint-staged#readme) and [Husky setup](https://typicode.github.io/husky/get-started.html).

Staged supported files run Oxfmt. Docs and scoped instructions run the docs checker; backend/storefront changes run the affected application's ESLint checks. Root package/lockfile/Turbo/ESLint changes select the tooling baseline and both application lints. Presentation changes run its typecheck and engine tests. The hook never builds, seeds or accesses databases/cloud. Full type checks, integration tests and builds remain CI/PR checks. Hooks are bypassable with `git commit --no-verify` or `HUSKY=0`; explain a bypass in the PR and run the required checks. CI and repository protection settings are the shared enforcement boundary; branch protection is unchanged.
