# Similar Products V2 freeze

Status: **FROZEN / NO PROMOTION** as of 2026-11-07, branch `recommendation-pdp`, HEAD `cf16e0ba2e2af3519f79f5d1b516708d64a28605`. Preserve all V2 artifacts and uncommitted work. Do not tune V2 weights, publish a V2 candidate run, change recommendation feature flags, or move an active run pointer while building personalization. V1 metadata Similar Products is the intended comparison and rollback baseline, subject to deployment verification.

Evidence: [final V2.1 decision](../hybrid/reports/final_v2_1_decision.md), [V2 implementation report](../hybrid/reports/real_v2_implementation_report.md). V2's Astra proxy labels do not prove human relevance or a significant uplift. Human holdout review remains pending. Resumption requires a separate decision and the V2.1 quality gates.

**Environment caveat:** The local `commerce` database checked during this audit has 500 H&M products and 40 customer rows, but no `recommendation_active` table. This does not show an active V1 or V2 run in that database. No migration or activation was made to that database. A different environment may differ; verify its DB identity and active pointer before making deployment claims.
