import { getForYouRecommendations } from "@lib/data/personalization"
import { HttpTypes } from "@medusajs/types"
import ProductPreview from "@modules/products/components/product-preview"
import ClickTracker from "./click-tracker"

/**
 * Consent-gated personalised rail. It renders nothing when personalisation is
 * disabled, unavailable or has no candidates, so the page never blocks on it.
 */
export default async function ForYou({ region }: { region: HttpTypes.StoreRegion }) {
  const result = await getForYouRecommendations(region.id).catch(() => null)

  if (!result?.personalized || !result.products.length) {
    return null
  }

  return (
    <section
      className="content-container dm-section"
      aria-labelledby="for-you-heading"
      data-testid="for-you-products"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="for-you-heading" className="dm-display">
            Dành cho bạn
          </h2>
        </div>
      </div>
      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 small:grid-cols-3 medium:grid-cols-4 small:gap-x-6">
        {result.products.slice(0, 4).map((product) => (
          <li key={product.id}>
            <ClickTracker productId={product.id}>
              <ProductPreview product={product} region={region} />
            </ClickTracker>
          </li>
        ))}
      </ul>
    </section>
  )
}
