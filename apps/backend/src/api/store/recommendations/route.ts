import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import RecommendationModuleService from "../../../modules/recommendation/service"
import { resolveStoreProducts } from "../../../modules/recommendation/store-products"

type StoreProduct = {
  id: string; title: string; handle: string; thumbnail?: string; images?: { id: string; url: string }[]
  metadata?: Record<string, unknown>
  variants?: { id: string; manage_inventory?: boolean; allow_backorder?: boolean; inventory_quantity?: number; calculated_price?: { calculated_amount?: number; currency_code?: string } }[]
}

function variantSaleable(variant: NonNullable<StoreProduct["variants"]>[number]) {
  return Number.isFinite(variant.calculated_price?.calculated_amount) &&
    (variant.manage_inventory === false || variant.allow_backorder === true || (variant.inventory_quantity ?? 0) > 0)
}

export function saleable(product: StoreProduct) {
  return product.variants?.some(variantSaleable) ?? false
}

// Explicit projection prevents source metadata, article options and SKUs leaking.
export function publicProduct(product: StoreProduct) {
  return {
    id: product.id, title: product.title, handle: product.handle, thumbnail: product.thumbnail,
    images: product.images?.map(({ id, url }) => ({ id, url })),
    variants: product.variants?.filter(variantSaleable).map((variant) => ({ id: variant.id, calculated_price: variant.calculated_price })),
  }
}

async function recommendations(req: MedusaRequest, res: MedusaResponse) {
  const { placement, region_id: region, product_id: product, limit: rawLimit } = req.query
  const limit = rawLimit === undefined ? (placement === "home" ? 12 : 6) : Number(rawLimit)
  if (Object.keys(req.query).some((key) => !["placement", "region_id", "product_id", "limit"].includes(key)) ||
    !["home", "product_detail"].includes(placement as string) || typeof region !== "string" || !/^reg_[a-zA-Z0-9]+$/.test(region) ||
    !Number.isInteger(limit) || limit < 1 || limit > 24 ||
    (placement === "product_detail" && (typeof product !== "string" || !/^prod_[a-zA-Z0-9]+$/.test(product))) ||
    (rawLimit !== undefined && (typeof rawLimit !== "string" || !/^\d+$/.test(rawLimit)))) {
    return res.status(400).json({ message: "Invalid recommendation parameters" })
  }
  const displayLimit = Math.min(limit, placement === "home" ? 12 : 6)
  let productBatches = 0
  const loadProducts = async (ids?: string[]) => {
    productBatches++
    return [...(await resolveStoreProducts(req, {
      region_id: region, limit: 100, order: "id", ...(ids ? { id: ids } : {}),
      fields: "id,title,handle,thumbnail,metadata,images.id,images.url,variants.id,variants.manage_inventory,variants.allow_backorder,*variants.calculated_price,variants.inventory_quantity",
    })).products as StoreProduct[]]
  }
  try {
    // Reject unknown regions instead of accepting unpriced or wrong-context products.
    try {
      await req.scope.resolve(Modules.REGION).retrieveRegion(region)
    } catch (error) {
      if (error instanceof MedusaError && error.type === MedusaError.Types.NOT_FOUND) return res.status(400).json({ message: "Unknown region" })
      throw error
    }
    let targetGroup: unknown
    if (placement === "product_detail") {
      const targets = await loadProducts([product as string])
      if (!targets.some((p) => p.id === product && saleable(p))) return res.status(404).json({ message: "Product not available" })
      targetGroup = targets[0]?.metadata?.product_group
    }
    let ids: string[] = []
    let version: string | null = null
    let strategy = "catalog_featured"
    let fallbackReason: string | null = "no_candidates"
    let popularIds: string[] = []
    try {
      const service: RecommendationModuleService = req.scope.resolve("recommendation")
      const [pointer] = await service.listRecommendationActives({ id: "recommendation_active" })
      if (pointer) {
        const run = await service.retrieveRecommendationRun(pointer.run_id)
        if (run.status !== "ready") throw new MedusaError(MedusaError.Types.INVALID_DATA, "Run is not ready")
        const rows = await service.listRecommendationCandidates({ run_id: run.id, placement: placement as "home" | "product_detail", context_key: placement === "home" ? "home" : `product:${product}` }, { take: 100, order: { rank: "ASC" } })
        ids = rows.map((row) => row.target_product_id)
        if (placement === "product_detail") {
          const popular = await service.listRecommendationCandidates({ run_id: run.id, placement: "home", context_key: "home" }, { take: 100, order: { rank: "ASC" } })
          popularIds = popular.map((row) => row.target_product_id)
        }
        version = run.version
        if (ids.length) {
          strategy = placement === "home" ? "hm_purchase_popularity" : "hm_metadata_similarity"
          fallbackReason = null
        }
      }
    } catch {
      fallbackReason = "candidate_store_unavailable"
    }
    const batchSize = displayLimit
    let candidates = ids.length ? await loadProducts(ids.slice(0, batchSize)) : []
    if (candidates.filter((p) => p.id !== product && saleable(p)).length < displayLimit && ids.length > batchSize) {
      candidates.push(...await loadProducts(ids.slice(batchSize, 100)))
    }
    const byId = new Map(candidates.map((item) => [item.id, item]))
    candidates = ids.map((id) => byId.get(id)).filter((p): p is StoreProduct => !!p && p.id !== product && saleable(p))
    if (candidates.length < displayLimit) {
      const primaryCount = candidates.length
      let fallback = popularIds.length ? await loadProducts(popularIds) : []
      const order = new Map(popularIds.map((id, index) => [id, index]))
      fallback.sort((a, b) => {
        const groupOrder = Number(b.metadata?.product_group === targetGroup) - Number(a.metadata?.product_group === targetGroup)
        return groupOrder || (order.get(a.id) ?? 100) - (order.get(b.id) ?? 100)
      })
      const seen = new Set(candidates.map((p) => p.id))
      const fill = (items: StoreProduct[]) => {
        for (const item of items) {
          if (candidates.length >= displayLimit) break
          if (item.id !== product && !seen.has(item.id) && saleable(item)) { candidates.push(item); seen.add(item.id) }
        }
      }
      fill(fallback)
      if (candidates.length < displayLimit) fill(await loadProducts())
      fallbackReason ||= "insufficient_saleable_candidates"
      if (candidates.length > primaryCount) strategy = primaryCount ? `${strategy}_with_fallback` : "catalog_featured"
    }
    res.setHeader("Cache-Control", "no-store")
    res.setHeader("Server-Timing", `medusa-products;desc="${productBatches} batches"`)
    return res.json({ placement, strategy, version, fallback_reason: fallbackReason, products: candidates.slice(0, displayLimit).map(publicProduct) })
  } catch {
    return res.status(503).json({ message: "Recommendation commerce dependency unavailable" })
  }
}

let inFlight = 0

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  if (process.env.ENABLE_RECOMMENDATIONS !== "true") return res.status(404).json({ message: "Not found" })
  const configured = Number(process.env.RECOMMENDATION_MAX_CONCURRENCY || 4)
  const maximum = Number.isInteger(configured) && configured >= 1 && configured <= 64 ? configured : 4
  if (inFlight >= maximum) {
    res.setHeader("Retry-After", "1")
    return res.status(503).json({ message: "Recommendation capacity temporarily unavailable" })
  }
  inFlight++
  let timedOut = false
  const guarded = Object.create(res) as MedusaResponse
  guarded.status = (code: number) => {
    if (!timedOut) res.status(code)
    return guarded
  }
  guarded.json = (body) => {
    if (!timedOut) res.json(body)
    return guarded
  }
  guarded.setHeader = (name, value) => {
    if (!timedOut) res.setHeader(name, value)
    return guarded
  }
  const timer = setTimeout(() => {
    timedOut = true
    if (!res.headersSent) res.status(503).json({ message: "Recommendation dependency timed out" })
  }, 4000)
  try {
    return await recommendations(req, guarded)
  } finally {
    clearTimeout(timer)
    // Retain the capacity slot until underlying work ends, even after timeout.
    inFlight--
  }
}
