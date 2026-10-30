import type { ILockingModule, MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, MedusaError, Modules } from "@medusajs/framework/utils"
import {
  createStep,
  createWorkflow,
  StepResponse,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  addToCartWorkflow,
  createCartWorkflow,
  createCustomersWorkflow,
} from "@medusajs/medusa/core-flows"
import {
  assertSampleCart,
  assertSampleCustomer,
  fixtureEmail,
  fixtureId,
  getMissingSampleItems,
  sampleProducts,
} from "./fixture"
import type { SampleCustomer } from "./fixture"

const cartFields = [
  "id", "customer_id", "region_id", "sales_channel_id", "currency_code",
  "completed_at", "metadata", "items.id", "items.product_id",
  "items.variant_id", "items.quantity", "items.variant.id",
  "items.variant.product_id", "items.variant.sku",
]

async function ensureSampleData(container: MedusaContainer) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const [regions, channels, products] = await Promise.all([
    query.graph({
      entity: "region",
      fields: ["id", "currency_code"],
      filters: { name: "Vietnam" },
    }),
    query.graph({
      entity: "sales_channel",
      fields: ["id", "is_disabled"],
      filters: { name: "Online Store" },
    }),
    query.graph({
      entity: "product",
      fields: ["id", "handle", "status", "variants.id", "variants.sku", "sales_channels.id"],
      filters: { handle: sampleProducts.map((product) => product.handle) },
    }),
  ])

  if (regions.data.length !== 1 || regions.data[0].currency_code !== "vnd") {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Expected exactly one Vietnam region using VND. Prepare the base commerce data first.")
  }
  if (channels.data.length !== 1 || channels.data[0].is_disabled) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Expected exactly one enabled Online Store sales channel.")
  }

  const regionId = regions.data[0].id
  const salesChannelId = channels.data[0].id
  const desired = sampleProducts.map((target) => {
    const matches = products.data.filter((product) => product.handle === target.handle)
    const product = matches[0]
    const variants = product?.variants?.filter((variant) => variant?.sku === target.sku) ?? []
    if (
      matches.length !== 1 || product.status !== "published" ||
      !product.sales_channels?.some((channel) => channel?.id === salesChannelId) ||
      variants.length !== 1 || !variants[0]?.id
    ) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, `Missing published product/variant in Online Store: ${target.sku}`)
    }
    return { variant_id: variants[0].id, quantity: target.quantity }
  })

  const { data: customers } = await query.graph({
    entity: "customer",
    fields: ["id", "email", "has_account", "metadata"],
    filters: { email: fixtureEmail },
  })
  if (customers.length > 1) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Multiple customers use the sample email. No data was changed.")
  }

  let customer: SampleCustomer = customers[0]
  const customerCreated = !customer
  if (customer) {
    assertSampleCustomer(customer)
  } else {
    const { result } = await createCustomersWorkflow(container).run({
      input: {
        customersData: [{
          email: fixtureEmail,
          first_name: "ERD",
          last_name: "Sample",
          has_account: false,
          metadata: { erd_fixture: fixtureId },
        }],
      },
    })
    customer = result[0]
    assertSampleCustomer(customer)
  }

  const { data: customerCarts } = await query.graph({
    entity: "cart",
    fields: cartFields,
    filters: { customer_id: customer.id },
  })
  const ownedCarts = customerCarts.filter((cart) => cart.metadata?.erd_fixture === fixtureId)
  if (ownedCarts.length > 1) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "Multiple marked sample carts exist. Review their IDs before retrying.")
  }

  let cartId = ownedCarts[0]?.id
  const cartCreated = !cartId
  let itemsAdded = 0
  const context = { customerId: customer.id, regionId, salesChannelId }

  if (ownedCarts[0]) {
    const cart = ownedCarts[0]
    assertSampleCart(cart, context)
    const currentItems = (cart.items ?? []).filter((item): item is NonNullable<typeof item> => item != null)
    const missing = getMissingSampleItems(currentItems, desired)
    if (missing.length) {
      await addToCartWorkflow(container).run({
        input: { cart_id: cart.id, items: missing },
      })
      itemsAdded = missing.length
    }
  } else {
    const { result } = await createCartWorkflow(container).run({
      input: {
        customer_id: customer.id,
        email: fixtureEmail,
        region_id: regionId,
        sales_channel_id: salesChannelId,
        metadata: { erd_fixture: fixtureId },
        items: desired,
      },
    })
    cartId = result.id
    itemsAdded = desired.length
  }

  const { data: carts } = await query.graph({
    entity: "cart",
    fields: cartFields,
    filters: { id: cartId },
  })
  const cart = carts[0]
  if (!cart) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "The sample cart could not be read back.")
  }
  assertSampleCart(cart, context)
  const items = (cart.items ?? []).filter((item): item is NonNullable<typeof item> => item != null)
  if (getMissingSampleItems(items, desired).length) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "The sample cart is still missing required lines.")
  }
  const verifiedItems = items.map((item) => {
    if (!item.variant || item.variant.id !== item.variant_id || item.product_id !== item.variant.product_id) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "A sample cart line does not resolve to its product and variant.")
    }
    return {
      id: item.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      sku: item.variant.sku,
      quantity: item.quantity,
    }
  })

  return {
    fixture_id: fixtureId,
    captured_at: new Date().toISOString(),
    customer: { id: customer.id, email: customer.email, has_account: customer.has_account },
    cart: {
      id: cart.id,
      customer_id: cart.customer_id,
      region_id: cart.region_id,
      sales_channel_id: cart.sales_channel_id,
      currency_code: cart.currency_code,
      completed_at: cart.completed_at,
    },
    items: verifiedItems,
    created: { customer: customerCreated, cart: cartCreated, items_added: itemsAdded },
  }
}

const ensureErdSampleStep = createStep("ensure-erd-sample", async (_input, { container }) => {
  const locking = container.resolve<ILockingModule>(Modules.LOCKING)
  const result = await locking.execute(
    fixtureId,
    () => ensureSampleData(container),
    { timeout: 10, expire: 60 }
  )
  return new StepResponse(result)
})

export const seedErdSampleWorkflow = createWorkflow("seed-erd-sample", () => {
  const result = ensureErdSampleStep()
  return new WorkflowResponse(result)
})
