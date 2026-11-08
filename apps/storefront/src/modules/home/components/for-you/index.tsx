import { getForYouRecommendations } from "@lib/data/personalization"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import ClickTracker from "./click-tracker"

export default async function ForYou({ region }: { region: HttpTypes.StoreRegion }) {
  const result = await getForYouRecommendations(region.id)
  if (!result?.personalized || !result.products.length) return null
  return (
    <section className="content-container py-12" aria-labelledby="for-you-heading" data-testid="for-you-products">
      <h2 id="for-you-heading" className="text-2xl-regular mb-8">For you</h2>
      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-6">
        {result.products.slice(0, 12).map((product) => <li key={product.id}>
          <ClickTracker productId={product.id}><ProductPreview product={product} region={region} /></ClickTracker>
        </li>)}
      </ul>
    </section>
  )
}
