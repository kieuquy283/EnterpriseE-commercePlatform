# Evaluation Protocol — Personalization (không trộn ba loại bằng chứng)

> **Status:** DRAFT for Phase 00/07 approval. Các ngưỡng dưới đây là đề xuất, không phải kết quả đã đo.

## A. H&M historical offline research

- Dataset: H&M transactions with `customer_id`/`article_id`/`t_dat` in private ignored storage; mapping article → Medusa product must be readback-validated and versioned. No customer identity mapping to Medusa.
- Cutoffs and train/validation/test: choose fixed chronological windows after profiling. **Never compute user histories, popularity, item–item neighbors or factors using holdout interactions.** When evaluating later items, require only earlier interactions in user profile.
- Freeze the eligible Product universe and source selection policy independent of future labels; document 500-product pilot selection bias and loss of H&M item coverage.
- Report user cohorts with ≥2/≥3 interactions, no-history/dropout, percent dropped events, repeat purchases, eligibility and coverage; model comparison on identical held-out users/items.
- Comparators: Global Popularity, V1 Content/profile rules, co-occurrence ItemKNN, ALS/BPR (optional). Evaluate Recall@12, nDCG@12, HitRate@12, catalog coverage/diversity, resource costs; optional Recall@6 for PDP. Compute paired uncertainty with user as sampling unit; report zero-history separately. No official H&M MAP@12 comparison if changing article/user target definitions.
- Be explicit if evaluation labels are purchases and never claim click/conversion uplift on real storefront.

## B. Product similarity proxy ≠ personalized relevance

- V1–V2 report: 40 frozen PDP contexts, 29 judgeable, V1 nDCG@6 0.9152 versus V2 0.8974, 95% CI crosses zero, labels Astra AI proxy. These are *item relevance* judgments, **not** label evidence that customer A would purchase item X.
- CLIP embeddings may aid future candidate generation but cannot replace customer interaction evaluation. Any optimization using these 40 context labels must use a new untouched holdout before claiming generalization.

## C. Medusa authenticated/user test data

- Create two or more synthetic QA customers in isolated DB, each with distinct category/product events and actual synthetic Orders from test flows.
- Test per-user rank differences, no-history/consent opt-out, identity swap/log-out, session expiry/consented merge, backorder/price/channel filtering, withdrawn profile deletion.
- Quality claim **only on controlled fixtures**: correctness/pass, not ML uplift. Re-run source/feature hashing and deterministic scores.

## D. Online product experiment (only with traffic, permission, instrumentation)

- Log eligible impressions, item positions, rec version, clicks and legitimate outcome attribution; bot handling and consent model. Establish denominators before CTR.
- Experiment at customer/subject level, sticky assignment, V1 generic/control versus Personalized, no cross-over leakage; predefine success metric CTR@rail or add-to-cart per eligible exposure, guardrail checkout conversion/page latency/errors and fairness/diversity.
- Use adequate sample size/power and fixed duration before statistical claims; no fake 10-user A/B test or causal revenue claims.
- Keep a privacy-preserving aggregated report; no raw user event export to docs/Git.

## Promotion gates

| Stage | Evidence | Decision |
|---|---|---|
| Engineer QA | Security, two-user isolation, user deletion, order reconciliation, E2E | PASS/FAIL, never uplift claim |
| Offline H&M research | Chronological holdout, matching target universe, paired metrics | Keep/experimental decision, not real-user personalization claim |
| Restricted private pilot | Authenticated feature flag, target load, opt-out, rollback | Private GO only if all safety gates pass |
| Public | Rights, legal/privacy review, real platform operations, acceptable performance | Separate GO/NO-GO; model-only tests insufficient |
