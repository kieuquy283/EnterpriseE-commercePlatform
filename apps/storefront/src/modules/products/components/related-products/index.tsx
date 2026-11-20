import { listProducts } from "@lib/data/products"
import { getRegion } from "@lib/data/regions"
import { getRecommendations } from "@lib/data/recommendations"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import Product from "../product-preview"

type RelatedProductsProps = {
  product: HttpTypes.StoreProduct
  countryCode: string
}

type SectionProps = {
  id: string
  heading: string
  note?: string
  products: HttpTypes.StoreProduct[]
  region: HttpTypes.StoreRegion
  testId: string
}

function ProductRow({ id, heading, note, products, region, testId }: SectionProps) {
  if (!products.length) {
    return null
  }

  return (
    <section aria-labelledby={id} data-testid={testId}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id={id} className="dm-display">
            {heading}
          </h2>
        </div>
        <LocalizedClientLink href="/store" className="dm-link text-dm-small">
          Tất cả sản phẩm
        </LocalizedClientLink>
      </div>
      {note && <p className="dm-small mt-3 max-w-dm-prose text-ink-muted">{note}</p>}
      <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 small:grid-cols-3 medium:grid-cols-4 small:gap-x-6">
        {products.map((item) => (
          <li key={item.id}>
            <Product region={region} product={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default async function RelatedProducts({ product, countryCode }: RelatedProductsProps) {
  const region = await getRegion(countryCode)

  if (!region) {
    return null
  }

  const seen = new Set<string>([product.id])
  const uniqueProducts = (items: HttpTypes.StoreProduct[]) =>
    items
      .filter((item) => {
        if (seen.has(item.id)) return false
        seen.add(item.id)
        return true
      })
      .slice(0, 6)

  // Suggestions are an enhancement: any failure falls through to the catalog
  // query below so the page still offers somewhere to go next.
  const recommendations = await getRecommendations(region.id, product.id).catch(() => null)

  const recommendedProducts = uniqueProducts(recommendations?.products ?? [])

  if (recommendedProducts.length && recommendations) {
    const isSimilarity = ["hm_metadata_similarity", "hm_hybrid_similarity"].includes(
      recommendations.strategy,
    )

    return (
      <ProductRow
        id="similar-products-heading"
        testId="similar-products"
        heading={isSimilarity ? "Sản phẩm tương tự" : "Có thể bạn sẽ thích"}
        note={
          recommendations.strategy === "hm_hybrid_similarity"
            ? "Gợi ý từ đặc điểm và hình thức sản phẩm trong danh mục."
            : isSimilarity
              ? "Gợi ý từ đặc điểm sản phẩm trong danh mục."
              : "Được chọn từ các sản phẩm hiện có tại cửa hàng."
        }
        products={recommendedProducts}
        region={region}
      />
    )
  }

  const queryParams: HttpTypes.StoreProductListParams = {
    is_giftcard: false,
  }
  if (product.collection_id) {
    queryParams.collection_id = [product.collection_id]
  }

  const products = await listProducts({
    queryParams,
    countryCode,
  })
    .then(({ response }) => uniqueProducts(response.products))
    .catch(() => [])

  return (
    <ProductRow
      id="related-products-heading"
      testId="related-products"
      heading="Mới trong mùa này"
      products={products}
      region={region}
    />
  )
}
