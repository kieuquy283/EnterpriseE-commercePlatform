import { getRecommendations } from "@lib/data/recommendations"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"

export default async function PopularProducts({ region }: { region: HttpTypes.StoreRegion }) {
  const result = await getRecommendations(region.id)
  const recommended = result?.products.length ? result.products : null
  const products = recommended ?? await listProducts({ regionId: region.id, queryParams: { limit: 12 } })
    .then(({ response }) => response.products)
    .catch(() => [])
  return (
    <section className="content-container py-12" aria-labelledby="popular-products-heading" data-testid="popular-products">
      <h2 id="popular-products-heading" className="text-2xl-regular mb-8">
        {recommended
          ? result?.strategy === "hm_purchase_popularity" ? "Popular in H&M historical data" : "Featured products"
          : "Explore products"}
      </h2>
      {products.length ? (
        <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-6">
          {products.slice(0, 12).map((product) => <li key={product.id}><ProductPreview product={product} region={region} /></li>)}
        </ul>
      ) : <p>No products available right now.</p>}
    </section>
  )
}
