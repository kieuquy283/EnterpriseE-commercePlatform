import { isDeepStrictEqual } from "node:util"
import type { Fixture, Snapshot } from "../inventory-order/snapshot"

export type Check = {
  name: string
  passed: boolean
  expected: unknown
  actual: unknown
}

export type ValidationResult = {
  all_passed: boolean
  passed: number
  total: number
  checks: Check[]
}

export type CheckoutResponse = { http_status: number, body: unknown }

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? value as Record<string, unknown> : {}
}

function result(checks: Check[]): ValidationResult {
  return {
    all_passed: checks.every(check => check.passed),
    passed: checks.filter(check => check.passed).length,
    total: checks.length,
    checks,
  }
}

function scopedLevels(snapshot: Snapshot, fixture: Fixture) {
  return snapshot.levels
    .filter(level => level.inventory_item_id === fixture.inventory_item_id && level.location_id === fixture.location_id)
    .map(level => ({
      id: level.id,
      inventory_item_id: level.inventory_item_id,
      location_id: level.location_id,
      stocked_quantity: level.stocked_quantity,
      reserved_quantity: level.reserved_quantity,
      incoming_quantity: level.incoming_quantity,
      available_quantity: level.available_quantity,
    }))
    .sort((left, right) => left.id.localeCompare(right.id))
}

function scopedReservations(snapshot: Snapshot, fixture: Fixture) {
  return snapshot.reservations
    .filter(row => row.inventory_item_id === fixture.inventory_item_id && row.location_id === fixture.location_id)
    .sort((left, right) => left.id.localeCompare(right.id))
}

function sharedChecks(before: Snapshot, after: Snapshot, fixture: Fixture): Check[] {
  const levels = [scopedLevels(before, fixture), scopedLevels(after, fixture)]
  return [{
    name: "same_inventory_level_and_location",
    expected: fixture.inventory_level_id,
    actual: levels.map(rows => rows.map(row => row.id)),
    passed: levels.every(rows => rows.length === 1 && rows[0].id === fixture.inventory_level_id),
  }, {
    name: "available_quantity_formula",
    expected: "available = stocked - reserved",
    actual: levels,
    passed: levels.every(rows => rows.length === 1 && rows[0].available_quantity === rows[0].stocked_quantity - rows[0].reserved_quantity),
  }]
}

export function validateFailedCheckout(
  before: Snapshot,
  after: Snapshot,
  fixture: Fixture,
  expectedErrorType: string,
  response: CheckoutResponse,
  expectedSessionStatus?: string,
): ValidationResult {
  const checks = sharedChecks(before, after, fixture)
  const body = record(response.body)
  const error = body.error && typeof body.error === "object" ? record(body.error) : body
  const errorText = [error.type, error.code, error.message].filter(value => typeof value === "string").join(" ")
  const isInventory = expectedErrorType === "inventory"
  const expectedHttp = isInventory ? "HTTP error with an inventory diagnostic" : 400
  const sessions = after.payment_sessions.filter(session => session.provider_id === fixture.payment_provider_id)
  const add = (name: string, expected: unknown, actual: unknown, passed: boolean) => checks.push({ name, expected, actual, passed })

  add("checkout_failed_http_status", expectedHttp, response.http_status,
    isInventory ? response.http_status >= 400 && response.http_status < 500 : response.http_status === 400)
  add("expected_checkout_error", expectedErrorType, error,
    isInventory ? /inventory|insufficient.*stock|not enough stock|out.of.stock/i.test(errorText) : error.type === expectedErrorType)
  if (expectedErrorType === "invalid_data") {
    add("shipping_validation_reached", "Error identifies missing shipping", error.message,
      typeof error.message === "string" && /shipping/i.test(error.message))
  }
  if (expectedSessionStatus) {
    if (expectedErrorType === "not_allowed" && expectedSessionStatus === "error") {
      add("authorization_rejection_reached", "Provider authorization rejected", error.message,
        typeof error.message === "string" && /not authorized|authoriz/i.test(error.message))
    }
    add("payment_session_status", [{ provider_id: fixture.payment_provider_id, status: expectedSessionStatus }], sessions,
      sessions.length === 1 && sessions[0].status === expectedSessionStatus)
  }
  add("inventory_restored_to_baseline", scopedLevels(before, fixture), scopedLevels(after, fixture),
    isDeepStrictEqual(scopedLevels(before, fixture), scopedLevels(after, fixture)))
  add("reservations_restored_to_baseline", scopedReservations(before, fixture), scopedReservations(after, fixture),
    isDeepStrictEqual(scopedReservations(before, fixture), scopedReservations(after, fixture)))
  add("same_cart_uncompleted", { id: before.cart?.id, completed_at: null }, after.cart,
    Boolean(before.cart && after.cart && before.cart.id === after.cart.id && after.cart.completed_at === null))
  add("no_active_order_cart_link", [], after.order_cart_links, after.order_cart_links.length === 0)
  add("no_active_order_added", before.active_counts.orders, after.active_counts.orders,
    before.active_counts.orders === after.active_counts.orders && after.order === null)
  add("no_capture_or_refund", { captures: before.captures, refunds: before.refunds }, { captures: after.captures, refunds: after.refunds },
    isDeepStrictEqual(before.captures, after.captures) && isDeepStrictEqual(before.refunds, after.refunds))
  return result(checks)
}

export function validateReservationSuccess(before: Snapshot, after: Snapshot, fixture: Fixture): ValidationResult {
  const checks = sharedChecks(before, after, fixture)
  const initial = scopedLevels(before, fixture)[0]
  const final = scopedLevels(after, fixture)[0]
  const quantity = fixture.quantity * fixture.required_quantity
  const oldReservations = scopedReservations(before, fixture)
  const oldIds = new Set(oldReservations.map(row => row.id))
  const finalReservations = scopedReservations(after, fixture)
  const added = finalReservations.filter(row => !oldIds.has(row.id))
  const item = after.order_items[0]
  const order = after.order
  const add = (name: string, expected: unknown, actual: unknown, passed: boolean) => checks.push({ name, expected, actual, passed })

  add("stocked_and_incoming_unchanged", initial, final,
    Boolean(initial && final && final.stocked_quantity === initial.stocked_quantity && final.incoming_quantity === initial.incoming_quantity))
  add("reserved_delta", quantity, initial && final ? final.reserved_quantity - initial.reserved_quantity : null,
    Boolean(initial && final && final.reserved_quantity - initial.reserved_quantity === quantity))
  add("available_delta", -quantity, initial && final ? final.available_quantity - initial.available_quantity : null,
    Boolean(initial && final && final.available_quantity - initial.available_quantity === -quantity))
  add("baseline_reservations_preserved", oldReservations, finalReservations.filter(row => oldIds.has(row.id)),
    isDeepStrictEqual(oldReservations, finalReservations.filter(row => oldIds.has(row.id))))
  add("current_order_item", "One current-version item with selected variant and quantity", after.order_items,
    Boolean(order && item && after.order_items.length === 1 && item.order_id === order.id && item.version === order.version &&
      item.variant_id === fixture.variant_id && item.quantity === fixture.quantity))
  add("reservation_matches_order_line", "One new reservation for the selected item/location and ordered quantity", added,
    added.length === 1 && Boolean(item?.order_line_item_id) && added[0].line_item_id === item.order_line_item_id &&
      added[0].quantity === quantity && !added[0].allow_backorder)
  add("cart_completed_and_linked", "Same cart completed and linked to the order", { cart: after.cart, links: after.order_cart_links },
    Boolean(before.cart && after.cart && before.cart.id === after.cart.id && after.cart.completed_at && order &&
      after.order_cart_links.length === 1 && after.order_cart_links[0].cart_id === before.cart.id && after.order_cart_links[0].order_id === order.id))
  add("one_active_order_added", 1, after.active_counts.orders - before.active_counts.orders,
    after.active_counts.orders - before.active_counts.orders === 1)
  add("no_fulfillment", "No fulfillment or fulfilled/shipped/delivered quantity", after.fulfillment_links,
    after.fulfillment_links.length === 0 && after.order_items.every(row => row.fulfilled_quantity === 0 && row.shipped_quantity === 0 && row.delivered_quantity === 0))
  return result(checks)
}

export function validateRetry(before: Snapshot, after: Snapshot, expectedOrderId: string, response: CheckoutResponse): ValidationResult {
  const fixture = before.fixture
  const checks = sharedChecks(before, after, fixture)
  const body = record(response.body)
  const order = record(body.order)
  const add = (name: string, expected: unknown, actual: unknown, passed: boolean) => checks.push({ name, expected, actual, passed })
  add("retry_returns_same_order", expectedOrderId, { http_status: response.http_status, type: body.type, order_id: order.id },
    response.http_status === 200 && body.type === "order" && order.id === expectedOrderId && before.order?.id === expectedOrderId && after.order?.id === expectedOrderId)
  add("retry_inventory_unchanged", scopedLevels(before, fixture), scopedLevels(after, fixture),
    isDeepStrictEqual(scopedLevels(before, fixture), scopedLevels(after, fixture)))
  add("retry_reservations_unchanged", scopedReservations(before, fixture), scopedReservations(after, fixture),
    isDeepStrictEqual(scopedReservations(before, fixture), scopedReservations(after, fixture)))
  add("retry_no_duplicate_order_or_payment", before.active_counts, after.active_counts,
    before.active_counts.orders === after.active_counts.orders && before.active_counts.payments === after.active_counts.payments)
  add("retry_order_cart_link_unchanged", before.order_cart_links, after.order_cart_links,
    before.order_cart_links.length === 1 && after.order_cart_links.length === 1 &&
    before.order_cart_links[0].order_id === expectedOrderId && isDeepStrictEqual(before.order_cart_links, after.order_cart_links))
  return result(checks)
}
