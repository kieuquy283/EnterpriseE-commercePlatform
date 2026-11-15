export type Finding = {
  code: string
  identifier: string
  expected: unknown
  actual: unknown
  severity: "error" | "warning"
}

export type CatalogProduct = {
  product_key: string
  source_hash: string
  product_code: string
  title: string
  variants: { article_id: string, color: string }[]
}

export type Mapping = {
  source: string
  article_id: string
  product_code: string
  product_id: string
  variant_id: string
}

export type LiveProduct = {
  id: string
  handle: string | null
  title: string | null
  status: string
  metadata?: Record<string, unknown> | null
  shipping_profile_id?: string | null
  shipping_profile?: { id: string } | null
  sales_channels?: { id: string }[]
}

export type LiveVariant = {
  id: string
  product_id: string
  sku: string | null
  title: string | null
  metadata?: Record<string, unknown> | null
  manage_inventory: boolean
  allow_backorder: boolean
  prices?: { id: string, amount: unknown, currency_code: string, price_list_id?: string | null, min_quantity?: unknown,
    max_quantity?: unknown, rules_count?: unknown, price_rules?: { id?: string, attribute?: string }[] | null }[]
  inventory_items?: { inventory_item_id: string, required_quantity: unknown, inventory?: { id: string, sku?: string | null } | null }[]
}

export type LiveLevel = {
  id: string
  inventory_item_id: string
  location_id: string
  stocked_quantity: unknown
  reserved_quantity: unknown
  incoming_quantity: unknown
}

export type LiveReservation = {
  id: string
  inventory_item_id: string
  location_id: string
  quantity: unknown
}

export function numeric(value: unknown): number | null {
  if (value === null || value === undefined || typeof value === "boolean" ||
    (typeof value === "string" && !value.trim())) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

export function demoPrice(code: string) {
  const hash = [...code].reduce((value, char) => value * 31 + char.charCodeAt(0), 0)
  return 199000 + (Math.abs(hash) % 7) * 50000
}

export function validateLiveData(input: {
  catalog: CatalogProduct[]
  mapping: Mapping[]
  products: LiveProduct[]
  variants: LiveVariant[]
  levels: LiveLevel[]
  reservations: LiveReservation[]
  locations: { id: string, sales_channels?: { id: string }[] }[]
  salesChannelId: string | null
  expectedLocationId: string | null
}) {
  const findings: Finding[] = []
  const issue = (code: string, identifier: string, expected: unknown, actual: unknown, severity: "error" | "warning" = "error") => {
    findings.push({ code, identifier, expected, actual: actual ?? null, severity })
  }
  const products = new Map(input.products.map(product => [product.id, product]))
  const variants = new Map(input.variants.map(variant => [variant.id, variant]))
  const expectedByArticle = new Map(input.catalog.flatMap(product => product.variants.map(variant => [variant.article_id, product] as const)))
  const mappedIds = new Set(input.mapping.map(row => row.variant_id))
  const mappedProductIds = new Set(input.mapping.map(row => row.product_id))
  const mappingCounts = new Map<string, number>()
  const mappedVariantCounts = new Map<string, number>()
  const skuCounts = new Map<string, number>()
  for (const row of input.mapping) {
    mappingCounts.set(row.article_id, (mappingCounts.get(row.article_id) ?? 0) + 1)
    mappedVariantCounts.set(row.variant_id, (mappedVariantCounts.get(row.variant_id) ?? 0) + 1)
  }
  for (const [variantId, count] of mappedVariantCounts) if (count > 1) issue("duplicate_mapping_variant", variantId, 1, count)
  for (const variant of input.variants) {
    if (variant.sku) skuCounts.set(variant.sku, (skuCounts.get(variant.sku) ?? 0) + 1)
  }
  for (const [sku, count] of skuCounts) if (count > 1) issue("duplicate_live_sku", sku, 1, count)
  for (const product of input.products) {
    if (product.metadata?.source === "hm_historical_catalog" && !mappedProductIds.has(product.id)) {
      issue("live_hm_product_without_mapping", product.id, "mapped product", "absent")
    }
  }
  for (const variant of input.variants) {
    const parent = products.get(variant.product_id)
    if ((variant.sku?.startsWith("HM-") || parent?.metadata?.source === "hm_historical_catalog") && !mappedIds.has(variant.id)) {
      issue("live_hm_variant_without_mapping", variant.id, "mapped variant", "absent")
    }
  }
  for (const [articleId] of expectedByArticle) {
    const count = mappingCounts.get(articleId) ?? 0
    if (count !== 1) issue("mapping_article_cardinality", articleId, 1, count)
  }
  const checkedProducts = new Set<string>()
  const checkedItems = new Set<string>()
  const mappingChecks: { article_id: string, product_id: string, variant_id: string, sku: string, status: string }[] = []
  for (const row of input.mapping) {
    const startFindings = findings.length
    const expected = expectedByArticle.get(row.article_id)
    const product = products.get(row.product_id)
    const variant = variants.get(row.variant_id)
    const expectedSku = `HM-${row.article_id}`
    if (row.source !== "hm") issue("mapping_source", row.article_id, "hm", row.source)
    if (!expected) issue("mapping_article_outside_catalog", row.article_id, "selected catalog article", "absent")
    if (!product) issue("mapped_product_missing", row.article_id, row.product_id, "not found")
    if (!variant) issue("mapped_variant_missing", row.article_id, row.variant_id, "not found")
    if (expected && row.product_code !== expected.product_code) issue("mapping_product_code", row.article_id, expected.product_code, row.product_code)
    if (expected && product && product.handle !== `hm-${expected.product_key}`) {
      issue("mapped_product_handle", row.article_id, `hm-${expected.product_key}`, product.handle)
    }
    if (product && !checkedProducts.has(product.id)) {
      checkedProducts.add(product.id)
      if (!product.title?.trim()) issue("missing_product_title", product.id, "nonempty title", product.title)
      if (product.status !== "published") issue("product_not_published", product.id, "published", product.status)
      if (product.metadata?.source !== "hm_historical_catalog") issue("product_source", product.id, "hm_historical_catalog", product.metadata?.source)
      if (product.metadata?.synthetic_price !== true || product.metadata?.synthetic_inventory !== true) {
        issue("synthetic_provenance_missing", product.id, "synthetic_price=true and synthetic_inventory=true", {
          synthetic_price: product.metadata?.synthetic_price, synthetic_inventory: product.metadata?.synthetic_inventory,
        })
      }
      if (expected && product.metadata?.source_hash !== expected.source_hash) {
        issue("live_source_hash_mismatch", product.id, expected.source_hash, product.metadata?.source_hash)
      }
      if (expected && product.metadata?.product_code !== expected.product_code) {
        issue("live_product_code_mismatch", product.id, expected.product_code, product.metadata?.product_code)
      }
      if (!(product.shipping_profile_id || product.shipping_profile?.id)) issue("shipping_profile_missing", product.id, "shipping profile link", null)
      if (!input.salesChannelId || !product.sales_channels?.some(channel => channel.id === input.salesChannelId)) {
        issue("product_sales_channel_missing", product.id, input.salesChannelId ?? "Online Store", product.sales_channels?.map(channel => channel.id))
      }
    }
    if (variant) {
      if (variant.product_id !== row.product_id) issue("variant_product_mismatch", row.article_id, row.product_id, variant.product_id)
      if (variant.sku !== expectedSku) issue("variant_sku_mismatch", row.article_id, expectedSku, variant.sku)
      if (variant.metadata?.source_article_id !== row.article_id) issue("variant_source_article_mismatch", row.article_id, row.article_id, variant.metadata?.source_article_id)
      if (!variant.title?.trim()) issue("missing_variant_title", variant.id, "nonempty title", variant.title)
      const vndPrices = (variant.prices ?? []).filter(price => price.currency_code === "vnd" && !price.price_list_id &&
        numeric(price.rules_count) === 0 && Array.isArray(price.price_rules) && price.price_rules.length === 0 &&
        (price.min_quantity == null || numeric(price.min_quantity) === 0 || numeric(price.min_quantity) === 1) && price.max_quantity == null)
      if (!vndPrices.length) issue("base_vnd_price_missing", variant.id, "base VND price", null)
      for (const price of variant.prices ?? []) {
        const amount = numeric(price.amount)
        if (amount === null || amount < 0) issue("invalid_price_amount", price.id, "finite nonnegative amount", price.amount)
        if (!price.currency_code?.trim()) issue("price_currency_missing", price.id, "currency_code", price.currency_code)
      }
      if (expected && product?.metadata?.synthetic_price === true && vndPrices.length &&
        !vndPrices.some(price => numeric(price.amount) === demoPrice(expected.product_code))) {
        issue("synthetic_price_policy_mismatch", variant.id, demoPrice(expected.product_code), vndPrices.map(price => price.amount))
      }
      if (!variant.manage_inventory) issue("inventory_management_disabled", variant.id, true, variant.manage_inventory)
      if (variant.allow_backorder) issue("unexpected_backorder", variant.id, false, true)
      if (variant.inventory_items?.length !== 1) issue("inventory_link_cardinality", variant.id, 1, variant.inventory_items?.length ?? 0)
      for (const link of variant.inventory_items ?? []) {
        if (!link.inventory?.id || link.inventory.id !== link.inventory_item_id) {
          issue("inventory_item_link_missing", variant.id, link.inventory_item_id, link.inventory?.id)
        }
        if (numeric(link.required_quantity) !== 1) issue("inventory_required_quantity", variant.id, 1, link.required_quantity)
        if (link.inventory?.sku !== expectedSku) issue("inventory_sku_mismatch", variant.id, expectedSku, link.inventory?.sku)
        if (checkedItems.has(link.inventory_item_id)) continue
        checkedItems.add(link.inventory_item_id)
        const levels = input.levels.filter(level => level.inventory_item_id === link.inventory_item_id)
        if (!input.expectedLocationId || !levels.some(level => level.location_id === input.expectedLocationId)) {
          issue("warehouse_inventory_level_missing", link.inventory_item_id, input.expectedLocationId ?? "Vietnam Warehouse", null)
        }
        for (const level of levels) {
          const location = input.locations.find(location => location.id === level.location_id)
          if (!location) issue("stock_location_missing", level.id, level.location_id, null)
          if (level.location_id === input.expectedLocationId && !location?.sales_channels?.some(channel => channel.id === input.salesChannelId)) {
            issue("warehouse_sales_channel_missing", level.id, input.salesChannelId, location?.sales_channels?.map(channel => channel.id))
          }
          const stocked = numeric(level.stocked_quantity)
          const reserved = numeric(level.reserved_quantity)
          const incoming = numeric(level.incoming_quantity)
          if (stocked === null || reserved === null || incoming === null || stocked < 0 || reserved < 0 || incoming < 0) {
            issue("invalid_inventory_quantity", level.id, "finite nonnegative stocked/reserved/incoming", level)
          } else if (!variant.allow_backorder && stocked - reserved < 0) {
            issue("negative_available_inventory", level.id, ">=0", stocked - reserved)
          }
          const reservations = input.reservations.filter(reservation => reservation.inventory_item_id === level.inventory_item_id && reservation.location_id === level.location_id)
          let reservationSum = 0
          for (const reservation of reservations) {
            const quantity = numeric(reservation.quantity)
            if (quantity === null || quantity <= 0) issue("invalid_reservation_quantity", reservation.id, "finite positive quantity", reservation.quantity)
            else reservationSum += quantity
          }
          if (reserved !== null && Math.abs(reservationSum - reserved) > 0.000001) issue("reservation_level_mismatch", level.id, reserved, reservationSum)
        }
        for (const reservation of input.reservations) {
          if (reservation.inventory_item_id === link.inventory_item_id && !levels.some(level => level.location_id === reservation.location_id)) {
            issue("reservation_without_inventory_level", reservation.id, "existing item/location level", reservation.location_id)
          }
        }
      }
    }
    mappingChecks.push({ article_id: row.article_id, product_id: row.product_id, variant_id: row.variant_id,
      sku: expectedSku, status: findings.length === startFindings ? "PASS" : "FAIL" })
  }
  // Product and inventory findings are deduplicated above, but affect every
  // mapping row that uses those records, including later variants in a group.
  for (const row of mappingChecks) {
    const variant = variants.get(row.variant_id)
    const relevant = new Set([row.article_id, row.product_id, row.variant_id, row.sku])
    for (const price of variant?.prices ?? []) relevant.add(price.id)
    for (const link of variant?.inventory_items ?? []) {
      relevant.add(link.inventory_item_id)
      for (const level of input.levels) if (level.inventory_item_id === link.inventory_item_id) relevant.add(level.id)
      for (const reservation of input.reservations) if (reservation.inventory_item_id === link.inventory_item_id) relevant.add(reservation.id)
    }
    row.status = findings.some(finding => finding.severity === "error" && relevant.has(finding.identifier)) ? "FAIL" : "PASS"
  }
  return { findings, mappingChecks, checked_inventory_items: checkedItems.size }
}
