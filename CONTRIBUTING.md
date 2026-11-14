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

| Change | Required evidence |
| --- | --- |
| Docs/report content | `npm run docs:check`; inspect target/implemented/verified language and teacher coverage |
| Presentation engine/content | Build/type check, route/navigation tests and print/overflow review where available |
| Backend policy/workflow | Backend lint/types plus relevant unit/HTTP/integration assertions |
| Storefront journey | Storefront lint/types/build plus relevant Playwright journey |
| Schema | Generated new migration, disposable fresh/upgrade checks; never rewrite applied migrations |
| Infra/release | CloudFormation lint/Guard and lifecycle tests; reviewed change set, budget and explicit deployment authorization |
| Commerce correctness/performance | Isolated fixtures, repeat/contended operations, reconciled records and named metrics |

Use npm/root lockfile only. No generated output, credentials, private `.env`, deployment settings or raw customer records in Git. Do not run write/load tests against shared data merely to satisfy a checklist. App changes follow scoped AGENTS. Read [operations](docs/spec/06-operations.md) before live work.

## Ownership and review

Record a responsible reviewer/operator per issue or release, not one permanent sole owner. Customer-facing business changes require business-flow review; architecture/integration changes require boundary/contract review; data/cloud actions require migration/cost/recovery review. Existing Medusa functionality must be verified in the chosen configuration before it is marked accepted. Suggested future CI enforcement: docs/contracts, isolated business E2E and required infrastructure checks; this document does not claim repository protection settings have been changed.
