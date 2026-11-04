import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { HttpTypes } from "@medusajs/types"
import Product from "../product-preview"
import { getRecommendations } from "@lib/data/recommendations"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

export default async function RelatedProducts({
  product,
  countryCode,
}: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const recommendations = await getRecommendations(region.id, product.id)
  const seen = new Set<string>([product.id])
  const uniqueProducts = (items: HttpTypes.StoreProduct[]) => items.filter((item) => {
    if (seen.has(item.id)) return false
    seen.add(item.id)
    return true
  }).slice(0, 6)
  const recommendedProducts = uniqueProducts(recommendations?.products ?? [])
  if (recommendedProducts.length && recommendations) {
    return (
      <section className="product-page-constraint" aria-labelledby="similar-products-heading" data-testid="similar-products">
        <h2 id="similar-products-heading" className="text-2xl-regular mb-8">{recommendations.strategy === "hm_metadata_similarity" ? "Similar products" : "You may also like"}</h2>
        <p className="mb-6 text-ui-fg-subtle">{recommendations.strategy === "hm_metadata_similarity" ? "Based on product attributes." : "Selected products from the available catalog."}</p>
        <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-6">
          {recommendedProducts.map((item) => (
            <li key={item.id}><Product region={region} product={item} /></li>
          ))}
        </ul>
      </section>
    )
  }

  // edit this function to define your related products logic
  const queryParams: HttpTypes.StoreProductListParams = {}
  if (region?.id) {
    queryParams.region_id = region.id
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }
  if (product.tags) {
    queryParams.tag_id = product.tags
      .map((t) => t.id)
      .filter(Boolean) as string[]
  }
  queryParams.is_giftcard = false

  const products = await listProducts({
    queryParams,
    countryCode,
  }).then(({ response }) => {
    return uniqueProducts(response.products)
  }).catch(() => [])

  if (!products.length) {
    return null
  }

  return (
    <section className="product-page-constraint" aria-labelledby="related-products-heading" data-testid="related-products">
      <div className="flex flex-col items-center text-center mb-16">
        <h2 id="related-products-heading" className="text-base-regular text-gray-600 mb-6">
          Related products
        </h2>
        <p className="text-2xl-regular text-ui-fg-base max-w-lg">
          You might also want to check out these products.
        </p>
      </div>

      <ul className="grid grid-cols-2 small:grid-cols-3 medium:grid-cols-4 gap-x-6 gap-y-8">
        {products.map((product) => (
          <li key={product.id}>
            <Product region={region} product={product} />
          </li>
        ))}
      </ul>
    </section>
  )
}
