# Phase 01 — Identity, consent & privacy

**2026-11-07 · PARTIAL.** Branch/SHA and environment: [Phase 00](phase_00_report.md). Added custom `personalization` module, consent model/service, `set-consent` workflow, protected `/store/personalization/consent` API, three generated migrations and default-off flags. Medusa Auth middleware derives the customer actor; request bodies cannot choose a customer ID. Grant creates a consent epoch; withdrawal advances it and erases recommendation events/profile through the custom module. Commerce customer/order tables are not mutated.

`npm run typecheck --workspace @dtc/backend` exited 0; `npm run lint --workspace @dtc/backend` exited 0 with no issues. `npm run test:unit --workspace @dtc/backend` passed 43/43. `npm run test:integration:http -- personalization-consent.spec.ts` passed 1/1 on runner-created DB under `recommendation-test-postgres`; it checked A/B isolation, unauthorized access, spoofed customer ID, withdrawal and **physical zero-row event readback** for the withdrawn customer. An initial run failed because Medusa's runner needs explicit `DB_HOST/DB_PORT`; retry with `localhost:5434` and explicit test credentials passed. `127.0.0.1` caused its local SSL heuristic to fail; no test DB was created on the main Postgres instance.

**Unmet:** reviewed legal basis/notice, final retention policy, data export/delete request flow, concurrent revoke/ingest race proof and privacy-owner decision. Consent UI is a private pilot control, not public authorization. All flags stay OFF. No migration on `commerce`.

Rollback: turn off personalized serving/event flags; keep consent/deletion service available for any test users until their data is erased. Isolated test DBs are runner-owned.
