import { demoPrice, numeric, validateLiveData } from "../validation"
import type { CatalogProduct, LiveProduct, LiveVariant, Mapping } from "../validation"

function fixture() {
  const catalog: CatalogProduct[] = [{ product_key: "0100-group-a", product_code: "0100", source_hash: "hash-a", title: "Demo", variants: [{ article_id: "00123", color: "Blue" }, { article_id: "00124", color: "Red" }] }]
  const mapping: Mapping[] = ["00123", "00124"].map((article, index) => ({ source: "hm", article_id: article, product_code: "0100", product_id: "prod_a", variant_id: `variant_${index}` }))
  const products: LiveProduct[] = [{ id: "prod_a", handle: "hm-0100-group-a", title: "Demo", status: "published", shipping_profile: { id: "sp_a" }, sales_channels: [{ id: "sc_a" }], metadata: { source: "hm_historical_catalog", source_hash: "hash-a", product_code: "0100", synthetic_price: true, synthetic_inventory: true } }]
  const variants: LiveVariant[] = mapping.map(row => ({ id: row.variant_id, product_id: row.product_id, title: "Demo", sku: `HM-${row.article_id}`, metadata: { source_article_id: row.article_id }, manage_inventory: true, allow_backorder: false,
    prices: [{ id: `price_${row.article_id}`, amount: demoPrice("0100"), currency_code: "vnd", rules_count: 0, price_rules: [] }],
    inventory_items: [{ inventory_item_id: `item_${row.article_id}`, required_quantity: 1, inventory: { id: `item_${row.article_id}`, sku: `HM-${row.article_id}` } }] }))
  return { catalog, mapping, products, variants,
    levels: mapping.map(row => ({ id: `level_${row.article_id}`, inventory_item_id: `item_${row.article_id}`, location_id: "loc_a", stocked_quantity: 0, reserved_quantity: 0, incoming_quantity: 0 })),
    reservations: [] as { id: string, inventory_item_id: string, location_id: string, quantity: number }[],
    locations: [{ id: "loc_a", sales_channels: [{ id: "sc_a" }] }], salesChannelId: "sc_a", expectedLocationId: "loc_a" }
}

describe("H&M live audit boundaries", () => {
  it("preserves leading-zero article IDs and accepts multiple variants and zero remaining stock", () => {
    const result = validateLiveData(fixture())
    expect(result.findings).toEqual([])
    expect(result.mappingChecks.map(row => row.article_id)).toEqual(["00123", "00124"])
    expect(result.mappingChecks.every(row => row.status === "PASS")).toBe(true)
  })

  it("distinguishes missing, blank and invalid numeric inputs from a valid zero", () => {
    expect(numeric(0)).toBe(0)
    expect(numeric("0")).toBe(0)
    expect(numeric(null)).toBeNull()
    expect(numeric(undefined)).toBeNull()
    expect(numeric("")).toBeNull()
    expect(numeric(false)).toBeNull()
    expect(numeric("NaN")).toBeNull()
    const data = fixture()
    data.levels[0].stocked_quantity = null as unknown as number
    expect(validateLiveData(data).findings.some(row => row.code === "invalid_inventory_quantity")).toBe(true)
  })

  it("does not treat a price conditional on another region as an unconditional VND base price", () => {
    const data = fixture()
    data.variants[0].prices![0].rules_count = 1
    data.variants[0].prices![0].price_rules = [{ id: "rule_other_region", attribute: "region_id" }]
    const result = validateLiveData(data)
    expect(result.findings.some(row => row.code === "base_vnd_price_missing" && row.identifier === data.variants[0].id)).toBe(true)
    expect(result.mappingChecks[0].status).toBe("FAIL")
  })

  it.each(["rules_count", "price_rules"] as const)("does not assume unknown %s proves an unconditional price", field => {
    const data = fixture()
    delete data.variants[0].prices![0][field]
    expect(validateLiveData(data).findings.some(row => row.code === "base_vnd_price_missing")).toBe(true)
  })

  it("reports a missing inventory link, rather than mistaking it for an out-of-stock item", () => {
    const data = fixture()
    data.variants[0].inventory_items = []
    expect(validateLiveData(data).findings.some(row => row.code === "inventory_link_cardinality")).toBe(true)
  })

  it("finds orphan database IDs and an incorrect variant parent", () => {
    const data = fixture()
    data.mapping[0].product_id = "prod_missing"
    const codes = validateLiveData(data).findings.map(row => row.code)
    expect(codes).toContain("mapped_product_missing")
    expect(codes).toContain("variant_product_mismatch")
  })

  it("checks reservations against persisted reserved quantity without requiring initial stock 20", () => {
    const data = fixture()
    data.levels[0].stocked_quantity = 3
    data.levels[0].reserved_quantity = 2
    data.reservations.push({ id: "res_a", inventory_item_id: "item_00123", location_id: "loc_a", quantity: 2 })
    expect(validateLiveData(data).findings).toEqual([])
    data.reservations[0].quantity = 1
    expect(validateLiveData(data).findings.some(row => row.code === "reservation_level_mismatch")).toBe(true)
  })

  it("reports unexpected live H&M variants absent from the supplied batch mapping", () => {
    const data = fixture()
    data.variants.push({ ...data.variants[0], id: "variant_orphan", sku: "HM-00999" })
    expect(validateLiveData(data).findings.some(row => row.code === "live_hm_variant_without_mapping" && row.identifier === "variant_orphan")).toBe(true)
  })

  it("rejects two article mappings that alias the same variant ID", () => {
    const data = fixture()
    data.mapping[1].variant_id = data.mapping[0].variant_id
    const result = validateLiveData(data)
    expect(result.findings.some(row => row.code === "duplicate_mapping_variant")).toBe(true)
    expect(result.mappingChecks.every(row => row.status === "FAIL")).toBe(true)
  })

  it("marks all sibling mapping rows failed when their shared product is invalid", () => {
    const data = fixture()
    data.products[0].metadata!.source_hash = "changed"
    const result = validateLiveData(data)
    expect(result.findings.filter(row => row.code === "live_source_hash_mismatch")).toHaveLength(1)
    expect(result.mappingChecks.every(row => row.status === "FAIL")).toBe(true)
  })

  it("does not collapse distinct composite product groups sharing one product_code", () => {
    const data = fixture()
    data.catalog.push({ ...data.catalog[0], product_key: "0100-group-b", source_hash: "hash-b", variants: [{ article_id: "00999", color: "Black" }] })
    data.products.push({ ...data.products[0], id: "prod_b", handle: "hm-0100-group-b", metadata: { ...data.products[0].metadata, source_hash: "hash-b" } })
    data.mapping.push({ source: "hm", article_id: "00999", product_code: "0100", product_id: "prod_b", variant_id: "variant_b" })
    data.variants.push({ ...data.variants[0], id: "variant_b", product_id: "prod_b", sku: "HM-00999", metadata: { source_article_id: "00999" }, inventory_items: [{ inventory_item_id: "item_00999", required_quantity: 1, inventory: { id: "item_00999", sku: "HM-00999" } }] })
    data.levels.push({ id: "level_00999", inventory_item_id: "item_00999", location_id: "loc_a", stocked_quantity: 20, reserved_quantity: 0, incoming_quantity: 0 })
    expect(validateLiveData(data).findings).toEqual([])
  })
})
