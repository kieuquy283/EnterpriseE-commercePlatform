import type { Fixture, Snapshot } from "../../inventory-order/snapshot"
import { validateFailedCheckout, validateReservationSuccess, validateRetry } from "../validation"

const fixture: Fixture = {
  run_id: "week4-unit", product_id: "prod_test", handle: "week4-test", variant_id: "variant_test",
  sku: "W4-TEST", manage_inventory: true, allow_backorder: false, required_quantity: 1,
  inventory_item_id: "iitem_test", inventory_level_id: "ilev_test", location_id: "sloc_test",
  region_id: "reg_test", sales_channel_id: "sc_test", currency_code: "vnd", quantity: 2,
  calculated_unit_price: 249000, payment_provider_id: "pp_week4_local",
}
const timestamp = "2026-11-05T01:00:00.000Z"

function cloneSnapshot(snapshot: Snapshot): Snapshot {
  return JSON.parse(JSON.stringify(snapshot)) as Snapshot
}

function baseline(): Snapshot {
  return {
    stage: "T1", run_id: fixture.run_id, captured_at: timestamp, capture_finished_at: timestamp,
    clock_source: "Node.js host UTC", read_source: "Medusa module services and query.graph",
    consistency: "Sequential reads across services; not an atomic database snapshot", fixture,
    levels: [{ id: fixture.inventory_level_id, inventory_item_id: fixture.inventory_item_id,
      location_id: fixture.location_id, stocked_quantity: 10, reserved_quantity: 2,
      incoming_quantity: 0, available_quantity: 8, updated_at: timestamp }],
    reservations: [{ id: "res_old", inventory_item_id: fixture.inventory_item_id,
      location_id: fixture.location_id, line_item_id: "ordli_old", quantity: 2,
      allow_backorder: false, created_at: timestamp, updated_at: timestamp }, {
      id: "res_unrelated", inventory_item_id: "iitem_other", location_id: "sloc_other",
      line_item_id: "ordli_other", quantity: 7, allow_backorder: false,
      created_at: timestamp, updated_at: timestamp,
    }],
    active_counts: { carts: 3, cart_line_items: 3, orders: 5, payments: 2 },
    cart: { id: "cart_test", region_id: fixture.region_id, sales_channel_id: fixture.sales_channel_id,
      currency_code: fixture.currency_code, completed_at: null, sample_run: fixture.run_id },
    cart_items: [{ id: "cali_test", cart_id: "cart_test", variant_id: fixture.variant_id,
      product_id: fixture.product_id, quantity: fixture.quantity, unit_price: fixture.calculated_unit_price }],
    order: null, order_items: [], order_cart_links: [], cart_payment_links: [], order_payment_links: [],
    fulfillment_links: [], payment_collections: [],
    payment_sessions: [{ id: "payses_test", payment_collection_id: "paycol_test",
      provider_id: fixture.payment_provider_id, currency_code: fixture.currency_code,
      amount: 528000, status: "pending", authorized_at: null }],
    payments: [], captures: [], refunds: [],
  }
}

function failed(before: Snapshot): Snapshot {
  const after = cloneSnapshot(before)
  after.stage = "T2"
  after.levels[0].updated_at = "2026-11-05T01:01:00.000Z"
  after.payment_sessions[0].status = "error"
  return after
}

function succeeded(before: Snapshot): Snapshot {
  const after = cloneSnapshot(before)
  after.stage = "T2"
  after.levels[0].reserved_quantity += fixture.quantity
  after.levels[0].available_quantity -= fixture.quantity
  after.active_counts.orders += 1
  after.cart!.completed_at = timestamp
  after.order = { id: "order_test", status: "pending", version: 1,
    currency_code: fixture.currency_code, created_at: timestamp, sample_run: fixture.run_id }
  after.order_items = [{ order_item_id: "orditem_test", order_id: "order_test", version: 1,
    order_line_item_id: "ordli_test", quantity: fixture.quantity, fulfilled_quantity: 0,
    shipped_quantity: 0, delivered_quantity: 0, product_id: fixture.product_id,
    variant_id: fixture.variant_id, variant_sku: fixture.sku, unit_price: fixture.calculated_unit_price }]
  after.order_cart_links = [{ cart_id: "cart_test", order_id: "order_test" }]
  after.reservations.push({ id: "res_new", inventory_item_id: fixture.inventory_item_id,
    location_id: fixture.location_id, line_item_id: "ordli_test", quantity: fixture.quantity,
    allow_backorder: false, created_at: timestamp, updated_at: timestamp })
  return after
}

const authorizationError = {
  http_status: 400,
  body: { type: "not_allowed", message: "Session: payses_test was not authorized with the provider." },
}

describe("failed checkout rollback evidence", () => {
  it("accepts restored quantities and existing reservation IDs despite level timestamp changes", () => {
    const before = baseline()
    const after = failed(before)
    after.reservations.reverse()
    const validation = validateFailedCheckout(before, after, fixture, "not_allowed", authorizationError, "error")
    expect(validation.checks.filter(check => !check.passed)).toEqual([])
  })

  it("scopes inventory and reservation comparisons to the selected item and location", () => {
    const before = baseline()
    const after = failed(before)
    after.reservations.find(row => row.id === "res_unrelated")!.quantity = 8
    expect(validateFailedCheckout(before, after, fixture, "not_allowed", authorizationError, "error").all_passed).toBe(true)
  })

  it("rejects changes to an existing reservation even if total reserved is unchanged", () => {
    const before = baseline()
    const after = failed(before)
    after.reservations[0].quantity = 1
    const validation = validateFailedCheckout(before, after, fixture, "not_allowed", authorizationError, "error")
    expect(validation.checks.find(row => row.name === "reservations_restored_to_baseline")?.passed).toBe(false)
  })

  it("rejects replacement of an existing reservation with a new ID", () => {
    const before = baseline()
    const after = failed(before)
    after.reservations[0].id = "res_leaked"
    expect(validateFailedCheckout(before, after, fixture, "not_allowed", authorizationError, "error").all_passed).toBe(false)
  })

  it("does not accept HTTP200 solely because the body contains an authorization error", () => {
    const before = baseline()
    const response = { http_status: 200, body: { type: "cart", error: authorizationError.body } }
    const validation = validateFailedCheckout(before, failed(before), fixture, "not_allowed", response, "error")
    expect(validation.checks.find(row => row.name === "checkout_failed_http_status")?.passed).toBe(false)
  })

  it("distinguishes missing shipping from an earlier missing payment validation", () => {
    const before = baseline()
    const response = { http_status: 400, body: { type: "invalid_data", message: "No shipping method selected" } }
    expect(validateFailedCheckout(before, failed(before), fixture, "invalid_data", response).all_passed).toBe(true)
    response.body.message = "Payment collection has not been initiated"
    expect(validateFailedCheckout(before, failed(before), fixture, "invalid_data", response).all_passed).toBe(false)
  })

  it("requires an inventory diagnostic for the insufficient-stock case", () => {
    const before = baseline()
    const response = { http_status: 400, body: { type: "not_allowed", message: "Some variant does not have the required inventory" } }
    expect(validateFailedCheckout(before, failed(before), fixture, "inventory", response).all_passed).toBe(true)
    response.body.message = "Payment provider unavailable"
    expect(validateFailedCheckout(before, failed(before), fixture, "inventory", response).all_passed).toBe(false)
  })

  it("rejects a completed cart or leaked active Order link after compensation", () => {
    const before = baseline()
    const after = failed(before)
    after.cart!.completed_at = timestamp
    after.order_cart_links = [{ order_id: "order_leaked", cart_id: "cart_test" }]
    expect(validateFailedCheckout(before, after, fixture, "not_allowed", authorizationError, "error").all_passed).toBe(false)
  })

  it("does not count an unexpected inventory server failure as a valid stock rejection", () => {
    const before = baseline()
    const response = { http_status: 500, body: { message: "Inventory service failed" } }
    expect(validateFailedCheckout(before, failed(before), fixture, "inventory", response).all_passed).toBe(false)
  })

  it("recognizes the inventory module's not-enough-stock response", () => {
    const before = baseline()
    const response = { http_status: 400, body: { type: "not_allowed", message: "Not enough stock available for item iitem_test at location sloc_test" } }
    expect(validateFailedCheckout(before, failed(before), fixture, "inventory", response).all_passed).toBe(true)
  })
})

describe("successful checkout reservation evidence", () => {
  it("accepts one correctly linked reservation while preserving the previous reservation", () => {
    const before = baseline()
    expect(validateReservationSuccess(before, succeeded(before), fixture).all_passed).toBe(true)
  })

  it.each(["quantity", "line_item_id"])("rejects a reservation with incorrect %s", field => {
    const before = baseline()
    const after = succeeded(before)
    const reservation = after.reservations.find(row => row.id === "res_new")!
    if (field === "quantity") reservation.quantity = 1
    else reservation.line_item_id = "orditem_test"
    const validation = validateReservationSuccess(before, after, fixture)
    expect(validation.checks.find(row => row.name === "reservation_matches_order_line")?.passed).toBe(false)
  })

  it("rejects loss of the prior reservation even when the new reservation is correct", () => {
    const before = baseline()
    const after = succeeded(before)
    after.reservations = after.reservations.filter(row => row.id !== "res_old")
    expect(validateReservationSuccess(before, after, fixture).all_passed).toBe(false)
  })
})

describe("retry evidence", () => {
  it("accepts the same Order and unchanged inventory/reservations", () => {
    const before = succeeded(baseline())
    const response = { http_status: 200, body: { type: "order", order: { id: "order_test" } } }
    expect(validateRetry(before, cloneSnapshot(before), "order_test", response).all_passed).toBe(true)
  })

  it("rejects a duplicate Order returned by the second completion", () => {
    const before = succeeded(baseline())
    const after = cloneSnapshot(before)
    after.active_counts.orders += 1
    const response = { http_status: 200, body: { type: "order", order: { id: "order_duplicate" } } }
    expect(validateRetry(before, after, "order_test", response).all_passed).toBe(false)
  })

  it("rejects an extra reservation even when the response returns the original Order", () => {
    const before = succeeded(baseline())
    const after = cloneSnapshot(before)
    after.reservations.push({ ...after.reservations[0], id: "res_duplicate" })
    const response = { http_status: 200, body: { type: "order", order: { id: "order_test" } } }
    expect(validateRetry(before, after, "order_test", response).all_passed).toBe(false)
  })
})
