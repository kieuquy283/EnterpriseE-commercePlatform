import type { ImportPlan, PlanCounts, PlanSummary } from "./types"
import { summarisePlan } from "./plan"
import { summariseFixture } from "./validate-fixture"
import type { CatalogFixture } from "./types"

// Human readable dry-run/apply report. Deliberately prints no connection
// credentials, tokens or full URLs beyond the redacted database host.

export function formatCounts(label: string, counts: PlanCounts): string {
  return `${label}: inserted ${counts.insert}, updated ${counts.update}, skipped ${counts.skip}, conflict ${counts.conflict}`
}

export function formatSummary(summary: PlanSummary): string[] {
  return [
    formatCounts("collections", summary.collections),
    formatCounts("categories", summary.categories),
    formatCounts("products", summary.products),
    formatCounts("inventory levels", summary.inventory),
    formatCounts("product images", summary.images),
  ]
}

export type PlanReportOptions = {
  fixture: CatalogFixture
  plan: ImportPlan
  mode: "dry-run" | "apply"
  databaseHost: string
  warnings: string[]
  verbose: boolean
}

export function formatPlanReport(options: PlanReportOptions): string {
  const stats = summariseFixture(options.fixture)
  const summary = summarisePlan(options.plan)
  const lines: string[] = []

  lines.push("DAYMARK catalog import")
  lines.push(`  mode: ${options.mode}`)
  lines.push(`  database host: ${options.databaseHost}`)
  lines.push(
    `  fixture version ${options.fixture.version}: ${stats.products} products, ${stats.variants} variants, ${stats.collections} collections, ${stats.categories} categories`,
  )
  lines.push(
    `  opening stock units: ${stats.totalStockUnits}; price range ${stats.minPriceVnd}-${stats.maxPriceVnd} VND`,
  )
  lines.push(`  product images: ${options.plan.imagesEnabled ? "requested" : "not requested"}`)
  lines.push("")

  for (const line of formatSummary(summary)) {
    lines.push(`  ${line}`)
  }

  const interesting = [
    ...options.plan.collections,
    ...options.plan.categories,
    ...options.plan.products,
    ...options.plan.images,
  ].filter((operation) => operation.action !== "skip")

  if (options.verbose && interesting.length) {
    lines.push("")
    lines.push("Planned changes")
    for (const operation of [...options.plan.collections, ...options.plan.categories]) {
      if (operation.action === "skip") continue
      lines.push(`  [${operation.action}] ${operation.key}`)
      for (const change of operation.changes) {
        lines.push(`      ${change.field}: ${change.from} -> ${change.to}`)
      }
    }
    for (const operation of options.plan.products) {
      if (operation.action === "skip") continue
      lines.push(`  [${operation.action}] ${operation.key} (${operation.label})`)
      if (operation.reason) {
        lines.push(`      reason: ${operation.reason}`)
      }
      const shown = operation.changes.slice(0, 6)
      for (const change of shown) {
        lines.push(`      ${change.field}: ${change.from} -> ${change.to}`)
      }
      if (operation.changes.length > shown.length) {
        lines.push(`      ... ${operation.changes.length - shown.length} more changes`)
      }
    }
    for (const operation of options.plan.images) {
      if (operation.action === "skip") continue
      lines.push(`  [${operation.action}] image ${operation.key}`)
    }
    const inventoryChanges = options.plan.inventory.filter(
      (operation) => operation.action !== "skip",
    )
    if (inventoryChanges.length) {
      lines.push(`  inventory level changes: ${inventoryChanges.length}`)
      for (const operation of inventoryChanges.slice(0, 10)) {
        lines.push(
          `      [${operation.action}] ${operation.key}: ${operation.changes
            .map((change) => `${change.field} ${change.from} -> ${change.to}`)
            .join("; ")}`,
        )
      }
      if (inventoryChanges.length > 10) {
        lines.push(`      ... ${inventoryChanges.length - 10} more inventory changes`)
      }
    }
  }

  const imageSkips = options.plan.images.filter(
    (operation) => operation.action === "skip" && operation.reason,
  )
  if (imageSkips.length) {
    lines.push("")
    lines.push("Image uploads not applied")
    const reasons = new Set(imageSkips.map((operation) => operation.reason as string))
    for (const reason of reasons) {
      lines.push(`  - ${reason}`)
    }
  }

  if (options.plan.warnings.length || options.warnings.length) {
    lines.push("")
    lines.push("Warnings")
    for (const warning of [...options.warnings, ...options.plan.warnings]) {
      lines.push(`  - ${warning}`)
    }
  }

  if (options.plan.blockers.length) {
    lines.push("")
    lines.push("Blockers (a dry run still prints the plan; --apply is refused)")
    for (const blocker of options.plan.blockers) {
      lines.push(`  - ${blocker}`)
    }
  }

  lines.push("")
  if (options.mode === "dry-run") {
    lines.push("Dry run: no writes were performed.")
  } else {
    lines.push("Apply mode: writes were performed through Medusa workflows.")
  }

  return lines.join("\n")
}
