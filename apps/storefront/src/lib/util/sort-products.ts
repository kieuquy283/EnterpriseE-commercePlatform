import { HttpTypes } from "@medusajs/types"
import { SortOptions } from "@modules/store/components/refinement-list/sort-products"

/** Sort a complete result set using backend-calculated prices. Unknown prices stay last. */
export function sortProducts(
  products: HttpTypes.StoreProduct[],
  sortBy: SortOptions,
): HttpTypes.StoreProduct[] {
  const minimumPrice = (product: HttpTypes.StoreProduct) => {
    const prices = (product.variants ?? []).flatMap((variant) => {
      const amount = variant.calculated_price?.calculated_amount
      return typeof amount === "number" && Number.isFinite(amount) ? [amount] : []
    })
    return prices.length ? Math.min(...prices) : null
  }
  return [...products].sort((a, b) => {
    if (sortBy === "created_at") {
      return (
        new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime() ||
        a.id.localeCompare(b.id)
      )
    }
    const first = minimumPrice(a)
    const second = minimumPrice(b)
    if (first === null) return second === null ? a.id.localeCompare(b.id) : 1
    if (second === null) return -1
    return (sortBy === "price_asc" ? first - second : second - first) || a.id.localeCompare(b.id)
  })
}
