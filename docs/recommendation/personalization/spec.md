# Personalized Recommendation Engine — Functional & Technical Specification

> **ID:** PERS-SPEC-01 · **Version:** 1.1 · **Status:** P0 code partially implemented; release gates open
> **Plan:** [plan.md](plan.md) · **Evaluation:** [evaluation_protocol.md](evaluation_protocol.md).

## 1. Use cases & requirements

| ID | Priority | Requirement | Verification |
|---|---|---|---|
| PERS-FR-01 | P0 | Logged-in customer with valid permission can see up to 12 “Dành cho bạn” products that reflect their own interactions. | Two synthetic users, different histories, deterministic result and browser check. |
| PERS-FR-02 | P0 | No history, no permission, expired session or guest gets generic known-good V1/Popularity; never silently profile. | API+UI flag/no-consent tests. |
| PERS-FR-03 | P0 | View, recommendation click and authoritative order purchase are supported, bounded, validated, deduplicated. | Event HTTP+subscriber retry/replay tests. |
| PERS-FR-04 | P0 | Customer can opt in, withdraw, request deletion; withdrawal immediately disables personalization; deletion affects logs, profiles, caches, and retraining snapshots according to policy. | Auth, retention, deletion/rebuild tests. |
| PERS-FR-05 | P0 | Existing Home/PDP generic recommendation unaffected; checkout/payment/order not dependent on ranker. | Regression E2E + failure injection. |
| PERS-FR-06 | P1 | H&M offline collaborative baseline compared on valid temporal split; never identity-join into Medusa. | Manifest/hash, leakage and mapping tests. |
| PERS-NFR-01 | P0 | Auth/tenant/session isolation and strict output projection; no cross-user cache. | Pen-tests & concurrent two-user probes. |
| PERS-NFR-02 | P0 | Operational error/fallback, bounded DB/service resource use, measured p95 and capacity. | k6 and query instrumentation, success-only latency. |
| PERS-NFR-03 | P0 | No sensitive data/secret/raw H&M user IDs in source, public API, logs or checked-in evidence. | Secret/log/privacy audit. |
| PERS-NFR-04 | P0 | Audit reproducibility for all model/profile/ranking changes. | Deterministic fixtures + config hashes. |

## 2. Identity, permission & security contract

- **Medusa customer identity** from server auth context (`AuthenticatedMedusaRequest.auth_context.actor_id`) only, validated as a customer actor via Medusa middleware. Never trust client-supplied `customer_id`, email, cookie value or a free-form user-id query parameter.
- **Consent:** collection of optional view/click/session profiling events begins only under documented valid permission where required. Without it, do not emit persistent recommendation behavior events or set persistent tracking IDs; generic content continues. Purchase data from commerce remains governed by independent order-processing purposes; use for profiling only when permitted.
- **Guest session:** P1 optional; opaque random server-generated scoped identifier with short TTL only under appropriate controls. Session-to-customer merge requires explicit policy/permission; never use device fingerprint/IP as identity.
- **No external model API:** raw customer behavior/PII must not be sent to Hugging Face/OpenCLIP or external analysis service without separate authorization/impact review.
- **Customer controls:** own consent status, change, export/delete request endpoints if needed (contract below); strict authorization, identity-bound audit logs; no admin bypass by query.
- **Retention (proposal, not legal assertion):** raw view/click 30 days, derived profiles 90 days from latest permitted activity, order-derived permitted features with separately agreed retention; session 24h max. Set actual durations with privacy owner in Phase 01; tests enforce deletion and expiry.
- **Vietnam:** Cần xác minh nghĩa vụ pháp lý hiện hành, thông báo, quyền chọn tham gia/rút lại, lưu trữ và xóa dữ liệu với người phụ trách trước khi bật thu thập. Tài liệu kỹ thuật này không phải phê duyệt pháp lý.

## 3. Interaction events (logical contract; DB design to be finalized)

Proposed `recommendation_event` record, internal only:

```json
{
  "event_id":"uuid-v7-or-random-uuid",
  "subject_key":"internal-scoped-pseudonym",
  "subject_type":"customer",
  "event_type":"product_view",
  "product_id":"prod_example",
  "occurred_at":"2026-11-07T12:00:00Z",
  "received_at":"2026-11-07T12:00:01Z",
  "source":"storefront",
  "placement":"product_detail",
  "rec_version":null,
  "consent_version":"v1"
}
```

Possible types: `product_view`, `recommendation_impression`, `recommendation_click`, `purchase`, `purchase_reversed`. Do **not** accept `purchase` / `purchase_reversed` from browser; only authoritative Medusa order subscriber/worker. Record `order_id+line_item_id+event_type+state_version` unique idempotency internally, not in public event payload. Handle canceled/refunded items by compensation (not double-negative counting). Validate product exists and timestamp skew, payload size; dedup by event ID, throttle by actor/session and bot protections. Avoid raw IP/UA/email fields by default. Validate actual Medusa event names/payloads on installed version, e.g. `order.placed`, `order.canceled`.

Proposed event ingestion API (conditional on consent/auth):

- `POST /store/recommendation-events` — accepts **only** allowed `product_view` / `recommendation_impression` / `recommendation_click` and whitelisted IDs/context/version; server resolves subject, validates origin/rate/ID, returns `202 Accepted` on successful queued event, or explicit error; never blocks PDP/checkout. Batch endpoint may be added after initial tests.
- Strictly validate impression/click attribution using a server-issued bounded impression token or signed equivalent when online CTR measurements begin; clicks without credible impression cannot be used to calculate unadjusted CTR.
- Optional consent endpoints for authenticated customer under `.../privacy` to be finalized in Phase 01; do not expose other users' records.

## 4. Profile models

Suggested tables/modules (separate from commerce source of truth):

| Logical entity | Fields (minimum) | Protection |
|---|---|---|
| `recommendation_consent` | `subject_key`, `status`, `version`, `updated_at`, `withdrawn_at` | Authorized customer only; explicit audit; withdrawn = no new optional events |
| `recommendation_event` | internal event fields above, `expires_at`, dedup key | Internal only; retention+delete; no raw H&M IDs |
| `recommendation_profile` | `subject_key`, `category_affinity`, `recent_product_ids`, `last_event_at`, `profile_version`, `status` | Internal customer-scoped; clear on withdrawal/deletion |
| `recommendation_impression` | limited item/rank/placement/model version, event key | Only with lawful measurement permission; dedup/retention |
| `recommendation_model_run` (optional P1) | offline dataset hash, split, algorithm params/version, metrics, active flag | Immutable, not exposed to customer |

Prefer `subject_key` server-managed pseudonym; treat pseudonym as personal data, not anonymous. Store mapping securely, allow key rotation and deletion. Keep customer-specific profiles out of existing global `recommendation_candidate.context_key` because that read model and its cache semantics were designed for non-personalized placements. No need to create dense N×K user candidate rows in PostgreSQL for pilot.

## 5. Profile aggregation & behavioral scoring MVP

Valid event impact (initial *hypotheses*, not optimized weights): `view=1`, `recommendation_click=2`, `purchase=5`; attenuate stale interactions by exponential decay. Apply caps per product/day to resist event spam. Purchases are sourced from Medusa, not H&M. Categories/content from the known-good V1 metadata similarity.

Let `w(e)` be the event weight, `d(e)=exp(-ln 2 * age_days / half_life_days)` and `sim_v1(p,q)` be bounded content similarity. One initial scoring formula:

\[
score(u,p) = \sum_{e \in history(u)} w(e)d(e)sim_{V1}(item_e,p) + \lambda categoryAffinity(u,p)+ \mu normalizedPopularity(p)
\]

`half_life_days=14`, `lambda`, `mu` are **experimental defaults** requiring validation. Do not mix unnormalized scales or add visual CLIP by default. Candidate sources: neighbor products of recent viewed/purchased items; matching taxonomy groups; generic popularity; optional research-only item-to-item co-occurrence. Suppress duplicate/self contexts; exclude already purchased items only with an explicitly defined apparel repurchase policy (not blanket exclusion). Final result capped at 12 unique, valid, saleable Medusa StoreProducts by region/channel/price/backorder rules.

**Cold-start:** authenticated with no qualified events → generic v1; optional explicitly provided preferences after consent may seed categories (separate consent and UI decision). Guest/no-consent → generic v1. Sparse item history → category matching. Never promise a distinct result when profiles are identical/empty.

## 6. Collaborative Filtering offline research P1

H&M private data: `customer_id`, `article_id`, `t_dat`, historical transactions; map `article_id → Medusa Product ID` only for valid selected universe and keep original chronological data for evaluation. Do not confuse Product and Variant. User identity remains entirely within H&M offline sandbox, not associated with Store customers; do not commit raw or hashed customer IDs.

Candidates: `ItemKNN` with co-purchase, `implicit` library ALS/BPR, and Popularity/Content baseline. Train and compare with temporal cutoff, full/eligible-item candidate ranking, leakage prevention and user eligibility rules documented before evaluation; avoid random item-pair splits that expose future user behavior. Evaluate Recall@12, nDCG@12, HitRate@12, user coverage, item coverage, sparse-user cohorts, runtime/memory. If original 500-catalog mapping drops much history, report coverage and possibility of broader offline item universe **without mutating live catalog**.

Models learned from H&M customer factors cannot directly make predictions for Medusa customer IDs. Item-to-item similarities learned from H&M may be considered a **separate candidate source** only after provenance, rights, domain-shift and quality checks; no automatic deployment.

## 7. API contracts

**New route (proposed):**

`GET /store/recommendations/for-you?region_id=<region>&limit=12`

- No `customer_id` parameter. The implemented route requires a Medusa customer bearer/session and derives the actor server-side. Anonymous Home continues to use the existing generic Popular Products route; it does not call `/for-you`.
- `limit` integer 1..12; `region_id` valid; header publishable key and sales channel obey Medusa rules; reject unexpected query parameters and wrong region.
- Response projection (example):

```json
{
  "placement":"for_you",
  "strategy":"behavioral_v1",
  "personalized":true,
  "version":"pers-mvp-v1",
  "reason":"recent_interest",
  "products":[{"id":"prod_example","title":"Product title","handle":"example","thumbnail":null}]
}
```

- Product object is **illustrative**, must use same approved Medusa StoreProduct price/variant projection and safe filters as existing Recommendation API; omit scores, raw H&M IDs, profiles, event histories, customer IDs and sensitive metadata.
- Without consent/history: `personalized:false`, `strategy:'catalog_fallback'`, `reason:'no_consent'|'cold_start'|'service_unavailable'`, products valid; do not reveal whether a *different* customer is present. No leakage through headers, caches or logs.
- `Cache-Control: private, no-store`, `Vary` on auth as appropriate; no cross-user coalescing. Timeouts and concurrency caps; on profile store failure return generic if commerce available. Authenticated users must not receive stale recommendations belonging to a former logged-in session.
- **Backward compatibility:** existing `GET /store/recommendations?placement=home|product_detail` stays unchanged; new route is additive. Any shared StoreProduct resolver refactor requires existing PDP performance regression tests.

## 8. Deployment, monitoring and gates

- Offline job for profile aggregation can run as Medusa scheduled job / worker / Docker scheduled task; use Redis for ephemeral speed but PostgreSQL as source for permitted interactions and consent. API must work if aggregation lags; no runtime CLIP inference.
- Monitor: event accepted/dropped/dedup, backlog/lag, profile freshness, cold-start ratio, opt-in/opt-out counts (aggregated), recommendation error/fallback, successful-only latency p50/p95/p99, 429/503, memory/CPU/PG connections, repeat/cancel reconciliation, zero leakage tests.
- Set explicit k6 profiles e.g. 10RPS private smoke and 30RPS candidate release target; do not declare achieved without a run. Request mix must contain many distinct consenting users and regions plus guest, not only one hot anonymous request. Segment success latency separately from early rejects.
- Start private flag `ENABLE_PERSONALIZED_RECOMMENDATIONS=false`, storefront feature OFF. Never silently enable collection or public mode through backend flag alone.
- Rollback disable rail/ingestion + active ranker version, preserve required consent/deletion controls; retention/erase continues even while feature OFF. Avoid `down -v` or destructive migrations on shared DB.

## Repository-specific constraints

- [VERIFIED] Local `commerce` DB has no recommendation tables at audit; migration and feature activation require an isolated test DB first.
- [VERIFIED] The current Store API accepts only `home` and `product_detail`, rejects unknown query keys, and does not accept `customer_id`. Preserve this existing contract; add a separate authenticated route when implemented.
- [VERIFIED] `scripts/hm/profile-personalization-readiness.py` reports aggregate private data only. See [data-readiness.md](data-readiness.md).
- [PROPOSED] Behavioral P0 uses consented Medusa-account interactions. H&M buyer histories remain offline P1; no historical buyer is automatically linked to a Medusa customer.
- [BLOCKER] Do not turn on collection or a public deployment until privacy and dataset rights are independently decided.
