# Data readiness and identity boundaries

Audit baseline: `recommendation-pdp` at `cf16e0ba2e2af3519f79f5d1b516708d64a28605` on 2026-11-07. Existing unrelated dirty files were left intact.

| Evidence | Observed state | Consequence |
|---|---|---|
| `data/hm/transactions_train.csv` | Present locally, 3,488,002,253 bytes; Git ignored | Can profile and prepare offline purchase interactions privately. |
| `data/hm/processed/medusa-mapping.jsonl` | Present locally; article → Medusa variant/product mapping | Only mapped products may enter training and serving. Preserve `article_id` as string. |
| `data/hm/processed/interactions.csv` | Absent at audit | No prepared H&M customer interaction training file yet. |
| `scripts/hm/prepare.py` | Optional `--with-interactions` writes HMAC customer hashes and mapped historical purchases | Requires a stable private `HM_CUSTOMER_HASH_KEY` (at least 32 characters). Do not generate or log the key in Git. |
| Medusa `commerce` DB | Read-only query found 500 H&M products, 40 customer rows and no recommendation tables | Cannot claim any customer recommendations, or even a live active V1 run, in this database. Customer count does not prove demo-persona linkage or order histories. |
| Recommendation API/model | [route](../../../apps/backend/src/api/store/recommendations/route.ts) and [candidate model](../../../apps/backend/src/modules/recommendation/models/recommendation-candidate.ts) support `home` and `product_detail` only | No customer placement or authenticated personalization contract exists. |

`scripts/hm/profile-personalization-readiness.py` streams the private CSV and reports aggregate mapped purchases, buyer overlap across temporal splits, and train history sparsity. Output goes only to `data/hm/processed/personalization/readiness-profile.json`, which must remain ignored. Its counts describe **H&M historical buyers in the selected 500-product catalog**, not active storefront users. The profile contains no customer IDs. The source CSV, mapping and private profile must not be committed.

Measured on this local dataset with `python scripts/hm/profile-personalization-readiness.py --output data/hm/processed/personalization/readiness-profile.json` (exit 0, 2026-11-07): 31,788,324 transaction rows; 979,342 map to the 1,874 selected articles / 500 imported products (3.08%); 970,494 mapped train rows through 2020-09-08, 4,736 validation rows through 2020-09-15, and 4,112 test rows afterward. The train set has 388,152 distinct historical buyers; 155,206 bought at least two distinct mapped products. Of 2,900 mapped test buyers, 1,735 also appear in mapped train. This is **data readiness only**, not model evaluation or evidence of active personalized accounts. Input SHA-256 values are stored in the ignored profile artifact.

The selected catalog covers a small share of H&M transactions, so test positives are sparse. The proposed temporal dates are pilot boundaries, not proven optimal. Before training, inspect per-date counts, repeat products and eligible test items; decide a split once and freeze it before tuning. Report warm and cold buyers separately. Do not report model accuracy on all 31.8 million events when only mapped events can reach this storefront.

Before model choice, measure: mapped purchase rate, unique mapped buyers, number with at least two distinct imported products, repeat purchases, train→test overlap, test positives after product filtering, and per-product long tail. A low mapped rate or very sparse histories may make user collaborative filtering ineffective on the 500-product pilot. Run a temporal popularity baseline before choosing a personalized algorithm. No offline H&M metric is a storefront CTR/conversion metric.

Identity rule: historical H&M customer ID or HMAC hash is never inferred from email, name, or a newly registered Medusa account. A private demo persona may be *explicitly* assigned a pseudonymous H&M history or a clearly synthetic preference profile. Record provenance, consent/scope, and deterministic mapping in a protected store; label the UI/demo accordingly. Production accounts start with their own project-generated events and orders.
