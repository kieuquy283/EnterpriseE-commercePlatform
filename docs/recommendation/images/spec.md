# H&M image pipeline contract

- Input: `data/hm/processed/catalog.jsonl`, `medusa-mapping.jsonl`, H&M image path `images/<article_id[0:3]>/<article_id>.jpg`; `article_id` stays a ten-character string.
- Output: gitignored manifest, validation records, optimized JPEG derivatives, import journal and Medusa Product `thumbnail`/`images`.
- Representative thumbnail: lowest article ID in each selected Product group when valid; otherwise the lowest valid article ID for that Product. Gallery: valid images from that Product's mapped Variants only. Variant-specific media relations are not assumed.
- The importer uses `Modules.FILE` and `updateProductsWorkflow`, checks current Product provenance and Variant SKU, and reads media back. No pricing, inventory, order or recommendation rank changes.
- Import writes require `NODE_ENV=test`, `HM_IMAGE_ALLOW_LOCAL_MEDIA_WRITE=1`, DB name `recommendation_test` or `hm_images_test`, a loopback `HM_IMAGE_TEST_BACKEND_URL`, and no S3 configuration. A local test URL with public file access is not permission for public deployment.
- A missing or broken image renders a placeholder. Similar Products uses the Product's own `thumbnail`/`images` from Medusa.
- Real-image PASS needs valid Kaggle access, accepted rules, assets, isolated DB, API readback, browser verification, and commerce regression. Fixture PASS does not satisfy it.
