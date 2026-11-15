import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { applyImportPlan } from "./daymark-catalog/apply"
import { DAYMARK_CATALOG_FIXTURE } from "./daymark-catalog/fixture"
import {
  assertImportGuard,
  assertLocalImagePreviewGuard,
  parseImageMode,
  CatalogImportRefused,
} from "./daymark-catalog/guards"
import { loadCatalogDataset, readAssetBytes, resolveAssetDir } from "./daymark-catalog/loader"
import { buildImportPlan, summarisePlan } from "./daymark-catalog/plan"
import { formatCounts, formatPlanReport } from "./daymark-catalog/report"
import { readCatalogSnapshot } from "./daymark-catalog/snapshot"
import { validateFixture } from "./daymark-catalog/validate-fixture"

/**
 * Imports the DAYMARK catalog fixture (30 products, size/colour SKUs, VND
 * prices, opening stock) into a store that was already bootstrapped by
 * `seed-commerce.ts`.
 *
 *   npm run seed:daymark-catalog --workspace=@dtc/backend                          # dry run
 *   DAYMARK_CATALOG_WRITE=1 DAYMARK_CATALOG_ENVIRONMENT=local-disposable \
 *     npm run seed:daymark-catalog --workspace=@dtc/backend -- --apply [--images manifest]
 *
 * The importer matches its own records only (handle `dm-*`, SKU `DM-*`) and
 * never deletes or rewrites commerce data it does not own.
 */
export default async function seedDaymarkCatalog({ container, args }: ExecArgs) {
  // Medusa 2.21 CLI keeps tokens after `--` in process.argv, outside positional args.
  const separator = process.argv.indexOf("--")
  const argv = args?.length ? args : separator >= 0 ? process.argv.slice(separator + 1) : []
  if (argv.includes("--help")) {
    process.stdout.write(
      [
        "DAYMARK catalog importer",
        "",
        "Flags:",
        "  --dry-run            Print the plan without writing (default).",
        "  --apply              Apply the plan through Medusa workflows.",
        "  --images none|manifest|demo",
        "                       Use exact product media or explicit local demo photos (default none).",
        "",
        "Required for --apply:",
        "  DAYMARK_CATALOG_WRITE=1",
        "  DAYMARK_CATALOG_ENVIRONMENT=local-disposable",
        "",
      ].join("\n"),
    )
    return
  }

  const guard = assertImportGuard({ argv, env: process.env })
  const imageMode = parseImageMode(argv)
  if (imageMode === "demo") assertLocalImagePreviewGuard(process.env)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)

  const fixtureValidation = validateFixture(DAYMARK_CATALOG_FIXTURE)
  if (!fixtureValidation.ok) {
    throw new CatalogImportRefused(
      `The DAYMARK catalog fixture is invalid:\n  - ${fixtureValidation.errors.join("\n  - ")}`,
    )
  }

  const assetDir = resolveAssetDir(process.cwd(), process.env)
  const dataset = loadCatalogDataset({ assetDir, fixture: DAYMARK_CATALOG_FIXTURE })
  if (dataset.errors.length) {
    throw new CatalogImportRefused(
      `The DAYMARK image dataset is invalid:\n  - ${dataset.errors.join("\n  - ")}`,
    )
  }
  const imagesEnabled = imageMode !== "none"
  const includeRepresentativeImages = imageMode === "demo"

  const snapshot = await readCatalogSnapshot(container)
  const plan = buildImportPlan({
    fixture: DAYMARK_CATALOG_FIXTURE,
    snapshot,
    manifest: dataset.manifest,
    imagesEnabled,
    includeRepresentativeImages,
  })

  const report = formatPlanReport({
    fixture: DAYMARK_CATALOG_FIXTURE,
    plan,
    mode: guard.mode,
    databaseHost: guard.databaseHost,
    warnings: [...guard.warnings, ...dataset.warnings],
    verbose: guard.mode === "dry-run" || plan.blockers.length > 0,
  })
  process.stdout.write(`${report}\n`)

  if (guard.mode === "dry-run") {
    return
  }

  if (plan.blockers.length) {
    throw new CatalogImportRefused(
      `Refusing to apply: ${plan.blockers.length} blocker(s) listed above. Resolve them and re-run the dry run.`,
    )
  }

  const summary = await applyImportPlan(
    {
      container,
      fixture: DAYMARK_CATALOG_FIXTURE,
      manifest: dataset.manifest,
      assetDir: dataset.assetDir,
      readAsset: (filename) => readAssetBytes(dataset.assetDir, filename),
    },
    plan,
    snapshot,
  )

  process.stdout.write("\nApplied\n")
  for (const line of [
    formatCounts("collections", summary.collections),
    formatCounts("categories", summary.categories),
    formatCounts("products", summary.products),
    formatCounts("inventory levels", summary.inventory),
    formatCounts("product images", summary.images),
  ]) {
    process.stdout.write(`  ${line}\n`)
  }
  process.stdout.write(
    `  image uploads unavailable: ${summary.imageUploadsUnavailable}, uploads performed: ${summary.images.insert}\n`,
  )
  for (const note of summary.notes) {
    process.stdout.write(`  note: ${note}\n`)
  }

  // Verify pending work from a fresh snapshot; a full second invocation is separate evidence.
  const after = await readCatalogSnapshot(container)
  const recheck = buildImportPlan({
    fixture: DAYMARK_CATALOG_FIXTURE,
    snapshot: after,
    manifest: dataset.manifest,
    imagesEnabled,
    includeRepresentativeImages,
  })
  const recheckSummary = summarisePlan(recheck)
  if (
    recheck.blockers.length ||
    Object.values(recheckSummary).some(
      (counts) => counts.insert || counts.update || counts.conflict,
    )
  ) {
    throw new CatalogImportRefused(
      "Import has pending work after applying. Review the summary and re-run a dry run; no complete import is claimed.",
    )
  }
  logger.info(
    `DAYMARK catalog import finished. Re-run check: products inserted ${recheckSummary.products.insert}, updated ${recheckSummary.products.update}, inventory inserted ${recheckSummary.inventory.insert}, updated ${recheckSummary.inventory.update}.`,
  )
  process.stdout.write(
    `  re-run check (fresh state): products inserted ${recheckSummary.products.insert}, updated ${recheckSummary.products.update}, conflict ${recheckSummary.products.conflict}; inventory inserted ${recheckSummary.inventory.insert}, updated ${recheckSummary.inventory.update}\n`,
  )
}
