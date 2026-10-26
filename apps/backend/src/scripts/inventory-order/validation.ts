import assert from "node:assert/strict"
import type { Fixture, Snapshot } from "./snapshot"

type OrderReadback = {
  id: string
  version: number
  currency_code: string
  items: { id: string, variant_id: string | null, quantity: number, unit_price: number }[]
}

export function validateInventoryOrder(t0: Snapshot, t1: Snapshot, t2: Snapshot, fixture: Fixture, readback: OrderReadback) {
  const results: { id: string, expected: unknown, actual: unknown, passed: boolean }[] = []
  const check = (id: string, expected: unknown, actual: unknown, passed: boolean) => {
    results.push({ id, expected, actual, passed })
  }
  const equal = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right)
  const selected = (data: Snapshot) => {
    const level = data.levels.find(row => row.id === fixture.inventory_level_id)
    assert.ok(level, "The selected inventory level must exist at all three stages")
    return level
  }
  const l0 = selected(t0)
  const l1 = selected(t1)
  const l2 = selected(t2)
  const required = fixture.quantity * fixture.required_quantity
  const otherLevels = (data: Snapshot) => data.levels.filter(row => row.id !== fixture.inventory_level_id)
  const baselineIds = new Set(t1.reservations.map(row => row.id))
  const added = t2.reservations.filter(row => !baselineIds.has(row.id))
  const order = t2.order
  const item = t2.order_items[0]
  const collectionId = t1.payment_collections[0]?.id
  const payment = t2.payments[0]
  const session = t2.payment_sessions.find(row => row.id === payment?.payment_session_id)
  const collection = t2.payment_collections.find(row => row.id === collectionId)

  check("same_run_and_fixture", "T0/T1/T2 share the run, item and location", [t0, t1, t2].map(data => ({ run_id: data.run_id, fixture: data.fixture })),
    [t0, t1, t2].every(data => data.run_id === fixture.run_id && equal(data.fixture, fixture)) &&
    [l0, l1, l2].every(row => row.inventory_item_id === fixture.inventory_item_id && row.location_id === fixture.location_id))
  check("T0_before_cart", "No cart or order at T0", { cart: t0.cart, order: t0.order }, !t0.cart && !t0.order)
  check("T0_T1_inventory_unchanged", "All active levels unchanged", { before: t0.levels.length, after: t1.levels.length }, equal(t0.levels, t1.levels))
  check("T0_T1_reservations_unchanged", "All existing reservations unchanged", { before: t0.reservations.length, after: t1.reservations.length }, equal(t0.reservations, t1.reservations))
  check("T0_T1_no_order_created", 0, t1.active_counts.orders - t0.active_counts.orders, t1.active_counts.orders === t0.active_counts.orders)
  check("T1_checkout_ready", "One uncompleted cart item, selected variant, quantity 2", { cart: t1.cart, items: t1.cart_items },
    Boolean(t1.cart && !t1.cart.completed_at && t1.cart.sample_run === fixture.run_id && t1.cart_items.length === 1 &&
      t1.cart_items[0].variant_id === fixture.variant_id && t1.cart_items[0].quantity === fixture.quantity))
  check("T1_T2_stocked_unchanged", 0, l2.stocked_quantity - l1.stocked_quantity, l2.stocked_quantity === l1.stocked_quantity)
  check("T1_T2_reserved_delta", required, l2.reserved_quantity - l1.reserved_quantity, l2.reserved_quantity - l1.reserved_quantity === required)
  check("T1_T2_available_delta", -required, l2.available_quantity - l1.available_quantity, l2.available_quantity - l1.available_quantity === -required)
  check("T1_T2_incoming_unchanged", 0, l2.incoming_quantity - l1.incoming_quantity, l2.incoming_quantity === l1.incoming_quantity)
  check("T1_T2_other_levels_unchanged", "All other levels identical", otherLevels(t2).length, equal(otherLevels(t1), otherLevels(t2)))
  check("baseline_reservations_preserved", "All pre-existing reservation rows identical", baselineIds.size,
    equal(t1.reservations, t2.reservations.filter(row => baselineIds.has(row.id))))
  check("order_current_version_and_quantity", "One current-version item, selected variant, quantity 2", t2.order_items,
    Boolean(order && t2.order_items.length === 1 && item.version === order.version && item.order_id === order.id &&
      item.variant_id === fixture.variant_id && item.quantity === fixture.quantity && order.sample_run === fixture.run_id))
  check("reservation_matches_order_line", "One new reservation for this OrderLineItem/item/location and required quantity", added,
    added.length === 1 && added[0].line_item_id === item?.order_line_item_id &&
    added[0].inventory_item_id === fixture.inventory_item_id && added[0].location_id === fixture.location_id &&
    added[0].quantity === required && !added[0].allow_backorder)
  check("order_cart_link", "One link from this cart to this order", t2.order_cart_links,
    t2.order_cart_links.length === 1 && t2.order_cart_links[0].order_id === order?.id && t2.order_cart_links[0].cart_id === t1.cart?.id)
  check("new_order_count", 1, t2.active_counts.orders - t1.active_counts.orders, t2.active_counts.orders - t1.active_counts.orders === 1)
  check("cart_completed", "completed_at set", t2.cart?.completed_at, Boolean(t2.cart?.completed_at))
  check("no_fulfillment", "No fulfillment, zero fulfilled/shipped/delivered", t2.fulfillment_links,
    t2.fulfillment_links.length === 0 && t2.order_items.every(row => row.fulfilled_quantity === 0 && row.shipped_quantity === 0 && row.delivered_quantity === 0))
  check("order_read_back_via_store_api", "Same Order/current version/line/variant/quantity/currency", readback,
    Boolean(order && readback.id === order.id && readback.version === order.version && readback.currency_code === fixture.currency_code &&
      readback.items.length === 1 && readback.items[0].id === item?.order_line_item_id &&
      readback.items[0].variant_id === fixture.variant_id && readback.items[0].quantity === fixture.quantity))
  check("payment_collection_link", "Cart and order share the selected collection", { cart: t2.cart_payment_links, order: t2.order_payment_links },
    Boolean(collectionId && t2.order_payment_links.length === 1 && t2.order_payment_links[0].payment_collection_id === collectionId &&
      t2.cart_payment_links.length === 1 && t2.cart_payment_links[0].payment_collection_id === collectionId))
  check("payment_session_and_payment_link", "One authorized system payment linked to collection/session", t2.payments,
    t2.payments.length === 1 && payment.payment_collection_id === collectionId && payment.provider_id === fixture.payment_provider_id &&
    payment.canceled_at === null && session?.payment_collection_id === collectionId && session.status === "authorized" && collection?.status === "authorized")
  check("payment_amounts_and_currency", "Collection, session and payment amounts/currency agree", { collection, session, payment },
    Boolean(collection && session && payment && collection.amount === session.amount && session.amount === payment.amount &&
      collection.authorized_amount === payment.amount && [collection, session, payment].every(row => row.currency_code === fixture.currency_code)))
  check("no_capture_or_refund", "Authorized only; no capture/refund", { captures: t2.captures, refunds: t2.refunds, captured_at: payment?.captured_at },
    Boolean(payment && payment.captured_at === null && collection?.captured_amount === 0 && collection.refunded_amount === 0 && t2.captures.length === 0 && t2.refunds.length === 0))
  const gap = (data: Snapshot) => selected(data).reserved_quantity - data.reservations
    .filter(row => row.inventory_item_id === fixture.inventory_item_id && row.location_id === fixture.location_id)
    .reduce((sum, row) => sum + row.quantity, 0)
  check("baseline_reserved_reservation_gap_preserved", gap(t1), gap(t2), gap(t1) === gap(t2))
  return {
    run_id: fixture.run_id, all_passed: results.every(row => row.passed), passed: results.filter(row => row.passed).length,
    total: results.length, expected_reserved_delta: required, snapshots: [l0, l1, l2],
    new_reservation_ids: added.map(row => row.id), baseline_reserved_minus_reservation_sum: gap(t0), checks: results,
  }
}
