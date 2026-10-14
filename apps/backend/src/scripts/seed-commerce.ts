import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  MedusaError,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createSalesChannelsWorkflow,
  createShippingOptionsWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

// VND has no fractional subunit here; these prices are whole dong in Medusa's major units.
/* eslint-disable @medusajs/prices-in-major-units */

const products = [
  {
    title: "Ao thun Essential",
    handle: "ao-thun-essential",
    description: "Ao thun cotton toi gian de mac hang ngay.",
    sku: "TEE-ESSENTIAL-BLK",
    price: 249000,
  },
  {
    title: "Tui canvas Daily",
    handle: "tui-canvas-daily",
    description: "Tui canvas ben nhe cho cong viec va di hoc.",
    sku: "BAG-DAILY-NAT",
    price: 189000,
  },
  {
    title: "Binh giu nhiet 500ml",
    handle: "binh-giu-nhiet-500ml",
    description: "Binh inox giu nhiet cho ngay nang dong.",
    sku: "BOT-500-SLV",
    price: 329000,
  },
] as const

export default async function seedCommerce({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const fulfillment = container.resolve(Modules.FULFILLMENT)

  const existing = await query.graph({
    entity: "region",
    fields: ["id"],
    filters: { name: "Vietnam" },
  })
  if (existing.data.length) {
    logger.info("Vietnam region already exists; commerce seed skipped")
    return
  }

  const { result: [salesChannel] } = await createSalesChannelsWorkflow(container).run({
    input: { salesChannelsData: [{ name: "Online Store" }] },
  })
  const { result: [apiKey] } = await createApiKeysWorkflow(container).run({
    input: {
      api_keys: [{ title: "Storefront", type: "publishable", created_by: "" }],
    },
  })
  await linkSalesChannelsToApiKeyWorkflow(container).run({
    input: { id: apiKey.id, add: [salesChannel.id] },
  })

  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id"],
  })
  if (!stores.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Default store is missing")
  }
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: stores[0].id },
      update: {
        name: "Commerce MVP",
        supported_currencies: [{ currency_code: "vnd", is_default: true }],
        default_sales_channel_id: salesChannel.id,
      },
    },
  })

  const { result: [region] } = await createRegionsWorkflow(container).run({
    input: {
      regions: [{
        name: "Vietnam",
        currency_code: "vnd",
        countries: ["vn"],
        payment_providers: ["pp_system_default"],
      }],
    },
  })
  await createTaxRegionsWorkflow(container).run({
    input: [{ country_code: "vn", provider_id: "tp_system" }],
  })

  const { result: [stockLocation] } = await createStockLocationsWorkflow(container).run({
    input: {
      locations: [{
        name: "Vietnam Warehouse",
        address: { city: "Ho Chi Minh City", country_code: "VN", address_1: "" },
      }],
    },
  })
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: stores[0].id },
      update: {
        default_region_id: region.id,
        default_location_id: stockLocation.id,
      },
    },
  })
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" },
  })
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: { id: stockLocation.id, add: [salesChannel.id] },
  })

  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id"],
  })
  if (!profiles.length) {
    throw new MedusaError(MedusaError.Types.NOT_FOUND, "Default shipping profile is missing")
  }

  const fulfillmentSet = await fulfillment.createFulfillmentSets({
    name: "Vietnam delivery",
    type: "shipping",
    service_zones: [{
      name: "Vietnam",
      geo_zones: [{ country_code: "vn", type: "country" }],
    }],
  })
  await link.create({
    [Modules.STOCK_LOCATION]: { stock_location_id: stockLocation.id },
    [Modules.FULFILLMENT]: { fulfillment_set_id: fulfillmentSet.id },
  })
  await createShippingOptionsWorkflow(container).run({
    input: [{
      name: "Standard delivery",
      price_type: "flat",
      provider_id: "manual_manual",
      service_zone_id: fulfillmentSet.service_zones[0].id,
      shipping_profile_id: profiles[0].id,
      type: { label: "Standard", description: "2-3 business days", code: "standard" },
      prices: [{ currency_code: "vnd", amount: 30000 }],
      rules: [
        { attribute: "enabled_in_store", value: "true", operator: "eq" },
        { attribute: "is_return", value: "false", operator: "eq" },
      ],
    }],
  })

  await createProductsWorkflow(container).run({
    input: {
      products: products.map((product) => ({
        title: product.title,
        handle: product.handle,
        description: product.description,
        status: ProductStatus.PUBLISHED,
        shipping_profile_id: profiles[0].id,
        options: [{ title: "Variant", values: ["Default"] }],
        variants: [{
          title: "Default",
          sku: product.sku,
          options: { Variant: "Default" },
          prices: [{ amount: product.price, currency_code: "vnd" }],
          manage_inventory: true,
        }],
        sales_channels: [{ id: salesChannel.id }],
      })),
    },
  })

  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku"],
  })
  const stockBySku: Record<string, number> = {
    "TEE-ESSENTIAL-BLK": 25,
    "BAG-DAILY-NAT": 18,
    "BOT-500-SLV": 12,
  }
  await createInventoryLevelsWorkflow(container).run({
    input: {
      inventory_levels: inventoryItems
        .filter((item) => item.sku && stockBySku[item.sku] !== undefined)
        .map((item) => ({
          location_id: stockLocation.id,
          inventory_item_id: item.id,
          stocked_quantity: stockBySku[item.sku!],
        })),
    },
  })
  logger.info("Commerce MVP seeded. Copy the publishable API key from Medusa Admin.")
}
