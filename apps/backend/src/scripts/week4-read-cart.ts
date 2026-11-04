// LOCAL TEST ONLY: reads cart/order links and writes evidence files, never commerce data.
import { mkdir, writeFile } from "node:fs/promises"
import { resolve } from "node:path"
import type {
  ExecArgs,
  ICartModuleService,
  IOrderModuleService,
} from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"

function requireLocalDatabase() {
  if (process.env.NODE_ENV === "production") {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Readback is only available in a local development/test environment"
    )
  }
  let databaseUrl: URL
  try {
    databaseUrl = new URL(process.env.DATABASE_URL ?? "")
  } catch {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Configure a valid local DATABASE_URL before readback"
    )
  }
  if (
    !["postgres:", "postgresql:"].includes(databaseUrl.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(databaseUrl.hostname)
  ) {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      "Readback requires a local PostgreSQL database"
    )
  }
}

export default async function week4ReadCart({ container, args }: ExecArgs) {
  requireLocalDatabase()
  if (
    args.length !== 2 ||
    !/^cart_[A-Za-z0-9]+$/.test(args[0] ?? "") ||
    !/^[A-Za-z0-9_-]{1,100}$/.test(args[1] ?? "")
  ) {
    throw new MedusaError(
      MedusaError.Types.INVALID_DATA,
      "Arguments: CART_ID UNIQUE_READ_ID"
    )
  }
  const [cartId, readId] = args
  const root = resolve(__dirname, "../../../..")
  const evidenceRoot = resolve(root, "docs/report/evidence")
  await mkdir(evidenceRoot, { recursive: true })
  const evidenceDir = resolve(evidenceRoot, `inventory-week4-read-${readId}`)
  // Exclusive directory creation prevents overwriting a previous snapshot.
  await mkdir(evidenceDir, { recursive: false })

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const carts = container.resolve<ICartModuleService>(Modules.CART)
  const orders = container.resolve<IOrderModuleService>(Modules.ORDER)
  const capturedAt = new Date().toISOString()
  const cart = await carts.retrieveCart(cartId, {
    select: ["id", "completed_at"],
  })
  const { data: links } = await query.graph({
    entity: "order_cart",
    fields: ["cart_id", "order_id"],
    filters: { cart_id: cartId },
  })
  const activeLinks = links.map(link => {
    if (
      link.cart_id !== cartId ||
      typeof link.order_id !== "string" ||
      !/^order_[A-Za-z0-9]+$/.test(link.order_id)
    ) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        "Readback returned an unexpected active cart/order link"
      )
    }
    return { cart_id: cartId, order_id: link.order_id }
  })
  const activeOrders: { id: string, status: string }[] = []
  for (const orderId of new Set(activeLinks.map(link => link.order_id))) {
    const order = await orders.retrieveOrder(orderId, {
      select: ["id", "status"],
    })
    activeOrders.push({ id: order.id, status: order.status })
  }
  const result = {
    read_id: readId,
    captured_at: capturedAt,
    capture_finished_at: new Date().toISOString(),
    snapshot_consistency: "Sequential Medusa module/query reads, not one atomic cross-module transaction",
    cart_id: cart.id,
    completed_at: cart.completed_at
      ? new Date(cart.completed_at).toISOString()
      : null,
    active_order_cart_links: activeLinks,
    active_orders: activeOrders,
  }
  await writeFile(
    resolve(evidenceDir, "cart-order-readback.json"),
    JSON.stringify(result, null, 2) + "\n",
    { encoding: "utf8", flag: "wx" }
  )
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  logger.info(`Read-only cart/order evidence saved to ${evidenceDir}`)
}
