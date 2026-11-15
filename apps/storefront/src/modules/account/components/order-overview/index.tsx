"use client"

import OrderCard from "../order-card"
import LocalizedClientLink from "@modules/common/components/localized-client-link"
import { HttpTypes } from "@medusajs/types"

const OrderOverview = ({ orders }: { orders: HttpTypes.StoreOrder[] }) => {
  if (orders?.length) {
    return (
      <div className="flex w-full flex-col gap-y-6">
        {orders.map((o) => (
          <OrderCard key={o.id} order={o} />
        ))}
      </div>
    )
  }

  return (
    <div
      className="dm-panel flex w-full flex-col items-start gap-y-3 p-6"
      data-testid="no-orders-container"
    >
      <h2 className="dm-heading">Bạn chưa có đơn hàng</h2>
      <p className="dm-body max-w-dm-prose">
        Đơn hàng sẽ xuất hiện tại đây cùng tình trạng giao hàng và thanh toán.
      </p>
      <LocalizedClientLink
        href="/"
        className="dm-btn dm-btn-primary dm-btn-sm mt-2"
        data-testid="continue-shopping-button"
      >
        Tiếp tục mua sắm
      </LocalizedClientLink>
    </div>
  )
}

export default OrderOverview
