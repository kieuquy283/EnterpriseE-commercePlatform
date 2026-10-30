import { MedusaError } from "@medusajs/framework/utils"

export const fixtureId = "erd-customer-cart-v1"
export const fixtureEmail = "erd-sample@example.test"

export const sampleProducts = [
  { handle: "ao-thun-essential", sku: "TEE-ESSENTIAL-BLK", quantity: 2 },
  { handle: "tui-canvas-daily", sku: "BAG-DAILY-NAT", quantity: 1 },
] as const

type FixtureMetadata = Record<string, unknown> | null

export type SampleCustomer = {
  id: string
  email?: string | null
  has_account?: boolean
  metadata?: FixtureMetadata
}

export type SampleCart = {
  id: string
  customer_id?: string | null
  region_id?: string | null
  sales_channel_id?: string | null
  currency_code?: string
  completed_at?: Date | string | null
  metadata?: FixtureMetadata
}

export type SampleItem = {
  variant_id?: string | null
  quantity: number
}

export type DesiredSampleItem = {
  variant_id: string
  quantity: number
}

export function assertSampleCustomer(customer: SampleCustomer) {
  if (
    customer.email !== fixtureEmail ||
    customer.has_account !== false ||
    customer.metadata?.erd_fixture !== fixtureId
  ) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "The sample email belongs to a different customer. No customer was changed.")
  }
}

export function assertSampleCart(
  cart: SampleCart,
  context: { customerId: string; regionId: string; salesChannelId: string }
) {
  if (
    cart.metadata?.erd_fixture !== fixtureId ||
    cart.customer_id !== context.customerId ||
    cart.region_id !== context.regionId ||
    cart.sales_channel_id !== context.salesChannelId ||
    cart.currency_code !== "vnd" ||
    cart.completed_at
  ) {
    throw new MedusaError(MedusaError.Types.INVALID_DATA, "The existing sample cart has a different context or is completed. No cart was changed.")
  }
}

export function getMissingSampleItems(
  current: SampleItem[],
  desired: DesiredSampleItem[]
): DesiredSampleItem[] {
  const seen = new Set<string>()

  for (const item of current) {
    const expected = desired.find((target) => target.variant_id === item.variant_id)
    if (!item.variant_id || !expected || seen.has(item.variant_id)) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "The sample cart has extra or duplicate lines. No existing lines were changed.")
    }
    if (item.quantity !== expected.quantity) {
      throw new MedusaError(MedusaError.Types.INVALID_DATA, "The sample cart quantities were modified. No existing lines were changed.")
    }
    seen.add(item.variant_id)
  }

  return desired.filter((item) => !seen.has(item.variant_id))
}

