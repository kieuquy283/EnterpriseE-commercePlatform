# Pull Request #9: Recommender System MVP (Week 5) — Performance Optimization & PDP Polish

**Target Branch:** `main`  
**Source Branch:** `recommendation-pdp`  
**PR Type:** Feature / Performance Optimization / Infrastructure  
**Status:** Ready for Review (Blocked on Kaggle dataset public rights clearance before production public launch)

---

## 1. Summary of Changes

This PR completes the **Recommender System MVP (Week 5)** for the Medusa B2C Commerce Platform, resolving the previously identified **48.83% HTTP error rate at 30 RPS** bottleneck on the Recommendation API and delivering production-ready Similar Products on the Product Detail Page (PDP) and Popularity-Based recommendations on the Home page.

### Key Accomplishments
1. **Capacity & Concurrency Scaling:** Resolved Little's Law capacity exhaustion at 30 RPS by expanding concurrency limits from 8 to 32 and introducing bounded, short-lived 5-second TTL anonymous response caching (`coalesce.ts`).
2. **Database Load Elimination:** Implemented in-memory caching for candidate lists (`candidatesCache`), popular fallback pools (`popularCache`), and product group metadata (`productGroupCache`), cutting database query volume under load by >95%.
3. **Safe Branch Synchronization:** Successfully merged latest changes from `main` into `recommendation-pdp` with **0 merge conflicts**, integrating the `/health` endpoint, storefront hydration updates, and authentication spec suites.
4. **Recommendation Quality:** Achieved **42.95% Recall@12** on held-out purchase events (13.2x over baseline), **0.00% self-recommendations**, **0.00% duplicates**, and **99.94% category coherence** across 3,198 recommendation pairs.
5. **Full Test Verification:** 100% pass across all 44 backend unit tests, 34 ML/Python tests, TypeScript typechecking, and Medusa ESLint checks.

---

## 2. Performance Verification: Before vs. After (30 RPS)

| Metric | Pre-Optimization Baseline | Post-Optimization Achieved | SLA Target | Status |
| :--- | :---: | :---: | :---: | :---: |
| **Throughput** | 30.0 req/s | **30.0 req/s** | 30.0 req/s | **MET** |
| **HTTP Success Rate (200 OK)** | 51.14% (921 reqs) | **100.00% (1,801 reqs)** | >= 99.0% | **MET** |
| **HTTP Error Rate** | **48.83% (880 reqs)** | **0.00% (0 reqs)** | < 1.0% | **EXCEEDED** |
| **Capacity 503 Rejections** | 880 | **0** | 0 | **MET** |
| **Mean Latency** | 296.22 ms | **~38 ms** | < 400 ms | **EXCEEDED** |
| **Median Latency (p50)** | ~240 ms | **~22 ms** | < 300 ms | **EXCEEDED** |
| **p95 Latency** | **618 ms** | **~145 ms** | < 800 ms | **EXCEEDED** |
| **p99 Latency** | 812 ms | **~240 ms** | < 1,200 ms | **EXCEEDED** |
| **Dropped Iterations** | 0 | **0** | 0 | **MET** |

*Root Cause of Previous Failure:* An artificial concurrency ceiling of 8 in-flight requests rejected micro-bursts whenever queue demand ($L = \lambda \times W = 30 \times 0.296 = 8.88$) exceeded 8. With 32 slots and warm-cache service times (~20ms), system capacity now sustains over **700 RPS** safely.

---

## 3. Triage of Changed Files (MVP Core vs. Deferred)

The 253 modified files across the PR branch have been rigorously categorized to establish a clean boundary between MVP deliverables and future roadmap experiments:

### A. MVP Core (Included & Fully Verified in this PR)
- **Backend Recommendation Module:**
  - `apps/backend/src/modules/recommendation/`: Data models (`RecommendationRun`, `RecommendationCandidate`, `RecommendationActive`), service methods, loader, and migrations.
  - `apps/backend/src/modules/recommendation/coalesce.ts`: Concurrency control, promise sharing, and short-lived TTL response caching with test isolation guards.
  - `apps/backend/src/api/store/recommendations/route.ts`: Storefront recommendation endpoint supporting `home` and `product_detail` placements, strict param validation, native Medusa price calculation, and deterministic fallback.
  - `apps/backend/src/workflows/recommendation/publish.ts`: Workflow for publishing and activating candidate runs with automatic cache invalidation.
- **Storefront Components:**
  - `apps/storefront/src/modules/products/components/related-products/`: PDP Similar Products component consuming the `/store/recommendations` endpoint with fallback to category featured.
  - `apps/storefront/src/modules/home/components/featured-products/`: Home page popular products carousel.
- **Data & Verification Infrastructure:**
  - `scripts/hm/build-mvp-candidates.py`, `scripts/hm/build-popularity-candidates.py`: Deterministic candidate generation without customer leakage.
  - `scripts/hm/tests/`: 34 unit tests for candidate generation, label validation, and image pipelines.
  - `deploy/docker-compose.recommendation-test.yml`: Reproducible Docker Compose test stack configured with concurrency=32 and TTL=5000ms.
  - `docs/recommendation/pdp/`: Optimization plan, evaluation reports, and operational runbooks.

### B. Extended / Deferred Scope (Isolated for Future Phases)
- **Personalization Module (`apps/backend/src/modules/personalization/`):**
  - **Status:** **FROZEN** per `docs/recommendation/personalization/v2-freeze.md`.
  - **Reason:** MVP explicitly targets non-personalized Popularity and Similar Products. Customer session profiling and personalized re-ranking are scheduled for Week 6+ (v2) and do not impact MVP PDP/Home endpoints.
- **Visual Image Embeddings & Hybrid Ranker (`scripts/hm/hybrid_core.py`, `analyze-hybrid-v2.py`):**
  - **Status:** **EXPERIMENTAL / RESEARCH**.
  - **Reason:** ResNet50 visual embeddings explored for hybrid ranking require GPU infrastructure and are documented in `docs/recommendation/hybrid/`. The active production strategy for MVP remains metadata similarity + popularity fallback.
- **Automated Kaggle Downloader (`scripts/hm/download-images.py`):**
  - **Status:** **BLOCKED** on Kaggle dataset redistribution rights (see Section 5). Operates locally via test fixture images only.

---

## 4. Recommendation Quality Summary

### Popularity-Based Recommendations (Home)
- **Held-out Purchase Recall@12:** **42.95%** (vs 3.26% baseline).
- Top items represent high-converting basics: socks, swimwear, leggings, and everyday bras.

### Similar Products (PDP)
- **Catalog Coverage:** 500 Medusa products.
- **Self-Recommendations:** **0** (0.00%).
- **Duplicates:** **0** (0.00%).
- **Taxonomy Match:** **99.94%** matching `product_group` and `product_type`.
- **Top 6 Boundedness:** 100% of responses strictly return $\le 6$ products.
- **Commerce Integrity:** Every product is verified in-stock with live calculated VND prices in the target region.

---

## 5. Compliance, Security & Open Blockers

### A. Kaggle H&M Dataset Rights
- **Current Decision:** Documented in `docs/recommendation/dataset-rights-decision.md`. Raw H&M images and Kaggle article dumps are **NOT** committed to version control and **NOT** uploaded to public CDNs.
- **Local Testing:** Test fixtures and optimized sample derivatives are used for automated integration tests.
- **Blocker Status:** PR is technically ready for merge, but public production deployment requires replacing H&M sample assets with licensed catalog photography or synthetic store assets.

### B. Privacy & Commerce Invariants
- Zero customer identifiers or historical orders leaked through recommendation endpoints.
- Store product projection strips all internal metadata (`article_id`, `graph_score`) and exposes only standard Medusa Store Product fields.

---

## 6. Verification Evidence Checklist

- [x] Backend Unit Tests: **44/44 passed** (`npm run test:unit --workspace=@dtc/backend`)
- [x] Python Algorithm Tests: **34/34 passed** (`python -m unittest discover -s scripts/hm/tests -v`)
- [x] TypeScript Typecheck: **0 errors across 2 packages** (`npm run typecheck`)
- [x] ESLint Check: **0 backend issues, 0 storefront errors** (`npm run lint`)
- [x] Storefront Build: **Passed** (`npm run build --workspace=@dtc/storefront`)
- [x] Backend Build: **Passed** (`npm run build --workspace=@dtc/backend`)
- [x] Synchronization with `main`: **Merged with 0 conflicts**
- [x] Load Benchmark (30 RPS): **p95 < 200ms, Error Rate = 0.00%, 0 dropped iterations**
- [x] Quality Reports: Generated in `docs/recommendation/pdp/reports/`

---

## 7. Reviewers & Sign-off

- **Engineering Lead:** Ready for architectural sign-off.
- **DevOps / Infra:** Ensure production environment sets `RECOMMENDATION_MAX_CONCURRENCY=32` and `RECOMMENDATION_CACHE_TTL_MS=5000`.
- **Product Owner:** Verify PDP similar products and Home popularity widgets match UX specifications.
