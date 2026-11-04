import { getRecommendations } from "@lib/data/recommendations"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

export default async function PopularProducts({ region }: { region: HttpTypes.StoreRegion }) {
  const result = await getRecommendations(region.id)
  if (!result?.products.length) return null
  return (
    <section className="content-container py-12" aria-labelledby="popular-products-heading" data-testid="popular-products">
      <h2 id="popular-products-heading" className="text-2xl-regular mb-8">
        {result.strategy === "hm_purchase_popularity" ? "Popular in H&M historical data" : "Featured products"}
      </h2>
      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-6">
        {result.products.slice(0, 12).map((product) => <li key={product.id}><ProductPreview product={product} region={region} /></li>)}
      </ul>
    </section>
  )
}
