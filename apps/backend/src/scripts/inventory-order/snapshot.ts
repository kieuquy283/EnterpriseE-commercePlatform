import assert from "node:assert/strict"
import type {
  ICartModuleService,
  IInventoryService,
  IOrderModuleService,
  IPaymentModuleService,
  MedusaContainer,
  OrderItemDTO,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export type Fixture = {
  run_id: string
  product_id: string
  handle: string
  variant_id: string
  sku: string
  manage_inventory: boolean
  allow_backorder: boolean
  required_quantity: number
  inventory_item_id: string
  inventory_level_id: string
  location_id: string
  region_id: string
  sales_channel_id: string
  currency_code: string
  quantity: number
  calculated_unit_price: number
  payment_provider_id: string
}

type OrderCartLink = { order_id: string, cart_id: string }
type CartPaymentLink = { cart_id: string, payment_collection_id: string }
type OrderPaymentLink = { order_id: string, payment_collection_id: string }
type FulfillmentLink = { order_id: string, fulfillment_id: string }

// Medusa 2.21.2 returns these persisted fields in detail, although its public
// OrderItemDTO does not declare them. Validate them before recording evidence.
type PersistedOrderItem = OrderItemDTO & { version: number, order_id: string }

function timestamp(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : null
}

function numeric(value: unknown) {
  const result = Number(value)
  assert.ok(Number.isFinite(result), "Snapshot contains a non-finite quantity or amount")
  return result
}

export async function captureSnapshot(
  container: MedusaContainer,
  runId: string,
  stage: "T0" | "T1" | "T2",
  fixture: Fixture,
  cartId?: string,
  orderId?: string,
) {
  const capturedAt = new Date().toISOString()
  const inventory = container.resolve<IInventoryService>(Modules.INVENTORY)
  const carts = container.resolve<ICartModuleService>(Modules.CART)
  const orders = container.resolve<IOrderModuleService>(Modules.ORDER)
  const payment = container.resolve<IPaymentModuleService>(Modules.PAYMENT)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  // Each read uses Medusa's own module/query layer. These sequential reads do
  // not share one database transaction; the capture interval is explicit.
  const levelRows = await inventory.listInventoryLevels({}, { take: null, order: { id: "ASC" } })
  const reservationRows = await inventory.listReservationItems({}, { take: null, order: { id: "ASC" } })
  const [, cartCount] = await carts.listAndCountCarts({}, { select: ["id"], take: 1 })
  const [, orderCount] = await orders.listAndCountOrders({}, { select: ["id"], take: 1 })
  const allPayments = await payment.listPayments({}, { select: ["id"], take: null })
  const allCartItems = await carts.listLineItems({}, { select: ["id"], take: null })
  const cart = cartId ? await carts.retrieveCart(cartId, { relations: ["items"] }) : null
  const order = orderId ? await orders.retrieveOrder(orderId, { relations: ["items"] }) : null

  const orderCartLinks: OrderCartLink[] = cartId
    ? (await query.graph({
      entity: "order_cart",
      fields: ["order_id", "cart_id"],
      filters: { cart_id: cartId },
    })).data
    : []
  const cartPaymentLinks: CartPaymentLink[] = cartId
    ? (await query.graph({
      entity: "cart_payment_collection",
      fields: ["cart_id", "payment_collection_id"],
      filters: { cart_id: cartId },
    })).data
    : []
  const orderPaymentLinks: OrderPaymentLink[] = orderId
    ? (await query.graph({
      entity: "order_payment_collection",
      fields: ["order_id", "payment_collection_id"],
      filters: { order_id: orderId },
    })).data
    : []
  const fulfillmentLinks: FulfillmentLink[] = orderId
    ? (await query.graph({
      entity: "order_fulfillment",
      fields: ["order_id", "fulfillment_id"],
      filters: { order_id: orderId },
    })).data
    : []
  const collectionIds = [...new Set([
    ...cartPaymentLinks.map((link) => link.payment_collection_id),
    ...orderPaymentLinks.map((link) => link.payment_collection_id),
  ])]
  const collections = collectionIds.length
    ? await payment.listPaymentCollections({ id: collectionIds }, {
      take: null,
      relations: [
        "payment_sessions", "payments", "payments.payment_session",
        "payments.captures", "payments.refunds",
      ],
      order: { id: "ASC" },
    })
    : []
  const payments = collections.flatMap((collection) => collection.payments ?? [])

  const result = {
    stage,
    run_id: runId,
    captured_at: capturedAt,
    capture_finished_at: new Date().toISOString(),
    clock_source: "Node.js host UTC",
    read_source: "Medusa module services and query.graph",
    consistency: "Sequential reads across services; not an atomic database snapshot",
    fixture,
    levels: levelRows.map((level) => ({
      id: level.id,
      inventory_item_id: level.inventory_item_id,
      location_id: level.location_id,
      stocked_quantity: numeric(level.stocked_quantity),
      reserved_quantity: numeric(level.reserved_quantity),
      incoming_quantity: numeric(level.incoming_quantity),
      available_quantity: numeric(level.stocked_quantity) - numeric(level.reserved_quantity),
      updated_at: timestamp(level.updated_at),
    })),
    reservations: reservationRows.map((reservation) => ({
      id: reservation.id,
      inventory_item_id: reservation.inventory_item_id,
      location_id: reservation.location_id,
      line_item_id: reservation.line_item_id ?? null,
      quantity: numeric(reservation.quantity),
      allow_backorder: reservation.allow_backorder ?? false,
      created_at: timestamp(reservation.created_at),
      updated_at: timestamp(reservation.updated_at),
    })),
    active_counts: {
      carts: cartCount,
      cart_line_items: allCartItems.length,
      orders: orderCount,
      payments: allPayments.length,
    },
    cart: cart ? {
      id: cart.id,
      region_id: cart.region_id,
      sales_channel_id: cart.sales_channel_id,
      currency_code: cart.currency_code,
      completed_at: timestamp(cart.completed_at),
      sample_run: cart.metadata?.sample_run ?? null,
    } : null,
    cart_items: (cart?.items ?? []).map((item) => ({
      id: item.id,
      cart_id: cart!.id,
      variant_id: item.variant_id,
      product_id: item.product_id,
      quantity: numeric(item.quantity),
      unit_price: numeric(item.unit_price),
    })),
    order: order ? {
      id: order.id,
      status: order.status,
      version: order.version,
      currency_code: order.currency_code,
      created_at: timestamp(order.created_at),
      sample_run: order.metadata?.sample_run ?? null,
    } : null,
    order_items: (order?.items ?? []).map((item) => {
      const detail = item.detail as PersistedOrderItem
      assert.ok(detail?.id && Number.isInteger(detail.version) && detail.order_id === order!.id,
        "Order item detail must expose its persisted ID, version and order ID")
      assert.equal(detail.version, order!.version, "Only the current order version is recorded")
      assert.equal(detail.item_id, item.id, "OrderItem must reference its OrderLineItem")
      return {
        order_item_id: detail.id,
        order_id: detail.order_id,
        version: detail.version,
        order_line_item_id: item.id,
        quantity: numeric(detail.quantity),
        fulfilled_quantity: numeric(detail.fulfilled_quantity),
        shipped_quantity: numeric(detail.shipped_quantity),
        delivered_quantity: numeric(detail.delivered_quantity),
        product_id: item.product_id,
        variant_id: item.variant_id,
        variant_sku: item.variant_sku,
        unit_price: numeric(item.unit_price),
      }
    }),
    order_cart_links: orderCartLinks.map(({ order_id, cart_id }) => ({ order_id, cart_id })),
    cart_payment_links: cartPaymentLinks.map(({ cart_id, payment_collection_id }) => ({ cart_id, payment_collection_id })),
    order_payment_links: orderPaymentLinks.map(({ order_id, payment_collection_id }) => ({ order_id, payment_collection_id })),
    fulfillment_links: fulfillmentLinks.map(({ order_id, fulfillment_id }) => ({ order_id, fulfillment_id })),
    payment_collections: collections.map((collection) => ({
      id: collection.id,
      currency_code: collection.currency_code,
      amount: numeric(collection.amount),
      status: collection.status,
      authorized_amount: numeric(collection.authorized_amount ?? 0),
      captured_amount: numeric(collection.captured_amount ?? 0),
      refunded_amount: numeric(collection.refunded_amount ?? 0),
      completed_at: timestamp(collection.completed_at),
    })),
    payment_sessions: collections.flatMap((collection) => (collection.payment_sessions ?? []).map((session) => ({
      id: session.id,
      payment_collection_id: session.payment_collection_id,
      provider_id: session.provider_id,
      currency_code: session.currency_code,
      amount: numeric(session.amount),
      status: session.status,
      authorized_at: timestamp(session.authorized_at),
    }))),
    payments: payments.map((item) => ({
      id: item.id,
      payment_collection_id: item.payment_collection_id,
      payment_session_id: item.payment_session?.id ?? null,
      provider_id: item.provider_id,
      currency_code: item.currency_code,
      amount: numeric(item.amount),
      captured_at: timestamp(item.captured_at),
      canceled_at: timestamp(item.canceled_at),
    })),
    captures: payments.flatMap((item) => (item.captures ?? []).map((capture) => ({
      id: capture.id,
      payment_id: item.id,
      amount: numeric(capture.amount),
      created_at: timestamp(capture.created_at),
    }))),
    refunds: payments.flatMap((item) => (item.refunds ?? []).map((refund) => ({
      id: refund.id,
      payment_id: item.id,
      amount: numeric(refund.amount),
      created_at: timestamp(refund.created_at),
    }))),
  }

  return result
}

export type Snapshot = Awaited<ReturnType<typeof captureSnapshot>>
