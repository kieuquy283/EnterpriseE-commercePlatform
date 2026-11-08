# Real H&M image acquisition and isolated import — 2026-11-06

Branch `recommendation-pdp`; source SHA `452799380adb9745c1c3f480c484df20761f0970` plus uncommitted image-pipeline edits. Windows/PowerShell, Kaggle API 1.7.4.5, Python, Medusa 2.21.2. Raw and derivative data remain gitignored under `data/hm/`.

## Commands and observed results

| Command / check | Exit | Observed result |
| --- | ---: | --- |
| `kaggle competitions files -c h-and-m-personalized-fashion-recommendations --page-size 1` | 0 | Refreshed CLI credential can list competition files. No credential value logged. |
| `python scripts/hm/download-images.py --limit 1` before path fix | 1 | Kaggle downloaded the file but flattened it into `data/hm/`; helper did not recognize it. |
| Direct `kaggle competitions download ... --file images/010/0108775015.jpg --path data/hm --quiet` | 0 | First actual H&M JPEG acquired. Visual inspection matched catalog title “Strap top”. |
| `python -m unittest scripts.hm.tests.test_image_pipeline -q` | 0 | 10 tests passed after flattened-path and ZIP-wrapper fixes. |
| `python scripts/hm/download-images.py --limit 20` | 0 | 20/20 downloaded; 5,923,711 bytes. |
| `python scripts/hm/download-images.py --limit 500 --workers 4` | 1 | 473 new, 20 existing, seven failed representative-image requests. 493 files acquired. One failure was confirmed as HTTP 404 with a direct request. |
| Direct Kaggle request for `images/017/0179208001.jpg` | 1 | HTTP 404; H&M documentation notes that not every article has an image. |
| Seven repeated `--article-id` arguments for ZIP-wrapped `.jpg` files | 0 | Seven existing ZIP payloads normalized into valid JPEGs. |
| Four same-Product alternative `--article-id` requests | 1 | Three acquired, one absent. No unrelated Product image substituted. |
| `python scripts/hm/validate-images.py` | 0 | 496 valid, 1,378 missing among 1,874 mapped articles; 496/500 Products have an image, including 493 original representatives. Zero corrupt accepted files. |
| `python scripts/hm/optimize-images.py` | 0 | 496 articles, 992 thumbnail/detail derivatives, 52,810,706 derivative bytes. |
| Read-only test-DB SKU comparison | 0 | `recommendation_test`: 1,874 DB variants, 1,874 saved mappings, zero mismatches. |
| Guarded Medusa import using test-rebound manifest | 0 | 496 Products updated in `recommendation_test`; rerun exit 0, zero Products updated. |
| Test Store API Product readback and media HEAD | 0 | Product has thumbnail and one gallery image; JPEG media URL returned HTTP 200. |
| Test recommendation API readback | 0 | Six Similar Products returned; six have thumbnails. |
| `npm run test:e2e --workspace @dtc/storefront -- e2e/hm-image-serving.spec.ts` with isolated storefront `localhost:8001` | 0 | 3/3 Chromium tests: Store search result, Similar Products card/PDP gallery, and broken JPEG fallback. Actual Kaggle image assets were used. |
| Homepage follow-up: `npm run typecheck --workspace @dtc/storefront`, `npm run lint --workspace @dtc/storefront`, real-image Playwright E2E | 0 | Replaced tall starter banner, added catalog fallback when recommendations are unavailable, and verified Home image plus the three prior cases (4/4). Lint reported 18 pre-existing warnings and zero errors. |
| Main `commerce` DB read-only count | 0 | 0/500 H&M Products have thumbnails. Main DB was not modified. |

## Coverage and limits

Raw files: 496 JPEGs, 146.11 MiB; derivatives: 992 JPEGs, 50.36 MiB. Four Products have no image from their mapped articles: representative IDs `0215324023`, `0216961011`, `0348657006`, `0369423002`. The last Product's only other mapped variant, `0369423004`, also returned an unavailable-file error. Three other missing representatives were covered by a different mapped variant of the same Product.

The isolated Medusa API and Chromium E2E prove real image import/readback and Store/PDP/Similar Products rendering on `localhost:8001`. Full commerce regression, main `localhost:8000` integration, public rights review, and performance comparison remain **NOT_RUN**. The main Compose stack runs with `NODE_ENV=production`; its media is unchanged pending separate authorization and an explicit local-only deployment plan. Public release remains **NO-GO** pending image-use rights review. The Kaggle competition source and rules remain [here](https://www.kaggle.com/competitions/h-and-m-personalized-fashion-recommendations/data).

Rollback of isolated media references uses the guarded `rollback-hm-images.ts` workflow and its journal under `data/hm/test-serving/processed/`; source JPEGs and existing commerce data are retained. Avoid `docker compose down -v`.
