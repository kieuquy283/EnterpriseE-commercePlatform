import { HttpTypes } from "@medusajs/types"
import LocalizedClientLink from "@modules/common/components/localized-client-link"

type ProductInfoProps = {
  product: HttpTypes.StoreProduct
}

function describeStock(product: HttpTypes.StoreProduct): {
  label: string
  detail: string
  tone: "success" | "muted" | "danger"
} {
  const variants = product.variants ?? []
  if (!variants.length) {
    return {
      label: "Chưa khả dụng",
      detail: "Sản phẩm chưa có phân loại có thể đặt mua.",
      tone: "danger",
    }
  }

  const sellable = variants.filter((variant) => {
    if (!variant.manage_inventory) return true
    if (variant.allow_backorder) return true
    return (variant.inventory_quantity ?? 0) > 0
  })

  if (sellable.length === 0) {
    return {
      label: "Hết hàng",
      detail: "Các phân loại hiện đã hết hàng. Mời bạn quay lại sau.",
      tone: "danger",
    }
  }

  if (sellable.length < variants.length) {
    return {
      label: "Một số phân loại đã hết",
      detail: `${sellable.length} trên ${variants.length} phân loại hiện còn hàng.`,
      tone: "muted",
    }
  }

  return {
    label: "Còn hàng",
    detail:
      "Còn hàng theo thông tin hiện tại. Tình trạng hàng sẽ được kiểm tra lại khi thanh toán.",
    tone: "success",
  }
}

const ProductInfo = ({ product }: ProductInfoProps) => {
  const stock = describeStock(product)

  return (
    <div id="product-info" className="flex flex-col">
      {product.collection && (
        <LocalizedClientLink
          href={`/collections/${product.collection.handle}`}
          className="text-dm-small text-ink-muted transition-colors hover:text-accent"
        >
          {product.collection.title}
        </LocalizedClientLink>
      )}

      <h1 className="dm-display mt-5" data-testid="product-title">
        {product.title}
      </h1>

      <div className="mt-3 flex items-center gap-3">
        <span
          className={
            stock.tone === "success"
              ? "dm-badge-instock"
              : stock.tone === "danger"
                ? "dm-badge-outstock"
                : "text-dm-caption font-medium text-warning"
          }
        >
          <span aria-hidden="true" className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
          {stock.label}
        </span>
        <span aria-hidden="true" className="text-line-strong">
          |
        </span>
        <span className="text-dm-caption text-ink-faint">
          {product.variants?.length ?? 0}{" "}
          {product.variants?.length === 1 ? "phân loại" : "phân loại"}
        </span>
      </div>

      {product.description && (
        <p className="dm-body mt-5 whitespace-pre-line" data-testid="product-description">
          {product.description}
        </p>
      )}

      <p className="dm-caption mt-3">{stock.detail}</p>
    </div>
  )
}

export default ProductInfo
