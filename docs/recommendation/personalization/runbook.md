# Private personalization pilot runbook

Status: **not approved for activation on `commerce` or public deployment**. Current evidence: [final implementation report](reports/final_implementation_report.md).

1. Confirm the target DB name/host, backup, and that it is disposable or explicitly owned for the pilot. Never infer DB identity from a shared `.env`. Do not run `docker compose down -v`.
2. Keep Similar Products V2/V2.1 frozen. A valid **V1 metadata** candidate run must be active before “For you” can be personalized; local `commerce` currently has no recommendation tables. The API ignores V2 hybrid neighbors.
3. Set backend `ENABLE_PERSONALIZED_RECOMMENDATIONS=true` **only** in the isolated pilot after additive module migrations and a reviewed privacy notice. Keep `ENABLE_PERSONALIZATION_EVENTS`, `ENABLE_PERSONALIZATION_ORDER_EVENTS`, and `ENABLE_PERSONALIZATION_PROFILE_JOB` separately OFF until each data source is approved. `PERSONALIZATION_MAX_CONCURRENCY=4` is a guard, not an SLO result.
4. Set Next.js `NEXT_PUBLIC_ENABLE_PERSONALIZED_RECOMMENDATIONS=true` before building the pilot storefront. Set `NEXT_PUBLIC_ENABLE_PERSONALIZATION_EVENTS=true` only after browser tracking permission is approved. `NEXT_PUBLIC_*` variables are compiled into the build; changing them at runtime alone is insufficient.
5. Use two explicitly synthetic, consenting QA accounts. Confirm separate A/B Home rails, anonymous generic Home, opt-out removal, PDP/cart/checkout unchanged, native product eligibility, and order placed/canceled behavior. Never map an H&M historical customer to a real Medusa account.
6. Run the browser and mixed-user load/failure matrix in [system report](reports/system_test_report.md). Capture actual p50/p95/p99, error/reject rate, Postgres connections and worker lag. Keep public rollout OFF until data rights, retention/export/deletion and legal review pass.

**Rollback:** turn OFF frontend rail/tracking and backend event/order/job flags; keep consent/erasure available until test data is cleared. Generic Home/PDP and checkout must continue. Do not delete commerce records or V2 artifacts. Revert an active recommendation run only through the versioned active pointer in an explicitly owned environment.

**Test runner note:** pinned Medusa test utils needs `DB_HOST=localhost`, `DB_PORT=5434`, `DB_USERNAME`, `DB_PASSWORD` and a matching test `DATABASE_URL` explicitly set to the isolated recommendation Postgres. `127.0.0.1` triggers its non-local SSL branch. This is test-harness behavior, not a production DB setting.
