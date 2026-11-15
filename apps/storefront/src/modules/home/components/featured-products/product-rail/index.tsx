import { listProducts } from "@lib/data/products"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ProductPreview from "@modules/products/components/product-preview"

export default async function ProductRail({
  collection,
  region,
}: {
  collection: HttpTypes.StoreCollection
  region: HttpTypes.StoreRegion
}) {
  const {
    response: { products: pricedProducts },
  } = await listProducts({
    regionId: region.id,
    queryParams: {
      collection_id: collection.id,
      fields: "*variants.calculated_price,+variants.inventory_quantity",
      limit: 4,
    },
  }).catch(() => ({ response: { products: [] as HttpTypes.StoreProduct[] } }))

  if (!pricedProducts?.length) {
    return null
  }

  return (
    <>
      <div className="border-b border-line last:border-b-0">
        <section className="content-container dm-section">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="dm-eyebrow">Bộ sưu tập</p>
              <h2 className="dm-title mt-3">{collection.title}</h2>
            </div>
            <LocalizedClientLink
              href={`/collections/${collection.handle}`}
              className="dm-link text-dm-small"
            >
              Xem tất cả
            </LocalizedClientLink>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 small:grid-cols-3 medium:grid-cols-4 small:gap-x-6">
            {pricedProducts.map((product) => (
              <li key={product.id}>
                <ProductPreview product={product} region={region} isFeatured />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  )
}
