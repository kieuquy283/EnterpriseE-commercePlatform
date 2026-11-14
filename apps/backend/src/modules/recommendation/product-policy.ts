export type StoreProduct = {
  id: string
  title: string
  handle: string
  thumbnail?: string
  images?: { id: string; url: string }[]
  metadata?: Record<string, unknown>
  variants?: {
    id: string
    manage_inventory?: boolean
    allow_backorder?: boolean
    inventory_quantity?: number
    calculated_price?: { calculated_amount?: number; currency_code?: string }
  }[]
}

function variantSaleable(variant: NonNullable<StoreProduct["variants"]>[number]) {
  return (
    Number.isFinite(variant.calculated_price?.calculated_amount) &&
    (variant.manage_inventory === false ||
      variant.allow_backorder === true ||
      (variant.inventory_quantity ?? 0) > 0)
  )
}

export function saleable(product: StoreProduct) {
  return product.variants?.some(variantSaleable) ?? false
}

// Explicit projection prevents source metadata, article options and SKUs leaking.
export function publicProduct(product: StoreProduct) {
  return {
    id: product.id,
    title: product.title,
    handle: product.handle,
    thumbnail: product.thumbnail,
    images: product.images?.map(({ id, url }) => ({ id, url })),
    variants: product.variants
      ?.filter(variantSaleable)
      .map((variant) => ({ id: variant.id, calculated_price: variant.calculated_price })),
  }
}
