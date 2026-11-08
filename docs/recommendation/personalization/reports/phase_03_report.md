# Phase 03 — Interest profiles

**2026-11-07 · PARTIAL.** Added deterministic `buildInterestProfile` with a 30-day window, bounded 100-event input, per-product weight cap and order-cancellation suppression. `rebuild-profile` workflow writes a customer-scoped profile with consent epoch; event ingestion can refresh it, and an hourly Medusa job is present behind `ENABLE_PERSONALIZATION_PROFILE_JOB=false`. Withdrawal deletes profiles. The Home API only reads a profile matching the current consent epoch.

`npm run test:unit --workspace @dtc/backend` passed 43/43; focused ranking tests cover recency, repeated views and out-of-order cancellation. The disposable personalization HTTP test exercised profile creation through a view and resulting personalized response. The Checkout/Order integration test confirmed an actual canceled order no longer contributes to the derived profile. Backend typecheck, lint and build exited 0.

**Unmet:** real worker/job execution, concurrent writer race and replay proof, profile freshness measurement, large-history cost and 30-day retention deletion policy. The job is OFF by default. Profile values are derived data, never a replacement for Medusa commerce records.

Rollback: disable profile job and serving; withdrawal erases a subject's profile and events in the isolated test DB.
