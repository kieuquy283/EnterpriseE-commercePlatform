import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"

const fixtureUrl = new URL("../docs/report/fixtures/data-04-reporting.json", import.meta.url)
const fixture = JSON.parse(await readFile(fixtureUrl, "utf8"))

function indexBy(rows, getKey) {
  const index = new Map()
  for (const row of rows) {
    const key = getKey(row)
    assert(!index.has(key), `Duplicate input key: ${key}`)
    index.set(key, row)
  }
  return index
}

function summarizeOrders(orders) {
  const statusTotals = new Map()
  const fulfillmentCounts = new Map()
  let awaitingFulfillment = 0
  let nonCanceledValue = 0
  let nonVndCount = 0

  for (const order of orders) {
    const status = statusTotals.get(order.status) ?? { order_count: 0, order_value_vnd: 0 }
    status.order_count++
    statusTotals.set(order.status, status)
    fulfillmentCounts.set(
      order.fulfillment_status,
      (fulfillmentCounts.get(order.fulfillment_status) ?? 0) + 1,
    )

    if (
      ["pending", "requires_action"].includes(order.status) &&
      ["not_fulfilled", "partially_fulfilled"].includes(order.fulfillment_status)
    ) {
      awaitingFulfillment++
    }

    if (order.currency_code === "vnd") {
      assert(
        Number.isSafeInteger(order.total) && order.total >= 0,
        `Invalid VND total for ${order.id}`,
      )
      status.order_value_vnd += order.total
      if (order.status !== "canceled") nonCanceledValue += order.total
    } else {
      nonVndCount++
    }
  }

  return {
    order_count: orders.length,
    orders_by_status: Object.fromEntries(statusTotals),
    orders_by_fulfillment_status: Object.fromEntries(fulfillmentCounts),
    awaiting_fulfillment_order_count: awaitingFulfillment,
    non_canceled_order_value_vnd: nonCanceledValue,
    non_vnd_order_count: nonVndCount,
  }
}

function summarizeCod(orders, observations, snapshotAt, evidenceAvailable) {
  const evidenceByOrder = indexBy(observations, (row) => row.order_id)
  const totals = {
    collected_order_count: 0,
    collected_amount_vnd: 0,
    uncollected_order_count: 0,
    unknown_order_count: 0,
    unknown_method_order_count: 0,
  }

  for (const order of orders) {
    if (order.status === "canceled") continue
    if (order.payment_method === "unknown") totals.unknown_method_order_count++
    if (order.payment_method !== "cod") continue

    if (!evidenceAvailable || order.currency_code !== "vnd") {
      totals.unknown_order_count++
      continue
    }

    const evidence = evidenceByOrder.get(order.id)
    if (!evidence) {
      totals.uncollected_order_count++
      continue
    }

    const confirmedAt = Date.parse(evidence.confirmed_at)
    const validObservation =
      evidence.reference &&
      evidence.actor_ref &&
      confirmedAt >= Date.parse(order.created_at) &&
      confirmedAt <= snapshotAt

    if (
      validObservation &&
      evidence.state === "collected" &&
      evidence.amount_vnd > 0 &&
      evidence.amount_vnd === order.total
    ) {
      totals.collected_order_count++
      totals.collected_amount_vnd += evidence.amount_vnd
    } else if (validObservation && evidence.state === "uncollected" && evidence.amount_vnd === 0) {
      totals.uncollected_order_count++
    } else {
      totals.unknown_order_count++
    }
  }

  return totals
}

function summarizeStock(variants, levels, locationId, threshold) {
  const levelsAtLocation = indexBy(
    levels.filter((level) => level.location_id === locationId),
    (level) => level.inventory_item_id,
  )
  const variantsById = indexBy(variants, (variant) => variant.id)
  const sortedVariants = [...variantsById.values()].sort(
    (left, right) =>
      (left.sku ?? "").localeCompare(right.sku ?? "", "en") ||
      left.id.localeCompare(right.id, "en"),
  )
  const lowStock = []
  const exceptions = []

  for (const variant of sortedVariants) {
    if (!variant.manage_inventory) continue
    const { id, sku, components } = variant
    const variantRef = { variant_id: id, sku: sku ?? null }
    indexBy(components, (component) => component.inventory_item_id)
    if (
      !components.length ||
      components.some((component) => !levelsAtLocation.has(component.inventory_item_id))
    ) {
      exceptions.push({
        ...variantRef,
        reason: components.length ? "missing_inventory_level" : "missing_inventory_link",
      })
      continue
    }

    const availableByComponent = components.map(({ inventory_item_id, required_quantity }) => {
      const { stocked_quantity, reserved_quantity } = levelsAtLocation.get(inventory_item_id)
      assert(
        Number.isSafeInteger(required_quantity) && required_quantity > 0,
        `Invalid requirement for ${sku}`,
      )
      assert(
        [stocked_quantity, reserved_quantity].every(
          (quantity) => Number.isSafeInteger(quantity) && quantity >= 0,
        ),
        `Invalid inventory level for ${sku}`,
      )
      return Math.floor((stocked_quantity - reserved_quantity) / required_quantity)
    })
    const available = Math.min(...availableByComponent)
    if (available < 0) exceptions.push({ ...variantRef, reason: "negative_available_quantity" })
    if (available <= threshold)
      lowStock.push({ ...variantRef, available_quantity: Math.max(0, available) })
  }

  return { low_stock: lowStock, stock_exceptions: exceptions }
}

const { report, orders, inventory, cod_observations, expected, expected_cod_without_evidence } =
  fixture
const localDay = new Intl.DateTimeFormat("sv-SE", {
  timeZone: report.time_zone,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
})
const snapshotAt = Date.parse(report.as_of)
const uniqueOrders = indexBy(orders, (order) => order.id)
const cohort = [...uniqueOrders.values()].filter((order) => {
  const createdAt = Date.parse(order.created_at)
  const createdDay = localDay.format(createdAt)
  return (
    !order.is_draft_order &&
    order.status !== "draft" &&
    createdAt <= snapshotAt &&
    createdDay >= report.from_local_date &&
    createdDay < report.to_local_date_exclusive
  )
})

const actual = {
  ...summarizeOrders(cohort),
  ...summarizeStock(
    inventory.variants,
    inventory.levels,
    report.location_id,
    report.low_stock_threshold,
  ),
  cod: summarizeCod(cohort, cod_observations, snapshotAt, report.cod_evidence_available),
}
assert.deepEqual(actual, expected, "DATA-04 report differs from the expected fixture totals")
assert.deepEqual(
  summarizeCod(cohort, cod_observations, snapshotAt, false),
  expected_cod_without_evidence,
  "DATA-04 COD report must show eligible orders as unknown when the source is unavailable",
)

console.log(JSON.stringify(actual, null, 2))
console.log("DATA-04 PASS: reference report and COD evidence outage match the expected fixture.")
