"use client"

import CartTotals from "@modules/common/components/cart-totals"
import DiscountCode from "@modules/checkout/components/discount-code"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

type SummaryProps = {
  cart: HttpTypes.StoreCart
}

function getCheckoutStep(cart: HttpTypes.StoreCart) {
  if (!cart?.shipping_address?.address_1 || !cart.email) {
    return "address"
  } else if (cart?.shipping_methods?.length === 0) {
    return "delivery"
  } else {
    return "payment"
  }
}

const Summary = ({ cart }: SummaryProps) => {
  const step = getCheckoutStep(cart)

  return (
    <div className="flex flex-col gap-y-6 bg-surface px-5 py-8 small:px-8 small:py-10">
      <div className="flex flex-col gap-y-1.5">
        <h2 className="dm-heading">Tóm tắt đơn hàng</h2>
        <p className="dm-caption">
          Phí giao hàng và thuế được hiển thị trước khi bạn xác nhận đặt hàng.
        </p>
      </div>

      <DiscountCode cart={cart} />

      <div className="dm-divider" />

      <CartTotals totals={cart} />

      <LocalizedClientLink
        href={"/checkout?step=" + step}
        data-testid="checkout-button"
        className="dm-btn dm-btn-primary dm-btn-block"
      >
        Tiến hành thanh toán
      </LocalizedClientLink>

      <p className="dm-caption">
        Bạn sẽ kiểm tra địa chỉ, giao hàng và phương thức thanh toán ở bước tiếp theo.
      </p>
    </div>
  )
}

export default Summary
