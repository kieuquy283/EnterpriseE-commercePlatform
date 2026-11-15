# DAYMARK catalog fixture and importer

The fixture implements the catalog-input part of FR-02/FLOW-02 and initial inventory for FR-06. It is a fictional class/demo assortment, not evidence of manufactured stock or a completed staff fulfillment flow.

| Item | Implemented |
| --- | --- |
| Source | `apps/backend/src/scripts/daymark-catalog/fixture.ts` |
| Products / variants | 30 / 230 unique size-colour SKUs |
| Collections | Daily Essentials, Workday, Off Hours |
| Categories | Áo thun, Áo sơ mi, Quần, Áo khoác, Đồ dệt kim, Túi xách |
| Market | Vietnam / VND; whole đồng amounts written through Medusa |
| Opening inventory | 2,554 units across 230 variants at the bootstrapped default warehouse |
| Identity | Stable `dm-*` handles, `DM-*` SKUs and `daymark_dataset=daymark-catalog` ownership metadata |
| Copy | English product/collection names with Vietnamese product descriptions and category/colour labels |
| Product photographs | 30 product-specific representative clothing photos mapped to 30 fixture handles; they are demo imagery, not photos of DAYMARK-manufactured SKUs |

Thirty product photos and four existing editorial photographs are retained under `apps/backend/assets/daymark-catalog`. The storefront uses four selected catalog photographs for the two landing hero images and Workday and Daily Essentials covers, plus editorial photos for other brand sections. Product photos are mapped to one fixture handle each; they illustrate the garment category and DAYMARK palette, not a verified physical SKU or every size and colour option. No H&M/research assets are used.

## Separate bootstrap and import

`seed-commerce.ts` remains the existing bootstrap (region, channel/key, warehouse, shipping and its three legacy products). It is separate from this importer and is not automatically invoked. No administrator/default password is created. The importer reads the Vietnam region, default sales channel/location and default shipping profile, and refuses missing prerequisites. It does not certify shipping/provider/staff configuration merely from these reads.

Do not run either script against AWS or a shared database. Local disposable services were used for the recorded checks. The bootstrap's legacy products remain untouched.

```sh
# From the repository root; DATABASE_URL must already target a disposable local database.
npm run seed:daymark-catalog --workspace=@dtc/backend
npm run seed:daymark-catalog --workspace=@dtc/backend -- --dry-run

DAYMARK_CATALOG_WRITE=1 DAYMARK_CATALOG_ENVIRONMENT=local-disposable \
  npm run seed:daymark-catalog --workspace=@dtc/backend -- --apply
```

The package script supplies Medusa's `--` separator. The importer consumes the following script arguments, defaults to dry-run and rejects production mode, unknown/ambiguous mode flags, missing/malformed/non-PostgreSQL connection URLs and remote hosts. Apply additionally requires both opt-ins shown above. The legacy remote-override variable is ineffective. Database credentials are never included in its report.

Optional `--images none|manifest|demo` defaults to `none`. `manifest` accepts exact-product mappings. `demo` attaches the representative fixture images only when `NODE_ENV=test`, `DAYMARK_LOCAL_IMAGE_BACKEND_URL` is a loopback URL, and no S3 provider is configured. `DAYMARK_CATALOG_ASSET_DIR` can point at a local fixture directory. File sizes, checksums and product mappings are validated before writes. Representative photos are never treated as exact merchandise images.

## Ownership, repeatability and stock preservation

The pure planner prints inserted/updated/skipped/conflict counts and changes. Apply refuses blockers, then uses supported Medusa workflows and query.graph; there is no SQL or direct database client.

An existing matching handle without DAYMARK ownership metadata is a conflict. Cross-product SKU collisions and orphan inventory-SKU collisions block writes. Option-set mismatches require manual reconciliation. No product, order, customer, variant or unrelated category association is deleted. Additional variants, categories, other currencies, tier/rule prices and existing media are preserved.

Opening inventory is initialized only for missing levels; **existing levels are never reset**, including quantities changed by purchases, reservations or staff adjustments. Catalog re-import is not a restocking operation. Apply re-reads current inventory before creating missing levels and checks remaining work from a fresh snapshot. An incomplete apply fails explicitly and is recoverable by a reviewed re-run; the whole multi-workflow import is not claimed to be one atomic transaction or safe for concurrent importer processes.

## Media delivery

Media uses the configured Medusa file provider. The explicit local demo mode uses Medusa's local file provider and loopback URL only. In S3 proxy mode `S3_FILE_URL` must target `https://<backend>/product-images`, while the existing provider prefixes keys with `public-images/`. The importer validates returned URLs against the configured provider boundary and refuses direct bucket/nested-key URLs. No cloud asset upload is part of the class preview.

## Evidence and remaining limits

See [storefront/catalog validation](../design-system/VALIDATION.md) for exact commands and outcomes. The disposable PostgreSQL/Redis run created 30 products, 230 variants and stock levels, then a separate apply skipped them all. The image-mode dry-run planned 30 uploads; the first apply updated only product media and uploaded all 30 photos. The second image apply skipped all 30 media records and uploaded none. Both applies reported no pending work; existing inventory, customer and order aggregates were unchanged. These are local results, not shared-store or cloud results.

Photos of exact manufactured items and each variant, measured garment sizing, live notification delivery, staff operations and a current production journey remain separate gaps. The importer does not manufacture evidence for them.
