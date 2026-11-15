import { getRecommendations } from "@lib/data/recommendations"
import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function PopularProducts({ region }: { region: HttpTypes.StoreRegion }) {
  const result = await getRecommendations(region.id).catch(() => null)
  const recommended = result?.products?.length ? result.products : null

  const fallback = recommended
    ? null
    : await listProducts({
        regionId: region.id,
        queryParams: { limit: 8, order: "-created_at" },
      })
        .then(({ response }) => response.products)
        .catch(() => [] as HttpTypes.StoreProduct[])

  const products = recommended ?? fallback ?? []

  const heading = recommended
    ? result?.strategy === "hm_purchase_popularity"
      ? "Sản phẩm được quan tâm"
      : "Gợi ý cho bạn"
    : "Mới trong mùa này"

  return (
    <>
      <section
        className="content-container dm-section"
        aria-labelledby="popular-products-heading"
        data-testid="popular-products"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="popular-products-heading" className="dm-display">
              {heading}
            </h2>
          </div>
          <LocalizedClientLink href="/store" className="dm-link text-dm-small">
            Xem tất cả sản phẩm
          </LocalizedClientLink>
        </div>

        {products.length ? (
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 small:grid-cols-3 medium:grid-cols-4 small:gap-x-6">
            {products.slice(0, 4).map((product) => (
              <li key={product.id}>
                <ProductPreview product={product} region={region} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-8 border-y border-line py-12">
            <p className="text-dm-small font-medium text-ink">Bộ sưu tập đang được chuẩn bị</p>
            <p className="mt-1.5 text-dm-caption text-ink-muted">
              Bộ sưu tập đang được chuẩn bị. Mời bạn quay lại sau.
            </p>
          </div>
        )}
      </section>
    </>
  )
}
