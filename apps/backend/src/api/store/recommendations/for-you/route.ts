import type { AuthenticatedMedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { MedusaError, Modules } from "@medusajs/framework/utils"
import RecommendationModuleService from "../../../../modules/recommendation/service"
import { resolveStoreProducts } from "../../../../modules/recommendation/store-products"
import PersonalizationModuleService from "../../../../modules/personalization/service"
import { rankForYou, type InterestProfile } from "../../../../modules/personalization/rank"
import { publicProduct, saleable } from "../route"

type Product = Parameters<typeof publicProduct>[0]

async function serve(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  if (process.env.ENABLE_PERSONALIZED_RECOMMENDATIONS !== "true") return res.status(404).json({ message: "Not found" })
  const customerId = req.auth_context?.actor_id
  if (!customerId) return res.status(401).json({ message: "Authentication required" })
  const { region_id: region, limit: rawLimit } = req.query
  const limit = rawLimit === undefined ? 12 : Number(rawLimit)
  if (Object.keys(req.query).some((key) => !["region_id", "limit"].includes(key)) ||
    typeof region !== "string" || !/^reg_[a-zA-Z0-9]+$/.test(region) ||
    !Number.isInteger(limit) || limit < 1 || limit > 12 ||
    (rawLimit !== undefined && (typeof rawLimit !== "string" || !/^\d+$/.test(rawLimit)))) {
    return res.status(400).json({ message: "Invalid recommendation parameters" })
  }
  res.setHeader("Cache-Control", "private, no-store")
  try {
    try {
      await req.scope.resolve(Modules.REGION).retrieveRegion(region)
    } catch (error) {
      if (error instanceof MedusaError && error.type === MedusaError.Types.NOT_FOUND) return res.status(400).json({ message: "Unknown region" })
      throw error
    }
    const loadProducts = async (ids?: string[]) => [...(await resolveStoreProducts(req, {
      region_id: region, limit: 100, order: "id", ...(ids ? { id: ids } : {}),
      fields: "id,title,handle,thumbnail,images.id,images.url,variants.id,variants.manage_inventory,variants.allow_backorder,*variants.calculated_price,variants.inventory_quantity",
    })).products as Product[]]
    const personalization: PersonalizationModuleService = req.scope.resolve("personalization")
    const [consent] = await personalization.listRecommendationConsents({ customer_id: customerId })
    let profile: InterestProfile = { source_products: [] }
    if (consent?.granted) {
      const [stored] = await personalization.listRecommendationProfiles({ customer_id: customerId })
      if (stored?.consent_epoch === consent.epoch && stored.profile_version === "behavioral-v1") {
        const candidate = stored.interests as Partial<InterestProfile>
        if (Array.isArray(candidate.source_products) && candidate.source_products.every((row) =>
          typeof row.product_id === "string" && /^prod_[a-zA-Z0-9]+$/.test(row.product_id) &&
          Number.isFinite(row.weight) && row.weight > 0 && row.weight <= 5)) {
          profile = { source_products: candidate.source_products.slice(0, 10) }
        }
      }
    }
    let ids: string[] = []
    let version: string | null = null
    let reason = consent?.granted ? "cold_start_or_profile_pending" : "no_consent"
    let strategy = "catalog_fallback"
    try {
      const recommendations: RecommendationModuleService = req.scope.resolve("recommendation")
      const [pointer] = await recommendations.listRecommendationActives({ id: "recommendation_active" })
      if (pointer) {
        const run = await recommendations.retrieveRecommendationRun(pointer.run_id)
        if (run.status === "ready") {
          version = run.version
          const popular = await recommendations.listRecommendationCandidates({
            run_id: run.id, placement: "home", context_key: "home",
          }, { take: 100, order: { rank: "ASC" } })
          if (profile.source_products.length) {
            const neighbors = await recommendations.listRecommendationCandidates({
              run_id: run.id, placement: "product_detail",
              context_key: profile.source_products.map((row) => `product:${row.product_id}`),
            }, { take: 500, order: { rank: "ASC" } })
            const metadataNeighbors = neighbors.filter((row) => row.strategy === "hm_metadata_similarity")
            ids = rankForYou(profile, metadataNeighbors.map((row) => ({
              source_product_id: row.context_key.slice(8), target_product_id: row.target_product_id,
              score: row.score, rank: row.rank,
            })), popular.map((row) => ({ product_id: row.target_product_id, rank: row.rank })), 12)
            if (metadataNeighbors.length) { strategy = "behavioral_v1"; reason = "recent_interest" }
          }
          if (!ids.length) ids = popular.map((row) => row.target_product_id)
        }
      }
    } catch {
      reason = "candidate_store_unavailable"
    }
    const products = ids.length ? await loadProducts(ids.slice(0, 100)) : await loadProducts()
    const byId = new Map(products.map((product) => [product.id, product]))
    const ranked = ids.length ? ids.map((id) => byId.get(id)).filter((p): p is Product => !!p && saleable(p))
      : products.filter(saleable)
    const seen = new Set(ranked.map((p) => p.id))
    if (ranked.length < limit) {
      for (const product of await loadProducts()) {
        if (ranked.length >= limit) break
        if (!seen.has(product.id) && saleable(product)) { ranked.push(product); seen.add(product.id) }
      }
    }
    return res.json({ placement: "for_you", strategy, personalized: strategy === "behavioral_v1",
      version, reason, products: ranked.slice(0, limit).map(publicProduct) })
  } catch {
    return res.status(503).json({ message: "Recommendation commerce dependency unavailable" })
  }
}

let inFlight = 0

export async function GET(req: AuthenticatedMedusaRequest, res: MedusaResponse) {
  const configured = Number(process.env.PERSONALIZATION_MAX_CONCURRENCY || 4)
  const maximum = Number.isInteger(configured) && configured >= 1 && configured <= 64 ? configured : 4
  if (inFlight >= maximum) {
    res.setHeader("Retry-After", "1")
    return res.status(503).json({ message: "Recommendation capacity temporarily unavailable" })
  }
  inFlight++
  try {
    return await serve(req, res)
  } finally {
    inFlight--
  }
}
