# Phase 00 — source and rights

Source: [Kaggle H&M dataset](https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations/data). It lists `images/`, says images follow the first three digits of `article_id`, and warns that some articles have no image. The competition data page reports approximately 34.56 GB for the entire dataset; this pipeline requests selected files only.

[Competition rules, section 7](https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations/rules) state non-commercial/academic use and restrict redistribution or making data available to people who have not agreed to the rules. A public storefront with the original images is **NO-GO** without a separate rights decision. Local-only technical processing is the intended private scope. This document is a technical gate, not legal advice.

The initial 2026-11-06 `kaggle competitions files` request returned `401 Unauthorized`. The user refreshed the CLI credential; a repeated file listing and selective image downloads succeeded. Credential contents were not logged. The acquired 496 source JPEGs and derivatives remain under gitignored `data/hm/`. See [real-image evidence](reports/real_hm_images_2026-11-06.md). Current branch `recommendation-pdp`, baseline `452799380adb9745c1c3f480c484df20761f0970`; an unrelated user ZIP remains untracked.

Database safety: main Compose PostgreSQL is shared commerce data and must not be used for image writes. The dedicated `recommendation-test` stack was stopped at audit; the importer hard-gates test DB names.
