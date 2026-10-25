import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { ProductTypes } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

type CatalogQuery = {
  q?: string
  limit?: string
  offset?: string
}

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

function parsePositiveInteger(value: string | undefined, fallback: number) {
  const parsed = Number(value)

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback
}

function getQueryString(value: unknown) {
  return typeof value === "string" ? value : undefined
}

/**
 * Catalog read model for consumers that do not need the full Store API query
 * surface. Pricing and cart mutations remain owned by Medusa's commerce APIs.
 *
 * GET /store/catalog?q=ao%20thun&limit=20&offset=0
 */
export async function GET(
  req: MedusaRequest<CatalogQuery>,
  res: MedusaResponse
) {
  const productModuleService = req.scope.resolve(Modules.PRODUCT)
  const query = getQueryString(req.query.q)?.trim() || ""
  const limit = Math.min(
    parsePositiveInteger(getQueryString(req.query.limit), DEFAULT_LIMIT),
    MAX_LIMIT
  )
  const offset = parsePositiveInteger(getQueryString(req.query.offset), 0)

  const filters: ProductTypes.FilterableProductProps = {
    status: "published",
    ...(query ? { q: query.slice(0, 80) } : {}),
  }

  const [products, count] = await productModuleService.listAndCountProducts(
    filters,
    {
      skip: offset,
      take: limit,
      order: { created_at: "DESC" },
      relations: ["variants", "images", "options", "tags"],
    }
  )

  res.json({
    products,
    count,
    limit,
    offset,
  })
}
