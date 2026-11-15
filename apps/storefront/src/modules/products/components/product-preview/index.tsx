import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { Badge } from "@modules/common/components/ui"
import Thumbnail from "../thumbnail"
import PreviewPrice from "./price"

function stockLabel(product: HttpTypes.StoreProduct): {
  label: string
  tone: "neutral" | "warning" | "danger"
} | null {
  const variants = product.variants ?? []
  if (!variants.length) {
    return null
  }

  if (
    variants.some(
      (variant) =>
        variant.manage_inventory &&
        !variant.allow_backorder &&
        typeof variant.inventory_quantity !== "number",
    )
  )
    return null

  const sellable = variants.filter((variant) => {
    if (!variant.manage_inventory) return true
    if (variant.allow_backorder) return true
    return (variant.inventory_quantity ?? 0) > 0
  })

  if (sellable.length === 0) {
    return { label: "Hết hàng", tone: "danger" }
  }
  if (sellable.length < variants.length) {
    return { label: "Một số phân loại đã hết", tone: "warning" }
  }
  return null
}

export default async function ProductPreview({
  product,
  isFeatured,
  region: _region,
}: {
  product: HttpTypes.StoreProduct
  isFeatured?: boolean
  region: HttpTypes.StoreRegion
}) {
  const { cheapestPrice } = getProductPrice({ product })
  const stock = stockLabel(product)

  return (
    <LocalizedClientLink
      href={`/products/${product.handle}`}
      className="group block"
      data-testid="product-wrapper"
    >
      <div className="relative">
        <Thumbnail
          thumbnail={product.thumbnail}
          images={product.images}
          size="full"
          isFeatured={isFeatured}
          label={product.title ?? undefined}
        />
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {stock && (
            <Badge tone={stock.tone} className="bg-canvas/90 backdrop-blur-sm">
              {stock.label}
            </Badge>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-col items-start justify-between gap-3 small:flex-row">
        <div className="min-w-0">
          <h3
            className="text-dm-small font-medium text-ink transition-colors group-hover:text-accent"
            data-testid="product-title"
          >
            {product.title}
          </h3>
          {product.collection?.title && (
            <p className="mt-1 truncate text-dm-caption text-ink-faint">
              {product.collection.title}
            </p>
          )}
        </div>
        <div className="shrink-0 text-left">
          {cheapestPrice && <PreviewPrice price={cheapestPrice} />}
        </div>
      </div>
    </LocalizedClientLink>
  )
}
