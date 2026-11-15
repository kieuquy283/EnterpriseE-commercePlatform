import ItemsPreviewTemplate from "@modules/cart/templates/preview"
import CartTotals from "@modules/common/components/cart-totals"
import DiscountCode from "@modules/checkout/components/discount-code"
import { HttpTypes } from "@medusajs/types"

const CheckoutSummary = ({ cart }: { cart: HttpTypes.StoreCart }) => {
  const itemCount = cart.items?.reduce((total, item) => total + item.quantity, 0) ?? 0

  return (
    <div className="small:sticky small:top-24">
      <div className="flex flex-col gap-y-6 bg-surface px-5 py-8 small:px-8 small:py-10">
        <div className="flex flex-col gap-y-1.5">
          <h2 className="dm-heading">Trong giỏ hàng</h2>
          <p className="dm-caption tabular-nums">
            {itemCount} {itemCount === 1 ? "sản phẩm" : "sản phẩm"}
          </p>
        </div>

        <ItemsPreviewTemplate cart={cart} />

        <DiscountCode cart={cart} />

        <div className="dm-divider" />

        <CartTotals totals={cart} />
      </div>
    </div>
  )
}

export default CheckoutSummary
