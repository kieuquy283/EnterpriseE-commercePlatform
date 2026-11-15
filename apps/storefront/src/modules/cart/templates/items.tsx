import repeat from "@lib/util/repeat"
import { HttpTypes } from "@medusajs/types"

import Item from "@modules/cart/components/item"
import SkeletonCartLine from "@modules/skeletons/components/skeleton-cart-line"

type ItemsTemplateProps = {
  cart?: HttpTypes.StoreCart
}

const ItemsTemplate = ({ cart }: ItemsTemplateProps) => {
  const items = cart?.items
  const itemCount = items?.reduce((total, item) => total + item.quantity, 0) ?? 0

  return (
    <div className="flex flex-col gap-y-6">
      <div className="flex flex-col gap-y-2">
        <p className="dm-eyebrow">Những món bạn chọn</p>
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h1 className="dm-title">Giỏ hàng của bạn</h1>
          {items ? (
            <p className="dm-caption tabular-nums">
              {itemCount} {itemCount === 1 ? "sản phẩm" : "sản phẩm"}
            </p>
          ) : null}
        </div>
      </div>

      {items ? (
        <ul className="border-t border-line pt-6">
          {items
            .sort((a, b) => {
              return (a.created_at ?? "") > (b.created_at ?? "") ? -1 : 1
            })
            .map((item) => {
              return <Item key={item.id} item={item} currencyCode={cart?.currency_code} />
            })}
        </ul>
      ) : (
        <div className="border-t border-line pt-6">
          {repeat(3).map((i) => {
            return <SkeletonCartLine key={i} />
          })}
        </div>
      )}
    </div>
  )
}

export default ItemsTemplate
