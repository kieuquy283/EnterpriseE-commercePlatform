import { clx } from "@modules/common/components/ui"
import { VariantPrice } from "types/global"

export default async function PreviewPrice({ price }: { price: VariantPrice }) {
  if (!price) {
    return null
  }

  const isSale = price.price_type === "sale"

  return (
    <span className="flex flex-col items-end gap-0.5">
      {isSale && (
        <span className="text-dm-caption text-ink-faint line-through" data-testid="original-price">
          {price.original_price}
        </span>
      )}
      <span
        className={clx(
          "text-dm-small font-medium tabular-nums",
          isSale ? "text-accent" : "text-ink",
        )}
        data-testid="price"
      >
        {price.calculated_price}
      </span>
    </span>
  )
}
