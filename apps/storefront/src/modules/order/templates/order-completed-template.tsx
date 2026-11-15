import { cookies as nextCookies } from "next/headers"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OnboardingCta from "@modules/order/components/onboarding-cta"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"
import { HttpTypes } from "@medusajs/types"

type OrderCompletedTemplateProps = {
  order: HttpTypes.StoreOrder
}

export default async function OrderCompletedTemplate({ order }: OrderCompletedTemplateProps) {
  const cookies = await nextCookies()

  const isOnboarding = cookies.get("_medusa_onboarding")?.value === "true"

  return (
    <div className="dm-section min-h-[calc(100vh-64px)]">
      <div className="content-container flex flex-col items-center gap-y-8">
        {isOnboarding && <OnboardingCta orderId={order.id} />}
        <div
          className="flex w-full max-w-5xl flex-col gap-y-8"
          data-testid="order-complete-container"
        >
          <div className="flex flex-col gap-y-3 border-b border-line pb-8">
            <p className="dm-eyebrow">Đặt hàng thành công</p>
            <h1 className="dm-display">Cảm ơn bạn</h1>
            <p className="dm-lead max-w-dm-prose">
              Đơn hàng đã được tạo thành công. Bạn có thể xem thông tin đơn hàng bên dưới.
            </p>
          </div>

          <OrderDetails order={order} showStatus />

          <div className="flex flex-col gap-y-4">
            <h2 className="dm-heading">Sản phẩm</h2>
            <Items order={order} />
          </div>

          <div className="flex flex-col gap-y-4 bg-surface p-6 small:ml-auto small:w-1/2 small:p-8">
            <CartTotals totals={order} />
          </div>

          <div className="grid grid-cols-1 gap-8 small:grid-cols-2">
            <ShippingDetails order={order} />
            <PaymentDetails order={order} />
          </div>

          <Help />
        </div>
      </div>
    </div>
  )
}
