export type ConcurrencyFixture = {
  product_id: string
  variant_id: string
  sku: string
  inventory_item_id: string
  location_id: string
  manage_inventory: boolean
  allow_backorder: boolean
  required_quantity: number
}

export type ConcurrencySnapshot = {
  stage: string
  captured_at: string
  capture_finished_at: string
  levels: { id: string; stocked_quantity: number; reserved_quantity: number; available_quantity: number }[]
  reservations: { id: string; line_item_id: string | null; quantity: number; allow_backorder: boolean }[]
  carts: { id: string; customer_id: string | null; completed_at: string | null; items: { id: string; variant_id: string | null; quantity: number }[] }[]
  orders: { id: string; customer_id: string | null; items: { id: string; variant_id: string | null; quantity: number }[] }[]
  order_cart_links: { cart_id: string; order_id: string }[]
  payment_collections: { id: string; status: string; sessions: { id: string; provider_id: string; status: string }[] }[]
}

export type CompletionAttempt = {
  participant: string
  customer_id: string
  cart_id: string
  started_at: string
  completed_at: string
  started_ms: number
  completed_ms: number
  status: number
  response_type: string | null
  order_id: string | null
  error_type: string | null
  error_message: string | null
}

export function isStockFailure(attempt: CompletionAttempt) {
  return attempt.status === 400 && !attempt.order_id &&
    ["not_allowed", "invalid_data", "insufficient_inventory"].includes(attempt.error_type ?? "") &&
    /not enough stock|insufficient (?:stock|inventory)|(?:required|available) inventory.*(?:not|enough)|does not have.*inventory/i.test(attempt.error_message ?? "")
}

export function validateConcurrency(
  fixture: ConcurrencyFixture,
  before: ConcurrencySnapshot,
  prepared: ConcurrencySnapshot,
  after: ConcurrencySnapshot,
  attempts: CompletionAttempt[],
) {
  const checks: { id: string; expected: unknown; actual: unknown; passed: boolean }[] = []
  const check = (id: string, expected: unknown, actual: unknown, passed: boolean) => checks.push({ id, expected, actual, passed })
  const equals = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
  const winners = attempts.filter(row => row.status === 200 && row.response_type === "order" && row.order_id)
  const losers = attempts.filter(isStockFailure)
  const winner = winners[0]
  const loser = losers[0]
  const overlapMs = attempts.length === 2
    ? Math.min(...attempts.map(row => row.completed_ms)) - Math.max(...attempts.map(row => row.started_ms))
    : 0
  const level0 = before.levels[0]
  const level1 = prepared.levels[0]
  const level2 = after.levels[0]
  const order = after.orders[0]
  const orderItem = order?.items[0]
  const winningCart = after.carts.find(row => row.id === winner?.cart_id)
  const losingCart = after.carts.find(row => row.id === loser?.cart_id)
  const baselineIds = new Set(prepared.reservations.map(row => row.id))
  const added = after.reservations.filter(row => !baselineIds.has(row.id))
  const sumReservations = after.reservations.reduce((sum, row) => sum + row.quantity, 0)

  check("fixture_policy", "Inventory managed, no backorder, required quantity 1", fixture,
    fixture.manage_inventory && !fixture.allow_backorder && fixture.required_quantity === 1)
  check("fresh_stock_one", "One level, stocked=1, reserved=0, available=1, no reservations", before,
    before.levels.length === 1 && level0.stocked_quantity === 1 && level0.reserved_quantity === 0 && level0.available_quantity === 1 && before.reservations.length === 0)
  check("preparation_does_not_reserve", "T0/T1 inventory and reservations identical", { before: before.levels, prepared: prepared.levels },
    equals(before.levels, prepared.levels) && equals(before.reservations, prepared.reservations) && prepared.orders.length === 0)
  check("two_distinct_authenticated_customers_and_carts", "Two distinct customers and carts", attempts.map(({ customer_id, cart_id }) => ({ customer_id, cart_id })),
    attempts.length === 2 && attempts.every(row => row.customer_id && row.cart_id) && new Set(attempts.map(row => row.customer_id)).size === 2 && new Set(attempts.map(row => row.cart_id)).size === 2 &&
    prepared.carts.length === 2 && prepared.carts.every(cart => attempts.some(row => row.cart_id === cart.id && row.customer_id === cart.customer_id)))
  check("two_ready_carts", "Each uncompleted cart has one selected variant, quantity 1, with a payment session", prepared.carts,
    prepared.carts.length === 2 && prepared.carts.every(cart => !cart.completed_at && cart.items.length === 1 && cart.items[0].variant_id === fixture.variant_id && cart.items[0].quantity === 1) &&
    prepared.payment_collections.length === 2 && prepared.payment_collections.every(collection => collection.sessions.length === 1 && collection.sessions[0].provider_id === "pp_system_default"))
  check("http_intervals_overlap", "Positive overlap of the two in-flight HTTP request intervals (ms)", overlapMs,
    Number.isFinite(overlapMs) && overlapMs > 0 && attempts.every(row => row.completed_ms > row.started_ms))
  check("one_winner_one_stock_failure", "One HTTP200 order and one HTTP400 stock-specific failure", attempts,
    attempts.length === 2 && winners.length === 1 && losers.length === 1)
  check("exactly_one_persisted_order", "One order belonging to the successful participant", after.orders,
    after.orders.length === 1 && order?.id === winner?.order_id && order?.customer_id === winner?.customer_id && order.items.length === 1 && orderItem?.variant_id === fixture.variant_id && orderItem.quantity === 1)
  check("cart_order_link", "One link from successful cart to returned order", after.order_cart_links,
    after.order_cart_links.length === 1 && after.order_cart_links[0].cart_id === winner?.cart_id && after.order_cart_links[0].order_id === winner?.order_id)
  check("winner_completed_loser_uncompleted", "Only winner cart has completed_at; loser has no order", after.carts,
    Boolean(winningCart?.completed_at && losingCart && !losingCart.completed_at && !after.order_cart_links.some(row => row.cart_id === loser?.cart_id)))
  check("inventory_delta", "stocked unchanged; reserved +1; available -1", { before: level1, after: level2 },
    after.levels.length === 1 && prepared.levels.length === 1 && Boolean(level1 && level2) && level2.id === level1.id && level2.stocked_quantity === level1.stocked_quantity &&
    level2.reserved_quantity - level1.reserved_quantity === 1 && level2.available_quantity - level1.available_quantity === -1)
  check("one_reservation_for_winner_line", "One reservation, quantity 1, linked to successful OrderLineItem", added,
    added.length === 1 && after.reservations.length === 1 && added[0].quantity === 1 && !added[0].allow_backorder && added[0].line_item_id === orderItem?.id)
  check("no_oversell_or_negative_inventory", "Reservation total=reserved=1, available=0; no negative values", { sum_reservations: sumReservations, levels: after.levels },
    after.levels.length === 1 && level2.reserved_quantity === 1 && sumReservations === 1 && level2.available_quantity === 0 &&
    [level2.stocked_quantity, level2.reserved_quantity, level2.available_quantity].every(value => Number.isFinite(value) && value >= 0))
  return { all_passed: checks.every(row => row.passed), passed: checks.filter(row => row.passed).length, total: checks.length, overlap_ms: overlapMs, checks }
}
