import { isStockFailure, validateConcurrency } from "../validation"
import type { CompletionAttempt, ConcurrencyFixture, ConcurrencySnapshot } from "../validation"

function validRound(winningLabel = "A") {
  const fixture: ConcurrencyFixture = { product_id: "prod_fixture", variant_id: "variant_fixture", sku: "TEST", inventory_item_id: "iitem_fixture", location_id: "sloc_fixture", manage_inventory: true, allow_backorder: false, required_quantity: 1 }
  const before: ConcurrencySnapshot = {
    stage: "T0", captured_at: "2026-11-08T00:00:00Z", capture_finished_at: "2026-11-08T00:00:01Z",
    levels: [{ id: "ilevel_fixture", stocked_quantity: 1, reserved_quantity: 0, available_quantity: 1 }], reservations: [], carts: [], orders: [], order_cart_links: [], payment_collections: [],
  }
  const prepared: ConcurrencySnapshot = structuredClone(before)
  prepared.stage = "T1"
  prepared.carts = ["A", "B"].map(label => ({ id: `cart_${label}`, customer_id: `cus_${label}`, completed_at: null, items: [{ id: `item_${label}`, variant_id: fixture.variant_id, quantity: 1 }] }))
  prepared.payment_collections = ["A", "B"].map(label => ({ id: `paycol_${label}`, status: "not_paid", sessions: [{ id: `payses_${label}`, provider_id: "pp_system_default", status: "pending" }] }))
  const after = structuredClone(prepared)
  after.stage = "T2"
  after.levels[0].reserved_quantity = 1
  after.levels[0].available_quantity = 0
  after.carts.find(row => row.id === `cart_${winningLabel}`)!.completed_at = "2026-11-08T00:00:03Z"
  after.orders = [{ id: "order_winner", customer_id: `cus_${winningLabel}`, items: [{ id: "ordli_winner", variant_id: fixture.variant_id, quantity: 1 }] }]
  after.order_cart_links = [{ cart_id: `cart_${winningLabel}`, order_id: "order_winner" }]
  after.reservations = [{ id: "resitem_winner", line_item_id: "ordli_winner", quantity: 1, allow_backorder: false }]
  const attempts: CompletionAttempt[] = ["A", "B"].map((label, i) => ({
    participant: label, customer_id: `cus_${label}`, cart_id: `cart_${label}`, started_at: "2026-11-08T00:00:02Z", completed_at: "2026-11-08T00:00:03Z", started_ms: 100 + i, completed_ms: 400 + i,
    status: label === winningLabel ? 200 : 400, response_type: label === winningLabel ? "order" : "not_allowed", order_id: label === winningLabel ? "order_winner" : null,
    error_type: label === winningLabel ? null : "not_allowed", error_message: label === winningLabel ? null : "Not enough stock available for item iitem_fixture at location sloc_fixture",
  }))
  return { fixture, before, prepared, after, attempts }
}

function validate(data: ReturnType<typeof validRound>) {
  return validateConcurrency(data.fixture, data.before, data.prepared, data.after, data.attempts)
}

describe("live concurrency evidence validator", () => {
  it.each(["A", "B"])("accepts either participant %s winning with one correctly linked reservation", label => {
    const result = validate(validRound(label))
    expect(result.all_passed).toBe(true)
    expect(result.overlap_ms).toBeGreaterThan(0)
  })

  it("rejects sequential HTTP intervals even when stock results are otherwise correct", () => {
    const data = validRound()
    data.attempts[1].started_ms = data.attempts[0].completed_ms + 1
    data.attempts[1].completed_ms = data.attempts[1].started_ms + 100
    expect(validate(data).checks.find(row => row.id === "http_intervals_overlap")?.passed).toBe(false)
  })

  it.each([0, 500, 503])("does not mistake HTTP%s or a timeout for a controlled stock failure", status => {
    const data = validRound()
    data.attempts[1].status = status
    expect(isStockFailure(data.attempts[1])).toBe(false)
    expect(validate(data).all_passed).toBe(false)
  })

  it("rejects a non-stock HTTP400 failure", () => {
    const data = validRound()
    data.attempts[1].error_message = "Shipping option is required"
    expect(validate(data).checks.find(row => row.id === "one_winner_one_stock_failure")?.passed).toBe(false)
  })

  it("rejects two successful orders despite overlapping requests", () => {
    const data = validRound()
    data.attempts[1] = { ...data.attempts[1], status: 200, response_type: "order", order_id: "order_oversold", error_type: null, error_message: null }
    data.after.orders.push({ id: "order_oversold", customer_id: "cus_B", items: [{ id: "ordli_extra", variant_id: data.fixture.variant_id, quantity: 1 }] })
    expect(validate(data).all_passed).toBe(false)
  })

  it("rejects a reservation left by the loser and a negative available quantity", () => {
    const data = validRound()
    data.after.reservations.push({ id: "resitem_extra", line_item_id: "ordli_loser", quantity: 1, allow_backorder: false })
    data.after.levels[0].reserved_quantity = 2
    data.after.levels[0].available_quantity = -1
    const result = validate(data)
    expect(result.checks.find(row => row.id === "no_oversell_or_negative_inventory")?.passed).toBe(false)
    expect(result.checks.find(row => row.id === "one_reservation_for_winner_line")?.passed).toBe(false)
  })

  it("rejects a reservation linked to a different order line", () => {
    const data = validRound()
    data.after.reservations[0].line_item_id = "ordli_wrong"
    expect(validate(data).all_passed).toBe(false)
  })

  it("does not demand stocked_quantity decrease when an unfulfilled order reserves stock", () => {
    const data = validRound()
    expect(data.after.levels[0].stocked_quantity).toBe(data.before.levels[0].stocked_quantity)
    expect(validate(data).checks.find(row => row.id === "inventory_delta")?.passed).toBe(true)
  })
})
