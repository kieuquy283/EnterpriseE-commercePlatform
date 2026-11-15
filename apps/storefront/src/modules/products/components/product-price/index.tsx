import { getProductPrice } from "@lib/util/get-product-price"
import { HttpTypes } from "@medusajs/types"

export default function ProductPrice({
  product,
  variant,
}: {
  product: HttpTypes.StoreProduct
  variant?: HttpTypes.StoreProductVariant
}) {
  const { cheapestPrice, variantPrice } = getProductPrice({
    product,
    variantId: variant?.id,
  })

  const selectedPrice = variant ? variantPrice : cheapestPrice

  if (!selectedPrice) {
    return <div className="dm-skeleton h-8 w-32" role="status" aria-label="Đang tải giá" />
  }

  const isSale = selectedPrice.price_type === "sale"

  return (
    <div className="flex flex-col gap-1">
      <p className="flex flex-wrap items-baseline gap-2">
        {!variant && <span className="text-dm-caption text-ink-faint">Từ</span>}
        <span
          className={
            isSale
              ? "text-dm-title font-semibold tabular-nums text-accent"
              : "text-dm-title font-semibold tabular-nums text-ink"
          }
          data-testid="product-price"
          data-value={selectedPrice.calculated_price_number}
        >
          {selectedPrice.calculated_price}
        </span>
        {isSale && (
          <span
            className="text-dm-small text-ink-faint line-through"
            data-testid="original-product-price"
            data-value={selectedPrice.original_price_number}
          >
            {selectedPrice.original_price}
          </span>
        )}
      </p>
      {isSale && (
        <p className="text-dm-caption font-medium text-accent">
          Giảm {selectedPrice.percentage_diff}%
        </p>
      )}
      <p className="text-dm-caption text-ink-faint">
        Thuế và phí giao hàng được hiển thị khi thanh toán.
      </p>
    </div>
  )
}
